import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = path.join(process.cwd(), 'validation', 'ux-13');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_ux13_' + Date.now());
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9226',
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    '--no-first-run',
  ]);

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9226/json/version');
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!wsUrl) {
    console.error('Could not connect to Chrome on port 9226');
    chromeProc.kill();
    process.exit(1);
  }

  const newTargetRes = await fetch('http://127.0.0.1:9226/json/new?about:blank', { method: 'PUT' });
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
      deviceScaleFactor: 1.5,
      mobile: width < 768,
    });

    if (options.setupStorage) {
      await send('Runtime.evaluate', { expression: options.setupStorage });
      await new Promise((r) => setTimeout(r, 200));
    }

    await send('Page.navigate', { url });

    for (let i = 0; i < 30; i++) {
      const evalRes = await send('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('main, h1, [role="main"], [data-testid="workspace-switcher-trigger"]'))`,
      });
      if (evalRes?.result?.value) break;
      await new Promise((r) => setTimeout(r, 250));
    }
    await new Promise((r) => setTimeout(r, options.delay || 1200));

    if (options.evalBefore) {
      await send('Runtime.evaluate', { expression: options.evalBefore });
      await new Promise((r) => setTimeout(r, options.evalDelay || 600));
    }

    const captureParams = { format: 'png' };
    const res = await send('Page.captureScreenshot', captureParams);
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`  ✓ Saved: ${filePath}`);
  }

  try {
    const base = 'http://localhost:3000';

    // Ensure session is set to usr_alex (Alex Rivera) initially
    const setAlexSession = `
      localStorage.setItem('unblok_session_v1', JSON.stringify({
        token: 'sess_alex',
        userId: 'usr_alex',
        expiresAt: Date.now() + 86400000
      }));
    `;

    // 1. Workspace switcher closed
    await capture('01_workspace_switcher_closed.png', `${base}/my-work`, {
      setupStorage: `
        ${setAlexSession}
        localStorage.setItem('unblok_active_workspace_id_usr_alex', 'ws_acme');
      `,
      delay: 1500,
    });

    // 2. Workspace switcher open showing multiple memberships
    await capture('02_workspace_switcher_open_memberships.png', `${base}/my-work`, {
      evalBefore: `
        document.querySelector('[data-testid="workspace-switcher-trigger"]')?.click();
      `,
      evalDelay: 700,
    });

    // 3. Workspace A (Acme) My Work
    await capture('03_workspace_a_my_work.png', `${base}/my-work`, {
      setupStorage: `
        ${setAlexSession}
        localStorage.setItem('unblok_active_workspace_id_usr_alex', 'ws_acme');
      `,
      delay: 1500,
    });

    // 4. Workspace B (Apex Robotics) My Work
    await capture('04_workspace_b_my_work.png', `${base}/my-work`, {
      setupStorage: `
        ${setAlexSession}
        localStorage.setItem('unblok_active_workspace_id_usr_alex', 'ws_apex');
      `,
      delay: 1500,
    });

    // 5. Same user ADMIN in Apex Robotics (Settings -> Team administration / admin controls)
    await capture('05_same_user_admin_apex.png', `${base}/settings/teams`, {
      setupStorage: `
        ${setAlexSession}
        localStorage.setItem('unblok_active_workspace_id_usr_alex', 'ws_apex');
      `,
      delay: 1500,
    });

    // 6. Same user MEMBER in Acme (Settings shows restricted / member role in switcher)
    await capture('06_same_user_member_acme.png', `${base}/settings/preferences`, {
      setupStorage: `
        ${setAlexSession}
        localStorage.setItem('unblok_active_workspace_id_usr_alex', 'ws_acme');
      `,
      evalBefore: `
        document.querySelector('[data-testid="workspace-switcher-trigger"]')?.click();
      `,
      evalDelay: 700,
    });

    // 7. Observer workspace (Northstar Labs under Sarah Chen)
    await capture('07_observer_workspace_northstar.png', `${base}/my-work`, {
      setupStorage: `
        localStorage.setItem('unblok_session_v1', JSON.stringify({
          token: 'sess_sarah',
          userId: 'usr_sarah',
          expiresAt: Date.now() + 86400000
        }));
        localStorage.setItem('unblok_active_workspace_id_usr_sarah', 'ws_northstar');
      `,
      evalBefore: `
        document.querySelector('[data-testid="workspace-switcher-trigger"]')?.click();
      `,
      evalDelay: 700,
    });

    // 8. Workspace A Projects (Acme Core Platform)
    await capture('08_workspace_a_projects.png', `${base}/projects`, {
      setupStorage: `
        ${setAlexSession}
        localStorage.setItem('unblok_active_workspace_id_usr_alex', 'ws_acme');
      `,
      delay: 1500,
    });

    // 9. Workspace B Projects (Apex Robotics)
    await capture('09_workspace_b_projects.png', `${base}/projects`, {
      setupStorage: `
        ${setAlexSession}
        localStorage.setItem('unblok_active_workspace_id_usr_alex', 'ws_apex');
      `,
      delay: 1500,
    });

    // 10. Workspace A Dependencies (Acme graph)
    await capture('10_workspace_a_dependencies.png', `${base}/dependencies`, {
      setupStorage: `
        ${setAlexSession}
        localStorage.setItem('unblok_active_workspace_id_usr_alex', 'ws_acme');
      `,
      delay: 1500,
    });

    // 11. Workspace B Dependencies (Apex Robotics graph)
    await capture('11_workspace_b_dependencies.png', `${base}/dependencies`, {
      setupStorage: `
        ${setAlexSession}
        localStorage.setItem('unblok_active_workspace_id_usr_alex', 'ws_apex');
      `,
      delay: 1500,
    });

    // 12. Workspace-scoped Inbox
    await capture('12_workspace_scoped_inbox.png', `${base}/inbox`, {
      setupStorage: `
        ${setAlexSession}
        localStorage.setItem('unblok_active_workspace_id_usr_alex', 'ws_acme');
      `,
      delay: 1500,
    });

    // 13. Workspace-scoped Insights
    await capture('13_workspace_scoped_insights.png', `${base}/insights`, {
      setupStorage: `
        ${setAlexSession}
        localStorage.setItem('unblok_active_workspace_id_usr_alex', 'ws_acme');
      `,
      delay: 1500,
    });

    // 14. Create workspace onboarding
    await capture('14_create_workspace_onboarding.png', `${base}/onboarding/workspace`, {
      setupStorage: setAlexSession,
      delay: 1500,
    });

    // 15. Workspace created -> Team boundary placeholder
    await capture('15_workspace_created_team_boundary.png', `${base}/onboarding/team`, {
      setupStorage: setAlexSession,
      delay: 1500,
    });

    // 16. Invited user entering invited workspace
    await capture('16_invited_user_entering_workspace.png', `${base}/invite?token=inv_new_user`, {
      setupStorage: `localStorage.clear();`,
      delay: 1500,
    });

    // 17. Unavailable workspace state
    await capture('17_unavailable_workspace.png', `${base}/my-work`, {
      setupStorage: `
        ${setAlexSession}
        // Force an invalid active workspace with zero memberships
        localStorage.setItem('unblok_active_workspace_id_usr_alex', 'ws_nonexistent_revoked');
        localStorage.setItem('unblok_memberships_v1', JSON.stringify([]));
      `,
      delay: 1500,
    });

    // 18. Archived workspace view with warning banner
    await capture('18_archived_workspace.png', `${base}/my-work`, {
      setupStorage: `
        localStorage.setItem('unblok_session_v1', JSON.stringify({
          token: 'sess_marcus',
          userId: 'usr_marcus',
          expiresAt: Date.now() + 86400000
        }));
        localStorage.setItem('unblok_active_workspace_id_usr_marcus', 'ws_archived');
      `,
      delay: 1500,
    });

    // 19. Mobile workspace switcher (390px)
    await capture('19_mobile_workspace_switcher.png', `${base}/my-work`, {
      width: 390,
      height: 844,
      setupStorage: `
        ${setAlexSession}
        localStorage.setItem('unblok_active_workspace_id_usr_alex', 'ws_acme');
      `,
      evalBefore: `
        document.querySelector('[data-testid="workspace-switcher-trigger"]')?.click();
      `,
      evalDelay: 700,
    });

    // 20. Tablet workspace switcher (768px)
    await capture('20_tablet_workspace_switcher.png', `${base}/my-work`, {
      width: 768,
      height: 1024,
      setupStorage: `
        ${setAlexSession}
        localStorage.setItem('unblok_active_workspace_id_usr_alex', 'ws_acme');
      `,
      evalBefore: `
        document.querySelector('[data-testid="workspace-switcher-trigger"]')?.click();
      `,
      evalDelay: 700,
    });

    // 21. Empty workspace state (Northstar Labs sparse issues/planning)
    await capture('21_empty_workspace_state.png', `${base}/projects`, {
      setupStorage: `
        localStorage.setItem('unblok_session_v1', JSON.stringify({
          token: 'sess_sarah',
          userId: 'usr_sarah',
          expiresAt: Date.now() + 86400000
        }));
        localStorage.setItem('unblok_active_workspace_id_usr_sarah', 'ws_northstar');
      `,
      delay: 1500,
    });

    // 22. Settings permission difference (Alex in Acme as Member, navigating to settings)
    await capture('22_settings_permission_difference.png', `${base}/settings`, {
      setupStorage: `
        ${setAlexSession}
        localStorage.setItem('unblok_active_workspace_id_usr_alex', 'ws_acme');
      `,
      delay: 1500,
    });

    console.log('\nAll 22 UX-13 browser evidence screenshots successfully captured!');
  } finally {
    ws.close();
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error('Evidence capture failed:', err);
  process.exit(1);
});
