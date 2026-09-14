const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
test('calculator implementation exists', () => assert.ok(fs.existsSync('./calculator.js')));
if (fs.existsSync('./calculator.js')) {
  const Calculator = require('./calculator.js');
  const run = keys => { const c = new Calculator(); keys.forEach(k => c.press(k)); return c; };
  const cases = [
    ['multiplication', ['1','2','8','*','6','='], '768'],
    ['decimal precision', ['0','.','1','+','0','.','2','='], '0.3'],
    ['subtraction', ['2','-','5','='], '-3'],
    ['division', ['7','/','2','='], '3.5'],
    ['sequential operations', ['2','+','3','*','4','='], '20'],
    ['replace operator', ['8','+','*','2','='], '16'],
    ['repeat equals', ['2','+','3','=','='], '8'],
    ['new number after equals', ['2','+','3','=','7'], '7'],
    ['continue after equals', ['2','+','3','=','*','2','='], '10'],
    ['percent', ['5','0','%'], '0.5'],
    ['negative operand', ['8','*','2','sign','='], '-16'],
    ['negative fraction', ['sign','.','5'], '-0.5'],
    ['backspace', ['1','2','3','back'], '12'],
    ['duplicate decimal', ['1','.','.','2'], '1.2'],
    ['clear', ['8','*','AC'], '0'],
    ['divide by zero', ['8','/','0','='], '不能除以零'],
    ['recover from error', ['8','/','0','=','4','+','2','='], '6'],
    ['missing operand', ['5','+','='], '10'],
    ['ignore backspace after operator', ['5','+','back','2','='], '7'],
    ['zero prefix', ['0','0','3'], '3'],
  ];
  for (const [name, keys, expected] of cases) test(name, () => assert.equal(run(keys).display, expected));
  test('expression records completed calculation', () => assert.equal(run(['1','2','8','*','6','=']).expression, '128 × 6 ='));
  test('input length is bounded', () => assert.equal(run(Array(30).fill('9')).display.length, 12));
}
