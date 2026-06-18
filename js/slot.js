const SYMBOLS = [
  {id:'cherry', e:'🍒', name:'체리',   val:2,   w:22},
  {id:'lemon',  e:'🍋', name:'레몬',   val:3,   w:18},
  {id:'orange', e:'🍊', name:'오렌지', val:4,   w:15},
  {id:'grape',  e:'🍇', name:'포도',   val:6,   w:12},
  {id:'bell',   e:'🔔', name:'뱨',     val:10,  w:9},
  {id:'star',   e:'⭐', name:'별',     val:15,  w:7},
  {id:'diamond',e:'💎', name:'다이아', val:25,  w:4},
  {id:'money',  e:'💰', name:'머니백', val:40,  w:2.5},
  {id:'crown',  e:'👑', name:'왔관',   val:75,  w:1.5},
  {id:'wild',   e:'🃏', name:'WILD',   val:0,   w:3,  special:'wild'},
  {id:'bomb',   e:'💣', name:'BOMB',   val:0,   w:2,  special:'bomb'},
  {id:'double', e:'⚡', name:'2배 ALL', val:0,   w:1.5,special:'double'},
  {id:'gift',   e:'🎁', name:'선물',   val:0,   w:1,  special:'gift'},
  {id:'mega',   e:'🌟', name:'MEGA',   val:200, w:0.5,special:'mega'},
];
const SYM = Object.fromEntries(SYMBOLS.map(s=>[s.id,s]));
const TOTAL_W = SYMBOLS.reduce((s,x)=>s+x.w,0);
const BET_OPTIONS = [10,20,50,100,200,500];

function randSym(){
  let r=Math.random()*TOTAL_W;
  for(const s of SYMBOLS){r-=s.w;if(r<=0)return s.id;}
  return SYMBOLS[0].id;
}

function getLines(){
  const L=[];
  for(let r=0;r<5;r++) L.push({name:`행${r+1}`,cells:[[r,0],[r,1],[r,2],[r,3],[r,4]]});
  for(let c=0;c<5;c++) L.push({name:`열${c+1}`,cells:[[0,c],[1,c],[2,c],[3,c],[4,c]]});
  L.push({name:'↘대각',cells:[[0,0],[1,1],[2,2],[3,3],[4,4]]});
  L.push({name:'↙대꫁',cells:[[0,4],[1,3],[2,2],[3,1],[4,0]]});
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

class SlotGame{
  constructor(){
    this.balance=1000;
    this.betIdx=0;
    this.grid=Array.from({length:5},()=>Array.from({length:5},randSym));
    this.spinning=false;
    this.history=[];
  }
  get bet(){return BET_OPTIONS[this.betIdx];}
  betUp(){if(this.betIdx<BET_OPTIONS.length-1)this.betIdx++;}
  betDown(){if(this.betIdx>0)this.betIdx--;}
  canSpin(){return !this.spinning&&this.balance>=this.bet;}
  spin(){
    this.balance-=this.bet;
    this.grid=Array.from({length:5},()=>Array.from({length:5},randSym));
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
      if(sym?.special&&sym.special!=='wild'&&sym.special!=='mega'){scatters.push({r,c,sym});if(sym.special==='double')doubleActive=true;}
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
    const total=Math.round(lineWin+scatterWin);
    this.balance+=total;
    this.history.unshift({bet:this.bet,win:total});
    if(this.history.length>12)this.history.pop();
    return{wins,winCells,scatters,lineWin:Math.round(lineWin),scatterWin:Math.round(scatterWin),total,doubleActive};
  }
}
