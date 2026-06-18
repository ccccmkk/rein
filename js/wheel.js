const WHEEL_NUMS = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED_SET = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const N_SLOTS = 37;
const SEG = (2 * Math.PI) / N_SLOTS;
const WHEEL_R = 9;

class RouletteWheel {
  constructor() {
    this.spinning   = false;
    this.wheelAngle = 0;
    this.ballAngle  = 0;
    this._winNum    = 0;
    this.onDone     = null;
    this._lastTS    = 0;
    this._initThree();
    this._buildScene();
    requestAnimationFrame(t => this._frame(t));
  }

  _initThree() {
    this._area = document.getElementById('wheel-area');
    const W = this._area.clientWidth  || window.innerWidth;
    const H = this._area.clientHeight || Math.round(window.innerHeight * 0.4);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050905);
    this.camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 200);
    this.camera.position.set(0, 20, 10);
    this.camera.lookAt(0, 0, 0);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(W, H);
    this._area.insertBefore(this.renderer.domElement, this._area.firstChild);
    // ResizeObserver handles both orientation change and window resize
    new ResizeObserver(() => this._onResize()).observe(this._area);
  }

  _onResize() {
    const W = this._area.clientWidth, H = this._area.clientHeight;
    if (!W || !H) return;
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(W, H);
  }

  _buildScene() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const spot = new THREE.DirectionalLight(0xffe8a0, 2.5);
    spot.position.set(0, 20, 5);
    this.scene.add(spot);
    this.scene.add(Object.assign(new THREE.DirectionalLight(0x4488ff, 0.4), { position: new THREE.Vector3(-10,5,-10) }));

    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(15,15,0.25,64),
      new THREE.MeshLambertMaterial({ color:0x0d3d15 })
    );
    table.position.y = -0.5;
    this.scene.add(table);

    const outerRim = new THREE.Mesh(
      new THREE.TorusGeometry(15,0.35,8,72),
      new THREE.MeshLambertMaterial({ color:0x8b6914 })
    );
    outerRim.rotation.x = Math.PI/2;
    outerRim.position.y = -0.35;
    this.scene.add(outerRim);

    const tex  = this._makeTexture();
    const geo  = new THREE.CylinderGeometry(WHEEL_R,WHEEL_R,0.55,72);
    const mats = [
      new THREE.MeshLambertMaterial({ color:0x3a2806 }),
      new THREE.MeshLambertMaterial({ map:tex }),
      new THREE.MeshLambertMaterial({ color:0x3a2806 }),
    ];
    this.wheelMesh = new THREE.Mesh(geo, mats);
    this.scene.add(this.wheelMesh);

    const wRim = new THREE.Mesh(
      new THREE.TorusGeometry(WHEEL_R+0.1,0.28,8,72),
      new THREE.MeshLambertMaterial({ color:0xc8a82a })
    );
    wRim.rotation.x = Math.PI/2;
    wRim.position.y = 0.28;
    this.scene.add(wRim);

    const spindle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5,0.2,0.6,16),
      new THREE.MeshLambertMaterial({ color:0xc8a82a })
    );
    spindle.position.y = 0.55;
    this.scene.add(spindle);

    this.ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.28,16,16),
      new THREE.MeshLambertMaterial({ color:0xeeeecc })
    );
    this.ballPivot = new THREE.Object3D();
    this.ballPivot.add(this.ball);
    this.scene.add(this.ballPivot);
    this.ball.position.set(WHEEL_R*0.93, 1.0, 0);
  }

  _makeTexture() {
    const S=1024, cx=S/2, cy=S/2, r=S/2-2;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.fillStyle='#1a0e04'; ctx.fillRect(0,0,S,S);
    for (let i=0;i<N_SLOTS;i++) {
      const num=WHEEL_NUMS[i], a0=i*SEG-SEG/2, a1=a0+SEG;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r*.95,a0,a1); ctx.closePath();
      ctx.fillStyle = num===0?'#1a6b1a':RED_SET.has(num)?'#b81010':'#141414';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a0)*r*.12, cy+Math.sin(a0)*r*.12);
      ctx.lineTo(cx+Math.cos(a0)*r*.95, cy+Math.sin(a0)*r*.95);
      ctx.strokeStyle='#c8a82a'; ctx.lineWidth=2.5; ctx.stroke();
      const mid=a0+SEG/2;
      ctx.save();
      ctx.translate(cx+Math.cos(mid)*r*.74, cy+Math.sin(mid)*r*.74);
      ctx.rotate(mid+Math.PI/2);
      ctx.fillStyle='#fff'; ctx.font='bold 24px Arial';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(num,0,0); ctx.restore();
    }
    ctx.beginPath(); ctx.arc(cx,cy,r*.95,0,Math.PI*2);
    ctx.strokeStyle='#c8a82a'; ctx.lineWidth=4; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx,cy,r*.12,0,Math.PI*2);
    ctx.fillStyle='#8b6914'; ctx.fill();
    ctx.strokeStyle='#c8a82a'; ctx.lineWidth=3; ctx.stroke();
    return new THREE.CanvasTexture(cv);
  }

  startSpin(winNum, onDone) {
    if (this.spinning) return;
    this._winNum   = winNum;
    this.onDone    = onDone;
    const winIdx   = WHEEL_NUMS.indexOf(winNum);
    const target   = Math.PI/2 - winIdx*SEG + (8+Math.floor(Math.random()*4))*Math.PI*2;
    this._spinFrom = this.wheelAngle;
    this._spinTo   = target;
    this._spinStart= performance.now();
    this._spinDur  = 5000 + Math.random()*1500;
    this.spinning  = true;
  }

  _easeOut(t) { return 1-Math.pow(1-t,4); }

  _frame(ts) {
    requestAnimationFrame(t => this._frame(t));
    const dt = Math.min((ts-this._lastTS)/1000, 0.05);
    this._lastTS = ts;
    if (this.spinning) {
      const t = Math.min((ts-this._spinStart)/this._spinDur, 1);
      const e = this._easeOut(t);
      this.wheelAngle = this._spinFrom+(this._spinTo-this._spinFrom)*e;
      this.wheelMesh.rotation.y = this.wheelAngle;
      if (t<0.65) {
        this.ballAngle -= 0.12*(1-t*1.3);
        this.ball.position.set(WHEEL_R*.93, 1+.15*Math.sin(t*Math.PI*6), 0);
        this.ballPivot.rotation.y = this.ballAngle;
      } else {
        const p=(t-0.65)/0.35;
        this.ballAngle -= 0.015*(1-p);
        this.ball.position.set(WHEEL_R*(.93-p*.22), 1-p*.7, 0);
        this.ballPivot.rotation.y = this.ballAngle;
      }
      if (t>=1) { this.spinning=false; if (this.onDone) this.onDone(); }
    } else {
      this.wheelAngle += dt*0.08;
      this.wheelMesh.rotation.y = this.wheelAngle;
      this.ballAngle -= dt*0.05;
      this.ballPivot.rotation.y = this.ballAngle;
    }
    this.renderer.render(this.scene, this.camera);
  }
}
