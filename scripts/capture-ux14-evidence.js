import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = path.join(process.cwd(), 'validation', 'ux-14');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_ux14_' + Date.now());
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    '--no-first-run',
  ]);

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9227/json/version');
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!wsUrl) {
    console.error('Could not connect to Chrome on port 9227');
    chromeProc.kill();
    process.exit(1);
  }

  const newTargetRes = await fetch('http://127.0.0.1:9227/json/new?about:blank', { method: 'PUT' });
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

    // Sessions:
    // Sarah: ADMIN in Acme (ws_acme), OBSERVER in Northstar (ws_northstar)
    const setSarahAcme = `
      localStorage.setItem('unblok_session_v1', JSON.stringify({
        token: 'sess_sarah',
        userId: 'usr_sarah',
        expiresAt: Date.now() + 86400000
      }));
      localStorage.setItem('unblok_active_workspace_id_usr_sarah', 'ws_acme');
    `;

    // Alex: MEMBER in Acme (ws_acme), ADMIN in Apex (ws_apex)
    const setAlexAcme = `
      localStorage.setItem('unblok_session_v1', JSON.stringify({
        token: 'sess_alex',
        userId: 'usr_alex',
        expiresAt: Date.now() + 86400000
      }));
      localStorage.setItem('unblok_active_workspace_id_usr_alex', 'ws_acme');
    `;

    const setAlexApex = `
      localStorage.setItem('unblok_session_v1', JSON.stringify({
        token: 'sess_alex',
        userId: 'usr_alex',
        expiresAt: Date.now() + 86400000
      }));
      localStorage.setItem('unblok_active_workspace_id_usr_alex', 'ws_apex');
    `;

    // Sarah in Northstar (OBSERVER)
    const setSarahNorthstar = `
      localStorage.setItem('unblok_session_v1', JSON.stringify({
        token: 'sess_sarah',
        userId: 'usr_sarah',
        expiresAt: Date.now() + 86400000
      }));
      localStorage.setItem('unblok_active_workspace_id_usr_sarah', 'ws_northstar');
    `;

    // Pre-seed an empty project DEV in ws_acme for empty project experience
    const seedEmptyProject = `
      (function() {
        const stored = localStorage.getItem('unblok_execution_state_v1_projects');
        let projects = stored ? JSON.parse(stored) : [];
        if (!projects.some(p => p.key === 'DEV' && p.workspaceId === 'ws_acme')) {
          projects.push({
            id: 'proj_dev_empty',
            name: 'Developer Platform',
            key: 'DEV',
            teamId: 'team_eng',
            workspaceId: 'ws_acme',
            description: 'Internal developer tooling and infrastructure systems',
            currentSequence: 0
          });
          localStorage.setItem('unblok_execution_state_v1_projects', JSON.stringify(projects));
        }
      })();
    `;

    // Pre-seed an identical key CORE in ws_apex to demonstrate cross-workspace key reuse
    const seedApexCore = `
      (function() {
        const stored = localStorage.getItem('unblok_execution_state_v1_projects');
        let projects = stored ? JSON.parse(stored) : [];
        if (!projects.some(p => p.key === 'CORE' && p.workspaceId === 'ws_apex')) {
          projects.push({
            id: 'proj_apex_core',
            name: 'Apex Core Robotics',
            key: 'CORE',
            teamId: 'team_apex_auto',
            workspaceId: 'ws_apex',
            description: 'Apex autonomous platform software',
            currentSequence: 0
          });
          localStorage.setItem('unblok_execution_state_v1_projects', JSON.stringify(projects));
        }
      })();
    `;

    // Pre-seed an identical key ENG in ws_apex to demonstrate cross-workspace team key reuse
    const seedApexEng = `
      (function() {
        const stored = localStorage.getItem('unblok_execution_state_v1_teams');
        let teams = stored ? JSON.parse(stored) : [];
        if (!teams.some(t => t.key === 'ENG' && t.workspaceId === 'ws_apex')) {
          teams.push({
            id: 'team_apex_eng',
            name: 'Apex Systems Engineering',
            key: 'ENG',
            color: '#10b981',
            workspaceId: 'ws_apex',
            description: 'Embedded software and hardware systems'
          });
          localStorage.setItem('unblok_execution_state_v1_teams', JSON.stringify(teams));
        }
      })();
    `;

    // 1. Teams Directory desktop
    await capture('01_teams_directory_desktop.png', `${base}/teams`, {
      setupStorage: setSarahAcme,
      delay: 1500,
    });

    // 2. Teams Directory mobile
    await capture('02_teams_directory_mobile.png', `${base}/teams`, {
      setupStorage: setSarahAcme,
      width: 390,
      height: 844,
      delay: 1500,
    });

    // 3. Team Hub Overview
    await capture('03_team_hub_overview.png', `${base}/teams/ENG`, {
      setupStorage: setSarahAcme,
      delay: 1500,
    });

    // 4. Team Hub Issues
    await capture('04_team_hub_issues.png', `${base}/teams/ENG`, {
      setupStorage: setSarahAcme,
      evalBefore: `
        const btns = Array.from(document.querySelectorAll('button'));
        const issuesBtn = btns.find(b => b.textContent && b.textContent.trim().toLowerCase() === 'issues');
        issuesBtn?.click();
      `,
      evalDelay: 600,
    });

    // 5. Team Hub Projects
    await capture('05_team_hub_projects.png', `${base}/teams/ENG`, {
      setupStorage: setSarahAcme,
      evalBefore: `
        const btns = Array.from(document.querySelectorAll('button'));
        const projBtn = btns.find(b => b.textContent && b.textContent.trim().toLowerCase() === 'projects');
        projBtn?.click();
      `,
      evalDelay: 600,
    });

    // 6. Team Hub Planning
    await capture('06_team_hub_planning.png', `${base}/teams/ENG`, {
      setupStorage: setSarahAcme,
      evalBefore: `
        const btns = Array.from(document.querySelectorAll('button'));
        const planBtn = btns.find(b => b.textContent && b.textContent.trim().toLowerCase() === 'planning');
        planBtn?.click();
      `,
      evalDelay: 600,
    });

    // 7. Team creation form
    await capture('07_team_creation_form.png', `${base}/teams`, {
      setupStorage: setSarahAcme,
      evalBefore: `
        const createBtn = document.querySelector('[data-testid="create-team-btn"]') ||
          Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Create team'));
        createBtn?.click();
      `,
      evalDelay: 700,
    });

    // 8. Team creation validation (duplicate key error)
    await capture('08_team_creation_validation.png', `${base}/teams`, {
      setupStorage: setSarahAcme,
      evalBefore: `
        const createBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Create team'));
        createBtn?.click();
        setTimeout(() => {
          const inputs = document.querySelectorAll('input[type="text"]');
          if (inputs.length >= 2) {
            inputs[0].value = 'Core Platform';
            inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
            inputs[1].value = 'ENG';
            inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
            inputs[1].dispatchEvent(new Event('blur', { bubbles: true }));
          }
        }, 200);
      `,
      evalDelay: 800,
    });

    // 9. Projects Directory with Create Project
    await capture('09_projects_directory_with_create.png', `${base}/projects`, {
      setupStorage: setSarahAcme,
      delay: 1500,
    });

    // 10. Project creation form
    await capture('10_project_creation_form.png', `${base}/projects`, {
      setupStorage: setSarahAcme,
      evalBefore: `
        const createBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Create project'));
        createBtn?.click();
      `,
      evalDelay: 700,
    });

    // 11. Project owning Team picker
    await capture('11_project_owning_team_picker.png', `${base}/projects`, {
      setupStorage: setSarahAcme,
      evalBefore: `
        const createBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Create project'));
        createBtn?.click();
        setTimeout(() => {
          const select = document.querySelector('select');
          select?.focus();
        }, 200);
      `,
      evalDelay: 700,
    });

    // 12. Newly created empty project
    await capture('12_newly_created_empty_project.png', `${base}/projects/DEV`, {
      setupStorage: `${setSarahAcme}; ${seedEmptyProject};`,
      delay: 1500,
    });

    // 13. Workspace → Team onboarding
    await capture('13_workspace_to_team_onboarding.png', `${base}/onboarding/team`, {
      setupStorage: setSarahAcme,
      delay: 1500,
    });

    // 14. Team → Project onboarding
    await capture('14_team_to_project_onboarding.png', `${base}/onboarding/project`, {
      setupStorage: setSarahAcme,
      delay: 1500,
    });

    // 15. Optional invite step
    await capture('15_optional_invite_step.png', `${base}/onboarding/invite`, {
      setupStorage: setSarahAcme,
      delay: 1500,
    });

    // 16. Onboarding complete
    await capture('16_onboarding_complete.png', `${base}/onboarding/complete`, {
      setupStorage: setSarahAcme,
      delay: 1500,
    });

    // 17. Interrupted onboarding resume
    await capture('17_interrupted_onboarding_resume.png', `${base}/onboarding`, {
      setupStorage: setSarahAcme,
      delay: 1500,
    });

    // 18. Invited user entering existing workspace
    await capture('18_invited_user_entering_workspace.png', `${base}/invite/inv_existing_user`, {
      setupStorage: `localStorage.clear();`,
      delay: 1500,
    });

    // 19. Observer read-only Team Hub
    await capture('19_observer_readonly_team_hub.png', `${base}/teams/ENG`, {
      setupStorage: setSarahNorthstar,
      delay: 1500,
    });

    // 20. ADMIN vs MEMBER management permissions (Alex Rivera as Member viewing Teams Directory without create button)
    await capture('20_admin_vs_member_management_permissions.png', `${base}/teams`, {
      setupStorage: setAlexAcme,
      delay: 1500,
    });

    // 21. Same Team key across two workspaces (Apex workspace ENG team)
    await capture('21_same_team_key_across_two_workspaces.png', `${base}/teams/ENG`, {
      setupStorage: `${setAlexApex}; ${seedApexEng};`,
      delay: 1500,
    });

    // 22. Same Project key across two workspaces (Apex workspace CORE project)
    await capture('22_same_project_key_across_two_workspaces.png', `${base}/projects/CORE`, {
      setupStorage: `${setAlexApex}; ${seedApexCore};`,
      delay: 1500,
    });

    // 23. Tablet Team Hub
    await capture('23_tablet_team_hub.png', `${base}/teams/ENG`, {
      setupStorage: setSarahAcme,
      width: 768,
      height: 1024,
      delay: 1500,
    });

    // 24. Mobile Project creation
    await capture('24_mobile_project_creation.png', `${base}/projects`, {
      setupStorage: setSarahAcme,
      width: 390,
      height: 844,
      evalBefore: `
        const createBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Create project'));
        createBtn?.click();
      `,
      evalDelay: 700,
    });

    console.log('\nAll 24 screenshots captured successfully!');
  } finally {
    ws.close();
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
