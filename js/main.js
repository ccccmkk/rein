const game=new SlotGame();
const delay=ms=>new Promise(r=>setTimeout(r,ms));

// Nickname
let playerNick = localStorage.getItem('rein_nick')||'';

function initNickname(){
  if(playerNick){
    document.getElementById('nick-modal').classList.add('hidden');
    updateNickDisplay();
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
    updateNickDisplay();
  };
  okBtn.addEventListener('click',confirm);
  input.addEventListener('keydown',e=>{ if(e.key==='Enter') confirm(); });
}

function updateNickDisplay(){
  const el=document.getElementById('player-nick');
  if(el) el.textContent=playerNick;
}

async function submitScore(){
  if(!playerNick) return;
  await saveScore(playerNick, game.balance);
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
  // grid size selector buttons
  const sel=document.getElementById('grid-size-sel');
  sel.innerHTML='';
  [3,4,5].forEach(n=>{
    const btn=document.createElement('button');
    btn.className='gs-btn'+(game.gridSize===n?' active':'')+(game.unlockedGridSizes.has(n)?'':' locked');
    btn.textContent=n+'×'+n;
    btn.disabled=!game.unlockedGridSizes.has(n);
    btn.addEventListener('click',()=>{
      if(game.setGridSize(n)){ buildGrid(); renderGrid(); }
    });
    sel.appendChild(btn);
  });
}

function getActiveEmojis(){
  return [...game._pool].map(s=>s.e);
}

function applySymClass(el,id){
  el.className='cell';
  const sym=SYM[id];
  if(sym?.special) el.classList.add('sp-'+sym.special);
}

function renderGrid(){
  const n=game.gridSize;
  for(let r=0;r<n;r++) for(let c=0;c<n;c++){
    const el=cellEls[r][c];
    el.textContent=SYM[game.grid[r][c]].e;
    applySymClass(el,game.grid[r][c]);
  }
}
buildGrid();
renderGrid();

// PAYTABLE (dynamic — shows only unlocked)
function buildPaytable(){
  const ptGrid=document.getElementById('pt-grid');
  ptGrid.innerHTML='';
  for(const s of game._pool){
    const d=document.createElement('div');
    d.className='pt-item'+(s.special==='mega'?' pt-mega':s.special?' pt-special':'');
    if(s.special&&s.special!=='wild'&&s.special!=='mega'){
      const desc=s.special==='bomb'?'+100~300 scatter':s.special==='double'?'라인 ×2':'+100~600 scatter';
      d.innerHTML=`<span class="pt-emoji">${s.e}</span><div class="pt-info"><div class="pt-name">${s.name}</div><div class="pt-vals">${desc}</div></div>`;
    } else if(s.special==='wild'){
      d.innerHTML=`<span class="pt-emoji">${s.e}</span><div class="pt-info"><div class="pt-name">${s.name}</div><div class="pt-vals">아무 심볼 대체</div></div>`;
    } else {
      d.innerHTML=`<span class="pt-emoji">${s.e}</span><div class="pt-info"><div class="pt-name">${s.name}</div><div class="pt-vals">왼쪽연속 3=×3 4=×8 5=×30<br>val:${s.val}</div></div>`;
    }
    ptGrid.appendChild(d);
  }
}
buildPaytable();

// SHOP — event delegation on container
const shopEl=document.getElementById('shop-content');
shopEl.addEventListener('click',e=>{
  const btn=e.target.closest('button[data-perm],button[data-con],button[data-grid]');
  if(!btn||btn.disabled) return;
  if(btn.dataset.perm){
    const id=btn.dataset.perm;
    const item=PERMANENT_ITEMS.find(i=>i.id===id);
    if(game.unlockSymbol(id)){
      updateBalance();
      buildShop();
      buildPaytable();
      showUnlockPopup(SYM[item.sym], item.desc);
    }
  } else if(btn.dataset.con){
    const id=btn.dataset.con;
    const item=CONSUMABLE_ITEMS.find(i=>i.id===id);
    if(game.buyConsumable(id)){
      updateBalance();
      buildShop();
      showConBuyPopup(item);
    }
  } else if(btn.dataset.grid){
    const id=btn.dataset.grid;
    const item=GRID_ITEMS.find(i=>i.id===id);
    if(game.buyGridItem(id)){
      updateBalance();
      buildShop();
      showUnlockPopup({e:item.e,name:item.name}, item.desc);
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
    d.appendChild(btn);
    shopEl.appendChild(d);
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
    d.appendChild(btn);
    shopEl.appendChild(d);
  }

  const h3=document.createElement('div');
  h3.className='shop-section-title';h3.textContent='⚗️ 소모 아이템';
  shopEl.appendChild(h3);

  for(const item of CONSUMABLE_ITEMS){
    const count=game.ownedConsumables[item.id]||0;
    const canAfford=game.balance>=item.price;
    const d=document.createElement('div');
    d.className='shop-item';
    const btn=document.createElement('button');
    btn.className='shop-btn'+(canAfford?'':' poor');
    btn.dataset.con=item.id;
    btn.textContent='💰'+item.price;
    d.innerHTML=`<span class="shop-emoji">${item.e}</span><div class="shop-info"><div class="shop-name">${item.name}${count>0?` <span class="own-count">×${count}</span>`:''}</div><div class="shop-desc">${item.desc}</div></div>`;
    d.appendChild(btn);
    shopEl.appendChild(d);
  }
}

// Consumable inventory bar
function buildConsumableBar(){
  const bar=document.getElementById('con-bar');
  bar.innerHTML='';
  for(const [id,count] of Object.entries(game.ownedConsumables)){
    if(!count) continue;
    const item=CONSUMABLE_ITEMS.find(i=>i.id===id);
    if(!item) continue;
    const btn=document.createElement('button');
    btn.className='con-use-btn';
    btn.title=item.name+' 사용';
    btn.innerHTML=`${item.e}<span class="con-count">×${count}</span>`;
    btn.addEventListener('click',()=>{
      if(game.useConsumable(id)){
        buildConsumableBar();
        showEffectToast(item);
      }
    });
    bar.appendChild(btn);
  }
}

// Unlock popup
function showUnlockPopup(sym, desc){
  const popup=document.getElementById('unlock-popup');
  document.getElementById('up-emoji').textContent=sym.e;
  document.getElementById('up-name').textContent=sym.name+' 해금!';
  document.getElementById('up-desc').textContent=desc;
  popup.classList.remove('hidden');
  popup.classList.add('popin');
  setTimeout(()=>popup.classList.remove('popin'),500);
}

function showUpgradePopup(upg, newLevel){
  const popup=document.getElementById('unlock-popup');
  document.getElementById('up-emoji').textContent=upg.e;
  document.getElementById('up-name').textContent=upg.name+' Lv.'+newLevel+'!';
  document.getElementById('up-desc').textContent=upg.desc+(newLevel>=upg.maxLevel?' (MAX 달성!)':'');
  popup.classList.remove('hidden');
  popup.classList.add('popin');
  setTimeout(()=>popup.classList.remove('popin'),500);
}

function showConBuyPopup(item){
  const popup=document.getElementById('unlock-popup');
  document.getElementById('up-emoji').textContent=item.e;
  document.getElementById('up-name').textContent=item.name+' 구매!';
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
  t.classList.remove('hidden');
  t.classList.add('toast-in');
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>{t.classList.add('hidden');t.classList.remove('toast-in');},2200);
}

// Tab switching
// Multiplier modal
document.getElementById('mult-btn').addEventListener('click',()=>{
  buildMultModal();
  document.getElementById('mult-modal').classList.remove('hidden');
});
document.getElementById('mult-close').addEventListener('click',()=>{
  document.getElementById('mult-modal').classList.add('hidden');
});

function buildMultModal(){
  const multBonus = 1+(game.upgradeLevels['up_match_mult']||0)*0.20;
  const valBonus  = 1+(game.upgradeLevels['up_sym_val']||0)*0.15;

  // Match table
  const matchEl=document.getElementById('mult-match-table');
  const rows=[
    {label:'3개 연속', base:3},
    {label:'4개 연속', base:8},
    {label:'5개 연속', base:30},
  ];
  matchEl.innerHTML=rows.map(r=>{
    const actual=Math.round(r.base*multBonus*10)/10;
    return `<div class="mult-row">
      <span class="mult-label">${r.label}</span>
      <span class="mult-val">×${actual}${multBonus>1?` <span class="mult-boosted">(기본 ×${r.base})</span>`:''}</span>
    </div>`;
  }).join('');

  // Symbol table
  const symEl=document.getElementById('mult-sym-table');
  symEl.innerHTML=game._pool.filter(s=>!s.special||s.special==='mega').map(s=>{
    const effectiveVal=Math.round(s.val*valBonus*10)/10;
    return `<div class="mult-row">
      <span class="mult-label">${s.e} ${s.name}</span>
      <span class="mult-val">${effectiveVal}${valBonus>1?` <span class="mult-boosted">(기본 ${s.val})</span>`:''}</span>
    </div>`;
  }).join('');
}

document.getElementById('tab-slot').addEventListener('click',()=>switchTab('slot'));
document.getElementById('tab-shop').addEventListener('click',()=>switchTab('shop'));
document.getElementById('tab-upg').addEventListener('click',()=>switchTab('upg'));

function switchTab(tab){
  ['slot','shop','upg'].forEach(t=>{
    document.getElementById('tab-'+t).classList.toggle('active',t===tab);
    document.getElementById(t+'-view').classList.toggle('hidden',t!==tab);
  });
  if(tab==='shop') buildShop();
  if(tab==='upg') buildUpgradeTab();
}

function buildUpgradeTab(){
  const el=document.getElementById('upg-content');
  el.innerHTML='';
  for(const upg of UPGRADES){
    const lv=game.upgradeLevels[upg.id]||0;
    const maxed=lv>=upg.maxLevel;
    const price=upgradePrice(upg,lv);
    const canAfford=game.balance>=price;
    const multBonus = 1+(game.upgradeLevels['up_match_mult']||0)*0.20;
    const valBonus  = 1+(game.upgradeLevels['up_sym_val']||0)*0.15;
    const scatterBonus=1+(game.upgradeLevels['up_scatter_bonus']||0)*0.25;
    const megaBonus=1+(game.upgradeLevels['up_mega_jackpot']||0)*0.30;
    const wildPow=game.upgradeLevels['up_wild_power']||0;
    const statMap={
      up_match_mult:`배율 ×${multBonus.toFixed(2)}`,
      up_sym_val:`심볼가치 ×${valBonus.toFixed(2)}`,
      up_scatter_bonus:`스캐터 ×${scatterBonus.toFixed(2)}`,
      up_mega_jackpot:`MEGA ×${megaBonus.toFixed(2)}`,
      up_wild_power:`WILD +${wildPow}카운트`,
    };
    const bars=Array.from({length:upg.maxLevel},(_,i)=>
      `<span class="lvbar${i<lv?' filled':''}"></span>`).join('');
    const d=document.createElement('div');
    d.className='upg-card'+(maxed?' maxed':'');
    const btn=document.createElement('button');
    btn.className='shop-btn'+(maxed?' owned':canAfford?'':' poor');
    btn.dataset.upg=upg.id;
    btn.disabled=maxed;
    btn.textContent=maxed?'MAX':'💰'+price;
    d.innerHTML=`
      <div class="upg-head">
        <span class="upg-icon">${upg.e}</span>
        <div class="upg-meta">
          <div class="upg-name">${upg.name}</div>
          <div class="upg-stat">${statMap[upg.id]}</div>
          <div class="lvbars">${bars}</div>
        </div>
      </div>
      <div class="upg-desc">${upg.desc}</div>`;
    d.appendChild(btn);
    el.appendChild(d);
  }
  el.querySelectorAll('[data-upg]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id=btn.dataset.upg;
      const upg=UPGRADES.find(u=>u.id===id);
      if(game.buyUpgrade(id)){
        updateBalance();
        buildUpgradeTab();
        showUpgradePopup(upg,game.upgradeLevels[id]);
      }
    });
  });
}

async function buildRank(){
  const el=document.getElementById('rank-content');
  el.innerHTML='<div class="rank-loading">불러오는 중...</div>';
  const rows=await getLeaderboard();
  if(!rows||!rows.length){ el.innerHTML='<div class="rank-loading">아직 기록 없음</div>'; return; }
  const myNick=playerNick;
  el.innerHTML=`
    <div class="rank-title">🏆 TOP 10</div>
    ${rows.map((r,i)=>`
      <div class="rank-row${r.nickname===myNick?' rank-me':''}">
        <span class="rank-pos">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span>
        <span class="rank-nick">${r.nickname}</span>
        <span class="rank-bal">${r.balance.toLocaleString()} 💰</span>
      </div>`).join('')}
    <button id="rank-submit" class="rank-submit-btn">내 점수 등록</button>
  `;
  document.getElementById('rank-submit').addEventListener('click', async()=>{
    const btn=document.getElementById('rank-submit');
    btn.textContent='등록 중...';btn.disabled=true;
    await submitScore();
    buildRank();
  });
}

// Bet controls
document.getElementById('betDown').addEventListener('click',()=>{game.betDown();updateBet();});
document.getElementById('betUp').addEventListener('click',()=>{game.betUp();updateBet();});
function updateBet(){document.getElementById('betVal').textContent=game.bet;}
function updateBalance(){document.getElementById('balance').textContent=game.balance.toLocaleString();}

// LEVER
const lever=document.getElementById('lever');
lever.addEventListener('click', ()=>{ if(!game.spinning) pullLever(); });
lever.addEventListener('touchend', e=>{ e.preventDefault(); if(!game.spinning) pullLever(); });

function pullLever(){
  lever.classList.add('pulled');
  setTimeout(()=>lever.classList.remove('pulled'), 400);
  setTimeout(doSpin, 150);
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

  const grid=game.spin();
  updateBalance();

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

  await revealWinsSequentially(result);

  updateBalance();
  updateHistory();
  buildConsumableBar();
  game.spinning=false;
}

// Build sorted reveal list: sym wins (low→high payout) then scatters then specials
function buildRevealList(result){
  const list=[];

  // Symbol wins sorted by payout ascending
  const symWins=[...result.wins].map(w=>{
    const payout=Math.round(SYM[w.sym].val*w.mult*(game.bet/10)*result.multiplier);
    return{type:'sym',w,payout,cells:[...w.cells]};
  }).sort((a,b)=>a.payout-b.payout);
  list.push(...symWins);

  // Scatter items
  for(const s of result.scatters){
    list.push({type:'scatter',s});
  }

  // Specials last
  if(result.doubleActive) list.push({type:'double'});
  if(result.multiplier>1) list.push({type:'multiplier'});
  const mega=result.scatters.filter(s=>s.sym.special==='mega').length;
  if(mega>=3) list.push({type:'mega',mega});

  return list;
}

async function revealWinsSequentially(result){
  const wlEl=document.getElementById('win-lines');
  wlEl.innerHTML='';

  if(result.total===0 && !result.shielded){
    if(result.shielded) updateBannerShield();
    return;
  }

  const list=buildRevealList(result);
  let runningTotal=0;

  for(const item of list){
    await delay(700);

    if(item.type==='sym'){
      item.cells.forEach(([r,c])=>{
        cellEls[r][c].classList.add('win');
        cellEls[r][c].classList.add('win-flash');
        setTimeout(()=>cellEls[r][c].classList.remove('win-flash'),600);
      });
      runningTotal+=item.payout;
      const tag=document.createElement('span');
      tag.className='wl-item wl-line wl-reveal';
      tag.textContent=`${SYM[item.w.sym].e} ${item.w.name||''} ${item.w.count}개×${item.w.mult} +${item.payout}`;
      wlEl.appendChild(tag);
      updateBannerRunning(runningTotal, result);

    } else if(item.type==='scatter'){
      const s=item.s;
      cellEls[s.r][s.c].classList.add('win','win-flash');
      setTimeout(()=>cellEls[s.r][s.c].classList.remove('win-flash'),400);
      const tag=document.createElement('span');
      tag.className='wl-item wl-scatter wl-reveal';
      tag.textContent=`${s.sym.e} ${s.sym.name} 스캐터`;
      wlEl.appendChild(tag);

    } else if(item.type==='double'){
      const tag=document.createElement('span');
      tag.className='wl-item wl-double wl-reveal';
      tag.textContent='⚡ 전체 ×2!';
      wlEl.appendChild(tag);

    } else if(item.type==='multiplier'){
      const tag=document.createElement('span');
      tag.className='wl-item wl-double wl-reveal';
      tag.textContent=`✖️ 당첨금 ×${result.multiplier}`;
      wlEl.appendChild(tag);

    } else if(item.type==='mega'){
      const tag=document.createElement('span');
      tag.className='wl-item wl-mega wl-reveal';
      tag.textContent=`🌟 MEGA JACKPOT ×${item.mega}`;
      wlEl.appendChild(tag);
    }

    // scroll win-lines into view
    wlEl.scrollLeft=wlEl.scrollWidth;
  }

  // Final big banner
  if(result.total>0) await showBannerFinal(result);
  if(result.shielded && result.total===0) showBannerShield();
}

function updateBannerRunning(running, result){
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
  if(result.symWin) parts.push('심볼: +'+result.symWin+(result.multiplier>1?` (×${result.multiplier})`:''));
  if(result.scatterWin) parts.push('스캐터: +'+result.scatterWin);
  document.getElementById('wb-detail').textContent=parts.join(' / ');
  banner.classList.remove('hidden');
}

function showBannerShield(){
  const banner=document.getElementById('win-banner');
  document.getElementById('wb-amount').textContent='🛡️ 보호 발동';
  document.getElementById('wb-detail').textContent='패배시 베팅 반환';
  banner.classList.remove('hidden');
}


function updateHistory(){
  const el=document.getElementById('history');
  el.innerHTML=game.history.map(h=>{
    const cls=h.win>0?'hi win':'hi lose';
    const txt=h.win>0?`+${h.win}`:`-${h.bet}`;
    return `<span class="${cls}">${txt}</span>`;
  }).join('');
}

updateBalance();
buildConsumableBar();
