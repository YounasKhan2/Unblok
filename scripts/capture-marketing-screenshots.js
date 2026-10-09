import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = path.join(process.cwd(), 'apps', 'web', 'public', 'marketing');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_marketing_' + Date.now());
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
      deviceScaleFactor: 2, // 2x for retina crispness
      mobile: width < 768,
    });

    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, options.delay || 1500));

    if (options.evalBefore) {
      await send('Runtime.evaluate', { expression: options.evalBefore });
      await new Promise(r => setTimeout(r, 400));
    }

    const res = await send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`  ✓ Saved: ${filePath} (${Math.round(res.data.length * 0.75 / 1024)} KB)`);
  }

  try {
    // 1. Hero: My Work Cockpit
    await capture('01-hero-my-work.png', 'http://localhost:3000/my-work?theme=light', { width: 1440, height: 900 });

    // 2. Execution: My Work Personal Blocker triage
    await capture('02-execution-blockers.png', 'http://localhost:3000/my-work?theme=light', { width: 1200, height: 750 });

    // 3. Dependencies: Directed Acyclic Graph Canvas
    await capture('03-dependencies-chain.png', 'http://localhost:3000/dependencies?theme=light', { width: 1440, height: 900 });

    // 4. Issue Context: Project Issues + IssueDrawer open
    await capture('04-issue-drawer-context.png', 'http://localhost:3000/projects/ENG/issues?drawer=ENG-2&theme=light', { width: 1440, height: 900 });

    // 5. Planning: Cycles & Milestones
    await capture('05-planning-cycles.png', 'http://localhost:3000/cycles?theme=light', { width: 1440, height: 900 });

    // 6. Insights: Execution Intelligence Command Center
    await capture('06-insights-command-center.png', 'http://localhost:3000/insights?theme=light', { width: 1440, height: 900 });

    // 7. Mobile Crops (390px)
    await capture('01-hero-my-work-mobile.png', 'http://localhost:3000/my-work?theme=light', { width: 390, height: 780 });
    await capture('04-issue-drawer-mobile.png', 'http://localhost:3000/projects/ENG/issues?drawer=ENG-2&theme=light', { width: 390, height: 780 });

    console.log('All real marketing screenshot assets successfully captured into public/marketing/');
  } finally {
    ws.close();
    chromeProc.kill();
  }
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
