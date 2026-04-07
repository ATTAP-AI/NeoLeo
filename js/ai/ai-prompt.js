/* ══════════════════════════════════════════════════════════
   AI PROMPT SYSTEM — extracted from NeoLeo monolith
   Depends on globals: eng, LS, AS, PD, ENAMES, cv, ctx, uv,
     lv, dv, av, gp, dec, buildP, drawSw, generate,
     renderLighting, renderAtmosphere, openPanel, closePanel, setTool
   ══════════════════════════════════════════════════════════ */
(function(){

var PALETTES_AI=['ember','ink','ocean','neon','earth','ghost','aurora','void','rust','botanic'];
var ENGINES_AI=Object.keys(ENAMES);

function getState(){
  var params={};
  if(PD[eng])PD[eng].forEach(function(p){params[p.id]=gp(p.id);});
  return{engine:eng,palette:document.getElementById('pal').value,params:params,
    lighting:{on:LS.on,l1:{on:LS.lights[0].on,type:LS.lights[0].type,col:LS.lights[0].col,int:LS.lights[0].int,px:LS.lights[0].px,py:LS.lights[0].py,rad:LS.lights[0].rad},l2:{on:LS.lights[1].on,type:LS.lights[1].type,col:LS.lights[1].col,int:LS.lights[1].int,px:LS.lights[1].px,py:LS.lights[1].py,rad:LS.lights[1].rad},bloom:LS.bloom,ambCol:LS.ambCol,ambInt:LS.ambInt},
    atmosphere:{on:AS.on,vig:{str:AS.vig.str,soft:AS.vig.soft,col:AS.vig.col},fog:{type:AS.fog.type,col:AS.fog.col,den:AS.fog.den},grain:AS.grain,grade:{temp:AS.grade.temp,sat:AS.grade.sat,con:AS.grade.con,bri:AS.grade.bri},aber:AS.aber}};
}

function getCanvasB64(){
  try{
    var MAX=512,sc=Math.min(MAX/cv.width,MAX/cv.height,1);
    var tmp=document.createElement('canvas');tmp.width=Math.round(cv.width*sc);tmp.height=Math.round(cv.height*sc);
    var tc=tmp.getContext('2d');
    tc.drawImage(uv,0,0,tmp.width,tmp.height);tc.drawImage(cv,0,0,tmp.width,tmp.height);
    tc.globalCompositeOperation='screen';tc.drawImage(lv,0,0,tmp.width,tmp.height);
    tc.globalCompositeOperation='source-over';tc.drawImage(dv,0,0,tmp.width,tmp.height);tc.drawImage(av,0,0,tmp.width,tmp.height);
    return tmp.toDataURL('image/jpeg',0.72).split(',')[1];
  }catch(e){return null;}
}

var SYS='You are NeoLeo AI creative director. NeoLeo is a generative art app.\nReturn ONLY a single valid JSON object \u2014 no markdown, no extra text.\n\nENGINES: flowfield, attractor, subdivision, interference, growth, lissajous\nPALETTES: ember, ink, ocean, neon, earth, ghost, aurora, void, rust, botanic\n\nENGINE PARAMS:\nflowfield: fp(200-3000) fl(60-500) fs(3-40) fv(0.5-6) fw(0.2-3) fa(4-60) fc(0-3)\nattractor: ai(100000-1500000) ap(0.3-2.5) aa(1-25) at(clifford|dejong|bedhead)\nsubdivision: dd(3-9) dr(0.2-0.8) dg(0-16) dc(0-24) ds(fill|outline|mixed)\ninterference: wn(2-14) wf(3-40) wr(1-6) wm(sin|abs|tanh|xor)\ngrowth: gn(6-40) gs(50-300) gr(5-40) gi(5-22) gw(0.5-6)\nlissajous: lr(2-18) lc(2-18) lt(100-800) lw(0.2-3) la(5-80)\n\nLIGHTING: on(bool) l1/l2: on type(point|spot|rim) col(hex) int(0-100) px(0-100) py(0-100) rad(20-600) bloom(0-40) ambCol(hex) ambInt(0-100)\nATMOSPHERE: on(bool) vig.str/soft(0-100) vig.col fog.type(none|flat|radial|bottom|top) fog.col fog.den(0-100) grain(0-100) grade.temp/sat/con/bri(-100 to 100) aber(0-50)\n\nJSON shape (omit unchanged keys):\n{"explanation":"one sentence","changes":{"engine":"flowfield","palette":"ember","params":{"fp":2000},"lighting":{"on":true,"l1":{"col":"#ff8800","int":70}},"atmosphere":{"on":true,"grain":15},"generate":true}}';

function applyLight(li,idx){
  if(!li)return;
  var lt=LS.lights[idx],n=idx+1;
  if(typeof li.on==='boolean'){lt.on=li.on;var cb=document.getElementById('l'+n+'-on');if(cb)cb.checked=li.on;}
  if(li.type){lt.type=li.type;var s=document.getElementById('l'+n+'-type');if(s)s.value=li.type;}
  if(li.col){lt.col=li.col;var i=document.getElementById('l'+n+'-col');if(i)i.value=li.col;var w=document.getElementById('l'+n+'csw');if(w)w.style.background=li.col;var tx=document.getElementById('l'+n+'-coltxt');if(tx)tx.textContent=li.col;}
  ['int','px','py','rad'].forEach(function(k){if(li[k]===undefined)return;lt[k]=+li[k];var s=document.getElementById('l'+n+'-'+k);if(s)s.value=li[k];var v=document.getElementById('l'+n+'-'+k+'v');if(v)v.textContent=li[k]+(k==='px'||k==='py'?'%':'');});
}

function applyChanges(c){
  if(!c)return[];
  var tags=[];
  if(c.engine&&ENGINES_AI.indexOf(c.engine)!==-1&&c.engine!==eng){eng=c.engine;_engineSelected=true;document.querySelectorAll('.eng').forEach(function(b){b.classList.toggle('on',b.dataset.e===eng);});buildP(eng);tags.push('engine:'+eng);}
  if(c.palette&&PALETTES_AI.indexOf(c.palette)!==-1){document.getElementById('pal').value=c.palette;drawSw();tags.push('palette:'+c.palette);}
  if(c.params){Object.entries(c.params).forEach(function(entry){var id=entry[0],val=entry[1];var el=document.getElementById(id);if(!el)return;if(el.tagName==='SELECT'){el.value=String(val);}else{var pd=PD[eng]&&PD[eng].find(function(p){return p.id===id;});if(pd){var v=Math.max(pd.min,Math.min(pd.max,+val));el.value=v;var vl=document.getElementById(id+'v');if(vl)vl.textContent=parseFloat(v).toFixed(dec(pd));}}tags.push(id+'='+val);});}
  if(c.lighting){var L=c.lighting;if(typeof L.on==='boolean'){LS.on=L.on;var cb=document.getElementById('l-on');if(cb)cb.checked=L.on;}applyLight(L.l1,0);applyLight(L.l2,1);if(L.bloom!==undefined){LS.bloom=+L.bloom;var s=document.getElementById('l-blm');if(s)s.value=L.bloom;var v=document.getElementById('l-blmv');if(v)v.textContent=L.bloom;}if(L.ambCol){LS.ambCol=L.ambCol;var i=document.getElementById('l-ambc');if(i)i.value=L.ambCol;var w=document.getElementById('lambcsw');if(w)w.style.background=L.ambCol;}if(L.ambInt!==undefined){LS.ambInt=+L.ambInt;var s2=document.getElementById('l-amb');if(s2)s2.value=L.ambInt;var v2=document.getElementById('l-ambv');if(v2)v2.textContent=L.ambInt;}renderLighting();tags.push('lighting');}
  if(c.atmosphere){var A=c.atmosphere;if(typeof A.on==='boolean'){AS.on=A.on;var cb2=document.getElementById('a-on');if(cb2)cb2.checked=A.on;}if(A.vig){if(A.vig.str!==undefined){AS.vig.str=+A.vig.str;var s3=document.getElementById('a-vstr');if(s3)s3.value=A.vig.str;var v3=document.getElementById('a-vstrv');if(v3)v3.textContent=A.vig.str;}if(A.vig.soft!==undefined){AS.vig.soft=+A.vig.soft;var s4=document.getElementById('a-vsft');if(s4)s4.value=A.vig.soft;var v4=document.getElementById('a-vsftv');if(v4)v4.textContent=A.vig.soft;}if(A.vig.col){AS.vig.col=A.vig.col;var s5=document.getElementById('a-vcol');if(s5)s5.value=A.vig.col;var w2=document.getElementById('avgcsw');if(w2)w2.style.background=A.vig.col;}}if(A.fog){if(A.fog.type){AS.fog.type=A.fog.type;var s6=document.getElementById('a-ftype');if(s6)s6.value=A.fog.type;}if(A.fog.col){AS.fog.col=A.fog.col;var s7=document.getElementById('a-fcol');if(s7)s7.value=A.fog.col;var w3=document.getElementById('afgsw');if(w3)w3.style.background=A.fog.col;}if(A.fog.den!==undefined){AS.fog.den=+A.fog.den;var s8=document.getElementById('a-fden');if(s8)s8.value=A.fog.den;var v5=document.getElementById('a-fdenv');if(v5)v5.textContent=A.fog.den;}}[['grain','a-grain','a-grainv'],['aber','a-aber','a-aberv']].forEach(function(arr){var k=arr[0],sid=arr[1],vid=arr[2];if(A[k]!==undefined){AS[k]=+A[k];var s9=document.getElementById(sid);if(s9)s9.value=A[k];var v6=document.getElementById(vid);if(v6)v6.textContent=A[k];}});if(A.grade){['temp','sat','con','bri'].forEach(function(k){if(A.grade[k]!==undefined){AS.grade[k]=+A.grade[k];var s10=document.getElementById('a-'+k);if(s10)s10.value=A.grade[k];var v7=document.getElementById('a-'+k+'v');if(v7)v7.textContent=A.grade[k];}});}renderAtmosphere();tags.push('atmosphere');}
  if(c.generate)generate();
  return tags;
}

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

var hist   = document.getElementById('ai-history');
var ta     = document.getElementById('ai-textarea');
var sbtn   = document.getElementById('ai-send');
var stopBtn= document.getElementById('ai-stop');
var stEl   = document.getElementById('ai-status');
var abortCtrl= null;
var chatHist= [];
var isSending= false;

function setStatus(msg,cls){ if(stEl){stEl.textContent=msg;stEl.className=cls||'';} }

function addMsg(role,html2){
  var d=document.createElement('div');
  d.className='ai-msg '+(role==='user'?'usr':role==='abot'?'bot':role==='aerr'?'err':'sys');
  d.innerHTML=html2;
  hist.appendChild(d);
  hist.scrollTop=hist.scrollHeight;
}


function setSending(on){
  isSending=on;
  sbtn.disabled=on;
  stopBtn.style.display=on?'inline-block':'none';
}

function doStop(){
  if(abortCtrl){
    if(abortCtrl._flagAbort) abortCtrl._flagAbort();
    abortCtrl=null;
  }
  setSending(false);
  setStatus('');
  ta.focus();
}

async function doSend(){
  var txt=ta.value.trim();
  if(!txt||isSending)return;
  ta.value='';
  setSending(true);
  setStatus('Thinking\u2026','ai-think');
  addMsg('user',esc(txt));

  var state=getState();
  var sendImg=document.getElementById('ai-send-img').checked;
  var b64=sendImg?getCanvasB64():null;
  var uc=[];
  if(b64)uc.push({type:'image',source:{type:'base64',media_type:'image/jpeg',data:b64}});
  uc.push({type:'text',text:'Current state: '+JSON.stringify(state)+'\n\nUser request: '+txt});
  chatHist.push({role:'user',content:uc});
  if(chatHist.length>12)chatHist=chatHist.slice(-12);

  var apiKey = (document.getElementById('ai-key-in').value||'').trim();
  if(!apiKey){
    addMsg('aerr','Please enter your Anthropic API key above.');
    setSending(false); setStatus(''); return;
  }

  var _aborted = false;
  abortCtrl = { _flagAbort: function(){ _aborted = true; } };

  try{
    var resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:SYS,messages:chatHist})
    });
    if(_aborted)throw new DOMException('Aborted','AbortError');
    var data = await resp.json();
    if(_aborted)throw new DOMException('Aborted','AbortError');
    if(data.error)throw new Error(data.error.message||'API error');
    var raw=data.content.filter(function(b){return b.type==='text';}).map(function(b){return b.text;}).join('');
    chatHist.push({role:'assistant',content:[{type:'text',text:raw}]});
    var parsed;
    try{
      var clean=raw.replace(/```[\s\S]*?```/g,'').trim();
      var m=clean.match(/\{[\s\S]*\}/);
      parsed=JSON.parse(m?m[0]:clean);
    }catch(e){throw new Error('Bad JSON: '+raw.slice(0,100));}
    var tags=applyChanges(parsed.changes||{});
    var tagHtml=tags.map(function(t){return'<span class="ai-tag">'+esc(t)+'</span>';}).join(' ');
    addMsg('abot','<b>'+esc(parsed.explanation||'Done.')+'</b>'+(tags.length?'<br><br>'+tagHtml:''));
    setStatus('');
  }catch(err){
    if(err.name==='AbortError'||_aborted){
      addMsg('sys','&#9632; Stopped.');
    }else{
      addMsg('aerr',esc('Error: '+err.message));
    }
    setStatus('');
  }finally{
    abortCtrl=null;
    setSending(false);
    ta.focus();
  }
}

stopBtn.addEventListener('click',doStop);

sbtn.addEventListener('click',doSend);
ta.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();doSend();}});
document.getElementById('ai-clrh').addEventListener('click',function(){chatHist=[];hist.innerHTML='<div class="ai-msg sys">History cleared.</div>';});
document.getElementById('ai-cls').addEventListener('click',function(){closePanel('prompt-panel');setTool('');});
document.getElementById('aitool').addEventListener('click',function(){
  var p=document.getElementById('prompt-panel');
  if(p.classList.contains('open')){closePanel('prompt-panel');setTool('');}
  else{openPanel('prompt-panel');document.querySelectorAll('.tbtn').forEach(function(b){b.classList.toggle('on',b.dataset.t==='ai');});setTimeout(function(){ta.focus();},50);}
});

})();
