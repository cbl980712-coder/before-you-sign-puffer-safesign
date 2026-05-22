import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const URL = 'http://127.0.0.1:3000/';
const OUT = 'D:/kimi-puffer-safesign-app/app/video-output/screens';
const PROFILE = 'D:/kimi-puffer-safesign-app/app/video-output/edge-profile';
const PORT = 9331;

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

async function waitForJson(url, tries = 60) {
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
    '--hide-scrollbars',
    '--window-size=1920,1080',
    '--force-device-scale-factor=1',
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
  return cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
  });
}

async function capture(cdp, name) {
  await sleep(250);
  const { data } = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await writeFile(`${OUT}/${name}.png`, Buffer.from(data, 'base64'));
}

async function setup(cdp) {
  await evalJs(cdp, `
    (() => {
      const style = document.createElement('style');
      style.id = 'record-style';
      style.textContent = \`
        html, body { background: #f5f9ff !important; }
        body.recording #demo { min-height: 100vh; padding-top: 42px !important; padding-bottom: 24px !important; }
        body.recording #demo > .max-w-6xl > .text-center,
        body.recording #demo > .max-w-6xl > .flex.flex-wrap.items-center.justify-center.gap-2.mb-8 {
          display: none !important;
        }
        body.recording .evidence-card { opacity: 1 !important; transform: none !important; }
        body.recording .phone-frame { box-shadow: 0 24px 60px rgba(18,24,51,.14) !important; }
        body.hide-buddy .phone-frame > .absolute.bottom-3.right-3 > div { display: none !important; }
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
          background: rgba(47,107,255,.85);
          box-shadow: 0 0 0 12px rgba(47,107,255,.12), 0 8px 24px rgba(47,107,255,.28);
        }
        #record-cursor.click::after {
          content: "";
          position: absolute;
          inset: -16px;
          border: 2px solid rgba(47,107,255,.38);
          border-radius: 999px;
          background: rgba(47,107,255,.08);
        }
      \`;
      document.head.appendChild(style);
      document.body.classList.add('recording');
      const cursor = document.createElement('div');
      cursor.id = 'record-cursor';
      document.body.appendChild(cursor);
      window.__record = {
        setBuddy(hidden) {
          document.body.classList.toggle('hide-buddy', hidden);
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
        step(index) {
          const panel = document.querySelector('#demo .max-w-sm');
          const buttons = [...panel.querySelectorAll('button')].slice(0, 7);
          buttons[index]?.click();
        },
        demo() {
          const el = document.querySelector('#demo');
          if (el) window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.scrollY - 24));
        },
        evidence() {
          const el = document.querySelector('#tokencore');
          if (el) window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.scrollY - 28));
        },
        async sign() {
          const btn = [...document.querySelectorAll('#demo .phone-frame button')]
            .find((b) => /开始本地签名|重试本地签名/.test(b.textContent || ''));
          btn?.click();
          const started = Date.now();
          while (Date.now() - started < 12000) {
            if (document.body.textContent.includes('REAL TCX-WASM RESULT') || document.body.textContent.includes('Local proof')) return true;
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
          return false;
        },
        complete() {
          const btn = [...document.querySelectorAll('#demo .phone-frame button')]
            .find((b) => /确认完成 SafeSign 流程/.test(b.textContent || ''));
          btn?.click();
        }
      };
    })()
  `);
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
    await setup(cdp);

    await evalJs(cdp, `window.scrollTo(0, 0); window.__record.noCursor(); document.body.classList.remove('hide-buddy');`);
    await capture(cdp, '00-hero');

    const steps = [
      { name: '01-wallet', index: 0, cursor: [520, 620], click: [520, 620] },
      { name: '02-stake-entry', index: 1, cursor: [610, 835], click: [610, 835] },
      { name: '03-puffer-quote', index: 2, cursor: [930, 440], click: [600, 850] },
      { name: '04-confirmation', index: 3, cursor: [540, 500], click: [610, 850] },
      { name: '05-risk', index: 4, cursor: [500, 520], click: [600, 850] },
    ];

    for (const step of steps) {
      await evalJs(cdp, `window.__record.demo(); window.__record.step(${step.index}); window.__record.setBuddy(false); window.__record.cursor(${step.cursor[0]}, ${step.cursor[1]}, false);`);
      await sleep(800);
      await capture(cdp, `${step.name}-bubble`);
      await evalJs(cdp, `window.__record.setBuddy(true); window.__record.cursor(${step.cursor[0]}, ${step.cursor[1]}, false);`);
      await sleep(250);
      await capture(cdp, `${step.name}`);
      await evalJs(cdp, `window.__record.cursor(${step.click[0]}, ${step.click[1]}, true);`);
      await capture(cdp, `${step.name}-click`);
    }

    await evalJs(cdp, `window.__record.demo(); window.__record.step(5); window.__record.setBuddy(false); window.__record.cursor(600, 850, true);`);
    await sleep(700);
    await capture(cdp, '06-token-core-bubble');
    await evalJs(cdp, `window.__record.setBuddy(true); window.__record.cursor(600, 850, true);`);
    await capture(cdp, '06-token-core-start');
    await evalJs(cdp, `window.__record.sign()`);
    await sleep(800);
    await evalJs(cdp, `window.__record.cursor(680, 710, false);`);
    await capture(cdp, '06-token-core-result');

    await evalJs(cdp, `window.__record.demo(); window.__record.step(6); window.__record.setBuddy(false); window.__record.cursor(640, 840, true);`);
    await sleep(500);
    await capture(cdp, '07-complete-bubble');
    await evalJs(cdp, `window.__record.setBuddy(true); window.__record.complete(); window.__record.cursor(640, 840, true);`);
    await sleep(500);
    await capture(cdp, '07-complete');

    await evalJs(cdp, `window.__record.evidence(); window.__record.setBuddy(true); window.__record.cursor(960, 545, false);`);
    await sleep(1000);
    await capture(cdp, '08-runtime-evidence');

    await evalJs(cdp, `window.scrollTo(0, 0); window.__record.noCursor();`);
    await sleep(500);
    await capture(cdp, '09-ending');
  } finally {
    proc.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
