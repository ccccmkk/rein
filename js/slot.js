const ALL_SYMBOLS = [
  {id:'cherry', e:'🍒', name:'체리',   val:2,   w:22},
  {id:'lemon',  e:'🍋', name:'레몬',   val:3,   w:18},
  {id:'orange', e:'🍊', name:'오렌지', val:4,   w:15},
  {id:'grape',  e:'🍇', name:'포도',   val:6,   w:12},
  {id:'bell',   e:'🔔', name:'벨',     val:10,  w:9},
  {id:'star',   e:'⭐', name:'별',     val:15,  w:7},
  {id:'diamond',e:'💎', name:'다이아', val:25,  w:4},
  {id:'money',  e:'💰', name:'머니백', val:40,  w:2.5},
  {id:'crown',  e:'👑', name:'왕관',   val:75,  w:1.5},
  {id:'wild',   e:'🃏', name:'WILD',   val:0,   w:3,  special:'wild'},
  {id:'bomb',   e:'💣', name:'BOMB',   val:0,   w:2,  special:'bomb'},
  {id:'double', e:'⚡', name:'2배 ALL', val:0,   w:1.5,special:'double'},
  {id:'gift',   e:'🎁', name:'선물',   val:0,   w:1,  special:'gift'},
  {id:'mega',   e:'🌟', name:'MEGA',   val:200, w:0.5,special:'mega'},
];
const SYM = Object.fromEntries(ALL_SYMBOLS.map(s=>[s.id,s]));

const PERMANENT_ITEMS = [
  {id:'unlock_bell',   sym:'bell',    price:300,  desc:'벨 심볼 추가 (배율 높음)'},
  {id:'unlock_star',   sym:'star',    price:600,  desc:'별 심볼 추가 (희귀)'},
  {id:'unlock_diamond',sym:'diamond', price:1200, desc:'다이아 심볼 추가 (고배율)'},
  {id:'unlock_money',  sym:'money',   price:2500, desc:'머니백 심볼 추가 (초고배율)'},
  {id:'unlock_crown',  sym:'crown',   price:5000, desc:'왕관 심볼 추가 (최고배율)'},
  {id:'unlock_wild',   sym:'wild',    price:800,  desc:'WILD 심볼 추가 - 모든 심볼 대체'},
  {id:'unlock_bomb',   sym:'bomb',    price:1500, desc:'BOMB 심볼 추가 - 등장시 100~300 보너스'},
  {id:'unlock_double', sym:'double',  price:2000, desc:'⚡ 심볼 추가 - 라인 당첨 2배'},
  {id:'unlock_gift',   sym:'gift',    price:3000, desc:'선물 심볼 추가 - 등장시 100~600 보너스'},
  {id:'unlock_mega',   sym:'mega',    price:8000, desc:'🌟 MEGA 심볼 추가 - 3개↑ 등장시 잭팟!'},
];

const CONSUMABLE_ITEMS = [
  {id:'con_2x',      price:150,  name:'다음 스핀 2배',   e:'✖️',  desc:'다음 1회 스핀 당첨금 2배', effect:'double_spin'},
  {id:'con_lucky',   price:200,  name:'럭키 스핀',       e:'🍀',  desc:'다음 1회 스핀 심볼 가중치 +50% 상승', effect:'lucky'},
  {id:'con_jackpot', price:500,  name:'잭팟 부스터',     e:'🎰',  desc:'다음 스핀 MEGA 등장 확률 10배', effect:'jackpot_boost'},
  {id:'con_shield',  price:100,  name:'배팅 보호',       e:'🛡️',  desc:'다음 1회 스핀 패배시 베팅 반환', effect:'shield'},
];

const BET_OPTIONS = [10,20,50,100,200,500];

class SlotGame{
  constructor(){
    this.balance=1000;
    this.betIdx=0;
    this.unlockedSymIds=new Set(['cherry','lemon','orange','grape']);
    this.ownedConsumables={};
    this.activeEffects=new Set();
    this._rebuildPool();
    this.grid=Array.from({length:5},()=>Array.from({length:5},()=>this._randSym()));
    this.spinning=false;
    this.history=[];
  }

  _rebuildPool(){
    this._pool = ALL_SYMBOLS.filter(s=>this.unlockedSymIds.has(s.id));
    this._totalW = this._pool.reduce((s,x)=>s+x.w,0);
  }

  _randSym(){
    const jackpotBoost = this.activeEffects.has('jackpot_boost');
    let r = Math.random() * (this._totalW + (jackpotBoost ? SYM['mega']?.w*9 || 0 : 0));
    for(const s of this._pool){
      const w = (jackpotBoost && s.id==='mega') ? s.w*10 : s.w;
      r -= w;
      if(r<=0) return s.id;
    }
    return this._pool[0].id;
  }

  get bet(){return BET_OPTIONS[this.betIdx];}
  betUp(){if(this.betIdx<BET_OPTIONS.length-1)this.betIdx++;}
  betDown(){if(this.betIdx>0)this.betIdx--;}
  canSpin(){return !this.spinning&&this.balance>=this.bet;}

  unlockSymbol(permItemId){
    const item = PERMANENT_ITEMS.find(i=>i.id===permItemId);
    if(!item || this.balance<item.price || this.unlockedSymIds.has(item.sym)) return false;
    this.balance -= item.price;
    this.unlockedSymIds.add(item.sym);
    this._rebuildPool();
    return true;
  }

  buyConsumable(conItemId){
    const item = CONSUMABLE_ITEMS.find(i=>i.id===conItemId);
    if(!item || this.balance<item.price) return false;
    this.balance -= item.price;
    this.ownedConsumables[conItemId] = (this.ownedConsumables[conItemId]||0)+1;
    return true;
  }

  useConsumable(conItemId){
    if(!this.ownedConsumables[conItemId]) return false;
    const item = CONSUMABLE_ITEMS.find(i=>i.id===conItemId);
    if(!item) return false;
    this.ownedConsumables[conItemId]--;
    if(!this.ownedConsumables[conItemId]) delete this.ownedConsumables[conItemId];
    this.activeEffects.add(item.effect);
    return true;
  }

  spin(){
    this.balance-=this.bet;
    this.grid=Array.from({length:5},()=>Array.from({length:5},()=>this._randSym()));
    return this.grid;
  }

  resolve(){
    const wins=[];const winCells=new Set();
    for(const line of LINES){
      const r=checkLine(this.grid,line.cells);
      if(r){wins.push({...line,...r});line.cells.forEach(([row,col])=>winCells.add(`${row},${col}`));}
    }
    const scatters=[];
    let doubleActive=false;
    for(let r=0;r<5;r++) for(let c=0;c<5;c++){
      const sym=SYM[this.grid[r][c]];
      if(sym?.special&&sym.special!=='wild'&&sym.special!=='mega'){
        scatters.push({r,c,sym});
        if(sym.special==='double') doubleActive=true;
      }
    }
    let lineWin=0;
    for(const w of wins) lineWin+=SYM[w.sym].val*w.mult*(this.bet/10);
    let scatterWin=0;
    for(const s of scatters){
      if(s.sym.special==='bomb') scatterWin+=Math.floor(Math.random()*200)+100;
      if(s.sym.special==='gift') scatterWin+=Math.floor(Math.random()*500)+100;
    }
    const megaCount=this.grid.flat().filter(id=>id==='mega').length;
    if(megaCount>=3) scatterWin+=megaCount*600;
    if(doubleActive&&lineWin>0) lineWin*=2;

    let multiplier = 1;
    if(this.activeEffects.has('double_spin')) multiplier=2;
    lineWin *= multiplier;

    const shielded = this.activeEffects.has('shield');
    const total = Math.round(lineWin+scatterWin);
    if(shielded && total===0) this.balance+=this.bet;

    this.balance+=total;
    this.history.unshift({bet:this.bet,win:total});
    if(this.history.length>12)this.history.pop();

    const usedEffects = [...this.activeEffects];
    this.activeEffects.clear();

    return{wins,winCells,scatters,lineWin:Math.round(lineWin),scatterWin:Math.round(scatterWin),
      total,doubleActive,multiplier,shielded,usedEffects};
  }
}

function getLines(){
  const L=[];
  for(let r=0;r<5;r++) L.push({name:`행${r+1}`,cells:[[r,0],[r,1],[r,2],[r,3],[r,4]]});
  for(let c=0;c<5;c++) L.push({name:`열${c+1}`,cells:[[0,c],[1,c],[2,c],[3,c],[4,c]]});
  L.push({name:'↘대각',cells:[[0,0],[1,1],[2,2],[3,3],[4,4]]});
  L.push({name:'↙대각',cells:[[0,4],[1,3],[2,2],[3,1],[4,0]]});
  return L;
}
const LINES = getLines();

function checkLine(grid,cells){
  const ids=cells.map(([r,c])=>grid[r][c]);
  let wilds=0;
  const normals=[];
  for(const id of ids){
    if(id==='wild') wilds++;
    else if(!SYM[id]?.special) normals.push(id);
    else if(SYM[id]?.special==='mega') normals.push(id);
  }
  if(!normals.length){
    const total=wilds;
    if(total<3)return null;
    return{sym:'crown',count:total,mult:total>=5?30:total>=4?10:3};
  }
  const cnt={};
  for(const id of normals) cnt[id]=(cnt[id]||0)+1;
  const [best,bc]=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];
  const total=bc+wilds;
  if(total<3)return null;
  return{sym:best,count:total,mult:total>=5?30:total>=4?10:3};
}
