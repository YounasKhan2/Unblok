import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = path.join(process.cwd(), 'validation', 'ux-10');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_ux10_' + Date.now());
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
      deviceScaleFactor: 1,
      mobile: width < 768,
    });

    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, options.delay || 1200));

    if (options.evalBefore) {
      await send('Runtime.evaluate', { expression: options.evalBefore });
      await new Promise(r => setTimeout(r, 400));
    }

    const res = await send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`  ✓ Saved: ${filePath}`);
  }

  try {
    // 1. My Work - Execution Center (Light & Dark)
    await capture('01_my_work_light.png', 'http://localhost:3000/my-work?theme=light');
    await capture('02_my_work_dark.png', 'http://localhost:3000/my-work?theme=dark');

    // 2. Project Execution - Blocked Issue on List & Board (Light & Dark)
    await capture('03_project_issues_blocked_light.png', 'http://localhost:3000/projects/ENG/issues?theme=light');
    await capture('04_project_issues_blocked_dark.png', 'http://localhost:3000/projects/ENG/issues?theme=dark');
    await capture('05_project_board_dark.png', 'http://localhost:3000/projects/ENG/board?theme=dark');

    // 3. IssueDrawer - Active Dependencies & Blocker Triage (Light & Dark)
    await capture('06_drawer_dependencies_light.png', 'http://localhost:3000/projects/ENG/issues?drawer=ENG-2&theme=light');
    await capture('07_drawer_dependencies_dark.png', 'http://localhost:3000/projects/ENG/issues?drawer=ENG-2&theme=dark');

    // 4. Full Issue Detail - Deep Work Layout with Blocker Banner (Light & Dark)
    await capture('08_issue_detail_blocked_banner_light.png', 'http://localhost:3000/issues/ENG-2?theme=light');
    await capture('09_issue_detail_blocked_banner_dark.png', 'http://localhost:3000/issues/ENG-2?theme=dark');

    // 5. Dependency Intelligence - DAG Graph, Critical Path & Blocker Registry (Light & Dark)
    await capture('10_dependencies_graph_critical_path_light.png', 'http://localhost:3000/dependencies?theme=light');
    await capture('11_dependencies_graph_critical_path_dark.png', 'http://localhost:3000/dependencies?theme=dark');

    // 6. Planning - Cycles & Rollover, Strategic Roadmap (Light & Dark)
    await capture('12_planning_cycles_dark.png', 'http://localhost:3000/cycles?theme=dark');
    await capture('13_planning_roadmap_dark.png', 'http://localhost:3000/roadmap?theme=dark');

    // 7. Collaboration - Inbox Mentions & Blocker Notifications (Light & Dark)
    await capture('14_inbox_mentions_light.png', 'http://localhost:3000/inbox?filter=mentions&theme=light');
    await capture('15_inbox_mentions_dark.png', 'http://localhost:3000/inbox?filter=mentions&theme=dark');

    // 8. Insights - Execution Command Center & High-Risk Derived Intelligence (Light & Dark)
    await capture('16_insights_command_center_light.png', 'http://localhost:3000/insights?theme=light');
    await capture('17_insights_command_center_dark.png', 'http://localhost:3000/insights?theme=dark');

    // 9. Administration - Settings Members & Role RBAC (Light & Dark)
    await capture('18_settings_members_rbac_light.png', 'http://localhost:3000/settings/members?theme=light');
    await capture('19_settings_members_rbac_dark.png', 'http://localhost:3000/settings/members?theme=dark');
    await capture('20_settings_preferences_dark.png', 'http://localhost:3000/settings/preferences?theme=dark');

    // 10. Responsive Integrated States (1440, 1024, 768, 390)
    await capture('21_responsive_1440_command_center.png', 'http://localhost:3000/insights?theme=dark', { width: 1440, height: 900 });
    await capture('22_responsive_1024_project_board.png', 'http://localhost:3000/projects/ENG/board?theme=dark', { width: 1024, height: 768 });
    await capture('23_responsive_768_dependencies.png', 'http://localhost:3000/dependencies?theme=dark', { width: 768, height: 1024 });
    await capture('24_responsive_390_mobile_my_work.png', 'http://localhost:3000/my-work?theme=dark', { width: 390, height: 844 });
    await capture('25_responsive_390_mobile_drawer.png', 'http://localhost:3000/projects/ENG/issues?drawer=ENG-2&theme=dark', { width: 390, height: 844 });
    await capture('26_responsive_390_mobile_issue_detail.png', 'http://localhost:3000/issues/ENG-2?theme=dark', { width: 390, height: 844 });

    console.log('UX-10 Visual Evidence captured successfully into validation/ux-10/');
  } finally {
    ws.close();
    chromeProc.kill();
  }
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
