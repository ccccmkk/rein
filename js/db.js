const SUPABASE_URL = 'https://jolaonlxlmnrqdusxjla.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PpfXfhApmleTWvJ20Fwd0A_5c2Uz2Ky';

async function sbFetch(path, opts={}){
  try{
    const res = await fetch(SUPABASE_URL+'/rest/v1/'+path, {
      headers:{
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer '+SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': opts.prefer||'',
        ...opts.headers
      },
      ...opts
    });
    if(!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : true; // 204 No Content = success
  }catch(e){ return null; }
}

async function saveGameState(nickname, state){
  return sbFetch('scores?on_conflict=nickname', {
    method:'POST',
    prefer:'resolution=merge-duplicates,return=representation',
    body: JSON.stringify({
      nickname,
      balance: state.balance,
      spin_count: state.spinCount||0,
      max_coins: state.maxCoins||state.balance,
      game_state: state,
      updated_at: new Date().toISOString()
    })
  });
}

async function loadGameState(nickname){
  const rows = await sbFetch(`scores?nickname=eq.${encodeURIComponent(nickname)}&select=game_state,balance,spin_count,max_coins&limit=1`);
  if(!rows||!rows.length) return null;
  const row = rows[0];
  if(!row.game_state) return null;
  return typeof row.game_state==='string' ? JSON.parse(row.game_state) : row.game_state;
}

async function getLeaderboard(){
  return sbFetch('scores?select=nickname,balance,spin_count,max_coins&order=max_coins.desc&limit=20');
}
