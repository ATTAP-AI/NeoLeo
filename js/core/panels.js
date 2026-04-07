/* ── Position, open, close floating panels ── */
function positionPanel(id){
  const p=document.getElementById(id);
  const tb=document.getElementById('tb');
  var savedPos=p._floatPos;
  if(savedPos){
    p.style.left=savedPos.left+'px';
    p.style.top=savedPos.top+'px';
  } else {
    var tbR=tb.getBoundingClientRect();
    var pw=parseInt(getComputedStyle(p).width)||260;
    p.style.left=Math.max(4, tbR.left - pw - 8)+'px';
    p.style.top='10px';
  }
  p.style.right='auto';
  p.style.bottom='auto';
}
function openPanel(id){['light-panel','atmo-panel','upload-panel','prompt-panel'].forEach(i=>document.getElementById(i).classList.remove('open'));positionPanel(id);document.getElementById(id).classList.add('open');if(id==='upload-panel'&&window._positionUploadPanel)window._positionUploadPanel();}
function closePanel(id){document.getElementById(id).classList.remove('open');}
window.positionPanel=positionPanel;
window.openPanel=openPanel;
window.closePanel=closePanel;

/* ── Make all floating panel headers draggable ── */
(function(){
  function makeDraggable(panelId){
    var panel=document.getElementById(panelId);
    if(!panel)return;
    var hdr=panel.querySelector('.fx-hdr');
    if(!hdr)return;
    var drag=null;
    hdr.addEventListener('mousedown',function(e){
      if(e.target.classList.contains('fx-cls'))return;
      e.preventDefault();
      hdr.style.cursor='grabbing';
      var r=panel.getBoundingClientRect();
      drag={sx:e.clientX,sy:e.clientY,ol:r.left,ot:r.top};
      function onMove(ev){
        if(!drag)return;
        var nl=Math.max(0,Math.min(window.innerWidth-60,drag.ol+(ev.clientX-drag.sx)));
        var nt=Math.max(0,Math.min(window.innerHeight-40,drag.ot+(ev.clientY-drag.sy)));
        panel.style.left=nl+'px';
        panel.style.top=nt+'px';
        panel._floatPos={left:nl,top:nt};
      }
      function onUp(){
        drag=null;hdr.style.cursor='grab';
        document.removeEventListener('mousemove',onMove);
        document.removeEventListener('mouseup',onUp);
      }
      document.addEventListener('mousemove',onMove);
      document.addEventListener('mouseup',onUp);
    });
  }
  setTimeout(function(){
    makeDraggable('light-panel');
    makeDraggable('atmo-panel');
    makeDraggable('upload-panel');
    makeDraggable('prompt-panel');
    makeDraggable('layers-panel');
  },300);
})();
