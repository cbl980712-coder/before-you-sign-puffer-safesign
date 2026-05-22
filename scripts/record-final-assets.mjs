import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const URL = 'http://127.0.0.1:3000/';
const OUT = 'D:/kimi-puffer-safesign-app/app/video-output/screens';
const RUN_ID = `${Date.now()}-${Math.round(Math.random() * 10000)}`;
const PROFILE = `D:/kimi-puffer-safesign-app/app/video-output/final-edge-profile-${RUN_ID}`;
const PORT = 9800 + Math.floor(Math.random() * 300);
const DPR = 2;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
}

async function waitForJson(url, tries = 80) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return res.json();
    } catch {
      // keep waiting
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function launchBrowser() {
  const args = [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-networking',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--window-size=1920,1080',
    '--high-dpi-support=1',
    `--force-device-scale-factor=${DPR}`,
    URL,
  ];
  const proc = spawn(EDGE, args, { stdio: 'ignore', windowsHide: true });
  const tabs = await waitForJson(`http://127.0.0.1:${PORT}/json/list`);
  const tab = tabs.find((item) => item.type === 'page') ?? tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  return { proc, cdp: new CDP(ws) };
}

async function evalJs(cdp, expression, awaitPromise = true) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(JSON.stringify(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime evaluation failed'));
  }
  return result.result?.value;
}

async function captureClip(cdp, name, clip) {
  const safeClip = {
    x: Math.max(0, Math.floor(clip.x)),
    y: Math.max(0, Math.floor(clip.y)),
    width: Math.max(1, Math.floor(clip.width)),
    height: Math.max(1, Math.floor(clip.height)),
    scale: 1,
  };
  const { data } = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: true,
    clip: safeClip,
  });
  await writeFile(`${OUT}/${name}.png`, Buffer.from(data, 'base64'));
}

async function setupPage(cdp) {
  await evalJs(cdp, `
    (() => {
      document.getElementById('record-final-style')?.remove();
      document.getElementById('record-cursor')?.remove();
      const style = document.createElement('style');
      style.id = 'record-final-style';
      style.textContent = \`
        html, body { background: #f5f8ff !important; }
        body.record-final header,
        body.record-final nav,
        body.record-final footer,
        body.record-final #demo > .max-w-6xl > .text-center,
        body.record-final #demo > .max-w-6xl > .flex.flex-wrap.items-center.justify-center.gap-2.mb-8 {
          display: none !important;
        }
        body.record-final.record-demo main > section:not(#demo),
        body.record-final.record-evidence main > section:not(#tokencore) {
          display: none !important;
        }
        body.record-final #demo {
          min-height: auto !important;
          padding-top: 34px !important;
          padding-bottom: 32px !important;
        }
        body.record-final #demo .phone-frame {
          box-shadow: 0 28px 70px rgba(18,24,51,.16) !important;
        }
        body.record-final .evidence-card {
          opacity: 1 !important;
          transform: none !important;
        }
        body.record-final #tokencore .grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) !important;
          max-width: 1120px !important;
          margin-left: auto !important;
          margin-right: auto !important;
          gap: 28px !important;
        }
        body.record-final #tokencore .evidence-card {
          padding: 34px 42px !important;
          border-radius: 28px !important;
        }
        body.record-final.hide-buddy #demo .phone-frame > .absolute.bottom-3.right-3,
        body.record-final.hide-buddy #demo .phone-frame .absolute.bottom-3.right-3 {
          display: none !important;
        }
        #record-cursor {
          position: fixed;
          z-index: 999999;
          width: 34px;
          height: 34px;
          transform: translate(-50%, -50%);
          pointer-events: none;
          display: none;
        }
        #record-cursor::before {
          content: "";
          position: absolute;
          inset: 8px;
          border-radius: 999px;
          background: rgba(47,107,255,.92);
          box-shadow: 0 0 0 12px rgba(47,107,255,.12), 0 8px 24px rgba(47,107,255,.28);
        }
        #record-cursor.click::after {
          content: "";
          position: absolute;
          inset: -18px;
          border: 3px solid rgba(47,107,255,.38);
          border-radius: 999px;
          background: rgba(47,107,255,.08);
        }
        body.record-final.record-phone-stage main > section:not(#demo) {
          display: none !important;
        }
        body.record-final.record-phone-stage #demo {
          min-height: 100vh !important;
          padding-top: 22px !important;
          padding-bottom: 22px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        body.record-final.record-phone-stage #demo > .max-w-6xl {
          width: 100% !important;
          max-width: none !important;
        }
        body.record-final.record-phone-stage #demo .flex.flex-col.lg\\:flex-row {
          align-items: center !important;
          justify-content: center !important;
          gap: 0 !important;
        }
        body.record-final.record-phone-stage #demo .flex-1.max-w-sm {
          display: none !important;
        }
        body.record-final.record-phone-stage #demo .phone-frame {
          position: fixed !important;
          left: 50% !important;
          top: 50% !important;
          transform: translate(-50%, -50%) scale(1.16) !important;
          transform-origin: center center;
          box-shadow: 0 30px 82px rgba(18,24,51,.18) !important;
          z-index: 20 !important;
        }
      \`;
      document.head.appendChild(style);
      document.body.classList.add('record-final');
      const cursor = document.createElement('div');
      cursor.id = 'record-cursor';
      document.body.appendChild(cursor);
      window.__recordFinal = {
        step(index) {
          const panel = document.querySelector('#demo .max-w-sm');
          const buttons = [...panel.querySelectorAll('button')].slice(0, 7);
          buttons[index]?.click();
        },
        buddy(show) {
          document.body.classList.toggle('hide-buddy', !show);
        },
        cursor(x, y, click = false) {
          const c = document.getElementById('record-cursor');
          c.style.display = 'block';
          c.style.left = x + 'px';
          c.style.top = y + 'px';
          c.classList.toggle('click', click);
        },
        noCursor() {
          document.getElementById('record-cursor').style.display = 'none';
        },
        showDemo() {
          document.body.classList.add('record-demo');
          document.body.classList.remove('record-evidence', 'record-phone-stage');
          window.scrollTo(0, 0);
        },
        showEvidence(offset = -26) {
          document.body.classList.add('record-evidence');
          document.body.classList.remove('record-demo', 'record-phone-stage');
          const el = document.querySelector('#tokencore');
          window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.scrollY + offset));
        },
        showPhoneStage() {
          document.body.classList.add('record-phone-stage');
          document.body.classList.remove('record-demo', 'record-evidence');
          document.body.classList.add('hide-buddy');
          document.getElementById('record-cursor').style.display = 'none';
          window.scrollTo(0, 0);
        },
        async runTokenCore() {
          const buttons = [...document.querySelectorAll('#demo .phone-frame button')]
            .filter((button) => button.offsetParent !== null);
          const btn = buttons.find((button) => /开始本地签名|重试本地签名|Token Core/.test(button.innerText || button.textContent || ''))
            ?? buttons[buttons.length - 1];
          btn?.click();
          const started = Date.now();
          while (Date.now() - started < 14000) {
            if (document.body.innerText.includes('REAL TCX-WASM RESULT')) return true;
            await new Promise((resolve) => setTimeout(resolve, 250));
          }
          return false;
        },
        confirmSafeSign() {
          const buttons = [...document.querySelectorAll('#demo .phone-frame button')]
            .filter((button) => button.offsetParent !== null);
          const btn = buttons.find((button) => /确认完成|SafeSign/.test(button.innerText || button.textContent || ''))
            ?? buttons[buttons.length - 1];
          btn?.click();
        },
        rects() {
          const phone = document.querySelector('#demo .phone-frame')?.getBoundingClientRect();
          const panel = document.querySelector('#demo .max-w-sm')?.getBoundingClientRect();
          const evidence = document.querySelector('#tokencore')?.getBoundingClientRect();
          const cards = [...document.querySelectorAll('#tokencore .evidence-card')].map((el) => el.getBoundingClientRect());
          const pack = (r) => r && ({ x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom });
          return {
            phone: pack(phone),
            panel: pack(panel),
            evidence: pack(evidence),
            cards: cards.map(pack),
            viewport: { width: window.innerWidth, height: window.innerHeight },
            scroll: { x: window.scrollX, y: window.scrollY },
          };
        },
      };
    })()
  `);
}

function mainFlowClip(rects) {
  const left = rects.scroll.x + rects.phone.x - 72;
  const top = rects.scroll.y + Math.min(rects.phone.y, rects.panel.y) - 24;
  const right = rects.scroll.x + Math.min(rects.viewport.width - 28, rects.panel.right + 26);
  const bottom = rects.scroll.y + Math.min(rects.viewport.height - 24, Math.max(rects.phone.bottom, rects.panel.bottom) + 24);
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function phoneClip(rects) {
  const marginX = 20;
  const marginY = 24;
  return {
    x: rects.scroll.x + rects.phone.x - marginX,
    y: rects.scroll.y + rects.phone.y - marginY,
    width: rects.phone.width + marginX * 2,
    height: Math.min(rects.viewport.height - rects.phone.y + marginY - 18, rects.phone.height + marginY * 2),
  };
}

function evidenceClip(rects, cardIndex = 0) {
  const card = rects.cards[cardIndex] ?? rects.cards[0] ?? rects.evidence;
  const left = rects.scroll.x + Math.max(0, card.x - 56);
  const top = rects.scroll.y + Math.max(0, Math.min(card.y - 140, rects.evidence.y - 24));
  const right = rects.scroll.x + Math.min(rects.viewport.width, card.right + 56);
  const bottom = Math.min(rects.scroll.y + rects.viewport.height, top + 1000);
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function actionPoint(rects, stepIndex) {
  const x = rects.phone.x;
  const y = rects.phone.y;
  const points = {
    0: [x + 204, y + 250],
    1: [x + 210, y + 548],
    2: [x + 150, y + 548],
    3: [x + 150, y + 548],
    4: [x + 150, y + 548],
    5: [x + 150, y + 548],
    6: [x + 150, y + 548],
  };
  return points[stepIndex] ?? [x + 150, y + 548];
}

async function captureMainStep(cdp, name, index, options = {}) {
  await evalJs(cdp, `window.__recordFinal.showDemo(); window.__recordFinal.step(${index}); window.__recordFinal.buddy(true);`);
  await sleep(options.wait ?? 650);
  let rects = await evalJs(cdp, `window.__recordFinal.rects()`);
  const [cx, cy] = options.cursor ?? actionPoint(rects, index);
  await evalJs(cdp, `window.__recordFinal.cursor(${cx}, ${cy}, false);`);
  await captureClip(cdp, `${name}-bubble`, mainFlowClip(rects));

  await evalJs(cdp, `window.__recordFinal.buddy(false); window.__recordFinal.cursor(${cx}, ${cy}, false);`);
  await sleep(200);
  rects = await evalJs(cdp, `window.__recordFinal.rects()`);
  await captureClip(cdp, name, mainFlowClip(rects));

  await evalJs(cdp, `window.__recordFinal.cursor(${cx}, ${cy}, true);`);
  await sleep(120);
  rects = await evalJs(cdp, `window.__recordFinal.rects()`);
  await captureClip(cdp, `${name}-click`, mainFlowClip(rects));
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const { proc, cdp } = await launchBrowser();
  try {
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: DPR,
      mobile: false,
    });
    await cdp.send('Page.navigate', { url: URL });
    await sleep(4500);
    await setupPage(cdp);

    await captureMainStep(cdp, '01-wallet', 0);
    await evalJs(cdp, `window.__recordFinal.showDemo(); window.__recordFinal.step(0); window.__recordFinal.buddy(true); window.__recordFinal.noCursor();`);
    await sleep(300);
    let rects = await evalJs(cdp, `window.__recordFinal.rects()`);
    await captureClip(cdp, '00-hero', mainFlowClip(rects));

    await captureMainStep(cdp, '02-stake-entry', 1);
    await captureMainStep(cdp, '03-puffer-quote', 2);
    await captureMainStep(cdp, '04-confirmation', 3);
    await captureMainStep(cdp, '05-risk', 4);

    await evalJs(cdp, `window.__recordFinal.showDemo(); window.__recordFinal.step(5); window.__recordFinal.buddy(true);`);
    await sleep(650);
    rects = await evalJs(cdp, `window.__recordFinal.rects()`);
    let [cx, cy] = actionPoint(rects, 5);
    await evalJs(cdp, `window.__recordFinal.cursor(${cx}, ${cy}, false);`);
    await captureClip(cdp, '06-token-core-bubble', phoneClip(rects));

    await evalJs(cdp, `window.__recordFinal.buddy(false); window.__recordFinal.cursor(${cx}, ${cy}, true);`);
    await sleep(160);
    rects = await evalJs(cdp, `window.__recordFinal.rects()`);
    await captureClip(cdp, '06-token-core-start', phoneClip(rects));
    await evalJs(cdp, `window.__recordFinal.runTokenCore()`);
    await sleep(800);
    await evalJs(cdp, `window.__recordFinal.noCursor();`);
    rects = await evalJs(cdp, `window.__recordFinal.rects()`);
    await captureClip(cdp, '06-token-core-result', phoneClip(rects));
    await evalJs(cdp, `window.__recordFinal.showPhoneStage(); window.__recordFinal.step(5); window.__recordFinal.buddy(false);`);
    await sleep(350);
    await captureClip(cdp, '06-token-core-result-stage', { x: 0, y: 0, width: 1920, height: 1080 });

    await evalJs(cdp, `window.__recordFinal.showDemo(); window.__recordFinal.step(6); window.__recordFinal.buddy(true);`);
    await sleep(650);
    rects = await evalJs(cdp, `window.__recordFinal.rects()`);
    [cx, cy] = actionPoint(rects, 6);
    await evalJs(cdp, `window.__recordFinal.cursor(${cx}, ${cy}, false);`);
    await captureClip(cdp, '07-complete-bubble', mainFlowClip(rects));
    await evalJs(cdp, `window.__recordFinal.buddy(false); window.__recordFinal.cursor(${cx}, ${cy}, true); window.__recordFinal.confirmSafeSign();`);
    await sleep(550);
    rects = await evalJs(cdp, `window.__recordFinal.rects()`);
    await captureClip(cdp, '07-complete', mainFlowClip(rects));

    await evalJs(cdp, `window.__recordFinal.showEvidence(-26); window.__recordFinal.noCursor();`);
    await sleep(700);
    rects = await evalJs(cdp, `window.__recordFinal.rects()`);
    await captureClip(cdp, '08-runtime-puffer-api', evidenceClip(rects, 0));

    await evalJs(cdp, `
      (() => {
        const cards = [...document.querySelectorAll('#tokencore .evidence-card')];
        if (cards[1]) cards[1].scrollIntoView({ block: 'center' });
      })();
      true;
    `);
    await sleep(650);
    rects = await evalJs(cdp, `window.__recordFinal.rects()`);
    await captureClip(cdp, '08-runtime-token-core', evidenceClip(rects, 1));

    await evalJs(cdp, `
      (() => {
        const cards = [...document.querySelectorAll('#tokencore .evidence-card')];
        if (cards[2]) cards[2].scrollIntoView({ block: 'center' });
      })();
      true;
    `);
    await sleep(650);
    rects = await evalJs(cdp, `window.__recordFinal.rects()`);
    await captureClip(cdp, '08-runtime-broadcast-gate', evidenceClip(rects, 2));

    await evalJs(cdp, `window.__recordFinal.showDemo(); window.__recordFinal.buddy(false); window.__recordFinal.noCursor();`);
    await sleep(300);
    rects = await evalJs(cdp, `window.__recordFinal.rects()`);
    await captureClip(cdp, '09-ending', mainFlowClip(rects));
  } finally {
    proc.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
