'use strict';
const calculator = new Calculator();
const result = document.querySelector('#result');
const expression = document.querySelector('#expression');
const buttons = [...document.querySelectorAll('[data-key]')];
const themeToggle = document.querySelector('#theme-toggle');
const languageToggle = document.querySelector('#language-toggle');
const translations = {
  'zh-CN': {
    title: '计算器', subtitle: '简单计算，轻松完成',
    settings: '界面设置', expression: '算式', result: '计算结果', keypad: '计算器按键',
    dark: '黑色', light: '白色', toDark: '切换到黑色主题', toLight: '切换到白色主题',
    hint: ['支持键盘输入', 'Enter 计算', 'Esc 清空'],
    retry: '请重新输入', zero: '不能除以零', overflow: '结果超出范围',
    keys: { AC: '清空', sign: '正负切换', '%': '百分比', '/': '除', '*': '乘', '-': '减', '+': '加', '.': '小数点', back: '退格', '=': '等于' }
  },
  en: {
    title: 'Calculator', subtitle: 'Simple math, made easy',
    settings: 'Appearance and language', expression: 'Expression', result: 'Result', keypad: 'Calculator keypad',
    dark: 'Dark', light: 'Light', toDark: 'Switch to dark theme', toLight: 'Switch to light theme',
    hint: ['Keyboard supported', 'Enter to calculate', 'Esc to clear'],
    retry: 'Enter a new number', zero: 'Cannot divide by zero', overflow: 'Result out of range',
    keys: { AC: 'Clear all', sign: 'Change sign', '%': 'Percent', '/': 'Divide', '*': 'Multiply', '-': 'Subtract', '+': 'Add', '.': 'Decimal point', back: 'Backspace', '=': 'Equals' }
  }
};

function applyPreferences() {
  const text = translations[language];
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = language;
  document.title = `${text.title} · ${text.subtitle}`;
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#111214' : '#fdfbf8';
  document.querySelector('#heading').textContent = text.title;
  document.querySelector('#subtitle').textContent = text.subtitle;
  document.querySelector('.preferences').setAttribute('aria-label', text.settings);
  document.querySelector('.keypad').setAttribute('aria-label', text.keypad);
  expression.setAttribute('aria-label', text.expression);
  result.setAttribute('aria-label', text.result);
  document.querySelector('#theme-label').textContent = theme === 'dark' ? text.light : text.dark;
  themeToggle.setAttribute('aria-label', theme === 'dark' ? text.toLight : text.toDark);
  themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
  languageToggle.textContent = language === 'zh-CN' ? 'English' : '中文';
  languageToggle.lang = language === 'zh-CN' ? 'en' : 'zh-CN';
  languageToggle.setAttribute('aria-label', language === 'zh-CN' ? 'Switch to English' : '切换到中文');
  const hint = document.querySelector('.keyboard-hint');
  hint.replaceChildren();
  text.hint.forEach((part, index) => {
    if (index) {
      const separator = document.createElement('span');
      separator.textContent = '·';
      separator.setAttribute('aria-hidden', 'true');
      hint.append(separator);
    }
    hint.append(document.createTextNode(part));
  });
  buttons.forEach(button => {
    if (text.keys[button.dataset.key]) button.setAttribute('aria-label', text.keys[button.dataset.key]);
  });
  render();
}

themeToggle.addEventListener('click', () => {
  theme = theme === 'light' ? 'dark' : 'light';
  preferences.save('theme', theme);
  applyPreferences();
});
languageToggle.addEventListener('click', () => {
  language = language === 'zh-CN' ? 'en' : 'zh-CN';
  preferences.save('language', language);
  applyPreferences();
});

function render() {
  const text = translations[language];
  result.textContent = calculator.error
    ? (calculator.display === '不能除以零' ? text.zero : text.overflow)
    : calculator.display;
  expression.textContent = calculator.error ? text.retry : (calculator.expression || '\u00a0');
  result.classList.toggle('long', calculator.display.length > 9);
  result.classList.toggle('error', calculator.error);
  buttons.filter(button => button.classList.contains('operator')).forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.key === calculator.operator));
  });
}

function press(key) { calculator.press(key); render(); }
buttons.forEach(button => button.addEventListener('click', () => press(button.dataset.key)));
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  // Let Enter activate a focused settings button through native button behavior.
  if (event.key === 'Enter' && event.target.closest?.('.preferences')) return;
  const aliases = { Enter: '=', Escape: 'AC', Backspace: 'back', Delete: 'AC', x: '*', X: '*', ',': '.' };
  const key = aliases[event.key] || event.key;
  if (!/^[0-9.+\-*/%=]$/.test(key) && !['AC', 'back'].includes(key)) return;
  event.preventDefault();
  if (event.target.closest?.('.preferences')) event.target.blur();
  press(key);
  const button = buttons.find(item => item.dataset.key === key);
  if (button) {
    button.classList.add('pressed');
    setTimeout(() => button.classList.remove('pressed'), 110);
  }
});
applyPreferences();
