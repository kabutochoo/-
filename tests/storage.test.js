import test from 'node:test';
import assert from 'node:assert/strict';
import {validateData,parseBackup,backupText,readValue,writeValue,DATA_KEY} from '../storage.js';
const sample=()=>({runs:[{id:'r1',date:'2026-10-17',distance:5,seconds:1503.45,note:'小雨',created:1792195200000}],people:[{id:'p1',name:'朝RUN仲間',date:'2026-10-17',traits:'青い帽子',note:'次回は日曜日'}]});
test('旧Web版・新バックアップからコンマ秒と手帳を失わず復元する',()=>{
  const data=sample();assert.deepEqual(parseBackup(JSON.stringify(data)),data);
  assert.deepEqual(parseBackup(backupText(data)),data);
});
test('破損・重複・未対応のバックアップを拒否する',()=>{
  assert.throws(()=>parseBackup('{bad'));
  assert.throws(()=>parseBackup(JSON.stringify({...sample(),schemaVersion:2})));
  const badDate=sample();badDate.people[0].date='2026-02-30';assert.throws(()=>validateData(badDate));
  const duplicates=sample();duplicates.people.push(duplicates.people[0]);assert.throws(()=>validateData(duplicates));
  const badTime=sample();badTime.runs[0].seconds=-1;assert.throws(()=>validateData(badTime));
  const badName=sample();badName.people[0].name=' ';assert.throws(()=>validateData(badName));
});
test('ネイティブでは旧WebViewの記録を移行し、その後は端末保存を優先する',async()=>{
  const legacy=JSON.stringify(sample()),memory=new Map();
  globalThis.localStorage={getItem:()=>legacy};
  globalThis.window={runlooNative:{get:async key=>memory.get(key)??null,set:async(key,value)=>memory.set(key,value)}};
  assert.equal(await readValue(DATA_KEY),legacy);
  await writeValue(DATA_KEY,'native');assert.equal(await readValue(DATA_KEY),'native');
  window.runlooNative.get=async()=>{throw Error('disk unavailable');};
  await assert.rejects(()=>readValue(DATA_KEY),/disk unavailable/);
  delete globalThis.window;delete globalThis.localStorage;
});
