/* =====================================================================
   hero3d.js — ambient Three.js scene drawn behind the whole page.
   - A wireframe "network globe" with orbit rings and data pulses that
     stays anchored behind the hero avatar.
   - A particle field with real depth that drifts and parallaxes with
     scrolling and the mouse.
   If WebGL or the CDN is unavailable it quietly does nothing and the
   CSS background stays in place.
   ===================================================================== */
(function () {
  "use strict";

  var THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
  var canvas = document.getElementById("bg-canvas");
  if (!canvas) return;

  function webglAvailable() {
    try {
      var probe = document.createElement("canvas");
      var gl = probe.getContext("webgl2") || probe.getContext("webgl");
      if (!gl) return false;
      var lose = gl.getExtension("WEBGL_lose_context");
      if (lose) lose.loseContext();
      return true;
    } catch (e) {
      return false;
    }
  }

  function disable() {
    document.documentElement.classList.add("no-webgl");
  }

  if (!webglAvailable()) {
    disable();
    return;
  }

  import(THREE_URL).then(function (THREE) {
    try {
      start(THREE);
    } catch (e) {
      disable();
    }
  }, disable);

  function makeSprite(THREE) {
    var c = document.createElement("canvas");
    c.width = c.height = 64;
    var g = c.getContext("2d");
    var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.22, "rgba(255,255,255,0.9)");
    grd.addColorStop(0.55, "rgba(255,255,255,0.22)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  function start(THREE) {
    var root = document.documentElement;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var small = window.matchMedia("(max-width: 900px)").matches;

    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 10, 20);

    var CAM_Z = 14;
    var FLY_FROM = 34;
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    camera.position.set(0, 0, reduceMotion ? CAM_Z : FLY_FROM);
    var HALF_TAN = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

    var sprite = makeSprite(THREE);

    var PALETTES = {
      dark: {
        additive: true,
        fog: "#090b10",
        cool: "#a9bbe2", warm: "#ff8f33", fieldOpacity: 0.8,
        node: "#ff8a24", nodeOpacity: 0.95,
        edge: "#ff7b00", edgeOpacity: 0.22,
        arc: "#ffb35c", arcOpacity: 0.6,
        pulse: "#fff1de",
        ring: "#ff9d4d", ringOpacity: 0.3,
        sat: "#ffd6a8"
      },
      light: {
        additive: false,
        fog: "#eef1f7",
        cool: "#7a879d", warm: "#ff8a1f", fieldOpacity: 0.45,
        node: "#ff7b00", nodeOpacity: 0.9,
        edge: "#55657e", edgeOpacity: 0.22,
        arc: "#ff7b00", arcOpacity: 0.55,
        pulse: "#ff6a00",
        ring: "#7d8aa1", ringOpacity: 0.32,
        sat: "#ff7b00"
      }
    };

    /* ---------------- particle field ---------------- */
    var FIELD = small ? 600 : 1200;
    var baseY = new Float32Array(FIELD);
    var span = new Float32Array(FIELD);
    var drift = new Float32Array(FIELD);
    var warm = new Uint8Array(FIELD);
    var fieldPos = new Float32Array(FIELD * 3);
    var fieldCol = new Float32Array(FIELD * 3);

    var fieldGeo = new THREE.BufferGeometry();
    var fieldPosAttr = new THREE.BufferAttribute(fieldPos, 3);
    fieldPosAttr.setUsage(THREE.DynamicDrawUsage);
    fieldGeo.setAttribute("position", fieldPosAttr);
    var fieldColAttr = new THREE.BufferAttribute(fieldCol, 3);
    fieldGeo.setAttribute("color", fieldColAttr);

    var fieldMat = new THREE.PointsMaterial({
      size: 0.07,
      map: sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
      fog: false
    });
    var field = new THREE.Points(fieldGeo, fieldMat);
    field.frustumCulled = false; // positions are rewritten every frame
    scene.add(field);

    // Each particle gets a vertical wrap span sized to the view height at its
    // depth, so the field stays evenly filled at every depth while scrolling.
    function seedField(aspect) {
      for (var i = 0; i < FIELD; i++) {
        var z = -34 + Math.pow(Math.random(), 0.75) * 40; // -34 .. 6
        var hh = HALF_TAN * (CAM_Z - z);
        fieldPos[i * 3] = (Math.random() * 2 - 1) * hh * aspect * 1.25;
        fieldPos[i * 3 + 2] = z;
        span[i] = hh * 2.6;
        baseY[i] = (Math.random() * 2 - 1) * hh * 1.3;
        drift[i] = 0.05 + Math.random() * 0.18;
        warm[i] = Math.random() < 0.2 ? 1 : 0;
      }
    }

    function updateField(shift, time) {
      for (var i = 0; i < FIELD; i++) {
        var s = span[i];
        var y = baseY[i] + shift + time * drift[i] + s * 0.5;
        fieldPos[i * 3 + 1] = ((y % s) + s) % s - s * 0.5;
      }
      fieldPosAttr.needsUpdate = true;
    }

    var tmpCool = new THREE.Color();
    var tmpWarm = new THREE.Color();
    function paintField(p) {
      tmpCool.set(p.cool);
      tmpWarm.set(p.warm);
      for (var i = 0; i < FIELD; i++) {
        var c = warm[i] ? tmpWarm : tmpCool;
        fieldCol[i * 3] = c.r;
        fieldCol[i * 3 + 1] = c.g;
        fieldCol[i * 3 + 2] = c.b;
      }
      fieldColAttr.needsUpdate = true;
    }

    /* ---------------- network globe ---------------- */
    var GLOBE_SCALE = 1.34; // globe radius relative to the avatar radius
    var globe = new THREE.Group(); // anchored + scaled to the avatar
    var tilt = new THREE.Group();  // eases toward the pointer
    var spin = new THREE.Group();  // continuous rotation
    globe.add(tilt);
    tilt.add(spin);
    scene.add(globe);

    var N = small ? 180 : 280;
    var nodes = [];
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var ny = 1 - (i / (N - 1)) * 2;
      var nr = Math.sqrt(Math.max(0, 1 - ny * ny));
      var th = golden * i;
      nodes.push(new THREE.Vector3(Math.cos(th) * nr, ny, Math.sin(th) * nr));
    }

    var nodeMat = new THREE.PointsMaterial({ size: 0.11, map: sprite, transparent: true, depthWrite: false, sizeAttenuation: true });
    spin.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(nodes), nodeMat));

    // connect each node to its 3 nearest neighbours -> geodesic wireframe
    var edgeVerts = [];
    var seen = {};
    for (i = 0; i < N; i++) {
      var best = [];
      for (var j = 0; j < N; j++) {
        if (j === i) continue;
        var d = nodes[i].distanceToSquared(nodes[j]);
        if (best.length < 3 || d < best[best.length - 1][0]) {
          best.push([d, j]);
          best.sort(function (a, b) { return a[0] - b[0]; });
          if (best.length > 3) best.pop();
        }
      }
      for (var k = 0; k < best.length; k++) {
        var jj = best[k][1];
        var key = i < jj ? i + "_" + jj : jj + "_" + i;
        if (seen[key]) continue;
        seen[key] = true;
        edgeVerts.push(nodes[i], nodes[jj]);
      }
    }
    var edgeMat = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
    spin.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(edgeVerts), edgeMat));

    // data arcs lifted off the surface, with a pulse travelling along each
    var arcMat = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
    var arcs = [];
    var ARCS = small ? 5 : 8;
    for (i = 0; i < ARCS; i++) {
      var a = nodes[Math.floor(Math.random() * N)];
      var b = null;
      for (var tries = 0; tries < 60; tries++) {
        var cand = nodes[Math.floor(Math.random() * N)];
        var ang = a.angleTo(cand);
        if (ang > 0.8 && ang < 2.3) {
          b = cand;
          break;
        }
      }
      if (!b) continue;
      var lift = 1 + a.angleTo(b) * 0.32;
      var ctrl = a.clone().add(b).normalize().multiplyScalar(lift);
      var curve = new THREE.QuadraticBezierCurve3(a.clone(), ctrl, b.clone());
      spin.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(64)), arcMat));
      arcs.push({ curve: curve, t: Math.random(), speed: 0.16 + Math.random() * 0.18 });
    }

    var pulsePos = new Float32Array(Math.max(arcs.length, 1) * 3);
    var pulseGeo = new THREE.BufferGeometry();
    var pulseAttr = new THREE.BufferAttribute(pulsePos, 3);
    pulseAttr.setUsage(THREE.DynamicDrawUsage);
    pulseGeo.setAttribute("position", pulseAttr);
    pulseGeo.setDrawRange(0, arcs.length);
    var pulseMat = new THREE.PointsMaterial({ size: 0.26, map: sprite, transparent: true, depthWrite: false, sizeAttenuation: true });
    var pulses = new THREE.Points(pulseGeo, pulseMat);
    pulses.frustumCulled = false;
    spin.add(pulses);

    // tilted orbit rings with a satellite each
    var ringMat = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
    var satMat = new THREE.PointsMaterial({ size: 0.2, map: sprite, transparent: true, depthWrite: false, sizeAttenuation: true });
    var RING_DEFS = [
      { r: 1.18, rx: 1.16, rz: 0.4, speed: 0.55 },
      { r: 1.38, rx: 1.38, rz: -0.6, speed: -0.36 }
    ];
    var rings = RING_DEFS.map(function (def) {
      var pts = [];
      for (var s = 0; s < 160; s++) {
        var t = (s / 160) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(t) * def.r, Math.sin(t) * def.r, 0));
      }
      var outer = new THREE.Group(); // rotation around the view axis
      var inner = new THREE.Group(); // tilt of the ring plane
      outer.rotation.z = def.rz;
      inner.rotation.x = def.rx;
      outer.add(inner);
      inner.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), ringMat));
      var sat = new THREE.Points(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3()]), satMat);
      inner.add(sat);
      tilt.add(outer);
      return { def: def, outer: outer, sat: sat, angle: Math.random() * Math.PI * 2 };
    });

    var allMaterials = [fieldMat, nodeMat, edgeMat, arcMat, pulseMat, ringMat, satMat];

    /* ---------------- theme ---------------- */
    function themeName() {
      return document.body.classList.contains("dark-theme") ? "dark" : "light";
    }

    function applyTheme() {
      var p = PALETTES[themeName()];
      var blending = p.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
      for (var m = 0; m < allMaterials.length; m++) allMaterials[m].blending = blending;
      fieldMat.opacity = p.fieldOpacity;
      nodeMat.color.set(p.node);
      nodeMat.opacity = p.nodeOpacity;
      edgeMat.color.set(p.edge);
      edgeMat.opacity = p.edgeOpacity;
      arcMat.color.set(p.arc);
      arcMat.opacity = p.arcOpacity;
      pulseMat.color.set(p.pulse);
      ringMat.color.set(p.ring);
      ringMat.opacity = p.ringOpacity;
      satMat.color.set(p.sat);
      scene.fog.color.set(p.fog);
      paintField(p);
    }

    /* ---------------- layout: canvas size + avatar anchor ---------------- */
    var W = 0;
    var H = 0;
    function resize() {
      var w = canvas.clientWidth || window.innerWidth;
      var h = canvas.clientHeight || window.innerHeight;
      if (w === W && h === H) return;
      var widthChanged = w !== W;
      W = w;
      H = h;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      if (widthChanged) {
        seedField(camera.aspect);
        paintField(PALETTES[themeName()]);
      }
    }

    var anchorEl = document.querySelector(".featured-image .image");
    var anchor = { x: 0, y: 0, d: 0, valid: false };
    // offset* values ignore CSS transforms, so the float/tilt animations on
    // the avatar don't make the globe jitter.
    function measureAnchor() {
      if (!anchorEl) return;
      var x = 0;
      var y = 0;
      var el = anchorEl;
      while (el) {
        x += el.offsetLeft;
        y += el.offsetTop;
        el = el.offsetParent;
      }
      anchor.d = anchorEl.offsetWidth;
      anchor.x = x + anchor.d / 2;
      anchor.y = y + anchorEl.offsetHeight / 2;
      anchor.valid = anchor.d > 0;
    }

    function placeGlobe() {
      if (!anchor.valid || !H) {
        globe.visible = false;
        return;
      }
      var sx = anchor.x - window.scrollX;
      var sy = anchor.y - window.scrollY;
      var reachPx = anchor.d * 0.5 * GLOBE_SCALE * 1.5;
      globe.visible = sy + reachPx > 0 && sy - reachPx < H;
      if (!globe.visible) return;

      var hh = HALF_TAN * camera.position.z;
      var hw = hh * camera.aspect;
      globe.position.set((sx / W * 2 - 1) * hw, -(sy / H * 2 - 1) * hh, 0);

      // radius is sized for the resting camera distance, so the globe
      // "grows" into place during the fly-in
      var unitsPerPx = (2 * HALF_TAN * CAM_Z) / H;
      var R = anchor.d * 0.5 * GLOBE_SCALE * unitsPerPx;
      globe.scale.setScalar(R);
      scene.fog.near = CAM_Z - R * 0.2;
      scene.fog.far = CAM_Z + R * 1.9;
    }

    /* ---------------- input ---------------- */
    var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    if (!reduceMotion) {
      window.addEventListener("pointermove", function (e) {
        pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
      }, { passive: true });
    }

    /* ---------------- loop ---------------- */
    var clock = new THREE.Clock();
    var elapsed = 0;
    var flyT = reduceMotion ? 1 : 0;
    var started = false;
    var rafId = 0;
    var tmp = new THREE.Vector3();

    function schedule() {
      if (started && !rafId) rafId = requestAnimationFrame(frame);
    }

    function frame() {
      rafId = 0;
      var dt = Math.min(clock.getDelta(), 0.05);
      if (!reduceMotion) elapsed += dt;

      if (flyT < 1) {
        flyT = Math.min(1, flyT + dt / 2.4);
        var e = 1 - Math.pow(1 - flyT, 3);
        camera.position.z = FLY_FROM + (CAM_Z - FLY_FROM) * e;
      }

      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;

      // particles: scroll parallax (slower than the page) + slow upward drift
      var unitsPerPx = H ? (2 * HALF_TAN * CAM_Z) / H : 0;
      updateField(window.scrollY * unitsPerPx * 0.35, elapsed);
      field.position.x = -pointer.x * 0.9;
      field.position.y = pointer.y * 0.6;

      // globe
      placeGlobe();
      if (globe.visible) {
        tilt.rotation.x = 0.28 + pointer.y * 0.22;
        tilt.rotation.y = pointer.x * 0.35;
        spin.rotation.y = elapsed * 0.13;

        for (var a = 0; a < arcs.length; a++) {
          var arc = arcs[a];
          arc.t = (arc.t + dt * arc.speed) % 1;
          arc.curve.getPoint(arc.t, tmp);
          pulsePos[a * 3] = tmp.x;
          pulsePos[a * 3 + 1] = tmp.y;
          pulsePos[a * 3 + 2] = tmp.z;
        }
        pulseAttr.needsUpdate = true;

        for (var r = 0; r < rings.length; r++) {
          var ring = rings[r];
          ring.angle += dt * ring.def.speed;
          ring.sat.position.set(Math.cos(ring.angle) * ring.def.r, Math.sin(ring.angle) * ring.def.r, 0);
          ring.outer.rotation.z = ring.def.rz + elapsed * 0.04 * (r ? -1 : 1);
        }
      }

      renderer.render(scene, camera);

      if (!reduceMotion) schedule();
    }

    function begin() {
      if (started) return;
      started = true;
      clock.getDelta(); // drop the time spent behind the loader
      schedule();
      requestAnimationFrame(function () {
        canvas.classList.add("is-ready");
      });
    }

    /* ---------------- wiring ---------------- */
    resize();
    measureAnchor();
    applyTheme();

    window.addEventListener("resize", function () {
      resize();
      measureAnchor();
      schedule();
    });

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        measureAnchor();
        schedule();
      });
      var hero = document.querySelector(".featured-box");
      if (hero) ro.observe(hero);
      if (anchorEl) ro.observe(anchorEl);
    }
    window.addEventListener("load", measureAnchor);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureAnchor);

    document.addEventListener("themechange", function () {
      applyTheme();
      schedule();
    });

    // with reduced motion nothing animates on its own, so redraw on scroll
    if (reduceMotion) {
      window.addEventListener("scroll", schedule, { passive: true });
    }

    if (root.classList.contains("site-ready")) {
      begin();
    } else {
      document.addEventListener("site:ready", begin, { once: true });
    }
  }
})();
