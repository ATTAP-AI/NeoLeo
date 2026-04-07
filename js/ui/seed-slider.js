/* ── Seed slider: randomises display while dragging, commits on release ── */
(function(){
  var sl = document.getElementById('seed-sl');
  var disp = document.getElementById('seed-sl-display');
  var si2  = document.getElementById('si2');
  var spinning = false;
  var spinTimer = null;

  function pickRandom(){return Math.floor(Math.random()*999998)+1;}

  function showSeed(v){
    disp.textContent = v;
    sl.value = v;
  }

  function startSpin(){
    if(spinning) return;
    spinning = true;
    sl.classList.add('active');
    disp.style.color = 'var(--acc)';
    /* Rapidly cycle through random values while dragging */
    (function tick(){
      if(!spinning) return;
      var r = pickRandom();
      disp.textContent = r;
      spinTimer = setTimeout(tick, 80);
    })();
  }

  function stopSpin(commit){
    spinning = false;
    clearTimeout(spinTimer);
    sl.classList.remove('active');
    disp.style.color = 'var(--dim)';
    if(commit){
      var v = parseInt(sl.value);
      showSeed(v);
      /* Push seed into the text input so generate() picks it up */
      si2.value = v;
      /* Auto-generate with new seed if not locked to something else */
      if(!locked){
        lseed = null;
        if(typeof generate === 'function') generate();
      }
    }
  }

  /* Drag: spin display rapidly, final value is whatever slider landed on */
  sl.addEventListener('mousedown', function(){startSpin();});
  sl.addEventListener('touchstart', function(){startSpin();}, {passive:true});

  sl.addEventListener('input', function(){
    /* While dragging: slider moves but display spins randomly */
    /* The actual numerical value of the slider IS the eventual seed */
  });

  sl.addEventListener('mouseup', function(){stopSpin(true);});
  sl.addEventListener('touchend', function(){stopSpin(true);});
  /* If mouse leaves slider while held, commit */
  sl.addEventListener('mouseleave', function(e){
    if(e.buttons > 0) stopSpin(true);
  });

  /* Init: show a random seed in display */
  showSeed(pickRandom());
})();
