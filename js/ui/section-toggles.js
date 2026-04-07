/* ── Section toggles ── */
(function(){
  var toggles = [
    ['eng-toggle',     'eng-body',     null],
    ['pal-toggle',     'pal-body',     null],
    ['dt-toggle',      'dt-body',      null],
    ['canvas-toggle2', 'canvas-body2', null],
  ];
  toggles.forEach(function(t){
    var btn = document.getElementById(t[0]);
    var body = document.getElementById(t[1]);
    var icon = document.getElementById(t[2]);
    if(!btn||!body) return;
    btn.addEventListener('click', function(){
      var open = body.classList.toggle('open');
      btn.classList.toggle('open', open);
      var chev = btn.querySelector('.chev');
      if(chev) chev.style.transform = open ? 'rotate(180deg)' : '';
    });
  });
})();
