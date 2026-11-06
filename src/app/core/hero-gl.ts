/** Fondo de la portada: las fotos se disuelven como líquido y reaccionan al puntero. WebGL puro, sin dependencias. */
const VERT = `attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;v.y=1.-v.y;gl_Position=vec4(p,0.,1.);}`;
const FRAG = `precision highp float;varying vec2 v;
uniform sampler2D a,b;uniform float m,t;uniform vec2 r,sa,sb,c;uniform float f;
float n(vec2 x){return sin(x.x*3.1+t*.5)*sin(x.y*2.7-t*.4)+.5*sin(x.x*7.3-t*.3+x.y*5.1);}
vec2 cover(vec2 u,vec2 s){float rs=r.x/r.y,ri=s.x/s.y;vec2 k=rs>ri?vec2(1.,ri/rs):vec2(rs/ri,1.);return (u-.5)*k+.5;}
void main(){
  vec2 asp=vec2(r.x/r.y,1.);
  float d=distance(v*asp,c*asp);
  vec2 dir=(v-c)*smoothstep(.45,0.,d)*f*.14;
  float w=n(v*2.)*.5+.5;
  float e=smoothstep(0.,1.,m*1.6-w*.6);
  vec2 ua=cover(v-dir+(1.-w)*e*vec2(.09,.03),sa);
  vec2 ub=cover(v-dir-(w)*(1.-e)*vec2(.09,.03),sb);
  gl_FragColor=mix(texture2D(a,ua),texture2D(b,ub),e);
}`;

export function startHeroGl(canvas: HTMLCanvasElement, urls: string[], onSlide: (i: number) => void): () => void {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl || urls.length < 2) return () => undefined;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return () => undefined;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(gl.getAttribLocation(prog, 'p'));
  gl.vertexAttribPointer(gl.getAttribLocation(prog, 'p'), 2, gl.FLOAT, false, 0, 0);
  const u = (name: string) => gl.getUniformLocation(prog, name);

  type Tex = { tex: WebGLTexture; w: number; h: number };
  const load = (url: string) =>
    new Promise<Tex>((ok, ko) => {
      const img = new Image();
      img.onload = () => {
        const tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        for (const [k, val] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT], [gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT]]) gl.texParameteri(gl.TEXTURE_2D, k, val);
        ok({ tex, w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = ko;
      img.src = url;
    });

  let raf = 0, stopped = false, visible = true, cur = 0, phase = 0, last = 0, hold = 0;
  let mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5, force = 0, targetForce = 0;
  let texs: Tex[] = [];

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  const move = (e: PointerEvent) => {
    const b = canvas.getBoundingClientRect();
    tx = (e.clientX - b.left) / b.width;
    ty = (e.clientY - b.top) / b.height;
    targetForce = 1;
  };
  const leave = () => (targetForce = 0);
  const parent = canvas.parentElement!;
  parent.addEventListener('pointermove', move);
  parent.addEventListener('pointerleave', leave);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !stopped) { last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
  });
  io.observe(canvas);

  function frame(now: number) {
    if (stopped || !visible || !texs.length) return;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    mx += (tx - mx) * 0.08; my += (ty - my) * 0.08; force += (targetForce - force) * 0.05;
    if (hold > 0) hold -= dt;
    else {
      phase += dt / 1.3;
      if (phase >= 1) { phase = 0; cur = (cur + 1) % texs.length; hold = 3; onSlide(cur); }
    }
    const a = texs[cur], b = texs[(cur + 1) % texs.length];
    gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, a.tex); gl!.uniform1i(u('a'), 0);
    gl!.activeTexture(gl!.TEXTURE1); gl!.bindTexture(gl!.TEXTURE_2D, b.tex); gl!.uniform1i(u('b'), 1);
    gl!.uniform1f(u('m'), phase); gl!.uniform1f(u('t'), now / 1000); gl!.uniform1f(u('f'), force);
    gl!.uniform2f(u('r'), canvas.width, canvas.height);
    gl!.uniform2f(u('sa'), a.w, a.h); gl!.uniform2f(u('sb'), b.w, b.h); gl!.uniform2f(u('c'), mx, my);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(frame);
  }

  Promise.all(urls.map(load)).then((t) => {
    if (stopped) return;
    texs = t;
    hold = 3;
    resize();
    canvas.classList.add('ready');
    raf = requestAnimationFrame(frame);
  }).catch(() => undefined); // queda la foto fija de respaldo

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    parent.removeEventListener('pointermove', move);
    parent.removeEventListener('pointerleave', leave);
  };
}
