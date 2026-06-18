const ACTIONS = ['eat', 'hospital', 'park', 'work', 'home'];
const ACTION_SIZE = ACTIONS.length;
const STATE_SIZE = 9;

const DECAY = {
  hunger:    0.0018,
  health:    0.0008,
  happiness: 0.001,
  energy:    0.0012
};

const RESPAWN_TICKS = 80;

class Agent {
  constructor(city, id) {
    this.city = city;
    this.id = id;
    this.reset();
  }

  reset() {
    const p = this.city.randomRoad();
    this.x = p.x;
    this.y = p.y;
    this.needs = { hunger: 0.8 + Math.random() * 0.2, health: 0.9, happiness: 0.7 + Math.random() * 0.3, energy: 0.8, money: 0.4 + Math.random() * 0.3 };
    this.alive = true;
    this.deadTicks = 0;
    this.age = 0;
    this.action = null;
    this.target = null;
    this.prevState = null;
    this.prevAction = null;
  }

  getState() {
    const { hunger, health, happiness, energy, money } = this.needs;
    const maxD = GRID * 2;
    const fd = this.city.nearest(this.x, this.y, TILE.RESTAURANT).dist;
    const hd = this.city.nearest(this.x, this.y, TILE.HOSPITAL).dist;
    const pd = this.city.nearest(this.x, this.y, TILE.PARK).dist;
    const wd = this.city.nearest(this.x, this.y, TILE.WORKPLACE).dist;
    return [
      hunger, health, happiness, energy, money,
      1 - Math.min(fd, maxD) / maxD,
      1 - Math.min(hd, maxD) / maxD,
      1 - Math.min(pd, maxD) / maxD,
      1 - Math.min(wd, maxD) / maxD
    ];
  }

  getReward() {
    const { hunger, health, happiness, energy } = this.needs;
    return (hunger * 0.35 + health * 0.35 + happiness * 0.15 + energy * 0.15) * 0.1;
  }

  setTarget(actionName) {
    this.action = actionName;
    const typeMap = {
      eat: TILE.RESTAURANT,
      hospital: TILE.HOSPITAL,
      park: TILE.PARK,
      work: TILE.WORKPLACE,
      home: TILE.HOME
    };
    this.target = this.city.nearest(this.x, this.y, typeMap[actionName]).pos;
  }

  step() {
    if (!this.alive) {
      this.deadTicks++;
      return;
    }

    this.age++;

    // Move one tile toward target
    if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      if (Math.abs(dx) >= Math.abs(dy)) {
        this.x += Math.sign(dx);
      } else {
        this.y += Math.sign(dy);
      }
    }

    // Apply effects when at building tile
    const t = this.city.tile(this.x, this.y);
    const n = this.needs;

    if (t === TILE.RESTAURANT && this.action === 'eat') {
      n.hunger   = Math.min(1, n.hunger + 0.18);
      n.money    = Math.max(0, n.money  - 0.06);
      n.happiness = Math.min(1, n.happiness + 0.02);
    }
    if (t === TILE.HOSPITAL && this.action === 'hospital') {
      n.health = Math.min(1, n.health + 0.15);
      n.money  = Math.max(0, n.money  - 0.10);
    }
    if (t === TILE.PARK && this.action === 'park') {
      n.happiness = Math.min(1, n.happiness + 0.12);
      n.energy    = Math.max(0, n.energy    - 0.02);
    }
    if (t === TILE.WORKPLACE && this.action === 'work') {
      n.money  = Math.min(1, n.money  + 0.07);
      n.energy = Math.max(0, n.energy - 0.05);
    }
    if (t === TILE.HOME && this.action === 'home') {
      n.energy    = Math.min(1, n.energy + 0.12);
      n.happiness = Math.min(1, n.happiness + 0.02);
    }

    // Natural decay
    n.hunger    -= DECAY.hunger;
    n.health    -= DECAY.health;
    n.happiness -= DECAY.happiness;
    n.energy    -= DECAY.energy;

    // Starvation penalty
    if (n.hunger < 0.15) n.health -= 0.004;
    // Poverty stress
    if (n.money < 0.1) n.happiness -= 0.001;

    // Clamp
    for (const k of Object.keys(n)) n[k] = Math.max(0, Math.min(1, n[k]));

    if (n.health <= 0 || n.hunger <= 0) {
      this.alive = false;
      this.deadTicks = 0;
    }
  }
}
