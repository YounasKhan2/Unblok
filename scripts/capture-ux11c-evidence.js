import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = path.join(process.cwd(), 'validation', 'ux-11c');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_ux11c_' + Date.now());
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    '--no-first-run',
  ]);

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9224/json/version');
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }

  if (!wsUrl) {
    console.error('Could not connect to Chrome');
    chromeProc.kill();
    process.exit(1);
  }

  const newTargetRes = await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' });
  const target = await newTargetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise(r => ws.onopen = r);

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  async function capture(filename, url, options = {}) {
    const width = options.width || 1440;
    const height = options.height || 900;
    console.log(`Capturing [${filename}] @ ${width}x${height} -> ${url}`);

    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1.5,
      mobile: width < 768,
    });

    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, options.delay || 1500));

    if (options.evalBefore) {
      await send('Runtime.evaluate', { expression: options.evalBefore });
      await new Promise(r => setTimeout(r, 400));
    }

    const captureParams = { format: 'png' };
    const res = await send('Page.captureScreenshot', captureParams);
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`  ✓ Saved: ${filePath}`);
  }

  try {
    const base = 'http://localhost:3000';

    // 1. Desktop 1440px captures
    await capture('01_product_1440_desktop.png', `${base}/product`, { width: 1440, height: 900 });
    await capture('02_features_1440_desktop.png', `${base}/features`, { width: 1440, height: 900 });
    await capture('03_solutions_1440_desktop.png', `${base}/solutions`, { width: 1440, height: 900 });
    await capture('04_pricing_1440_desktop.png', `${base}/pricing`, { width: 1440, height: 900 });
    await capture('05_security_1440_desktop.png', `${base}/security`, { width: 1440, height: 900 });
    await capture('06_contact_1440_desktop.png', `${base}/contact`, { width: 1440, height: 900 });
    await capture('07_privacy_1440_desktop.png', `${base}/privacy`, { width: 1440, height: 900 });
    await capture('08_terms_1440_desktop.png', `${base}/terms`, { width: 1440, height: 900 });

    // 2. Mobile 390px captures
    await capture('09_product_390_mobile.png', `${base}/product`, { width: 390, height: 844 });
    await capture('10_features_390_mobile.png', `${base}/features`, { width: 390, height: 844 });
    await capture('11_solutions_390_mobile.png', `${base}/solutions`, { width: 390, height: 844 });
    await capture('12_pricing_390_mobile.png', `${base}/pricing`, { width: 390, height: 844 });
    await capture('13_security_390_mobile.png', `${base}/security`, { width: 390, height: 844 });
    await capture('14_contact_390_mobile.png', `${base}/contact`, { width: 390, height: 844 });

    // 3. Tablet 768px captures
    await capture('15_product_768_tablet.png', `${base}/product`, { width: 768, height: 1024 });
    await capture('16_pricing_768_tablet.png', `${base}/pricing`, { width: 768, height: 1024 });

    // 4. Mobile navigation drawer open
    await capture('17_mobile_nav_open_390.png', `${base}/product`, {
      width: 390,
      height: 844,
      evalBefore: `document.querySelector('button[aria-label="Open navigation menu"]')?.click();`,
    });

    console.log('\nAll UX-11C evidence screenshots successfully saved to validation/ux-11c/');
  } finally {
    ws.close();
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error('Error in capture-ux11c-evidence:', err);
  process.exit(1);
});
