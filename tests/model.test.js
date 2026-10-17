import test from 'node:test';
import assert from 'node:assert/strict';
import {seconds,clock,previousRun} from '../model.js';
test('分秒とコンマ秒を保存・表示し、60分以上を拒否する',()=>{
  assert.equal(seconds('25:03.45'),1503.45);
  assert.equal(clock(1503.45),'25:03.45');
  assert.equal(seconds('00:00.01'),0.01);
  assert.equal(seconds('25:03.4'),1503.4);
  assert.equal(seconds('25:03'),1503);
  assert.equal(clock(59.999),'00:59.99');
  assert.equal(clock(60),'01:00.00');
  assert.equal(clock(3723),'62:03.00'); // 既存の長い記録も切り捨てない
  for(const value of ['00:00.00','60:00.00','25:60.00','-1:00','01:02:03','25:03.456','abc'])assert.throws(()=>seconds(value));
});
test('前回比は同じ距離の過去の記録のみ',()=>{const runs=[{id:'a',distance:5},{id:'b',distance:10},{id:'c',distance:5}];assert.equal(previousRun(runs[0],runs).id,'c');assert.equal(previousRun(runs[1],runs),undefined);assert.equal(previousRun(runs[2],runs),undefined);});
