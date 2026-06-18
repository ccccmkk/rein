class DQN {
  constructor() {
    this.epsilon    = 1.0;
    this.epsilonMin = 0.05;
    this.epsilonDecay = 0.9995;
    this.gamma      = 0.95;
    this.batchSize  = 64;
    this.maxMemory  = 20000;
    this.memory     = [];
    this._pending   = false;
    this._trainCount = 0;
    this._targetUpdateEvery = 200;

    this.online = this._buildNet();
    this.target = this._buildNet();
    this._syncTarget();
  }

  _buildNet() {
    const m = tf.sequential();
    m.add(tf.layers.dense({ inputShape: [STATE_SIZE], units: 128, activation: 'relu' }));
    m.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    m.add(tf.layers.dense({ units: 64,  activation: 'relu' }));
    m.add(tf.layers.dense({ units: ACTION_SIZE, activation: 'linear' }));
    m.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
    return m;
  }

  _syncTarget() {
    this.target.setWeights(this.online.getWeights().map(w => w.clone()));
  }

  push(s, a, r, ns, done) {
    if (this.memory.length >= this.maxMemory) this.memory.shift();
    this.memory.push([s, a, r, ns, done]);
  }

  act(state) {
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * ACTION_SIZE);
    }
    return tf.tidy(() => {
      const t = tf.tensor2d([state]);
      return this.online.predict(t).argMax(1).dataSync()[0];
    });
  }

  async trainAsync() {
    if (this._pending || this.memory.length < this.batchSize) return;
    this._pending = true;

    const mem = this.memory;
    const bs  = this.batchSize;
    const batch = Array.from({ length: bs }, () => mem[Math.floor(Math.random() * mem.length)]);

    const statesArr  = batch.map(b => b[0]);
    const nstatesArr = batch.map(b => b[3]);

    const stT  = tf.tensor2d(statesArr);
    const nsT  = tf.tensor2d(nstatesArr);

    const qCur = await this.online.predict(stT).array();
    const qNxt = await this.target.predict(nsT).array();

    for (let i = 0; i < bs; i++) {
      const [, action, reward, , done] = batch[i];
      qCur[i][action] = done ? reward : reward + this.gamma * Math.max(...qNxt[i]);
    }

    const tgtT = tf.tensor2d(qCur);
    await this.online.fit(stT, tgtT, { epochs: 1, verbose: 0 });

    stT.dispose(); nsT.dispose(); tgtT.dispose();

    this._trainCount++;
    if (this._trainCount % this._targetUpdateEvery === 0) this._syncTarget();
    if (this.epsilon > this.epsilonMin) this.epsilon *= this.epsilonDecay;

    this._pending = false;
  }
}
