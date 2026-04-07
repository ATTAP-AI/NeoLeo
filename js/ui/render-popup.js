/* ── Rendering popup ── */
var _renderPopup=(function(){
  var el=null,_timer=null,_hideTimer=null;
  function _make(){
    if(el)return;
    el=document.createElement('div');
    el.id='render-popup';
    el.style.cssText='display:none;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(6,6,14,0.92);border:1px solid var(--acc);padding:10px 22px;font-family:inherit;font-size:10px;letter-spacing:.2em;color:var(--acc);text-transform:uppercase;pointer-events:none;z-index:50;white-space:nowrap;';
    el.innerHTML='<span id="render-dots">&#9632;</span> Rendering<span id="render-ellipsis">...</span>';
    var wrap=document.getElementById('cvwrap');
    if(wrap){wrap.style.position='relative';wrap.appendChild(el);}
    /* Animate ellipsis */
    var dots=['.','..','.','...','.'];var di=0;
    setInterval(function(){if(el.style.display!=='none'){document.getElementById('render-ellipsis').textContent=dots[di++%dots.length];}},300);
  }
  return {
    show:function(){
      _make();
      clearTimeout(_hideTimer);
      /* Only show if render takes >120ms — avoids flash for fast engines */
      _timer=setTimeout(function(){
        if(el){el.style.display='block';}
      },120);
    },
    hide:function(){
      clearTimeout(_timer);
      if(el){
        /* Brief delay so popup doesn't flicker for instant renders */
        _hideTimer=setTimeout(function(){el.style.display='none';},120);
      }
    }
  };
})();
