import type { TokenCoreState } from '@/types';
import wasmUrl from '@consenlabs/tcx-wasm/tcx_wasm_bg.wasm?url';

const demoPassword = 'puffer-safesign-local-test-password';
const derivationPath = "m/44'/60'/0'/0/0";
const chainId = 11155111 as const;
const demoTarget = '0x3535353535353535353535353535353535353535';

type TcxModule = {
  default: (moduleOrPath?: unknown) => Promise<void> | void;
  clear_cached_keystore: () => void;
  create_keystore: (input: string) => string;
  derive_accounts: (input: string) => string;
  sign_message: (input: string) => string;
  sign_tx: (input: string) => string;
};

type DerivedAccount = {
  address: string;
  chain: string;
  derivationPath: string;
  publicKey?: string;
};

function preview(value: string | null) {
  if (!value) return null;
  return value.length <= 30 ? value : `${value.slice(0, 14)}...${value.slice(-10)}`;
}

function toWei(amountEth: string) {
  const [whole = '0', fraction = ''] = amountEth.split('.');
  const fractionPadded = `${fraction}000000000000000000`.slice(0, 18);
  return (BigInt(whole || '0') * 10n ** 18n + BigInt(fractionPadded || '0')).toString();
}

function baseState(logs: string[] = []): TokenCoreState {
  return {
    status: 'idle',
    wasmLoaded: false,
    keystoreCreated: false,
    network: 'Sepolia / TESTNET',
    chainId,
    derivedAddress: null,
    txSigned: false,
    txSignature: null,
    txHash: null,
    messageSigned: false,
    messageSignature: null,
    seedPhraseRequested: false,
    privateKeyExported: false,
    logs,
  };
}

function buildMessage(amountEth: string, estimatedPufEth?: string | null) {
  const receiveLine = estimatedPufEth
    ? `Stake ${amountEth} ETH into Puffer and receive about ${estimatedPufEth} pufETH.`
    : `Stake ${amountEth} ETH into Puffer and receive estimated pufETH.`;

  return [
    'Puffer SafeSign confirms this test intent:',
    receiveLine,
    'This demo signs locally with Token Core and does not broadcast automatically.',
    'Final on-chain control stays with the user.',
  ].join('\n');
}

export async function runTokenCoreProof(
  amountEth: string,
  estimatedPufEth?: string | null,
): Promise<TokenCoreState> {
  const logs: string[] = [];
  let tcx: TcxModule | null = null;

  try {
    logs.push('Loading @consenlabs/tcx-wasm');
    tcx = (await import('@consenlabs/tcx-wasm')) as unknown as TcxModule;
    await tcx.default(wasmUrl);
    logs.push('WASM loaded: true');

    const keystoreJson = tcx.create_keystore(
      JSON.stringify({
        password: demoPassword,
        network: 'TESTNET',
      }),
    );
    logs.push('create_keystore completed');

    const accounts = JSON.parse(
      tcx.derive_accounts(
        JSON.stringify({
          keystoreJson,
          key: demoPassword,
          derivations: [
            {
              chain: 'ETHEREUM',
              chainId: String(chainId),
              derivationPath,
              network: 'TESTNET',
            },
          ],
        }),
      ),
    ) as DerivedAccount[];

    const account = accounts[0];
    if (!account?.address) {
      throw new Error('Token Core did not return a Sepolia test address.');
    }
    logs.push(`derive_accounts completed: ${account.address}`);

    const txInput = {
      nonce: '0',
      gasLimit: '120000',
      to: demoTarget,
      value: toWei(amountEth),
      chainId: String(chainId),
      txType: '02',
      maxFeePerGas: '3000000000',
      maxPriorityFeePerGas: '1000000000',
      accessList: [],
      data: '0x2d2da806',
    };

    const txResult = JSON.parse(
      tcx.sign_tx(
        JSON.stringify({
          keystoreJson,
          key: demoPassword,
          derivationPath: account.derivationPath || derivationPath,
          input: txInput,
        }),
      ),
    ) as { signature: string; txHash?: string };
    logs.push(`sign_tx completed: ${preview(txResult.signature)}`);

    const message = buildMessage(amountEth, estimatedPufEth);
    const messageResult = JSON.parse(
      tcx.sign_message(
        JSON.stringify({
          keystoreJson,
          key: demoPassword,
          chain: 'ETHEREUM',
          derivationPath: account.derivationPath || derivationPath,
          input: {
            message,
            signatureType: 'PersonalSign',
          },
        }),
      ),
    ) as { signature: string };
    logs.push(`sign_message completed: ${preview(messageResult.signature)}`);

    tcx.clear_cached_keystore();
    logs.push('clear_cached_keystore completed');

    return {
      status: 'success',
      wasmLoaded: true,
      keystoreCreated: true,
      network: 'Sepolia / TESTNET',
      chainId,
      derivedAddress: account.address,
      txSigned: true,
      txSignature: txResult.signature,
      txHash: txResult.txHash ?? txResult.signature,
      messageSigned: true,
      messageSignature: messageResult.signature,
      seedPhraseRequested: false,
      privateKeyExported: false,
      logs,
    };
  } catch (error) {
    try {
      tcx?.clear_cached_keystore();
    } catch {
      // Best-effort cleanup only.
    }

    const message = error instanceof Error ? error.message : String(error);
    logs.push(`Token Core failed: ${message}`);
    return {
      ...baseState(logs),
      status: 'error',
      error: message,
    };
  }
}
