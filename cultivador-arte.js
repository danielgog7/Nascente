'use strict';
/* Cultivador: o desenho comum às apps (Mirante e Nascente). Este ficheiro é IGUAL nos dois repositórios:
   quando mudar num, copia-se para o outro (ver ARTE_VERSAO). Tem o personagem (avatarM), os três tesouros,
   os objetos das apps, a lua verdadeira e os palcos dos reinos. Não depende de nada de nenhuma das apps. */
const ARTE_VERSAO = '2026-10-18';
const clampA = (v, a, b) => Math.max(a, Math.min(b, v));
const diaNumA = (d = new Date()) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5;

/* ---------- Os Três Tesouros ---------- */
const TESOUROS = {
  jing: {nome: 'Jing', sub: 'essência', app: 'Garfada', cor: '#9AC74B', rgb: '154,199,75', max: 12},
  qi: {nome: 'Qi', sub: 'energia', app: 'Forja', cor: '#EE6A22', rgb: '238,106,34', max: 12},
  shen: {nome: 'Shen', sub: 'espírito', app: 'Nascente', cor: '#4FD6D6', rgb: '79,214,214', max: 10},
  forma: {nome: 'Forma', sub: 'o peso', app: 'Peso', cor: '#7AA2F5', rgb: '122,162,245', max: 4}
};
const TRES = ['jing', 'qi', 'shen'];

// A lua verdadeira de cada dia (idade em dias desde a lua nova, iluminação e nome). Na lua cheia, o Shen vale o dobro.
const LUA_NOVA_REF = Date.UTC(2000, 0, 6, 18, 14), MES_LUNAR = 29.530588853;
function faseLua(n){
  const idade = (((n * 864e5 + 12 * 36e5 - LUA_NOVA_REF) / 864e5) % MES_LUNAR + MES_LUNAR) % MES_LUNAR, f = idade / MES_LUNAR;
  const nome = f < .034 || f > .966 ? 'Lua nova' : f < .216 ? 'Lua crescente' : f < .284 ? 'Quarto crescente' : f < .466 ? 'Crescente gibosa' : f < .534 ? 'Lua cheia' : f < .716 ? 'Minguante gibosa' : f < .784 ? 'Quarto minguante' : 'Lua minguante';
  return {idade, f, ilum: (1 - Math.cos(2 * Math.PI * f)) / 2, nome, cheia: Math.abs(idade - MES_LUNAR / 2) <= 1};
}

const VIS_M = [0, 1, 2, 3, 4, 4, 5, 5, 6];   // aparência da Nascente para cada um dos 9 reinos do Mirante
const DAN_Y = {jing: 238, qi: 190, shen: 99};
function dantiansM(id, r, tes, desvio, mini){
  const defs = TRES.map(t => `<radialGradient id="${id}gD${t}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".3" stop-color="${desvio.includes(t) ? '#8a8f99' : TESOUROS[t].cor}" stop-opacity=".85"/><stop offset="1" stop-color="${desvio.includes(t) ? '#8a8f99' : TESOUROS[t].cor}" stop-opacity="0"/></radialGradient>`).join('');
  const g = TRES.map(t => {
    const ativo = !tes || !tes.ativos || tes.ativos[t] || !Object.values(tes.ativos).some(Boolean);
    if (!ativo) return '';
    const frac = tes ? clampA((tes[t] || 0) / TESOUROS[t].max, 0, 1) : .5, rr = ((mini ? 4.5 : 4) + frac * 7 + r * .7) * (t === 'shen' ? .5 : 1), y = DAN_Y[t], des = desvio.includes(t);
    const fenda = des ? `<path d="M${150 - rr * .5} ${y - rr * .6} l${rr * .35} ${rr * .5} l-${rr * .2} ${rr * .3} l${rr * .45} ${rr * .4}" stroke="#ff6b5e" stroke-width="1.2" fill="none"/>` : '';
    return `<g class="c-dan d-${t}${des ? ' desvio' : ''}"><circle class="c-dan-h" cx="150" cy="${y}" r="${(rr * 2.3).toFixed(1)}" fill="url(#${id}gD${t})" opacity="${((.45 + frac * .55) * (t === 'shen' ? .75 : 1)).toFixed(2)}"/>
      <circle class="c-dan-n" cx="150" cy="${y}" r="${(rr * .42).toFixed(1)}" fill="#fff" opacity="${(.55 + frac * .45).toFixed(2)}"/>${fenda}</g>`;
  }).join('');
  return `<defs>${defs}</defs>${g}`;
}

/* ---------- Os objetos de cada app ---------- */
const ESPADA_COR = [['#6f757c', '#aab0b6', '#5d636a', 0], ['#cfd8dc', '#ffffff', '#9fb0b6', .15], ['#e8f4ff', '#ffffff', '#b8d6f0', .4], ['#ffb46b', '#fff3d6', '#ff7a2a', .65], ['#ffd27a', '#ffffff', '#ff5a1f', .95]];
function objetosM(obj, id, mini){
  if (!obj) return {tras: '', frente: ''};
  let tras = '', frente = '';
  if (obj.espada && obj.espada.ativo){
    const n = obj.espada.nivel, [c1, c2, c3, gl] = ESPADA_COR[n];
    tras = `<g class="c-espada e${n}"><g transform="translate(222 132) rotate(28)">
      <defs><linearGradient id="${id}gEsp" x1="0" x2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".5" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>
        <radialGradient id="${id}gEspB"><stop offset="0" stop-color="${n >= 3 ? '#ff9a3c' : '#dff1ff'}" stop-opacity=".9"/><stop offset="1" stop-color="${n >= 3 ? '#ff5a1f' : '#9fd0ff'}" stop-opacity="0"/></radialGradient></defs>
      ${gl ? `<ellipse class="esp-brilho" cx="0" cy="-18" rx="${10 + n * 4}" ry="${52 + n * 6}" fill="url(#${id}gEspB)" opacity="${gl}"/>` : ''}
      <rect x="-3" y="-62" width="6" height="88" rx="1.5" fill="url(#${id}gEsp)"/><path d="M-3 -62 L0 -74 L3 -62Z" fill="${c2}"/>
      ${n >= 2 ? `<path d="M0 -70 L0 24" stroke="#fff" stroke-width=".8" opacity=".8"/>` : ''}
      <rect x="-12" y="26" width="24" height="5" rx="2" fill="#c9a86a"/><rect x="-2.5" y="31" width="5" height="18" rx="2" fill="#5a3b26"/><circle cy="52" r="3.5" fill="#c9a86a"/>
      ${n >= 4 && !mini ? `<g class="esp-faiscas" fill="#ffd27a"><circle cx="-8" cy="-40" r="1.6"/><circle cx="9" cy="-12" r="1.3"/><circle cx="-6" cy="8" r="1.1"/><circle cx="7" cy="-55" r="1.2"/></g>` : ''}</g></g>`;
  }
  if (obj.cabaca && obj.cabaca.ativo){
    const fr = clampA(obj.cabaca.frac, 0, 1), topo = 268 - fr * 40;
    frente += `<g class="c-cabaca"><defs><clipPath id="${id}cCab"><path d="M108 228 C102 228 101 236 104 240 C96 244 94 256 98 262 C102 270 114 270 118 262 C122 256 120 244 112 240 C115 236 114 228 108 228Z"/></clipPath>
        <linearGradient id="${id}gCab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8f59a"/><stop offset="1" stop-color="#6f9a2c"/></linearGradient></defs>
      <path d="M108 222 L108 229" stroke="#c9a86a" stroke-width="1.3"/>
      <path d="M108 228 C102 228 101 236 104 240 C96 244 94 256 98 262 C102 270 114 270 118 262 C122 256 120 244 112 240 C115 236 114 228 108 228Z" fill="#3b2a1c" stroke="#c9a86a" stroke-width="1.2"/>
      <rect clip-path="url(#${id}cCab)" x="92" y="${topo.toFixed(1)}" width="32" height="${(272 - topo).toFixed(1)}" fill="url(#${id}gCab)" opacity=".95"/>
      ${fr >= .5 ? `<ellipse cx="108" cy="${(topo + 1).toFixed(1)}" rx="9" ry="1.6" fill="#f2ffd0" opacity=".7"/>` : ''}
      <path d="M103 237 L113 237" stroke="#c9a86a" stroke-width="1.6"/></g>`;
  }
  if (obj.jade && obj.jade.ativo){
    const n = obj.jade.nivel, cor = ['#5f7f74', '#7fd1b4', '#9ff0d0', '#c6fff0', '#ffffff'][n];
    frente += `<g class="c-jade j${n}"><path d="M192 224 L192 242" stroke="#c9a86a" stroke-width="1.2"/>
      ${n ? `<circle cx="192" cy="250" r="${12 + n * 3}" fill="${cor}" opacity="${(.12 + n * .07).toFixed(2)}"/>` : ''}
      <circle cx="192" cy="250" r="8.5" fill="${cor}" fill-opacity="${(.55 + n * .1).toFixed(2)}" stroke="#eafff6" stroke-opacity="${(.4 + n * .12).toFixed(2)}"/><circle cx="192" cy="250" r="2.8" fill="#0b1c18"/>
      <path d="M187 262 L192 270 L197 262" stroke="#c9a86a" stroke-width="1" fill="none"/></g>`;
  }
  return {tras, frente};
}

/* ---------- O céu verdadeiro: a fase da lua de hoje e a hora a que abres ---------- */
// Caminho da parte iluminada da lua (f: 0 lua nova, 0,5 cheia).
function caminhoLua(cx, cy, r, f){
  const crescente = f < .5, k = Math.cos(2 * Math.PI * f), rx = Math.abs(k) * r;
  const sT = crescente ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
  return `M${cx} ${cy - r} A${r} ${r} 0 0 ${crescente ? 1 : 0} ${cx} ${cy + r} A${rx.toFixed(2)} ${r} 0 0 ${sT} ${cx} ${cy - r}Z`;
}
function horaDoCeu(d = new Date()){ const h = d.getHours() + d.getMinutes() / 60; return h >= 5.5 && h < 8.5 ? 'aurora' : h >= 8.5 && h < 17.5 ? 'dia' : h >= 17.5 && h < 20.5 ? 'ocaso' : 'noite'; }
const HORA_TINTA = {
  aurora: `<linearGradient id="phora" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b4f8f" stop-opacity=".15"/><stop offset=".6" stop-color="#ff9f7a" stop-opacity=".18"/><stop offset=".78" stop-color="#ffc08a" stop-opacity=".42"/><stop offset="1" stop-color="#ff9f7a" stop-opacity="0"/></linearGradient>`,
  dia: `<linearGradient id="phora" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fa8ff" stop-opacity=".22"/><stop offset=".75" stop-color="#bcd4ff" stop-opacity=".26"/><stop offset="1" stop-color="#bcd4ff" stop-opacity="0"/></linearGradient>`,
  ocaso: `<linearGradient id="phora" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a2a6a" stop-opacity=".2"/><stop offset=".65" stop-color="#ff7a3c" stop-opacity=".22"/><stop offset=".78" stop-color="#ff9a4c" stop-opacity=".45"/><stop offset="1" stop-color="#ff7a3c" stop-opacity="0"/></linearGradient>`,
  noite: ''
};
function luaPequena(L){
  const p = caminhoLua(318, 150, 15, L.f);
  return `<g class="lua-real"><circle cx="318" cy="150" r="${(40 + L.ilum * 30).toFixed(0)}" fill="#f3ead2" opacity="${(.025 + L.ilum * .06).toFixed(2)}"/>
    <circle cx="318" cy="150" r="15" fill="#2b3150" opacity=".55"/><path d="${p}" fill="#f6efd8"/></g>`;
}

/* ---------- Palcos (o cenário de cada reino) ---------- */
// Fundo em SVG 400 x 800 (como a capa da Nascente), a base onde ele se senta e os efeitos do canvas.
const SERRA_LONGE = 'M0 600 L40 572 L78 584 L120 540 L160 566 L196 528 L236 560 L276 534 L318 570 L356 546 L400 568 V800 H0Z';
const SERRA_PERTO = 'M0 650 L36 628 L70 640 L112 606 L150 632 L190 618 L232 642 L270 620 L312 646 L356 624 L400 640 V800 H0Z';
function palcoM(r, L = faseLua(diaNumA()), hora = horaDoCeu()){
  const p = Math.min(r, 3);
  const fundo = [
    // 0 · Mortal Desperto: o cume ao anoitecer
    `<defs><linearGradient id="pc0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#110e22"/><stop offset=".42" stop-color="#2a1b3d"/><stop offset=".66" stop-color="#6b3346"/><stop offset=".76" stop-color="#c2683f"/><stop offset=".86" stop-color="#3a1d2a"/><stop offset="1" stop-color="#140c16"/></linearGradient>
      <radialGradient id="ps0"><stop offset="0" stop-color="#ffbe78" stop-opacity=".85"/><stop offset="1" stop-color="#ff8a4c" stop-opacity="0"/></radialGradient></defs>
     <rect width="400" height="800" fill="url(#pc0)"/><ellipse cx="200" cy="610" rx="300" ry="110" fill="url(#ps0)" opacity=".55"/>
     <path d="${SERRA_LONGE}" fill="#3b2442"/><path d="${SERRA_PERTO}" fill="#1d1426"/><rect y="700" width="400" height="100" fill="#120b17"/>`,
    // 1 · Recolha da Luz Estelar: noite, Via Láctea
    `<defs><linearGradient id="pc1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03050c"/><stop offset=".6" stop-color="#0a1026"/><stop offset=".8" stop-color="#18224a"/><stop offset="1" stop-color="#070b18"/></linearGradient>
      <linearGradient id="pv1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8fa6ff" stop-opacity="0"/><stop offset=".5" stop-color="#d8d2ff" stop-opacity=".55"/><stop offset="1" stop-color="#8fa6ff" stop-opacity="0"/></linearGradient>
      <filter id="pf1" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="16"/></filter></defs>
     <rect width="400" height="800" fill="url(#pc1)"/><ellipse cx="200" cy="300" rx="330" ry="46" fill="url(#pv1)" filter="url(#pf1)" transform="rotate(-32 200 300)"/>
     <ellipse cx="200" cy="300" rx="260" ry="14" fill="#fff" opacity=".07" filter="url(#pf1)" transform="rotate(-32 200 300)"/>
     <path d="${SERRA_LONGE}" fill="#101834"/><path d="${SERRA_PERTO}" fill="#0a0f22"/><rect y="700" width="400" height="100" fill="#060914"/>`,
    // 2 · Fundação de Jade: aurora sobre a serra
    `<defs><linearGradient id="pc2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020809"/><stop offset=".55" stop-color="#05201f"/><stop offset=".78" stop-color="#0d3b37"/><stop offset="1" stop-color="#03100f"/></linearGradient></defs>
     <rect width="400" height="800" fill="url(#pc2)"/><path d="${SERRA_LONGE}" fill="#0a2a2a"/><path d="${SERRA_PERTO}" fill="#061a1a"/><rect y="700" width="400" height="100" fill="#031010"/>`,
    // 3 · Núcleo Lunar: acima das nuvens, a lua cheia
    `<defs><linearGradient id="pc3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04060f"/><stop offset=".5" stop-color="#0b1430"/><stop offset="1" stop-color="#1a2a55"/></linearGradient>
      <radialGradient id="pl3" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#fbf5e2"/><stop offset=".7" stop-color="#ddd3b8"/><stop offset="1" stop-color="#b9ae94"/></radialGradient>
      <radialGradient id="pg3"><stop offset=".55" stop-color="#f3ead2" stop-opacity=".35"/><stop offset="1" stop-color="#f3ead2" stop-opacity="0"/></radialGradient>
      <filter id="pf3" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="7"/></filter></defs>
     <rect width="400" height="800" fill="url(#pc3)"/><circle cx="200" cy="330" r="250" fill="url(#pg3)"/>
     <g class="lua-grande"><circle cx="200" cy="330" r="150" fill="#3a4266" opacity=".75"/><clipPath id="pk3"><path d="${caminhoLua(200, 330, 150, L.f)}"/></clipPath><path d="${caminhoLua(200, 330, 150, L.f)}" fill="url(#pl3)"/>
       <g fill="#8d846d" opacity=".22" clip-path="url(#pk3)"><circle cx="150" cy="280" r="26"/><circle cx="240" cy="250" r="14"/><circle cx="262" cy="350" r="34"/><circle cx="170" cy="390" r="18"/><circle cx="215" cy="420" r="10"/><circle cx="120" cy="340" r="9"/></g></g>
     <g class="nuvens n1" filter="url(#pf3)"><path d="M-60 640 C0 600 60 610 110 628 C160 596 230 600 270 626 C320 598 400 606 460 630 V800 H-60Z" fill="#2c3a66" opacity=".9"/></g>
     <g class="nuvens n2" filter="url(#pf3)"><path d="M-60 690 C10 652 80 664 140 682 C200 650 270 660 320 684 C370 660 430 668 460 690 V800 H-60Z" fill="#3a4a7a"/></g>
     <g class="nuvens n3" filter="url(#pf3)"><path d="M-60 740 C20 710 90 718 160 736 C220 708 300 716 350 738 C400 716 440 722 460 740 V800 H-60Z" fill="#56679a"/></g>`
  ][p];
  const rocha = `<path d="M34 -10 C64 -30 116 -36 150 -36 C188 -36 236 -30 266 -10 L280 46 L300 220 H0 L20 50Z" fill="url(#cbR)"/><path d="M34 -10 C64 -30 116 -36 150 -36 C188 -36 236 -30 266 -10" stroke="#fff" stroke-opacity=".14" fill="none"/><path d="M60 40 L92 70 L84 120 M228 30 L210 84 L232 130" stroke="#000" stroke-opacity=".25" fill="none"/>`;
  const base = [
    `<defs><linearGradient id="cbR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3b4f"/><stop offset=".5" stop-color="#22192a"/><stop offset="1" stop-color="#120b17"/></linearGradient></defs>${rocha}`,
    `<defs><linearGradient id="cbR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c3558"/><stop offset=".5" stop-color="#121931"/><stop offset="1" stop-color="#060914"/></linearGradient></defs>${rocha}`,
    `<defs><linearGradient id="cbR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d4a45"/><stop offset=".5" stop-color="#0b2422"/><stop offset="1" stop-color="#031010"/></linearGradient>
      <radialGradient id="cbJ" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#bff0dc"/><stop offset=".5" stop-color="#4fa889"/><stop offset="1" stop-color="#1f5e4f"/></radialGradient></defs>${rocha}
      <ellipse class="jade-brilho" cx="150" cy="10" rx="150" ry="30" fill="#7fd1b4" opacity=".25"/><ellipse cx="150" cy="8" rx="118" ry="19" fill="url(#cbJ)" stroke="#d6fff0" stroke-opacity=".6"/>
      <path d="M150 -8 L188 0 L188 16 L150 24 L112 16 L112 0Z" fill="none" stroke="#eafff6" stroke-opacity=".55"/><ellipse cx="150" cy="8" rx="96" ry="14" fill="none" stroke="#eafff6" stroke-opacity=".3"/>`,
    `<defs><radialGradient id="cbN" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#eef2ff"/><stop offset=".6" stop-color="#a9b6dc"/><stop offset="1" stop-color="#5d6c9c" stop-opacity="0"/></radialGradient></defs>
      <g class="nuvem-base"><ellipse cx="150" cy="22" rx="150" ry="34" fill="url(#cbN)" opacity=".9"/><ellipse cx="96" cy="14" rx="62" ry="24" fill="#f1f4ff" opacity=".75"/><ellipse cx="206" cy="12" rx="70" ry="26" fill="#f1f4ff" opacity=".7"/><ellipse cx="150" cy="4" rx="58" ry="20" fill="#fff" opacity=".8"/></g>`
  ][p];
  const ef = Object.assign({}, [{estrelas: 50, topo: .45, fios: 0, aurora: false}, {estrelas: 240, topo: .75, fios: 7, aurora: false}, {estrelas: 170, topo: .7, fios: 4, aurora: true}, {estrelas: 160, topo: .55, fios: 3, aurora: false}][p]);
  // A lua verdadeira nos palcos de serra e a cor da hora a que abres a app
  let f2 = fundo.replace(/(<rect width="400" height="800" fill="url\(#pc\d\)"\/>)/, m => m + (p < 3 ? luaPequena(L) : '') + (HORA_TINTA[hora] ? `<defs>${HORA_TINTA[hora]}</defs><rect width="400" height="800" fill="url(#phora)"/>` : ''));
  ef.brilho = hora === 'dia' ? .35 : hora === 'noite' ? 1 : .7;
  return {p, hora, fundo: `<svg class="capa-paisagem" viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${f2}</svg>`, base: `<svg class="capa-assento p${p}" viewBox="0 -40 300 260" aria-hidden="true">${base}</svg>`, ef};
}


/* ---------- O cultivador (avatarSVG da Nascente, com os três tesouros) ---------- */
const VISUAL_C = [
  {manto: '#6a5644', manto2: '#4d3d30', orla: '#8f7556', interior: '#d8c5a6', aura: '#e0a26b', qi: '232,170,110', cabelo: '#1c1714'},
  {manto: '#2f7260', manto2: '#205244', orla: '#a6dcc6', interior: '#eef6f1', aura: '#7fd1b4', qi: '160,236,210', cabelo: '#1c1714'},
  {manto: '#21506a', manto2: '#173a4f', orla: '#e3c47e', interior: '#eef4f6', aura: '#86cddd', qi: '175,228,245', cabelo: '#1a1716'},
  {manto: '#ebe3cc', manto2: '#c9bd9a', orla: '#d6a537', interior: '#fffaea', aura: '#f2c35b', qi: '250,210,115', cabelo: '#1f1a18'},
  {manto: '#ece6f6', manto2: '#c3b5de', orla: '#b398e8', interior: '#ffffff', aura: '#c9b6f0', qi: '210,190,250', cabelo: '#2a2530'},
  {manto: '#f6f3ea', manto2: '#d8d1bc', orla: '#e3c47e', interior: '#ffffff', aura: '#fff0c4', qi: '255,240,200', cabelo: '#e9e6ef'},
  {manto: '#fffbf1', manto2: '#eddcb4', orla: '#ffd36a', interior: '#ffffff', aura: '#ffe7a0', qi: '255,232,160', cabelo: '#f2efe8'}
];
function avatarM({r: rm = 0, f = 0, fluxo = 0, mini = false, id = 'a', tes = null, desvio = [], obj = null} = {}){
  const OB = objetosM(obj, id, mini);
  const r = VIS_M[clampA(rm, 0, 8)], V = VISUAL_C[r], pele = '#e2c3a1', peleS = '#c9a483';
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
  const marca = '';
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
  ${correntes}${halo}${OB.tras}
  <g class="c-corpo${flut}">
    ${trono}
    <path d="M128 100 C121 140 117 182 124 206 L176 206 C183 182 179 140 172 100Z" fill="${V.cabelo}"/>${madeixas}
    <path d="M58 300 C56 272 92 254 150 256 C208 254 244 272 242 300 C242 314 205 320 150 318 C95 320 58 314 58 300Z" fill="${V.manto2}"/>
    <path d="M98 292 C120 280 140 283 150 302 M202 292 C180 280 160 283 150 302" stroke="rgba(0,0,0,.18)" stroke-width="1.4" fill="none"/>${tronoFrente}
    <g class="c-respira">
      <path d="M150 146 C126 146 106 152 98 166 C90 182 92 220 96 262 L204 262 C208 220 210 182 202 166 C194 152 174 146 150 146Z" fill="url(#${id}gManto)"/>
      <path d="M138 148 L150 184 L162 148Z" fill="${V.interior}"/>
      <path d="M134 148 L162 206 M166 148 L151 180" stroke="${V.orla}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M100 214 C130 222 170 222 200 214 L201 229 C170 237 130 237 99 229Z" fill="${V.orla}" opacity=".9"/>${OB.frente}
      <path d="M102 164 C80 180 70 226 80 262 C88 280 112 280 132 270 C140 266 146 262 150 258 C134 250 120 232 114 206 C110 190 108 176 102 164Z" fill="url(#${id}gManto)"/>
      <path d="M198 164 C220 180 230 226 220 262 C212 280 188 280 168 270 C160 266 154 262 150 258 C166 250 180 232 186 206 C190 190 192 176 198 164Z" fill="url(#${id}gManto)"/>
      <path d="M102 164 C108 178 110 192 114 206 C120 232 134 250 150 258 M198 164 C192 178 190 192 186 206 C180 232 166 250 150 258" stroke="rgba(0,0,0,.22)" stroke-width="2" fill="none"/>
      <path d="M102 164 C80 180 70 226 80 262 M198 164 C220 180 230 226 220 262" stroke="rgba(255,255,255,.12)" stroke-width="1.5" fill="none"/>
      <path d="M80 262 C88 280 112 280 132 270 M220 262 C212 280 188 280 168 270" stroke="${V.orla}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="150" cy="257" rx="16" ry="7" fill="${pele}"/><path d="M140 254 Q150 246 160 254" stroke="${peleS}" stroke-width="1.4" fill="none"/>
      ${nucleo}
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
      ${dantiansM(id, r, tes, desvio, mini)}
    </g>
  </g>
  ${alma}
</svg>`;
}


