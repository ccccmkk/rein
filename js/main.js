let sim;

window.addEventListener('DOMContentLoaded', () => {
  const canvas     = document.getElementById('c');
  const sldSpeed   = document.getElementById('sldSpeed');
  const sldPop     = document.getElementById('sldPop');
  const lblSpeed   = document.getElementById('lblSpeed');
  const lblPop     = document.getElementById('lblPop');
  const btnStart   = document.getElementById('btnStart');
  const btnPause   = document.getElementById('btnPause');
  const btnReset   = document.getElementById('btnReset');

  sim = new Simulation(canvas, parseInt(sldPop.value));

  sldSpeed.addEventListener('input', () => {
    const v = parseInt(sldSpeed.value);
    lblSpeed.textContent = v + '×';
    sim.speed = v;
  });

  sldPop.addEventListener('input', () => {
    lblPop.textContent = sldPop.value;
  });

  btnStart.addEventListener('click', () => {
    sim.start();
    btnStart.disabled = true;
    btnPause.disabled = false;
  });

  btnPause.addEventListener('click', () => {
    sim.pause();
    btnStart.disabled = false;
    btnPause.disabled = true;
  });

  btnReset.addEventListener('click', () => {
    sim.reset(parseInt(sldPop.value));
    btnStart.disabled = false;
    btnPause.disabled = true;
  });
});
