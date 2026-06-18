const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

class RouletteGame {
  constructor() {
    this.balance   = 1000;
    this.bets      = {};
    this.chipValue = 10;
    this.history   = [];
  }
  placeBet(key) {
    if (this.balance < this.chipValue) return false;
    this.bets[key] = (this.bets[key]||0) + this.chipValue;
    this.balance  -= this.chipValue;
    return true;
  }
  clearBets() {
    for (const v of Object.values(this.bets)) this.balance += v;
    this.bets = {};
  }
  totalBet() { return Object.values(this.bets).reduce((s,v)=>s+v,0); }
  rollResult() { return Math.floor(Math.random()*37); }
  resolve(num) {
    let w=0;
    for (const [k,b] of Object.entries(this.bets)) w+=b*this._payout(k,num);
    this.balance+=w;
    const net=w-this.totalBet();
    this.bets={};
    this.history.unshift({num,winnings:w,net});
    if (this.history.length>12) this.history.pop();
    return {winnings:w,net};
  }
  _payout(k,n) {
    if (k==='red')   return n>0&&RED_NUMS.has(n)  ?2:0;
    if (k==='black') return n>0&&!RED_NUMS.has(n) ?2:0;
    if (k==='odd')   return n>0&&n%2===1          ?2:0;
    if (k==='even')  return n>0&&n%2===0          ?2:0;
    if (k==='low')   return n>=1&&n<=18           ?2:0;
    if (k==='high')  return n>=19&&n<=36          ?2:0;
    if (k==='d1')    return n>=1&&n<=12           ?3:0;
    if (k==='d2')    return n>=13&&n<=24          ?3:0;
    if (k==='d3')    return n>=25&&n<=36          ?3:0;
    if (k.startsWith('n')) return parseInt(k.slice(1))===n?36:0;
    return 0;
  }
  numColor(n) { return n===0?'g':RED_NUMS.has(n)?'r':'b'; }
}
