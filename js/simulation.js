class Simulation {
  constructor(popSize) {
    this.popSize     = popSize;
    this.city        = new City();
    this.dqn         = new DQN();
    this.agents      = [];
    this.tick        = 0;
    this.totalDeaths = 0;
    this.lifespans   = [];
    this.running     = false;
    this.speed       = 5;
    this._tickBuf    = 0;
    this._lastTS     = 0;
    this._dummy      = new THREE.Object3D();

    this._initThree();
    this._buildScene();
    this._spawnAll();
    this._initAgentMesh();
    this._updateAgentMesh();
    this._updateUI();
    requestAnimationFrame(t => this._frame(t));
  }

  _initThree() {
    const view = document.getElementById('view');
    const W = view.clientWidth || window.innerWidth - 220;
    const H = view.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07071a);
    this.scene.fog = new THREE.FogExp2(0x07071a, 0.008);

    this.camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 600);
    this.camera.position.set(GRID / 2, 38, GRID + 18);
    this.camera.lookAt(GRID / 2, 0, GRID / 2);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(W, H);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    view.appendChild(this.renderer.domElement);

    // Lights
    this.scene.add(new THREE.AmbientLight(0x3344aa, 0.9));
    const sun = new THREE.DirectionalLight(0xfff0dd, 1.4);
    sun.position.set(GRID * 0.6, 60, GRID * 0.3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near   = 1;
    sun.shadow.camera.far    = 200;
    sun.shadow.camera.left   = -GRID;
    sun.shadow.camera.right  = GRID * 2;
    sun.shadow.camera.top    = GRID * 2;
    sun.shadow.camera.bottom = -GRID;
    this.scene.add(sun);

    // City glow — fill light from below
    const fill = new THREE.HemisphereLight(0x223399, 0x112211, 0.5);
    this.scene.add(fill);

    // OrbitControls (observer camera)
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(GRID / 2, 0, GRID / 2);
    this.controls.enableDamping    = true;
    this.controls.dampingFactor    = 0.07;
    this.controls.minPolarAngle    = 0.05;
    this.controls.maxPolarAngle    = Math.PI / 2.05;
    this.controls.minDistance      = 4;
    this.controls.maxDistance      = 130;
    this.controls.update();

    window.addEventListener('resize', () => {
      const W = view.clientWidth;
      const H = view.clientHeight;
      this.camera.aspect = W / H;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(W, H);
    });
  }

  _buildScene() {
    // Stars
    const starPos = [];
    for (let i = 0; i < 2000; i++)
      starPos.push((Math.random()-0.5)*500, 30+Math.random()*200, (Math.random()-0.5)*500);
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.25 })));

    // Ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID + 6, GRID + 6),
      new THREE.MeshLambertMaterial({ color: 0x060612 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(GRID / 2, 0, GRID / 2);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Subtle road grid
    const lineMat = new THREE.LineBasicMaterial({ color: 0x1a1a40, transparent: true, opacity: 0.5 });
    for (let i = 0; i <= GRID; i++) {
      const h = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i, 0.02, 0), new THREE.Vector3(i, 0.02, GRID)
      ]);
      const v = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.02, i), new THREE.Vector3(GRID, 0.02, i)
      ]);
      this.scene.add(new THREE.Line(h, lineMat));
      this.scene.add(new THREE.Line(v, lineMat));
    }

    // Buildings — InstancedMesh per tile type
    const heights = {
      [TILE.HOME]:       2.2,
      [TILE.RESTAURANT]: 2.8,
      [TILE.HOSPITAL]:   4.2,
      [TILE.PARK]:       0.22,
      [TILE.WORKPLACE]:  5.5
    };
    const colors = {
      [TILE.HOME]:       0xc0392b,
      [TILE.RESTAURANT]: 0xe67e22,
      [TILE.HOSPITAL]:   0x2980b9,
      [TILE.PARK]:       0x27ae60,
      [TILE.WORKPLACE]:  0x8e44ad
    };

    // Count tiles per type
    const counts = {};
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++) {
        const t = this.city.grid[y][x];
        if (t !== TILE.ROAD) counts[t] = (counts[t] || 0) + 1;
      }

    const dummy = this._dummy;
    for (const [typeStr, count] of Object.entries(counts)) {
      const type = +typeStr;
      const h = heights[type];
      const mesh = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.88, h, 0.88),
        new THREE.MeshLambertMaterial({ color: colors[type] }),
        count
      );
      mesh.castShadow = mesh.receiveShadow = true;
      let idx = 0;
      for (let y = 0; y < GRID; y++)
        for (let x = 0; x < GRID; x++)
          if (this.city.grid[y][x] === type) {
            dummy.position.set(x + 0.5, h / 2, y + 0.5);
            dummy.scale.setScalar(1);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            mesh.setMatrixAt(idx++, dummy.matrix);
          }
      this.scene.add(mesh);
    }

    // Trees on parks
    const parks = this.city.buildings[TILE.PARK] || [];
    const treePer = 6;
    const totalTrees = parks.length * treePer;
    if (totalTrees > 0) {
      const treeMesh = new THREE.InstancedMesh(
        new THREE.ConeGeometry(0.28, 1.1, 6),
        new THREE.MeshLambertMaterial({ color: 0x196824 }),
        totalTrees
      );
      treeMesh.castShadow = true;
      let ti = 0;
      for (const p of parks) {
        for (let i = 0; i < treePer; i++) {
          dummy.position.set(
            p.x + (Math.random() - 0.5) * 3.5,
            0.55 + Math.random() * 0.2,
            p.y + (Math.random() - 0.5) * 3.5
          );
          dummy.scale.set(1, 0.7 + Math.random() * 0.6, 1);
          dummy.rotation.y = Math.random() * Math.PI * 2;
          dummy.updateMatrix();
          treeMesh.setMatrixAt(ti++, dummy.matrix);
        }
      }
      this.scene.add(treeMesh);
    }
  }

  _spawnAll() {
    this.agents = [];
    for (let i = 0; i < this.popSize; i++)
      this.agents.push(new Agent(this.city, i));
  }

  _initAgentMesh() {
    if (this.agentMesh) this.scene.remove(this.agentMesh);
    this.agentMesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.3, 8, 6),
      new THREE.MeshLambertMaterial({ vertexColors: false }),
      this.popSize
    );
    this.agentMesh.castShadow = true;
    this.scene.add(this.agentMesh);
  }

  _updateAgentMesh() {
    const dummy = this._dummy;
    const color = new THREE.Color();
    for (let i = 0; i < this.agents.length; i++) {
      const a = this.agents[i];
      if (!a.alive) {
        dummy.position.set(0, -20, 0);
        dummy.scale.setScalar(0.001);
        dummy.rotation.set(0, 0, 0);
      } else {
        dummy.position.set(a.x + 0.5, 0.5, a.y + 0.5);
        dummy.scale.setScalar(1);
        dummy.rotation.set(0, 0, 0);
      }
      dummy.updateMatrix();
      this.agentMesh.setMatrixAt(i, dummy.matrix);
      color.setHSL(a.needs.health * 0.33, 0.9, 0.55);
      this.agentMesh.setColorAt(i, color);
    }
    this.agentMesh.instanceMatrix.needsUpdate = true;
    if (this.agentMesh.instanceColor) this.agentMesh.instanceColor.needsUpdate = true;
  }

  _tickAll() {
    for (const a of this.agents) {
      if (!a.alive) {
        if (a.deadTicks >= RESPAWN_TICKS) a.reset();
        else a.step();
        continue;
      }

      const state = a.getState();
      const dist  = a.target
        ? Math.abs(a.x - a.target.x) + Math.abs(a.y - a.target.y)
        : 999;

      if (dist <= 1 || !a.action) {
        if (a.prevState !== null)
          this.dqn.push(a.prevState, a.prevAction, a.getReward(), state, false);
        const ai = this.dqn.act(state);
        a.setTarget(ACTIONS[ai]);
        a.prevState  = state;
        a.prevAction = ai;
      }

      a.step();

      if (!a.alive) {
        this.totalDeaths++;
        this.lifespans.push(a.age);
        if (a.prevState)
          this.dqn.push(a.prevState, a.prevAction, -10, a.getState(), true);
      }
    }

    this.tick++;
    if (this.tick % 8 === 0) this.dqn.trainAsync();
  }

  _updateUI() {
    const alive = this.agents.filter(a => a.alive);
    const n = alive.length || 1;
    const avg = { hunger: 0, health: 0, happiness: 0, energy: 0 };
    for (const a of alive) for (const k of Object.keys(avg)) avg[k] += a.needs[k];
    for (const k of Object.keys(avg)) avg[k] /= n;

    const recentLife = this.lifespans.slice(-50);
    const avgLife = recentLife.length
      ? Math.round(recentLife.reduce((a, b) => a + b, 0) / recentLife.length)
      : '—';

    document.getElementById('sTick').textContent   = this.tick;
    document.getElementById('sAlive').textContent  = alive.length;
    document.getElementById('sDeaths').textContent = this.totalDeaths;
    document.getElementById('sLife').textContent   = avgLife;
    document.getElementById('sGen').textContent    = 1 + Math.floor(this.totalDeaths / this.popSize);
    document.getElementById('sEps').textContent    = this.dqn.epsilon.toFixed(3);
    document.getElementById('sMem').textContent    = this.dqn.memory.length;

    document.getElementById('bHunger').style.width = (avg.hunger    * 100) + '%';
    document.getElementById('bHealth').style.width = (avg.health    * 100) + '%';
    document.getElementById('bHappy').style.width  = (avg.happiness * 100) + '%';
    document.getElementById('bEnergy').style.width = (avg.energy    * 100) + '%';
  }

  _frame(ts) {
    requestAnimationFrame(t => this._frame(t));

    const dt = Math.min(ts - this._lastTS, 100);
    this._lastTS = ts;

    if (this.running) {
      this._tickBuf += (this.speed * dt) / (1000 / 60);
      const ticks = Math.min(Math.floor(this._tickBuf), 80);
      this._tickBuf -= ticks;
      for (let i = 0; i < ticks; i++) this._tickAll();
    }

    this._updateAgentMesh();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this._updateUI();
  }

  start() { this.running = true; }
  pause() { this.running = false; }

  reset(popSize) {
    this.running     = false;
    const prev       = this.popSize;
    this.popSize     = popSize || this.popSize;
    this.tick        = 0;
    this.totalDeaths = 0;
    this.lifespans   = [];
    this.dqn         = new DQN();
    this._spawnAll();
    if (this.popSize !== prev) this._initAgentMesh();
    this._updateAgentMesh();
    this._updateUI();
  }
}
