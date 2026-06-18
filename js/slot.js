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

const GRID_ITEMS = [
  {id:'grid_4x4', size:4, price:1500,  e:'🔲', name:'4×4 그리드', desc:'4×4 그리드 해금 — 행 4줄, 당첨 기회 ↑'},
  {id:'grid_5x5', size:5, price:5000,  e:'🔳', name:'5×5 그리드', desc:'5×5 그리드 해금 — 행 5줄, 스캐터 폭발'},
];

const CONSUMABLE_ITEMS = [
  {id:'con_2x',      price:150,  name:'다음 스핀 2배',   e:'✖️',  desc:'다음 1회 스핀 당첨금 2배', effect:'double_spin'},
  {id:'con_lucky',   price:200,  name:'럭키 스핀',       e:'🍀',  desc:'다음 1회 스핀 심볼 가중치 +50% 상승', effect:'lucky'},
  {id:'con_jackpot', price:500,  name:'잭팟 부스터',     e:'🎰',  desc:'다음 스핀 MEGA 등장 확률 10배', effect:'jackpot_boost'},
  {id:'con_shield',  price:100,  name:'스핀 보호',       e:'🛡️',  desc:'다음 1회 스핀 패배시 10코인 반환', effect:'shield'},
];

const BINGO_ITEMS = [
  {id:'bingo_basic', price:1800, e:'🎯', name:'빙고 시스템', desc:'완전한 라인(전체 칸 일치) 달성 시 빙고 보너스 지급'},
];

// Roguelike milestone perks — chosen at 10 / 100 / 1000 spins
const MILESTONE_PERKS = [
  {id:'rm_cherry',    e:'🍒', name:'체리 절멸',    desc:'체리를 풀에서 영구 제거 → 상위 심볼 확률 UP', type:'remove_sym', sym:'cherry'},
  {id:'rm_lemon',     e:'🍋', name:'레몬 절멸',    desc:'레몬을 풀에서 영구 제거 → 상위 심볼 확률 UP', type:'remove_sym', sym:'lemon'},
  {id:'rm_orange',    e:'🍊', name:'오렌지 절멸',  desc:'오렌지를 풀에서 영구 제거 → 상위 심볼 확률 UP', type:'remove_sym', sym:'orange'},
  {id:'rm_grape',     e:'🍇', name:'포도 절멸',    desc:'포도를 풀에서 영구 제거 → 상위 심볼 확률 UP', type:'remove_sym', sym:'grape'},
  {id:'wild_magnet',  e:'🧲', name:'WILD 자석',    desc:'WILD 등장 확률 3배 증가', type:'wild_weight', req_sym:'wild'},
  {id:'diag_boost',   e:'↗️', name:'대각선 강화',  desc:'대각선 라인 당첨 배율 ×2', type:'diag_boost'},
  {id:'scatter_max',  e:'💥', name:'스캐터 맥스',  desc:'BOMB·선물 보너스 항상 최대치 지급', type:'scatter_max'},
  {id:'streak_bonus', e:'🔥', name:'연승 보너스',  desc:'3연속 당첨시 당첨금 +50%', type:'streak'},
  {id:'losing_charge',e:'⚡', name:'패배 충전',    desc:'연속 패배마다 다음 당첨금 +20% 누적 (최대 ×3)', type:'losing_charge'},
  {id:'fruit_combo',  e:'🍓', name:'과일 콤보',    desc:'4종류 과일 동시 등장시 +80코인 보너스', type:'fruit_combo'},
  {id:'mega_sense',   e:'👁️', name:'MEGA 감각',    desc:'MEGA 2개만 있어도 잭팟 절반 지급 + 등장 확률 ×2', type:'mega_sense', req_sym:'mega'},
  {id:'free_spin',    e:'🆓', name:'완전 라인 무료',desc:'완전한 라인(N칸 전부 일치) 달성시 다음 스핀 무료', type:'free_spin'},
  {id:'crown_power',  e:'👑', name:'왕관의 힘',    desc:'왕관 라인 당첨 배율 ×3', type:'crown_power', req_sym:'crown'},
  {id:'bomb_chain',   e:'💣', name:'폭탄 연쇄',    desc:'BOMB 2개↑ 등장시 보너스 2배 추가 지급', type:'bomb_chain', req_sym:'bomb'},
  {id:'sym_mirror',   e:'🪞', name:'심볼 미러',    desc:'모든 심볼 기본 val 영구 +3 추가', type:'sym_val_flat'},
];

const MILESTONES = [10, 100, 1000];

const UPGRADES = [
  {
    id:'up_match_mult', name:'매치 배율 강화', e:'⚡',
    desc:'3~8개 매치 배율 전체 +20%',
    maxLevel:10, basePrice:400, priceScale:1.6,
  },
  {
    id:'up_sym_val', name:'심볼 가치 강화', e:'💹',
    desc:'모든 심볼 기본 가치 +15%',
    maxLevel:10, basePrice:300, priceScale:1.5,
  },
  {
    id:'up_scatter_bonus', name:'스캐터 보너스 강화', e:'💥',
    desc:'BOMB·선물 스캐터 보너스 +25%',
    maxLevel:8, basePrice:500, priceScale:1.7,
  },
  {
    id:'up_wild_power', name:'WILD 파워 강화', e:'🃏',
    desc:'WILD 1개당 카운트 +1 추가',
    maxLevel:5, basePrice:800, priceScale:2.0,
  },
  {
    id:'up_mega_jackpot', name:'MEGA 잭팟 강화', e:'🌟',
    desc:'MEGA 잭팟 보너스 +30%',
    maxLevel:6, basePrice:1000, priceScale:2.0,
  },
];

function upgradePrice(upg, currentLevel){
  return Math.round(upg.basePrice * Math.pow(upg.priceScale, currentLevel));
}

class SlotGame{
  constructor(){
    this.balance=1000;
    this.bet=10; // fixed cost per spin
    this.gridSize=3;
    this.unlockedGridSizes=new Set([3]);
    this.unlockedSymIds=new Set(['cherry','lemon','orange','grape']);
    this.ownedConsumables={};
    this.activeEffects=new Set();
    this.upgradeLevels={};
    this.bingoPurchased=false;
    this.pendingConsumable=null;
    // Roguelike
    this.spinCount=0;
    this.activePerks=[];    // array of perk ids
    this.winStreak=0;
    this.loseStreak=0;
    this.freeSpin=false;
    this.pendingMilestone=null; // set when milestone reached, cleared after perk chosen
    this._rebuildPool();
    this._resetGrid();
    this.spinning=false;
    this.history=[];
  }

  _resetGrid(){
    const n=this.gridSize;
    this.grid=Array.from({length:n},()=>Array.from({length:n},()=>this._randSym()));
  }

  _rebuildPool(){
    this._pool = ALL_SYMBOLS.filter(s=>this.unlockedSymIds.has(s.id));
    this._totalW = this._pool.reduce((s,x)=>s+x.w,0);
  }

  _randSym(){
    const jackpotBoost = this.activeEffects.has('jackpot_boost');
    const wildMagnet = this.activePerks.includes('wild_magnet');
    const megaSense = this.activePerks.includes('mega_sense');
    // Build effective weights
    let totalW = this._totalW;
    if(jackpotBoost && this.unlockedSymIds.has('mega')) totalW += SYM['mega'].w*9;
    if(wildMagnet && this.unlockedSymIds.has('wild')) totalW += SYM['wild'].w*2;
    if(megaSense && this.unlockedSymIds.has('mega')) totalW += SYM['mega'].w;
    let r = Math.random() * totalW;
    for(const s of this._pool){
      let w = s.w;
      if(jackpotBoost && s.id==='mega') w *= 10;
      if(wildMagnet && s.id==='wild') w *= 3;
      if(megaSense && s.id==='mega') w *= 2;
      r -= w;
      if(r<=0) return s.id;
    }
    return this._pool[0].id;
  }

  canSpin(){return !this.spinning&&(this.freeSpin||this.balance>=this.bet);}

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

  buyGridItem(itemId){
    const item=GRID_ITEMS.find(i=>i.id===itemId);
    if(!item||this.balance<item.price||this.unlockedGridSizes.has(item.size)) return false;
    this.balance-=item.price;
    this.unlockedGridSizes.add(item.size);
    return true;
  }

  setGridSize(n){
    if(!this.unlockedGridSizes.has(n)) return false;
    this.gridSize=n;
    this._resetGrid();
    return true;
  }

  buyBingo(itemId){
    const item=BINGO_ITEMS.find(i=>i.id===itemId);
    if(!item||this.balance<item.price||this.bingoPurchased) return false;
    this.balance-=item.price;
    this.bingoPurchased=true;
    return true;
  }

  setPendingConsumable(conItemId){
    if(this.pendingConsumable===conItemId){ this.pendingConsumable=null; return 'cancelled'; }
    if(!this.ownedConsumables[conItemId]) return false;
    this.pendingConsumable=conItemId;
    return 'set';
  }

  activatePendingConsumable(){
    if(!this.pendingConsumable) return null;
    const id=this.pendingConsumable; this.pendingConsumable=null;
    const item=CONSUMABLE_ITEMS.find(i=>i.id===id);
    if(!item||!this.ownedConsumables[id]) return null;
    this.ownedConsumables[id]--;
    if(!this.ownedConsumables[id]) delete this.ownedConsumables[id];
    this.activeEffects.add(item.effect);
    return item;
  }

  buyUpgrade(upgId){
    const upg=UPGRADES.find(u=>u.id===upgId);
    if(!upg) return false;
    const lv=this.upgradeLevels[upgId]||0;
    if(lv>=upg.maxLevel) return false;
    const price=upgradePrice(upg,lv);
    if(this.balance<price) return false;
    this.balance-=price;
    this.upgradeLevels[upgId]=lv+1;
    return true;
  }

  // Milestone perk system
  getMilestoneChoices(){
    const available = MILESTONE_PERKS.filter(p=>{
      if(this.activePerks.includes(p.id)) return false;
      if(p.type==='remove_sym' && !this.unlockedSymIds.has(p.sym)) return false;
      if(p.req_sym && !this.unlockedSymIds.has(p.req_sym)) return false;
      return true;
    });
    // Shuffle and pick 3
    const shuffled=[...available].sort(()=>Math.random()-.5);
    return shuffled.slice(0,3);
  }

  choosePerk(perkId){
    const perk=MILESTONE_PERKS.find(p=>p.id===perkId);
    if(!perk) return false;
    this.activePerks.push(perkId);
    this.pendingMilestone=null;
    // Immediate effects
    if(perk.type==='remove_sym'){
      this.unlockedSymIds.delete(perk.sym);
      this._rebuildPool();
    }
    if(perk.type==='sym_val_flat'){
      // +3 to all base vals in ALL_SYMBOLS (mutate)
      ALL_SYMBOLS.forEach(s=>{ if(!s.special||s.special==='mega') s.val+=3; });
    }
    return true;
  }

  spin(){
    const wasFree=this.freeSpin;
    if(!wasFree) this.balance-=this.bet;
    this.freeSpin=false;
    this.spinCount++;
    const n=this.gridSize;
    this.grid=Array.from({length:n},()=>Array.from({length:n},()=>this._randSym()));
    // Check milestone
    if(MILESTONES.includes(this.spinCount) && this.getMilestoneChoices().length>0){
      this.pendingMilestone=this.spinCount;
    }
    return {grid:this.grid, wasFree};
  }

  resolve(){
    const flat=this.grid.flat();
    const multBonus = 1 + (this.upgradeLevels['up_match_mult']||0)*0.20;
    const valBonus  = 1 + (this.upgradeLevels['up_sym_val']||0)*0.15;

    const wins=[];
    const winCells=new Set();
    const n=this.gridSize;

    const lines=[];
    for(let r=0;r<n;r++){
      lines.push({name:`${r+1}행`, isDiag:false, coords:Array.from({length:n},(_,c)=>[r,c])});
    }
    for(let c=0;c<n;c++){
      lines.push({name:`${c+1}열`, isDiag:false, coords:Array.from({length:n},(_,r)=>[r,c])});
    }
    lines.push({name:'↘대각', isDiag:true, coords:Array.from({length:n},(_,i)=>[i,i])});
    lines.push({name:'↙대각', isDiag:true, coords:Array.from({length:n},(_,i)=>[i,n-1-i])});

    const hasDiagBoost = this.activePerks.includes('diag_boost');
    const hasCrownPower = this.activePerks.includes('crown_power');

    for(const line of lines){
      const coords=line.coords;
      let target=null;
      for(const [r,c] of coords){
        if(this.grid[r][c]!=='wild'){target=this.grid[r][c];break;}
      }
      if(!target) continue;

      const cells=[];
      for(const [r,c] of coords){
        const id=this.grid[r][c];
        if(id===target||id==='wild'){ cells.push([r,c]); } else break;
      }
      if(cells.length<3) continue;

      let baseMult = cells.length>=5?30: cells.length>=4?8: 3;
      if(hasDiagBoost && line.isDiag) baseMult*=2;
      if(hasCrownPower && target==='crown') baseMult*=3;
      const mult = Math.round(baseMult * multBonus * 10)/10;
      cells.forEach(([rr,cc])=>winCells.add(`${rr},${cc}`));
      wins.push({sym:target,count:cells.length,mult,cells,name:line.name,isDiag:line.isDiag});
    }

    // Scatter specials
    const scatters=[];
    let doubleActive=false;
    for(let r=0;r<n;r++) for(let c=0;c<n;c++){
      const sym=SYM[this.grid[r][c]];
      if(sym?.special&&sym.special!=='wild'&&sym.special!=='mega'){
        scatters.push({r,c,sym});
        winCells.add(`${r},${c}`);
        if(sym.special==='double') doubleActive=true;
      }
    }

    const scatterBonus = 1 + (this.upgradeLevels['up_scatter_bonus']||0)*0.25;
    const megaBonus    = 1 + (this.upgradeLevels['up_mega_jackpot']||0)*0.30;
    const hasScatterMax = this.activePerks.includes('scatter_max');
    const hasBombChain  = this.activePerks.includes('bomb_chain');
    const hasMegaSense  = this.activePerks.includes('mega_sense');

    let symWin=0;
    for(const w of wins) symWin+=SYM[w.sym].val*valBonus*w.mult;

    let scatterWin=0;
    let bombCount=0;
    for(const s of scatters){
      if(s.sym.special==='bomb'){
        bombCount++;
        const raw=hasScatterMax?300:(Math.floor(Math.random()*200)+100);
        scatterWin+=raw*scatterBonus;
      }
      if(s.sym.special==='gift'){
        const raw=hasScatterMax?600:(Math.floor(Math.random()*500)+100);
        scatterWin+=raw*scatterBonus;
      }
    }
    // bomb_chain perk: 2+ bombs double scatter
    if(hasBombChain && bombCount>=2) scatterWin*=2;

    const megaCount=flat.filter(id=>id==='mega').length;
    if(megaCount>=3) scatterWin+=megaCount*600*megaBonus;
    else if(hasMegaSense && megaCount>=2) scatterWin+=megaCount*300*megaBonus;

    if(doubleActive&&symWin>0) symWin*=2;

    let multiplier=1;
    if(this.activeEffects.has('double_spin')) multiplier=2;
    symWin*=multiplier;

    // streak / losing_charge perks
    const hasStreak=this.activePerks.includes('streak_bonus');
    const hasLosingCharge=this.activePerks.includes('losing_charge');
    let streakBonus=0;
    let chargeBonus=0;
    if(hasStreak && this.winStreak>=3 && symWin>0) streakBonus=symWin*0.5;
    if(hasLosingCharge && this.loseStreak>0 && (symWin+scatterWin)>0){
      const chargeRate=Math.min(this.loseStreak*0.20, 2.0);
      chargeBonus=Math.round((symWin+scatterWin)*chargeRate);
    }

    // fruit_combo perk
    const hasFruitCombo=this.activePerks.includes('fruit_combo');
    let fruitBonus=0;
    if(hasFruitCombo){
      const fruits=['cherry','lemon','orange','grape'];
      const presentFruits=new Set(flat.filter(id=>fruits.includes(id)));
      if(presentFruits.size>=4) fruitBonus=80;
    }

    symWin=Math.round(symWin+streakBonus);

    // Bingo
    let bingoBonus=0, bingoCount=0, fullBingo=false;
    if(this.bingoPurchased){
      const totalLines=n*2+2;
      for(const w of wins){ if(w.cells.length===n) bingoCount++; }
      fullBingo=(bingoCount===totalLines);
      if(fullBingo)          bingoBonus=this.bet*300;
      else if(bingoCount>=4) bingoBonus=this.bet*25;
      else if(bingoCount>=3) bingoBonus=this.bet*10;
      else if(bingoCount>=2) bingoBonus=this.bet*4;
    }

    // free_spin perk: any complete line → next spin free
    if(this.activePerks.includes('free_spin') && bingoCount>0) this.freeSpin=true;

    const shielded=this.activeEffects.has('shield');
    const total=Math.round(symWin+scatterWin+fruitBonus+chargeBonus+bingoBonus);
    if(shielded&&total===0) this.balance+=this.bet;
    this.balance+=total;

    // Update streaks
    if(total>0){ this.winStreak++; this.loseStreak=0; }
    else { this.loseStreak++; this.winStreak=0; }

    this.history.unshift({win:total});
    if(this.history.length>12) this.history.pop();
    this.activeEffects.clear();

    return{wins,winCells,scatters,
      symWin,scatterWin:Math.round(scatterWin),
      fruitBonus,chargeBonus,streakBonus:Math.round(streakBonus),
      bingoBonus:Math.round(bingoBonus),bingoCount,fullBingo,
      total,doubleActive,multiplier,shielded,
      winStreak:this.winStreak,loseStreak:this.loseStreak};
  }
}
