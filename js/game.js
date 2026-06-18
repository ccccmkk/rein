const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

class RouletteGame {
  constructor() {
    this.balance = 1000;
    this.bets = {};        // { betKey: totalAmount }
    this.chipValue = 10;
    this.history = [];
  }

  placeBet(key) {
    if (this.balance < this.chipValue) return false;
    this.bets[key] = (this.bets[key] || 0) + this.chipValue;
    this.balance -= this.chipValue;
    return true;
  }

  clearBets() {
    for (const v of Object.values(this.bets)) this.balance += v;
    this.bets = {};
  }

  totalBet() {
    return Object.values(this.bets).reduce((s, v) => s + v, 0);
  }

  rollResult() {
    return Math.floor(Math.random() * 37); // 0–36
  }

  resolve(num) {
    let winnings = 0;
    for (const [key, bet] of Object.entries(this.bets)) {
      const mult = this._payout(key, num);
      winnings += bet * mult;
    }
    this.balance += winnings;
    const net = winnings - this.totalBet();
    this.bets = {};
    this.history.unshift({ num, winnings, net });
    if (this.history.length > 12) this.history.pop();
    return { winnings, net };
  }

  _payout(key, num) {
    if (key === 'red')   return (num > 0 && RED_NUMS.has(num))  ? 2 : 0;
    if (key === 'black') return (num > 0 && !RED_NUMS.has(num)) ? 2 : 0;
    if (key === 'odd')   return (num > 0 && num % 2 === 1)      ? 2 : 0;
    if (key === 'even')  return (num > 0 && num % 2 === 0)      ? 2 : 0;
    if (key === 'low')   return (num >= 1 && num <= 18)         ? 2 : 0;
    if (key === 'high')  return (num >= 19 && num <= 36)        ? 2 : 0;
    if (key === 'd1')    return (num >= 1 && num <= 12)         ? 3 : 0;
    if (key === 'd2')    return (num >= 13 && num <= 24)        ? 3 : 0;
    if (key === 'd3')    return (num >= 25 && num <= 36)        ? 3 : 0;
    if (key.startsWith('n')) return parseInt(key.slice(1)) === num ? 36 : 0;
    return 0;
  }

  numColor(n) {
    if (n === 0) return 'g';
    return RED_NUMS.has(n) ? 'r' : 'b';
  }
}
