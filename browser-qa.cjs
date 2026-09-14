// Browser smoke test using installed Chrome and its built-in DevTools protocol.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');

(async () => {
  const profile = path.join(__dirname, '.browser-qa');
  const portFile = path.join(profile, 'DevToolsActivePort');
  if (fs.existsSync(portFile)) fs.unlinkSync(portFile);
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'
  ], { windowsHide: true, stdio: 'ignore' });
  let socket;
  try {
    for (let i = 0; !fs.existsSync(portFile); i++) {
      if (i > 100) throw new Error('Chrome startup timeout');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    socket = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    let id = 0;
    const pending = new Map();
    const errors = [];
    socket.onmessage = event => {
      const data = JSON.parse(event.data);
      if (data.id) {
        const request = pending.get(data.id);
        pending.delete(data.id);
        data.error ? request.reject(data.error) : request.resolve(data.result);
      } else if (data.method === 'Runtime.exceptionThrown') errors.push(data.params.exceptionDetails.text);
      else if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') errors.push('console error');
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      pending.set(++id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
      return result.result.value;
    };
    await send('Runtime.enable');
    await send('Page.enable');
    const reset = await send('Page.addScriptToEvaluateOnNewDocument', { source: 'try { localStorage.removeItem("calculator.theme"); localStorage.removeItem("calculator.language"); } catch {}' });
    await send('Emulation.setDeviceMetricsOverride', { width: 1448, height: 1086, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: pathToFileURL(path.join(__dirname, 'index.html')).href });
    for (let i = 0; !(await evaluate('!!document.querySelector("#result") && typeof calculator !== "undefined"')); i++) {
      if (i > 100) throw new Error('Page did not load');
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: reset.identifier });
    const check = async (code, expected) => assert.equal(await evaluate(code), expected);
    await check('document.title', '计算器 · 简单计算，轻松完成');
    await check('document.querySelectorAll("[data-key]").length', 20);
    await check('document.querySelector("#result").textContent', '0');
    await evaluate(`["1","2","8","*","6","="].forEach(k => document.querySelector('[data-key="'+k+'"]').click())`);
    await check('document.querySelector("#result").textContent', '768');
    const screenshot = async name => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const result = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, name), Buffer.from(result.data, 'base64'));
    };
    await screenshot('calculator-desktop.png');
    const keys = async values => {
      for (const key of values) {
        const nativeKey = key === 'Enter' ? { code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: '\r' } : {};
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key, ...nativeKey });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key, ...nativeKey });
      }
    };
    await keys(['Escape', '0', '.', '1', '+', '0', '.', '2', 'Enter']);
    await check('document.querySelector("#result").textContent', '0.3');
    await keys(['Escape', '8', '/', '0', 'Enter']);
    await check('document.querySelector("#result").textContent', '不能除以零');
    await keys(['4', '+', '2', 'Enter']);
    await check('document.querySelector("#result").textContent', '6');
    await keys(['Escape', '1', '2', 'Backspace']);
    await check('document.querySelector("#result").textContent', '1');
    await keys(['Escape', '1', '2', '8', '*', '6', 'Enter']);
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await check('document.documentElement.scrollWidth <= innerWidth', true);
    await screenshot('calculator-mobile.png');
    await keys(['Escape', ...'999999999999']);
    await check('document.querySelector("#result").scrollWidth <= document.querySelector("#result").clientWidth', true);
    await check('!!document.querySelector("#theme-toggle") && !!document.querySelector("#language-toggle")', true);
    await keys(['Escape', '1', '2', '+']);
    await evaluate('document.querySelector("#theme-toggle").click(); document.querySelector("#language-toggle").click()');
    await check('document.documentElement.dataset.theme', 'dark');
    await check('document.documentElement.lang', 'en');
    await check('document.querySelector("#heading").textContent', 'Calculator');
    await check('getComputedStyle(document.documentElement).backgroundColor', 'rgb(17, 18, 20)');
    await evaluate('document.querySelector("#language-toggle").focus()');
    await keys(['3', 'Enter']);
    await check('document.querySelector("#result").textContent', '15');
    await check('document.querySelector("#result").getAttribute("aria-label")', 'Result');
    await keys(['Escape', '8', '/', '0', 'Enter']);
    await check('document.querySelector("#result").textContent', 'Cannot divide by zero');
    await check('document.querySelector("#result").scrollWidth <= document.querySelector("#result").clientWidth', true);
    await evaluate('document.querySelector("#language-toggle").click()');
    await check('document.querySelector("#result").textContent', '不能除以零');
    await evaluate('document.querySelector("#language-toggle").click()');
    await keys(['Escape', '1', '2', '8', '*', '6', 'Enter']);
    await screenshot('calculator-dark-en-mobile.png');
    await send('Emulation.setDeviceMetricsOverride', { width: 1448, height: 1086, deviceScaleFactor: 1, mobile: false });
    await screenshot('calculator-dark-en-desktop.png');
    // Complete the README gallery using the actual UI switches.
    const captureVariant = async (name, expectedTheme, expectedLanguage) => {
      await check('document.documentElement.dataset.theme', expectedTheme);
      await check('document.documentElement.lang', expectedLanguage);
      await check('document.querySelector("#result").textContent', '768');
      await screenshot(`calculator-${name}-desktop.png`);
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
      await check('document.documentElement.scrollWidth <= innerWidth', true);
      await screenshot(`calculator-${name}-mobile.png`);
      await send('Emulation.setDeviceMetricsOverride', { width: 1448, height: 1086, deviceScaleFactor: 1, mobile: false });
    };
    await evaluate('document.querySelector("#language-toggle").click()');
    await captureVariant('dark-zh', 'dark', 'zh-CN');
    await evaluate('document.querySelector("#theme-toggle").click(); document.querySelector("#language-toggle").click()');
    await captureVariant('light-en', 'light', 'en');
    await evaluate('document.querySelector("#theme-toggle").click()');
    await evaluate('document.querySelector("#result").dataset.beforeReload = "yes"');
    await send('Page.reload');
    for (let i = 0; ; i++) {
      const ready = await evaluate('!!document.querySelector("#result") && !document.querySelector("#result").dataset.beforeReload && typeof calculator !== "undefined"');
      if (ready) break;
      if (i > 100) throw new Error('Reload timeout');
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    await check('document.documentElement.dataset.theme', 'dark');
    await check('document.documentElement.lang', 'en');
    await check('document.title', 'Calculator · Simple math, made easy');
    await evaluate('document.querySelector("#theme-toggle").focus()');
    await keys(['Enter']);
    await check('document.documentElement.dataset.theme', 'light');
    await evaluate('document.querySelector("#language-toggle").focus()');
    await keys(['Enter']);
    await check('document.documentElement.lang', 'zh-CN');
    await check('document.querySelector("#result").textContent', '0');
    await evaluate('localStorage.removeItem("calculator.theme"); localStorage.removeItem("calculator.language")');
    assert.deepEqual(errors, []);
    console.log('PASS: core calculator flows; light/dark theme; Chinese/English labels and errors; calculation preserved during toggles; preferences survive reload; Enter activates focused toggles; mobile long numbers and errors fit; zero runtime errors. Eight screenshots: all four language/theme combinations, desktop and mobile.');
    await send('Browser.close');
  } finally {
    if (socket) socket.close();
    if (chrome.exitCode === null) chrome.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
