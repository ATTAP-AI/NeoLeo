/* ══════════════════════════════════════════════════════════════════
   ANATOMY ENGINE — parametric anatomical mannequin
   ══════════════════════════════════════════════════════════════════
   The one deliberate exception to NeoLeo's "no external corpus" rule.
   Every figure is still generated from equations at runtime — spheres
   for joints, capsules for bones, arcs for ribs, cubic Bezier for the
   spine — with no image data, no photograph reference, and no trained
   model behind it. The only "corpus" is the small set of anatomical
   proportions and joint positions hard-coded below, derived from
   Vitruvian and academic-drawing canon (all public-domain reference).

   Phase 1 (this commit): a stylized parametric mannequin. Phase 2
   will optionally load public-domain 3D anatomical geometry data
   (BodyParts3D CC-BY-SA) for finer detail, once source, attribution,
   and file-size decisions are settled with the maintainer.
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* ── Poses ── Joint positions in a unit-normalized coord system,
     origin at pelvis, +y down (screen-natural), +x right, +z forward. */
  var POSES = {
    standing: {
      skull:      [ 0.00, -0.85,  0.00],
      neck:       [ 0.00, -0.62,  0.00],
      shoulder_L: [-0.17, -0.55,  0.00],
      shoulder_R: [ 0.17, -0.55,  0.00],
      elbow_L:    [-0.22, -0.30,  0.02],
      elbow_R:    [ 0.22, -0.30,  0.02],
      wrist_L:    [-0.24, -0.02,  0.00],
      wrist_R:    [ 0.24, -0.02,  0.00],
      spine_mid:  [ 0.00, -0.38,  0.00],
      pelvis:     [ 0.00, -0.05,  0.00],
      hip_L:      [-0.10, -0.02,  0.00],
      hip_R:      [ 0.10, -0.02,  0.00],
      knee_L:     [-0.11,  0.30,  0.02],
      knee_R:     [ 0.11,  0.30,  0.02],
      ankle_L:    [-0.12,  0.62,  0.00],
      ankle_R:    [ 0.12,  0.62,  0.00]
    },
    vitruvian: {
      skull:      [ 0.00, -0.85,  0.00],
      neck:       [ 0.00, -0.62,  0.00],
      shoulder_L: [-0.17, -0.55,  0.00],
      shoulder_R: [ 0.17, -0.55,  0.00],
      elbow_L:    [-0.40, -0.55,  0.00],
      elbow_R:    [ 0.40, -0.55,  0.00],
      wrist_L:    [-0.62, -0.55,  0.00],
      wrist_R:    [ 0.62, -0.55,  0.00],
      spine_mid:  [ 0.00, -0.38,  0.00],
      pelvis:     [ 0.00, -0.05,  0.00],
      hip_L:      [-0.10, -0.02,  0.00],
      hip_R:      [ 0.10, -0.02,  0.00],
      knee_L:     [-0.24,  0.30,  0.00],
      knee_R:     [ 0.24,  0.30,  0.00],
      ankle_L:    [-0.38,  0.62,  0.00],
      ankle_R:    [ 0.38,  0.62,  0.00]
    },
    contrapposto: {
      skull:      [ 0.02, -0.83,  0.00],
      neck:       [ 0.02, -0.60,  0.00],
      shoulder_L: [-0.14, -0.54,  0.00],
      shoulder_R: [ 0.19, -0.58,  0.00],
      elbow_L:    [-0.22, -0.30,  0.04],
      elbow_R:    [ 0.24, -0.30,  0.02],
      wrist_L:    [-0.20, -0.02,  0.02],
      wrist_R:    [ 0.28,  0.00, -0.02],
      spine_mid:  [ 0.02, -0.36,  0.00],
      pelvis:     [ 0.02, -0.04,  0.00],
      hip_L:      [-0.11, -0.02,  0.00],
      hip_R:      [ 0.13, -0.04,  0.00],
      knee_L:     [-0.09,  0.30,  0.04],
      knee_R:     [ 0.13,  0.32, -0.02],
      ankle_L:    [-0.05,  0.62,  0.00],
      ankle_R:    [ 0.15,  0.62,  0.00]
    },
    seated: {
      skull:      [ 0.00, -0.60,  0.00],
      neck:       [ 0.00, -0.42,  0.00],
      shoulder_L: [-0.17, -0.36,  0.00],
      shoulder_R: [ 0.17, -0.36,  0.00],
      elbow_L:    [-0.22, -0.12,  0.02],
      elbow_R:    [ 0.22, -0.12,  0.02],
      wrist_L:    [-0.20,  0.10,  0.00],
      wrist_R:    [ 0.20,  0.10,  0.00],
      spine_mid:  [ 0.00, -0.20,  0.00],
      pelvis:     [ 0.00,  0.10,  0.00],
      hip_L:      [-0.10,  0.10,  0.00],
      hip_R:      [ 0.10,  0.10,  0.00],
      knee_L:     [-0.11,  0.15,  0.35],
      knee_R:     [ 0.11,  0.15,  0.35],
      ankle_L:    [-0.12,  0.48,  0.42],
      ankle_R:    [ 0.12,  0.48,  0.42]
    }
  };

  /* ── Bone graph: joint-pair segments to draw. Same for every pose. ── */
  var BONES = [
    ['neck','skull'],
    ['spine_mid','neck'],
    ['pelvis','spine_mid'],
    ['neck','shoulder_L'],['neck','shoulder_R'],
    ['shoulder_L','elbow_L'],['elbow_L','wrist_L'],
    ['shoulder_R','elbow_R'],['elbow_R','wrist_R'],
    ['pelvis','hip_L'],['pelvis','hip_R'],
    ['hip_L','knee_L'],['knee_L','ankle_L'],
    ['hip_R','knee_R'],['knee_R','ankle_R']
  ];

  /* Joint radii (world units) for sphere primitives at articulations. */
  var JOINT_R = {
    skull: 0.115, neck: 0.030,
    shoulder_L: 0.045, shoulder_R: 0.045,
    elbow_L: 0.032, elbow_R: 0.032,
    wrist_L: 0.028, wrist_R: 0.028,
    spine_mid: 0.030, pelvis: 0.055,
    hip_L: 0.045, hip_R: 0.045,
    knee_L: 0.040, knee_R: 0.040,
    ankle_L: 0.030, ankle_R: 0.030
  };

  /* ── View presets ── Combinations of yaw (ry) + tilt (rx) that
     match common life-drawing angles. `an_r` adds an extra yaw offset
     so users can rotate off the preset without re-picking it. */
  var VIEWS = {
    front:   { rx: 0.00, ry: 0.00 },
    threeQ:  { rx: 0.00, ry: 0.45 },
    side:    { rx: 0.00, ry: 1.55 },
    back:    { rx: 0.00, ry: 3.14 },
    above:   { rx: 0.65, ry: 0.30 }
  };

  /* ── Project a 3D unit-normalized point to screen pixels ── */
  function makeProjector(W, H, rx, ry, scale){
    var cx = W/2, cy = H*0.52;
    var s  = Math.min(W, H) * (scale || 0.42);
    var cX = Math.cos(rx), sX = Math.sin(rx);
    var cY = Math.cos(ry), sY = Math.sin(ry);
    return function(px, py, pz){
      /* Rotate around Y then X */
      var x1 =  px * cY + pz * sY;
      var z1 = -px * sY + pz * cY;
      var y1 =  py * cX - z1 * sX;
      var z2 =  py * sX + z1 * cX;
      var d  = 3.0;
      var pk = d / (d + z2);   /* perspective factor */
      return {
        x: cx + x1 * s * pk,
        y: cy + y1 * s * pk,
        z: z2,     /* depth for z-sort */
        k: pk      /* size scale for spheres */
      };
    };
  }

  /* ── Primitive-list plumbing for 3D mode + Object Mode ──────────
     Each helper below builds an anonymous zero-arg draw closure and
     hands it to `emit(z, fn)` along with a representative depth. In
     non-3D mode `emit` draws immediately; in 3D mode it stores each
     closure with its z, then a flush at the end sorts back-to-front
     (painter's algorithm) and calls each with an alpha multiplier
     derived from depth (front = 1.0, far back = 0.35). All screen-
     space points also feed a running bbox so Object Mode can register
     the whole figure as one movable object.  ────────────────────── */
  var _PRIMS = null;   /* set inside anatomy() per render */
  var _BBOX  = null;
  var _emit  = function(z, fn){ fn(1); };   /* replaced per render */
  function _pt(x, y){
    if(!_BBOX) return;
    if(x < _BBOX.x0) _BBOX.x0 = x;
    if(x > _BBOX.x1) _BBOX.x1 = x;
    if(y < _BBOX.y0) _BBOX.y0 = y;
    if(y > _BBOX.y1) _BBOX.y1 = y;
  }

  /* ── Build a filled/hollow sphere as a series of parallel circles.
     Returns projected circles ordered back-to-front for painter's
     algorithm. ── */
  function drawSphere(project, cx, cy, cz, r, col, lw, filled){
    var rings = 9, steps = 24;
    for(var i = 0; i < rings; i++){
      var t = i / (rings - 1);
      var y = cy + (t - 0.5) * 2 * r;
      var rr = Math.sqrt(Math.max(0, r*r - (y-cy)*(y-cy)));
      /* Sample the ring, capture points + representative z. */
      var pts = new Array(steps + 1), zSum = 0;
      for(var s = 0; s <= steps; s++){
        var ang = s / steps * Math.PI * 2;
        var px = cx + rr * Math.cos(ang);
        var pz = cz + rr * Math.sin(ang);
        var q = project(px, y, pz);
        pts[s] = q; zSum += q.z; _pt(q.x, q.y);
      }
      var zAvg = zSum / (steps + 1);
      var baseA = filled ? 0.55 : 0.85;
      _emit(zAvg, function(pts2, baseA2){
        return function(am){
          ctx.beginPath();
          for(var s2 = 0; s2 <= steps; s2++){
            if(s2 === 0) ctx.moveTo(pts2[s2].x, pts2[s2].y);
            else         ctx.lineTo(pts2[s2].x, pts2[s2].y);
          }
          ctx.strokeStyle = col;
          ctx.lineWidth   = lw;
          ctx.globalAlpha = baseA2 * am;
          ctx.stroke();
          ctx.globalAlpha = 1;
        };
      }(pts, baseA));
    }
  }

  /* ── Draw a capsule (cylinder+hemispheres) between two joints.
     `sides` = number of longitudinal ribs, `rings` = latitudinal
     cross-sections. Contour style draws only rings; wireframe draws
     both. ── */
  function drawCapsule(project, p0, p1, r0, r1, col, lw, mode){
    var dx = p1[0]-p0[0], dy = p1[1]-p0[1], dz = p1[2]-p0[2];
    var len = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if(len < 1e-6) return;
    /* Axis unit vector */
    var ux = dx/len, uy = dy/len, uz = dz/len;
    /* Build an arbitrary orthonormal basis perpendicular to (ux,uy,uz) */
    var vx, vy, vz;
    if(Math.abs(uy) < 0.99){
      vx = uy*0 - uz*1; vy = uz*0 - ux*0; vz = ux*1 - uy*0;
      /* simpler: cross with world-up (0,1,0) */
      vx =  uz; vy = 0; vz = -ux;
    } else {
      vx = 1; vy = 0; vz = 0;
    }
    var vlen = Math.sqrt(vx*vx+vy*vy+vz*vz) || 1;
    vx/=vlen; vy/=vlen; vz/=vlen;
    /* Second perp: axis × v */
    var wx = uy*vz - uz*vy;
    var wy = uz*vx - ux*vz;
    var wz = ux*vy - uy*vx;

    var rings = 6, sides = 12;

    /* Cross-section rings */
    if(mode === 'contour' || mode === 'wireframe' || mode === 'hatched'){
      for(var i = 0; i <= rings; i++){
        var t  = i / rings;
        var cxc = p0[0] + dx*t, cyc = p0[1] + dy*t, czc = p0[2] + dz*t;
        var r  = r0 + (r1 - r0) * t;
        var ringPts = new Array(sides + 1), zSum = 0;
        for(var s = 0; s <= sides; s++){
          var a = s / sides * Math.PI * 2;
          var ca = Math.cos(a) * r, sa = Math.sin(a) * r;
          var px = cxc + vx*ca + wx*sa;
          var py = cyc + vy*ca + wy*sa;
          var pz = czc + vz*ca + wz*sa;
          var q = project(px, py, pz);
          ringPts[s] = q; zSum += q.z; _pt(q.x, q.y);
        }
        var zAvg = zSum / (sides + 1);
        _emit(zAvg, function(pts, n){ return function(am){
          ctx.beginPath();
          for(var k = 0; k <= n; k++){
            if(k === 0) ctx.moveTo(pts[k].x, pts[k].y);
            else        ctx.lineTo(pts[k].x, pts[k].y);
          }
          ctx.strokeStyle = col;
          ctx.lineWidth   = lw;
          ctx.globalAlpha = am;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }; }(ringPts, sides));
      }
    }

    /* Longitudinal ribs (wireframe only) */
    if(mode === 'wireframe'){
      for(var s2 = 0; s2 < sides; s2 += 2){
        var a2 = s2 / sides * Math.PI * 2;
        var ca2 = Math.cos(a2), sa2 = Math.sin(a2);
        var longPts = new Array(rings + 1), zSum2 = 0;
        for(var i2 = 0; i2 <= rings; i2++){
          var t2 = i2 / rings;
          var r2 = r0 + (r1 - r0) * t2;
          var cx2 = p0[0] + dx*t2, cy2 = p0[1] + dy*t2, cz2 = p0[2] + dz*t2;
          var px2 = cx2 + vx*ca2*r2 + wx*sa2*r2;
          var py2 = cy2 + vy*ca2*r2 + wy*sa2*r2;
          var pz2 = cz2 + vz*ca2*r2 + wz*sa2*r2;
          var q2 = project(px2, py2, pz2);
          longPts[i2] = q2; zSum2 += q2.z; _pt(q2.x, q2.y);
        }
        var zAvg2 = zSum2 / (rings + 1);
        _emit(zAvg2, function(pts, n){ return function(am){
          ctx.beginPath();
          for(var k = 0; k <= n; k++){
            if(k === 0) ctx.moveTo(pts[k].x, pts[k].y);
            else        ctx.lineTo(pts[k].x, pts[k].y);
          }
          ctx.strokeStyle = col;
          ctx.lineWidth   = lw;
          ctx.globalAlpha = am;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }; }(longPts, rings));
      }
    }
  }

  /* ── Ribcage: a set of arcs from the spine outward, forming the
     characteristic cage of parallel curves. ── */
  function drawRibcage(project, top, bot, col, lw, mode){
    var count = 8;
    for(var i = 0; i < count; i++){
      var t = i / (count - 1);
      var y = top[1] + (bot[1] - top[1]) * t;
      var w = 0.13 + 0.05 * Math.sin(t * Math.PI);
      var d = 0.09 + 0.02 * Math.sin(t * Math.PI);
      for(var side = -1; side <= 1; side += 2){
        var steps = 18;
        var pts = new Array(steps + 1), zSum = 0;
        for(var s = 0; s <= steps; s++){
          var u = s / steps;
          var ang = u * Math.PI;
          var xr = side * w * Math.sin(ang);
          var zr = -d * Math.cos(ang);
          var q = project(xr, y, zr);
          pts[s] = q; zSum += q.z; _pt(q.x, q.y);
        }
        var zAvg = zSum / (steps + 1);
        _emit(zAvg, function(pts2, n){ return function(am){
          ctx.beginPath();
          for(var k = 0; k <= n; k++){
            if(k === 0) ctx.moveTo(pts2[k].x, pts2[k].y);
            else        ctx.lineTo(pts2[k].x, pts2[k].y);
          }
          ctx.strokeStyle = col;
          ctx.lineWidth   = lw;
          ctx.globalAlpha = am;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }; }(pts, steps));
      }
    }
    /* Sternum: a straight midline from top to bottom on the front */
    if(mode === 'wireframe' || mode === 'contour'){
      var q1 = project(0, top[1], -0.09);
      var q2 = project(0, bot[1], -0.09);
      _pt(q1.x, q1.y); _pt(q2.x, q2.y);
      var zAvg = (q1.z + q2.z) * 0.5;
      _emit(zAvg, function(){
        ctx.beginPath();
        ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y);
        ctx.strokeStyle = col; ctx.lineWidth = lw;
        ctx.stroke();
      });
    }
  }

  /* ── Spine: a cubic Bezier from base of skull to pelvis with a
     slight S-curve (thoracic kyphosis + lumbar lordosis). ── */
  function drawSpine(project, skull, pelvis, col, lw){
    var steps = 40;
    var c1 = [skull[0], skull[1] + 0.20, skull[2] + 0.05];
    var c2 = [pelvis[0], pelvis[1] - 0.20, pelvis[2] - 0.04];
    var pts = new Array(steps + 1), zSum = 0;
    for(var i = 0; i <= steps; i++){
      var t = i / steps;
      var mt = 1 - t;
      var x = mt*mt*mt*skull[0] + 3*mt*mt*t*c1[0] + 3*mt*t*t*c2[0] + t*t*t*pelvis[0];
      var y = mt*mt*mt*skull[1] + 3*mt*mt*t*c1[1] + 3*mt*t*t*c2[1] + t*t*t*pelvis[1];
      var z = mt*mt*mt*skull[2] + 3*mt*mt*t*c1[2] + 3*mt*t*t*c2[2] + t*t*t*pelvis[2];
      var q = project(x, y, z);
      pts[i] = q; zSum += q.z; _pt(q.x, q.y);
    }
    var zAvg = zSum / (steps + 1);
    _emit(zAvg, function(){
      ctx.beginPath();
      ctx.strokeStyle = col;
      ctx.lineWidth   = lw;
      for(var k = 0; k <= steps; k++){
        if(k === 0) ctx.moveTo(pts[k].x, pts[k].y);
        else        ctx.lineTo(pts[k].x, pts[k].y);
      }
      ctx.stroke();
    });
  }

  /* ── Cross-hatched shading for the "hatched" style — parallel
     strokes across each bone, angled with the depth. Mimics
     Renaissance figure-study hatching. ── */
  function drawHatchOverlay(project, p0, p1, r, col, lw){
    var dx = p1[0]-p0[0], dy = p1[1]-p0[1], dz = p1[2]-p0[2];
    var len = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if(len < 1e-6) return;
    var count = Math.round(len * 40);
    for(var i = 1; i < count; i++){
      var t = i / count;
      var cx = p0[0] + dx*t, cy = p0[1] + dy*t, cz = p0[2] + dz*t;
      var q1 = project(cx - r*0.8, cy, cz);
      var q2 = project(cx + r*0.8, cy, cz);
      _pt(q1.x, q1.y); _pt(q2.x, q2.y);
      var zAvg = (q1.z + q2.z) * 0.5;
      _emit(zAvg, function(a, b){ return function(am){
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = col;
        ctx.lineWidth   = lw * 0.55;
        ctx.globalAlpha = 0.7 * am;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }; }(q1, q2));
    }
  }

  /* ── Main engine entry ── */
  function anatomy(W, H, p){
    var pose  = gp('an_p');
    var view  = gp('an_v');
    var style = gp('an_s');
    var det   = gp('an_d');
    var rotOffDeg = gp('an_r');
    var lw    = gp('an_l');
    /* New: 3D depth-sort mode + Object Mode emission ('off' | 'figure'
       | 'parts'). 'parts' is reserved for a later phase — treated as
       'figure' for now (one movable object rather than N per-limb). */
    var mode3d = gp('an_3d');
    var omMode = gp('an_om');

    /* Set up per-render primitive buffer + bbox tracker. In 3D mode
       `_emit` collects; in non-3D mode it draws immediately. */
    _PRIMS = (mode3d === 'on') ? [] : null;
    _BBOX  = {x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9};
    /* Local reference so the collect closures find the current mode. */
    var immediate = (mode3d !== 'on');
    _emit = function(z, drawFn){
      if(immediate){ drawFn(1); }
      else         { _PRIMS.push({z: z, draw: drawFn}); }
    };

    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, W, H);

    var Ppos = POSES[pose] || POSES.standing;
    var Vp   = VIEWS[view] || VIEWS.front;
    var rotOff = (rotOffDeg || 0) * Math.PI / 180;

    var project = makeProjector(W, H, Vp.rx, Vp.ry + rotOff, 0.42);

    /* Choose colors from the palette. */
    var bones   = pcol(p, 0.65, 0.90);
    var joints  = pcol(p, 0.85, 0.95);
    var ribs    = pcol(p, 0.45, 0.85);
    var spineC  = pcol(p, 0.10, 0.95);
    var hatchC  = pcol(p, 0.75, 0.55);

    /* Draw bones between joints as capsules. */
    BONES.forEach(function(pair){
      var a = Ppos[pair[0]], b = Ppos[pair[1]];
      if(!a || !b) return;
      /* Bone thickness: thicker for femur/humerus, thinner for
         forearm/lower-leg, thinnest for neck. */
      var ra = 0.045, rb = 0.045;
      if(pair[0].indexOf('shoulder') !== -1 || pair[0].indexOf('hip') !== -1)  ra = 0.055;
      if(pair[1].indexOf('elbow') !== -1  || pair[1].indexOf('knee') !== -1)   rb = 0.038;
      if(pair[1].indexOf('wrist') !== -1  || pair[1].indexOf('ankle') !== -1)  rb = 0.028;
      if(pair[0] === 'neck' || pair[1] === 'neck')                              { ra = 0.035; rb = 0.035; }
      drawCapsule(project, a, b, ra, rb, bones, lw, style);
      if(style === 'hatched'){
        drawHatchOverlay(project, a, b, (ra+rb)*0.5, hatchC, lw);
      }
    });

    /* Draw ribcage. */
    var ribTop = [0, Ppos.neck[1] + 0.06, 0];
    var ribBot = [0, Ppos.spine_mid[1] + 0.10, 0];
    if(det >= 2){
      drawRibcage(project, ribTop, ribBot, ribs, lw, style);
    }

    /* Draw spine curve. */
    if(det >= 2){
      drawSpine(project, Ppos.neck, Ppos.pelvis, spineC, lw);
    }

    /* Skull sphere (visible in every style). */
    var sk = Ppos.skull;
    var q = project(sk[0], sk[1], sk[2]);
    drawSphere(project, sk[0], sk[1], sk[2], JOINT_R.skull, joints, lw*0.9, style !== 'wireframe');

    /* Joint spheres at articulations. */
    if(det >= 1){
      Object.keys(JOINT_R).forEach(function(jn){
        if(jn === 'skull') return;
        var pt = Ppos[jn];
        if(!pt) return;
        var r = JOINT_R[jn];
        drawSphere(project, pt[0], pt[1], pt[2], r, joints, lw*0.75, false);
      });
    }

    /* Silhouette outline for xray style: a light convex-ish outline
       traced through the joint set — not anatomically precise, but
       reads as a figure at a glance. Collect its projected points
       through _pt so Object Mode's bbox stays honest. */
    if(style === 'xray'){
      var order = ['skull','shoulder_L','elbow_L','wrist_L','hip_L','knee_L','ankle_L',
                   'ankle_R','knee_R','hip_R','wrist_R','elbow_R','shoulder_R','skull'];
      var silPts = [], zSum = 0;
      order.forEach(function(k){
        var pt2 = Ppos[k]; if(!pt2) return;
        var qq = project(pt2[0], pt2[1], pt2[2]);
        silPts.push(qq); zSum += qq.z; _pt(qq.x, qq.y);
      });
      var zAvg = silPts.length ? zSum / silPts.length : 0;
      _emit(zAvg, function(){
        ctx.strokeStyle = pcol(p, 0.30, 0.30);
        ctx.lineWidth   = lw * 2.5;
        ctx.beginPath();
        silPts.forEach(function(qq, i){
          if(i === 0) ctx.moveTo(qq.x, qq.y);
          else        ctx.lineTo(qq.x, qq.y);
        });
        ctx.stroke();
      });
    }

    /* ── 3D flush: sort primitives back-to-front, apply depth-fade,
       and draw. z ranges roughly from -0.5 (near) to +0.5 (far) in
       normalized model space; map that to alpha 1.0 (near) → 0.35
       (far) so back bones read as recessive. When 3D is off, `_emit`
       already drew everything inline. ── */
    if(_PRIMS){
      _PRIMS.sort(function(a, b){ return b.z - a.z; });   /* far first */
      var zMin =  1e9, zMax = -1e9;
      _PRIMS.forEach(function(x){
        if(x.z < zMin) zMin = x.z;
        if(x.z > zMax) zMax = x.z;
      });
      var span = Math.max(0.0001, zMax - zMin);
      _PRIMS.forEach(function(x){
        var t = (x.z - zMin) / span;   /* 0 near, 1 far */
        var am = 1 - t * 0.65;          /* 1.0 → 0.35 */
        x.draw(am);
      });
      _PRIMS = null;
    }

    /* ── Object Mode emission: if requested and Object Mode is engaged,
       register the whole figure as a single addressable object with
       the running bbox. The stroke type is used so `renderObj` calls
       applyBrushStroke to redraw it — the outline is a compact set of
       joint-order points, sufficient for the user to grab, move, or
       rotate the figure as a unit. The canvas already shows the full
       parametric render underneath. ── */
    if(omMode && omMode !== 'off' && window._OM && window._OM.isOn() &&
       _BBOX.x0 < _BBOX.x1){
      var order2 = ['skull','shoulder_L','elbow_L','wrist_L','hip_L','knee_L','ankle_L',
                    'ankle_R','knee_R','hip_R','wrist_R','elbow_R','shoulder_R','skull'];
      var omPts = [];
      order2.forEach(function(k){
        var pt3 = Ppos[k]; if(!pt3) return;
        var qq = project(pt3[0], pt3[1], pt3[2]);
        omPts.push([qq.x, qq.y]);
      });
      var pad = 12;
      window._OM.add({
        type: 'stroke',
        pts:  omPts,
        brushType: 'round_hard',
        col:  pcol(p, 0.65, 0.90),
        sz:   Math.max(2, lw * 2),
        hd:   0.9,
        op:   0.9,
        fill: 'stroke',
        bbox: {
          x: _BBOX.x0 - pad,
          y: _BBOX.y0 - pad,
          w: (_BBOX.x1 - _BBOX.x0) + pad * 2,
          h: (_BBOX.y1 - _BBOX.y0) + pad * 2
        }
      });
    }

    setI('Anatomy ' + pose + ' / ' + view + ' / ' + style +
         (mode3d === 'on' ? ' · 3D' : '') +
         (omMode && omMode !== 'off' && window._OM && window._OM.isOn() ? ' · Object' : ''));
  }

  /* Expose on window for the engine registry. */
  window.anatomy = anatomy;
})();
