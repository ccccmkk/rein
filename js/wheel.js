// European roulette wheel order
const WHEEL_NUMS = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED_SET = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const N_SLOTS = 37;
const SEG = (2 * Math.PI) / N_SLOTS;
const WHEEL_R = 9;

class RouletteWheel {
  constructor() {
    this.spinning = false;
    this.wheelAngle = 0;
    this.ballAngle  = 0;
    this.onDone = null;
    this._lastTS = 0;
    this._initThree();
    this._buildScene();
    requestAnimationFrame(t => this._frame(t));
  }

  _initThree() {
    const area = document.getElementById('wheel-area');
    const W = area.clientWidth || window.innerWidth - 230;
    const H = area.clientHeight || window.innerHeight;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05090505);
    this.camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 200);
    this.camera.position.set(0, 20, 10);
    this.camera.lookAt(0, 0, 0);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(W, H);
    area.insertBefore(this.renderer.domElement, area.firstChild);
    window.addEventListener('resize', () => {
      const W = area.clientWidth, H = area.clientHeight;
      this.camera.aspect = W / H;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(W, H);
    });
  }

  _buildScene() {
    // Lights
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const spot = new THREE.DirectionalLight(0xffe8a0, 2.5);
    spot.position.set(0, 20, 5);
    this.scene.add(spot);
    const fill = new THREE.DirectionalLight(0x4488ff, 0.4);
    fill.position.set(-10, 5, -10);
    this.scene.add(fill);

    // Table felt
    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(15, 15, 0.25, 64),
      new THREE.MeshLambertMaterial({ color: 0x0d3d15 })
    );
    table.position.y = -0.5;
    this.scene.add(table);

    // Outer gold rim
    const outerRim = new THREE.Mesh(
      new THREE.TorusGeometry(15, 0.35, 8, 72),
      new THREE.MeshLambertMaterial({ color: 0x8b6914 })
    );
    outerRim.rotation.x = Math.PI / 2;
    outerRim.position.y = -0.35;
    this.scene.add(outerRim);

    // Build wheel texture
    const tex = this._makeTexture();

    // Wheel disc (cylinder, multiple materials: side/top/bottom)
    const geo = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.55, 72);
    const mats = [
      new THREE.MeshLambertMaterial({ color: 0x3a2806 }),  // side
      new THREE.MeshLambertMaterial({ map: tex }),           // top (cap)
      new THREE.MeshLambertMaterial({ color: 0x3a2806 }),  // bottom
    ];
    this.wheelMesh = new THREE.Mesh(geo, mats);
    this.scene.add(this.wheelMesh);

    // Wheel gold rim
    const wRim = new THREE.Mesh(
      new THREE.TorusGeometry(WHEEL_R + 0.1, 0.28, 8, 72),
      new THREE.MeshLambertMaterial({ color: 0xc8a82a })
    );
    wRim.rotation.x = Math.PI / 2;
    wRim.position.y = 0.28;
    this.scene.add(wRim);

    // Inner cone / spindle
    const spindle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.2, 0.6, 16),
      new THREE.MeshLambertMaterial({ color: 0xc8a82a })
    );
    spindle.position.y = 0.55;
    this.scene.add(spindle);

    // Ball
    this.ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 16),
      new THREE.MeshLambertMaterial({ color: 0xeeeecc })
    );
    this.ballPivot = new THREE.Object3D();
    this.ballPivot.add(this.ball);
    this.scene.add(this.ballPivot);
    this.ball.position.set(WHEEL_R * 0.93, 1.0, 0);
  }

  _makeTexture() {
    const SIZE = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE; canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    const cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2 - 2;

    // Background
    ctx.fillStyle = '#1a0e04';
    ctx.fillRect(0, 0, SIZE, SIZE);

    for (let i = 0; i < N_SLOTS; i++) {
      const num = WHEEL_NUMS[i];
      // Three.js top cap: UV maps so that looking down -Y, +X world = rightward in UV.
      // We draw starting from angle 0 (right side of canvas) going counter-clockwise.
      const a0 = i * SEG - SEG / 2;
      const a1 = a0 + SEG;

      // Fill sector
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r * 0.95, a0, a1);
      ctx.closePath();
      ctx.fillStyle = num === 0 ? '#1a6b1a' : RED_SET.has(num) ? '#b81010' : '#141414';
      ctx.fill();

      // Divider line
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a0) * r * 0.12, cy + Math.sin(a0) * r * 0.12);
      ctx.lineTo(cx + Math.cos(a0) * r * 0.95, cy + Math.sin(a0) * r * 0.95);
      ctx.strokeStyle = '#c8a82a';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Number label
      const mid = a0 + SEG / 2;
      const tx = cx + Math.cos(mid) * r * 0.74;
      const ty = cy + Math.sin(mid) * r * 0.74;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(mid + Math.PI / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(num.toString(), 0, 0);
      ctx.restore();
    }

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.95, 0, Math.PI * 2);
    ctx.strokeStyle = '#c8a82a';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Inner decorative ring
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = '#8b6914';
    ctx.fill();
    ctx.strokeStyle = '#c8a82a';
    ctx.lineWidth = 3;
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }

  // Returns wheel rotation.y so that slot at wheelIdx faces the marker (+Z direction = toward camera)
  _angleForSlot(wheelIdx) {
    // Each slot is SEG radians apart. Slot 0 was drawn at angle 0 (right = +X in world).
    // Marker is toward camera (+Z). That's 90deg (PI/2) from +X.
    // So we need slot wheelIdx to be at PI/2 in world:
    //   wheelAngle + wheelIdx*SEG = PI/2  => wheelAngle = PI/2 - wheelIdx*SEG
    return Math.PI / 2 - wheelIdx * SEG;
  }

  spin(winNum, onDone) {
    if (this.spinning) return;
    const winIdx = WHEEL_NUMS.indexOf(winNum);
    const targetBase = this._angleForSlot(winIdx);
    // Add many full rotations + random extra to look exciting
    const spins = 8 + Math.floor(Math.random() * 4);
    const finalAngle = targetBase + spins * Math.PI * 2;

    this.spinning = true;
    this.onDone = onDone;
    this._spinStart = performance.now();
    this._spinDur = 5000 + Math.random() * 1500;
    this._spinFrom = this.wheelAngle;
    this._spinTo = finalAngle;
    this._ballStartAngle = this.ballAngle;
  }

  _easeOut(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  _frame(ts) {
    requestAnimationFrame(t => this._frame(t));
    const dt = Math.min((ts - this._lastTS) / 1000, 0.05);
    this._lastTS = ts;

    if (this.spinning) {
      const elapsed = ts - this._spinStart;
      const t = Math.min(elapsed / this._spinDur, 1);
      const e = this._easeOut(t);

      // Wheel
      this.wheelAngle = this._spinFrom + (this._spinTo - this._spinFrom) * e;
      this.wheelMesh.rotation.y = this.wheelAngle;

      // Ball: spins opposite direction, faster at start, slows and drops
      if (t < 0.65) {
        // Fast orbit on outer track
        const speed = 0.12 * (1 - t * 1.3);
        this.ballAngle -= speed;
        const bR = WHEEL_R * 0.93;
        const bH = 1.0 + 0.15 * Math.sin(t * Math.PI * 6);
        this.ball.position.set(bR, bH, 0);
        this.ballPivot.rotation.y = this.ballAngle;
      } else {
        // Settle: ball drifts inward and down
        const ttle = (t - 0.65) / 0.35;
        this.ballAngle -= 0.015 * (1 - ttle);
        // Spiral inward toward winning slot
        const targetBallAngle = this.wheelAngle + (WHEEL_NUMS.indexOf(this._winNum || 0)) * SEG;
        const lerpedAngle = this.ballAngle + (targetBallAngle - this.ballAngle) * ttle * 0.4;
        const bR = WHEEL_R * (0.93 - ttle * 0.22);
        const bH = 1.0 - ttle * 0.7;
        this.ball.position.set(bR, bH, 0);
        this.ballPivot.rotation.y = lerpedAngle;
      }

      if (t >= 1) {
        this.spinning = false;
        if (this.onDone) this.onDone();
      }
    } else {
      // Idle: gentle spin
      this.wheelAngle += dt * 0.08;
      this.wheelMesh.rotation.y = this.wheelAngle;
      this.ballAngle -= dt * 0.05;
      this.ballPivot.rotation.y = this.ballAngle;
    }

    this.renderer.render(this.scene, this.camera);
  }

  startSpin(winNum, onDone) {
    this._winNum = winNum;
    this.spin(winNum, onDone);
  }
}
