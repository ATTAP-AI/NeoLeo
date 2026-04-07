/* ── Fullscreen canvas toggle ── */
window._toggleFS=(function(){
  var on=false;
  var _tb,_panel,_bar,_stage,_fsBtn;
  var _origStageStyle='';
  return function(){
    _tb    =document.getElementById('tb');
    _panel =document.getElementById('panel');
    _bar   =document.getElementById('bar');
    _stage =document.getElementById('stage');
    _fsBtn =document.getElementById('fs-btn');
    if(!on){
      /* Enter fullscreen */
      on=true;
      _origStageStyle=_stage.style.cssText||'';
      if(_tb)    _tb.style.display='none';
      if(_panel) _panel.style.display='none';
      if(_bar)   _bar.style.opacity='0';
      _stage.style.cssText='position:fixed;inset:0;z-index:9999;background:var(--bg);display:flex;align-items:center;justify-content:center;';
      if(_fsBtn){_fsBtn.textContent='✕ EXIT';_fsBtn.style.color='rgba(255,255,255,0.7)';_fsBtn.style.borderColor='rgba(255,255,255,0.3)';}
      /* Resize canvas to fill screen */
      setTimeout(function(){
        if(window._setCanvasSize)window._setCanvasSize(window.innerWidth,window.innerHeight);
        else if(window._sz)window._sz();
      },50);
    } else {
      /* Exit fullscreen */
      on=false;
      if(_tb)    _tb.style.display='';
      if(_panel) _panel.style.display='';
      if(_bar)   _bar.style.opacity='';
      _stage.style.cssText=_origStageStyle;
      if(_fsBtn){_fsBtn.textContent='⊞ FULLSCREEN';_fsBtn.style.color='#97c3b0';_fsBtn.style.borderColor='rgba(255,255,255,0.3)';}
      setTimeout(function(){if(window._sz)window._sz();},50);
    }
  };
})();
/* Also allow Escape to exit fullscreen */
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&document.getElementById('fs-btn')&&document.getElementById('fs-btn').textContent.indexOf('EXIT')>=0){
    window._toggleFS&&window._toggleFS();
  }
});
