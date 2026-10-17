export function elapsed(state,now=Date.now()) {
  return Math.max(0,state.accumulated + (state.started === null ? 0 : Math.max(0,now-state.started)));
}
export function parseTimer(raw) {
  if (!raw) return {accumulated:0,started:null};
  const state=JSON.parse(raw);
  if (!state || !Number.isFinite(state.accumulated) || state.accumulated<0 ||
      !(state.started===null || (Number.isFinite(state.started) && state.started>0))) throw Error('計測データを読み込めません。');
  return {accumulated:state.accumulated,started:state.started};
}
