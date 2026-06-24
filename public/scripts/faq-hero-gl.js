// WebGL shader hero for /faqs/. Draws the hero video through a cursor-reactive
// ripple + chromatic-aberration shader. External (satisfies script-src 'self' CSP).
// Falls back to the plain <video> if WebGL is unavailable, the texture taints
// (CORS), or the user prefers reduced motion. Re-inits on astro:page-load.
(function () {
  var state = null; // { raf, cleanup }

  function teardown() {
    if (!state) return;
    if (state.raf) cancelAnimationFrame(state.raf);
    if (state.cleanup) state.cleanup();
    state = null;
  }

  function init() {
    teardown();

    var canvas = document.getElementById('faq-hero-canvas');
    var video = document.getElementById('faq-hero-video');
    if (!canvas || !video) return;
    var section = canvas.closest('section');
    if (!section) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return; // plain video stays

    var vsrc = 'attribute vec2 p; varying vec2 vUv; void main(){ vUv = p*0.5+0.5; gl_Position = vec4(p,0.0,1.0); }';
    var fsrc =
      'precision mediump float; varying vec2 vUv; uniform sampler2D uTex; uniform vec2 uMouse; uniform float uTime;' +
      'void main(){' +
      '  vec2 uv = vUv; vec2 tuv = vec2(uv.x, 1.0-uv.y);' +
      '  float d = distance(uv, uMouse);' +
      '  float wave = sin(d*34.0 - uTime*3.2) * 0.006 * smoothstep(0.45, 0.0, d);' +
      '  vec2 dir = normalize(uv - uMouse + 0.0001);' +
      '  vec2 off = dir * wave;' +
      '  float ca = 0.004 + abs(wave)*3.0;' +
      '  float r = texture2D(uTex, tuv + off + vec2(ca,0.0)).r;' +
      '  float g = texture2D(uTex, tuv + off).g;' +
      '  float b = texture2D(uTex, tuv + off - vec2(ca,0.0)).b;' +
      '  gl_FragColor = vec4(r,g,b,1.0);' +
      '}';

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return null;
      return sh;
    }
    var vs = compile(gl.VERTEX_SHADER, vsrc), fs = compile(gl.FRAGMENT_SHADER, fsrc);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    var uMouse = gl.getUniformLocation(prog, 'uMouse');
    var uTime = gl.getUniformLocation(prog, 'uTime');

    var mouse = [0.5, 0.55];
    var coarse = window.matchMedia('(pointer: coarse)').matches;

    function onMove(e) {
      var r = canvas.getBoundingClientRect();
      mouse = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
    }
    if (!coarse) section.addEventListener('mousemove', onMove);

    function resize() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    }
    window.addEventListener('resize', resize);

    var visible = true;
    var io = new IntersectionObserver(function (ents) { visible = ents[0].isIntersecting; }, { threshold: 0.01 });
    io.observe(section);

    var start = performance.now(), tainted = false, started = false;

    function frame(now) {
      state.raf = requestAnimationFrame(frame);
      if (!visible || video.readyState < 2) return;
      resize();
      var t = (now - start) / 1000;
      if (coarse) { mouse = [0.5 + Math.sin(t * 0.6) * 0.28, 0.55 + Math.cos(t * 0.45) * 0.18]; }
      gl.bindTexture(gl.TEXTURE_2D, tex);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      } catch (err) {
        tainted = true; teardown(); section.classList.remove('gl-on'); return; // CORS taint -> plain video
      }
      gl.uniform2f(uMouse, mouse[0], mouse[1]);
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!started) { started = true; section.classList.add('gl-on'); }
    }

    state = {
      raf: 0,
      cleanup: function () {
        if (!coarse) section.removeEventListener('mousemove', onMove);
        window.removeEventListener('resize', resize);
        io.disconnect();
      }
    };
    resize();
    state.raf = requestAnimationFrame(frame);
  }

  init();
  document.addEventListener('astro:page-load', init);
  document.addEventListener('astro:before-swap', teardown);
})();
