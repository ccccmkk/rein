const game=new SlotGame();
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const EMOJIS=SYMBOLS.map(s=>s.e);

// Build 5x5 grid
const gridEl=document.getElementById('grid');
const cellEls=[];
for(let r=0;r<5;r++){
  cellEls[r]=[];
  for(let c=0;c<5;c++){
    const el=document.createElement('div');
    el.className='cell';
    el.dataset.r=r;el.dataset.c=c;
    el.textContent=SYM[game.grid[r][c]].e;
    gridEl.appendChild(el);
    cellEls[r][c]=el;
  }
}

function applySymClass(el,id){
  el.className='cell';
  const sym=SYM[id];
  if(sym?.special) el.classList.add('sp-'+sym.special);
}

// Build paytable
const ptGrid=document.getElementById('pt-grid');
for(const s of SYMBOLS){
  const d=document.createElement('div');
  d.className='pt-item'+(s.special==='mega'?' pt-mega':s.special?' pt-special':'');
  if(s.special&&s.special!=='wild'&&s.special!=='mega'){
    const desc=s.special==='bomb'?'+100~300 scatter':s.special==='double'?'라인 ×2':'+100~600 scatter';
    d.innerHTML=`<span class="pt-emoji">${s.e}</span><div class="pt-info"><div class="pt-name">${s.name}</div><div class="pt-vals">${desc}</div></div>`;
  } else if(s.special==='wild'){
    d.innerHTML=`<span class="pt-emoji">${s.e}</span><div class="pt-info"><div class="pt-name">${s.name}</div><div class="pt-vals">아무 심볼 대체</div></div>`;
  } else {
    d.innerHTML=`<span class="pt-emoji">${s.e}</span><div class="pt-info"><div class="pt-name">${s.name}</div><div class="pt-vals">3=×3&nbsp; 4=×10&nbsp; 5=×30<br>val:${s.val}</div></div>`;
  }
  ptGrid.appendChild(d);
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
  // Clear state
  cellEls.flat().forEach(c=>c.className='cell');
  document.getElementById('win-banner').classList.add('hidden');
  document.getElementById('win-lines').innerHTML='';

  const grid=game.spin();
  updateBalance();

  // Start spinning all cells
  const ivs=cellEls.map(row=>row.map(el=>{
    el.classList.add('spinning');
    return setInterval(()=>{ el.textContent=EMOJIS[Math.floor(Math.random()*EMOJIS.length)]; },55);
  }));

  // Stop column by column
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

  // Highlight win cells
  result.winCells.forEach(key=>{
    const [r,c]=key.split(',');
    cellEls[+r][+c].classList.add('win');
  });

  // Win lines
  showWinLines(result);

  // Win banner
  if(result.total>0) showBanner(result);

  updateBalance();
  updateHistory();
  spinBtn.disabled=false;
}

function showBanner(result){
  const banner=document.getElementById('win-banner');
  document.getElementById('wb-amount').textContent='+'+result.total+' coins';
  const parts=[];
  if(result.lineWin) parts.push('라인: +'+result.lineWin+(result.doubleActive?' (×2 적용)':''));
  if(result.scatterWin) parts.push('스춰터: +'+result.scatterWin);
  document.getElementById('wb-detail').textContent=parts.join(' / ');
  banner.classList.remove('hidden');
}

function showWinLines(result){
  const el=document.getElementById('win-lines');
  const tags=[];
  for(const w of result.wins){
    const payout=Math.round(SYM[w.sym].val*w.mult*(game.bet/10)*(result.doubleActive?2:1));
    tags.push(`<span class="wl-item wl-line">${SYM[w.sym].e} ${w.name} ${w.count}매×${w.mult} +${payout}</span>`);
  }
  for(const s of result.scatters){
    tags.push(`<span class="wl-item wl-scatter">${s.sym.e} ${s.sym.name} 스춰터</span>`);
  }
  if(result.doubleActive) tags.push('<span class="wl-item wl-double">⚡ 전체 ×2!</span>');
  const mega=result.scatters.filter(s=>s.sym.special==='mega').length;
  if(mega>=3) tags.push(`<span class="wl-item wl-mega">🌟 MEGA JACKPOT ×${mega}</span>`);
  el.innerHTML=tags.join('');
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
