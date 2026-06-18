const game=new SlotGame();
const delay=ms=>new Promise(r=>setTimeout(r,ms));

// Build 5x5 grid
const gridEl=document.getElementById('grid');
const cellEls=[];
for(let r=0;r<5;r++){
  cellEls[r]=[];
  for(let c=0;c<5;c++){
    const el=document.createElement('div');
    el.className='cell';
    el.dataset.r=r;el.dataset.c=c;
    gridEl.appendChild(el);
    cellEls[r][c]=el;
  }
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
  for(let r=0;r<5;r++) for(let c=0;c<5;c++){
    const el=cellEls[r][c];
    el.textContent=SYM[game.grid[r][c]].e;
    applySymClass(el,game.grid[r][c]);
  }
}
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
      d.innerHTML=`<span class="pt-emoji">${s.e}</span><div class="pt-info"><div class="pt-name">${s.name}</div><div class="pt-vals">3=×3 4=×8 5=×20 6+=×50<br>val:${s.val}</div></div>`;
    }
    ptGrid.appendChild(d);
  }
}
buildPaytable();

// SHOP — event delegation on container
const shopEl=document.getElementById('shop-content');
shopEl.addEventListener('click',e=>{
  const btn=e.target.closest('button[data-perm],button[data-con]');
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
  }
});

function buildShop(){
  shopEl.innerHTML='';

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

  const h2=document.createElement('div');
  h2.className='shop-section-title';h2.textContent='⚗️ 소모 아이템';
  shopEl.appendChild(h2);

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
document.getElementById('tab-slot').addEventListener('click',()=>switchTab('slot'));
document.getElementById('tab-shop').addEventListener('click',()=>switchTab('shop'));

function switchTab(tab){
  document.getElementById('tab-slot').classList.toggle('active',tab==='slot');
  document.getElementById('tab-shop').classList.toggle('active',tab==='shop');
  document.getElementById('slot-view').classList.toggle('hidden',tab!=='slot');
  document.getElementById('shop-view').classList.toggle('hidden',tab!=='shop');
  if(tab==='shop') buildShop();
}

// Bet controls
document.getElementById('betDown').addEventListener('click',()=>{game.betDown();updateBet();});
document.getElementById('betUp').addEventListener('click',()=>{game.betUp();updateBet();});
function updateBet(){document.getElementById('betVal').textContent=game.bet;}
function updateBalance(){document.getElementById('balance').textContent=game.balance.toLocaleString();}

// SPIN
const spinBtn=document.getElementById('spinBtn');
spinBtn.addEventListener('click',doSpin);

async function doSpin(){
  if(!game.canSpin()){
    spinBtn.style.boxShadow='0 0 30px #e74c3c';
    setTimeout(()=>spinBtn.style.boxShadow='',500);
    return;
  }
  spinBtn.disabled=true;
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

  for(let c=0;c<5;c++){
    await delay(c===0?900:200);
    for(let r=0;r<5;r++){
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
  spinBtn.disabled=false;
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
      tag.textContent=`${SYM[item.w.sym].e} ${item.w.count}개 ×${item.w.mult} +${item.payout}`;
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
