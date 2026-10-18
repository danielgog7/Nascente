'use strict';
/* Nascente — o caminho do cultivo.
   Cada ritual completo dá qi (mais qi quando há uma série sem falhas); cada ritual falhado tira qi.
   Os reinos e níveis saem só dos registos (iguais em todos os dispositivos). Ao romper para um reino, já não se cai abaixo dele.
   O cultivador da capa muda de aparência em cada reino; a energia que absorve cresce com a série. */

const REINOS_C = [
  {nome: 'Têmpera do Corpo', curto: 'Têmpera', niveis: ['Pele', 'Carne', 'Ossos'], custo: () => 40,
    frase: 'O corpo endurece antes de o qi poder fluir.'},
  {nome: 'Condensação de Qi', curto: 'Cond. de Qi', niveis: 12, custo: i => 60 + 10 * i,
    frase: 'O qi do mundo começa a juntar-se no teu dantian.'},
  {nome: 'Estabelecimento da Fundação', curto: 'Fundação', niveis: ['Fase inicial', 'Fase intermédia', 'Fase tardia', 'Pico'], custo: () => 600,
    frase: 'Uma fundação sólida: a constância já faz parte de ti.'},
  {nome: 'Núcleo Dourado', curto: 'Núcleo Dourado', niveis: ['Fase inicial', 'Fase intermédia', 'Fase tardia', 'Pico'], custo: () => 900,
    frase: 'O qi condensou-se num núcleo de ouro.'},
  {nome: 'Alma Nascente', curto: 'Alma Nascente', niveis: ['Fase inicial', 'Fase intermédia', 'Fase tardia', 'Pico'], custo: () => 1300,
    frase: 'Uma segunda alma nasce do teu núcleo.'},
  {nome: 'Transformação Divina', curto: 'Transf. Divina', niveis: ['Fase inicial', 'Fase intermédia', 'Fase tardia', 'Pico'], custo: () => 1800,
    frase: 'O corpo mortal dá lugar ao divino.'},
  {nome: 'Ascensão Imortal', curto: 'Imortal', niveis: ['Imortal'], custo: () => Infinity,
    frase: 'Pele de jade, espírito eterno. O topo da montanha.'}
];
// Lista plana de níveis com o qi em que cada um começa.
const NIVEIS_C = (() => {
  const l = []; let qi = 0;
  REINOS_C.forEach((r, ri) => {
    const n = Array.isArray(r.niveis) ? r.niveis.length : r.niveis;
    for (let i = 0; i < n; i++){ const custo = r.custo(i); l.push({r: ri, i, n, ini: qi, custo, rotulo: Array.isArray(r.niveis) ? r.niveis[i] : 'Nível ' + (i + 1)}); qi += custo; }
  });
  return l;
})();
const nivelDe = qi => { let i = 0; while (i + 1 < NIVEIS_C.length && qi >= NIVEIS_C[i + 1].ini) i++; return i; };
const FLUXOS = ['Disperso', 'Brisa', 'Corrente', 'Rio', 'Torrente'];
const fluxoDe = serie => serie >= 28 ? 4 : serie >= 14 ? 3 : serie >= 6 ? 2 : serie >= 2 ? 1 : 0;
const ganhoRitual = serie => 10 + Math.min(10, Math.floor(serie / 2));
const perdaRitual = idx => Math.max(20, Math.round(Math.min(NIVEIS_C[idx].custo, 2000) * .06));
const NOME_SESS = {m: 'da manhã', n: 'da noite'};

// Percorre os rituais desde o primeiro completo até agora.
function cultivo(agora = new Date()){
  const ks = Object.keys(registos).filter(k => registos[k].mF || registos[k].nF).sort();
  const vazio = {qi: 0, idx: 0, serie: 0, melhor: 0, fluxo: 0, eventos: [], total: 0, falhas: 0};
  if (!ks.length) return Object.assign(vazio, nivelInfo(0));
  const inicioPen = cfg.cultivoInicio ? deChave(cfg.cultivoInicio) : null;
  let d = deChave(ks[0]), s = registos[ks[0]].mF ? 'm' : 'n';
  let qi = 0, chao = 0, serie = 0, melhor = 0, total = 0, falhas = 0; const eventos = [];
  for (let guarda = 0; guarda < 20000; guarda++){
    const k = diaChave(d), r = registos[k] || {};
    const fim = s === 'm' ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0) : new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 5, 0);
    const inicio = s === 'm' ? d : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
    if (inicio > agora) break;
    const idx = nivelDe(qi);
    if (r[s + 'F']){ const g = ganhoRitual(serie); qi += g; serie++; total++; melhor = Math.max(melhor, serie); eventos.push({k, s, tipo: 'ganho', qi: g, t: +fim}); }
    else if (fim <= agora){
      if (!inicioPen || d >= inicioPen){
        const parcial = Object.keys(r[s] || {}).length > 0, p = Math.round(perdaRitual(idx) * (parcial ? .5 : 1));
        const antes = qi; qi = Math.max(chao, qi - p); serie = 0; falhas++;
        eventos.push({k, s, tipo: 'falha', parcial, qi: antes - qi, t: +fim});
      }
    } else break; // ritual em curso: ainda dá tempo
    const ni = nivelDe(qi); if (NIVEIS_C[ni].r > NIVEIS_C[nivelDe(chao)].r) chao = NIVEIS_C.find(l => l.r === NIVEIS_C[ni].r).ini;
    if (s === 'm') s = 'n'; else { s = 'm'; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); }
  }
  return Object.assign({qi, serie, melhor, fluxo: fluxoDe(serie), eventos, total, falhas, chao}, nivelInfo(qi));
}
function nivelInfo(qi){
  const idx = nivelDe(qi), L = NIVEIS_C[idx], R = REINOS_C[L.r], prox = NIVEIS_C[idx + 1];
  return {idx, r: L.r, reino: R.nome, reinoCurto: R.curto, frase: R.frase, nivel: L.rotulo, nNivel: L.i + 1, nNiveis: L.n,
    dentro: qi - L.ini, custo: L.custo, pct: prox ? (qi - L.ini) / L.custo : 1, prox: prox ? (prox.r !== L.r ? REINOS_C[prox.r].nome : prox.rotulo) : null, rompe: prox && prox.r !== L.r};
}
const textoNivel = c => c.nNiveis > 1 ? (typeof REINOS_C[c.r].niveis === 'number' ? `Nível ${c.nNivel} de ${c.nNiveis}` : c.nivel) : c.nivel;
function nomeRitual(e){ const d = deChave(e.k), h = inicioDia(new Date()), dif = Math.round((h - d) / DIA);
  return `o ritual ${NOME_SESS[e.s]} de ${dif === 0 ? 'hoje' : dif === 1 ? 'ontem' : DIAS_LONGO[d.getDay()]}`; }

/* ---------- O cultivador (SVG) ---------- */
const VISUAL_C = [
  {manto: '#6a5644', manto2: '#4d3d30', orla: '#8f7556', interior: '#d8c5a6', aura: '#e0a26b', qi: '232,170,110', cabelo: '#1c1714'},
  {manto: '#2f7260', manto2: '#205244', orla: '#a6dcc6', interior: '#eef6f1', aura: '#7fd1b4', qi: '160,236,210', cabelo: '#1c1714'},
  {manto: '#21506a', manto2: '#173a4f', orla: '#e3c47e', interior: '#eef4f6', aura: '#86cddd', qi: '175,228,245', cabelo: '#1a1716'},
  {manto: '#ebe3cc', manto2: '#c9bd9a', orla: '#d6a537', interior: '#fffaea', aura: '#f2c35b', qi: '250,210,115', cabelo: '#1f1a18'},
  {manto: '#ece6f6', manto2: '#c3b5de', orla: '#b398e8', interior: '#ffffff', aura: '#c9b6f0', qi: '210,190,250', cabelo: '#2a2530'},
  {manto: '#f6f3ea', manto2: '#d8d1bc', orla: '#e3c47e', interior: '#ffffff', aura: '#fff0c4', qi: '255,240,200', cabelo: '#e9e6ef'},
  {manto: '#fffbf1', manto2: '#eddcb4', orla: '#ffd36a', interior: '#ffffff', aura: '#ffe7a0', qi: '255,232,160', cabelo: '#f2efe8'}
];
function avatarSVG({r = 0, f = 0, fluxo = 0, mini = false, id = 'a'} = {}){
  const V = VISUAL_C[r], pele = '#e2c3a1', peleS = '#c9a483';
  const auraOp = (.1 + r * .07 + f * .08 + (mini ? 0 : fluxo * .05)).toFixed(2), danR = 9 + r * 2.6 + f * 4, aneis = Math.max(0, r - 1);
  const flut = r >= 5 ? ' c-flutua' : '';
  const correntes = mini ? '' : [
    'M6 110 C70 128 112 190 150 238', 'M294 140 C228 150 192 206 150 238', 'M30 352 C84 310 122 276 150 240', 'M272 352 C218 310 180 276 150 240'
  ].slice(0, fluxo >= 2 ? fluxo : 0).map((d, i) => `<path class="c-corrente" d="${d}" stroke="${V.aura}" stroke-width="${1.2 + fluxo * .5}" style="animation-delay:${-i * .4}s"/>`).join('');
  const espada = r >= 3 ? `<g class="c-espada"><g transform="translate(222 132) rotate(28)">
      <rect x="-3" y="-62" width="6" height="88" rx="1.5" fill="url(#${id}gLam)"/><path d="M-3 -62 L0 -74 L3 -62Z" fill="#f5f2e6"/>
      <rect x="-12" y="26" width="24" height="5" rx="2" fill="${V.orla}"/><rect x="-2.5" y="31" width="5" height="18" rx="2" fill="#5a3b26"/><circle cy="52" r="3.5" fill="${V.orla}"/></g></g>` : '';
  const halo = r >= 5 ? `<g class="c-halo"><circle cx="150" cy="112" r="40" fill="none" stroke="${V.aura}" stroke-width="2" opacity=".7"/>
      <circle cx="150" cy="112" r="47" fill="none" stroke="${V.aura}" stroke-width="1" stroke-dasharray="3 7" opacity=".6"/></g>` : '';
  const alma = r >= 4 ? `<g class="c-alma"><g transform="translate(0 -20)"><circle cx="150" cy="34" r="18" fill="url(#${id}gAura)" opacity=".95"/>
      <circle cx="150" cy="27" r="4.5" fill="#fff" opacity=".95"/><path d="M150 32 C143 32 140 38 139 44 L161 44 C160 38 157 32 150 32Z" fill="#fff" opacity=".9"/>
      <path d="M136 46 C140 41 146 41 150 44 C154 41 160 41 164 46" stroke="${V.orla}" stroke-width="1.3" fill="none"/></g></g>` : '';
  const petala = (dx, dy, esc) => `<path d="M0 0 C-11 -12 -11 -32 0 -46 C11 -32 11 -12 0 0Z" transform="translate(${150 + dx} ${dy}) rotate(${(dx / 120 * 58).toFixed(1)}) scale(${esc})" fill="${V.aura}" fill-opacity=".38" stroke="${V.orla}" stroke-width="1"/>`;
  const trono = r >= 5 ? `<g class="c-trono"><ellipse cx="150" cy="322" rx="126" ry="20" fill="${V.aura}" opacity=".28"/>${[-118, -84, -46, 0, 46, 84, 118].map(dx => petala(dx, 322 - 14 * Math.sqrt(Math.max(0, 1 - (dx / 126) ** 2)), 1.15)).join('')}</g>` : '';
  const tronoFrente = r >= 5 ? `<g class="c-trono">${[-100, -54, 0, 54, 100].map(dx => petala(dx, 336 + 6 * Math.sqrt(Math.max(0, 1 - (dx / 126) ** 2)), .8)).join('')}</g>` : '';
  const pilar = r >= 6 && !mini ? `<rect class="c-pilar" x="96" y="-400" width="108" height="760" fill="url(#${id}gPilar)"/>` : '';
  const marca = r >= 4 ? `<path d="M150 92 L152.5 97 L150 102 L147.5 97Z" fill="${V.orla}"/>` : '';
  const madeixas = r === 4 ? `<path d="M134 98 C130 120 128 150 130 190 M166 98 C170 120 172 150 170 190" stroke="#d8d4e6" stroke-width="2" fill="none" opacity=".8"/>` : '';
  const toucado = r === 0 ? `<path d="M129 97 C140 92 160 92 171 97" stroke="#8a6d4f" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="141" y="66" width="18" height="6" rx="2" fill="#8a6d4f"/>`
    : r === 1 ? `<path d="M132 66 L170 74" stroke="#a87c4f" stroke-width="2.6" stroke-linecap="round"/>`
    : r <= 3 ? `<path d="M140 66 L160 66 L157 54 L143 54Z" fill="${V.orla}"/><path d="M130 62 L172 62" stroke="${V.orla}" stroke-width="2.2" stroke-linecap="round"/>`
    : r <= 5 ? `<path d="M139 66 L161 66 L158 52 L142 52Z" fill="${r === 4 ? '#d9d2ee' : V.orla}" stroke="${V.orla}" stroke-width="1"/><circle cx="150" cy="58" r="2.4" fill="${V.aura}"/><path d="M128 62 L174 62" stroke="${V.orla}" stroke-width="2" stroke-linecap="round"/>`
    : `<path d="M136 66 L164 66 L162 50 L156 56 L150 44 L144 56 L138 50Z" fill="${V.orla}"/><circle cx="150" cy="55" r="2.6" fill="#fff"/>`;
  const olhos = `<g class="c-olhos-f"><path d="M137 113 Q142 116.5 147 113 M153 113 Q158 116.5 163 113" stroke="#3a2a22" stroke-width="1.7" fill="none" stroke-linecap="round"/></g>
    <g class="c-olhos-a"><ellipse cx="142" cy="113" rx="3.2" ry="2.4" fill="${V.aura}"/><ellipse cx="158" cy="113" rx="3.2" ry="2.4" fill="${V.aura}"/><circle cx="142" cy="113" r="1.2" fill="#fff"/><circle cx="158" cy="113" r="1.2" fill="#fff"/></g>`;
  const pendente = r >= 2 ? `<path d="M150 232 L150 250" stroke="${V.orla}" stroke-width="1.2"/><circle cx="150" cy="253" r="3.4" fill="${V.aura}"/>` : '';
  const nucleo = r >= 3 ? `<circle class="c-nucleo" cx="150" cy="238" r="${5 + (r - 3) * 1.2}" fill="#fff6d2" stroke="#f2c35b" stroke-width="1.4"/>` : '';
  return `<svg class="cultivador r${r}${mini ? ' mini' : ''} f${fluxo}" viewBox="0 0 300 360" aria-hidden="true">
  <defs>
    <radialGradient id="${id}gAura" cx=".5" cy=".55" r=".55"><stop offset="0" stop-color="${V.aura}" stop-opacity=".9"/><stop offset=".55" stop-color="${V.aura}" stop-opacity=".25"/><stop offset="1" stop-color="${V.aura}" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}gDan" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".3" stop-color="${V.aura}" stop-opacity=".8"/><stop offset="1" stop-color="${V.aura}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}gManto" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${V.manto}"/><stop offset="1" stop-color="${V.manto2}"/></linearGradient>
    <linearGradient id="${id}gLam" x1="0" x2="1"><stop offset="0" stop-color="#cfd8dc"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#9fb0b6"/></linearGradient>
    <linearGradient id="${id}gPilar" x1="0" x2="1"><stop offset="0" stop-color="${V.aura}" stop-opacity="0"/><stop offset=".5" stop-color="${V.aura}" stop-opacity=".45"/><stop offset="1" stop-color="${V.aura}" stop-opacity="0"/></linearGradient>
  </defs>
  ${pilar}
  <path class="c-aura" d="M150 ${44 - r * 4} C${204 + r * 4} 62 ${240 + r * 3} 120 ${244 + r * 3} 200 C${248 + r * 3} 262 224 314 150 328 C76 314 ${52 - r * 3} 262 ${56 - r * 3} 200 C${60 - r * 3} 120 ${96 - r * 4} 62 150 ${44 - r * 4}Z" fill="url(#${id}gAura)" opacity="${auraOp}"/>
  ${Array.from({length: aneis}, (_, i) => `<ellipse class="c-anel" cx="150" cy="236" rx="${70 + i * 26}" ry="${18 + i * 7}" fill="none" stroke="${V.aura}" stroke-width="1" opacity="${(.5 - i * .08).toFixed(2)}" style="animation-delay:${-i * .8}s"/>`).join('')}
  ${correntes}${halo}${espada}
  <g class="c-corpo${flut}">
    ${trono}
    <path d="M128 100 C121 140 117 182 124 206 L176 206 C183 182 179 140 172 100Z" fill="${V.cabelo}"/>${madeixas}
    <path d="M58 300 C56 272 92 254 150 256 C208 254 244 272 242 300 C242 314 205 320 150 318 C95 320 58 314 58 300Z" fill="${V.manto2}"/>
    <path d="M98 292 C120 280 140 283 150 302 M202 292 C180 280 160 283 150 302" stroke="rgba(0,0,0,.18)" stroke-width="1.4" fill="none"/>${tronoFrente}
    <g class="c-respira">
      <path d="M150 146 C126 146 106 152 98 166 C90 182 92 220 96 262 L204 262 C208 220 210 182 202 166 C194 152 174 146 150 146Z" fill="url(#${id}gManto)"/>
      <path d="M138 148 L150 184 L162 148Z" fill="${V.interior}"/>
      <path d="M134 148 L162 206 M166 148 L151 180" stroke="${V.orla}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M100 214 C130 222 170 222 200 214 L201 229 C170 237 130 237 99 229Z" fill="${V.orla}" opacity=".9"/>${pendente}
      <path d="M102 164 C80 180 70 226 80 262 C88 280 112 280 132 270 C140 266 146 262 150 258 C134 250 120 232 114 206 C110 190 108 176 102 164Z" fill="url(#${id}gManto)"/>
      <path d="M198 164 C220 180 230 226 220 262 C212 280 188 280 168 270 C160 266 154 262 150 258 C166 250 180 232 186 206 C190 190 192 176 198 164Z" fill="url(#${id}gManto)"/>
      <path d="M102 164 C108 178 110 192 114 206 C120 232 134 250 150 258 M198 164 C192 178 190 192 186 206 C180 232 166 250 150 258" stroke="rgba(0,0,0,.22)" stroke-width="2" fill="none"/>
      <path d="M102 164 C80 180 70 226 80 262 M198 164 C220 180 230 226 220 262" stroke="rgba(255,255,255,.12)" stroke-width="1.5" fill="none"/>
      <path d="M80 262 C88 280 112 280 132 270 M220 262 C212 280 188 280 168 270" stroke="${V.orla}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="150" cy="257" rx="16" ry="7" fill="${pele}"/><path d="M140 254 Q150 246 160 254" stroke="${peleS}" stroke-width="1.4" fill="none"/>
      <circle class="c-dantian" cx="150" cy="238" r="${danR.toFixed(1)}" fill="url(#${id}gDan)"/>${nucleo}
      <path d="M142 126 L142 150 L158 150 L158 126Z" fill="${peleS}"/>
      <ellipse cx="129" cy="115" rx="3.5" ry="6" fill="${peleS}"/><ellipse cx="171" cy="115" rx="3.5" ry="6" fill="${peleS}"/>
      <ellipse cx="150" cy="112" rx="21" ry="25" fill="${pele}"/>
      <path d="M136 106 Q142 103 147 105 M153 105 Q158 103 164 106" stroke="${V.cabelo === '#e9e6ef' || V.cabelo === '#f2efe8' ? '#bdb7c6' : V.cabelo}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
      ${olhos}
      <path d="M150 115 L148.4 122.5 L151.5 123" stroke="${peleS}" stroke-width="1.2" fill="none"/><path d="M145 129 Q150 131 155 129" stroke="#9a6656" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      ${marca}
      <path d="M128 108 C126 86 138 76 150 76 C162 76 174 86 172 108 C168 98 160 92 150 92 C140 92 132 98 128 108Z" fill="${V.cabelo}"/>
      <path d="M129 104 C126 120 127 132 131 142 M171 104 C174 120 173 132 169 142" stroke="${V.cabelo}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <circle cx="150" cy="69" r="11" fill="${V.cabelo}"/>${toucado}
    </g>
  </g>
  ${alma}
</svg>`;
}

/* ---------- Capa: o cultivador a absorver qi; três toques para entrar ---------- */
let capaAberta = false, toquesCapa = 0, escondidoEm = 0, tInativo = null, capaC = null, audioC = null;
const capaQi = {cv: null, c: null, w: 0, h: 0, ps: [], alvo: {x: 0, y: 0}, acc: 0, ult: 0, raf: 0, cor: '160,236,210', taxa: 10, spr: null};
function spriteC(cor){ const s = document.createElement('canvas'); s.width = s.height = 32; const c = s.getContext('2d'), g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, `rgba(${cor},1)`); g.addColorStop(.3, `rgba(${cor},.5)`); g.addColorStop(1, `rgba(${cor},0)`); c.fillStyle = g; c.fillRect(0, 0, 32, 32); return s; }
function capaGeo(){
  const cv = capaQi.cv, dpr = Math.min(1.5, devicePixelRatio || 1); if (!cv) return;
  capaQi.w = innerWidth; capaQi.h = innerHeight; cv.width = capaQi.w * dpr; cv.height = capaQi.h * dpr; capaQi.c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const dan = document.querySelector('#capa .c-dantian'); if (dan){ const b = dan.getBoundingClientRect(); capaQi.alvo = {x: b.left + b.width / 2, y: b.top + b.height / 2}; }
}
function novaMote(perto){
  const a = Math.random() * Math.PI * 2, R = (perto ? 60 : 140) + Math.random() * Math.max(capaQi.w, capaQi.h) * (perto ? .2 : .55);
  return {x: capaQi.alvo.x + Math.cos(a) * R, y: capaQi.alvo.y + Math.sin(a) * R * .8, a, R, rot: (Math.random() < .5 ? -1 : 1) * (.6 + Math.random() * .8),
    v: .35 + Math.random() * .5 + capaC.fluxo * .18, s: 4 + Math.random() * 6 + capaC.fluxo * 1.2, vida: 0};
}
function passoCapa(t){
  if (!capaAberta) return;
  capaQi.raf = requestAnimationFrame(passoCapa);
  const dt = Math.min(.05, (t - (capaQi.ult || t)) / 1000); capaQi.ult = t;
  capaQi.acc += dt * capaQi.taxa;
  while (capaQi.acc > 1 && capaQi.ps.length < 260){ capaQi.acc--; capaQi.ps.push(novaMote()); }
  const c = capaQi.c; c.clearRect(0, 0, capaQi.w, capaQi.h); c.globalCompositeOperation = 'lighter';
  for (const p of capaQi.ps){
    p.vida += dt; p.R -= p.v * (40 + 140 / Math.max(.4, p.R / 100)) * dt; p.a += p.rot * dt * (1.2 + 90 / Math.max(20, p.R));
    p.x = capaQi.alvo.x + Math.cos(p.a) * p.R; p.y = capaQi.alvo.y + Math.sin(p.a) * p.R * .8;
    const al = Math.min(1, p.vida * 1.5) * Math.min(1, p.R / 30);
    c.globalAlpha = Math.max(0, al * .85); const s = p.s * (.6 + Math.min(1, p.R / 160) * .6); c.drawImage(capaQi.spr, p.x - s / 2, p.y - s / 2, s, s);
  }
  capaQi.ps = capaQi.ps.filter(p => p.R > 6); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
function rajadaCapa(n){ for (let i = 0; i < n; i++) capaQi.ps.push(Object.assign(novaMote(true), {v: 1.2 + Math.random(), s: 7 + Math.random() * 8})); }
function somCapa(n){
  if (cfg.som === false) return;
  try {
    audioC = audioC || new (window.AudioContext || window.webkitAudioContext)(); if (audioC.state === 'suspended') audioC.resume();
    const t = audioC.currentTime, saida = audioC.createGain(); saida.gain.value = n >= 3 ? .32 : .22; saida.connect(audioC.destination);
    const base = n >= 3 ? 196 : [523.25, 659.25][n - 1] || 523.25;
    [[1, .7, n >= 3 ? 4 : 2.2], [2.01, .3, 1.6], [2.76, .18, 1.1], [5.4, .08, .6]].forEach(([m, a, dur]) => {
      const o = audioC.createOscillator(), g = audioC.createGain(); o.type = 'sine'; o.frequency.value = base * m;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + .008); g.gain.exponentialRampToValueAtTime(.0004, t + dur);
      o.connect(g); g.connect(saida); o.start(t); o.stop(t + dur + .1);
    });
  } catch(e){}
}
function mensagemCapa(c){
  const v = LS.get('cultivoVisto', null); if (!v) return '';
  const novos = c.eventos.filter(e => e.t > v.ts), falhas = novos.filter(e => e.tipo === 'falha'), ganho = novos.filter(e => e.tipo === 'ganho').reduce((s, e) => s + e.qi, 0);
  const perdido = falhas.reduce((s, e) => s + e.qi, 0), partes = [];
  const rAntes = NIVEIS_C[Math.min(v.idx, NIVEIS_C.length - 1)].r;
  if (c.r > rAntes) partes.push(`<span class="capa-sobe">Rompeste para ${esc(c.reino)}!</span>`);
  else if (c.idx > v.idx) partes.push(`<span class="capa-sobe">Avançaste: ${esc(textoNivel(c))}.</span>`);
  else if (c.idx < v.idx) partes.push(`<span class="capa-desce">Recuaste: ${esc(textoNivel(c))}.</span>`);
  if (falhas.length) partes.push(`<span class="capa-desce">${falhas.length === 1 ? (falhas[0].parcial ? 'Deixaste a meio ' : 'Falhaste ') + nomeRitual(falhas[0]) : 'Falhaste ' + falhas.length + ' rituais'}: −${perdido} qi.</span>`);
  if (ganho) partes.push(`<span class="capa-sobe">+${ganho} qi absorvido desde a última vez.</span>`);
  return partes.join(' ');
}
function renderCapa(){
  const c = capaC = cultivo(), V = VISUAL_C[c.r], hoje = registos[diaChave(new Date())] || {};
  const falta = [!hoje.mF ? 'manhã' : '', !hoje.nF ? 'noite' : ''].filter(Boolean);
  $('#capa').innerHTML = `<div class="capa-ceu"></div>
    <svg class="capa-paisagem" viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <circle cx="318" cy="120" r="70" fill="${V.aura}" opacity=".08"/><circle cx="318" cy="120" r="18" fill="#f3ead2" opacity=".75"/>
      <path d="M0 520 L50 470 L80 486 L125 420 L160 452 L198 396 L232 440 L270 405 L312 462 L352 418 L400 452 V800 H0Z" fill="#10261f" opacity=".85"/>
      <path d="M0 585 L40 555 L78 572 L120 530 L160 560 L205 538 L250 566 L292 540 L340 568 L400 548 V800 H0Z" fill="#0a1a16"/>
      <rect y="640" width="400" height="160" fill="#07130f"/><path d="M0 640 H400" stroke="${V.aura}" stroke-opacity=".18"/>
    </svg>
    <canvas id="capaQi" aria-hidden="true"></canvas>
    <div class="capa-topo"><div class="capa-marca">NASCENTE</div>
      <h1 class="capa-reino" style="--brilho:${V.aura}">${esc(c.reino)}</h1><p class="capa-nivel">${esc(textoNivel(c))}</p></div>
    <div class="capa-figura" id="capaFig">${avatarSVG({r: c.r, f: c.pct, fluxo: c.fluxo, id: 'cp'})}
      <div class="capa-pedra" style="${c.r >= 5 ? 'opacity:.25' : ''}"></div><div class="capa-ondas"><i></i><i></i><i></i></div></div>
    <div class="capa-base">
      <div class="capa-barra"><i style="width:${Math.round(c.pct * 100)}%;background:linear-gradient(90deg, ${V.orla}, ${V.aura}, #fff)"></i></div>
      <div class="capa-dados"><span>${c.prox ? `${c.dentro} / ${c.custo} qi` : `${c.qi} qi`}</span><span>Fluxo: ${FLUXOS[c.fluxo]}${c.serie ? ` · ${c.serie} ${c.serie === 1 ? 'ritual seguido' : 'rituais seguidos'}` : ''}</span></div>
      <p class="capa-msg">${mensagemCapa(c) || (falta.length && c.total ? `Hoje ainda falta o ritual da ${falta.join(' e da ')}.` : esc(c.frase))}</p>
      <p class="capa-dica">Toca três vezes para despertar</p><div class="capa-pontos"><i></i><i></i><i></i></div>
    </div>`;
  capaQi.cv = $('#capaQi'); capaQi.c = capaQi.cv.getContext('2d'); capaQi.ps = []; capaQi.cor = V.qi; capaQi.spr = spriteC(V.qi);
  capaQi.taxa = 6 + c.r * 2 + c.fluxo * 9;
}
function mostrarCapa(forcar){
  if (!cfg.pronto || (!forcar && cfg.capa === false) || capaAberta) return;
  toquesCapa = 0; capaAberta = true;
  const el = $('#capa'); el.classList.remove('sair', 'despertar'); el.style.animation = 'none'; el.hidden = false; renderCapa();
  requestAnimationFrame(() => { capaGeo(); for (let i = 0; i < 40; i++) capaQi.ps.push(novaMote()); capaQi.ult = 0; cancelAnimationFrame(capaQi.raf); capaQi.raf = requestAnimationFrame(passoCapa); });
}
function toqueCapa(e){
  if (!capaAberta || toquesCapa >= 3) return;
  toquesCapa++; vibrar(toquesCapa >= 3 ? [25, 40, 40] : 18); somCapa(toquesCapa);
  document.querySelectorAll('#capa .capa-pontos i').forEach((p, i) => p.classList.toggle('on', i < toquesCapa));
  const fig = $('#capaFig'); fig.classList.remove('pulso'); void fig.offsetWidth; fig.classList.add('pulso');
  rajadaCapa(18 + toquesCapa * 14);
  const o = document.createElement('span'); o.className = 'capa-onda'; o.style.left = capaQi.alvo.x + 'px'; o.style.top = capaQi.alvo.y + 'px'; $('#capa').appendChild(o); setTimeout(() => o.remove(), 1200);
  if (toquesCapa >= 3){ $('#capa').classList.add('despertar'); $('#capa .capa-dica').textContent = 'Desperta'; setTimeout(fecharCapa, 900); }
}
function fecharCapa(){
  if (!capaAberta) return;
  capaAberta = false; const c = capaC || cultivo();
  LS.set('cultivoVisto', {qi: c.qi, idx: c.idx, ts: Date.now()});
  const el = $('#capa'); el.classList.add('sair');
  setTimeout(() => { el.hidden = true; el.innerHTML = ''; cancelAnimationFrame(capaQi.raf); capaQi.ps = []; }, 560);
  if (typeof rRitual === 'function' && vista === 'vRitual') rRitual();
  armarInatividade();
}
// Volta à capa depois de algum tempo sem tocar na app (ou ao regressar à app ao fim de 10 minutos).
function armarInatividade(){
  clearTimeout(tInativo);
  const min = cfg.capaMin === undefined ? 3 : +cfg.capaMin;
  if (!min || cfg.capa === false || !cfg.pronto || capaAberta) return;
  tInativo = setTimeout(() => {
    const ocupado = folhaAtual === 'ia' || folhaAtual === 'editar' || (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName));
    if (document.hidden || ocupado) return armarInatividade();
    fecharFolha(); mostrarCapa();
  }, min * 60e3);
}
['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach(ev => document.addEventListener(ev, () => { if (!capaAberta) armarInatividade(); }, {passive: true}));
document.addEventListener('visibilitychange', () => {
  if (document.hidden){ escondidoEm = Date.now(); return; }
  if (escondidoEm && Date.now() - escondidoEm > 10 * 60e3 && folhaAtual !== 'ia'){ escondidoEm = 0; fecharFolha(); mostrarCapa(); }
  else armarInatividade();
});
addEventListener('resize', () => { if (capaAberta) setTimeout(capaGeo, 60); });

/* ---------- Cartão do cultivo no Ritual e o caminho completo ---------- */
function blocoCultivo(){
  const c = cultivo(), V = VISUAL_C[c.r], ult = c.eventos.filter(e => e.tipo === 'falha' && Date.now() - e.t < 2 * DIA).pop();
  return `<div class="placa cultivo-cartao" data-acao="verCaminho"><div class="cultivo-linha">
      <div class="cultivo-mini">${avatarSVG({r: c.r, f: c.pct, fluxo: c.fluxo, mini: true, id: 'mi'})}</div>
      <div class="cresce"><span class="suave mini">Cultivo</span><b class="cultivo-reino" style="color:${V.aura}">${esc(c.reino)}</b><span class="suave peq">${esc(textoNivel(c))}</span></div></div>
    <div class="barra" style="margin:12px 0 6px"><i style="width:${Math.round(c.pct * 100)}%"></i></div>
    <div class="linha entre mini suave"><span>${c.prox ? `${c.dentro} / ${c.custo} qi · a seguir: ${esc(c.prox)}` : `${c.qi} qi`}</span><span>Fluxo: ${FLUXOS[c.fluxo]}${c.serie ? ' · ' + c.serie + ' seguidos' : ''}</span></div>
    ${ult ? `<p class="mini" style="color:var(--perigo);margin:8px 0 0">${ult.parcial ? 'Deixaste a meio' : 'Falhaste'} ${nomeRitual(ult)}: −${ult.qi} qi.</p>` : ''}</div>`;
}
function folhaCaminho(){
  const c = cultivo(), lst = REINOS_C.map((R, i) => {
    const ini = NIVEIS_C.find(l => l.r === i).ini, estado = i < c.r ? 'feito' : i === c.r ? 'atual' : 'futuro';
    return `<div class="caminho-reino ${estado}"><div class="caminho-fig">${avatarSVG({r: i, f: .5, mini: true, id: 'cm' + i})}</div>
      <div class="t"><b>${esc(R.nome)}</b><span>${esc(R.frase)}</span><span class="mini">${i === c.r ? `Estás aqui: ${esc(textoNivel(c))}` : i < c.r ? 'Alcançado' : `A partir de ${ini} qi`}</span></div></div>`;
  }).join('');
  const ev = c.eventos.slice(-12).reverse().map(e => `<div class="linha entre mini"><span>${e.tipo === 'falha' ? (e.parcial ? 'Ritual incompleto' : 'Ritual falhado') : 'Ritual completo'} · ${esc(nomeRitual(e).replace('o ritual ', ''))}</span><b style="color:${e.tipo === 'falha' ? 'var(--perigo)' : 'var(--jade)'}">${e.tipo === 'falha' ? '−' : '+'}${e.qi} qi</b></div>`).join('');
  abrirFolha(`${cab('O caminho do cultivo')}
    <p class="suave peq" style="margin:0">Cada ritual completo dá entre 10 e 20 qi: quanto maior a série sem falhas, mais qi absorves. Cada ritual falhado tira qi (metade se ficou a meio) e quebra a série. Ao romper para um reino novo, já não cais abaixo dele.</p>
    <div class="linha entre peq"><span>Qi total: <b>${c.qi}</b></span><span>Melhor série: <b>${c.melhor}</b></span><span>Falhas: <b>${c.falhas}</b></span></div>
    <div class="col">${lst}</div>
    ${ev ? `<div class="col"><h3>Últimos rituais</h3>${ev}</div>` : ''}
    <button class="btn jade" data-acao="verCapa">Ver o cultivador</button>`, 'caminho');
}
