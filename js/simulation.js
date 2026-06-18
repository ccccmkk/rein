class Simulation {
  constructor(numCars, numPolice) {
    this.numCars   = numCars;
    this.numPolice = numPolice;
    this.road      = new RoadNetwork();
    this.cars      = [];
    this.running   = false;
    this.speed     = 1;
    this._lastTS   = 0;
    this.stats     = { totalFines: 0, fineAmount: 0, speedFines: 0, redFines: 0 };

    this._initThree();
    this._buildScene();
    this._spawnCars();
    this._updateUI();
    requestAnimationFrame(t => this._frame(t));
  }

  _initThree() {
    const view = document.getElementById('view');
    const W = view.clientWidth, H = view.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07071a);
    this.scene.fog = new THREE.Fog(0x07071a, 110, 230);

    this.camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 500);
    this.camera.position.set(0, 60, 80);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(W, H);
    this.renderer.shadowMap.enabled = true;
    view.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0x334466, 1.2));
    const sun = new THREE.DirectionalLight(0xfff0dd, 0.9);
    sun.position.set(50, 90, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near   = 1;
    sun.shadow.camera.far    = 250;
    sun.shadow.camera.left   = sun.shadow.camera.bottom = -80;
    sun.shadow.camera.right  = sun.shadow.camera.top    =  80;
    this.scene.add(sun);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping  = true;
    this.controls.dampingFactor  = 0.07;
    this.controls.maxPolarAngle  = Math.PI / 2.1;
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
    for (let i = 0; i < 2000; i++)
      sp.push((Math.random()-.5)*500, 30+Math.random()*160, (Math.random()-.5)*500);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    this.scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.18 })));

    // Ground
    const gw = (COLS - 1) * SPACING + SPACING;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(gw, gw),
      new THREE.MeshLambertMaterial({ color: 0x121220 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const roadMat  = new THREE.MeshLambertMaterial({ color: 0x1e1e30 });
    const interMat = new THREE.MeshLambertMaterial({ color: 0x28283c });

    // Horizontal road segments
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 1; c++) {
        const a = this.road.nodes[r * COLS + c];
        const b = this.road.nodes[r * COLS + c + 1];
        const seg = new THREE.Mesh(new THREE.BoxGeometry(SPACING, 0.12, ROAD_W), roadMat);
        seg.position.set((a.x + b.x) / 2, 0.06, a.z);
        seg.receiveShadow = true;
        this.scene.add(seg);
      }
    }

    // Vertical road segments
    for (let r = 0; r < ROWS - 1; r++) {
      for (let c = 0; c < COLS; c++) {
        const a = this.road.nodes[r * COLS + c];
        const b = this.road.nodes[(r + 1) * COLS + c];
        const seg = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W, 0.12, SPACING), roadMat);
        seg.position.set(a.x, 0.06, (a.z + b.z) / 2);
        seg.receiveShadow = true;
        this.scene.add(seg);
      }
    }

    // Intersections + traffic lights
    this._lightMeshes = [];
    for (const node of this.road.nodes) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W, 0.14, ROAD_W), interMat);
      pad.position.set(node.x, 0.07, node.z);
      this.scene.add(pad);

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 2.8, 6),
        new THREE.MeshLambertMaterial({ color: 0x555566 })
      );
      pole.position.set(node.x + 2.6, 1.4, node.z + 2.6);
      this.scene.add(pole);

      const lMat = new THREE.MeshLambertMaterial({
        color: 0xff2200, emissive: new THREE.Color(0x440000)
      });
      const lSph = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), lMat);
      lSph.position.set(node.x + 2.6, 3.1, node.z + 2.6);
      this.scene.add(lSph);
      this._lightMeshes.push({ node, mat: lMat });
    }

    // City blocks (buildings between intersections)
    const bMats = [0x2a2a4a, 0x1e3a5a, 0x3a2a4a, 0x1a3a2a, 0x4a3020].map(
      c => new THREE.MeshLambertMaterial({ color: c })
    );
    const blockInner = SPACING - ROAD_W - 1;
    for (let r = 0; r < ROWS - 1; r++) {
      for (let c = 0; c < COLS - 1; c++) {
        const a  = this.road.nodes[r * COLS + c];
        const cx = a.x + SPACING / 2;
        const cz = a.z + SPACING / 2;
        const nb = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < nb; i++) {
          const bw = 1.5 + Math.random() * 2.5;
          const bh = 2   + Math.random() * 10;
          const bd = 1.5 + Math.random() * 2.5;
          const bx = cx + (Math.random() - .5) * (blockInner - bw);
          const bz = cz + (Math.random() - .5) * (blockInner - bd);
          const bld = new THREE.Mesh(
            new THREE.BoxGeometry(bw, bh, bd),
            bMats[Math.floor(Math.random() * bMats.length)]
          );
          bld.position.set(bx, bh / 2, bz);
          bld.castShadow = bld.receiveShadow = true;
          this.scene.add(bld);
        }
      }
    }
  }

  _spawnCars() {
    for (const car of this.cars) if (car.mesh) this.scene.remove(car.mesh);
    this.cars = [];

    const carGeo = new THREE.BoxGeometry(1.5, 0.6, 2.6);

    for (let i = 0; i < this.numCars; i++) {
      const car = new Car(this.road, 'citizen', i);
      const col = new THREE.Color().setHSL(car.hue, 0.7, 0.55);
      const mat = new THREE.MeshLambertMaterial({ color: col, emissive: new THREE.Color(0, 0, 0) });
      const mesh = new THREE.Mesh(carGeo, mat);
      mesh.position.y = 0.38;
      mesh.castShadow = true;
      this.scene.add(mesh);
      car.mesh = mesh;
      this.cars.push(car);
    }

    for (let i = 0; i < this.numPolice; i++) {
      const car  = new Car(this.road, 'police', i);
      const mat  = new THREE.MeshLambertMaterial({ color: 0x0033bb });
      const mesh = new THREE.Mesh(carGeo, mat);
      mesh.position.y = 0.38;
      mesh.castShadow = true;
      this.scene.add(mesh);
      car.mesh = mesh;

      // Siren light
      const sirenMat = new THREE.MeshLambertMaterial({
        color: 0xff0000, emissive: new THREE.Color(1, 0, 0)
      });
      const siren = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 4), sirenMat);
      siren.position.y = 0.55;
      mesh.add(siren);
      car.sirenMesh = siren;
      this.cars.push(car);
    }
  }

  _updateMeshes(ts) {
    for (const car of this.cars) {
      const p = car.pos;
      car.mesh.position.x = p.x;
      car.mesh.position.z = p.z;

      if (car.pathIdx < car.path.length - 1) {
        const f = this.road.nodes[car.path[car.pathIdx]];
        const t = this.road.nodes[car.path[car.pathIdx + 1]];
        car.mesh.rotation.y = Math.atan2(t.x - f.x, t.z - f.z);
      }

      if (car.type === 'citizen') {
        const em = car.mesh.material.emissive;
        if      (car.fineTimer > 2)   em.setRGB(0.9, 0, 0);
        else if (car.isSpeeding)      em.setRGB(0.35, 0.1, 0);
        else if (car.justRanRed)      em.setRGB(0.4, 0, 0);
        else                          em.setRGB(0, 0, 0);
      }

      if (car.sirenMesh) {
        const b = Math.sin(ts * 0.009) > 0;
        car.sirenMesh.material.color.setHex(b ? 0xff0000 : 0x0000ff);
        car.sirenMesh.material.emissive.setRGB(b ? 0.5 : 0, 0, b ? 0 : 0.5);
      }
    }

    for (const { node, mat } of this._lightMeshes) {
      const green = node.phase === 'EW';
      mat.color.setHex(green ? 0x00ff44 : 0xff2200);
      mat.emissive.setHex(green ? 0x004411 : 0x440000);
    }
  }

  _frame(ts) {
    requestAnimationFrame(t => this._frame(t));
    const raw = Math.min((ts - this._lastTS) / 1000, 0.05);
    this._lastTS = ts;
    const dt = raw * this.speed;

    if (this.running) {
      this.road.update(dt);
      for (const car of this.cars) {
        const r = car.update(dt, this.cars);
        if (r?.type === 'fine') {
          this.stats.totalFines++;
          this.stats.fineAmount += r.amount;
          if (r.violation === 'red') this.stats.redFines++;
          else                       this.stats.speedFines++;
        }
      }
      this._updateUI();
    }

    this._updateMeshes(ts);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  _updateUI() {
    const cits  = this.cars.filter(c => c.type === 'citizen');
    const pols  = this.cars.filter(c => c.type === 'police');
    const avg   = cits.length ? cits.reduce((s, c) => s + c.money, 0) / cits.length : 0;

    document.getElementById('sTotalFines').textContent = this.stats.totalFines.toLocaleString() + '건';
    document.getElementById('sFineAmount').textContent = Math.floor(this.stats.fineAmount / 10000).toLocaleString() + '만원';
    document.getElementById('sSpeedFines').textContent = this.stats.speedFines.toLocaleString() + '건';
    document.getElementById('sRedFines').textContent   = this.stats.redFines.toLocaleString()   + '건';
    document.getElementById('sPolFines').textContent   = pols.reduce((s, p) => s + p.finesIssued, 0).toLocaleString() + '건';
    document.getElementById('sAvgMoney').textContent   = Math.floor(avg / 10000).toLocaleString() + '만원';
    document.getElementById('sSpeeders').textContent  = cits.filter(c => c.isSpeeding).length  + '/' + cits.length;
    document.getElementById('sRedNow').textContent    = cits.filter(c => c.justRanRed).length   + '/' + cits.length;
  }

  start() { this.running = true; }
  pause() { this.running = false; }

  reset(numCars, numPolice) {
    this.running   = false;
    this.numCars   = numCars;
    this.numPolice = numPolice;
    this.stats     = { totalFines: 0, fineAmount: 0, speedFines: 0, redFines: 0 };
    this._spawnCars();
    this._updateUI();
  }
}
