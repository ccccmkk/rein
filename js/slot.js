const ALL_SYMBOLS = [
  {id:'cherry', e:'🍒', name:'체리',   val:10,  w:22},
  {id:'lemon',  e:'🍋', name:'레몬',   val:15,  w:18},
  {id:'orange', e:'🍊', name:'오렌지', val:20,  w:15},
  {id:'grape',  e:'🍇', name:'포도',   val:30,  w:12},
  {id:'bell',   e:'🔔', name:'벨',     val:50,  w:9},
  {id:'star',   e:'⭐', name:'별',     val:75,  w:7},
  {id:'diamond',e:'💎', name:'다이아', val:125, w:4},
  {id:'money',  e:'💰', name:'머니백', val:200, w:2.5},
  {id:'crown',  e:'👑', name:'왕관',   val:375, w:1.5},
  {id:'wild',   e:'🃏', name:'WILD',   val:0,   w:3,  special:'wild'},
  {id:'bomb',   e:'💣', name:'BOMB',   val:0,   w:2,  special:'bomb'},
  {id:'double', e:'⚡', name:'2배 ALL', val:0,   w:1.5,special:'double'},
  {id:'gift',   e:'🎁', name:'선물',   val:0,   w:1,  special:'gift'},
  {id:'mega',   e:'🌟', name:'MEGA',   val:0,   w:0.5,special:'mega'},
];
const SYM = Object.fromEntries(ALL_SYMBOLS.map(s=>[s.id,s]));

const PERMANENT_ITEMS = [
  {id:'unlock_bell',   sym:'bell',    price:800,   desc:'벨 심볼 추가 (배율 높음)'},
  {id:'unlock_star',   sym:'star',    price:2000,  desc:'별 심볼 추가 (희귀)'},
  {id:'unlock_diamond',sym:'diamond', price:5000,  desc:'다이아 심볼 추가 (고배율)'},
  {id:'unlock_money',  sym:'money',   price:12000, desc:'머니백 심볼 추가 (초고배율)'},
  {id:'unlock_crown',  sym:'crown',   price:30000, desc:'왕관 심볼 추가 (최고배율)'},
  {id:'unlock_wild',   sym:'wild',    price:3000,  desc:'WILD 심볼 추가 - 모든 심볼 대체'},
  {id:'unlock_bomb',   sym:'bomb',    price:6000,  desc:'BOMB 심볼 추가 - 등장시 500~1500 보너스'},
  {id:'unlock_double', sym:'double',  price:8000,  desc:'⚡ 심볼 추가 - 라인 당첨 2배'},
  {id:'unlock_gift',   sym:'gift',    price:18000, desc:'선물 심볼 추가 - 등장시 500~3000 보너스'},
  {id:'unlock_mega',   sym:'mega',    price:50000, desc:'🌟 MEGA 심볼 추가 - 3개↑ 등장시 잭팟!'},
];

const GRID_ITEMS = [
  {id:'grid_4x4', size:4, price:5000,  e:'🔲', name:'4×4 그리드', desc:'4×4 그리드 해금 — 더 많은 라인'},
  {id:'grid_5x5', size:5, price:20000, e:'🔳', name:'5×5 그리드', desc:'5×5 그리드 해금 — 최대 스케일'},
];

const CONSUMABLE_ITEMS = [
  {id:'con_2x',      price:150,  name:'다음 스핀 2배',   e:'✖️',  desc:'다음 1회 스핀 당첨금 2배', effect:'double_spin'},
  {id:'con_lucky',   price:200,  name:'럭키 스핀',       e:'🍀',  desc:'다음 1회 스핀 심볼 가중치 +50% 상승', effect:'lucky'},
  {id:'con_jackpot', price:500,  name:'잭팟 부스터',     e:'🎰',  desc:'다음 스핀 MEGA 등장 확률 10배', effect:'jackpot_boost'},
  {id:'con_shield',  price:100,  name:'스핀 보호',       e:'🛡️',  desc:'다음 1회 스핀 패배시 10코인 반환', effect:'shield'},
];

const BINGO_ITEMS = [
  {id:'bingo_basic', price:1800, e:'🎯', name:'콤보 보너스', desc:'같은 심볼이 여러 라인에 동시 당첨시 보너스: 페어(×4) 트리플(×10) 쿼드(×25) 퀸테트(×50) / 전체 라인 = FULL BINGO 폭죽!'},
];

// Roguelike milestone perks
const MILESTONE_PERKS = [
  // Symbol removal
  {id:'rm_cherry',    e:'🍒', name:'체리 절멸',    desc:'체리를 풀에서 영구 제거 → 상위 심볼 확률 UP', type:'remove_sym', sym:'cherry'},
  {id:'rm_lemon',     e:'🍋', name:'레몬 절멸',    desc:'레몬을 풀에서 영구 제거 → 상위 심볼 확률 UP', type:'remove_sym', sym:'lemon'},
  {id:'rm_orange',    e:'🍊', name:'오렌지 절멸',  desc:'오렌지를 풀에서 영구 제거 → 상위 심볼 확률 UP', type:'remove_sym', sym:'orange'},
  {id:'rm_grape',     e:'🍇', name:'포도 절멸',    desc:'포도를 풀에서 영구 제거 → 상위 심볼 확률 UP', type:'remove_sym', sym:'grape'},
  // Probability boosts
  {id:'wild_magnet',  e:'🧲', name:'WILD 자석',    desc:'WILD 등장 확률 ×3', type:'wild_weight', req_sym:'wild'},
  {id:'boost_bell',   e:'🔔', name:'벨 마스터',    desc:'벨 등장 확률 ×3', type:'weight_boost', sym:'bell', mult:3, req_sym:'bell'},
  {id:'boost_premium',e:'💎', name:'고급 집중',    desc:'다이아·머니백·왕관 등장 확률 각 ×2', type:'weight_boost_multi', syms:['diamond','money','crown'], mult:2},
  {id:'boost_star',   e:'⭐', name:'별 집중',      desc:'별 등장 확률 ×4', type:'weight_boost', sym:'star', mult:4, req_sym:'star'},
  // Special perks
  {id:'diag_boost',   e:'↗️', name:'대각선 강화',  desc:'대각선 라인 당첨 배율 ×2', type:'diag_boost'},
  {id:'scatter_max',  e:'💥', name:'스캐터 맥스',  desc:'BOMB·선물 보너스 항상 최대치', type:'scatter_max'},
  {id:'streak_bonus', e:'🔥', name:'연승 보너스',  desc:'3연속 당첨시 당첨금 +50%', type:'streak'},
  {id:'losing_charge',e:'⚡', name:'패배 충전',    desc:'연속 패배마다 다음 당첨금 +20% 누적 (최대 ×3)', type:'losing_charge'},
  {id:'fruit_combo',  e:'🍓', name:'과일 콤보',    desc:'4종류 과일 동시 등장시 +400코인 보너스', type:'fruit_combo'},
  {id:'mega_sense',   e:'👁️', name:'MEGA 감각',    desc:'MEGA 2개만 있어도 잭팟 절반 지급 + 등장 확률 ×2', type:'mega_sense', req_sym:'mega'},
  {id:'free_spin',    e:'🆓', name:'콤보 무료',    desc:'콤보 달성 시 다음 스핀 무료', type:'free_spin'},
  {id:'crown_power',  e:'👑', name:'왕관의 힘',    desc:'왕관 라인 당첨 배율 ×3', type:'crown_power', req_sym:'crown'},
  {id:'bomb_chain',   e:'💣', name:'폭탄 연쇄',    desc:'BOMB 2개↑ 등장시 보너스 2배', type:'bomb_chain', req_sym:'bomb'},
  {id:'sym_mirror',   e:'🪞', name:'심볼 미러',    desc:'모든 심볼 기본 가치 영구 +10 추가', type:'sym_val_flat'},
];

const MILESTONES = [10, 100, 250, 500, 1000];

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
    this.bet=10;
    this.gridSize=3;
    this.unlockedGridSizes=new Set([3]);
    this.unlockedSymIds=new Set(['cherry','lemon','orange','grape']);
    this.ownedConsumables={};
    this.activeEffects=new Set();
    this.upgradeLevels={};
    this.bingoPurchased=false;
    this.pendingConsumable=null;
    this.spinCount=0;
    this.activePerks=[];
    this.weightBoosts={};
    this.extraSymVal=0;
    this.winStreak=0;
    this.loseStreak=0;
    this.freeSpin=false;
    this.pendingMilestone=null;
    this.maxCoins=1000;
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
    this._pool=ALL_SYMBOLS.filter(s=>this.unlockedSymIds.has(s.id));
  }

  _getEffW(s){
    let w=s.w;
    if(this.activePerks.includes('wild_magnet')&&s.id==='wild') w*=3;
    if(this.activePerks.includes('mega_sense')&&s.id==='mega') w*=2;
    if(this.weightBoosts[s.id]) w*=this.weightBoosts[s.id];
    return w;
  }

  _randSym(){
    const jackpotBoost=this.activeEffects.has('jackpot_boost');
    let totalW=0;
    const weights=this._pool.map(s=>{
      let w=this._getEffW(s);
      if(jackpotBoost&&s.id==='mega') w*=10;
      totalW+=w;
      return {id:s.id,w};
    });
    let r=Math.random()*totalW;
    for(const {id,w} of weights){ r-=w; if(r<=0) return id; }
    return this._pool[0].id;
  }

  getSymbolProbabilities(){
    let total=0;
    const weights=this._pool.map(s=>{ const w=this._getEffW(s); total+=w; return {id:s.id,w}; });
    const p={};
    for(const {id,w} of weights) p[id]=w/total;
    return p;
  }

  canSpin(){return !this.spinning&&(this.freeSpin||this.balance>=this.bet);}

  unlockSymbol(permItemId){
    const item=PERMANENT_ITEMS.find(i=>i.id===permItemId);
    if(!item||this.balance<item.price||this.unlockedSymIds.has(item.sym)) return false;
    this.balance-=item.price;
    this.unlockedSymIds.add(item.sym);
    this._rebuildPool();
    return true;
  }

  buyConsumable(conItemId){
    const item=CONSUMABLE_ITEMS.find(i=>i.id===conItemId);
    if(!item||this.balance<item.price) return false;
    this.balance-=item.price;
    this.ownedConsumables[conItemId]=(this.ownedConsumables[conItemId]||0)+1;
    return true;
  }

  buyGridItem(itemId){
    const item=GRID_ITEMS.find(i=>i.id===itemId);
    if(!item||this.balance<item.price||this.unlockedGridSizes.has(item.size)) return false;
    this.balance-=item.price;
    this.unlockedGridSizes.add(item.size);
    this.gridSize=item.size;
    this._resetGrid();
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

  getMilestoneChoices(){
    const available=MILESTONE_PERKS.filter(p=>{
      if(this.activePerks.includes(p.id)) return false;
      if(p.type==='remove_sym'&&!this.unlockedSymIds.has(p.sym)) return false;
      if(p.req_sym&&!this.unlockedSymIds.has(p.req_sym)) return false;
      if(p.type==='weight_boost'&&!this.unlockedSymIds.has(p.sym)) return false;
      if(p.type==='weight_boost_multi'){
        const any=p.syms.some(s=>this.unlockedSymIds.has(s));
        if(!any) return false;
      }
      return true;
    });
    return [...available].sort(()=>Math.random()-.5).slice(0,3);
  }

  choosePerk(perkId){
    const perk=MILESTONE_PERKS.find(p=>p.id===perkId);
    if(!perk) return false;
    this.activePerks.push(perkId);
    this.pendingMilestone=null;
    if(perk.type==='remove_sym'){
      this.unlockedSymIds.delete(perk.sym);
      this._rebuildPool();
    }
    if(perk.type==='sym_val_flat') this.extraSymVal+=10;
    if(perk.type==='weight_boost') this.weightBoosts[perk.sym]=(this.weightBoosts[perk.sym]||1)*perk.mult;
    if(perk.type==='weight_boost_multi'){
      perk.syms.forEach(s=>{ if(this.unlockedSymIds.has(s)) this.weightBoosts[s]=(this.weightBoosts[s]||1)*perk.mult; });
    }
    // wild_magnet and mega_sense handled in _randSym via activePerks check
    return true;
  }

  spin(){
    const wasFree=this.freeSpin;
    if(!wasFree) this.balance-=this.bet;
    this.freeSpin=false;
    this.spinCount++;
    const n=this.gridSize;
    this.grid=Array.from({length:n},()=>Array.from({length:n},()=>this._randSym()));
    if(MILESTONES.includes(this.spinCount)&&this.getMilestoneChoices().length>0){
      this.pendingMilestone=this.spinCount;
    }
    return {grid:this.grid,wasFree};
  }

  resolve(){
    const flat=this.grid.flat();
    const multBonus=1+(this.upgradeLevels['up_match_mult']||0)*0.20;
    const valBonus=1+(this.upgradeLevels['up_sym_val']||0)*0.15;

    const wins=[];
    const winCells=new Set();
    const n=this.gridSize;

    const lines=[];
    for(let r=0;r<n;r++) lines.push({name:`${r+1}행`,isDiag:false,coords:Array.from({length:n},(_,c)=>[r,c])});
    for(let c=0;c<n;c++) lines.push({name:`${c+1}열`,isDiag:false,coords:Array.from({length:n},(_,r)=>[r,c])});
    lines.push({name:'↘대각',isDiag:true,coords:Array.from({length:n},(_,i)=>[i,i])});
    lines.push({name:'↙대각',isDiag:true,coords:Array.from({length:n},(_,i)=>[i,n-1-i])});

    const hasDiagBoost=this.activePerks.includes('diag_boost');
    const hasCrownPower=this.activePerks.includes('crown_power');

    for(const line of lines){
      // Find the longest consecutive run of matching symbols anywhere in the line
      let bestCells=[], bestTarget=null;
      for(let start=0; start<=line.coords.length-3; start++){
        const [r0,c0]=line.coords[start];
        // Determine target: first non-wild from this start position
        let target=null;
        for(let j=start;j<line.coords.length;j++){
          const sid=this.grid[line.coords[j][0]][line.coords[j][1]];
          if(sid!=='wild'){target=sid;break;}
        }
        if(!target) continue;
        const cells=[];
        for(let j=start;j<line.coords.length;j++){
          const id=this.grid[line.coords[j][0]][line.coords[j][1]];
          if(id===target||id==='wild') cells.push(line.coords[j]); else break;
        }
        if(cells.length>bestCells.length){bestCells=cells;bestTarget=target;}
      }
      if(bestCells.length<3) continue;
      let baseMult=bestCells.length>=5?30:bestCells.length>=4?8:3;
      if(hasDiagBoost&&line.isDiag) baseMult*=2;
      if(hasCrownPower&&bestTarget==='crown') baseMult*=3;
      const mult=Math.round(baseMult*multBonus*10)/10;
      bestCells.forEach(([rr,cc])=>winCells.add(`${rr},${cc}`));
      wins.push({sym:bestTarget,count:bestCells.length,mult,cells:bestCells,name:line.name,isDiag:line.isDiag});
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

    const scatterBonus=1+(this.upgradeLevels['up_scatter_bonus']||0)*0.25;
    const megaBonus=1+(this.upgradeLevels['up_mega_jackpot']||0)*0.30;
    const hasScatterMax=this.activePerks.includes('scatter_max');
    const hasBombChain=this.activePerks.includes('bomb_chain');
    const hasMegaSense=this.activePerks.includes('mega_sense');

    let symWin=0;
    for(const w of wins){
      const baseVal=(SYM[w.sym].val+this.extraSymVal)*valBonus;
      symWin+=baseVal*w.mult;
    }

    let scatterWin=0;
    let bombCount=0;
    for(const s of scatters){
      if(s.sym.special==='bomb'){
        bombCount++;
        const raw=hasScatterMax?1500:(Math.floor(Math.random()*1000)+500);
        scatterWin+=raw*scatterBonus;
      }
      if(s.sym.special==='gift'){
        const raw=hasScatterMax?3000:(Math.floor(Math.random()*2500)+500);
        scatterWin+=raw*scatterBonus;
      }
    }
    if(hasBombChain&&bombCount>=2) scatterWin*=2;

    const megaCount=flat.filter(id=>id==='mega').length;
    if(megaCount>=3) scatterWin+=megaCount*3000*megaBonus;
    else if(hasMegaSense&&megaCount>=2) scatterWin+=megaCount*1500*megaBonus;

    if(doubleActive&&symWin>0) symWin*=2;

    let multiplier=1;
    if(this.activeEffects.has('double_spin')) multiplier=2;
    symWin*=multiplier;

    // Streak / losing_charge perks
    const hasStreak=this.activePerks.includes('streak_bonus');
    const hasLosingCharge=this.activePerks.includes('losing_charge');
    let streakBonus=0,chargeBonus=0;
    if(hasStreak&&this.winStreak>=3&&symWin>0) streakBonus=symWin*0.5;
    if(hasLosingCharge&&this.loseStreak>0&&(symWin+scatterWin)>0){
      const rate=Math.min(this.loseStreak*0.20,2.0);
      chargeBonus=Math.round((symWin+scatterWin)*rate);
    }

    // Fruit combo perk
    const hasFruitCombo=this.activePerks.includes('fruit_combo');
    let fruitBonus=0;
    if(hasFruitCombo){
      const fruits=['cherry','lemon','orange','grape'];
      const present=new Set(flat.filter(id=>fruits.includes(id)));
      if(present.size>=4) fruitBonus=400;
    }

    symWin=Math.round(symWin+streakBonus);

    // Bingo — per-symbol combo (페어/트리플/쿼드/퀸테트)
    const bingoGroups=[];
    let bingoBonus=0;
    let fullBingo=false;
    if(this.bingoPurchased){
      const symGroups={};
      for(const w of wins){ symGroups[w.sym]=(symGroups[w.sym]||0)+1; }
      const COMBO_NAMES={2:'페어',3:'트리플',4:'쿼드',5:'퀸테트'};
      const COMBO_MULTS={2:4,3:10,4:25,5:50};
      for(const [sym,count] of Object.entries(symGroups)){
        if(count>=2){
          const c=Math.min(count,5);
          const name=COMBO_NAMES[c]||count+'연속';
          const bonus=this.bet*COMBO_MULTS[c];
          bingoGroups.push({sym,count,name,bonus});
          bingoBonus+=bonus;
        }
      }
      const totalLines=n*2+2;
      if(wins.length>=totalLines){ fullBingo=true; bingoBonus+=this.bet*300; }
    }

    if(this.activePerks.includes('free_spin')&&bingoGroups.length>0) this.freeSpin=true;

    const shielded=this.activeEffects.has('shield');
    const total=Math.round(symWin+scatterWin+fruitBonus+chargeBonus+bingoBonus);
    if(shielded&&total===0) this.balance+=this.bet;
    this.balance+=total;
    if(this.balance>this.maxCoins) this.maxCoins=this.balance;

    if(total>0){ this.winStreak++; this.loseStreak=0; }
    else { this.loseStreak++; this.winStreak=0; }

    this.history.unshift({win:total});
    if(this.history.length>12) this.history.pop();
    this.activeEffects.clear();

    return{wins,winCells,scatters,
      symWin,scatterWin:Math.round(scatterWin),
      fruitBonus,chargeBonus,streakBonus:Math.round(streakBonus),
      bingoBonus:Math.round(bingoBonus),bingoGroups,fullBingo,
      total,doubleActive,multiplier,shielded};
  }

  getState(){
    return {
      balance:this.balance,
      gridSize:this.gridSize,
      unlockedGridSizes:[...this.unlockedGridSizes],
      unlockedSymIds:[...this.unlockedSymIds],
      ownedConsumables:this.ownedConsumables,
      upgradeLevels:this.upgradeLevels,
      bingoPurchased:this.bingoPurchased,
      spinCount:this.spinCount,
      activePerks:this.activePerks,
      weightBoosts:this.weightBoosts,
      extraSymVal:this.extraSymVal,
      winStreak:this.winStreak,
      loseStreak:this.loseStreak,
      freeSpin:this.freeSpin,
      history:this.history,
      maxCoins:this.maxCoins,
      pendingConsumable:this.pendingConsumable,
      pendingMilestone:this.pendingMilestone,
    };
  }

  applyState(s){
    this.balance=s.balance??1000;
    this.gridSize=s.gridSize??3;
    this.unlockedGridSizes=new Set(s.unlockedGridSizes??[3]);
    this.unlockedSymIds=new Set(s.unlockedSymIds??['cherry','lemon','orange','grape']);
    this.ownedConsumables=s.ownedConsumables??{};
    this.upgradeLevels=s.upgradeLevels??{};
    this.bingoPurchased=s.bingoPurchased??false;
    this.spinCount=s.spinCount??0;
    this.activePerks=s.activePerks??[];
    this.weightBoosts=s.weightBoosts??{};
    this.extraSymVal=s.extraSymVal??0;
    this.winStreak=s.winStreak??0;
    this.loseStreak=s.loseStreak??0;
    this.freeSpin=s.freeSpin??false;
    this.history=s.history??[];
    this.maxCoins=s.maxCoins??this.balance;
    this.pendingConsumable=s.pendingConsumable??null;
    this.pendingMilestone=s.pendingMilestone??null;
    this._rebuildPool();
    this._resetGrid();
  }

  save(){ try{ localStorage.setItem('rein_save',JSON.stringify(this.getState())); }catch(e){} }

  load(){
    try{
      const raw=localStorage.getItem('rein_save');
      if(!raw) return false;
      this.applyState(JSON.parse(raw));
      return true;
    }catch(e){ return false; }
  }
}
