const BIRD_SPEED  = 8;
const TURN_ANGLE  = Math.PI / 18; // 10 deg
const BOUNDS      = 42;
const BOUNDS_Y    = 22;
const COHESION_R  = 16;
const COLLISION_R = 2.5;
const STATE_SIZE  = 18; // 3 own_vel + 5 neighbors × 3 rel_pos
const ACTION_SIZE = 5;

const _b_tmpA = new THREE.Vector3();
const _b_tmpB = new THREE.Vector3();
const _b_up   = new THREE.Vector3(0, 1, 0);

class Bird {
  constructor(id) {
    this.id  = id;
    this.pos = new THREE.Vector3(
      (Math.random() - .5) * BOUNDS * 1.2,
      (Math.random() - .5) * BOUNDS_Y,
      (Math.random() - .5) * BOUNDS * 1.2
    );
    this.vel = new THREE.Vector3(
      Math.random() - .5,
      (Math.random() - .5) * .15,
      Math.random() - .5
    ).normalize().multiplyScalar(BIRD_SPEED);

    this.prevState  = null;
    this.prevAction = null;
    this.neighbors  = [];

    this._lastCohesion  = 0;
    this._lastCollision = 0;
    this._lastAlignment = 0;
    this.lastReward     = 0;
  }

  getState(allBirds) {
    const others = [];
    for (const b of allBirds) {
      if (b.id === this.id) continue;
      others.push({ bird: b, d2: this.pos.distanceToSquared(b.pos) });
    }
    others.sort((a, b) => a.d2 - b.d2);
    this.neighbors = others.slice(0, 5).map(o => ({
      bird: o.bird,
      dist: Math.sqrt(o.d2)
    }));

    const s = [
      this.vel.x / BIRD_SPEED,
      this.vel.y / BIRD_SPEED,
      this.vel.z / BIRD_SPEED
    ];
    for (let i = 0; i < 5; i++) {
      if (i < this.neighbors.length) {
        const rel = _b_tmpA.copy(this.neighbors[i].bird.pos).sub(this.pos);
        s.push(rel.x / BOUNDS, rel.y / BOUNDS_Y, rel.z / BOUNDS);
      } else {
        s.push(0, 0, 0);
      }
    }
    return s;
  }

  getReward() {
    let coh = 0, col = 0, align = 0;
    for (const { bird, dist } of this.neighbors) {
      if (dist < COLLISION_R) {
        col++;
      } else if (dist < COHESION_R) {
        coh++;
        const dot = _b_tmpA.copy(this.vel).normalize()
                            .dot(_b_tmpB.copy(bird.vel).normalize());
        align += Math.max(0, dot);
      }
    }
    this._lastCohesion  = coh;
    this._lastCollision = col;
    this._lastAlignment = coh > 0 ? align / coh : 0;
    // Rebalanced: cohesion reward >> collision penalty so birds learn to flock
    this.lastReward = 0.5 * coh - 1.0 * col + 0.2 * align;
    return this.lastReward;
  }

  applyAction(actionIdx) {
    const fwd   = _b_tmpA.copy(this.vel).normalize();
    const right = _b_tmpB.crossVectors(fwd, _b_up).normalize();
    switch (actionIdx) {
      case 0: this.vel.applyAxisAngle(_b_up,    TURN_ANGLE); break;
      case 1: this.vel.applyAxisAngle(_b_up,   -TURN_ANGLE); break;
      case 2: this.vel.applyAxisAngle(right,    TURN_ANGLE); break;
      case 3: this.vel.applyAxisAngle(right,   -TURN_ANGLE); break;
      // case 4: maintain heading
    }
    if (Math.abs(this.pos.y) > BOUNDS_Y * 0.75) this.vel.y *= 0.88;
    this.vel.normalize().multiplyScalar(BIRD_SPEED);
  }

  update(dt) {
    this.pos.addScaledVector(this.vel, dt);
    if (Math.abs(this.pos.x) > BOUNDS)   { this.vel.x *= -1; this.pos.x = Math.sign(this.pos.x) * BOUNDS;   }
    if (Math.abs(this.pos.y) > BOUNDS_Y) { this.vel.y *= -1; this.pos.y = Math.sign(this.pos.y) * BOUNDS_Y; }
    if (Math.abs(this.pos.z) > BOUNDS)   { this.vel.z *= -1; this.pos.z = Math.sign(this.pos.z) * BOUNDS;   }
    if (this.vel.lengthSq() < 0.01) this.vel.set(1, 0, 0).multiplyScalar(BIRD_SPEED);
    else this.vel.normalize().multiplyScalar(BIRD_SPEED);
  }
}
