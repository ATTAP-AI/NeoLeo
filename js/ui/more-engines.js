/* ── MORE ENGINES TOGGLE ── */
(function(){
  const btn=document.getElementById('more-engines-btn');
  const list=document.getElementById('more-engines-list');
  if(!btn||!list)return;
  btn.addEventListener('click',()=>{
    const open=list.classList.toggle('open');
    btn.classList.toggle('open',open);
    btn.textContent=(open?'\u25B2':'\u25BC')+' More Engines (33)';
  });
  /* When a more-engine button is clicked, auto-expand the list and keep it open */
  list.querySelectorAll('.eng').forEach(function(b){
    const orig=b.onclick;
    b.onclick=function(){
      if(orig)orig.call(b);
      /* Ensure list stays open so selected engine remains visible */
      list.classList.add('open');
      btn.classList.add('open');
      btn.textContent='\u25B2 More Engines (33)';
    };
  });
})();
