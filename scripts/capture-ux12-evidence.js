import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = path.join(process.cwd(), 'validation', 'ux-12');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_ux12_' + Date.now());
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
      deviceScaleFactor: 1.5,
      mobile: width < 768,
    });

    await send('Page.navigate', { url });
    for (let i = 0; i < 30; i++) {
      const evalRes = await send('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('main, h1, [role="main"]'))`,
      });
      if (evalRes?.result?.value) break;
      await new Promise((r) => setTimeout(r, 250));
    }
    await new Promise((r) => setTimeout(r, options.delay || 1000));

    if (options.evalBefore) {
      await send('Runtime.evaluate', { expression: options.evalBefore });
      await new Promise((r) => setTimeout(r, options.evalDelay || 500));
    }

    const captureParams = { format: 'png' };
    const res = await send('Page.captureScreenshot', captureParams);
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`  ✓ Saved: ${filePath}`);
  }

  try {
    const base = 'http://localhost:3000';

    // 1. Login Desktop
    await capture('01_login_desktop.png', `${base}/login`, { width: 1440, height: 900 });

    // 2. Login Mobile
    await capture('02_login_mobile.png', `${base}/login`, { width: 390, height: 844 });

    // 3. Signup Desktop
    await capture('03_signup_desktop.png', `${base}/signup`, { width: 1440, height: 900 });

    // 4. Signup Mobile
    await capture('04_signup_mobile.png', `${base}/signup`, { width: 390, height: 844 });

    // 5. Signup Password Interaction (typing password, showing checklist & show password)
    await capture('05_signup_password_interaction.png', `${base}/signup`, {
      width: 1440,
      height: 900,
      evalBefore: `
        (() => {
          function setInput(el, val) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(el, val);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
          const nameInput = document.getElementById('signup-name');
          const emailInput = document.getElementById('signup-email');
          const passInput = document.getElementById('signup-password');
          if (nameInput) setInput(nameInput, 'Sarah Chen');
          if (emailInput) setInput(emailInput, 'sarah@unblok.dev');
          if (passInput) {
            setInput(passInput, 'P@ssword123');
            passInput.focus();
            const toggleBtn = passInput.parentElement.querySelector('button');
            if (toggleBtn) toggleBtn.click();
          }
        })()
      `,
      evalDelay: 600,
    });

    // 6. Forgot Password
    await capture('06_forgot_password.png', `${base}/forgot-password`, { width: 1440, height: 900 });

    // 7. Forgot Request Accepted
    await capture('07_forgot_request_accepted.png', `${base}/forgot-password`, {
      width: 1440,
      height: 900,
      evalBefore: `
        (() => {
          const emailInput = document.getElementById('forgot-email');
          if (emailInput) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(emailInput, 'alex@unblok.dev');
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
            emailInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          const submitBtn = document.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.click();
        })()
      `,
      evalDelay: 800,
    });

    // 8. Reset Password Valid
    await capture('08_reset_password_valid.png', `${base}/reset-password?token=rst_valid`, { width: 1440, height: 900 });

    // 9. Reset Invalid
    await capture('09_reset_invalid.png', `${base}/reset-password?token=rst_invalid`, { width: 1440, height: 900 });

    // 10. Reset Expired
    await capture('10_reset_expired.png', `${base}/reset-password?token=rst_expired`, { width: 1440, height: 900 });

    // 11. Invitation — Existing Account
    await capture('11_invitation_existing_account.png', `${base}/invite/inv_existing_user`, { width: 1440, height: 900 });

    // 12. Invitation — New Account
    await capture('12_invitation_new_account.png', `${base}/invite/inv_new_user`, { width: 1440, height: 900 });

    // 13. Invitation — Expired
    await capture('13_invitation_expired.png', `${base}/invite/inv_expired`, { width: 1440, height: 900 });

    // 14. Invitation — Revoked
    await capture('14_invitation_revoked.png', `${base}/invite/inv_revoked`, { width: 1440, height: 900 });

    // 15. Invitation — Already Accepted
    await capture('15_invitation_already_accepted.png', `${base}/invite/inv_accepted`, { width: 1440, height: 900 });

    // 16. Invalid Login
    await capture('16_invalid_login.png', `${base}/login`, {
      width: 1440,
      height: 900,
      evalBefore: `
        (() => {
          function setInput(el, val) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(el, val);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
          const emailInput = document.getElementById('login-email');
          const passInput = document.getElementById('login-password');
          if (emailInput) setInput(emailInput, 'fail@unblok.dev');
          if (passInput) setInput(passInput, 'wrong-password');
          const submitBtn = document.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.click();
        })()
      `,
      evalDelay: 800,
    });

    // 17. Session Expired
    await capture('17_session_expired.png', `${base}/login?returnTo=%2Fprojects%2FENG%2Fissues&sessionExpired=true`, {
      width: 1440,
      height: 900,
    });

    // 18. Authenticated Safe Return into AppShell
    await capture('18_authenticated_safe_return.png', `${base}/login?returnTo=%2Fprojects%2FENG%2Fissues`, {
      width: 1440,
      height: 900,
      evalBefore: `
        (() => {
          const fillBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Fill demo credentials'));
          if (fillBtn) fillBtn.click();
          setTimeout(() => {
            const submitBtn = document.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.click();
          }, 150);
        })()
      `,
      evalDelay: 1500,
    });

    // 19. Auth Tablet
    await capture('19_auth_tablet.png', `${base}/login`, { width: 768, height: 1024 });

    // 20. Keyboard / Focus Representative State
    await capture('20_keyboard_focus_state.png', `${base}/login`, {
      width: 1440,
      height: 900,
      evalBefore: `
        (() => {
          const emailInput = document.getElementById('login-email');
          if (emailInput) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(emailInput, 'marcus@unblok.dev');
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
            emailInput.focus();
          }
        })()
      `,
      evalDelay: 500,
    });

    console.log('\nAll 20 UX-12 genuine evidence screenshots successfully captured and saved to validation/ux-12/');
  } finally {
    ws.close();
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error('Error in capture-ux12-evidence:', err);
  process.exit(1);
});
