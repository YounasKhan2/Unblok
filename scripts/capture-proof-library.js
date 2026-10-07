import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = path.join(process.cwd(), 'public', 'marketing');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_proof_' + Date.now());
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    '--no-first-run',
  ]);

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9225/json/version');
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!wsUrl) {
    console.error('Could not connect to Chrome');
    chromeProc.kill();
    process.exit(1);
  }

  const newTargetRes = await fetch('http://127.0.0.1:9225/json/new?about:blank', { method: 'PUT' });
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

  await new Promise((r) => (ws.onopen = r));

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
      deviceScaleFactor: 2,
      mobile: width < 768,
    });

    await send('Page.navigate', { url });
    await new Promise((r) => setTimeout(r, options.delay || 1400));

    if (options.evalBefore) {
      await send('Runtime.evaluate', { expression: options.evalBefore });
      await new Promise((r) => setTimeout(r, 400));
    }

    let clip = undefined;
    if (options.selector) {
      const rectRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const el = document.querySelector('${options.selector}');
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height };
          })()
        `,
        returnByValue: true,
      });
      if (rectRes.result && rectRes.result.value) {
        const val = rectRes.result.value;
        clip = {
          x: Math.max(0, val.x),
          y: Math.max(0, val.y),
          width: Math.min(width, val.width),
          height: Math.min(height, val.height),
          scale: 1,
        };
      }
    }

    const captureParams = { format: 'png' };
    if (clip) {
      captureParams.clip = clip;
    }

    const res = await send('Page.captureScreenshot', captureParams);
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`  ✓ Saved: ${filePath}`);
  }

  try {
    const base = 'http://localhost:3000';

    // 1. Standalone Issue Drawer Crop (real 440px panel)
    await capture('proof-issue-drawer.png', `${base}/projects/ENG/issues?drawer=ENG-2&theme=light`, {
      width: 1440,
      height: 900,
      selector: 'aside[aria-label="Issue Detail Drawer"]',
    });

    // 2. High-Density Issue List Table View
    await capture('proof-issue-list.png', `${base}/projects/ENG/issues?theme=light`, {
      width: 1200,
      height: 700,
    });

    // 3. Multi-Select & Floating Bulk Action Bar Interaction
    await capture('proof-bulk-actions.png', `${base}/projects/ENG/issues?theme=light`, {
      width: 1200,
      height: 700,
      evalBefore: `
        (() => {
          const boxes = document.querySelectorAll('input[type="checkbox"]');
          if (boxes.length > 2) {
            boxes[1].click();
            boxes[2].click();
          }
        })()
      `,
    });

    // 4. Kanban Board Stage Columns
    await capture('proof-board.png', `${base}/projects/ENG/board?theme=light`, {
      width: 1280,
      height: 750,
    });

    // 5. Active Cycle View & Burnup
    await capture('proof-cycle.png', `${base}/cycles?theme=light`, {
      width: 1200,
      height: 700,
    });

    // 6. Strategic Roadmap Timeline
    await capture('proof-roadmap.png', `${base}/roadmap?theme=light`, {
      width: 1280,
      height: 750,
    });

    // 7. Inbox Triage & Notification Stream
    await capture('proof-inbox.png', `${base}/inbox?theme=light`, {
      width: 1200,
      height: 700,
    });

    // 8. Needs Attention Queue & Delivery Health in Insights
    await capture('proof-insights.png', `${base}/insights?theme=light`, {
      width: 1280,
      height: 750,
    });

    // 9. Dependency Graph Canvas
    await capture('proof-dependencies.png', `${base}/dependencies?theme=light`, {
      width: 1280,
      height: 750,
    });

    console.log('\nAll product proof library assets successfully captured into public/marketing/');
  } finally {
    ws.close();
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error('Error capturing proof library:', err);
  process.exit(1);
});
