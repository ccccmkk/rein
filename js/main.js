const wheel = new RouletteWheel();
const game  = new RouletteGame();

// Build number grid
const numGrid = document.getElementById('numGrid');
const z = document.createElement('button');
z.className='num-btn g'; z.textContent='0';
z.style.gridColumn='span 2'; z.dataset.bet='n0';
numGrid.appendChild(z);
for (let n=1;n<=36;n++) {
  const b=document.createElement('button');
  b.className='num-btn '+game.numColor(n);
  b.textContent=n; b.dataset.bet='n'+n;
  numGrid.appendChild(b);
}

// Chips
document.getElementById('chipRow').addEventListener('click', e=>{
  const b=e.target.closest('.chip'); if(!b) return;
  document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  game.chipValue=parseInt(b.dataset.val);
});

function placeBet(key) {
  if (!game.placeBet(key)) return;
  document.querySelector(`[data-bet="${key}"]`)?.classList.add('active');
  updateUI();
}
document.querySelector('.bet-grid').addEventListener('click', e=>{
  const b=e.target.closest('.bet-btn'); if(b) placeBet(b.dataset.bet);
});
numGrid.addEventListener('click', e=>{
  const b=e.target.closest('.num-btn'); if(b) placeBet(b.dataset.bet);
});

document.getElementById('clearBtn').addEventListener('click', ()=>{
  game.clearBets();
  document.querySelectorAll('.bet-btn,.num-btn').forEach(b=>b.classList.remove('active'));
  updateUI();
});

const spinBtn = document.getElementById('spinBtn');
spinBtn.addEventListener('click', ()=>{
  if (game.totalBet()===0) { flashSpin(); return; }
  spinBtn.disabled=true;
  document.getElementById('clearBtn').disabled=true;
  const winNum=game.rollResult();
  wheel.startSpin(winNum, ()=>{
    const {winnings}=game.resolve(winNum);
    showResult(winNum, winnings);
    updateUI(); updateHistory();
    document.querySelectorAll('.bet-btn,.num-btn').forEach(b=>b.classList.remove('active'));
    spinBtn.disabled=false;
    document.getElementById('clearBtn').disabled=false;
  });
});

function showResult(num, winnings) {
  const banner=document.getElementById('result-banner');
  const nEl=document.getElementById('result-num');
  const mEl=document.getElementById('result-msg');
  const c=game.numColor(num);
  nEl.textContent=num;
  nEl.style.color=c==='r'?'#ff6060':c==='b'?'#aaaaaa':'#60d080';
  if (winnings>0) { mEl.textContent=`+${winnings} chips  WIN!`; mEl.className='win'; }
  else { mEl.textContent=`No win  (${c==='r'?'RED':c==='b'?'BLACK':'GREEN'})`; mEl.className='lose'; }
  banner.classList.remove('hidden');
  clearTimeout(banner._t);
  banner._t=setTimeout(()=>banner.classList.add('hidden'),3200);
}

function flashSpin() {
  spinBtn.style.boxShadow='0 0 30px #e74c3c';
  setTimeout(()=>{ spinBtn.style.boxShadow=''; },600);
}

function updateUI() {
  const bal=game.balance.toLocaleString();
  document.getElementById('balance').textContent=bal;
  const d=document.getElementById('balance-desk');
  if(d) d.textContent=bal;
  document.getElementById('totalBet').textContent=game.totalBet();
}

function updateHistory() {
  document.getElementById('history').innerHTML=game.history.map(h=>{
    const c=game.numColor(h.num);
    const cls=h.winnings>0?'hist-win':'hist-lose';
    const sign=h.winnings>0?'+'+h.winnings:'−'+Math.abs(h.net);
    return `<div class="hist-item"><div class="hist-dot ${c}">${h.num}</div><span class="${cls}">${sign}</span></div>`;
  }).join('');
}

updateUI();
