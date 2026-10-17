export const DATA_KEY = 'kokyo-runru-v1';
export const TIMER_KEY = 'kokyo-runloo-timer-v1';
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
function text(value, max) { return typeof value === 'string' && value.length <= max; }
function date(value) {
  return typeof value === 'string' && datePattern.test(value) &&
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
}
export function validateData(value) {
  if (!value || !Array.isArray(value.runs) || !Array.isArray(value.people)) throw Error('RUNLOOのバックアップ形式ではありません。');
  if (value.runs.length > 10000 || value.people.length > 10000) throw Error('記録は各10,000件まで読み込めます。');
  const validIds = rows => rows.every(r=>r && text(r.id,100) && r.id.length > 0) && new Set(rows.map(r=>r.id)).size === rows.length;
  if (!validIds(value.runs) || !validIds(value.people)) throw Error('記録のIDが不正または重複しています。');
  const runs = value.runs.map(r=>{
    if (!date(r.date) || !Number.isFinite(r.distance) || r.distance <= 0 || r.distance > 1000 ||
        !Number.isFinite(r.seconds) || r.seconds <= 0 || r.seconds > Number.MAX_SAFE_INTEGER / 100 ||
        !Number.isFinite(r.created) || r.created < 0 || !text(r.note,2000)) throw Error('RUN記録の内容を読み込めません。');
    return { id:r.id, date:r.date, distance:r.distance, seconds:r.seconds, created:r.created, note:r.note };
  });
  const people = value.people.map(p=>{
    if (!date(p.date) || !text(p.name,100) || !p.name.trim() || !text(p.traits,300) || !text(p.note,2000)) throw Error('ランナー手帳の内容を読み込めません。');
    return { id:p.id, name:p.name, date:p.date, traits:p.traits, note:p.note };
  });
  return { runs, people };
}
export async function readValue(key) {
  if (window.runlooNative) {
    const native = await window.runlooNative.get(key);
    if (native !== null) return native;
    // WebViewの旧localStorageが存在する場合だけ、端末の永続保存へ移行。
    const legacy = localStorage.getItem(key);
    if (legacy !== null) await window.runlooNative.set(key, legacy);
    return legacy;
  }
  return localStorage.getItem(key);
}
export async function writeValue(key,value) {
  if (window.runlooNative) await window.runlooNative.set(key,value);
  else localStorage.setItem(key,value);
}
export function parseBackup(text) {
  const parsed = JSON.parse(text);
  if (parsed.schemaVersion !== undefined && parsed.schemaVersion !== 1) throw Error('このバックアップのバージョンには対応していません。');
  return validateData(parsed);
}
export function backupText(data) {
  return JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),...validateData(data)},null,2);
}
