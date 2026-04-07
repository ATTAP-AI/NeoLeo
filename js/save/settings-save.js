(function(){
  /* ── Shared button styling ── */
  var saveBtnCSS='padding:6px 10px;background:rgba(64,200,160,0.12);border:1px solid rgba(64,200,160,0.4);color:#40c8a0;font-family:inherit;font-size:8px;cursor:pointer;letter-spacing:.08em;text-transform:uppercase;font-weight:600;border-radius:3px;';
  var rstBtnCSS='padding:6px 10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.6);font-family:inherit;font-size:8px;cursor:pointer;letter-spacing:.08em;text-transform:uppercase;font-weight:600;border-radius:3px;';

  /* ── Generic helpers ── */
  function getVals(ids){
    var s={};
    ids.forEach(function(id){
      var el=document.getElementById(id);
      if(!el)return;
      if(el.type==='checkbox')s[id]=el.checked;
      else if(el.tagName==='SELECT')s[id]=el.value;
      else if(el.type==='color')s[id]=el.value;
      else s[id]=el.value;
    });
    return s;
  }
  function setVals(vals, suffixes, applyFn){
    Object.keys(vals).forEach(function(id){
      var el=document.getElementById(id);
      if(!el)return;
      if(el.type==='checkbox')el.checked=vals[id];
      else el.value=vals[id];
      /* Update display label */
      var vl=document.getElementById(id+'v')||document.getElementById(id+'-v');
      if(vl){
        var sfx=(suffixes&&suffixes[id])||'';
        var v=vals[id];
        if(el.type==='checkbox')return;
        if(typeof v==='number'||!isNaN(v))vl.textContent=(v>0&&sfx!=='%'&&sfx!==''?'+':'')+v+sfx;
        else vl.textContent=v+sfx;
      }
      /* Color swatches */
      if(el.type==='color'){
        var txt=document.getElementById(id+'txt');
        if(txt)txt.textContent=vals[id];
      }
      /* Trigger input event for live update */
      el.dispatchEvent(new Event('input',{bubbles:true}));
    });
    if(applyFn)applyFn();
  }

  function flashStatus(el,msg){
    if(!el)return;
    el.textContent=msg;
    setTimeout(function(){el.textContent='';},2000);
  }

  function addSaveResetPair(container, ids, defaults, suffixes, applyFn, label){
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;gap:6px;margin-top:6px;';
    var sBtn=document.createElement('button');
    sBtn.textContent='■ Save Settings';
    sBtn.style.cssText=saveBtnCSS+'flex:1;';
    var rBtn=document.createElement('button');
    rBtn.textContent='↺ Reset';
    rBtn.style.cssText=rstBtnCSS+'flex:1;';
    wrap.appendChild(sBtn);wrap.appendChild(rBtn);
    var stat=document.createElement('div');
    stat.style.cssText='font-size:7px;color:rgba(255,255,255,0.3);text-align:center;min-height:10px;line-height:1.5;margin-top:2px;';
    container.appendChild(wrap);
    container.appendChild(stat);

    var saved=null;
    sBtn.addEventListener('click',function(){
      saved=getVals(ids);
      flashStatus(stat,'Settings saved');
    });
    rBtn.addEventListener('click',function(){
      setVals(defaults, suffixes, applyFn);
      flashStatus(stat,'Reset to defaults');
    });
    /* Expose restore */
    if(label)window['_restore'+label]=function(){if(saved)setVals(saved,suffixes,applyFn);};
  }

  /* ═══════════════════════════════════════════════
     1. IMAGE ADJUSTMENTS (u-adj-sec)
     ═══════════════════════════════════════════════ */
  setTimeout(function(){
    var adjIDs=['u-bri','u-con','u-sat','u-exp','u-hil','u-shd','u-tmp','u-tnt'];
    var adjDefs={'u-bri':'0','u-con':'0','u-sat':'0','u-exp':'0','u-hil':'0','u-shd':'0','u-tmp':'0','u-tnt':'0'};
    var adjSfx={};adjIDs.forEach(function(id){adjSfx[id]='';});
    var adjResetBtn=document.getElementById('u-adj-reset');
    if(adjResetBtn){
      var adjParent=adjResetBtn.parentElement;
      addSaveResetPair(adjParent, adjIDs, adjDefs, adjSfx, function(){
        if(window._adjApply)window._adjApply();
      },'Adj');
    }

    /* ═══════════════════════════════════════════════
       2. LIGHTING PANEL
       ═══════════════════════════════════════════════ */
    var litIDs=['l-on','l1-on','l1-type','l1-col','l1-int','l1-rad','l1-px','l1-py',
                'l2-on','l2-type','l2-col','l2-int','l2-rad','l2-px','l2-py',
                'l-blm','l-ambc','l-amb'];
    var litDefs={'l-on':false,'l1-on':true,'l1-type':'point','l1-col':'#ffee88',
      'l1-int':'60','l1-rad':'220','l1-px':'30','l1-py':'25',
      'l2-on':false,'l2-type':'point','l2-col':'#88ccff',
      'l2-int':'40','l2-rad':'160','l2-px':'70','l2-py':'70',
      'l-blm':'0','l-ambc':'#001122','l-amb':'0'};
    var litSfx={'l1-px':'%','l1-py':'%','l2-px':'%','l2-py':'%'};
    var litRst=document.getElementById('l-rst');
    if(litRst){
      addSaveResetPair(litRst.parentElement, litIDs, litDefs, litSfx, function(){
        if(typeof renderLighting==='function')renderLighting();
      },'Lit');
    }

    /* ═══════════════════════════════════════════════
       3. ATMOSPHERE PANEL
       ═══════════════════════════════════════════════ */
    var atmoIDs=['a-on','a-vstr','a-vsft','a-vcol','a-ftype','a-fcol','a-fden',
                 'a-grain','a-temp','a-sat','a-con','a-bri','a-aber'];
    var atmoDefs={'a-on':false,'a-vstr':'0','a-vsft':'50','a-vcol':'#000000',
      'a-ftype':'none','a-fcol':'#b0c8d8','a-fden':'0',
      'a-grain':'0','a-temp':'0','a-sat':'0','a-con':'0','a-bri':'0','a-aber':'0'};
    var atmoSfx={};
    var atmoRst=document.getElementById('a-rst');
    if(atmoRst){
      addSaveResetPair(atmoRst.parentElement, atmoIDs, atmoDefs, atmoSfx, function(){
        if(typeof renderAtmosphere==='function')renderAtmosphere();
      },'Atmo');
    }

    /* ═══════════════════════════════════════════════
       4. HUMANIZE PANEL
       ═══════════════════════════════════════════════ */
    var humIDs=['hum-amt','hum-wob','hum-pre','hum-edg','hum-ink','hum-dri','hum-pap'];
    var humDefs={'hum-amt':'50','hum-wob':'50','hum-pre':'40','hum-edg':'45',
      'hum-ink':'35','hum-dri':'30','hum-pap':'25'};
    var humSfx={};
    var humRst=document.getElementById('hum-reset-btn');
    if(humRst){
      addSaveResetPair(humRst.parentElement, humIDs, humDefs, humSfx, null, 'Hum');
    }

    /* ═══════════════════════════════════════════════
       5. TEXTURE MAP PANEL
       ═══════════════════════════════════════════════ */
    var texIDs=['tex-scale','tex-opacity','tex-rotation','tex-depth'];
    var texDefs={'tex-scale':'50','tex-opacity':'60','tex-rotation':'0','tex-depth':'40'};
    var texSfx={};
    /* Texture panel is dynamic — wait for it */
    function tryTexPanel(){
      var scaleEl=document.getElementById('tex-scale');
      if(!scaleEl)return;
      /* Find a container in the tex panel to add buttons */
      var tpEl=document.getElementById('tex-picker-panel');
      if(!tpEl)return;
      /* Look for existing IDs to build the ID list dynamically */
      var foundIDs=[];var foundDefs={};
      tpEl.querySelectorAll('input[type=range]').forEach(function(inp){
        if(inp.id){foundIDs.push(inp.id);foundDefs[inp.id]=inp.defaultValue||inp.getAttribute('value')||'50';}
      });
      if(!foundIDs.length)return;
      /* Find the last section in the panel body */
      var bodyDiv=tpEl.querySelector('div[style*="overflow-y"]')||tpEl.lastElementChild;
      if(bodyDiv)addSaveResetPair(bodyDiv, foundIDs, foundDefs, {}, null, 'Tex');
    }
    /* Observe for tex panel creation */
    var texObs=new MutationObserver(function(muts){
      if(document.getElementById('tex-picker-panel')){tryTexPanel();texObs.disconnect();}
    });
    if(document.getElementById('tex-picker-panel'))tryTexPanel();
    else texObs.observe(document.body,{childList:true});

  },500);
})();
