import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const URL = 'http://127.0.0.1:3000/';
const OUT = 'D:/kimi-puffer-safesign-app/app/video-output/framing-tests';
const RUN_ID = `${Date.now()}-${Math.round(Math.random() * 10000)}`;
const PROFILE = `D:/kimi-puffer-safesign-app/app/video-output/framing-edge-profile-${RUN_ID}`;
const PORT = 9400 + Math.floor(Math.random() * 400);

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
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    '--hide-scrollbars',
    '--window-size=1920,1080',
    '--force-device-scale-factor=1',
    URL,
  ];
  console.log(`Launching Edge on ${PORT}`);
  const proc = spawn(EDGE, args, { stdio: 'ignore', windowsHide: true });
  const tabs = await waitForJson(`http://127.0.0.1:${PORT}/json/list`);
  console.log(`Connected to Edge, tabs: ${tabs.length}`);
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
      const previous = document.getElementById('framing-test-style');
      previous?.remove();
      const style = document.createElement('style');
      style.id = 'framing-test-style';
      style.textContent = \`
        html, body { background: #f5f8ff !important; }
        body.framing-test header,
        body.framing-test nav,
        body.framing-test footer,
        body.framing-test #demo > .max-w-6xl > .text-center,
        body.framing-test #demo > .max-w-6xl > .flex.flex-wrap.items-center.justify-center.gap-2.mb-8 {
          display: none !important;
        }
        body.framing-test.framing-demo main > section:not(#demo),
        body.framing-test.framing-evidence main > section:not(#tokencore) {
          display: none !important;
        }
        body.framing-test #demo {
          min-height: auto !important;
          padding-top: 34px !important;
          padding-bottom: 32px !important;
        }
        body.framing-test #demo .phone-frame {
          box-shadow: 0 28px 70px rgba(18,24,51,.16) !important;
        }
        body.framing-test .evidence-card {
          opacity: 1 !important;
          transform: none !important;
        }
        body.framing-test #tokencore .grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) !important;
          max-width: 1120px !important;
          margin-left: auto !important;
          margin-right: auto !important;
          gap: 28px !important;
        }
        body.framing-test #tokencore .evidence-card {
          padding: 34px 42px !important;
          border-radius: 28px !important;
        }
        body.framing-test.framing-hide-buddy #demo .phone-frame > .absolute.bottom-3.right-3,
        body.framing-test.framing-hide-buddy #demo .phone-frame .absolute.bottom-3.right-3 {
          display: none !important;
        }
      \`;
      document.head.appendChild(style);
      document.body.classList.add('framing-test');
      window.__framing = {
        step(index) {
          const panel = document.querySelector('#demo .max-w-sm');
          const buttons = [...panel.querySelectorAll('button')].slice(0, 7);
          buttons[index]?.click();
        },
        buddy(show) {
          document.body.classList.toggle('framing-hide-buddy', !show);
        },
        scrollDemo() {
          document.body.classList.add('framing-demo');
          document.body.classList.remove('framing-evidence');
          window.scrollTo(0, 0);
        },
        scrollEvidence(offset = -26) {
          document.body.classList.add('framing-evidence');
          document.body.classList.remove('framing-demo');
          const el = document.querySelector('#tokencore');
          window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.scrollY + offset));
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
          const demo = document.querySelector('#demo')?.getBoundingClientRect();
          const evidence = document.querySelector('#tokencore')?.getBoundingClientRect();
          const cards = [...document.querySelectorAll('#tokencore .evidence-card')].map((el) => el.getBoundingClientRect());
          return {
            phone: phone && { x: phone.x, y: phone.y, width: phone.width, height: phone.height, right: phone.right, bottom: phone.bottom },
            panel: panel && { x: panel.x, y: panel.y, width: panel.width, height: panel.height, right: panel.right, bottom: panel.bottom },
            demo: demo && { x: demo.x, y: demo.y, width: demo.width, height: demo.height, right: demo.right, bottom: demo.bottom },
            evidence: evidence && { x: evidence.x, y: evidence.y, width: evidence.width, height: evidence.height, right: evidence.right, bottom: evidence.bottom },
            cards: cards.map((r) => ({ x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom })),
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
  const clip = { x: left, y: top, width: right - left, height: bottom - top };
  return clip;
}

function phoneClip(rects) {
  const marginX = 44;
  const marginY = 24;
  const clip = {
    x: rects.scroll.x + rects.phone.x - marginX,
    y: rects.scroll.y + rects.phone.y - marginY,
    width: rects.phone.width + marginX * 2,
    height: Math.min(rects.viewport.height - rects.phone.y + marginY - 18, rects.phone.height + marginY * 2),
  };
  return clip;
}

function evidenceClip(rects, cardIndex = 0) {
  const card = rects.cards[cardIndex] ?? rects.cards[0] ?? rects.evidence;
  const left = rects.scroll.x + Math.max(0, card.x - 56);
  const top = rects.scroll.y + Math.max(0, Math.min(card.y - 140, rects.evidence.y - 24));
  const right = rects.scroll.x + Math.min(rects.viewport.width, card.right + 56);
  const bottom = Math.min(rects.scroll.y + rects.viewport.height, top + 1000);
  const clip = { x: left, y: top, width: right - left, height: bottom - top };
  return clip;
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
      deviceScaleFactor: 1,
      mobile: false,
    });
    await cdp.send('Page.navigate', { url: URL });
    await sleep(4500);
    await setupPage(cdp);

    await evalJs(cdp, `window.__framing.scrollDemo(); window.__framing.step(0); window.__framing.buddy(true);`);
    await sleep(900);
    let rects = await evalJs(cdp, `window.__framing.rects()`);
    await captureClip(cdp, '01-main-flow-two-column', mainFlowClip(rects));

    await evalJs(cdp, `window.__framing.scrollDemo(); window.__framing.step(5); window.__framing.buddy(false);`);
    await sleep(700);
    await evalJs(cdp, `window.__framing.runTokenCore()`);
    await sleep(900);
    rects = await evalJs(cdp, `window.__framing.rects()`);
    await captureClip(cdp, '02-step6-phone-closeup', phoneClip(rects));

    await evalJs(cdp, `window.__framing.scrollEvidence(-26);`);
    await sleep(900);
    rects = await evalJs(cdp, `window.__framing.rects()`);
    await captureClip(cdp, '03-runtime-puffer-api', evidenceClip(rects, 0));

    await evalJs(cdp, `
      (() => {
        const cards = [...document.querySelectorAll('#tokencore .evidence-card')];
        if (cards[1]) cards[1].scrollIntoView({ block: 'center' });
      })();
      true;
    `);
    await sleep(700);
    rects = await evalJs(cdp, `window.__framing.rects()`);
    await captureClip(cdp, '04-runtime-token-core', evidenceClip(rects, 1));

    await evalJs(cdp, `
      (() => {
        const cards = [...document.querySelectorAll('#tokencore .evidence-card')];
        if (cards[2]) cards[2].scrollIntoView({ block: 'center' });
      })();
      true;
    `);
    await sleep(700);
    rects = await evalJs(cdp, `window.__framing.rects()`);
    await captureClip(cdp, '05-runtime-broadcast-gate', evidenceClip(rects, 2));
  } finally {
    proc.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
