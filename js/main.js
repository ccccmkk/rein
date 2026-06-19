const game=new SlotGame();
game.load(); // localStorage fallback on start

const delay=ms=>new Promise(r=>setTimeout(r,ms));

// Server save (async, non-blocking)
async function serverSave(){
  if(!playerNick) return;
  const ok=await saveGameState(playerNick, game.getState());
  if(ok===null) showToastMsg('⚠️ 서버 저장 실패 (로컬엔 저장됨)');
}

// Nickname + server load
let playerNick=localStorage.getItem('rein_nick')||'';

async function onNickConfirmed(){
  updateNickDisplay();
  // Try server load
  const serverState=await loadGameState(playerNick);
  if(serverState && serverState.spinCount > game.spinCount){
    game.applyState(serverState);
    game.save();
    buildGrid(); renderGrid(); buildPaytable();
    buildConsumableBar(); updateBalance(); updateSpinCounter(); updateHistory();
    showToastMsg('☁️ 서버에서 불러옴!');
  }
}

function initNickname(){
  if(playerNick){
    document.getElementById('nick-modal').classList.add('hidden');
    onNickConfirmed();
    return;
  }
  const modal=document.getElementById('nick-modal');
  const input=document.getElementById('nick-input');
  const okBtn=document.getElementById('nick-ok');
  modal.classList.remove('hidden');
  input.focus();
  const confirm=()=>{
    const v=input.value.trim();
    if(!v) return;
    playerNick=v;
    localStorage.setItem('rein_nick',v);
    modal.classList.add('hidden');
    onNickConfirmed();
  };
  okBtn.addEventListener('click',confirm);
  input.addEventListener('keydown',e=>{ if(e.key==='Enter') confirm(); });
}

function updateNickDisplay(){
  const el=document.getElementById('player-nick');
  if(el) el.textContent=playerNick;
}

initNickname();

const gridEl=document.getElementById('grid');
let cellEls=[];

function buildGrid(){
  const n=game.gridSize;
  gridEl.innerHTML='';
  gridEl.style.gridTemplateColumns=`repeat(${n},1fr)`;
  cellEls=[];
  for(let r=0;r<n;r++){
    cellEls[r]=[];
    for(let c=0;c<n;c++){
      const el=document.createElement('div');
      el.className='cell';
      el.dataset.r=r;el.dataset.c=c;
      gridEl.appendChild(el);
      cellEls[r][c]=el;
    }
  }
  const sel=document.getElementById('grid-size-sel');
  sel.innerHTML='';
  [3,4,5].forEach(sz=>{
    const btn=document.createElement('button');
    btn.className='gs-btn'+(game.gridSize===sz?' active':'')+(game.unlockedGridSizes.has(sz)?'':' locked');
    btn.textContent=sz+'×'+sz;
    btn.disabled=!game.unlockedGridSizes.has(sz);
    btn.addEventListener('click',()=>{ if(game.setGridSize(sz)){ buildGrid();renderGrid(); } });
    sel.appendChild(btn);
  });
}

function getActiveEmojis(){ return [...game._pool].map(s=>s.e); }

function applySymClass(el,id){
  el.className='cell';
  const sym=SYM[id];
  if(sym?.special) el.classList.add('sp-'+sym.special);
}

function renderGrid(){
  const n=game.gridSize;
  for(let r=0;r<n;r++) for(let c=0;c<n;c++){
    cellEls[r][c].textContent=SYM[game.grid[r][c]].e;
    applySymClass(cellEls[r][c],game.grid[r][c]);
  }
}
buildGrid();
renderGrid();

// PAYTABLE
function buildPaytable(){
  const ptGrid=document.getElementById('pt-grid');
  ptGrid.innerHTML='';
  for(const s of game._pool){
    const d=document.createElement('div');
    d.className='pt-item'+(s.special==='mega'?' pt-mega':s.special?' pt-special':'');
    if(s.special&&s.special!=='wild'&&s.special!=='mega'){
      const desc=s.special==='bomb'?'+500~1500 scatter':s.special==='double'?'라인 ×2':'+500~3000 scatter';
      d.innerHTML=`<span class="pt-emoji">${s.e}</span><div class="pt-info"><div class="pt-name">${s.name}</div><div class="pt-vals">${desc}</div></div>`;
    } else if(s.special==='wild'){
      d.innerHTML=`<span class="pt-emoji">${s.e}</span><div class="pt-info"><div class="pt-name">${s.name}</div><div class="pt-vals">아무 심볼 대체</div></div>`;
    } else {
      d.innerHTML=`<span class="pt-emoji">${s.e}</span><div class="pt-info"><div class="pt-name">${s.name}</div><div class="pt-vals">3연속=×3 / 4=×8 / 5=×30<br>val:${s.val+game.extraSymVal}</div></div>`;
    }
    ptGrid.appendChild(d);
  }
}
buildPaytable();

// SHOP
const shopEl=document.getElementById('shop-content');
shopEl.addEventListener('click',e=>{
  const btn=e.target.closest('button[data-perm],button[data-con],button[data-grid],button[data-bingo],button[data-sup]');
  if(!btn||btn.disabled) return;
  const persist=()=>{ game.save(); serverSave(); };
  if(btn.dataset.sup){
    const id=btn.dataset.sup;
    const item=SUPPRESS_ITEMS.find(i=>i.id===id);
    if(game.buySuppressItem(id)){ updateBalance();buildShop();showUnlockPopup({e:item.e,name:item.name},item.desc);persist(); }
  } else if(btn.dataset.bingo){
    const id=btn.dataset.bingo;
    const item=BINGO_ITEMS.find(i=>i.id===id);
    if(game.buyBingo(id)){ updateBalance();buildShop();showUnlockPopup(item,item.desc);persist(); }
  } else if(btn.dataset.perm){
    const id=btn.dataset.perm;
    const item=PERMANENT_ITEMS.find(i=>i.id===id);
    if(game.unlockSymbol(id)){ updateBalance();buildShop();buildPaytable();showUnlockPopup(SYM[item.sym],item.desc);persist(); }
  } else if(btn.dataset.con){
    const id=btn.dataset.con;
    const qty=parseInt(btn.dataset.qty||'1');
    const item=CONSUMABLE_ITEMS.find(i=>i.id===id);
    if(game.buyConsumable(id,qty)){ updateBalance();buildShop();buildConsumableBar();showConBuyPopup(item,qty);persist(); }
  } else if(btn.dataset.grid){
    const id=btn.dataset.grid;
    const item=GRID_ITEMS.find(i=>i.id===id);
    if(game.buyGridItem(id)){
      updateBalance();buildShop();buildGrid();renderGrid();
      showUnlockPopup({e:item.e,name:item.name},item.desc);persist();
    }
  }
});

function buildShop(){
  shopEl.innerHTML='';

  const hg=document.createElement('div');
  hg.className='shop-section-title';hg.textContent='🔲 그리드 확장';
  shopEl.appendChild(hg);
  for(const item of GRID_ITEMS){
    const owned=game.unlockedGridSizes.has(item.size);
    const canAfford=game.balance>=item.price;
    const d=document.createElement('div');
    d.className='shop-item'+(owned?' shop-owned':'');
    const btn=document.createElement('button');
    btn.className='shop-btn'+(owned?' owned':canAfford?'':' poor');
    btn.dataset.grid=item.id;
    btn.disabled=owned;
    btn.textContent=owned?'보유중':'💰'+item.price;
    d.innerHTML=`<span class="shop-emoji">${item.e}</span><div class="shop-info"><div class="shop-name">${item.name}</div><div class="shop-desc">${item.desc}</div></div>`;
    d.appendChild(btn);shopEl.appendChild(d);
  }

  const h1=document.createElement('div');
  h1.className='shop-section-title';h1.textContent='🔓 영구 아이템 (심볼 해금)';
  shopEl.appendChild(h1);
  for(const item of PERMANENT_ITEMS){
    const sym=SYM[item.sym];
    const owned=game.unlockedSymIds.has(item.sym);
    const canAfford=game.balance>=item.price;
    const d=document.createElement('div');
    d.className='shop-item'+(owned?' shop-owned':'');
    const btn=document.createElement('button');
    btn.className='shop-btn'+(owned?' owned':canAfford?'':' poor');
    btn.dataset.perm=item.id;
    btn.disabled=owned;
    btn.textContent=owned?'보유중':'💰'+item.price;
    d.innerHTML=`<span class="shop-emoji">${sym.e}</span><div class="shop-info"><div class="shop-name">${sym.name}</div><div class="shop-desc">${item.desc}</div></div>`;
    d.appendChild(btn);shopEl.appendChild(d);
  }

  const hb=document.createElement('div');
  hb.className='shop-section-title';hb.textContent='🎯 콤보 보너스';
  shopEl.appendChild(hb);
  for(const item of BINGO_ITEMS){
    const owned=game.bingoPurchased;
    const canAfford=game.balance>=item.price;
    const d=document.createElement('div');
    d.className='shop-item'+(owned?' shop-owned':'');
    const btn=document.createElement('button');
    btn.className='shop-btn'+(owned?' owned':canAfford?'':' poor');
    btn.dataset.bingo=item.id;
    btn.disabled=owned;
    btn.textContent=owned?'보유중':'💰'+item.price;
    d.innerHTML=`<span class="shop-emoji">${item.e}</span><div class="shop-info"><div class="shop-name">${item.name}</div><div class="shop-desc">같은 심볼 여러 라인 동시 당첨 시<br><span style="color:#f0c020">페어(×4) 트리플(×10) 쿼드(×25) 퀸테트(×50)</span><br>전체 라인 당첨 = FULL BINGO 🎆</div></div>`;
    d.appendChild(btn);shopEl.appendChild(d);
  }

  const hSup=document.createElement('div');
  hSup.className='shop-section-title';hSup.textContent='📉 심볼 억제 (영구)';
  shopEl.appendChild(hSup);
  for(const item of SUPPRESS_ITEMS){
    const stack=game.suppressLevels?.[item.id]||0;
    const maxed=stack>=item.maxStack;
    const canAfford=game.balance>=item.price;
    const d=document.createElement('div');
    d.className='shop-item'+(maxed?' shop-owned':'');
    const btn=document.createElement('button');
    btn.className='shop-btn'+(maxed?' owned':canAfford?'':' poor');
    btn.dataset.sup=item.id;btn.disabled=maxed;
    btn.textContent=maxed?'MAX':'💰'+item.price;
    const bars=Array.from({length:item.maxStack},(_,i)=>`<span class="lvbar${i<stack?' filled':''}"></span>`).join('');
    d.innerHTML=`<span class="shop-emoji">${item.e}</span><div class="shop-info"><div class="shop-name">${item.name} <span style="color:var(--dim)">${stack}/${item.maxStack}</span></div><div class="shop-desc">${item.desc}</div><div class="lvbars" style="margin-top:4px">${bars}</div></div>`;
    d.appendChild(btn);shopEl.appendChild(d);
  }

  const h3=document.createElement('div');
  h3.className='shop-section-title';h3.textContent='⚗️ 소모 아이템';
  shopEl.appendChild(h3);
  for(const item of CONSUMABLE_ITEMS){
    const count=game.ownedConsumables[item.id]||0;
    const canAfford=game.balance>=item.price;
    const canAfford10=game.balance>=item.price*10;
    const d=document.createElement('div');
    d.className='shop-item';
    const btnWrap=document.createElement('div');btnWrap.style.cssText='display:flex;gap:4px;flex-shrink:0';
    const btn=document.createElement('button');
    btn.className='shop-btn'+(canAfford?'':' poor');
    btn.dataset.con=item.id;btn.dataset.qty='1';
    btn.textContent='💰'+item.price;
    const btn10=document.createElement('button');
    btn10.className='shop-btn'+(canAfford10?'':' poor');
    btn10.dataset.con=item.id;btn10.dataset.qty='10';
    btn10.textContent='×10';
    btnWrap.appendChild(btn);btnWrap.appendChild(btn10);
    d.innerHTML=`<span class="shop-emoji">${item.e}</span><div class="shop-info"><div class="shop-name">${item.name}${count>0?` <span class="own-count">×${count}</span>`:''}</div><div class="shop-desc">${item.desc}</div></div>`;
    d.appendChild(btnWrap);shopEl.appendChild(d);
  }
}

// Consumable bar — toggle pending
function buildConsumableBar(){
  const bar=document.getElementById('con-bar');
  bar.innerHTML='';
  for(const [id,count] of Object.entries(game.ownedConsumables)){
    if(!count) continue;
    const item=CONSUMABLE_ITEMS.find(i=>i.id===id);
    if(!item) continue;
    const btn=document.createElement('button');
    const isPending=game.pendingConsumable===id;
    btn.className='con-use-btn'+(isPending?' con-pending':'');
    btn.title=isPending?item.name+' 취소 (대기중)':item.name+' 활성화';
    btn.innerHTML=`${item.e}<span class="con-count">×${count}</span>${isPending?'<span class="con-active-dot"></span>':''}`;
    btn.addEventListener('click',()=>{
      const r=game.setPendingConsumable(id);
      buildConsumableBar();
      if(r==='set') showEffectToast(item);
    });
    bar.appendChild(btn);
  }
}

// Popups
function showUnlockPopup(sym,desc){
  const popup=document.getElementById('unlock-popup');
  document.getElementById('up-emoji').textContent=sym.e;
  document.getElementById('up-name').textContent=sym.name+' 해금!';
  document.getElementById('up-desc').textContent=desc;
  popup.classList.remove('hidden');
  popup.classList.add('popin');
  setTimeout(()=>popup.classList.remove('popin'),500);
}
function showUpgradePopup(upg,newLevel){
  const popup=document.getElementById('unlock-popup');
  document.getElementById('up-emoji').textContent=upg.e;
  document.getElementById('up-name').textContent=upg.name+' Lv.'+newLevel+'!';
  document.getElementById('up-desc').textContent=upg.desc+(newLevel>=upg.maxLevel?' (MAX 달성!)':'');
  popup.classList.remove('hidden');
  popup.classList.add('popin');
  setTimeout(()=>popup.classList.remove('popin'),500);
}
function showConBuyPopup(item,qty=1){
  const popup=document.getElementById('unlock-popup');
  document.getElementById('up-emoji').textContent=item.e;
  document.getElementById('up-name').textContent=item.name+(qty>1?` ×${qty}`:'')+' 구매!';
  document.getElementById('up-desc').textContent=item.desc;
  popup.classList.remove('hidden');
  popup.classList.add('popin');
  setTimeout(()=>popup.classList.remove('popin'),500);
}
document.getElementById('up-close').addEventListener('click',()=>{
  document.getElementById('unlock-popup').classList.add('hidden');
});

function showEffectToast(item){
  const t=document.getElementById('effect-toast');
  t.textContent=item.e+' '+item.name+' 활성화!';
  t.classList.remove('hidden');t.classList.add('toast-in');
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>{t.classList.add('hidden');t.classList.remove('toast-in');},2200);
}

// Multiplier modal with probabilities
document.getElementById('mult-btn').addEventListener('click',()=>{ buildMultModal();document.getElementById('mult-modal').classList.remove('hidden'); });
document.getElementById('mult-close').addEventListener('click',()=>document.getElementById('mult-modal').classList.add('hidden'));
document.getElementById('mult-modal').addEventListener('click',e=>{ if(e.target===document.getElementById('mult-modal')) document.getElementById('mult-modal').classList.add('hidden'); });

function buildMultModal(){
  const multBonus=1+(game.upgradeLevels['up_match_mult']||0)*0.20;
  const valBonus=1+(game.upgradeLevels['up_sym_val']||0)*0.15;
  const probs=game.getSymbolProbabilities();

  const matchEl=document.getElementById('mult-match-table');
  const rows=[{label:'3개 연속',base:3},{label:'4개 연속',base:8},{label:'5개 연속',base:30}];
  matchEl.innerHTML=rows.map(r=>{
    const actual=Math.round(r.base*multBonus*10)/10;
    return `<div class="mult-row">
      <span class="mult-label">${r.label}</span>
      <span class="mult-val">×${actual}${multBonus>1?` <span class="mult-boosted">(기본 ×${r.base})</span>`:''}</span>
    </div>`;
  }).join('');

  const symEl=document.getElementById('mult-sym-table');
  symEl.innerHTML=game._pool.map(s=>{
    const prob=probs[s.id]||0;
    const pct=(prob*100).toFixed(1)+'%';
    const row3prob=Math.pow(prob,3)*100;
    const probStr=`<span class="mult-prob">${pct} / 3줄:${row3prob.toFixed(2)}%</span>`;
    if(s.special==='wild'||s.special==='mega'){
      const label=s.special==='wild'?'대체 심볼':`잭팟 val:3000`;
      return `<div class="mult-row"><span class="mult-label">${s.e} ${s.name} ${probStr}</span><span class="mult-val">${label}</span></div>`;
    }
    if(s.special) return `<div class="mult-row"><span class="mult-label">${s.e} ${s.name} ${probStr}</span><span class="mult-val">스캐터</span></div>`;
    const effectiveVal=Math.round((s.val+game.extraSymVal)*valBonus*10)/10;
    const base=s.val+game.extraSymVal;
    return `<div class="mult-row">
      <span class="mult-label">${s.e} ${s.name} ${probStr}</span>
      <span class="mult-val">${effectiveVal}${valBonus>1||game.extraSymVal>0?` <span class="mult-boosted">(기본 ${base})</span>`:''}</span>
    </div>`;
  }).join('');
}

// Tabs
document.getElementById('tab-slot').addEventListener('click',()=>switchTab('slot'));
document.getElementById('tab-shop').addEventListener('click',()=>switchTab('shop'));
document.getElementById('tab-upg').addEventListener('click',()=>switchTab('upg'));
document.getElementById('tab-rank').addEventListener('click',()=>switchTab('rank'));

function switchTab(tab){
  ['slot','shop','upg','rank'].forEach(t=>{
    document.getElementById('tab-'+t).classList.toggle('active',t===tab);
    document.getElementById(t+'-view').classList.toggle('hidden',t!==tab);
  });
  if(tab==='slot') buildConsumableBar();
  if(tab==='shop') buildShop();
  if(tab==='upg') buildUpgradeTab();
  if(tab==='rank') buildRank();
}

async function buildRank(){
  const el=document.getElementById('rank-content');
  el.innerHTML='<div class="rank-loading">로딩 중...</div>';
  const rows=await getLeaderboard();
  if(!rows||!rows.length){ el.innerHTML='<div class="rank-loading">데이터 없음</div>'; return; }
  let html='<div class="rank-title">🏆 LEADERBOARD — 최대 코인 기준 <button class="rank-refresh-btn" onclick="buildRank()">🔄</button></div>';
  html+='<div class="rank-header"><span class="rank-pos">#</span><span class="rank-nick">닉네임</span><span class="rank-col">최대코인</span><span class="rank-col">현재</span><span class="rank-col">횟수</span></div>';
  rows.forEach((row,i)=>{
    const isMe=row.nickname===playerNick;
    const medals=['🥇','🥈','🥉'];
    const pos=medals[i]||(i+1)+'';
    html+=`<div class="rank-row${isMe?' rank-me':''}">
      <span class="rank-pos">${pos}</span>
      <span class="rank-nick">${row.nickname}</span>
      <span class="rank-col rank-max">${(row.max_coins||0).toLocaleString()}</span>
      <span class="rank-col rank-bal">${(row.balance||0).toLocaleString()}</span>
      <span class="rank-col rank-spins">${(row.spin_count||0).toLocaleString()}</span>
    </div>`;
  });
  el.innerHTML=html;
}

function buildUpgradeTab(){
  const el=document.getElementById('upg-content');
  el.innerHTML='';

  // Active perks
  if(game.activePerks.length>0){
    const h=document.createElement('div');
    h.className='shop-section-title';h.textContent='🎯 특수 능력 (로그라이크)';
    el.appendChild(h);
    const wrap=document.createElement('div');wrap.className='perks-wrap';
    game.activePerks.forEach(pid=>{
      const perk=MILESTONE_PERKS.find(p=>p.id===pid);
      if(!perk) return;
      const d=document.createElement('div');d.className='perk-chip';
      d.innerHTML=`<span class="perk-chip-e">${perk.e}</span><span class="perk-chip-name">${perk.name}</span>`;
      d.title=perk.desc;wrap.appendChild(d);
    });
    el.appendChild(wrap);
    const sp=document.createElement('div');sp.style.height='8px';el.appendChild(sp);
  }

  // Upgrades
  const hUpg=document.createElement('div');hUpg.className='shop-section-title';hUpg.textContent='⬆️ 업그레이드';el.appendChild(hUpg);
  for(const upg of UPGRADES){
    const lv=game.upgradeLevels[upg.id]||0;
    const maxed=lv>=upg.maxLevel;
    const price=upgradePrice(upg,lv);
    const canAfford=game.balance>=price;
    const multBonus=1+(game.upgradeLevels['up_match_mult']||0)*0.20;
    const valBonus=1+(game.upgradeLevels['up_sym_val']||0)*0.15;
    const scatterBonus=1+(game.upgradeLevels['up_scatter_bonus']||0)*0.25;
    const megaBns=1+(game.upgradeLevels['up_mega_jackpot']||0)*0.30;
    const wildPow=game.upgradeLevels['up_wild_power']||0;
    const suppressLevel=game.upgradeLevels['up_sym_suppress']||0;
    const suppressPct=Math.round(Math.min(95,suppressLevel*12));
    const statMap={
      up_match_mult:`배율 ×${multBonus.toFixed(2)}`,
      up_sym_val:`심볼가치 ×${valBonus.toFixed(2)}`,
      up_scatter_bonus:`스캐터 ×${scatterBonus.toFixed(2)}`,
      up_mega_jackpot:`MEGA ×${megaBns.toFixed(2)}`,
      up_wild_power:`WILD +${wildPow}카운트`,
      up_sym_suppress:`하위심볼 -${suppressPct}%`,
    };
    const bars=Array.from({length:upg.maxLevel},(_,i)=>`<span class="lvbar${i<lv?' filled':''}"></span>`).join('');
    const d=document.createElement('div');d.className='upg-card'+(maxed?' maxed':'');
    const btn=document.createElement('button');
    btn.className='shop-btn'+(maxed?' owned':canAfford?'':' poor');
    btn.dataset.upg=upg.id;btn.disabled=maxed;
    btn.textContent=maxed?'MAX':'💰'+price;
    d.innerHTML=`<div class="upg-head"><span class="upg-icon">${upg.e}</span><div class="upg-meta"><div class="upg-name">${upg.name}</div><div class="upg-stat">${statMap[upg.id]}</div><div class="lvbars">${bars}</div></div></div><div class="upg-desc">${upg.desc}</div>`;
    d.appendChild(btn);el.appendChild(d);
  }
  el.querySelectorAll('[data-upg]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id=btn.dataset.upg;
      const upg=UPGRADES.find(u=>u.id===id);
      if(game.buyUpgrade(id)){ updateBalance();buildUpgradeTab();showUpgradePopup(upg,game.upgradeLevels[id]);game.save();serverSave(); }
    });
  });

  // Settings / Save / Reset
  const hSet=document.createElement('div');hSet.className='shop-section-title';hSet.textContent='⚙️ 설정';el.appendChild(hSet);
  const settingsWrap=document.createElement('div');settingsWrap.className='settings-wrap';

  const saveBtn=document.createElement('button');
  saveBtn.className='settings-btn';saveBtn.textContent='💾 저장';
  saveBtn.addEventListener('click',()=>{ game.save(); showToastMsg('저장 완료!'); });

  const cacheBtn=document.createElement('button');
  cacheBtn.className='settings-btn';cacheBtn.textContent='🗂️ 캐시 초기화';
  cacheBtn.addEventListener('click',async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.map(k=>caches.delete(k)));
    showToastMsg('캐시 삭제 완료! 새로고침합니다...');
    setTimeout(()=>location.reload(),1200);
  });

  const resetBtn=document.createElement('button');
  resetBtn.className='settings-btn settings-btn-danger';resetBtn.textContent='🗑️ 완전 초기화';
  resetBtn.addEventListener('click',()=>{
    if(confirm('모든 진행상황을 초기화할까요? 되돌릴 수 없습니다.')){ localStorage.removeItem('rein_save');location.reload(); }
  });

  settingsWrap.appendChild(saveBtn);settingsWrap.appendChild(cacheBtn);settingsWrap.appendChild(resetBtn);el.appendChild(settingsWrap);
}

function showToastMsg(msg){
  const t=document.getElementById('effect-toast');
  t.textContent=msg;t.classList.remove('hidden');t.classList.add('toast-in');
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>{t.classList.add('hidden');t.classList.remove('toast-in');},2000);
}

// LEVER
const lever=document.getElementById('lever');
lever.addEventListener('click',()=>{ if(!game.spinning) pullLever(); });
lever.addEventListener('touchend',e=>{ e.preventDefault();if(!game.spinning) pullLever(); });

function pullLever(){
  lever.classList.add('pulled');
  setTimeout(()=>lever.classList.remove('pulled'),400);
  setTimeout(doSpin,150);
}

async function doSpin(){
  if(!game.canSpin()){
    lever.classList.add('lever-deny');
    setTimeout(()=>lever.classList.remove('lever-deny'),500);
    return;
  }
  game.spinning=true;
  const n=game.gridSize;
  cellEls.flat().forEach(c=>c.className='cell');
  document.getElementById('win-banner').classList.add('hidden');
  document.getElementById('win-lines').innerHTML='';

  const usedItem=game.activatePendingConsumable();
  if(usedItem) buildConsumableBar();

  const {grid,wasFree}=game.spin();
  updateBalance();
  updateSpinCounter();

  const emojis=getActiveEmojis();
  const ivs=cellEls.map(row=>row.map(el=>{
    el.classList.add('spinning');
    return setInterval(()=>{ el.textContent=emojis[Math.floor(Math.random()*emojis.length)]; },55);
  }));

  for(let c=0;c<n;c++){
    await delay(c===0?900:200);
    for(let r=0;r<n;r++){
      clearInterval(ivs[r][c]);
      const el=cellEls[r][c];
      el.classList.remove('spinning');
      el.textContent=SYM[grid[r][c]].e;
      applySymClass(el,grid[r][c]);
      el.classList.add('landed');
      setTimeout(()=>el.classList.remove('landed'),350);
    }
  }

  await delay(450);
  const result=game.resolve();
  game.save();     // localStorage (fast)
  serverSave();    // Supabase (async)

  await revealWinsSequentially(result);

  updateBalance();
  updateHistory();
  buildConsumableBar();
  game.spinning=false;

  if(game.pendingMilestone) showMilestoneModal(game.pendingMilestone);
}

function buildRevealList(result){
  const list=[];
  const symWins=[...result.wins].map(w=>{
    const payout=Math.round((SYM[w.sym].val+game.extraSymVal)*(1+(game.upgradeLevels['up_sym_val']||0)*0.15)*w.mult*result.multiplier);
    return{type:'sym',w,payout,cells:[...w.cells]};
  }).sort((a,b)=>a.payout-b.payout);
  list.push(...symWins);
  for(const s of result.scatters) list.push({type:'scatter',s});
  if(result.doubleActive) list.push({type:'double'});
  if(result.multiplier>1) list.push({type:'multiplier'});
  const mega=result.scatters.filter(s=>s.sym.special==='mega').length;
  if(mega>=2) list.push({type:'mega',mega});
  return list;
}

async function revealWinsSequentially(result){
  const wlEl=document.getElementById('win-lines');
  wlEl.innerHTML='';

  if(result.total===0&&!result.shielded) return;

  const list=buildRevealList(result);
  let runningTotal=0;

  for(const item of list){
    await delay(700);
    if(item.type==='sym'){
      item.cells.forEach(([r,c])=>{
        cellEls[r][c].classList.add('win','win-flash');
        setTimeout(()=>cellEls[r][c].classList.remove('win-flash'),600);
      });
      runningTotal+=item.payout;
      const tag=document.createElement('span');
      tag.className='wl-item wl-line wl-reveal';
      tag.textContent=`${SYM[item.w.sym].e} ${item.w.name||''} ${item.w.count}개×${item.w.mult} +${item.payout}`;
      wlEl.appendChild(tag);
      updateBannerRunning(runningTotal);
    } else if(item.type==='scatter'){
      const s=item.s;
      cellEls[s.r][s.c].classList.add('win','win-flash');
      setTimeout(()=>cellEls[s.r][s.c].classList.remove('win-flash'),400);
      const tag=document.createElement('span');tag.className='wl-item wl-scatter wl-reveal';
      tag.textContent=`${s.sym.e} ${s.sym.name} 스캐터`;
      wlEl.appendChild(tag);
    } else if(item.type==='double'){
      const tag=document.createElement('span');tag.className='wl-item wl-double wl-reveal';
      tag.textContent='⚡ 전체 ×2!';wlEl.appendChild(tag);
    } else if(item.type==='multiplier'){
      const tag=document.createElement('span');tag.className='wl-item wl-double wl-reveal';
      tag.textContent=`✖️ 당첨금 ×${result.multiplier}`;wlEl.appendChild(tag);
    } else if(item.type==='mega'){
      const tag=document.createElement('span');tag.className='wl-item wl-mega wl-reveal';
      tag.textContent=`🌟 MEGA JACKPOT ×${item.mega}`;wlEl.appendChild(tag);
    }
    wlEl.scrollLeft=wlEl.scrollWidth;
  }

  // Perk bonuses
  for(const [key,label] of [['chargeBonus','⚡ 패배 충전'],['streakBonus','🔥 연승 보너스'],['fruitBonus','🍓 과일 콤보']]){
    if(result[key]>0){
      await delay(700);
      const tag=document.createElement('span');tag.className='wl-item wl-perk wl-reveal';
      tag.textContent=`${label} +${result[key]}`;
      wlEl.appendChild(tag);wlEl.scrollLeft=wlEl.scrollWidth;
    }
  }

  // Combo (bingo) reveals — per symbol group
  for(const grp of (result.bingoGroups||[])){
    await delay(700);
    const tag=document.createElement('span');tag.className='wl-item wl-bingo wl-reveal';
    tag.textContent=`🎯 ${SYM[grp.sym].e} ${SYM[grp.sym].name} ${grp.name}! +${grp.bonus}`;
    wlEl.appendChild(tag);wlEl.scrollLeft=wlEl.scrollWidth;
  }
  if(result.fullBingo){
    await delay(700);
    const tag=document.createElement('span');tag.className='wl-item wl-bingo wl-reveal';
    tag.textContent='🎆 FULL BINGO!!! 전체 라인 달성!';
    wlEl.appendChild(tag);wlEl.scrollLeft=wlEl.scrollWidth;
    showFireworks();
  }

  if(result.total>0) await showBannerFinal(result);
  if(result.shielded&&result.total===0) showBannerShield();
}

function updateBannerRunning(running){
  const banner=document.getElementById('win-banner');
  document.getElementById('wb-amount').textContent='+'+running+' coins';
  document.getElementById('wb-detail').textContent='집계 중...';
  banner.classList.remove('hidden');
}

async function showBannerFinal(result){
  await delay(200);
  const banner=document.getElementById('win-banner');
  const amtEl=document.getElementById('wb-amount');
  amtEl.classList.add('count-up');
  setTimeout(()=>amtEl.classList.remove('count-up'),600);
  document.getElementById('wb-amount').textContent='+'+result.total+' coins';
  const parts=[];
  if(result.symWin) parts.push('심볼:+'+result.symWin+(result.multiplier>1?` (×${result.multiplier})`:''));
  if(result.scatterWin) parts.push('스캐터:+'+result.scatterWin);
  if(result.chargeBonus) parts.push('충전:+'+result.chargeBonus);
  if(result.streakBonus) parts.push('연승:+'+result.streakBonus);
  if(result.fruitBonus) parts.push('콤보:+'+result.fruitBonus);
  if(result.bingoBonus) parts.push('빙고:+'+result.bingoBonus);
  document.getElementById('wb-detail').textContent=parts.join(' / ');
  banner.classList.remove('hidden');
}

function showBannerShield(){
  const banner=document.getElementById('win-banner');
  document.getElementById('wb-amount').textContent='🛡️ 보호 발동';
  document.getElementById('wb-detail').textContent='패배시 코인 반환';
  banner.classList.remove('hidden');
}

// Milestone perk modal
function showMilestoneModal(spinCount){
  const modal=document.getElementById('milestone-modal');
  const choices=game.getMilestoneChoices();
  if(!choices.length){ game.pendingMilestone=null;return; }
  document.getElementById('ms-title').textContent='🎯 '+spinCount+'회 달성!';
  document.getElementById('ms-sub').textContent='특수 능력을 하나 선택하세요 — 영구 적용';
  const perksEl=document.getElementById('ms-perks');
  perksEl.innerHTML='';
  choices.forEach(perk=>{
    const card=document.createElement('div');card.className='ms-perk-card';
    card.innerHTML=`<div class="ms-perk-e">${perk.e}</div><div class="ms-perk-name">${perk.name}</div><div class="ms-perk-desc">${perk.desc}</div>`;
    card.addEventListener('click',()=>{
      game.choosePerk(perk.id);
      modal.classList.add('hidden');
      buildPaytable();updateSpinCounter();
      showUnlockPopup({e:perk.e,name:perk.name},perk.desc);
      game.save(); serverSave();
      if(autoSpinActive) scheduleAutoSpin();
    });
    perksEl.appendChild(card);
  });
  modal.classList.remove('hidden');
}

function showFireworks(){
  const overlay=document.createElement('div');
  overlay.id='fireworks-overlay';
  document.body.appendChild(overlay);
  function burst(cx,cy){
    for(let i=0;i<12;i++){
      const p=document.createElement('div');p.className='fw-particle';
      const angle=Math.random()*360;
      const dist=40+Math.random()*80;
      p.style.left=cx+'%';p.style.top=cy+'%';
      p.style.background=`hsl(${Math.random()*360},100%,65%)`;
      p.style.setProperty('--dx',Math.cos(angle*Math.PI/180)*dist+'px');
      p.style.setProperty('--dy',Math.sin(angle*Math.PI/180)*dist+'px');
      p.style.animationDuration=(.6+Math.random()*.6)+'s';
      overlay.appendChild(p);
    }
  }
  burst(30,30);burst(70,25);burst(50,50);burst(20,65);burst(80,60);
  setTimeout(()=>{burst(40,20);burst(60,70);burst(25,45);},600);
  setTimeout(()=>overlay.remove(),3500);
}

function updateHistory(){
  const el=document.getElementById('history');
  el.innerHTML=game.history.map(h=>{
    const cls=h.win>0?'hi win':'hi lose';
    const txt=h.win>0?`+${h.win}`:`-${game.bet}`;
    return `<span class="${cls}">${txt}</span>`;
  }).join('');
}

function updateBalance(){
  document.getElementById('balance').textContent=game.balance.toLocaleString();
  updateAutoSpinBtn();
}

// AUTO SPIN — unlocked at 100,000 coins ever reached
let autoSpinActive=false;
let autoSpinTimer=null;

function updateAutoSpinBtn(){
  const unlocked=game.maxCoins>=100000;
  let btn=document.getElementById('auto-spin-btn');
  if(!unlocked){ if(btn) btn.remove(); return; }
  if(!btn){
    btn=document.createElement('button');
    btn.id='auto-spin-btn';
    btn.className='auto-spin-btn';
    btn.addEventListener('click',toggleAutoSpin);
    document.getElementById('controls').appendChild(btn);
  }
  btn.textContent=autoSpinActive?'⏹ AUTO':'▶ AUTO';
  btn.classList.toggle('auto-active',autoSpinActive);
}

function toggleAutoSpin(){
  autoSpinActive=!autoSpinActive;
  updateAutoSpinBtn();
  if(autoSpinActive) scheduleAutoSpin();
  else{ clearTimeout(autoSpinTimer); autoSpinTimer=null; }
}

function scheduleAutoSpin(){
  if(!autoSpinActive) return;
  if(game.spinning||game.pendingMilestone){ autoSpinTimer=setTimeout(scheduleAutoSpin,300); return; }
  if(!game.canSpin()){ autoSpinActive=false; updateAutoSpinBtn(); return; }
  pullLever();
  autoSpinTimer=setTimeout(scheduleAutoSpin,2800);
}
function updateSpinCounter(){
  const el=document.getElementById('spin-counter');
  if(!el) return;
  const n=game.spinCount;
  const next=MILESTONES.find(m=>m>n)||null;
  el.textContent='SPIN '+n+(next?`  → 🎯${next}`:'');
}

updateBalance();
updateSpinCounter();
buildConsumableBar();
updateHistory();
