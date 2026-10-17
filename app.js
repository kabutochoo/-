import {seconds,clock,previousRun} from './model.js';
import {DATA_KEY,TIMER_KEY,readValue,writeValue,validateData,parseBackup,backupText} from './storage.js';
import {elapsed,parseTimer} from './timer.js';

const $=id=>document.getElementById(id);
let data={runs:[],people:[]},writable=true;
let timer={accumulated:0,started:null},editingPerson=null;
let queue=Promise.resolve();
// 保存操作を直列化し、連打や複数のフォーム操作による記録の上書きを防ぐ。
function exclusive(task) {
  const result=queue.then(task);
  queue=result.catch(()=>{});
  return result.catch(error=>{$('notice').textContent=error.message || '操作を完了できませんでした。';});
}
async function save(next) {
  if (!writable) throw Error('保存データを読み込めないため保存できません。バックアップから復元できます。');
  await writeValue(DATA_KEY,JSON.stringify(validateData(next)));
  data=next;
}
const today=new Date();
const dateString=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
$('run-date').value=$('person-date').value=dateString;
function switchTab(id) {
  document.querySelectorAll('.tab').forEach(b=>{
    b.classList.toggle('active',b.dataset.tab===id);
    b.setAttribute('aria-pressed',String(b.dataset.tab===id));
  });
  document.querySelectorAll('.panel').forEach(p=>p.hidden=p.id!==id);
  render();
}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
document.querySelector('.hero-link').addEventListener('click',e=>{
  e.preventDefault();switchTab('run');
  $('run').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
});
function displayTimer(updateInput=false) {
  const value=clock(elapsed(timer)/1000);
  $('timer').textContent=value;
  $('start').textContent=timer.started!==null?'一時停止':timer.accumulated>0?'計測を再開':'計測をスタート';
  if (updateInput) $('duration').value=value;
}
async function setTimer(next) {
  const previous=timer;
  timer=next;
  displayTimer(true);
  try {await writeValue(TIMER_KEY,JSON.stringify(next));}
  catch(error){timer=previous;displayTimer(true);throw error;}
}
$('start').onclick=()=>exclusive(async()=>{
  const next=timer.started===null?{...timer,started:Date.now()}:{accumulated:elapsed(timer),started:null};
  await setTimer(next);
});
$('reset').onclick=()=>exclusive(async()=>{
  if (elapsed(timer)>0 && !confirm('計測中のタイムをリセットしますか？')) return;
  await setTimer({accumulated:0,started:null});
});
setInterval(()=>displayTimer(timer.started!==null),30);
document.addEventListener('visibilitychange',()=>displayTimer(timer.started!==null));
$('run-form').onsubmit=e=>{
  e.preventDefault();
  const run={id:crypto.randomUUID(),date:$('run-date').value,distance:Number($('distance').value),seconds:0,note:$('run-note').value.trim(),created:Date.now()};
  try { run.seconds=seconds($('duration').value); } catch(error) { $('notice').textContent=error.message;return; }
  exclusive(async()=>{
    await save({...data,runs:[...data.runs,run]});
    $('run-note').value='';
    try {await setTimer({accumulated:0,started:null});}
    catch {timer={accumulated:0,started:null};displayTimer(true);$('notice').textContent='RUNは保存済みです。計測状態のリセットを保存できませんでした。';render();return;}
    $('notice').textContent='RUNを保存しました。「記録を比べる」で振り返れます。';render();
  });
};
function clearPersonForm() {
  editingPerson=null;$('person-form').reset();$('person-date').value=dateString;
  $('person-save').textContent='手帳に保存';$('person-cancel').hidden=true;
}
$('person-cancel').onclick=clearPersonForm;
$('person-form').onsubmit=e=>{
  e.preventDefault();
  const name=$('person-name').value.trim();
  if(!name){$('notice').textContent='ニックネームを入力してください。';return;}
  const person={id:editingPerson||crypto.randomUUID(),name,date:$('person-date').value,traits:$('person-traits').value.trim(),note:$('person-note').value.trim()};
  const isEdit=editingPerson!==null;
  exclusive(async()=>{
    await save({...data,people:isEdit?data.people.map(p=>p.id===person.id?person:p):[person,...data.people]});
    clearPersonForm();$('notice').textContent=isEdit?'手帳を更新しました。':'出会いを手帳に保存しました。';render();
  });
};
function node(tag,text,className) {
  const element=document.createElement(tag);element.textContent=text;
  if(className)element.className=className;return element;
}
function removeButton(type,id) {
  const button=node('button','削除','delete');
  button.onclick=()=>exclusive(async()=>{
    if(!confirm('この記録を削除しますか？'))return;
    await save({...data,[type]:data[type].filter(r=>r.id!==id)});
    if(type==='people'&&editingPerson===id)clearPersonForm();render();
  });return button;
}
function editPerson(person) {
  editingPerson=person.id;
  $('person-name').value=person.name;$('person-date').value=person.date;
  $('person-traits').value=person.traits;$('person-note').value=person.note;
  $('person-save').textContent='変更を保存';$('person-cancel').hidden=false;
  $('person-form').scrollIntoView({block:'start'});$('person-name').focus();
}
function render() {
  const ordered=[...data.runs].sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created);
  const total=data.runs.reduce((s,r)=>s+r.distance,0),five=data.runs.filter(r=>r.distance===5);
  $('stats').replaceChildren(...[['RUNの回数',`${data.runs.length} 回`],['合計距離',`${Number(total.toFixed(1))} km`],['5km ベスト',five.length?clock(Math.min(...five.map(r=>r.seconds))):'—']].map(([label,value])=>{
    const box=node('div',label,'stat');box.append(node('strong',value));return box;
  }));
  $('runs').replaceChildren();
  if(!ordered.length)$('runs').append(node('p','まだ記録がありません。最初の一周を記録してみましょう。','empty'));
  for(const run of ordered){
    const card=node('article','','card'),top=node('div','','record-top');
    top.append(node('strong',`${run.date} · ${run.distance} km`),node('span',clock(run.seconds),'record-time'));
    card.append(top,node('p',`ペース ${Math.floor(run.seconds/run.distance/60)}分${String(Math.floor(run.seconds/run.distance)%60).padStart(2,'0')}秒 / km`,'muted'));
    const previous=previousRun(run,ordered);
    if(previous){const delta=Math.round((run.seconds-previous.seconds)*100)/100;card.append(node('p',delta===0?'前回と同じタイム':`前回比 ${clock(Math.abs(delta))} ${delta<0?'短縮':'増加'}`,'muted'));}
    if(run.note)card.append(node('p',run.note,'record-note'));
    card.append(removeButton('runs',run.id));$('runs').append(card);
  }
  $('people-list').replaceChildren();
  const search=$('person-search').value.trim().toLocaleLowerCase();
  const people=data.people.filter(p=>[p.name,p.traits,p.note].some(t=>t.toLocaleLowerCase().includes(search)));
  if(!people.length)$('people-list').append(node('p',search?'条件に合うメモがありません。':'出会いのメモは、ここに並びます。','empty'));
  for(const person of people){
    const card=node('article','','card');
    card.append(node('h3',person.name),node('p',`${person.date} に出会ったランナー`,'muted'),node('p',person.traits,'record-note'),node('p',person.note,'record-note'));
    const actions=node('div','','record-actions'),edit=node('button','編集','secondary');
    edit.onclick=()=>editPerson(person);actions.append(edit,removeButton('people',person.id));card.append(actions);$('people-list').append(card);
  }
}
$('person-search').oninput=render;
$('export').onclick=()=>exclusive(async()=>{
  if(!writable)throw Error('データの読み込みに失敗しているためバックアップできません。');
  const text=backupText(data),filename=`kokyo-runloo-${dateString}.json`;
  if(window.runlooNative){await window.runlooNative.exportBackup(text,filename);return;}
  const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');
  a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('import-file').onchange=e=>{
  const file=e.target.files[0];e.target.value='';if(!file)return;
  exclusive(async()=>{
    if(file.size>10*1024*1024)throw Error('バックアップは10MB以下のファイルを選んでください。');
    const restored=parseBackup(await file.text());
    if(!confirm(`RUN ${restored.runs.length}件・ランナー ${restored.people.length}件で現在の手帳を置き換えます。必要な記録は先にバックアップしてください。復元しますか？`))return;
    // 復元前データを保存できなければ置換しない。破損データからの復旧にも使える。
    const old=await readValue(DATA_KEY);
    if(old!==null)await writeValue(`${DATA_KEY}-before-restore`,old);
    await writeValue(DATA_KEY,JSON.stringify(restored));
    data=restored;writable=true;clearPersonForm();$('notice').textContent='バックアップから記録を復元しました。';render();
  });
};
async function init() {
  document.querySelectorAll('form button,#start,#reset,#export,#import-file').forEach(e=>e.disabled=true);
  try {
    const raw=await readValue(DATA_KEY);
    if(raw!==null)data=validateData(JSON.parse(raw));
  }catch{
    writable=false;$('notice').textContent='保存データを読み込めませんでした。既存データを保護するため保存を停止しています。バックアップから復元できます。';
  }
  try {timer=parseTimer(await readValue(TIMER_KEY));}
  catch{$('notice').textContent+=' 計測データを読み込めなかったため、タイマーを初期表示に戻しました。';}
  document.querySelectorAll('form button,#start,#reset,#export,#import-file').forEach(e=>e.disabled=false);
  switchTab('people');displayTimer(timer.started!==null || timer.accumulated>0);
  document.body.dataset.ready='true';
}
await init();
