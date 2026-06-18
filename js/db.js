const SUPABASE_URL = 'https://jolaonlxlmnrqdusxjla.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PpfXfhApmleTWvJ20Fwd0A_5c2Uz2Ky';

async function sbFetch(path, opts={}){
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
  return text ? JSON.parse(text) : null;
}

async function saveScore(nickname, balance){
  return sbFetch('scores', {
    method:'POST',
    prefer:'return=minimal',
    body: JSON.stringify({nickname, balance})
  });
}

async function getLeaderboard(){
  return sbFetch('scores?select=nickname,balance&order=balance.desc&limit=10');
}
