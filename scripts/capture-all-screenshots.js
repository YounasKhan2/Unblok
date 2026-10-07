import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const screenshotsDir = path.join(process.cwd(), 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function run() {
  const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_qa_all_' + Date.now());
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

  // Open initial blank page
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
    const filePath = path.join(screenshotsDir, filename);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`  ✓ Saved: ${filename}`);
  }

  try {
    // 1. My Work
    await capture('01_my_work_light.png', 'http://localhost:3000/my-work?theme=light');
    await capture('02_my_work_dark.png', 'http://localhost:3000/my-work?theme=dark');

    // 2. Inbox
    await capture('03_inbox_light.png', 'http://localhost:3000/inbox?theme=light');
    await capture('04_inbox_dark.png', 'http://localhost:3000/inbox?theme=dark');

    // 3. Projects Directory
    await capture('05_projects_light.png', 'http://localhost:3000/projects?theme=light');
    await capture('06_projects_dark.png', 'http://localhost:3000/projects?theme=dark');

    // 4. Project Issues
    await capture('07_project_issues_light.png', 'http://localhost:3000/projects/ENG/issues?theme=light');
    await capture('08_project_issues_dark.png', 'http://localhost:3000/projects/ENG/issues?theme=dark');

    // 5. Project Issues + IssueDrawer
    await capture('09_project_issues_drawer_light.png', 'http://localhost:3000/projects/ENG/issues?drawer=ENG-1&theme=light');
    await capture('10_project_issues_drawer_dark.png', 'http://localhost:3000/projects/ENG/issues?drawer=ENG-1&theme=dark');

    // 6. Dependencies
    await capture('11_dependencies_light.png', 'http://localhost:3000/dependencies?theme=light');
    await capture('12_dependencies_dark.png', 'http://localhost:3000/dependencies?theme=dark');

    // 7. Planning (Roadmap)
    await capture('13_planning_light.png', 'http://localhost:3000/roadmap?theme=light');
    await capture('14_planning_dark.png', 'http://localhost:3000/roadmap?theme=dark');

    // 8. Insights
    await capture('15_insights_light.png', 'http://localhost:3000/insights?theme=light');
    await capture('16_insights_dark.png', 'http://localhost:3000/insights?theme=dark');

    // 9. Settings Members
    await capture('17_settings_members_light.png', 'http://localhost:3000/settings/members?theme=light');
    await capture('18_settings_members_dark.png', 'http://localhost:3000/settings/members?theme=dark');

    // 10. Settings Teams + Edit Team Modal
    await capture('19_settings_teams_modal_light.png', 'http://localhost:3000/settings/teams?theme=light', {
      evalBefore: `(() => {
        const editButtons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Edit'));
        if (editButtons.length > 0) editButtons[0].click();
      })()`
    });
    await capture('20_settings_teams_modal_dark.png', 'http://localhost:3000/settings/teams?theme=dark', {
      evalBefore: `(() => {
        const editButtons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Edit'));
        if (editButtons.length > 0) editButtons[0].click();
      })()`
    });

    // 11. Extra Dark Requirements: Popover/dropdown, Confirmation modal, Empty state
    // Popover / dropdown - Dark (Workspace Switcher or Priority filter dropdown)
    await capture('21_popover_dropdown_dark.png', 'http://localhost:3000/projects/ENG/issues?theme=dark', {
      evalBefore: `(() => {
        const switcher = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Platform Engineering'));
        if (switcher) switcher.click();
      })()`
    });

    // Confirmation / Modal - Dark (Create Issue modal or Completion Guard or Invite Member)
    await capture('22_confirmation_modal_dark.png', 'http://localhost:3000/settings/members?theme=dark', {
      evalBefore: `(() => {
        const inviteBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Invite Member'));
        if (inviteBtn) inviteBtn.click();
      })()`
    });

    // Empty state - Dark (Filtered state with no results in My Work)
    await capture('23_empty_state_dark.png', 'http://localhost:3000/my-work?q=nonexistent-issue-key&theme=dark');

    // 12. Responsive Breakpoint Matrix (1440px desktop, 1024px tablet, 768px compact, 390px mobile)
    await capture('24_responsive_1440_projects.png', 'http://localhost:3000/projects/ENG/issues?theme=dark', { width: 1440, height: 900 });
    await capture('25_responsive_1024_projects.png', 'http://localhost:3000/projects/ENG/issues?theme=dark', { width: 1024, height: 768 });
    await capture('26_responsive_768_projects.png', 'http://localhost:3000/projects/ENG/issues?theme=dark', { width: 768, height: 1024 });
    await capture('27_responsive_390_projects.png', 'http://localhost:3000/projects/ENG/issues?theme=dark', { width: 390, height: 844 });

    await capture('28_responsive_390_drawer.png', 'http://localhost:3000/projects/ENG/issues?drawer=ENG-1&theme=dark', { width: 390, height: 844 });
    await capture('29_responsive_390_insights.png', 'http://localhost:3000/insights?theme=dark', { width: 390, height: 844 });
    await capture('30_responsive_390_my_work.png', 'http://localhost:3000/my-work?theme=dark', { width: 390, height: 844 });

    console.log('All screenshots captured successfully!');
  } finally {
    ws.close();
    chromeProc.kill();
  }
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
