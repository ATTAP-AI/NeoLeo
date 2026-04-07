/* ── TOOLTIP ENGINE — renders outside toolbar so overflow:hidden doesn't clip ── */
(function(){
  const el=document.createElement('div');el.id='tip-el';
  el.innerHTML='<div id="tip-arr"></div><div id="tip-name"><span id="tip-ntxt"></span><span id="tip-key"></span></div><div id="tip-desc"></div>';
  document.body.appendChild(el);

  document.querySelectorAll('.tbtn[data-tip-name]').forEach(btn=>{
    btn.addEventListener('mouseenter',()=>{
      const name=btn.dataset.tipName||'';
      const key=btn.dataset.tipKey||'';
      const desc=btn.dataset.tipDesc||'';
      const isFx=btn.classList.contains('fx');
      el.className=isFx?'fx-tip':'';
      document.getElementById('tip-ntxt').textContent=name;
      document.getElementById('tip-key').textContent=key;
      document.getElementById('tip-desc').textContent=desc;
      el.style.display='block';
      const br=btn.getBoundingClientRect();
      const tw=el.offsetWidth;
      const th=el.offsetHeight;
      const left=br.left-tw-10;
      const top=Math.min(window.innerHeight-th-6, Math.max(6, br.top+br.height/2-th/2));
      el.style.left=left+'px';
      el.style.top=top+'px';
    });
    btn.addEventListener('mouseleave',()=>{ el.style.display='none'; });
  });
})();
