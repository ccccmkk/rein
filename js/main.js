const wheel = new RouletteWheel();
const game  = new RouletteGame();

// Build number grid
const numGrid = document.getElementById('numGrid');
// 0 first (full width), then 1–36
const zero = document.createElement('button');
zero.className = 'num-btn g'; zero.textContent = '0';
zero.style.gridColumn = 'span 2';
zero.dataset.bet = 'n0';
numGrid.appendChild(zero);
for (let n = 1; n <= 36; n++) {
  const btn = document.createElement('button');
  btn.className = 'num-btn ' + (game.numColor(n));
  btn.textContent = n;
  btn.dataset.bet = 'n' + n;
  numGrid.appendChild(btn);
}

// Chip selection
document.getElementById('chipRow').addEventListener('click', e => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  document.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  game.chipValue = parseInt(btn.dataset.val);
});

// Bet buttons
function onBetClick(key) {
  const ok = game.placeBet(key);
  if (!ok) return;
  // Highlight
  const sel = `[data-bet="${key}"]`;
  document.querySelector(sel)?.classList.add('active');
  updateUI();
}

document.querySelector('.bet-grid').addEventListener('click', e => {
  const btn = e.target.closest('.bet-btn');
  if (btn) onBetClick(btn.dataset.bet);
});
numGrid.addEventListener('click', e => {
  const btn = e.target.closest('.num-btn');
  if (btn) onBetClick(btn.dataset.bet);
});

// Clear bets
document.getElementById('clearBtn').addEventListener('click', () => {
  game.clearBets();
  document.querySelectorAll('.bet-btn, .num-btn').forEach(b => b.classList.remove('active'));
  updateUI();
});

// SPIN
const spinBtn = document.getElementById('spinBtn');
spinBtn.addEventListener('click', () => {
  if (game.totalBet() === 0) { flashSpin(); return; }
  spinBtn.disabled = true;
  document.getElementById('clearBtn').disabled = true;

  const winNum = game.rollResult();
  wheel.startSpin(winNum, () => {
    // Resolve after animation
    const { winnings, net } = game.resolve(winNum);
    showResult(winNum, winnings, net);
    updateUI();
    updateHistory();
    document.querySelectorAll('.bet-btn, .num-btn').forEach(b => b.classList.remove('active'));
    spinBtn.disabled = false;
    document.getElementById('clearBtn').disabled = false;
  });
});

function showResult(num, winnings, net) {
  const banner = document.getElementById('result-banner');
  const nEl = document.getElementById('result-num');
  const mEl = document.getElementById('result-msg');

  const color = game.numColor(num);
  const colorName = color === 'r' ? 'RED' : color === 'b' ? 'BLACK' : 'GREEN';
  nEl.textContent = num;
  nEl.style.color = color === 'r' ? '#ff6060' : color === 'b' ? '#aaaaaa' : '#60d080';

  if (winnings > 0) {
    mEl.textContent = `+${winnings} chips  WIN!`;
    mEl.className = 'win';
  } else {
    mEl.textContent = `No win  (${colorName})`;
    mEl.className = 'lose';
  }

  banner.classList.remove('hidden');
  clearTimeout(banner._timer);
  banner._timer = setTimeout(() => banner.classList.add('hidden'), 3000);
}

function flashSpin() {
  spinBtn.style.boxShadow = '0 0 30px #e74c3c';
  setTimeout(() => spinBtn.style.boxShadow = '', 600);
}

function updateUI() {
  document.getElementById('balance').textContent = game.balance.toLocaleString();
  document.getElementById('totalBet').textContent = game.totalBet();
}

function updateHistory() {
  const el = document.getElementById('history');
  el.innerHTML = game.history.map(h => {
    const c = game.numColor(h.num);
    const cls = h.winnings > 0 ? 'hist-win' : 'hist-lose';
    const sign = h.winnings > 0 ? '+' + h.winnings : '−' + Math.abs(h.net);
    return `<div class="hist-item">
      <div class="hist-dot ${c}">${h.num}</div>
      <span class="${cls}">${sign}</span>
    </div>`;
  }).join('');
}

updateUI();
