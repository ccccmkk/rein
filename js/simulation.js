const _FWD   = new THREE.Vector3(0, 0, 1);
const _dummy = new THREE.Object3D();
const _col   = new THREE.Color();
const _tvec  = new THREE.Vector3();

class Simulation {
  constructor(numBirds) {
    this.numBirds    = numBirds;
    this.birds       = [];
    this.dqn         = new DQN();
    this.running     = false;
    this.speed       = 1;
    this._lastTS     = 0;
    this._tickN      = 0;
    this._rewardHist = [];
    this._chartCtx   = null;

    this._initThree();
    this._buildScene();
    this._spawnBirds();
    this._initBirdMesh();
    this._initChart();
    this._updateUI({});
    requestAnimationFrame(t => this._frame(t));
  }

  _initThree() {
    const view = document.getElementById('view');
    const W = view.clientWidth || window.innerWidth - 220;
    const H = view.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x08091a);
    this.scene.fog = new THREE.FogExp2(0x08091a, 0.004);

    this.camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 600);
    this.camera.position.set(0, 28, 105);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(W, H);
    view.insertBefore(this.renderer.domElement, view.firstChild);

    // Bright ambient so birds are always visible
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const sun = new THREE.DirectionalLight(0xcce0ff, 2.0);
    sun.position.set(-30, 50, 10);
    this.scene.add(sun);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.update();

    window.addEventListener('resize', () => {
      const W = view.clientWidth, H = view.clientHeight;
      this.camera.aspect = W / H;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(W, H);
    });
  }

  _buildScene() {
    // Stars
    const sp = [];
    for (let i = 0; i < 3000; i++)
      sp.push((Math.random()-.5)*700, (Math.random()-.5)*300, (Math.random()-.5)*700);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    this.scene.add(new THREE.Points(sg,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.9 })
    ));

    // Moon
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(7, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff4d0 })
    );
    moonMesh.position.set(-90, 60, -170);
    this.scene.add(moonMesh);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(11, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff0aa, transparent: true, opacity: 0.12, side: THREE.BackSide })
    );
    halo.position.copy(moonMesh.position);
    this.scene.add(halo);

    // Bounding volume wireframe — visible blue
    this.scene.add(Object.assign(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(BOUNDS*2, BOUNDS_Y*2, BOUNDS*2)),
        new THREE.LineBasicMaterial({ color: 0x2244cc, transparent: true, opacity: 0.5 })
      )
    ));
  }

  _spawnBirds() {
    this.birds = [];
    for (let i = 0; i < this.numBirds; i++) this.birds.push(new Bird(i));
  }

  _initBirdMesh() {
    if (this.birdMesh) this.scene.remove(this.birdMesh);
    const geo = new THREE.ConeGeometry(0.22, 0.9, 4);
    geo.rotateX(-Math.PI / 2);
    this.birdMesh = new THREE.InstancedMesh(
      geo,
      new THREE.MeshLambertMaterial(),
      this.numBirds
    );
    this.scene.add(this.birdMesh);
  }

  _initChart() {
    this._chartCtx = document.getElementById('rewardChart').getContext('2d');
  }

  _updateBirdMesh() {
    for (let i = 0; i < this.birds.length; i++) {
      const b = this.birds[i];
      _dummy.position.copy(b.pos);
      _tvec.copy(b.vel).normalize();
      if (_tvec.lengthSq() > 0.001) _dummy.quaternion.setFromUnitVectors(_FWD, _tvec);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      this.birdMesh.setMatrixAt(i, _dummy.matrix);

      // Color: isolated=blue, flock=bright yellow-white
      const n = b.neighbors.filter(nb => nb.dist < COHESION_R).length;
      const t = Math.min(n / 6, 1);
      // hue: 0.65 (blue) → 0.15 (yellow), lightness: 0.45 → 0.95
      _col.setHSL(0.65 - t * 0.5, 1.0 - t * 0.3, 0.45 + t * 0.5);
      this.birdMesh.setColorAt(i, _col);
    }
    this.birdMesh.instanceMatrix.needsUpdate = true;
    if (this.birdMesh.instanceColor) this.birdMesh.instanceColor.needsUpdate = true;
  }

  _drawChart(history) {
    const ctx = this._chartCtx;
    const W = 220, H = 50;
    ctx.clearRect(0, 0, W, H);
    if (history.length < 2) return;

    const mn = Math.min(...history, -1), mx = Math.max(...history, 0.5);
    const range = mx - mn || 1;
    const toY = v => H - ((v - mn) / range) * H;

    const zy = toY(0);
    ctx.strokeStyle = 'rgba(80,80,120,0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(0, zy); ctx.lineTo(W, zy); ctx.stroke();

    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#e74c3c');
    grad.addColorStop(0.5, '#f39c12');
    grad.addColorStop(1, '#2ecc71');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < history.length; i++) {
      const x = (i / (history.length - 1)) * W;
      i === 0 ? ctx.moveTo(x, toY(history[i])) : ctx.lineTo(x, toY(history[i]));
    }
    ctx.stroke();
  }

  _tick(dt) {
    const states  = this.birds.map(b => b.getState(this.birds));
    const actions = this.dqn.actBatch(states);

    let sumR=0, sumCoh=0, sumCol=0, sumAlign=0, counted=0;

    for (let i = 0; i < this.birds.length; i++) {
      const b = this.birds[i];
      if (b.prevState !== null) {
        const r = b.getReward();
        sumR     += r;
        sumCoh   += b._lastCohesion;
        sumCol   += b._lastCollision;
        sumAlign += b._lastAlignment;
        counted++;
        this.dqn.push(b.prevState, b.prevAction, r, states[i], false);
      }
      b.applyAction(actions[i]);
      b.prevState  = states[i];
      b.prevAction = actions[i];
    }

    for (const b of this.birds) b.update(dt);

    const n = counted || 1;
    const avgR = sumR / n;
    this._rewardHist.push(avgR);
    if (this._rewardHist.length > 260) this._rewardHist.shift();

    this._tickN++;
    if (this._tickN % 4 === 0) this.dqn.trainAsync(); // train 2x more often

    return {
      avgReward:    avgR,
      avgCohesion:  sumCoh   / n,
      avgCollision: sumCol   / n,
      avgAlignment: sumAlign / n
    };
  }

  _updateUI(s) {
    const eps = this.dqn.epsilon;
    let phase = '랜덤 탐색';
    if (eps < 0.75) phase = '패턴 발견 중';
    if (eps < 0.35) phase = '정책 수렴 중';
    if (eps < 0.12) phase = '군집 행동 학습 완료';

    document.getElementById('sEps').textContent   = eps.toFixed(3);
    document.getElementById('sMem').textContent   = this.dqn.memory.length;
    document.getElementById('sPhase').textContent = phase;

    if (s.avgReward !== undefined) {
      const fCoh   = 0.5  * s.avgCohesion;
      const fColl  = 1.0  * s.avgCollision;
      const fAlign = 0.2  * s.avgAlignment * s.avgCohesion;
      const avgR   = s.avgReward;

      document.getElementById('sCohesion').textContent   = s.avgCohesion.toFixed(1);
      document.getElementById('sCollisions').textContent = Math.round(s.avgCollision * this.birds.length);
      document.getElementById('sAvgReward').textContent  = avgR.toFixed(3);

      const setVal = (id, val, positive) => {
        const el = document.getElementById(id);
        el.textContent = (positive ? '+' : '−') + Math.abs(val).toFixed(3);
        el.className = 'f-val ' + (positive ? 'pos' : 'neg');
      };
      setVal('fv-flock',  fCoh,  true);
      setVal('fv-coll',   fColl, false);
      setVal('fv-align',  fAlign, fAlign >= 0);

      const tot = document.getElementById('fv-total');
      tot.textContent  = (avgR >= 0 ? '+' : '') + avgR.toFixed(3);
      tot.style.color  = avgR >= 0 ? '#2ecc71' : '#e74c3c';

      document.getElementById('fv-eps').textContent   = eps.toFixed(3);
      document.getElementById('fv-phase').textContent = phase;

      this._drawChart(this._rewardHist);
    }
  }

  _frame(ts) {
    requestAnimationFrame(t => this._frame(t));
    const raw = Math.min((ts - this._lastTS) / 1000, 0.05);
    this._lastTS = ts;
    const dt = raw * this.speed;

    let stats = {};
    if (this.running) {
      stats = this._tick(dt);
      this._updateUI(stats);
    }

    this._updateBirdMesh();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  start() { this.running = true; }
  pause() { this.running = false; }

  reset(numBirds) {
    this.running     = false;
    this.numBirds    = numBirds;
    this.dqn         = new DQN();
    this._rewardHist = [];
    this._tickN      = 0;
    this._spawnBirds();
    this._initBirdMesh();
    this._updateUI({});
  }
}
