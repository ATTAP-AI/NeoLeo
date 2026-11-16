/* ══════════════════════════════════════════════════════════
   AI PROMPT SYSTEM — extracted from NeoLeo monolith
   Depends on globals: eng, LS, AS, PD, ENAMES, cv, ctx, uv,
     lv, dv, av, gp, dec, buildP, drawSw, generate,
     renderLighting, renderAtmosphere, openPanel, closePanel, setTool
   ══════════════════════════════════════════════════════════ */
(function(){

var PALETTES_AI=['ember','ink','ocean','neon','earth','ghost','aurora','void','rust','botanic','anime'];
var ENGINES_AI=Object.keys(ENAMES);
var BRUSH_TYPES_AI=['round_soft','round_hard','airbrush','pencil','chalk','dry','flat_soft','flat_hard','spatter','ink','maobi','xieyi','gongbi','zhubi','pomo','kubi','shoujin','wn_s7mini','wn_s7round','wn_sceptre','wn_flatwash','wn_cotman','wn_rigger'];
var HUMAN_SLIDERS_AI={amt:'hum-amt',wob:'hum-wob',pre:'hum-pre',edg:'hum-edg',ink:'hum-ink',dri:'hum-dri',pap:'hum-pap'};
var ADJ_KEYS_AI=['bri','con','sat','exp','hil','shd','tmp','tnt'];

function getState(){
  var params={};
  if(PD[eng])PD[eng].forEach(function(p){params[p.id]=gp(p.id);});
  var st={engine:eng,palette:document.getElementById('pal').value,params:params,
    lighting:{on:LS.on,l1:{on:LS.lights[0].on,type:LS.lights[0].type,col:LS.lights[0].col,int:LS.lights[0].int,px:LS.lights[0].px,py:LS.lights[0].py,rad:LS.lights[0].rad},l2:{on:LS.lights[1].on,type:LS.lights[1].type,col:LS.lights[1].col,int:LS.lights[1].int,px:LS.lights[1].px,py:LS.lights[1].py,rad:LS.lights[1].rad},bloom:LS.bloom,ambCol:LS.ambCol,ambInt:LS.ambInt},
    atmosphere:{on:AS.on,vig:{str:AS.vig.str,soft:AS.vig.soft,col:AS.vig.col},fog:{type:AS.fog.type,col:AS.fog.col,den:AS.fog.den},grain:AS.grain,grade:{temp:AS.grade.temp,sat:AS.grade.sat,con:AS.grade.con,bri:AS.grade.bri},aber:AS.aber}};
  /* Brush + canvas + adjust + naturalize + humanize snapshot so the
     model sees where every steerable surface currently sits. */
  st.brush={type:window.brushType||'round_hard',size:window.brushSz||10,opacity:window.brushOp||0.9,hardness:window.brushHd||0.7,color:window.drawCol||'#ff4040'};
  try{
    var cvEl=document.getElementById('cv');
    st.canvas={bg:window._canvasBg||'#000000',w:cvEl?cvEl.width:0,h:cvEl?cvEl.height:0};
  }catch(e){}
  try{
    var adj={};
    ADJ_KEYS_AI.forEach(function(k){var el=document.getElementById('u-'+k);if(el)adj[k]=+el.value;});
    st.imageAdjust=adj;
  }catch(e){}
  if(window._NAT){
    var N=window._NAT;
    st.naturalize={
      grain:{on:N.grainOn,type:N.grainType,amt:N.grainAmt,size:N.grainSize,blend:N.grainBlend,mono:N.grainMono},
      jitter:{on:N.jitterOn,amt:N.jitterAmt,color:N.jitterColor,width:N.jitterWidth},
      multi:{on:N.multiOn,passes:N.multiPasses,blend:N.multiBlend,opacity:N.multiOpacity}
    };
  }
  try{
    var hum={};
    Object.keys(HUMAN_SLIDERS_AI).forEach(function(k){var el=document.getElementById(HUMAN_SLIDERS_AI[k]);if(el)hum[k]=+el.value;});
    if(Object.keys(hum).length) st.humanize=hum;
  }catch(e){}
  return st;
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

var SYS = [
'You are NeoLeo AI creative director. NeoLeo is a generative art app.',
'Return ONLY a single valid JSON object \u2014 no markdown, no extra text.',
'',
'PALETTES: ember, ink, ocean, neon, earth, ghost, aurora, void, rust, botanic, anime',
'',
'ENGINES (49 total; use the short key as `engine`):',
' Core:    flowfield, attractor, subdivision, interference, growth, lissajous',
' Particle & Force: gravity_wells, boid_flocking, magnetic_field',
' Reaction & Grain: reaction_diffusion, sand_drift, physarum, reaction_diffusion_b',
' Geometric:        voronoi, truchet, penrose, spirograph, apollonian, space_filling, lsystem, delaunay, mst, force_graph',
' Noise & Field:    domain_warp, curl_noise, ridged_fractal, marble_wood',
' Cellular:         game_of_life, langtons_ant, cave_map, crystal_growth, wfc',
' Fractal:          julia_set, newton_fractal, ifs, flame_fractal',
' Surface:          contour_map, chladni, weave_knot, mobius_torus, oscilloscope, ascii_density',
' Organic:          space_colonization, hydraulic_erosion, cell_growth, watercolor, diatom, fungal_network',
' Figure:           anatomy  (parametric anatomical mannequin — the only engine that references anatomical data, still fully procedural)',
'',
'ENGINE PARAMS (short key + range or enum; omit unchanged):',
' flowfield: fp(200-3000) fl(60-500) fs(3-40) fv(0.5-6) fw(0.2-3) fa(4-60) fc(0-3)',
' attractor: ai(100000-1500000) ap(0.3-2.5) aa(1-25) at(clifford|dejong|bedhead)',
' subdivision: dd(3-9) dr(0.2-0.8) dg(0-16) dc(0-24) ds(fill|outline|mixed)',
' interference: wn(2-14) wf(3-40) wr(1-6) wm(sin|abs|tanh|xor)',
' growth: gn(6-40) gs(50-300) gr(5-40) gi(5-22) gw(0.5-6)',
' lissajous: lr(2-18) lc(2-18) lt(100-800) lw(0.2-3) la(5-80)',
' gravity_wells: gw_n(2-8) gw_p(200-3000) gw_g(0.1-5) gw_s(0.5-6) gw_t(0.01-0.5)',
' boid_flocking: bf_n(50-600) bf_al(0-3) bf_co(0-3) bf_se(0-3) bf_sp(0.5-5)',
' magnetic_field: mf_n(2-10) mf_l(6-24) mf_s(1-8) mf_w(0.3-3)',
' reaction_diffusion: rd_f(0.01-0.1) rd_k(0.04-0.08) rd_it(20-120) rd_sc(1-4)',
' sand_drift: sd_n(500-8000) sd_g(0.1-2) sd_a(20-60) sd_sz(1-4)',
' voronoi: vo_n(10-200) vo_e(0-4) vo_s(fill|outline|both|dots)',
' truchet: tr_s(10-80) tr_w(0.5-8) tr_t(quarter|diagonal|mixed)',
' penrose: pe_d(3-7) pe_s(fill|outline|both)',
' spirograph: sg_R(50-280) sg_r(10-200) sg_d(5-180) sg_n(1-12) sg_t(100-800)',
' apollonian: ap_d(2-7) ap_w(0.2-2)',
' space_filling: sf_d(2-8) sf_t(hilbert|peano|gosper) sf_w(0.3-4)',
' lsystem: ls_n(3-7) ls_a(15-45) ls_t(plant|fern|dragon|sierpinski|bush) ls_w(0.3-3)',
' domain_warp: dw_o(1-5) dw_s(1-8) dw_r(1-5) dw_sc(2-20)',
' curl_noise: cn_l(2-8) cn_p(100-2000) cn_s(1-8) cn_w(5-60)',
' ridged_fractal: rf_o(2-8) rf_r(1-5) rf_c(4-32) rf_sc(2-20)',
' marble_wood: mw_t(marble|wood|turbulence) mw_sc(2-20) mw_tw(1-20) mw_r(1-4)',
' game_of_life: gl_sc(4-20) gl_g(20-200) gl_d(10-60)',
' langtons_ant: la_s(5000-100000) la_cs(2-10) la_na(1-8)',
' cave_map: cm_sc(4-16) cm_it(2-8) cm_d(30-60) cm_s(solid|gradient|outlined)',
' crystal_growth: cg_p(1000-20000) cg_s(1-6) cg_st(0.1-1) cg_w(1-4)',
' force_graph: fg_n(8-60) fg_e(0.1-0.5) fg_it(50-300) fg_r(50-400)',
' mst: ms_n(20-200) ms_w(0.3-4) ms_d(yes|no)',
' delaunay: dl_n(20-300) dl_s(triangles|voronoi|both) dl_w(0.3-3)',
' julia_set: js_m(julia|mandelbrot) js_cx(-2-2) js_cy(-2-2) js_it(50-500) js_z(0.5-4)',
' newton_fractal: nf_d(3-7) nf_it(20-100) nf_z(0.5-4)',
' ifs: if_t(barnsley|sierpinski|tree|levy|dragon) if_n(10000-200000) if_s(0.3-2)',
' flame_fractal: ff_n(2-6) ff_p(50000-500000) ff_s(0.3-2) ff_g(1-5)',
' contour_map: ct_l(5-40) ct_sc(2-20) ct_w(0.3-3) ct_s(lines|filled|both)',
' chladni: ch_m(1-8) ch_n2(1-8) ch_sc(1-4)',
' weave_knot: wk_n(3-16) wk_c(2-10) wk_w(1-8) wk_t(weave|knot|braid)',
' mobius_torus: mt_t(torus|mobius|trefoil|hopf) mt_u(40-200) mt_v(10-80) mt_s(wireframe|surface|lines)',
' oscilloscope: os_x(1-16) os_y(1-16) os_n(1-6) os_w(0.3-3) os_al(10-80)',
' ascii_density: ad_cs(6-24) ad_sc(2-20) ad_t(noise|gradient|rings)',
' wfc: wf2_s(8-40) wf2_t(circuit|maze|organic|castle) wf2_at(1-5)',
' physarum: ph_n(500-8000) ph_ss(1-12) ph_sa(10-60) ph_dd(0.8-0.99) ph_ds(0.1-3) ph_st(50-500)',
' space_colonization: sc_na(50-600) sc_nn(1-5) sc_ki(5-30) sc_kr(10-60) sc_lw(0.5-6) sc_mb(100-2000)',
' reaction_diffusion_b: rb_pr(coral|fingerprint|sponge|bacteria|maze|spots|mitosis|labyrinths) rb_it(200-2000) rb_sc(1-4)',
' hydraulic_erosion: he_res(1-6) he_dr(1000-30000) he_cap(1-10) he_er(0.1-1) he_dep(0.1-1)',
' cell_growth: cg2_n(4-40) cg2_it(20-200) cg2_pr(0.5-3) cg2_st(fill|outline|both|membrane)',
' watercolor: wc_l(4-40) wc_b(0.5-3) wc_bl(0-20) wc_w(0.2-2)',
' diatom: dt_sym(3-16) dt_ri(2-12) dt_pt(20-120) dt_lw(0.3-3) dt_co(1-12)',
' fungal_network: fn_se(1-12) fn_st(50-300) fn_an(5-45) fn_tp(0.7-0.98) fn_an2(0-50)',
' anatomy: an_p(standing|vitruvian|contrapposto|seated) an_v(front|threeQ|side|back|above) an_s(wireframe|contour|hatched|xray) an_d(1-3 detail level) an_r(0-360 rotation) an_l(0.3-3 line wt) an_3d(off|on — painter-sorted depth + depth-fade shading, default on) an_om(off|figure — when Object Mode is engaged, "figure" registers the whole mannequin as one movable/rotatable/resizable object)',
'',
'LIGHTING: on(bool) l1/l2: on type(point|spot|rim) col(hex) int(0-100) px(0-100) py(0-100) rad(20-600) bloom(0-40) ambCol(hex) ambInt(0-100)',
'ATMOSPHERE: on(bool) vig.str/soft(0-100) vig.col fog.type(none|flat|radial|bottom|top) fog.col fog.den(0-100) grain(0-100) grade.temp/sat/con/bri(-100 to 100) aber(0-50)',
'',
'BRUSH (for hand strokes; canvas keeps whatever is already painted):',
' type: round_soft|round_hard|airbrush|pencil|chalk|dry|flat_soft|flat_hard|spatter|ink|maobi|xieyi|gongbi|zhubi|pomo|kubi|shoujin|wn_s7mini|wn_s7round|wn_sceptre|wn_flatwash|wn_cotman|wn_rigger',
' size(1-100 px)  opacity(0-1)  hardness(0-1)  color(hex, "#rrggbb")',
'',
'CANVAS:',
' bg(hex, "#rrggbb" \u2014 or "transparent") \u2014 background fill for the generative layer',
' resolution: {ratio:"square"|"9:16"|"16:9"|"circle"|"golden"} OR {w:INT,h:INT} for a custom pixel size',
'',
'IMAGE_ADJUST (applies a CSS filter to the whole stage):',
' bri(-100..100) con(-100..100) sat(-100..100) exp(-100..100)',
' hil(-100..100) shd(-100..100) tmp(-100..100) tnt(-100..100)',
'',
'NATURALIZE (post-render organic feel):',
' grain: {on(bool), type(film|paper|noise|halftone|dust), amt(1-100), size(1-4), blend(overlay|multiply|screen|soft-light), mono(bool)}',
' jitter: {on(bool), amt(0-10 px position jitter), color(0-10 hue jitter), width(0-30 stroke variation)}',
' multi: {on(bool), passes(2-6), blend(screen|overlay|soft-light|multiply|lighter), opacity(10-80), seedDrift(0-20), scaleDrift(0-10), rotDrift(0-10)}',
'',
'HUMANIZE (organic imperfection sliders 0-100; call apply:true to commit to canvas):',
' amt (overall), wob (wobble), pre (pressure), edg (edge roughness),',
' ink (ink pool), dri (colour drift), pap (paper texture), apply(bool)',
'',
'JSON shape (omit unchanged keys \u2014 send only what should change):',
'{"explanation":"one sentence","changes":{',
' "engine":"physarum","palette":"anime","params":{"ph_n":4000},',
' "lighting":{"on":true,"l1":{"col":"#ff8800","int":70}},',
' "atmosphere":{"on":true,"grain":15},',
' "brush":{"type":"maobi","size":18,"color":"#ff4fa3"},',
' "canvas":{"bg":"#0a0a14","resolution":{"ratio":"9:16"}},',
' "imageAdjust":{"con":20,"sat":-15,"tmp":10},',
' "naturalize":{"grain":{"on":true,"amt":30}, "multi":{"on":true,"passes":3}},',
' "humanize":{"amt":50,"wob":40,"apply":true},',
' "generate":true',
'}}'
].join('\n');

function applyLight(li,idx){
  if(!li)return;
  var lt=LS.lights[idx],n=idx+1;
  if(typeof li.on==='boolean'){lt.on=li.on;var cb=document.getElementById('l'+n+'-on');if(cb)cb.checked=li.on;}
  if(li.type){lt.type=li.type;var s=document.getElementById('l'+n+'-type');if(s)s.value=li.type;}
  if(li.col){lt.col=li.col;var i=document.getElementById('l'+n+'-col');if(i)i.value=li.col;var w=document.getElementById('l'+n+'csw');if(w)w.style.background=li.col;var tx=document.getElementById('l'+n+'-coltxt');if(tx)tx.textContent=li.col;}
  ['int','px','py','rad'].forEach(function(k){if(li[k]===undefined)return;lt[k]=+li[k];var s=document.getElementById('l'+n+'-'+k);if(s)s.value=li[k];var v=document.getElementById('l'+n+'-'+k+'v');if(v)v.textContent=li[k]+(k==='px'||k==='py'?'%':'');});
}

/* ── Helpers for the new surfaces the AI can drive ── */

function _clamp(v, lo, hi){ v = +v; if(isNaN(v)) return lo; return Math.max(lo, Math.min(hi, v)); }

function _setSliderById(id, val, valLabelId, suffix){
  var el = document.getElementById(id); if(!el) return false;
  el.value = val;
  var vl = valLabelId ? document.getElementById(valLabelId) : null;
  if(vl) vl.textContent = (typeof val === 'number' && val >= 0 ? '' : '') + val + (suffix||'');
  el.dispatchEvent(new Event('input', {bubbles:true}));
  el.dispatchEvent(new Event('change', {bubbles:true}));
  return true;
}

function applyBrush(b){
  if(!b) return false;
  var touched = false;
  if(b.type && BRUSH_TYPES_AI.indexOf(b.type) !== -1){
    window.brushType = b.type; touched = true;
  }
  if(b.size !== undefined){ window.brushSz = _clamp(b.size, 1, 100); touched = true; }
  if(b.opacity !== undefined){ window.brushOp = _clamp(b.opacity, 0, 1); touched = true; }
  if(b.hardness !== undefined){ window.brushHd = _clamp(b.hardness, 0, 1); touched = true; }
  if(b.color && /^#[0-9a-fA-F]{6}$/.test(b.color)){
    window.drawCol = b.color;
    var picker = document.getElementById('bp-col-in');
    if(picker){ picker.value = b.color; picker.dispatchEvent(new Event('input', {bubbles:true})); }
    touched = true;
  }
  return touched;
}

function applyCanvas(cv2){
  if(!cv2) return false;
  var touched = false;
  if(cv2.bg && (cv2.bg === 'transparent' || /^#[0-9a-fA-F]{6}$/.test(cv2.bg))){
    if(typeof window._setCanvasBg === 'function'){
      window._setCanvasBg(cv2.bg);
    } else {
      window._canvasBg = cv2.bg;
    }
    touched = true;
  }
  if(cv2.resolution){
    var r = cv2.resolution;
    if(r.ratio){
      /* Click the matching ratio thumbnail so the resolution controls
         module handles the resize + preview refresh. */
      var thumb = document.querySelector('#ratio-thumbs .ratio-thumb[data-ratio="' + r.ratio + '"]');
      if(thumb){ thumb.click(); touched = true; }
    } else if(r.w && r.h && typeof window._setCanvasSize === 'function'){
      window._setCanvasSize(_clamp(r.w, 64, 4096), _clamp(r.h, 64, 4096));
      touched = true;
    }
  }
  return touched;
}

function applyImageAdjust(a){
  if(!a) return false;
  var touched = false;
  ADJ_KEYS_AI.forEach(function(k){
    if(a[k] === undefined) return;
    var v = _clamp(a[k], -100, 100);
    var el = document.getElementById('u-' + k);
    var vl = document.getElementById('u-' + k + 'v');
    if(el){ el.value = v; el.dispatchEvent(new Event('input', {bubbles:true})); }
    if(vl) vl.textContent = (v > 0 ? '+' : '') + v;
    touched = true;
  });
  if(touched && typeof window._adjApply === 'function') window._adjApply();
  return touched;
}

function applyNaturalize(n){
  if(!n || !window._NAT) return false;
  var NAT = window._NAT, touched = false;
  if(n.grain){
    var g = n.grain;
    if(typeof g.on === 'boolean')    { NAT.grainOn = g.on; touched = true; }
    if(g.type)                        { NAT.grainType = g.type; touched = true; }
    if(g.amt !== undefined)           { NAT.grainAmt  = _clamp(g.amt, 1, 100); _setSliderById('nat-grain-amt', NAT.grainAmt, 'nat-grain-v', '%'); touched = true; }
    if(g.size !== undefined)          { NAT.grainSize = _clamp(g.size, 1, 4); _setSliderById('nat-grain-sz', NAT.grainSize, 'nat-grain-sz-v', '×'); touched = true; }
    if(g.blend)                        { NAT.grainBlend = g.blend; var s = document.getElementById('nat-grain-blend'); if(s){ s.value = g.blend; } touched = true; }
    if(typeof g.mono === 'boolean')   { NAT.grainMono = g.mono; var m = document.getElementById('nat-grain-mono'); if(m) m.checked = g.mono; touched = true; }
  }
  if(n.jitter){
    var j = n.jitter;
    if(typeof j.on === 'boolean')     { NAT.jitterOn = j.on; touched = true; }
    if(j.amt !== undefined)            { NAT.jitterAmt   = _clamp(j.amt, 0, 10); touched = true; }
    if(j.color !== undefined)          { NAT.jitterColor = _clamp(j.color, 0, 10); touched = true; }
    if(j.width !== undefined)          { NAT.jitterWidth = _clamp(j.width, 0, 30); touched = true; }
  }
  if(n.multi){
    var mp = n.multi;
    if(typeof mp.on === 'boolean')     { NAT.multiOn = mp.on; touched = true; }
    if(mp.passes !== undefined)         { NAT.multiPasses = _clamp(mp.passes, 2, 6); touched = true; }
    if(mp.blend)                        { NAT.multiBlend = mp.blend; touched = true; }
    if(mp.opacity !== undefined)        { NAT.multiOpacity = _clamp(mp.opacity, 10, 80); touched = true; }
    if(mp.seedDrift !== undefined)      { NAT.multiSeedDrift = _clamp(mp.seedDrift, 0, 20); touched = true; }
    if(mp.scaleDrift !== undefined)     { NAT.multiScaleDrift = _clamp(mp.scaleDrift, 0, 10); touched = true; }
    if(mp.rotDrift !== undefined)       { NAT.multiRotDrift = _clamp(mp.rotDrift, 0, 10); touched = true; }
  }
  if(touched && typeof window._natApplyEffects === 'function') window._natApplyEffects();
  return touched;
}

function applyHumanize(h){
  if(!h) return false;
  /* Humanize builds its slider DOM lazily on first open. Ensure it
     exists before we try to set values on it. */
  if(typeof window._humEnsureBuilt === 'function') window._humEnsureBuilt();
  var touched = false;
  Object.keys(HUMAN_SLIDERS_AI).forEach(function(k){
    if(h[k] === undefined) return;
    var v = _clamp(h[k], 0, 100);
    _setSliderById(HUMAN_SLIDERS_AI[k], v);
    touched = true;
  });
  if(h.apply === true){
    var btn = document.getElementById('hum-apply-btn');
    if(btn) btn.click();
    touched = true;
  }
  return touched;
}

function applyChanges(c){
  if(!c)return[];
  var tags=[];
  if(c.engine&&ENGINES_AI.indexOf(c.engine)!==-1&&c.engine!==eng){eng=c.engine;_engineSelected=true;document.querySelectorAll('.eng').forEach(function(b){b.classList.toggle('on',b.dataset.e===eng);});buildP(eng);if(typeof window._focusOnParams==='function')window._focusOnParams();tags.push('engine:'+eng);}
  if(c.palette&&PALETTES_AI.indexOf(c.palette)!==-1){document.getElementById('pal').value=c.palette;drawSw();tags.push('palette:'+c.palette);}
  if(c.params){Object.entries(c.params).forEach(function(entry){var id=entry[0],val=entry[1];var el=document.getElementById(id);if(!el)return;if(el.tagName==='SELECT'){el.value=String(val);}else{var pd=PD[eng]&&PD[eng].find(function(p){return p.id===id;});if(pd){var v=Math.max(pd.min,Math.min(pd.max,+val));el.value=v;var vl=document.getElementById(id+'v');if(vl)vl.textContent=parseFloat(v).toFixed(dec(pd));}}tags.push(id+'='+val);});}
  if(c.lighting){var L=c.lighting;if(typeof L.on==='boolean'){LS.on=L.on;var cb=document.getElementById('l-on');if(cb)cb.checked=L.on;}applyLight(L.l1,0);applyLight(L.l2,1);if(L.bloom!==undefined){LS.bloom=+L.bloom;var s=document.getElementById('l-blm');if(s)s.value=L.bloom;var v=document.getElementById('l-blmv');if(v)v.textContent=L.bloom;}if(L.ambCol){LS.ambCol=L.ambCol;var i=document.getElementById('l-ambc');if(i)i.value=L.ambCol;var w=document.getElementById('lambcsw');if(w)w.style.background=L.ambCol;}if(L.ambInt!==undefined){LS.ambInt=+L.ambInt;var s2=document.getElementById('l-amb');if(s2)s2.value=L.ambInt;var v2=document.getElementById('l-ambv');if(v2)v2.textContent=L.ambInt;}renderLighting();tags.push('lighting');}
  if(c.atmosphere){var A=c.atmosphere;if(typeof A.on==='boolean'){AS.on=A.on;var cb2=document.getElementById('a-on');if(cb2)cb2.checked=A.on;}if(A.vig){if(A.vig.str!==undefined){AS.vig.str=+A.vig.str;var s3=document.getElementById('a-vstr');if(s3)s3.value=A.vig.str;var v3=document.getElementById('a-vstrv');if(v3)v3.textContent=A.vig.str;}if(A.vig.soft!==undefined){AS.vig.soft=+A.vig.soft;var s4=document.getElementById('a-vsft');if(s4)s4.value=A.vig.soft;var v4=document.getElementById('a-vsftv');if(v4)v4.textContent=A.vig.soft;}if(A.vig.col){AS.vig.col=A.vig.col;var s5=document.getElementById('a-vcol');if(s5)s5.value=A.vig.col;var w2=document.getElementById('avgcsw');if(w2)w2.style.background=A.vig.col;}}if(A.fog){if(A.fog.type){AS.fog.type=A.fog.type;var s6=document.getElementById('a-ftype');if(s6)s6.value=A.fog.type;}if(A.fog.col){AS.fog.col=A.fog.col;var s7=document.getElementById('a-fcol');if(s7)s7.value=A.fog.col;var w3=document.getElementById('afgsw');if(w3)w3.style.background=A.fog.col;}if(A.fog.den!==undefined){AS.fog.den=+A.fog.den;var s8=document.getElementById('a-fden');if(s8)s8.value=A.fog.den;var v5=document.getElementById('a-fdenv');if(v5)v5.textContent=A.fog.den;}}[['grain','a-grain','a-grainv'],['aber','a-aber','a-aberv']].forEach(function(arr){var k=arr[0],sid=arr[1],vid=arr[2];if(A[k]!==undefined){AS[k]=+A[k];var s9=document.getElementById(sid);if(s9)s9.value=A[k];var v6=document.getElementById(vid);if(v6)v6.textContent=A[k];}});if(A.grade){['temp','sat','con','bri'].forEach(function(k){if(A.grade[k]!==undefined){AS.grade[k]=+A.grade[k];var s10=document.getElementById('a-'+k);if(s10)s10.value=A.grade[k];var v7=document.getElementById('a-'+k+'v');if(v7)v7.textContent=A.grade[k];}});}renderAtmosphere();tags.push('atmosphere');}
  if(c.brush        && applyBrush(c.brush))              tags.push('brush');
  if(c.canvas       && applyCanvas(c.canvas))            tags.push('canvas');
  if(c.imageAdjust  && applyImageAdjust(c.imageAdjust))  tags.push('imageAdjust');
  if(c.naturalize   && applyNaturalize(c.naturalize))    tags.push('naturalize');
  if(c.humanize     && applyHumanize(c.humanize))        tags.push('humanize');
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

/* chatHist keeps the original block shape ({type:'text'} / {type:'image'});
   this turns one turn into the OpenAI-style message ATTAP.chat sends. */
function toAttapMsg(m){
  if(typeof m.content==='string')return {role:m.role,content:m.content};
  if(m.role!=='user'){
    return {role:m.role,content:m.content.filter(function(b){return b.type==='text';}).map(function(b){return b.text;}).join('')};
  }
  return {role:'user',content:m.content.map(function(b){
    if(b.type==='image')return {type:'image_url',image_url:{url:'data:'+b.source.media_type+';base64,'+b.source.data}};
    return {type:'text',text:b.text};
  })};
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

  /* Runs on the reader's ATTAP account (attap-gate.js, loaded first in the
     page): ATTAP's keys, the reader's credits, charged only when an answer
     arrives. Nobody brings a key. ATTAP.chat speaks OpenAI-style messages, so
     toAttapMsg sends the canvas snapshot as an image_url data URL. */
  if(!window.ATTAP){
    addMsg('aerr','Sign-in could not load. Reload the page and sign in to your ATTAP account.');
    setSending(false); setStatus(''); return;
  }

  var _aborted = false;
  var ctrl = typeof AbortController==='function' ? new AbortController() : null;
  abortCtrl = { _flagAbort: function(){ _aborted = true; if(ctrl) ctrl.abort(); } };

  try{
    var raw = await ATTAP.chat({
      system: SYS,
      messages: chatHist.map(toAttapMsg),
      max_tokens: 1000,
      signal: ctrl ? ctrl.signal : undefined
    });
    if(_aborted)throw new DOMException('Aborted','AbortError');
    if(!raw)throw new Error('The model returned no answer. Nothing was charged.');
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
/* Expose the change applier so scripts, tests, and other modules can
   drive the same surfaces the AI chat drives, without going through
   the API. Same shape as the JSON the model emits inside `changes`. */
window._aiApply = applyChanges;

document.getElementById('aitool').addEventListener('click',function(){
  var p=document.getElementById('prompt-panel');
  if(p.classList.contains('open')){closePanel('prompt-panel');setTool('');}
  else{openPanel('prompt-panel');document.querySelectorAll('.tbtn').forEach(function(b){b.classList.toggle('on',b.dataset.t==='ai');});setTimeout(function(){ta.focus();},50);}
});

})();
