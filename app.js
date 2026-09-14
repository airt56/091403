'use strict';
const calculator = new Calculator();
const result = document.querySelector('#result');
const expression = document.querySelector('#expression');
const buttons = [...document.querySelectorAll('[data-key]')];

function render() {
  result.textContent = calculator.display;
  expression.textContent = calculator.expression || '\u00a0';
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
  const aliases = { Enter: '=', Escape: 'AC', Backspace: 'back', Delete: 'AC', x: '*', X: '*', ',': '.' };
  const key = aliases[event.key] || event.key;
  if (!/^[0-9.+\-*/%=]$/.test(key) && !['AC', 'back'].includes(key)) return;
  event.preventDefault();
  press(key);
  const button = buttons.find(item => item.dataset.key === key);
  if (button) {
    button.classList.add('pressed');
    setTimeout(() => button.classList.remove('pressed'), 110);
  }
});
render();
