'use strict';
/* Nascente — capa: o Mestre, o cultivador mais antigo, medita a flutuar sobre a nascente.
   Três toques despertam-no: abre os olhos, ergue os dedos em espada, a água da nascente sobe em espiral à volta dele,
   rebenta em gotas de luz e ele diz-te uma palavra. A capa volta quando a app fica parada. */
let capaAberta = false, toquesCapa = 0, escondidoEm = 0, tInativo = null, audioCapa = null, tCapa = [];
const CQ = {cv: null, c: null, w: 0, h: 0, ps: [], gotas: [], chuva: [], alvo: {x: 0, y: 0}, orb: {x: 0, y: 0, rx: 0, ry: 0}, topo: {x: 0, y: 0}, esc: 1,
  acc: 0, ult: 0, raf: 0, taxa: 9, vel: .32, spr: null, sprG: null};

// Palavras do Mestre: sobre a água, a constância e o cuidado.
const DITOS = [
  'A água não luta, e por isso nada lhe resiste.',
  'A gota vence a pedra pela constância, não pela força.',
  'A água turva clareia quando a deixas repousar.',
  'Um rio nasce de uma nascente pequena. Cuida do pouco de cada dia.',
  'O sábio é como a água: serve tudo e não disputa nada.',
  'Não se força uma flor a abrir. Rega-se.',
  'O lago mostra à superfície o que se passa no fundo.',
  'Quem respira devagar ouve o que o corpo diz.',
  'A nascente não corre para ser vista. Corre porque é nascente.',
  'Nove camadas de jade começam num punhado de terra.'
];

/* ---------- O desenho ---------- */
function espiralMestre(fase = 0, R0 = 128, R1 = 58){
  const voltas = 2.75, n = 240, tras = [], frente = [];
  let lado = null, cur = null;
  for (let i = 0; i <= n; i++){
    const t = i / n, th = fase + t * voltas * Math.PI * 2, R = R0 - (R0 - R1) * t;
    const x = 150 + R * Math.sin(th), y = 398 - t * 392 + R * .16 * Math.cos(th);
    const f = Math.cos(th) >= 0;
    if (f !== lado){ cur = [`M${x.toFixed(1)} ${y.toFixed(1)}`]; (f ? frente : tras).push(cur); lado = f; }
    else cur.push(`L${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return {tras: tras.map(s => s.join('')).join(''), frente: frente.map(s => s.join('')).join('')};
}
function svgMestre(){
  const e1 = espiralMestre(0), e2 = espiralMestre(Math.PI, 118, 50);
  const fio = (d, cls) => `<path class="m-agua ${cls}" d="${d}" pathLength="1"/>`;
  const espiral = lado => `<g class="m-espiral" filter="url(#mfBrilho)">${fio(e1[lado], 'grossa')}${fio(e2[lado], 'fina')}</g>`;
  const brilhoOlho = x => `<g class="m-olho-a"><path d="M${x - 5.5} 92 Q${x} 88 ${x + 5.5} 92 Q${x} 95.2 ${x - 5.5} 92Z" fill="#f4f0e4"/><circle cx="${x}" cy="92" r="2.3" fill="#6ff0c8" filter="url(#mfBrilho)"/><circle cx="${x + .7}" cy="91.3" r=".6" fill="#fff"/><path d="M${x - 6} 91.6 Q${x} 87.4 ${x + 6} 91.6" stroke="#4a3a2e" stroke-width="1.1" fill="none" stroke-linecap="round"/></g>`;
  return `<svg class="mestre" viewBox="0 0 300 360" aria-hidden="true">
  <defs>
    <linearGradient id="mgVeste" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3f8f5"/><stop offset=".55" stop-color="#d6e3dd"/><stop offset="1" stop-color="#a9bfb5"/></linearGradient>
    <linearGradient id="mgPernas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfddd6"/><stop offset="1" stop-color="#8fa79c"/></linearGradient>
    <linearGradient id="mgManga" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef5f1"/><stop offset="1" stop-color="#a4bbb0"/></linearGradient>
    <linearGradient id="mgBarba" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdfdfb"/><stop offset=".7" stop-color="#e6ece8"/><stop offset="1" stop-color="#c7d3cd" stop-opacity=".6"/></linearGradient>
    <radialGradient id="mgPele" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#ecd8bd"/><stop offset="1" stop-color="#c9ab8a"/></radialGradient>
    <radialGradient id="mgDisco" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#bff5e2" stop-opacity=".55"/><stop offset=".6" stop-color="#7fd1b4" stop-opacity=".14"/><stop offset="1" stop-color="#7fd1b4" stop-opacity="0"/></radialGradient>
    <linearGradient id="mgAgua" gradientUnits="userSpaceOnUse" x1="0" y1="400" x2="0" y2="0"><stop offset="0" stop-color="#3fa7b8"/><stop offset=".5" stop-color="#9fe8f0"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
    <filter id="mfBrilho" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <g class="m-tras">${espiral('tras')}</g>
  <ellipse class="m-disco" cx="150" cy="330" rx="118" ry="15" fill="url(#mgDisco)"/>
  <ellipse class="m-disco-anel" cx="150" cy="330" rx="96" ry="10" fill="none" stroke="#bff5e2" stroke-opacity=".35"/>
  <g class="m-flutua">
    <g class="m-corpo">
      <!-- cabelo comprido atrás dos ombros -->
      <path d="M126 96 C120 114 116 132 113 150 L119 150 C122 132 126 116 131 103Z M174 96 C180 114 184 132 187 150 L181 150 C178 132 174 116 169 103Z" fill="#dfe6e2"/>
      <!-- pernas cruzadas sob a veste -->
      <path d="M70 262 C48 268 34 284 38 298 C42 312 80 318 150 318 C220 318 258 312 262 298 C266 284 252 268 230 262Z" fill="url(#mgPernas)"/>
      <path d="M58 292 C80 304 116 308 150 307 C184 308 220 304 242 292 M150 307 C147 296 146 286 150 276" stroke="#7b958a" stroke-width="1" fill="none" opacity=".55"/>
      <path d="M42 302 C70 316 110 318 150 318 C190 318 230 316 258 302" stroke="#d6b56e" stroke-width="2" fill="none" opacity=".75"/>
      <g class="m-tronco">
        <path d="M108 138 C96 142 90 156 90 176 L86 262 L214 262 L210 176 C210 156 204 142 192 138 C180 134 166 130 150 130 C134 130 120 134 108 138Z" fill="url(#mgVeste)"/>
        <path d="M136 129 L150 172 L164 129Z" fill="#fbfdfc"/>
        <path d="M134 129 L151 168" stroke="#2f6b5c" stroke-width="8" stroke-linecap="round"/>
        <path d="M166 129 L112 238" stroke="#2f6b5c" stroke-width="9" stroke-linecap="round"/>
        <path d="M169 131 L115 240 M131 131 L148 170" stroke="#d6b56e" stroke-width="1.3" fill="none" opacity=".85"/>
        <path d="M90 222 C120 228 180 228 210 222 L211 237 C180 243 120 243 89 237Z" fill="#24584b"/>
        <path d="M90 225 C120 231 180 231 210 225 M89 234 C120 240 180 240 211 234" stroke="#d6b56e" stroke-width=".9" fill="none" opacity=".8"/>
        <circle class="m-dantian" cx="150" cy="232" r="3" fill="#bff5e2" opacity=".0"/>
        <path d="M184 240 L184 256" stroke="#d6b56e" stroke-width="1"/><circle cx="184" cy="261" r="5.5" fill="#7fd1b4" stroke="#2c7360"/><circle cx="184" cy="261" r="1.8" fill="#24584b"/>
        <path d="M181 266 L180 282 M184 266 L184 284 M187 266 L188 282" stroke="#c9a65a" stroke-width="1" opacity=".9"/>
      </g>
      <!-- mangas largas -->
      <path class="m-manga-e" d="M108 140 C90 148 80 172 78 204 C76 232 64 252 54 270 C74 282 104 282 124 270 C130 266 135 260 138 254 C124 250 110 240 104 226 C100 204 104 176 114 152Z" fill="url(#mgManga)"/>
      <path d="M114 152 C104 176 100 204 104 226 C110 240 124 250 138 254" stroke="#93ab9f" stroke-width="1.2" fill="none" opacity=".7"/>
      <path d="M54 270 C74 282 104 282 124 270" stroke="#d6b56e" stroke-width="2.2" fill="none" opacity=".85"/>
      <path d="M92 170 C88 200 84 226 72 258 M104 196 C100 220 96 240 90 264" stroke="#8fa79c" stroke-width="1" fill="none" opacity=".5"/>
      <g class="m-manga-d">
        <path d="M192 140 C210 148 220 172 222 204 C224 232 236 252 246 270 C226 282 196 282 176 270 C170 266 165 260 162 254 C176 250 190 240 196 226 C200 204 196 176 186 152Z" fill="url(#mgManga)"/>
        <path d="M186 152 C196 176 200 204 196 226 C190 240 176 250 162 254" stroke="#93ab9f" stroke-width="1.2" fill="none" opacity=".7"/>
        <path d="M246 270 C226 282 196 282 176 270" stroke="#d6b56e" stroke-width="2.2" fill="none" opacity=".85"/>
        <path d="M208 170 C212 200 216 226 228 258 M196 196 C200 220 204 240 210 264" stroke="#8fa79c" stroke-width="1" fill="none" opacity=".5"/>
      </g>
      <!-- mãos no colo, polegares a tocar -->
      <g class="m-maos">
        <path d="M133 257 C134 251 142 249 150 249 C158 249 166 251 167 257 C166 263 158 265 150 265 C142 265 134 263 133 257Z" fill="url(#mgPele)"/>
        <path class="m-mao-d" d="M136 253 C138 248 145 246 151 246 C157 246 163 248 165 253 C162 257 157 258 151 258 C145 258 139 257 136 253Z" fill="#e4cdb0"/>
        <path class="m-mao-d" d="M139 251 C141 243 159 243 161 251" stroke="#dcc3a3" stroke-width="3.4" fill="none" stroke-linecap="round"/>
        <path class="m-mao-d" d="M143 255 L157 255 M144 252.5 L156 252.5" stroke="#b3906f" stroke-width=".6" opacity=".6"/>
      </g>
      <!-- pescoço, cabeça e cabelo -->
      <path d="M141 112 L141 133 L159 133 L159 112Z" fill="#c9ab8a"/>
      <ellipse cx="126" cy="95" rx="4.2" ry="8" fill="#d2b493"/><ellipse cx="174" cy="95" rx="4.2" ry="8" fill="#d2b493"/>
      <path d="M126 88 C126 66 136 60 150 60 C164 60 174 66 174 88 C174 104 168 116 160 121 C155 124 145 124 140 121 C132 116 126 104 126 88Z" fill="url(#mgPele)"/>
      <path d="M138 74 Q150 71 162 74 M141 79 Q150 77 159 79" stroke="#a88a6a" stroke-width=".8" fill="none" opacity=".5"/>
      <path d="M123 92 C119 70 131 53 150 52 C169 53 181 70 177 92 C175 80 171 70 163 66 C157 63.5 143 63.5 137 66 C129 70 125 80 123 92Z" fill="#eef2ee"/>
      <path d="M128 78 C131 68 138 62 146 60 M172 78 C169 68 162 62 154 60" stroke="#c8d1cc" stroke-width=".8" fill="none"/>
      <ellipse cx="150" cy="48" rx="11.5" ry="9.5" fill="#f2f5f1"/>
      <path d="M140 52 Q150 57 160 52" stroke="#24584b" stroke-width="3" fill="none"/>
      <path d="M128 47 L174 42" stroke="#c9a65a" stroke-width="2.2" stroke-linecap="round"/><circle cx="174.5" cy="42" r="2.6" fill="#7fd1b4"/>
      <!-- rosto: olhos fechados, nariz, boca sem bigode -->
      <g class="m-olhos-f"><path d="M136 92 Q141 95.5 146 92 M154 92 Q159 95.5 164 92" stroke="#5b4636" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <path d="M137 96.5 Q141 98 145 96.8 M155 96.8 Q159 98 163 96.5" stroke="#a88a6a" stroke-width=".6" fill="none" opacity=".6"/></g>
      <g class="m-olhos-a">${brilhoOlho(141)}${brilhoOlho(159)}</g>
      <path d="M150 90 C149 98 147 104 149 107 C151 108.5 153 108 155 106" stroke="#9c7d60" stroke-width="1" fill="none"/>
      <path d="M134 103 C135 109 138 113 141 115 M166 103 C165 109 162 113 159 115" stroke="#a88a6a" stroke-width=".7" fill="none" opacity=".45"/>
      <path d="M145 115.6 Q150 117.2 155 115.6" stroke="#8a6a55" stroke-width="1.1" fill="none" stroke-linecap="round"/>
      <!-- sobrancelhas compridas a cair -->
      <path class="m-sobr-e" d="M147 85 C141 80.5 133 80.5 128.5 84.5 C124 89 121 100 117 124 C119.5 108 123 95 129 88 C134 84.6 140 84.6 147 86.4Z" fill="#f5f7f4"/>
      <path class="m-sobr-d" d="M153 85 C159 80.5 167 80.5 171.5 84.5 C176 89 179 100 183 124 C180.5 108 177 95 171 88 C166 84.6 160 84.6 153 86.4Z" fill="#f5f7f4"/>
      <!-- a barba, só no queixo, comprida -->
      <g class="m-barba">
        <path d="M138 117 C137 129 140 143 142 159 C144 180 147 202 152 226 C157 202 160 180 160 159 C160 143 163 129 162 117 C157 121.5 143 121.5 138 117Z" fill="url(#mgBarba)"/>
        <path d="M145 122 C145 150 148 182 151 218 M155 122 C156 152 154 182 152.5 214 M150 121 C150 160 151 192 152 224 M141 124 C142 140 144 156 146 170 M159 124 C158 140 157 156 156 170" stroke="#b9c4be" stroke-width=".7" fill="none" opacity=".75"/>
      </g>
      <!-- ao despertar: a mão direita ergue-se em dedos de espada -->
      <g class="m-gesto"><g transform="translate(-50 -48) scale(1.28)">
        <path d="M206 208 C202 196 196 186 190 178 L178 186 C183 194 189 204 194 214Z" fill="url(#mgManga)"/>
        <path d="M178 186 L190 178" stroke="#d6b56e" stroke-width="2"/>
        <path d="M178 184 C176 176 178 170 184 168 C189 167 192 171 192 176 L190 182Z" fill="url(#mgPele)"/>
        <rect x="180.5" y="146" width="4.4" height="25" rx="2.2" fill="#e4cdb0"/><rect x="185.2" y="148" width="4.4" height="23" rx="2.2" fill="#dcc3a3"/>
        <path d="M178 176 C181 172 186 173 189 176" stroke="#c9ab8a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        </g><circle class="m-ponta" cx="187" cy="137" r="4" fill="#dffff4" filter="url(#mfBrilho)"/>
      </g>
    </g>
  </g>
  <g class="m-frente">${espiral('frente')}</g>
  <circle class="m-cimo" cx="150" cy="8" r="2" fill="none"/>
</svg>`;
}

/* ---------- Montar a capa ---------- */
function horaCapa(){ const h = new Date().getHours(); return h < 5 || h >= 20 ? 'noite' : h < 12 ? 'manha' : 'tarde'; }
function estadoCapa(){
  const a = agoraRitual(), r = registos[diaChave(a.data)] || {}, sh = shenHoje();
  return `<span class="${r.mF ? 'feito' : ''}">Manhã ${r.mF ? 'feita' : 'por fazer'}</span><i>·</i><span class="${r.nF ? 'feito' : ''}">Noite ${r.nF ? 'feita' : 'por fazer'}</span><i>·</i><span>Shen ${sh.total}/10</span>`;
}
function renderCapa(){
  const hc = horaCapa();
  $('#capa').className = 'h-' + hc;
  $('#capa').innerHTML = `<div class="capa-ceu"></div><div class="capa-estrelas"></div>
    <svg class="capa-montes" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path d="M0 150 L40 112 L70 126 L112 66 L142 96 L176 40 L206 84 L240 52 L280 108 L322 60 L362 116 L400 92 V300 H0Z" fill="#14302a" opacity=".7"/>
      <path class="cascata" d="M174 50 C175 100 172 160 174 236" stroke="#cfeee6" stroke-opacity=".28" stroke-width="2.4" fill="none"/>
      <path d="M0 214 L36 182 L64 198 L100 150 L128 172 L156 136 L182 160 L210 146 L246 196 L282 170 L318 210 L356 174 L400 196 V300 H0Z" fill="#0d221d"/>
      <path d="M0 268 C70 250 130 272 190 262 C250 252 320 274 400 258 V300 H0Z" fill="#081612"/>
    </svg>
    <div class="capa-nevoa n1"></div><div class="capa-nevoa n2"></div>
    <div class="capa-lago"><div class="capa-reflexo"></div><div class="capa-ondas"><i></i><i></i><i></i></div></div>
    <div class="capa-figura" id="capaFig"><div class="capa-astro"></div><div class="capa-aura"></div>${svgMestre()}</div>
    <canvas id="capaQi" aria-hidden="true"></canvas>
    <div class="capa-topo"><div class="capa-marca">NASCENTE</div>
      <div class="capa-fala" id="capaFala"><p class="capa-sub">O Mestre medita sobre a nascente</p></div></div>
    <div class="capa-base">
      <p class="capa-estado">${estadoCapa()}</p>
      <p class="capa-dica">Toca três vezes para despertar o Mestre</p><div class="capa-pontos"><i></i><i></i><i></i></div>
    </div>`;
  CQ.cv = $('#capaQi'); CQ.c = CQ.cv.getContext('2d'); CQ.ps = []; CQ.chuva = []; CQ.taxa = 9; CQ.vel = .32;
  CQ.spr = CQ.spr || spriteCapa('191,245,226'); CQ.sprG = CQ.sprG || spriteCapa('200,240,250', true);
  CQ.gotas = Array.from({length: 7}, (_, i) => ({a: i / 7 * Math.PI * 2, y: Math.random() * 6, f: .6 + Math.random() * .8}));
}
function spriteCapa(cor, gota){
  const s = document.createElement('canvas'); s.width = s.height = 32; const c = s.getContext('2d'), g = c.createRadialGradient(gota ? 13 : 16, gota ? 13 : 16, 0, 16, 16, 16);
  if (gota){ g.addColorStop(0, '#fff'); g.addColorStop(.25, `rgba(${cor},.95)`); g.addColorStop(.55, `rgba(${cor},.35)`); g.addColorStop(1, `rgba(${cor},0)`); }
  else { g.addColorStop(0, `rgba(${cor},1)`); g.addColorStop(.3, `rgba(${cor},.5)`); g.addColorStop(1, `rgba(${cor},0)`); }
  c.fillStyle = g; c.fillRect(0, 0, 32, 32); return s;
}
// Coordenadas do desenho (viewBox 300×360) → ecrã.
function pontoMestre(x, y){
  const sv = document.querySelector('#capa .mestre'); if (!sv) return {x: 0, y: 0};
  const b = sv.getBoundingClientRect(), k = b.width / 300; return {x: b.left + x * k, y: b.top + y * k, k};
}
function capaGeo(){
  const cv = CQ.cv, dpr = Math.min(1.5, devicePixelRatio || 1); if (!cv) return;
  CQ.w = innerWidth; CQ.h = innerHeight; cv.width = CQ.w * dpr; cv.height = CQ.h * dpr; CQ.c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const d = pontoMestre(150, 232), o = pontoMestre(150, 196), t = pontoMestre(150, 8);
  CQ.alvo = d; CQ.topo = t; CQ.esc = o.k || 1; CQ.orb = {x: o.x, y: o.y, rx: 150 * (o.k || 1), ry: 26 * (o.k || 1)};
}

/* ---------- Animação do qi e das gotas ---------- */
function novaMote(perto){
  const ang = Math.random() * Math.PI * 2, R = (perto ? 50 : 120) + Math.random() * Math.max(CQ.w, CQ.h) * (perto ? .18 : .5);
  return {a: ang, R, rot: (Math.random() < .5 ? -1 : 1) * (.5 + Math.random() * .7), v: .35 + Math.random() * .5, s: 4 + Math.random() * 6, vida: 0, x: 0, y: 0};
}
function passoCapa(t){
  if (!capaAberta) return;
  CQ.raf = requestAnimationFrame(passoCapa);
  const dt = Math.min(.05, (t - (CQ.ult || t)) / 1000); CQ.ult = t;
  const c = CQ.c; c.clearRect(0, 0, CQ.w, CQ.h); c.globalCompositeOperation = 'lighter';
  // qi: motas que vêm de longe e entram no dantian do Mestre
  CQ.acc += dt * CQ.taxa;
  while (CQ.acc > 1 && CQ.ps.length < 220){ CQ.acc--; CQ.ps.push(novaMote()); }
  for (const p of CQ.ps){
    p.vida += dt; p.R -= p.v * (36 + 130 / Math.max(.4, p.R / 100)) * dt; p.a += p.rot * dt * (1.1 + 80 / Math.max(20, p.R));
    p.x = CQ.alvo.x + Math.cos(p.a) * p.R; p.y = CQ.alvo.y + Math.sin(p.a) * p.R * .75;
    c.globalAlpha = Math.max(0, Math.min(1, p.vida * 1.4) * Math.min(1, p.R / 30) * .8);
    const s = p.s * (.6 + Math.min(1, p.R / 160) * .6); c.drawImage(CQ.spr, p.x - s / 2, p.y - s / 2, s, s);
  }
  CQ.ps = CQ.ps.filter(p => p.R > 6);
  // gotas de água em órbita à volta dele (atrás ficam mais pequenas e apagadas)
  const O = CQ.orb;
  for (const g of CQ.gotas){
    g.a += dt * CQ.vel * g.f * (toquesCapa >= 3 ? 4 : 1); g.y += dt;
    const fr = Math.sin(g.a), x = O.x + Math.cos(g.a) * O.rx, y = O.y + fr * O.ry + Math.sin(g.y * 1.3) * 6 * CQ.esc;
    const s = (7 + fr * 3) * CQ.esc; c.globalAlpha = toquesCapa >= 3 ? Math.max(0, .9 - (CQ.fim || 0)) : .45 + fr * .35;
    c.drawImage(CQ.sprG, x - s / 2, y - s / 2, s, s);
  }
  if (toquesCapa >= 3) CQ.fim = (CQ.fim || 0) + dt * .8;
  // a chuva de luz quando a espiral rebenta
  for (const p of CQ.chuva){
    p.vida += dt; p.vy += 260 * dt * CQ.esc; p.x += p.vx * dt; p.y += p.vy * dt;
    c.globalAlpha = Math.max(0, 1 - p.vida / p.dur); const s = p.s; c.drawImage(p.g ? CQ.sprG : CQ.spr, p.x - s / 2, p.y - s / 2, s, s);
  }
  CQ.chuva = CQ.chuva.filter(p => p.vida < p.dur);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
function rajadaCapa(n){ for (let i = 0; i < n; i++) CQ.ps.push(Object.assign(novaMote(true), {v: 1.1 + Math.random(), s: 6 + Math.random() * 8})); }
function chuvaCapa(){
  const T = CQ.topo, k = CQ.esc;
  for (let i = 0; i < 150; i++){
    const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.5, v = (90 + Math.random() * 260) * k;
    CQ.chuva.push({x: T.x, y: T.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 0, dur: 1.2 + Math.random() * 1.1, s: (4 + Math.random() * 9) * k, g: Math.random() < .6});
  }
}

/* ---------- Som: gotas e sino ---------- */
function ctxCapa(){ audioCapa = audioCapa || new (window.AudioContext || window.webkitAudioContext)(); if (audioCapa.state === 'suspended') audioCapa.resume(); return audioCapa; }
function somGota(f, quando = 0, vol = .22){
  if (cfg.capaSom === false) return;
  try {
    const A = ctxCapa(), t = A.currentTime + quando, o = A.createOscillator(), g = A.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 2.3, t + .07);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .006); g.gain.exponentialRampToValueAtTime(.0005, t + .28);
    o.connect(g); g.connect(A.destination); o.start(t); o.stop(t + .32);
  } catch(e){}
}
function somDespertar(){
  if (cfg.capaSom === false) return;
  try {
    const A = ctxCapa(), t = A.currentTime, saida = A.createGain(); saida.gain.value = .3; saida.connect(A.destination);
    // a água a subir: ruído filtrado que sobe de tom
    const len = A.sampleRate * 1.4, buf = A.createBuffer(1, len, A.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const ru = A.createBufferSource(), fl = A.createBiquadFilter(), gr = A.createGain(); ru.buffer = buf; fl.type = 'bandpass'; fl.Q.value = 1.4;
    fl.frequency.setValueAtTime(260, t + .2); fl.frequency.exponentialRampToValueAtTime(2600, t + 1.25);
    gr.gain.setValueAtTime(0, t + .2); gr.gain.linearRampToValueAtTime(.5, t + 1); gr.gain.exponentialRampToValueAtTime(.001, t + 1.55);
    ru.connect(fl); fl.connect(gr); gr.connect(saida); ru.start(t + .2); ru.stop(t + 1.6);
    // o sino quando a água rebenta
    [[1, .7, 4.5], [2.01, .3, 2.2], [2.76, .18, 1.4], [5.4, .08, .7]].forEach(([m, a, dur]) => {
      const o = A.createOscillator(), g = A.createGain(), t0 = t + 1.15; o.type = 'sine'; o.frequency.value = 174.6 * m;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(a, t0 + .01); g.gain.exponentialRampToValueAtTime(.0004, t0 + dur);
      o.connect(g); g.connect(saida); o.start(t0); o.stop(t0 + dur + .1);
    });
    for (let i = 0; i < 7; i++) somGota(1100 + Math.random() * 1500, 1.25 + i * .09 + Math.random() * .05, .08);
  } catch(e){}
}

/* ---------- Mostrar, tocar, despertar, fechar ---------- */
function mostrarCapa(forcar, logo){
  if (!cfg.pronto || (!forcar && cfg.capa === false) || capaAberta || !$('#sessao').hidden) return;
  toquesCapa = 0; capaAberta = true; CQ.fim = 0; tCapa.forEach(clearTimeout); tCapa = [];
  const el = $('#capa'); el.hidden = false; renderCapa(); if (logo) el.classList.add('logo');
  requestAnimationFrame(() => { capaGeo(); for (let i = 0; i < 40; i++) CQ.ps.push(novaMote()); CQ.ult = 0; cancelAnimationFrame(CQ.raf); CQ.raf = requestAnimationFrame(passoCapa); });
  setTimeout(() => { try { el.focus({preventScroll: true}); } catch(e){} }, 50);
}
function toqueCapa(){
  if (!capaAberta) return;
  if (toquesCapa >= 3) return fecharCapa(); // um toque a mais salta o resto
  toquesCapa++; vibrar(toquesCapa >= 3 ? [25, 40, 40] : 16);
  const el = $('#capa'); el.classList.add('t' + toquesCapa);
  document.querySelectorAll('#capa .capa-pontos i').forEach((p, i) => p.classList.toggle('on', i < toquesCapa));
  const onda = document.createElement('span'); onda.className = 'capa-onda';
  const ref = $('#capa .capa-lago').getBoundingClientRect(); onda.style.left = CQ.orb.x + 'px'; onda.style.top = (ref.top + 18) + 'px';
  el.appendChild(onda); setTimeout(() => onda.remove(), 1300);
  if (toquesCapa < 3){ somGota(toquesCapa === 1 ? 880 : 1180); rajadaCapa(14 + toquesCapa * 12); CQ.taxa += 10; CQ.vel += .5; return; }
  despertarCapa();
}
function despertarCapa(){
  const el = $('#capa'); el.classList.add('desperto'); somDespertar(); rajadaCapa(30);
  $('#capa .capa-dica').textContent = 'O Mestre desperta';
  const h = horaCapa(), nome = cfg.nome ? ', ' + esc(cfg.nome) : '', dito = DITOS[Math.floor(Math.random() * DITOS.length)];
  const curto = typeof reduzido !== 'undefined' && reduzido;
  tCapa.push(setTimeout(() => { chuvaCapa(); el.classList.add('rebenta'); }, curto ? 200 : 1150));
  tCapa.push(setTimeout(() => {
    $('#capaFala').innerHTML = `<p class="capa-saud">${h === 'manha' ? 'Bom dia' : h === 'tarde' ? 'Boa tarde' : 'Boa noite'}${nome}.</p><p class="capa-dito">«${esc(dito)}»</p>`;
    $('#capaFala').classList.add('fala');
  }, curto ? 250 : 1250));
  tCapa.push(setTimeout(fecharCapa, curto ? 1600 : 3600));
}
function fecharCapa(){
  if (!capaAberta) return;
  capaAberta = false; tCapa.forEach(clearTimeout); tCapa = [];
  const el = $('#capa'), o = CQ.orb; el.style.setProperty('--fx', (o.x || innerWidth / 2) + 'px'); el.style.setProperty('--fy', (o.y || innerHeight / 2) + 'px');
  el.classList.add('sair');
  setTimeout(() => { el.hidden = true; el.innerHTML = ''; el.className = ''; cancelAnimationFrame(CQ.raf); CQ.ps = []; CQ.chuva = []; }, 900);
  if (vista === 'vRitual' && typeof rRitual === 'function') rRitual();
  armarInatividade();
}

/* ---------- Voltar à capa quando a app fica parada ---------- */
function armarInatividade(){
  clearTimeout(tInativo);
  const min = cfg.capaMin === undefined ? 3 : +cfg.capaMin;
  if (!min || cfg.capa === false || !cfg.pronto || capaAberta) return;
  tInativo = setTimeout(() => {
    const ocupado = folhaAtual === 'ia' || folhaAtual === 'editar' || !$('#sessao').hidden || (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName));
    if (document.hidden || ocupado) return armarInatividade();
    fecharFolha(); mostrarCapa();
  }, min * 60e3);
}
['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach(ev => document.addEventListener(ev, () => { if (!capaAberta) armarInatividade(); }, {passive: true}));
document.addEventListener('visibilitychange', () => {
  if (document.hidden){ escondidoEm = Date.now(); return; }
  if (escondidoEm && Date.now() - escondidoEm > 10 * 60e3 && folhaAtual !== 'ia' && $('#sessao').hidden){ escondidoEm = 0; fecharFolha(); mostrarCapa(); }
  else armarInatividade();
});
addEventListener('resize', () => { if (capaAberta) setTimeout(capaGeo, 60); });

/* ---------- Definições (no Perfil) ---------- */
function blocoCapaPerfil(){
  const min = cfg.capaMin === undefined ? 3 : +cfg.capaMin;
  return `<div class="placa col"><h2>Capa do Mestre</h2><p class="suave peq" style="margin:0">Ao abrir a app, o Mestre medita sobre a nascente. Toca três vezes para o despertar. A capa volta quando deixas a app parada.</p>
    <div class="chips">${chip(cfg.capa !== false, 'pCapa', '', 'Capa ao abrir')}${chip(cfg.capaSom !== false, 'pCapaSom', '', 'Som')}</div>
    <div><h3>Voltar à capa ao fim de</h3><div class="chips">${[1, 3, 5, 0].map(n => chip(min === n, 'pCapaMin', n, n ? n + ' min sem tocar' : 'Nunca')).join('')}</div></div>
    <button class="btn" data-acao="verCapa">Ver a capa agora</button></div>`;
}
const ACOES_CAPA = {
  pCapa(el){ cfg.capa = cfg.capa === false; guardarCfg(); el.classList.toggle('on'); armarInatividade(); },
  pCapaSom(el){ cfg.capaSom = cfg.capaSom === false; guardarCfg(); el.classList.toggle('on'); },
  pCapaMin(el){ cfg.capaMin = +el.dataset.v; guardarCfg(); rPerfil(); armarInatividade(); },
  verCapa(){ fecharFolha(); mostrarCapa(true); }
};
