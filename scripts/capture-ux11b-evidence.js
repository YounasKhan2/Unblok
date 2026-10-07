import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = path.join(process.cwd(), 'validation', 'ux-11b');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_ux11b_' + Date.now());
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    '--no-first-run',
  ]);

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
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

  const newTargetRes = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
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
    await new Promise(r => setTimeout(r, options.delay || 1200));

    if (options.evalBefore) {
      await send('Runtime.evaluate', { expression: options.evalBefore });
      await new Promise(r => setTimeout(r, 300));
    }

    const captureParams = { format: 'png' };
    if (options.captureBeyondViewport) {
      captureParams.captureBeyondViewport = true;
    }

    const res = await send('Page.captureScreenshot', captureParams);
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`  ✓ Saved: ${filePath}`);
  }

  try {
    // Warmup navigation
    await send('Page.navigate', { url: 'http://localhost:3000/' });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Responsive Viewport Screenshots (Viewport level)
    await capture('01_home_1440_desktop.png', 'http://localhost:3000/', { width: 1440, height: 900 });
    await capture('02_home_1024_laptop.png', 'http://localhost:3000/', { width: 1024, height: 768 });
    await capture('03_home_768_tablet.png', 'http://localhost:3000/', { width: 768, height: 1024 });
    await capture('04_home_390_mobile.png', 'http://localhost:3000/', { width: 390, height: 844 });

    // 2. Mobile Menu Open Verification
    await capture('04b_home_390_mobile_menu_open.png', 'http://localhost:3000/', {
      width: 390,
      height: 844,
      evalBefore: "document.querySelector('button[aria-label=\"Open navigation menu\"]').click()",
    });

    // 3. Key Section High-Resolution Audits (1440px scrolled)
    await capture('05_home_1440_execution_section.png', 'http://localhost:3000/#execution', {
      width: 1440,
      height: 900,
      evalBefore: "document.getElementById('execution').scrollIntoView({behavior: 'instant'})",
    });

    await capture('06_home_1440_dependencies_section.png', 'http://localhost:3000/#dependencies', {
      width: 1440,
      height: 900,
      evalBefore: "document.getElementById('dependencies').scrollIntoView({behavior: 'instant'})",
    });

    await capture('07_home_1440_context_section.png', 'http://localhost:3000/#context', {
      width: 1440,
      height: 900,
      evalBefore: "document.getElementById('context').scrollIntoView({behavior: 'instant'})",
    });

    await capture('08_home_1440_planning_section.png', 'http://localhost:3000/#planning', {
      width: 1440,
      height: 900,
      evalBefore: "document.getElementById('planning').scrollIntoView({behavior: 'instant'})",
    });

    await capture('09_home_1440_insights_section.png', 'http://localhost:3000/#insights', {
      width: 1440,
      height: 900,
      evalBefore: "document.getElementById('insights').scrollIntoView({behavior: 'instant'})",
    });

    await capture('10_home_1440_final_cta_footer.png', 'http://localhost:3000/#final-cta', {
      width: 1440,
      height: 900,
      evalBefore: "document.getElementById('final-cta').scrollIntoView({behavior: 'instant'})",
    });

    // 4. Placeholder Route Rendering
    await capture('11_placeholder_product.png', 'http://localhost:3000/product', { width: 1440, height: 900 });

    // 5. Existing Private Route Regression Protection (My Work in AppShell)
    await capture('12_regression_appshell_my_work.png', 'http://localhost:3000/my-work', { width: 1440, height: 900 });

    // 6. Auth Boundary Placeholders (/login and /signup)
    await capture('13_auth_login.png', 'http://localhost:3000/login', { width: 1440, height: 900 });
    await capture('14_auth_signup.png', 'http://localhost:3000/signup', { width: 1440, height: 900 });

    // 7. Explicit 404 Boundaries (Public 404 and In-Shell Private 404)
    await capture('15_public_404.png', 'http://localhost:3000/something-that-does-not-exist', { width: 1440, height: 900 });
    await capture('16_private_404.png', 'http://localhost:3000/projects/ENG/nonexistent-view', { width: 1440, height: 900 });

    console.log('All UX-11B browser visual evidence captured successfully into validation/ux-11b/');
  } finally {
    ws.close();
    chromeProc.kill();
  }
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
