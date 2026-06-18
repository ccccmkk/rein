class Simulation {
  constructor(canvas, popSize) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.popSize = popSize;
    this.city    = new City();
    this.dqn     = new DQN();
    this.agents  = [];
    this.tick    = 0;
    this.totalDeaths = 0;
    this.lifespans   = [];
    this.running = false;
    this.speed   = 5;
    this._raf    = null;
    this._lastTS = 0;
    this._tickBuf = 0;

    canvas.width  = GRID * TILE_SIZE;
    canvas.height = GRID * TILE_SIZE;

    this._spawnAll();
    this._render();
    this._updateUI();
  }

  _spawnAll() {
    this.agents = [];
    for (let i = 0; i < this.popSize; i++)
      this.agents.push(new Agent(this.city, i));
  }

  _tickAll() {
    for (const a of this.agents) {
      if (!a.alive) {
        // Respawn after cooldown
        if (a.deadTicks >= RESPAWN_TICKS) a.reset();
        else a.step();
        continue;
      }

      const state = a.getState();
      const atTarget = !a.target ||
        (Math.abs(a.x - a.target.x) + Math.abs(a.y - a.target.y)) <= 1;

      if (atTarget || !a.action) {
        // Push experience from previous decision
        if (a.prevState !== null) {
          this.dqn.push(a.prevState, a.prevAction, a.getReward(), state, false);
        }
        const actionIdx = this.dqn.act(state);
        a.setTarget(ACTIONS[actionIdx]);
        a.prevState  = state;
        a.prevAction = actionIdx;
      }

      a.step();

      if (!a.alive) {
        this.totalDeaths++;
        this.lifespans.push(a.age);
        if (a.prevState) {
          this.dqn.push(a.prevState, a.prevAction, -10, a.getState(), true);
        }
      }
    }

    this.tick++;
    if (this.tick % 8 === 0) this.dqn.trainAsync();
  }

  _render() {
    const ctx = this.ctx;
    const ts  = TILE_SIZE;

    // City tiles
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        ctx.fillStyle = TILE_CLR[this.city.grid[y][x]];
        ctx.fillRect(x * ts, y * ts, ts, ts);
      }
    }

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth   = 0.5;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * ts, 0);        ctx.lineTo(i * ts, GRID * ts); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,      i * ts);   ctx.lineTo(GRID * ts, i * ts); ctx.stroke();
    }

    // Agents
    for (const a of this.agents) {
      if (!a.alive) continue;
      const cx = a.x * ts + ts / 2;
      const cy = a.y * ts + ts / 2;
      const h  = a.needs.health;
      const hue = h * 120; // red -> green
      ctx.fillStyle = `hsl(${hue},80%,60%)`;
      ctx.beginPath();
      ctx.arc(cx, cy, ts * 0.32, 0, Math.PI * 2);
      ctx.fill();

      // Tiny health bar
      const bx = a.x * ts + 1;
      const by = a.y * ts;
      const bw = ts - 2;
      ctx.fillStyle = '#000';
      ctx.fillRect(bx, by, bw, 2);
      ctx.fillStyle = `hsl(${hue},80%,50%)`;
      ctx.fillRect(bx, by, bw * h, 2);
    }
  }

  _updateUI() {
    const alive = this.agents.filter(a => a.alive);
    const n = alive.length || 1;
    const avg = { hunger: 0, health: 0, happiness: 0, energy: 0 };
    for (const a of alive)
      for (const k of Object.keys(avg)) avg[k] += a.needs[k];
    for (const k of Object.keys(avg)) avg[k] /= n;

    const avgLife = this.lifespans.length
      ? Math.round(this.lifespans.slice(-50).reduce((a, b) => a + b, 0) / Math.min(50, this.lifespans.length))
      : '—';
    const gen = 1 + Math.floor(this.totalDeaths / this.popSize);

    document.getElementById('sTick').textContent   = this.tick;
    document.getElementById('sAlive').textContent  = alive.length;
    document.getElementById('sDeaths').textContent = this.totalDeaths;
    document.getElementById('sLife').textContent   = avgLife;
    document.getElementById('sGen').textContent    = gen;
    document.getElementById('sEps').textContent    = this.dqn.epsilon.toFixed(3);
    document.getElementById('sMem').textContent    = this.dqn.memory.length;

    document.getElementById('bHunger').style.width  = (avg.hunger    * 100) + '%';
    document.getElementById('bHealth').style.width  = (avg.health    * 100) + '%';
    document.getElementById('bHappy').style.width   = (avg.happiness * 100) + '%';
    document.getElementById('bEnergy').style.width  = (avg.energy    * 100) + '%';
  }

  _loop(ts) {
    if (!this.running) return;
    this._raf = requestAnimationFrame(t => this._loop(t));

    const dt = ts - this._lastTS;
    this._lastTS = ts;
    this._tickBuf += (this.speed * dt) / (1000 / 60);

    const ticks = Math.min(Math.floor(this._tickBuf), 80);
    this._tickBuf -= ticks;
    for (let i = 0; i < ticks; i++) this._tickAll();

    this._render();
    this._updateUI();
  }

  start() {
    if (this.running) return;
    this.running  = true;
    this._lastTS  = performance.now();
    this._tickBuf = 0;
    this._raf = requestAnimationFrame(t => this._loop(t));
  }

  pause() {
    this.running = false;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
  }

  reset(popSize) {
    this.pause();
    this.popSize     = popSize || this.popSize;
    this.tick        = 0;
    this.totalDeaths = 0;
    this.lifespans   = [];
    this.dqn         = new DQN();
    this._spawnAll();
    this._render();
    this._updateUI();
  }
}
