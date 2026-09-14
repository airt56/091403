'use strict';

class Calculator {
  constructor() { this.clear(); }

  clear() {
    this.display = '0';
    this.expression = '';
    this.left = null;
    this.operator = null;
    this.fresh = true;
    this.error = false;
    this.last = null;
  }

  format(value) {
    if (!Number.isFinite(value)) throw new Error('结果超出范围');
    return String(Number(value.toPrecision(12)));
  }

  calculate(a, op, b) {
    if (op === '/' && b === 0) throw new Error('不能除以零');
    return this.format(op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b);
  }

  symbol(op) { return { '+': '+', '-': '−', '*': '×', '/': '÷' }[op]; }

  press(key) {
    if (key === 'AC') { this.clear(); return; }
    if (this.error) {
      if (!/^[0-9.]$/.test(key)) return;
      this.clear();
    }
    try {
      if (/^[0-9.]$/.test(key)) {
        if (this.fresh) {
          this.display = '0';
          this.fresh = false;
          if (!this.operator) { this.expression = ''; this.last = null; }
        }
        if (key === '.') {
          if (!this.display.includes('.')) this.display += '.';
        } else if (this.display.replace(/[-.]/g, '').length < 12) {
          this.display = this.display === '0' ? key : this.display === '-0' ? '-' + key : this.display + key;
        }
      } else if (['+', '-', '*', '/'].includes(key)) {
        if (this.operator && !this.fresh) {
          this.display = this.calculate(this.left, this.operator, Number(this.display));
        }
        this.left = Number(this.display);
        this.operator = key;
        this.expression = `${this.display} ${this.symbol(key)}`;
        this.fresh = true;
        this.last = null;
      } else if (key === '=') {
        const op = this.operator || this.last?.operator;
        if (!op) return;
        const a = this.operator ? this.left : Number(this.display);
        const b = this.operator ? Number(this.display) : this.last.operand;
        this.display = this.calculate(a, op, b);
        this.expression = `${this.format(a)} ${this.symbol(op)} ${this.format(b)} =`;
        this.last = { operator: op, operand: b };
        this.operator = null;
        this.left = null;
        this.fresh = true;
      } else if (key === 'back') {
        if (this.fresh) return;
        this.display = this.display.slice(0, -1);
        if (!this.display || this.display === '-') this.display = '0';
      } else if (key === 'sign' || key === '%') {
        if (this.fresh && this.operator) this.display = '0';
        if (key === 'sign') this.display = this.display.startsWith('-') ? this.display.slice(1) : '-' + this.display;
        else this.display = this.format(Number(this.display) / 100);
        this.fresh = false;
        if (!this.operator) { this.expression = ''; this.last = null; }
      }
    } catch (error) {
      this.display = error.message;
      this.expression = '请重新输入';
      this.error = true;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = Calculator;
