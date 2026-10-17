import test from 'node:test';
import assert from 'node:assert/strict';
import {elapsed,parseTimer} from '../timer.js';
test('画面停止・再起動後も開始時刻から経過時間を再計算する',()=>{
  const started={accumulated:1250,started:10000};
  assert.equal(elapsed(parseTimer(JSON.stringify(started)),135050),126300);
  assert.equal(elapsed({accumulated:126300,started:null},999999),126300);
  assert.equal(elapsed({accumulated:1250,started:10000},9000),1250);
});
test('破損したタイマー状態を拒否する',()=>{
  assert.deepEqual(parseTimer(null),{accumulated:0,started:null});
  for(const value of ['{}','null','{"accumulated":-1,"started":null}','{"accumulated":0,"started":"bad"}']) assert.throws(()=>parseTimer(value));
});
