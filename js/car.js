const FINE_SPEED  = 150000;  // 15만원
const FINE_RED    = 300000;  // 30만원
const INCOME_RATE = 3000;    // 원/초
const DETECT_R    = 10;
const FINE_R      = 2.5;

class Car {
  constructor(road, type, id) {
    this.road = road;
    this.type = type;
    this.id   = id;
    this.hue  = Math.random();

    this.riskTolerance = type === 'citizen' ? Math.random() : 0;
    this.money       = type === 'citizen' ? 500000 + Math.random() * 2000000 : 0;
    this.finesIssued = 0;
    this.fineTotal   = 0;
    this.fineTimer   = 0;   // cooldown after being fined
    this.isSpeeding  = false;
    this.justRanRed  = false;
    this.redTimer    = 0;
    this.waiting     = false;
    this.waitTimer   = 0;
    this.mesh        = null;
    this.sirenMesh   = null;

    this._reroute(road.randomNode());
  }

  _reroute(fromId) {
    let dest = this.road.randomNode();
    while (dest === fromId) dest = this.road.randomNode();
    this.path     = this.road.findPath(fromId, dest);
    this.pathIdx  = 0;
    this.progress = 0;
  }

  get pos() {
    if (this.pathIdx >= this.path.length - 1) {
      const n = this.road.nodes[this.path[this.path.length - 1]];
      return { x: n.x, z: n.z };
    }
    return this.road.getPos(this.path[this.pathIdx], this.path[this.pathIdx + 1], this.progress);
  }

  update(dt, allCars) {
    if (this.fineTimer > 0) this.fineTimer -= dt;
    if (this.redTimer  > 0) { this.redTimer -= dt; if (this.redTimer <= 0) this.justRanRed = false; }
    if (this.type === 'citizen') { this._citizen(dt); return null; }
    return this._police(dt, allCars);
  }

  _citizen(dt) {
    if (this.waiting) {
      this.waitTimer -= dt;
      if (this.waitTimer <= 0) this.waiting = false;
      return;
    }

    if (this.pathIdx >= this.path.length - 1) {
      this._reroute(this.path[this.path.length - 1]);
      return;
    }

    // Red light check when approaching next intersection
    if (this.progress > 0.82 && this.pathIdx < this.path.length - 2) {
      const nextId = this.path[this.pathIdx + 1];
      const fromId = this.path[this.pathIdx];
      if (!this.road.canGo(nextId, fromId)) {
        if (this.riskTolerance > 0.65 && Math.random() < 0.25) {
          this.justRanRed = true;
          this.redTimer = 5;
        } else {
          this.waiting   = true;
          this.waitTimer = 1.5 + Math.random() * 2;
          return;
        }
      }
    }

    // Speed: risky drivers go faster
    const over  = this.riskTolerance > 0.45 ? 1 + (this.riskTolerance - 0.45) * 1.2 : 1;
    const spd   = SPEED_LIMIT * (this.fineTimer > 0 ? 0.75 : over);
    this.isSpeeding = spd > SPEED_LIMIT * 1.15;

    this.progress += (spd * dt) / SPACING;
    if (this.progress >= 1) { this.progress = 0; this.pathIdx++; }

    this.money += INCOME_RATE * dt;
  }

  _police(dt, allCars) {
    let result  = null;
    const q     = this.pos;

    // Detect nearest violator in range
    let best = null, bd = Infinity;
    for (const c of allCars) {
      if (c.type !== 'citizen' || c.fineTimer > 0) continue;
      if (!c.isSpeeding && !c.justRanRed) continue;
      const p = c.pos;
      const d = Math.hypot(p.x - q.x, p.z - q.z);
      if (d < DETECT_R && d < bd) { bd = d; best = c; }
    }

    // Issue fine when close enough
    if (best && bd < FINE_R) {
      const isRed = best.justRanRed;
      const amt   = isRed ? FINE_RED : FINE_SPEED;
      best.money      -= amt;
      best.isSpeeding  = false;
      best.justRanRed  = false;
      best.fineTimer   = 4;
      this.finesIssued++;
      this.fineTotal  += amt;
      result = { type: 'fine', amount: amt, violation: isRed ? 'red' : 'speed' };
    }

    // Move: chase violator or patrol
    const chaseSpd = best ? SPEED_LIMIT * 2.2 : SPEED_LIMIT * 1.4;
    if (this.pathIdx >= this.path.length - 1) {
      const cur = this.path[this.path.length - 1];
      if (best) {
        // Route toward nearest node to violator
        let tgt = 0, td = Infinity;
        for (const n of this.road.nodes) {
          const d = Math.hypot(n.x - best.pos.x, n.z - best.pos.z);
          if (d < td) { td = d; tgt = n.id; }
        }
        this.path = this.road.findPath(cur, tgt);
      } else {
        this._reroute(cur);
      }
      this.pathIdx = 0; this.progress = 0;
    }

    if (this.pathIdx < this.path.length - 1) {
      this.progress += (chaseSpd * dt) / SPACING;
      if (this.progress >= 1) { this.progress = 0; this.pathIdx++; }
    }

    return result;
  }
}
