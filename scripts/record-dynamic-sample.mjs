import { mkdir, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FFMPEG = 'D:\\tools\\bin\\ffmpeg.exe';
const URL = 'http://127.0.0.1:3000/';
const OUT = 'D:/kimi-puffer-safesign-app/app/video-output/dynamic-sample';
const FRAMES = `${OUT}/frames`;
const PROFILE = `${OUT}/edge-profile-${Date.now()}`;
const PORT = 10100 + Math.floor(Math.random() * 400);
const FPS = 4;
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
      // wait for browser
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

async function injectRecorder(cdp) {
  await evalJs(cdp, `
    (() => {
      document.getElementById('dynamic-record-style')?.remove();
      document.getElementById('record-cursor')?.remove();
      const style = document.createElement('style');
      style.id = 'dynamic-record-style';
      style.textContent = \`
        html, body { background: #f5f8ff !important; }
        body.dynamic-record header,
        body.dynamic-record nav,
        body.dynamic-record footer,
        body.dynamic-record #demo > .max-w-6xl > .text-center,
        body.dynamic-record #demo > .max-w-6xl > .flex.flex-wrap.items-center.justify-center.gap-2.mb-8 {
          display: none !important;
        }
        body.dynamic-record.main-shot main > section:not(#demo),
        body.dynamic-record.phone-shot main > section:not(#demo),
        body.dynamic-record.bridge-shot main > section:not(#demo):not(#tokencore),
        body.dynamic-record.evidence-shot main > section:not(#tokencore) {
          display: none !important;
        }
        body.dynamic-record #demo {
          min-height: 100vh !important;
          padding: 28px 32px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        body.dynamic-record #demo > .max-w-6xl { width: 100% !important; }
        body.dynamic-record.main-shot #demo > .max-w-6xl {
          transform: scale(1.28);
          transform-origin: center center;
        }
        body.dynamic-record #demo .phone-frame {
          box-shadow: 0 28px 70px rgba(18,24,51,.16) !important;
        }
        body.dynamic-record.phone-shot #demo .flex-1.max-w-sm { display: none !important; }
        body.dynamic-record.phone-shot #demo .flex.flex-col.lg\\\\:flex-row {
          align-items: center !important;
          justify-content: center !important;
          gap: 0 !important;
        }
        body.dynamic-record.phone-shot #demo .phone-frame {
          width: 430px !important;
          height: 860px !important;
        }
        body.dynamic-record.bridge-shot #tokencore {
          display: block !important;
          padding-top: 80px !important;
          padding-bottom: 110px !important;
        }
        body.dynamic-record.evidence-shot #tokencore {
          padding-top: 58px !important;
          padding-bottom: 90px !important;
        }
        body.dynamic-record.evidence-shot #tokencore .grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) !important;
          max-width: 1120px !important;
          margin-left: auto !important;
          margin-right: auto !important;
          gap: 30px !important;
        }
        body.dynamic-record.evidence-shot #tokencore .evidence-card {
          opacity: 1 !important;
          transform: none !important;
          padding: 34px 42px !important;
          border-radius: 28px !important;
        }
        body.dynamic-record.hide-buddy #demo .phone-frame > .absolute.bottom-3.right-3,
        body.dynamic-record.hide-buddy #demo .phone-frame .absolute.bottom-3.right-3 {
          display: none !important;
        }
        #record-cursor {
          position: fixed;
          z-index: 999999;
          width: 28px;
          height: 28px;
          transform: translate(-50%, -50%);
          pointer-events: none;
          transition: left .45s ease, top .45s ease;
          display: none;
        }
        #record-cursor::before {
          content: "";
          position: absolute;
          inset: 8px;
          border-radius: 999px;
          background: rgba(47,107,255,.96);
          box-shadow: 0 0 0 12px rgba(47,107,255,.12), 0 8px 22px rgba(47,107,255,.25);
        }
        #record-cursor.click::after {
          content: "";
          position: absolute;
          inset: -18px;
          border: 3px solid rgba(47,107,255,.38);
          border-radius: 999px;
          background: rgba(47,107,255,.07);
          animation: pulseClick .55s ease-out both;
        }
        @keyframes pulseClick {
          from { transform: scale(.65); opacity: .95; }
          to { transform: scale(1.28); opacity: 0; }
        }
      \`;
      document.head.appendChild(style);
      document.body.classList.add('dynamic-record');
      const cursor = document.createElement('div');
      cursor.id = 'record-cursor';
      document.body.appendChild(cursor);
      window.__dynamicRecord = {
        step(index) {
          const panel = document.querySelector('#demo .max-w-sm');
          const buttons = [...panel.querySelectorAll('button')].slice(0, 7);
          buttons[index]?.click();
          setTimeout(() => this.scrollPhoneTo(0, 'instant'), 120);
        },
        phoneScroller() {
          const phone = document.querySelector('#demo .phone-frame');
          return [...phone.querySelectorAll('.overflow-y-auto')]
            .find((el) => el.scrollHeight > el.clientHeight + 12);
        },
        ease(t) {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        },
        animateScroll(getCurrent, setCurrent, to, duration = 1500) {
          const from = getCurrent();
          const diff = to - from;
          if (Math.abs(diff) < 1 || duration <= 0) {
            setCurrent(to);
            return Promise.resolve(true);
          }
          return new Promise((resolve) => {
            const start = performance.now();
            const tick = (now) => {
              const p = Math.min(1, (now - start) / duration);
              setCurrent(from + diff * this.ease(p));
              if (p < 1) requestAnimationFrame(tick);
              else resolve(true);
            };
            requestAnimationFrame(tick);
          });
        },
        async scrollPhoneTo(value, behavior = 'smooth', duration = 1500) {
          const scroller = this.phoneScroller();
          if (!scroller) return false;
          const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
          const top = value <= 1 ? max * value : value;
          if (behavior === 'instant') {
            scroller.scrollTop = top;
            return true;
          }
          return this.animateScroll(() => scroller.scrollTop, (next) => { scroller.scrollTop = next; }, top, duration);
        },
        mode(name) {
          document.body.classList.toggle('main-shot', name === 'main');
          document.body.classList.toggle('phone-shot', name === 'phone');
          document.body.classList.toggle('bridge-shot', name === 'bridge');
          document.body.classList.toggle('evidence-shot', name === 'evidence');
          if (name === 'main' || name === 'phone') window.scrollTo(0, 0);
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
          if (click) setTimeout(() => c.classList.remove('click'), 560);
        },
        noCursor() {
          document.getElementById('record-cursor').style.display = 'none';
        },
        visiblePhoneButtons() {
          return [...document.querySelectorAll('#demo .phone-frame button')]
            .filter((button) => {
              const box = button.getBoundingClientRect();
              return button.offsetParent !== null && box.width > 10 && box.height > 10;
            });
        },
        phoneButton(text) {
          const buttons = this.visiblePhoneButtons();
          return buttons.find((button) => (button.innerText || button.textContent || '').includes(text));
        },
        pointPhoneText(text, click = false) {
          const btn = this.phoneButton(text);
          if (!btn) return false;
          const box = btn.getBoundingClientRect();
          this.cursor(box.left + box.width / 2, box.top + box.height / 2, click);
          if (click) setTimeout(() => btn.click(), 180);
          return true;
        },
        async waitForTokenCoreResult() {
          const started = Date.now();
          while (Date.now() - started < 14000) {
            if (document.body.innerText.includes('REAL TCX-WASM RESULT')) return true;
            await new Promise((resolve) => setTimeout(resolve, 180));
          }
          return false;
        },
        async runTokenCore() {
          const buttons = [...document.querySelectorAll('#demo .phone-frame button')]
            .filter((button) => button.offsetParent !== null);
          const btn = buttons.find((button) => {
            const box = button.getBoundingClientRect();
            return box.width > 160 && box.height > 36 && box.top > 640;
          }) ?? buttons[buttons.length - 1];
          btn?.click();
          const started = Date.now();
          while (Date.now() - started < 14000) {
            if (document.body.innerText.includes('REAL TCX-WASM RESULT')) return true;
            await new Promise((resolve) => setTimeout(resolve, 180));
          }
          return false;
        },
        scrollEvidenceCard(index) {
          const cards = [...document.querySelectorAll('#tokencore .evidence-card')];
          cards[index]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        },
        async scrollToEvidence(duration = 3400) {
          const el = document.querySelector('#tokencore');
          const target = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 56);
          return this.animateScroll(() => window.scrollY, (next) => window.scrollTo(0, next), target, duration);
        },
        showEvidenceTop() {
          const el = document.querySelector('#tokencore');
          window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 32), behavior: 'instant' });
        },
      };
    })()
  `);
}

async function captureFrames(cdp, framesDir, captureState) {
  let index = 0;
  const frameTime = 1000 / FPS;
  while (!captureState.stop) {
    const started = Date.now();
    const { data } = await cdp.send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 92,
      fromSurface: true,
    });
    index += 1;
    captureState.count = index;
    await writeFile(`${framesDir}/frame-${String(index).padStart(5, '0')}.jpg`, Buffer.from(data, 'base64'));
    const elapsed = Date.now() - started;
    await sleep(Math.max(1, frameTime - elapsed));
  }
  return index;
}

async function run(cmd, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', windowsHide: true });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(FRAMES, { recursive: true });
  const { proc, cdp } = await launchBrowser();
  const captureState = { stop: false, count: 0 };
  const boundaries = {};
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
    await sleep(4200);
    await injectRecorder(cdp);

    const capturePromise = captureFrames(cdp, FRAMES, captureState);

    await evalJs(cdp, `window.__dynamicRecord.mode('main'); window.__dynamicRecord.step(0); window.__dynamicRecord.buddy(true); window.__dynamicRecord.scrollPhoneTo(0, 'instant'); window.__dynamicRecord.pointPhoneText('质押');`);
    await sleep(2200);
    await evalJs(cdp, `window.__dynamicRecord.buddy(false); window.__dynamicRecord.pointPhoneText('质押');`);
    await sleep(1600);
    await evalJs(cdp, `window.__dynamicRecord.pointPhoneText('质押', true);`);
    await sleep(2200);

    await evalJs(cdp, `window.__dynamicRecord.buddy(true);`);
    await sleep(2200);
    await evalJs(cdp, `window.__dynamicRecord.buddy(false); window.__dynamicRecord.scrollPhoneTo(0.72, 'smooth', 2200);`);
    await sleep(2600);
    await evalJs(cdp, `window.__dynamicRecord.pointPhoneText('Puffer SafeSign');`);
    await sleep(1000);
    await evalJs(cdp, `window.__dynamicRecord.pointPhoneText('Puffer SafeSign', true);`);
    await sleep(2200);

    await evalJs(cdp, `window.__dynamicRecord.buddy(true); window.__dynamicRecord.scrollPhoneTo(0, 'instant');`);
    await sleep(2200);
    await evalJs(cdp, `window.__dynamicRecord.buddy(false); window.__dynamicRecord.cursor(788, 618, false);`);
    await sleep(1800);
    await evalJs(cdp, `window.__dynamicRecord.scrollPhoneTo(0.58, 'smooth', 2200); window.__dynamicRecord.cursor(790, 742, false);`);
    await sleep(2600);
    await evalJs(cdp, `window.__dynamicRecord.pointPhoneText('先做签名前检查');`);
    await sleep(1000);
    await evalJs(cdp, `window.__dynamicRecord.pointPhoneText('先做签名前检查', true);`);
    await sleep(1800);

    await evalJs(cdp, `window.__dynamicRecord.buddy(true); window.__dynamicRecord.scrollPhoneTo(0, 'instant');`);
    await sleep(2200);
    await evalJs(cdp, `window.__dynamicRecord.buddy(false); window.__dynamicRecord.scrollPhoneTo(0.5, 'smooth', 2200);`);
    await sleep(2400);
    await evalJs(cdp, `window.__dynamicRecord.scrollPhoneTo(1, 'smooth', 2200);`);
    await sleep(2400);
    await evalJs(cdp, `window.__dynamicRecord.pointPhoneText('继续风险扫描');`);
    await sleep(900);
    await evalJs(cdp, `window.__dynamicRecord.pointPhoneText('继续风险扫描', true);`);
    await sleep(1800);

    await evalJs(cdp, `window.__dynamicRecord.buddy(true); window.__dynamicRecord.scrollPhoneTo(0, 'instant');`);
    await sleep(2200);
    await evalJs(cdp, `window.__dynamicRecord.buddy(false); window.__dynamicRecord.scrollPhoneTo(0.46, 'smooth', 2200);`);
    await sleep(2500);
    await evalJs(cdp, `window.__dynamicRecord.scrollPhoneTo(1, 'smooth', 2400);`);
    await sleep(2600);
    await evalJs(cdp, `window.__dynamicRecord.pointPhoneText('开始本地签名');`);
    await sleep(900);
    await evalJs(cdp, `window.__dynamicRecord.pointPhoneText('开始本地签名', true);`);
    await sleep(2000);

    await evalJs(cdp, `window.__dynamicRecord.buddy(false); window.__dynamicRecord.scrollPhoneTo(0, 'instant'); window.__dynamicRecord.pointPhoneText('开始本地签名');`);
    await sleep(1000);
    await evalJs(cdp, `window.__dynamicRecord.pointPhoneText('开始本地签名', true);`);
    await evalJs(cdp, `window.__dynamicRecord.waitForTokenCoreResult()`);
    await sleep(1800);
    await evalJs(cdp, `window.__dynamicRecord.scrollPhoneTo(0.38, 'smooth', 2400);`);
    await sleep(2800);
    await evalJs(cdp, `window.__dynamicRecord.scrollPhoneTo(0.72, 'smooth', 2400);`);
    await sleep(2800);
    await evalJs(cdp, `window.__dynamicRecord.scrollPhoneTo(1, 'smooth', 2400);`);
    await sleep(2200);
    await evalJs(cdp, `window.__dynamicRecord.pointPhoneText('进入最终确认');`);
    await sleep(900);
    await evalJs(cdp, `window.__dynamicRecord.pointPhoneText('进入最终确认', true);`);
    await sleep(1800);

    await evalJs(cdp, `window.__dynamicRecord.buddy(true); window.__dynamicRecord.scrollPhoneTo(0, 'instant');`);
    await sleep(2200);
    await evalJs(cdp, `window.__dynamicRecord.buddy(false); window.__dynamicRecord.pointPhoneText('确认完成 SafeSign 流程');`);
    await sleep(1000);
    await evalJs(cdp, `window.__dynamicRecord.pointPhoneText('确认完成 SafeSign 流程', true);`);
    await sleep(1800);
    await evalJs(cdp, `window.__dynamicRecord.scrollPhoneTo(0.55, 'smooth', 2200);`);
    await sleep(2200);
    await evalJs(cdp, `window.__dynamicRecord.scrollPhoneTo(1, 'smooth', 2200); window.__dynamicRecord.noCursor();`);
    await sleep(2200);
    boundaries.transitionStart = captureState.count / FPS;
    await evalJs(cdp, `window.__dynamicRecord.mode('bridge'); window.__dynamicRecord.buddy(false); window.__dynamicRecord.noCursor(); window.__dynamicRecord.scrollToEvidence(4200);`);
    await sleep(900);
    boundaries.demoEnd = captureState.count / FPS;

    await evalJs(cdp, `window.__dynamicRecord.mode('evidence'); window.__dynamicRecord.buddy(false); window.__dynamicRecord.noCursor(); window.__dynamicRecord.showEvidenceTop();`);
    await sleep(2200);
    await evalJs(cdp, `window.__dynamicRecord.noCursor();`);
    await sleep(1800);
    await evalJs(cdp, `window.__dynamicRecord.scrollEvidenceCard(1);`);
    await sleep(3000);
    await evalJs(cdp, `window.__dynamicRecord.scrollEvidenceCard(2);`);
    await sleep(3000);

    captureState.stop = true;
    await capturePromise;
  } finally {
    proc.kill();
  }

  const raw = `${OUT}/PufferSafeSign_dynamic_visual_raw.mp4`;
  await run(FFMPEG, [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-framerate',
    String(FPS),
    '-i',
    `${FRAMES}/frame-%05d.jpg`,
    '-vf',
    'format=yuv420p',
    '-c:v',
    'libx264',
    '-crf',
    '18',
    '-preset',
    'medium',
    '-movflags',
    '+faststart',
    raw,
  ]);

  const final = `${OUT}/PufferSafeSign_dynamic_visual_focused.mp4`;
  const demoEnd = Math.max(1, boundaries.demoEnd ?? 46);
  await run(FFMPEG, [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    raw,
    '-filter_complex',
    [
      `[0:v]trim=start=0:end=${demoEnd.toFixed(3)},setpts=PTS-STARTPTS,crop=2880:1620:480:240,scale=1920:1080,setsar=1[v0]`,
      `[0:v]trim=start=${demoEnd.toFixed(3)},setpts=PTS-STARTPTS,crop=2480:1394:680:280,scale=1920:1080,setsar=1[v1]`,
      '[v0][v1]concat=n=2:v=1:a=0,fps=30,format=yuv420p[v]',
    ].join(';'),
    '-map',
    '[v]',
    '-c:v',
    'libx264',
    '-crf',
    '17',
    '-preset',
    'medium',
    '-movflags',
    '+faststart',
    final,
  ]);

  console.log(JSON.stringify({ final, raw, frameCount: captureState.count, fps: FPS, boundaries }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
