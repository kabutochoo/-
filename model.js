export function seconds(value) {
  const match = /^([0-5]\d):([0-5]\d)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) throw new Error('タイムは 分:秒.コンマ秒 で、60分未満を入力してください。');
  const total = Number(match[1])*6000 + Number(match[2])*100 + Number((match[3] || '').padEnd(2, '0'));
  if (total <= 0) throw new Error('0秒より長いタイムを入力してください。');
  return total / 100;
}
export function clock(total) {
  const ticks = Math.floor(Math.max(0,total)*100 + 1e-7);
  const minutes = String(Math.floor(ticks/6000)).padStart(2,'0');
  const sec = String(Math.floor(ticks/100)%60).padStart(2,'0');
  return `${minutes}:${sec}.${String(ticks%100).padStart(2,'0')}`;
}
export function previousRun(run, ordered) {
  return ordered.slice(ordered.findIndex(r=>r.id===run.id)+1).find(r=>r.distance===run.distance);
}
