/* ── Cycle Random Engine button ── */
(function(){
  /* All 48 engine keys */
  var ALL_ENGINES=document.querySelectorAll('.eng[data-e]');
  var _cycleTimer=null;

  function maxParams(e){
    /* Set all sliders to their maximum value */
    if(!PD[e])return;
    PD[e].forEach(function(p){
      var el=document.getElementById(p.id);
      var vl=document.getElementById(p.id+'v');
      if(el){
        if(p.sel){
          /* For selects: pick last option (usually most complex) */
          el.selectedIndex=el.options.length-1;
        } else {
          el.value=p.max;
          /* Inline dec: count decimal places from step */
          var decimals=p.st<1?(p.st.toString().split('.')[1]||'').length:0;
          if(vl)vl.textContent=parseFloat(p.max).toFixed(decimals);
        }
      }
    });
  }

  var _cycleIdx=-1; /* -1 so first click goes to engine 0 (01) */

  function cycleNext(){
    var btns=Array.from(document.querySelectorAll('.eng[data-e]'));
    if(!btns.length)return;
    _cycleIdx=(_cycleIdx+1)%btns.length; /* advance sequentially 0→47→0 */
    var btn=btns[_cycleIdx];
    var e=btn.dataset.e;

    /* Highlight selected engine button */
    document.querySelectorAll('.eng').forEach(function(x){x.classList.remove('on');});
    btn.classList.add('on');
    eng=e;
    _engineSelected=true;
    var inMore=btn.closest('#more-engines-list');
    if(inMore){
      inMore.classList.add('open');
      var mBtn=document.getElementById('more-engines-btn');
      if(mBtn){mBtn.classList.add('open');mBtn.textContent='▲ More Engines (33)';}
    }

    /* Update current-engine persistent label */
    var lbl=document.getElementById('eng-current-label'),nm=document.getElementById('eng-current-name');
    if(lbl&&nm){lbl.style.display=inMore?'block':'none';if(inMore)nm.textContent=btn.textContent.replace(/^\d+\s*[—\-]\s*/,'');}

    /* Update cycle name strip */
    var cl=document.getElementById('eng-cycle-label');
    var cn=document.getElementById('eng-cycle-name');
    if(cl)cl.style.display='block';
    if(cn)cn.textContent='('+(_cycleIdx+1)+'/'+btns.length+') '+btn.textContent.trim();

    /* Build params, set ALL to MAX, generate */
    buildP(e);
    maxParams(e);
    /* Ensure Experimental Tools section is closed so generate() is not gated */
    var expBody=document.getElementById('exp-body');
    if(expBody&&expBody.classList.contains('open')){
      expBody.classList.remove('open');
      var expToggle=document.getElementById('exp-toggle');
      if(expToggle){var chev=expToggle.querySelector('.chev');if(chev)chev.style.transform='';}
    }
    generate();

    /* Scroll panel to top of the Engines section so selected engine is visible */
    setTimeout(function(){
      var engToggle=document.getElementById('eng-toggle');
      var panel=document.getElementById('panel');
      if(engToggle&&panel){
        panel.scrollTo({top:engToggle.offsetTop-8,behavior:'smooth'});
      }
    }, 50);
  }

  var cycleBtn=document.getElementById('eng-cycle-btn');
  if(cycleBtn) cycleBtn.addEventListener('click', cycleNext);
})();
