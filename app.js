'use strict';
/* Nascente — o ritual da pele.
   Dados: no próprio dispositivo (localStorage; fotos em IndexedDB). Sincronização opcional com um repositório GitHub privado.
   IA (o Mestre): opcional, com a chave gratuita do Gemini de cada utilizador, guardada só no dispositivo. */

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const LS = {
  get(k, d){ try { const v = localStorage.getItem('nascente.' + k); return v == null ? d : JSON.parse(v); } catch(e){ return d; } },
  set(k, v){ try { localStorage.setItem('nascente.' + k, JSON.stringify(v)); } catch(e){ toast('Sem espaço para guardar no dispositivo.'); } }
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const vibrar = p => { try { navigator.vibrate && navigator.vibrate(p); } catch(e){} };
const inicioDia = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const dataLonga = d => `${DIAS_LONGO[d.getDay()]}${d.getDay() > 0 && d.getDay() < 6 ? '-feira' : ''}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
const dataCurta = k => { const d = deChave(k); return d.getDate() + ' ' + MESES[d.getMonth()].slice(0, 3); };
const mesAno = d => pad(d.getMonth() + 1) + '/' + d.getFullYear();

/* ---------- Ícones ---------- */
const svg = (d, w = 1.6) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC = {
  sol: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  lua: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
  visto: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 2.4), x: svg('<path d="M6 6l12 12M18 6L6 18"/>'), mais: svg('<path d="M12 5v14M5 12h14"/>', 2),
  camara: svg('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>'),
  mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  ia: svg('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>'),
  editar: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'), lixo: svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  alerta: svg('<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/>'), info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>'),
  lupa: svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3"/>'), enviar: svg('<path d="M4 12l16-8-6 16-2.5-6.5z"/>'),
  gota: svg('<path d="M12 3c4 5.5 6.5 9 6.5 12a6.5 6.5 0 0 1-13 0C5.5 12 8 8.5 12 3z"/>'), pausa: svg('<path d="M9 6v12M15 6v12"/>', 2),
  retomar: svg('<path d="M8 5l11 7-11 7z"/>'), foto: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 8"/>'),
  fim: svg('<path d="M6 4h12l-1 4H7z"/><path d="M7 8l1.5 12h7L17 8"/><path d="M10 12l4 4M14 12l-4 4"/>'), estrela: svg('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>')
};
const ICON_FRASCO = {
  doseador: '<path d="M10 3h6M13 3v3"/><rect x="10.5" y="6" width="5" height="2.5" rx=".5"/><path d="M8 8.5h10v11a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2z"/><path d="M8 13h10"/>',
  bisnaga: '<path d="M9 2.5h6v3H9z"/><path d="M8.5 5.5h7l2 15.5h-11z"/><path d="M7 18h10"/>',
  boiao: '<rect x="4" y="9" width="16" height="10.5" rx="3"/><rect x="5" y="5" width="14" height="4" rx="1.5"/><path d="M8 14h8"/>',
  frasco: '<path d="M10 2.5h4v3.5h-4z"/><path d="M8 6h8v14a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z"/><path d="M8 12h8"/>',
  contagotas: '<path d="M11 2.5h2v2h-2z"/><path d="M10 4.5h4v3h-4z"/><path d="M8.5 7.5h7l1 2.5v9.5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2V10z"/><path d="M12 11v4"/>',
  mini: '<path d="M10 3h4v3h-4z"/><path d="M9 6h6l1.5 15h-9z"/>', batom: '<path d="M9 21h6V11H9z"/><path d="M9.5 11V7l5-3v7"/>'
};
const iconeTipo = (tipo, w = 1.4) => svg(ICON_FRASCO[(TIPOS[tipo] || TIPOS.outro)[3]], w);
const LOTUS = `<svg class="grande" viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <defs><linearGradient id="gLot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9fff7"/><stop offset="1" stop-color="#5fb89a"/></linearGradient></defs>
  <ellipse cx="50" cy="82" rx="40" ry="7" stroke="#7fd1b4" stroke-opacity=".35"/><ellipse cx="50" cy="82" rx="26" ry="4.5" stroke="#7fd1b4" stroke-opacity=".5"/>
  <path d="M50 74c-9-6-13-15-13-25 6 4 10 8 13 13 3-5 7-9 13-13 0 10-4 19-13 25z" fill="url(#gLot)" fill-opacity=".25" stroke="url(#gLot)" stroke-width="1.6"/>
  <path d="M50 62c-4-8-4-17 0-28 4 11 4 20 0 28z" fill="url(#gLot)" fill-opacity=".35" stroke="url(#gLot)" stroke-width="1.6"/>
  <path d="M37 49c-8-2-14-1-18 3 4 10 14 17 31 22M63 49c8-2 14-1 18 3-4 10-14 17-31 22" stroke="url(#gLot)" stroke-width="1.6"/>
  <circle cx="50" cy="20" r="1.4" fill="#e3c47e"/><circle cx="30" cy="30" r="1" fill="#e3c47e" opacity=".7"/><circle cx="72" cy="27" r="1.1" fill="#e3c47e" opacity=".7"/></svg>`;
const ASTRO = {
  m: `<svg class="astro" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="28" r="10" fill="#e3c47e" fill-opacity=".25" stroke="#e3c47e" stroke-width="1.6"/><path d="M24 8v5M10 14l3.5 3.5M38 14l-3.5 3.5M5 28h5M38 28h5" stroke="#e3c47e" stroke-width="1.6" stroke-linecap="round"/><rect x="2" y="29" width="44" height="19" fill="#0e2622"/><path d="M6 33h36M12 38h24M18 43h12" stroke="#86cddd" stroke-opacity=".6" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  n: `<svg class="astro" viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M31 9a12 12 0 1 0 8 19A10 10 0 0 1 31 9z" fill="#f3ead2" fill-opacity=".22" stroke="#f3ead2" stroke-width="1.6"/><circle cx="10" cy="10" r="1" fill="#f3ead2"/><circle cx="40" cy="7" r=".8" fill="#f3ead2"/><path d="M4 36h40M10 41h28M16 46h16" stroke="#86cddd" stroke-opacity=".6" stroke-width="1.4" stroke-linecap="round"/></svg>`
};
const COR_NOITE = {ret: 'var(--lua)', exf: 'var(--ouro)', descanso: 'var(--jade)', normal: 'var(--jade)'};
const gotaNoite = n => `<svg class="gota" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c4 5.5 6.5 9 6.5 12a6.5 6.5 0 0 1-13 0C5.5 12 8 8.5 12 3z" fill="${COR_NOITE[n]}" fill-opacity=".28" stroke="${COR_NOITE[n]}" stroke-width="1.5"/></svg>`;
function glifoReino(i){
  const aneis = Array.from({length: Math.min(i + 1, 7)}, (_, k) => `<ellipse cx="32" cy="50" rx="${8 + k * 3.6}" ry="${2 + k * 0.9}" stroke="#7fd1b4" stroke-opacity="${0.75 - k * 0.08}"/>`).join('');
  return `<svg viewBox="0 0 64 64" fill="none" stroke-width="1.3" aria-hidden="true">${aneis}
    <path d="M32 46c-6-4-9-10-9-17 4 3 7 6 9 9 2-3 5-6 9-9 0 7-3 13-9 17z" fill="#e3c47e" fill-opacity="${0.15 + i * 0.1}" stroke="#e3c47e"/>
    <path d="M32 37c-3-6-3-12 0-20 3 8 3 14 0 20z" fill="#e3c47e" fill-opacity="${0.2 + i * 0.1}" stroke="#e3c47e"/>
    ${i >= 3 ? '<circle cx="32" cy="10" r="3" fill="#f6e2ad" fill-opacity=".8"/>' : ''}${i >= 5 ? '<path d="M24 8l-3-3M40 8l3-3M32 3V1" stroke="#f6e2ad"/>' : ''}</svg>`;
}
const MESTRE_FIG = `<svg class="mestre-figura" viewBox="0 0 80 80" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <ellipse cx="40" cy="70" rx="30" ry="5" stroke="#7fd1b4" stroke-opacity=".4"/><ellipse cx="40" cy="70" rx="18" ry="3" stroke="#7fd1b4" stroke-opacity=".6"/>
  <path d="M16 66c2-14 10-24 24-24s22 10 24 24z" fill="#0f2b26" stroke="#7fd1b4" stroke-width="1.5"/>
  <path d="M28 66c2-6 6-9 12-9s10 3 12 9" stroke="#e3c47e" stroke-width="1.3"/>
  <circle cx="40" cy="30" r="9" fill="#0f2b26" stroke="#7fd1b4" stroke-width="1.5"/>
  <path d="M35 30h3M42 30h3M36 37c2 6 6 9 4 13 M44 37c-2 6-6 9-4 13" stroke="#d5ebe4" stroke-width="1.2" opacity=".8"/>
  <path d="M33 22c2-4 12-4 14 0M40 16v5" stroke="#e3c47e" stroke-width="1.5"/>
  <circle cx="40" cy="14" r="2.2" fill="#e3c47e"/>
  <circle cx="14" cy="18" r="1" fill="#e3c47e" opacity=".6"/><circle cx="66" cy="12" r="1.2" fill="#e3c47e" opacity=".6"/><circle cx="62" cy="28" r=".8" fill="#86cddd" opacity=".8"/></svg>`;

/* ---------- Catálogos da pele ---------- */
const PELES = {normal: 'Normal', mista: 'Mista (zona T oleosa)', oleosa: 'Oleosa', seca: 'Seca', sensivel: 'Sensível'};
const PREOCUPACOES = {acne: 'Borbulhas / acne', pontos: 'Pontos negros', oleosidade: 'Oleosidade', poros: 'Poros dilatados', manchas: 'Manchas', vermelhidao: 'Vermelhidão',
  desidratacao: 'Desidratação', rugas: 'Linhas finas', olheiras: 'Olheiras', textura: 'Textura irregular'};
const MEDIDAS = [
  ['geral', 'Estado geral', ['Má', 'Fraca', 'Razoável', 'Boa', 'Ótima'], 'var(--ouro)', 1],
  ['oleo', 'Oleosidade', ['Nenhuma', 'Pouca', 'Média', 'Bastante', 'Muita'], 'var(--agua)', 0],
  ['secura', 'Secura / repuxar', ['Nenhuma', 'Pouca', 'Média', 'Bastante', 'Muita'], 'var(--lua)', 0],
  ['borbulhas', 'Borbulhas', ['Nenhuma', '1 ou 2', 'Algumas', 'Várias', 'Muitas'], 'var(--perigo)', 0],
  ['irritacao', 'Vermelhidão / irritação', ['Nenhuma', 'Ligeira', 'Média', 'Forte', 'Muito forte'], '#f0a8c0', 0]
];
const SINAIS = ['Zona T oleosa', 'Borbulha nova', 'Pontos negros', 'Poros dilatados', 'Descamação', 'Comichão', 'Ardor', 'Manchas', 'Olheiras', 'Pele baça'];
const SLOTS = {
  limpeza: {nome: 'Gel de limpeza', porque: 'Tira a oleosidade, o suor e o protetor do dia. Sem uma boa limpeza, os poros entopem e os outros produtos não atuam.',
    procurar: {oleosa: 'Gel ou espuma de limpeza suave, sem sabão e sem álcool. Se tiveres borbulhas, pode ter ácido salicílico.', mista: 'Gel de limpeza suave, sem sabão, que não deixe a pele a repuxar.',
      seca: 'Creme ou leite de limpeza suave, sem perfume, com ceramidas ou glicerina.', sensivel: 'Limpeza muito suave, sem perfume e sem álcool (creme de limpeza ou água micelar para pele sensível).', normal: 'Gel de limpeza suave, sem sabão.'},
    pesquisa: {oleosa: 'gel de limpeza pele oleosa', mista: 'gel de limpeza suave pele mista', seca: 'creme de limpeza pele seca', sensivel: 'limpeza rosto pele sensível sem perfume', normal: 'gel de limpeza suave rosto'}},
  hidratante: {nome: 'Hidratante', porque: 'Repõe a água e protege a barreira da pele. Mesmo a pele oleosa precisa: sem hidratação, produz ainda mais oleosidade.',
    procurar: {oleosa: 'Gel-creme leve, não comedogénico, sem óleos pesados. Niacinamida ou ácido hialurónico são uma vantagem.', mista: 'Creme leve ou gel-creme, não comedogénico, com ácido hialurónico ou ceramidas.',
      seca: 'Creme rico com ceramidas, glicerina, manteiga de karité ou ureia.', sensivel: 'Creme sem perfume, com ceramidas e calmantes (pantenol, centella asiática).', normal: 'Creme leve com ceramidas e ácido hialurónico.'},
    pesquisa: {oleosa: 'hidratante gel pele oleosa não comedogénico', mista: 'hidratante leve pele mista', seca: 'creme hidratante ceramidas pele seca', sensivel: 'creme hidratante pele sensível sem perfume', normal: 'creme hidratante rosto ceramidas'}},
  protetor: {nome: 'Protetor solar', porque: 'O sol é a principal causa de manchas e de envelhecimento, e escurece as marcas das borbulhas. Com retinoides, ácidos ou vitamina C é obrigatório.',
    procurar: {oleosa: 'SPF 50, largo espectro (UVA e UVB), fluido de toque seco ou matificante.', mista: 'SPF 50, largo espectro (UVA e UVB), textura fluida e leve.',
      seca: 'SPF 50, largo espectro (UVA e UVB), em creme hidratante.', sensivel: 'SPF 50 para pele sensível, sem perfume (os filtros minerais são boa opção).', normal: 'SPF 50, largo espectro (UVA e UVB), textura fluida.'},
    pesquisa: {oleosa: 'protetor solar facial spf 50 pele oleosa toque seco', mista: 'protetor solar facial spf 50 fluido', seca: 'protetor solar facial spf 50 hidratante', sensivel: 'protetor solar facial spf 50 pele sensível', normal: 'protetor solar facial spf 50 fluido'}}
};
Object.assign(SLOTS, {
  serumDia: {nome: 'Sérum de dia', rec: true, icone: 'serum', porque: 'Trata a pele durante o dia (oleosidade, manchas, borbulhas) e reforça a proteção do protetor solar.'},
  ativoNoite: {nome: 'Tratamento de noite', rec: true, icone: 'tratamento', porque: 'É à noite que a pele se renova: é aqui que entram os ativos mais fortes, como o retinol ou os ácidos.'},
  reparador: {nome: 'Sérum reparador', rec: true, icone: 'serum', porque: 'Acalma e reconstrói a barreira da pele. É o que torna os ativos fortes suportáveis e o passo principal das noites de repouso.'},
  olhos: {nome: 'Contorno de olhos', rec: true, icone: 'olhos', porque: 'A pele à volta dos olhos é mais fina e precisa de um produto próprio.'}
});
function procurarLugar(slot, ctx){
  const tem = c => (ctx.sel.precisa[c] || 0) > 0, tp = PELES[cfg.pele] ? cfg.pele : 'normal';
  if (SLOTS[slot].procurar) return [SLOTS[slot].procurar[tp], SLOTS[slot].pesquisa[tp]];
  if (slot === 'serumDia'){
    if (tem('manchas') || tem('rugas')) return ['Sérum de vitamina C (10 a 15%), de manhã, antes do hidratante e do protetor.', 'sérum vitamina c 15% rosto'];
    if (tem('acne') || tem('oleosidade') || tem('poros') || tem('vermelhidao')) return ['Sérum de niacinamida (5 a 10%): controla a oleosidade, aperta os poros e acalma as borbulhas.', 'sérum niacinamida 10%'];
    return ['Sérum de ácido hialurónico, aplicado com a pele ainda húmida.', 'sérum ácido hialurónico'];
  }
  if (slot === 'ativoNoite'){
    if (tem('acne')) return ['Retinol (0,2 a 0,3%) ou ácido salicílico (BHA) 2%. Começa com 2 noites por semana; o adapaleno também resulta, mas precisa de receita.', 'sérum retinol 0,3% borbulhas'];
    if (tem('pontos') || tem('poros') || tem('oleosidade')) return ['Ácido salicílico (BHA) a 2%, 2 a 3 noites por semana.', 'ácido salicílico 2% bha'];
    if (tem('manchas') || tem('rugas')) return ['Retinol (0,2 a 0,5%), a começar devagar.', 'sérum retinol 0,3%'];
    return ['Esfoliante suave com AHA (ácido láctico ou glicólico), 1 a 2 noites por semana.', 'esfoliante ácido láctico rosto'];
  }
  if (slot === 'reparador') return ['Sérum sem perfume com pantenol (vitamina B5), ceramidas, centella asiática ou ácido hialurónico.', 'sérum reparador pantenol b5'];
  return ['Contorno de olhos com cafeína, vitamina C ou péptidos.', 'contorno de olhos cafeína'];
}
const PREOC_PROCURAR = {
  acne: ['Um tratamento para borbulhas: ácido salicílico (BHA) 2%, peróxido de benzoílo 2,5 a 5%, ácido azelaico ou adapaleno.', 'tratamento borbulhas ácido salicílico'],
  pontos: ['Ácido salicílico (BHA) a 2%, 2 a 3 noites por semana.', 'ácido salicílico 2% bha'],
  oleosidade: ['Sérum de niacinamida (5 a 10%) ou um hidratante matificante.', 'sérum niacinamida 10%'],
  poros: ['Niacinamida ou ácido salicílico (BHA).', 'sérum niacinamida poros'],
  manchas: ['Vitamina C de manhã, ou ácido azelaico, niacinamida ou ácido tranexâmico. E protetor solar todos os dias.', 'sérum vitamina c rosto'],
  vermelhidao: ['Um calmante (centella asiática, pantenol) ou ácido azelaico. Evita perfume e álcool.', 'sérum calmante centella'],
  desidratacao: ['Sérum de ácido hialurónico ou um hidratante com ceramidas.', 'sérum ácido hialurónico'],
  rugas: ['Retinol à noite (a começar devagar) e protetor solar todos os dias.', 'sérum retinol 0,2%'],
  olheiras: ['Contorno de olhos com cafeína, vitamina C ou péptidos.', 'contorno de olhos cafeína'],
  textura: ['Esfoliante químico suave (AHA ou PHA), 1 a 2 noites por semana.', 'esfoliante ácido láctico rosto']
};
const SESS_TXT = ss => ss.length === 2 ? 'manhã e noite' : ss[0] === 'm' ? 'manhã' : 'noite';
const VER_COMPRA = {sim: ['Serve-te', 'sim'], nao: ['Não é para ti', 'nao'], talvez: ['Talvez', 'talvez']};
const VEREDICTOS = {essencial: ['Essencial', ''], util: ['Útil', 'agua'], dispensavel: ['Dispensável', 'apagado'], evitar: ['Evitar', 'perigo']};

/* ---------- Estado ---------- */
let cfg = Object.assign({nome: '', pele: '', sensivel: false, preocupacoes: [], exf: 0, retFixo: 0, retInicio: '', horaNoite: 15, chave: '', modelo: 'gemini-flash-latest', capa: true, pronto: false, ts: 0}, LS.get('cfg', {}));
let produtos = LS.get('produtos', []);
let apagados = LS.get('apagados', {});
let registos = LS.get('registos', {});
let pele = LS.get('pele', []);
let conversa = LS.get('conversa', []);
let revisao = LS.get('revisao', null);
let avaliacao = LS.get('avaliacao', null);
let compras = LS.get('compras', []);
let respiracao = LS.get('respiracao', []);
let gh = LS.get('gh', {dono: '', repo: '', token: ''});
let sync = LS.get('sync', {sha: '', sujo: 0, ultimo: 0, erro: ''});
const fotos = {}; // id -> dataURL (cópia em memória do IndexedDB)
const PARTILHADO = ['nome', 'pele', 'sensivel', 'preocupacoes', 'exf', 'retFixo', 'retInicio', 'horaNoite'];
function guardarCfg(partilhado){ if (partilhado){ cfg.ts = Date.now(); marcarSujo(); } LS.set('cfg', cfg); }
function guardarProdutos(){ LS.set('produtos', produtos); LS.set('apagados', apagados); marcarSujo(); }
function guardarRegistos(){ LS.set('registos', registos); marcarSujo(); }
function guardarPele(){ LS.set('pele', pele); LS.set('apagados', apagados); marcarSujo(); }

let vista = 'vRitual', ritualSel = null, passoAberto = null, rascunho = null, peleForm = null, grafDias = 30, grafMedidas = ['geral', 'borbulhas', 'oleo'];

/* ---------- Utilitários ---------- */
function toast(t, ms = 2800){
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d);
  setTimeout(() => d.remove(), ms);
}
let folhaAtual = '';
function abrirFolha(html, nome = ''){ folhaAtual = nome; const c = $('#folhaCaixa'); c.innerHTML = '<div class="pega"></div>' + html; c.scrollTop = 0; $('#folha').hidden = false; document.body.style.overflow = 'hidden'; }
function fecharFolha(){ if (folhaAtual === 'ia') cancelarIA(); $('#folha').hidden = true; document.body.style.overflow = ''; folhaAtual = ''; }
const cab = (titulo, extra = '') => `<div class="cab">${extra}<h2>${titulo}</h2><button class="btn fantasma peq-btn" data-acao="fecharFolha">Fechar</button></div>`;
const chip = (on, acao, v, txt) => `<span class="chip${on ? ' on' : ''}" data-acao="${acao}" data-v="${esc(v)}">${txt}</span>`;
const aMeditar = txt => `<div class="a-meditar"><svg viewBox="0 0 120 90" fill="none"><path class="gota-cai" d="M60 8c4 6 6 9 6 12a6 6 0 0 1-12 0c0-3 2-6 6-12z" fill="#7fd1b4" fill-opacity=".5" stroke="#bff0dc" stroke-width="1.2"/>
  <ellipse class="anel" cx="60" cy="72" rx="44" ry="9" stroke="#7fd1b4" stroke-width="1.4"/><ellipse class="anel b" cx="60" cy="72" rx="28" ry="6" stroke="#bff0dc" stroke-width="1.2"/><path d="M8 72h104" stroke="#7fd1b4" stroke-opacity=".2"/></svg>
  <p class="suave serifa" style="font-size:19px;margin:0">${txt}</p><button class="btn fantasma peq-btn" data-acao="fecharFolha">Cancelar</button></div>`;
const miniFoto = p => fotos[p.id] ? `<img class="mini-foto" src="${fotos[p.id]}" alt="">` : `<span class="mini-foto">${iconeTipo(p.tipo)}</span>`;
const nomeP = p => esc(p.nome || 'Sem nome');
const tipoCurto = t => (TIPOS[t] || TIPOS.outro)[0].split(/ [\/(]/)[0];
const ativosTags = p => ativosDe(p).map(a => `<span class="tag ${ehRet({tipo: 'serum', ativos: [a]}) ? 'lua' : EXF.has(a) ? 'ouro' : 'agua'}">${esc(ATIVO_CURTO[a] || a)}</span>`).join('');
function mdLeve(txt){
  const linhas = esc(txt).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').split(/\n/), out = []; let lista = false;
  for (const l of linhas){
    const m = l.match(/^\s*[-•*]\s+(.*)/);
    if (m){ if (!lista){ out.push('<ul>'); lista = true; } out.push('<li>' + m[1] + '</li>'); continue; }
    if (lista){ out.push('</ul>'); lista = false; }
    if (l.trim()) out.push('<p>' + l + '</p>');
  }
  if (lista) out.push('</ul>');
  return out.join('');
}
const temIA = () => !!(cfg.chave || IA.temGroq());
const procurarURL = q => 'https://www.google.com/search?q=' + encodeURIComponent(q + ' comprar preço Portugal');

/* ---------- Contexto da rotina ---------- */
let selAtual = null;
function contexto(){
  const fila = calcularFila(produtos), hoje = inicioDia(new Date()), hk = diaChave(hoje);
  const sel = escolherRotina(fila.uso, cfg, pele, hoje); let mud = false;
  // Datas de entrada e saída da rotina (o Mestre usa-as para ver o que resulta).
  for (const p of produtos){
    if (p.fim) continue;
    const dentro = sel.rotina.includes(p);
    if (dentro && !p.naRotina){ p.naRotina = true; if (!p.inicio || p.saida) p.inicio = hk; delete p.saida; mud = true; }
    else if (!dentro && p.naRotina){ p.naRotina = false; p.saida = hk; mud = true; }
  }
  if (mud) LS.set('produtos', produtos);
  if (sel.rotina.some(ehRet)){ if (!cfg.retInicio){ cfg.retInicio = hk; guardarCfg(true); } }
  else if (cfg.retInicio){ cfg.retInicio = ''; guardarCfg(true); }
  selAtual = sel;
  const ctx = {uso: sel.rotina, fila: fila.uso, espera: fila.espera, sel, cfg, pele, hoje};
  ctx.plano = planoSemana(ctx);
  return ctx;
}
// Passos de um ritual com os lugares em falta da rotina base, cada um na sua posição.
function passosDoDia(data, s, ctx){
  const r = registos[diaChave(data)] || {}, se = sessao(data, s, ctx, ctx.plano);
  const tirar = new Set((r.tirar || {})[s] || []), extra = ((r.extra || {})[s] || []).map(id => produtos.find(p => p.id === id)).filter(Boolean);
  const passos = se.passos.filter(p => !tirar.has(p.id));
  for (const p of extra) if (!passos.includes(p)) passos.push(p);
  passos.sort((a, b) => ordemDe(a) - ordemDe(b));
  return Object.assign({}, se, {passos, extras: new Set(extra.map(p => p.id)), tirados: se.passos.filter(p => tirar.has(p.id))});
}
function comFaltas(se, s, ctx){
  const fs = [...ctx.sel.faltas.map(f => Object.assign({rec: false}, f)), ...ctx.sel.rec.map(f => Object.assign({rec: true}, f))]
    .filter(f => f.sessoes.includes(s)).map(f => ({falta: f.slot, rec: f.rec, ord: LUGAR[f.slot].ord}));
  return [...se.passos.map(p => ({p, ord: ordemDe(p)})), ...fs].sort((a, b) => a.ord - b.ord);
}
const passoFalta = (slot, i, rec) => `<div class="passo falta${rec ? ' rec' : ''}" data-acao="verFalta" data-v="${slot}"><span class="n">${i + 1}</span><span class="mini-foto">${iconeTipo(SLOTS[slot].icone || slot)}</span>
  <div class="t"><b>${rec ? 'Recomendado' : 'Falta'}: ${esc(SLOTS[slot].nome)}</b><span>Toca para saber o que procurar</span></div><span class="marcar vazio">${IC.mais}</span></div>`;

function agoraRitual(){
  const d = new Date(), h = d.getHours();
  if (h < 5){ d.setDate(d.getDate() - 1); return {data: inicioDia(d), s: 'n'}; }
  return {data: inicioDia(d), s: h >= (+cfg.horaNoite || 15) ? 'n' : 'm'};
}
const pontos = () => Object.values(registos).reduce((s, r) => s + (r.mF ? 1 : 0) + (r.nF ? 1 : 0), 0);
function sequencia(){
  const d = inicioDia(new Date()); let n = 0;
  const feito = k => registos[k] && (registos[k].mF || registos[k].nF);
  if (!feito(diaChave(d))) d.setDate(d.getDate() - 1);
  while (feito(diaChave(d))){ n++; d.setDate(d.getDate() - 1); }
  return n;
}
function dataDaSemana(dow){ const d = inicioDia(new Date()), atual = (d.getDay() + 6) % 7, alvo = (dow + 6) % 7; d.setDate(d.getDate() - atual + alvo); return d; }

/* ---------- Vista: Ritual ---------- */
function resumoPasso(p){ return [tipoCurto(p.tipo), p.qtd].filter(Boolean).map(esc).join(' · '); }
function infoPasso(p, ctx, extra){
  const v = validadeDe(p);
  return `<div class="mais-info">${p.funcao ? `<span>${esc(p.funcao)}</span>` : ''}
    <span><b>Como:</b> ${esc(modoPadrao(p))}</span>
    ${p.qtd ? `<span><b>Quantidade:</b> ${esc(p.qtd)}</span>` : ''}${p.espera ? `<span><b>Espera:</b> ${esc(p.espera)}</span>` : ''}
    ${p.aviso ? `<span><b>Atenção:</b> ${esc(p.aviso)}</span>` : ''}${v ? `<span class="suave mini">Validade: ${mesAno(v)}</span>` : ''}
    <span class="linha"><button class="btn fantasma peq-btn" data-acao="verFrasco" data-id="${p.id}" style="padding:0">Ver frasco ${IC.lupa}</button>${extra ? `<button class="btn fantasma peq-btn" data-acao="tirarExtra" data-id="${p.id}" data-dia="${extra.dia}" data-s="${extra.s}" style="padding:0;color:var(--perigo)">Tirar de hoje</button>` : ''}</span></div>`;
}
const TEXTO_NOITE = {
  ret: 'Retinoide esta noite. Aplica com a pele bem seca e não uses esfoliantes.',
  exf: 'Esfoliação esta noite. Hoje nada de retinoide: a pele precisa de calma depois.',
  descanso: 'Noite de repouso: só limpar, hidratar e acalmar. É aqui que a barreira se reconstrói.',
  normal: 'Limpar, tratar e hidratar antes de dormir.'
};
function blocoRitual(ctx){
  const a = agoraRitual(), s = ritualSel || a.s, data = a.data, k = diaChave(data);
  const se = passosDoDia(data, s, ctx), reg = registos[k] || {}, feitos = reg[s] || {};
  const titulo = s === 'm' ? 'Ritual da Aurora' : NOITES[se.noite][0];
  const sub = s === 'm' ? 'Limpar, proteger e preparar o dia.' + (ctx.uso.some(p => p.tipo === 'protetor') ? ' O protetor é sempre o último.' : '') : TEXTO_NOITE[se.noite];
  const nFeitos = se.passos.filter(p => feitos[p.id]).length, completo = se.passos.length && nFeitos === se.passos.length;
  const itens = comFaltas(se, s, ctx);
  const passos = itens.map(({p, falta, rec}, i) => falta ? passoFalta(falta, i, rec) : `<div class="passo${feitos[p.id] ? ' feito' : ''}" data-acao="abrirPasso" data-id="${p.id}">
      <span class="n">${i + 1}</span>${miniFoto(p)}<div class="t"><b>${nomeP(p)}</b><span>${resumoPasso(p)}${se.extras.has(p.id) ? ' <span class="tag agua">só hoje</span>' : ''}</span></div>
      <button class="marcar" data-acao="marcarPasso" data-id="${p.id}" data-dia="${k}" data-s="${s}" aria-label="Feito">${IC.visto}</button>
      ${passoAberto === p.id ? infoPasso(p, ctx, se.extras.has(p.id) ? {dia: k, s} : null) : ''}</div>`).join('');
  return `<div class="abas">
      <button class="${s === 'm' ? 'on' : ''}" data-acao="ritualSel" data-v="m">${IC.sol} Aurora</button>
      <button class="${s === 'n' ? 'on' : ''}" data-acao="ritualSel" data-v="n">${IC.lua} Lua</button></div>
    <div class="placa">
      <div class="cab-ritual">${ASTRO[s]}<div class="cresce"><h2>${titulo}</h2><span class="suave peq">${esc(sub)}</span></div></div>
      ${itens.length ? `<div class="passos">${passos}</div>` : `<p class="suave centro" style="padding:12px 0">Nada para este ritual. Água fresca e descansa.</p>`}
      ${completo ? `<div class="completo"><b>Ritual completo</b><span class="suave peq">O teu qi fluiu. Mais um passo no caminho.</span></div>`
        : se.passos.length ? `<div class="linha entre" style="margin-top:8px"><span class="suave mini">${nFeitos} de ${se.passos.length} passos</span><button class="btn fantasma peq-btn" data-acao="marcarTudo" data-dia="${k}" data-s="${s}">Marcar tudo</button></div>` : ''}
      ${se.tirados.length ? `<p class="suave mini" style="margin:6px 0 0">Hoje sem ${se.tirados.map(p => esc(p.nome)).join(', ')}. <button class="btn fantasma peq-btn" data-acao="reporHoje" data-dia="${k}" data-s="${s}" style="min-height:0;padding:0 4px">Repor</button></p>` : ''}
      <button class="btn largo" data-acao="addHoje" data-dia="${k}" data-s="${s}" style="margin-top:10px">${IC.mais} Usar outro produto hoje</button>
    </div>`;
}
function blocoAvisos(ctx){
  const av = [], hoje = ctx.hoje;
  const fl = ctx.sel.faltas;
  if (fl.length) av.push(`<div class="alerta">${IC.alerta}<div class="cresce"><b>A tua rotina base está incompleta.</b> Falta: ${fl.map(f => `${esc(SLOTS[f.slot].nome.toLowerCase())} (${SESS_TXT(f.sessoes)})`).join(', ')}.
    <div class="botoes" style="margin-top:8px">${fl.map(f => `<button class="btn peq-btn" data-acao="verFalta" data-v="${f.slot}">${esc(SLOTS[f.slot].nome)}</button>`).join('')}</div></div></div>`);
  const rc = ctx.sel.rec;
  if (rc.length) av.push(`<div class="alerta info">${IC.info}<div class="cresce"><b>Para o ritual ficar completo</b>, recomendo: ${rc.map(f => `${esc(SLOTS[f.slot].nome.toLowerCase())} (${SESS_TXT(f.sessoes)})`).join(', ')}.
    <div class="botoes" style="margin-top:8px">${rc.map(f => `<button class="btn peq-btn" data-acao="verFalta" data-v="${f.slot}">${esc(SLOTS[f.slot].nome)}</button>`).join('')}</div></div></div>`);
  if (!Object.keys(ctx.sel.precisa).length && ctx.sel.fora.length) av.push(`<div class="alerta info" data-acao="irPerfil">${IC.info}<div>Não marcaste nada que te preocupe, por isso o ritual fica só com o essencial e ${ctx.sel.fora.length} frascos ficam de fora. Toca para marcares no Perfil o que queres tratar.</div></div>`);
  for (const p of [...ctx.uso, ...ctx.espera.map(e => e.p)]){
    const v = validadeDe(p); if (!v) continue;
    if (v < hoje) av.push(`<div class="alerta perigo" data-acao="verFrasco" data-id="${p.id}">${IC.alerta}<div>${nomeP(p)} passou da validade (${mesAno(v)}). Deita-o fora e marca como acabado.</div></div>`);
    else if (v - hoje < 30 * DIA) av.push(`<div class="alerta" data-acao="verFrasco" data-id="${p.id}">${IC.alerta}<div>${nomeP(p)} perde a validade em ${mesAno(v)}. Usa-o primeiro.</div></div>`);
  }
  for (const n of ctx.plano.notas) av.push(`<div class="alerta info">${IC.info}<div>${esc(n)}</div></div>`);
  return av.length ? `<div class="col">${av.join('')}</div>` : '';
}
function blocoSemana(ctx){
  const hojeK = diaChave(ctx.hoje), pl = ctx.plano;
  const dias = SEMANA.map(d => { const dt = dataDaSemana(d), k = diaChave(dt), r = registos[k] || {};
    return `<div class="dia${k === hojeK ? ' hoje' : ''}" data-acao="verDia" data-v="${d}"><small>${DIAS_CURTO[d]}</small>${gotaNoite(pl.noites[d])}<span class="feitos"><i class="${r.mF ? 'on' : ''}"></i><i class="${r.nF ? 'on' : ''}"></i></span></div>`; }).join('');
  const tem = t => pl.noites.includes(t);
  return `<div class="placa"><h2>A tua semana</h2><div class="semana">${dias}</div>
    <div class="legenda" style="margin-top:10px">${tem('ret') ? `<span><i style="background:var(--lua)"></i>Renovação (retinoide)</span>` : ''}${tem('exf') ? `<span><i style="background:var(--ouro)"></i>Purificação (esfoliação)</span>` : ''}
      <span><i style="background:var(--jade)"></i>${tem('ret') || tem('exf') ? 'Repouso' : 'Ritual normal'}</span><span><i style="background:var(--jade);box-shadow:0 0 5px var(--jade)"></i>manhã · noite feitas</span></div></div>`;
}
/* ---------- Histórico: o que usaste em cada dia ---------- */
const nomeUsado = (r, id) => (r.nomes || {})[id] || (produtos.find(p => p.id === id) || {}).nome || 'Produto apagado';
function usadosEm(r, s){ const f = r[s] || {}; return Object.keys(f).sort((a, b) => f[a] - f[b]).map(id => ({id, nome: nomeUsado(r, id), extra: ((r.extra || {})[s] || []).includes(id)})); }
const diasComHistorico = () => Object.keys(registos).filter(k => usadosEm(registos[k], 'm').length || usadosEm(registos[k], 'n').length).sort().reverse();
function rotuloDia(k){
  const h = inicioDia(new Date()), d = deChave(k), dif = Math.round((h - d) / DIA);
  return dif === 0 ? 'Hoje' : dif === 1 ? 'Ontem' : `${DIAS_CURTO[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`;
}
function linhaHistorico(k, completo){
  const r = registos[k], lst = s => { const u = usadosEm(r, s); return u.length ? u.map(x => esc(x.nome) + (x.extra ? ' <span class="tag agua">só neste dia</span>' : '')).join(completo ? '<br>' : ', ') : '<span class="apagado">nada registado</span>'; };
  const pl = pele.find(x => x.d === k);
  return `<div class="hist-dia"><div class="linha entre"><b>${rotuloDia(k)}</b><span class="mini suave">${r.mF ? 'manhã completa' : ''}${r.mF && r.nF ? ' · ' : ''}${r.nF ? 'noite completa' : ''}</span></div>
    <div class="hist-sess"><span class="hist-ic" style="color:var(--ouro)">${IC.sol}</span><div>${lst('m')}</div></div>
    <div class="hist-sess"><span class="hist-ic" style="color:var(--lua)">${IC.lua}</span><div>${lst('n')}</div></div>
    ${completo && pl ? `<div class="mini suave" style="margin-top:4px">Pele: ${esc(MEDIDAS[0][2][medidaVal(pl, 'geral')].toLowerCase())}${pl.nota ? ' · ' + esc(pl.nota) : ''}</div>` : ''}</div>`;
}
function blocoHistorico(){
  const ds = diasComHistorico(); if (!ds.length) return '';
  return `<div class="placa col"><h2>Histórico</h2><p class="suave peq" style="margin:0">O que usaste em cada dia, pela ordem em que marcaste.</p>
    <div class="lista">${ds.slice(0, 4).map(k => linhaHistorico(k, false)).join('')}</div>
    ${ds.length > 4 ? `<button class="btn" data-acao="verHistorico">Ver todo o histórico (${ds.length} dias)</button>` : ''}</div>`;
}
function folhaHistorico(){
  const ds = diasComHistorico(); let mes = '', html = '';
  for (const k of ds){ const m = k.slice(0, 7); if (m !== mes){ mes = m; const d = deChave(k); html += `<h3 style="margin:10px 0 0">${MESES[d.getMonth()]} ${d.getFullYear()}</h3>`; } html += linhaHistorico(k, true); }
  abrirFolha(`${cab('Histórico')}<p class="suave peq" style="margin:0">Cada dia, de manhã e à noite, o que marcaste como feito.</p><div class="lista">${html || '<p class="suave">Ainda não há registos.</p>'}</div>`, 'historico');
}
// Escolher um produto da lista para usar só neste dia.
function folhaAddHoje(k, s){
  const ctx = contexto(), se = passosDoDia(deChave(k), s, ctx), ja = new Set(se.passos.map(p => p.id));
  const disp = produtos.filter(p => !p.fim && !ja.has(p.id));
  const grupo = (titulo, l, sub) => l.length ? `<h3 style="margin:6px 0 0">${titulo}</h3><div class="lista">${l.map(p => { const c = se.passos.find(o => conflitoEntre(o, p));
    return `<div class="item" data-acao="escolherHoje" data-id="${p.id}" data-dia="${k}" data-s="${s}">${miniFoto(p)}<div class="t"><b>${nomeP(p)}</b><span>${esc(sub(p))}</span></div>${c ? '<span class="tag aviso">não combina</span>' : ''}</div>`; }).join('')}</div>` : '';
  const foraM = new Map(ctx.sel.fora.map(f => [f.p, f.motivo])), esp = new Set(ctx.espera.map(e => e.p));
  abrirFolha(`${cab(s === 'm' ? 'Usar hoje de manhã' : 'Usar hoje à noite')}<p class="suave peq" style="margin:0">Escolhe um dos teus frascos. Entra no ritual só ${k === diaChave(inicioDia(new Date())) ? 'hoje' : 'neste dia'}, no passo certo; amanhã volta tudo ao normal.</p>
    ${grupo('Da tua rotina, noutros momentos', disp.filter(p => ctx.uso.includes(p)), p => tipoCurto(p.tipo) + ' · ' + quandoTexto(p, ctx, ctx.plano).texto)}
    ${grupo('Fora da rotina', disp.filter(p => foraM.has(p)), p => tipoCurto(p.tipo))}
    ${grupo('Em espera, em pausa e outros', disp.filter(p => !ctx.uso.includes(p) && !foraM.has(p)), p => tipoCurto(p.tipo) + (esp.has(p) ? ' · em espera' : p.pausa ? ' · em pausa' : ''))}
    ${!disp.length ? '<p class="suave">Todos os teus frascos já estão neste ritual.</p>' : ''}`, 'addHoje');
}
function folhaConflitoHoje(p, k, s){
  const ctx = contexto(), se = passosDoDia(deChave(k), s, ctx), cs = se.passos.filter(o => conflitoEntre(o, p));
  const solManha = s === 'm' && (ehRet(p) || ehExf(p));
  abrirFolha(`${cab(nomeP(p))}
    ${cs.map(o => { const c = conflitoEntre(o, p); return `<div class="alerta${c[2] === 'evitar' ? ' perigo' : ''}">${IC.alerta}<div><b>Não combina com ${esc(o.nome)}.</b> ${esc(c[3])}</div></div>`; }).join('')}
    ${solManha ? `<div class="alerta">${IC.alerta}<div>De manhã, este ativo deixa a pele mais sensível ao sol. Usa protetor e reaplica se estiveres ao sol.</div></div>` : ''}
    <div class="col">${cs.length ? `<button class="btn jade" data-acao="trocarHoje" data-id="${p.id}" data-dia="${k}" data-s="${s}">Usar em vez de ${esc(cs.map(o => o.nome).join(' e '))}</button>
      <button class="btn" data-acao="juntarHoje" data-id="${p.id}" data-dia="${k}" data-s="${s}">Juntar na mesma</button>` : `<button class="btn jade" data-acao="juntarHoje" data-id="${p.id}" data-dia="${k}" data-s="${s}">Usar hoje</button>`}
      <button class="btn fantasma" data-acao="addHoje" data-dia="${k}" data-s="${s}">Escolher outro</button></div>`, 'addHoje');
}
function blocoPares(ctx){
  const pares = paresIncompativeis(ctx, ctx.plano); if (!pares.length) return '';
  return `<details class="placa"><summary class="linha entre"><h2 style="margin:0">O que não vai junto <span class="suave peq">(${pares.length})</span></h2>${pares.some(x => x.juntos) ? '<span class="tag perigo">rever</span>' : '<span class="tag">resolvido</span>'}</summary><p class="suave peq" style="margin:10px 0 0">Já separei estes pares no teu plano. Toca para ver porquê.</p>
    ${pares.map(x => `<div class="par"><b>${nomeP(x.a)}</b> <span class="suave">+</span> <b>${nomeP(x.b)}</b>${x.gravidade === 'evitar' ? ' <span class="tag perigo">evitar</span>' : ' <span class="tag aviso">cuidado</span>'}
      <div class="suave">${esc(x.porque)}</div><div class="mini" style="margin-top:3px;color:${x.juntos ? 'var(--perigo)' : 'var(--jade)'}">${x.juntos ? 'Atenção: coincidem num ritual.' : `Separados: ${esc(x.a.nome)} ${esc(x.qa)}; ${esc(x.b.nome)} ${esc(x.qb)}.`}</div></div>`).join('')}</details>`;
}
function blocoBoasVindas(){
  return `<div class="placa col"><h2>Bem-vindo à Nascente</h2>
    <p class="suave peq" style="margin:0">Conta-me como é a tua pele. Depois fotografa os teus frascos: eu digo-te quais usar, quando, por que ordem e o que não deves misturar.</p>
    <label class="campo">Como te chamas?<input type="text" id="bNome" value="${esc(cfg.nome)}" autocomplete="given-name"></label>
    <div><h3>Tipo de pele</h3><div class="chips">${Object.entries(PELES).map(([k, n]) => chip(cfg.pele === k, 'pPele', k, n)).join('')}</div></div>
    <div><h3>O que te preocupa</h3><div class="chips">${Object.entries(PREOCUPACOES).map(([k, n]) => chip(cfg.preocupacoes.includes(k), 'pPreoc', k, n)).join('')}</div></div>
    <button class="btn jade" data-acao="comecar">Começar o caminho</button></div>`;
}
function rRitual(){
  const ctx = contexto(), agora = new Date(), h = agora.getHours();
  const ola = h >= 5 && h < 12 ? 'Bom dia' : h >= 12 && h < 20 ? 'Boa tarde' : 'Boa noite';
  let html = `<div class="saudacao"><div><span>${dataLonga(agora)}</span><b>${ola}${cfg.nome ? ', ' + esc(cfg.nome) : ''}</b></div></div>`;
  if (!cfg.pronto) html += blocoBoasVindas();
  else if (!produtos.length) html += `<div class="placa vazio">${LOTUS}<h2 style="padding:0">O teu ritual começa aqui</h2><p class="suave">Fotografa os cremes, séruns e esfoliantes que tens. O Mestre lê cada rótulo e monta o teu ritual de manhã e de noite.</p>
      <button class="btn jade" data-acao="fotografar">${IC.camara} Fotografar o primeiro frasco</button><button class="btn fantasma peq-btn" data-acao="novoManual">Ou adicionar à mão</button></div>`;
  else html += blocoRitual(ctx) + ((ritualSel || agoraRitual().s) === 'n' ? blocoAntesDormir() : '') + blocoAvisos(ctx) + blocoSemana(ctx) + blocoHistorico() + blocoPares(ctx);
  $('#vRitual').innerHTML = html;
  atualizarTopo();
}
function atualizarTopo(){ const R = retratoMirante(), sh = shenHoje(); $('#reinoTopo').textContent = cfg.pronto ? 'Shen ' + sh.total + '/10' + (R ? ' · ' + R.reino : '') : ''; }
function folhaDia(dow){
  const ctx = contexto(), dt = dataDaSemana(dow), m = passosDoDia(dt, 'm', ctx), n = passosDoDia(dt, 'n', ctx), feito = registos[diaChave(dt)] || {};
  const lista = (se, s) => { const it = comFaltas(se, s, ctx); return it.length ? `<div class="lista">${it.map(({p, falta}, i) => falta
    ? `<div class="item" data-acao="verFalta" data-v="${falta}"><span class="serifa" style="color:var(--aviso);width:16px">${i + 1}</span><span class="mini-foto" style="border-style:dashed;color:var(--aviso)">${iconeTipo(falta)}</span><div class="t"><b style="color:var(--aviso)">Falta: ${esc(SLOTS[falta].nome)}</b><span>Toca para saber o que procurar</span></div></div>`
    : `<div class="item" data-acao="verFrasco" data-id="${p.id}"><span class="serifa" style="color:var(--ouro);width:16px">${i + 1}</span>${miniFoto(p)}<div class="t"><b>${nomeP(p)}</b><span>${resumoPasso(p)}${se.extras.has(p.id) ? ' · só neste dia' : ''}</span></div>${(feito[s] || {})[p.id] ? `<span style="color:var(--jade)">${IC.visto}</span>` : ''}</div>`).join('')}</div>` : '<p class="suave">Nada.</p>'; };
  abrirFolha(`${cab(DIAS_LONGO[dow][0].toUpperCase() + DIAS_LONGO[dow].slice(1))}
    <div class="col"><h3 class="linha" style="gap:6px">${IC.sol} Aurora</h3>${lista(m, 'm')}</div>
    <div class="col"><h3 class="linha" style="gap:6px">${IC.lua} ${NOITES[n.noite][0]}${NOITES[n.noite][1] ? ' · ' + NOITES[n.noite][1] : ''}</h3><p class="suave peq" style="margin:0">${TEXTO_NOITE[n.noite]}</p>${lista(n, 'n')}</div>`, 'dia');
}

/* ---------- Vista: Frascos ---------- */
function cartaoFrasco(p, uso, extra = '', cls = ''){
  const o = selAtual && selAtual.onde[p.id], v = validadeDe(p), hoje = inicioDia(new Date()), q = o ? (o.length === 2 ? 'ambos' : o[0] === 'm' ? 'manha' : 'noite') : quandoEfetivo(p, uso);
  const canto = [q === 'manha' ? `<span class="tag ouro">${IC.sol.replace('<svg', '<svg style="width:11px;height:11px;display:inline;vertical-align:-1px"')}</span>` : q === 'noite' ? `<span class="tag lua">${IC.lua.replace('<svg', '<svg style="width:11px;height:11px;display:inline;vertical-align:-1px"')}</span>` : '',
    p.veredicto && VEREDICTOS[p.veredicto] ? `<span class="tag ${VEREDICTOS[p.veredicto][1]}">${VEREDICTOS[p.veredicto][0]}</span>` : '',
    v && v < hoje ? '<span class="tag perigo">Fora de validade</span>' : v && v - hoje < 30 * DIA ? '<span class="tag aviso">Validade</span>' : ''].join('');
  return `<div class="frasco ${cls}" data-acao="verFrasco" data-id="${p.id}"><div class="img">${fotos[p.id] ? `<img src="${fotos[p.id]}" alt="" loading="lazy">` : iconeTipo(p.tipo, 1.2)}</div>
    <div class="canto">${canto}</div><div class="info"><b>${nomeP(p)}</b><span>${esc([p.marca, tipoCurto(p.tipo)].filter(Boolean).join(' · '))}</span>${extra}</div></div>`;
}
// A rotina base: os lugares de manhã e de noite, com o produto que ocupa cada um, o que falta e o que é recomendado.
const ORDEM_LUGARES = {m: ['limpeza', 'serumDia', 'olhos', 'hidratante', 'protetor'], n: ['limpeza', 'mascara', 'ativoNoite', 'olhos', 'reparador', 'hidratante', 'oleo']};
const ROTULO = {limpeza: 'Limpeza', serumDia: 'Sérum de dia', olhos: 'Olhos', hidratante: 'Hidratante', protetor: 'Protetor solar', mascara: 'Máscara', ativoNoite: 'Tratamento', reparador: 'Reparador', oleo: 'Nutrição', extra: 'Extra'};
function blocoBase(ctx){
  const dias = {m: new Map(), n: new Map()};
  for (const d of SEMANA){ const dt = dataDaSemana(d); for (const s of ['m', 'n']) for (const p of sessao(dt, s, ctx, ctx.plano).passos) dias[s].set(p, [...(dias[s].get(p) || []), d]); }
  const quandoDias = ds => ds.length === 7 ? '' : ' · ' + ds.map(d => DIAS_CURTO[d]).join(', ');
  const lugaresDe = p => ctx.sel.lugares[p.id] || ['extra'];
  const sessaoBase = s => {
    const usados = new Set(), linhas = [];
    for (const l of [...ORDEM_LUGARES[s], 'extra']){
      const ps = [...dias[s].keys()].filter(p => !usados.has(p) && lugaresDe(p).includes(l));
      ps.forEach(p => usados.add(p));
      if (ps.length) { for (const p of ps) linhas.push(`<div class="slot${ESSENCIAIS.includes(l) ? '' : ' trat'}" data-acao="verFrasco" data-id="${p.id}"><span>${ROTULO[l]}${quandoDias(dias[s].get(p))}</span><b>${nomeP(p)}</b></div>`); continue; }
      const f = ctx.sel.faltas.find(x => x.slot === l && x.sessoes.includes(s)), r = ctx.sel.rec.find(x => x.slot === l && x.sessoes.includes(s));
      if (f) linhas.push(`<div class="slot falta" data-acao="verFalta" data-v="${l}"><span>${ROTULO[l]}</span><b>Falta: toca para saber o que procurar</b></div>`);
      else if (r) linhas.push(`<div class="slot rec" data-acao="verFalta" data-v="${l}"><span>${ROTULO[l]}</span><b>Recomendado: toca para saber o que procurar</b></div>`);
    }
    for (const p of [...dias[s].keys()].filter(p => !usados.has(p))) linhas.push(`<div class="slot trat" data-acao="verFrasco" data-id="${p.id}"><span>${esc(tipoCurto(p.tipo))}</span><b>${nomeP(p)}</b></div>`);
    return linhas.join('');
  };
  const cob = ctx.sel.cobertura.filter(c => c.origem !== 'tipo' || c.por.length || c.falta >= 2);
  const ORIG = {perfil: '', tipo: ' (pelo teu tipo de pele)', registos: ' (pelos teus registos)'};
  return `<div class="placa col"><h2>A tua rotina base</h2>
    <p class="suave peq" style="margin:0">Os essenciais, mais os passos que a tua pele precisa. Os frascos que não fazem falta ficam de fora.</p>
    <div class="base-sessao"><h3>${IC.sol} Aurora</h3>${sessaoBase('m')}</div>
    <div class="base-sessao"><h3>${IC.lua} Lua</h3>${sessaoBase('n')}</div>
    ${cob.length ? `<div><h3>O que a tua pele precisa</h3><div class="lista">${cob.map(c => { const ok = c.falta < 2;
      return `<div class="item"${ok ? '' : ` data-acao="verPreoc" data-v="${c.c}"`}><div class="t"><b>${esc(PREOCUPACOES[c.c] || c.c)}${ORIG[c.origem] || ''}</b><span>${c.por.length ? 'Com ' + c.por.map(p => esc(p.nome)).join(', ') : 'Ainda sem tratamento na rotina'}</span></div>${ok ? '<span class="tag">tratado</span>' : '<span class="tag aviso">por tratar</span>'}</div>`; }).join('')}</div></div>`
      : `<p class="suave mini" style="margin:0">Não marcaste preocupações no Perfil: a tua rotina fica só com o essencial.</p>`}</div>`;
}
function blocoCompras(){
  return `<div class="placa col"><h2>Antes de comprar</h2><p class="suave peq" style="margin:0">Viste um produto na loja ou num site? Tira uma foto ou uma captura de ecrã e o Mestre diz se te serve.</p>
    <button class="btn ouro" data-acao="verificar">${IC.camara} Verificar um produto</button>
    ${compras.length ? `<div class="lista">${compras.map(c => `<div class="item" data-acao="verCompra" data-id="${c.id}">${fotos['c:' + c.id] ? `<img class="mini-foto" src="${fotos['c:' + c.id]}" alt="">` : `<span class="mini-foto">${iconeTipo(c.dados.tipo)}</span>`}
      <div class="t"><b>${esc(c.dados.nome || 'Produto')}</b><span>${esc(c.papel || tipoCurto(c.dados.tipo))}</span></div><span class="tag ${({sim: '', nao: 'perigo', talvez: 'aviso'})[c.veredicto] ?? 'aviso'}">${(VER_COMPRA[c.veredicto] || VER_COMPRA.talvez)[0]}</span></div>`).join('')}</div>` : ''}</div>`;
}
function rFrascos(){
  const ctx = contexto(), pausa = produtos.filter(p => p.pausa && !p.fim), acabados = produtos.filter(p => p.fim).sort((a, b) => String(b.fim).localeCompare(String(a.fim)));
  const ordem = l => l.slice().sort((a, b) => ordemDe(a) - ordemDe(b)), fora = ctx.sel.fora.filter(f => !f.p.porLer), livres = ctx.sel.livres;
  let html = `<h1 class="titulo-vista">Os teus frascos</h1><p class="sub-vista">Fotografa e o Mestre lê o rótulo.</p>
    <div class="adicionar"><button class="btn jade" data-acao="fotografar">${IC.camara} Fotografar frasco</button><button class="btn" data-acao="novoManual">${IC.mais} À mão</button></div>`;
  if (cfg.pronto) html += blocoBase(ctx);
  if (ctx.sel.faltas.length || ctx.sel.rec.length) html += blocoCompras();
  if (ctx.uso.length) html += `<div class="placa"><h2>Na rotina <span class="suave peq">(${ctx.uso.length})</span></h2><div class="grelha-frascos">${ordem(ctx.uso).map(p => cartaoFrasco(p, ctx.uso)).join('')}</div></div>`;
  const porLer = produtos.filter(p => p.porLer && !p.fim);
  if (porLer.length) html += `<div class="placa col"><h2>Por ler <span class="suave peq">(${porLer.length})</span></h2><p class="suave peq" style="margin:0">O Mestre ainda não leu estes rótulos. Guardei as fotos: quando ele tiver forças, lê todos de uma vez.</p>
    <div class="lista">${porLer.map(p => `<div class="item" data-acao="verFrasco" data-id="${p.id}">${miniFoto(p)}<div class="t"><b>${nomeP(p)}</b><span>${esc(tipoCurto(p.tipo))}</span></div></div>`).join('')}</div>
    ${temIA() ? `<button class="btn ouro" data-acao="lerPendentes">${IC.ia} Ler agora</button>` : ''}</div>`;
  if (fora.length) html += `<div class="placa"><h2>Fora da rotina <span class="suave peq">(${fora.length})</span></h2><p class="suave peq">Tens estes frascos, mas a tua pele não precisa deles agora, por isso não entram no ritual. Se quiseres usar algum, toca nele.</p>
    <div class="lista">${fora.map(({p, motivo}) => `<div class="item" data-acao="verFrasco" data-id="${p.id}">${miniFoto(p)}<div class="t"><b>${nomeP(p)}</b><span>${esc(motivo)}</span></div></div>`).join('')}</div></div>`;
  if (ctx.espera.length) html += `<div class="placa"><h2>Em espera</h2><p class="suave peq">Repetem a função de outro frasco. Entram quando o anterior acabar, para não abrires tudo ao mesmo tempo.</p>
    <div class="grelha-frascos">${ctx.espera.map(e => cartaoFrasco(e.p, ctx.uso, `<span style="color:var(--ouro)">Depois de ${esc(e.depois.nome)}</span>`, 'espera')).join('')}</div></div>`;
  if (livres.length) html += `<div class="placa"><h2>Quando precisares</h2><p class="suave peq">Fora do ritual: usa sempre que sentires falta.</p><div class="lista">${livres.map(p => `<div class="item" data-acao="verFrasco" data-id="${p.id}">${miniFoto(p)}<div class="t"><b>${nomeP(p)}</b><span>${esc(tipoCurto(p.tipo))}</span></div></div>`).join('')}</div></div>`;
  if (pausa.length) html += `<div class="placa"><h2>Em pausa</h2><p class="suave peq">Não entram no ritual até os retomares.</p><div class="grelha-frascos">${pausa.map(p => cartaoFrasco(p, ctx.uso, '', 'espera')).join('')}</div></div>`;
  if (!ctx.sel.faltas.length && !ctx.sel.rec.length) html += blocoCompras();
  html += blocoRevisao();
  if (acabados.length) html += `<details class="placa simples"><summary><h2 style="display:inline;padding:0">Acabados</h2> <span class="suave peq">(${acabados.length})</span></summary>
    <div class="lista" style="margin-top:10px">${acabados.map(p => `<div class="item" data-acao="verFrasco" data-id="${p.id}">${miniFoto(p)}<div class="t"><b>${nomeP(p)}</b><span>Acabou a ${dataCurta(p.fim)}${p.recomprar === false ? ' · não recomprar' : p.recomprar ? ' · recomprar' : ''}</span></div></div>`).join('')}</div></details>`;
  $('#vFrascos').innerHTML = html;
}
function blocoRevisao(){
  if (!produtos.some(p => !p.fim)) return '';
  if (!temIA()) return `<div class="placa col"><h2>Conselho do Mestre</h2><p class="suave peq" style="margin:0">Com a IA ligada, o Mestre revê os teus frascos: diz quais são essenciais, quais podes gastar e não recomprar, e o que te falta.</p><button class="btn" data-acao="irPerfil">${IC.ia} Ligar a IA no Perfil</button></div>`;
  if (!revisao) return `<div class="placa col"><h2>Conselho do Mestre</h2><p class="suave peq" style="margin:0">O Mestre revê os teus frascos de acordo com a tua pele: o que é essencial, o que podes gastar e não voltar a comprar, e o que falta.</p><button class="btn ouro" data-acao="reverFrascos">${IC.ia} Pedir revisão ao Mestre</button></div>`;
  return `<div class="placa col"><h2>Conselho do Mestre</h2><div class="resposta-mestre"><span class="quem">O Mestre diz</span>${mdLeve(revisao.resumo || '')}</div>
    ${(revisao.alertas || []).map(a => `<div class="alerta">${IC.alerta}<div>${esc(a)}</div></div>`).join('')}
    ${(revisao.faltam || []).length ? `<h3 style="margin-top:4px">O que te falta</h3>${revisao.faltam.map(f => `<div class="sugestao"><div class="t"><b>${esc(f.tipo)}</b>${esc(f.porque)}${f.procurar ? `<br><span class="suave">Procura: ${esc(f.procurar)}</span>` : ''}${(f.exemplos || []).length ? `<br><span class="suave">Exemplos: ${f.exemplos.map(esc).join(', ')}</span>` : ''}</div>
      <a class="btn icone" href="${procurarURL((f.exemplos || [])[0] || f.tipo)}" target="_blank" rel="noopener" aria-label="Procurar">${IC.lupa}</a></div>`).join('')}` : ''}
    <div class="linha entre"><span class="suave mini">Revisto a ${dataCurta(diaChave(new Date(revisao.ts)))}</span><button class="btn peq-btn" data-acao="reverFrascos">${IC.ia} Rever outra vez</button></div></div>`;
}
function folhaFrasco(id){
  const p = produtos.find(x => x.id === id); if (!p) return;
  const ctx = contexto(), emUso = ctx.uso.includes(p), esp = ctx.espera.find(e => e.p === p), v = validadeDe(p);
  const foraI = ctx.sel.fora.find(f => f.p === p), livre = ctx.sel.livres.includes(p);
  const estado = p.fim ? `Acabou a ${dataCurta(p.fim)}` : p.pausa ? 'Em pausa' : esp ? `Em espera: entra depois de ${esc(esp.depois.nome)}` : emUso ? 'Na rotina' : livre ? 'Quando precisares (fora do ritual)' : foraI ? 'Fora da rotina' : '—';
  const porque = emUso ? ctx.sel.porque[p.id] : foraI ? foraI.motivo : '';
  const escolha = p.fim || p.pausa || esp || p.porLer ? '' : [
    emUso && p.forcar !== 'usar' ? `<button class="btn" data-acao="forcar" data-id="${p.id}" data-v="nao">Tirar da rotina</button>` : '',
    (foraI || livre) && !p.forcar ? `<button class="btn jade" data-acao="forcar" data-id="${p.id}" data-v="usar">Usar mesmo assim</button>` : '',
    p.forcar ? `<button class="btn" data-acao="forcar" data-id="${p.id}" data-v="">Deixar a app decidir</button>` : ''].join('');
  const quando = emUso ? quandoTexto(p, ctx, ctx.plano).texto : '—';
  abrirFolha(`${cab(nomeP(p))}
    ${fotos[p.id] ? `<img class="foto-grande" src="${fotos[p.id]}" alt="">` : ''}
    <div class="tags"><span class="tag">${esc(tipoCurto(p.tipo))}</span>${ativosTags(p)}${p.veredicto && VEREDICTOS[p.veredicto] ? `<span class="tag ${VEREDICTOS[p.veredicto][1]}">${VEREDICTOS[p.veredicto][0]}</span>` : ''}</div>
    ${p.funcao ? `<p style="margin:0">${esc(p.funcao)}</p>` : ''}
    ${p.notaMestre ? `<div class="resposta-mestre"><span class="quem">O Mestre diz</span>${esc(p.notaMestre)}</div>` : ''}
    <dl class="ficha">
      ${p.marca ? `<dt>Marca</dt><dd>${esc(p.marca)}</dd>` : ''}
      <dt>Estado</dt><dd>${estado}</dd>
      ${porque ? `<dt>Porquê</dt><dd>${esc(porque)}</dd>` : ''}
      <dt>Quando</dt><dd>${esc(quando)}</dd>
      <dt>Como usar</dt><dd>${esc(modoPadrao(p))}</dd>
      ${p.qtd ? `<dt>Quantidade</dt><dd>${esc(p.qtd)}</dd>` : ''}${p.espera ? `<dt>Espera</dt><dd>${esc(p.espera)}</dd>` : ''}
      ${p.aviso ? `<dt>Atenção</dt><dd>${esc(p.aviso)}</dd>` : ''}${p.conc ? `<dt>Concentração</dt><dd>${esc(p.conc)}</dd>` : ''}
      <dt>Aberto</dt><dd>${p.aberto ? dataCurta(p.aberto) : 'Ainda não (marca-se ao usares a primeira vez)'}</dd>
      ${v ? `<dt>Validade</dt><dd>${mesAno(v)}${p.pao ? ` <span class="suave">(${p.pao} meses depois de aberto)</span>` : ''}</dd>` : ''}
    </dl>
    ${escolha ? `<div class="botoes">${escolha}</div>` : ''}
    <div class="botoes">
      ${!p.fim ? `<button class="btn ouro" data-acao="acabou" data-id="${p.id}">${IC.fim} Acabou</button>` : `<button class="btn" data-acao="reativar" data-id="${p.id}">Voltar a usar</button>`}
      ${p.porLer && temIA() ? `<button class="btn ouro" data-acao="lerPendentes" data-id="${p.id}">${IC.ia} Ler com o Mestre</button>` : ''}
      ${esp ? `<button class="btn" data-acao="usarAgora" data-id="${p.id}">Usar este agora</button>` : ''}
      ${!p.fim && !p.aberto ? `<button class="btn" data-acao="abriHoje" data-id="${p.id}">Abri hoje</button>` : ''}
      ${!p.fim ? `<button class="btn" data-acao="pausar" data-id="${p.id}">${p.pausa ? IC.retomar + ' Retomar' : IC.pausa + ' Pausar'}</button>` : ''}
      <button class="btn" data-acao="editar" data-id="${p.id}">${IC.editar} Editar</button>
      ${temIA() ? `<button class="btn" data-acao="perguntar" data-q="${esc(`Fala-me do ${p.nome}${p.marca ? ' (' + p.marca + ')' : ''}: está a ser bem usado na minha rotina?`)}">${IC.ia} Perguntar</button>` : ''}
      <button class="btn perigo" data-acao="apagar" data-id="${p.id}">${IC.lixo}</button></div>`, 'frasco');
}
function botoesProcura(alvo, pesquisa, pergunta){
  return `<div class="col"><button class="btn ouro" data-acao="verificar" data-v="${alvo}">${IC.camara} Vou comprar: verificar um produto</button>
    <p class="suave mini" style="margin:-4px 0 0">Tira uma foto na loja ou uma captura de ecrã do site. O Mestre diz se te serve.</p>
    <div class="botoes">${temIA() ? `<button class="btn" data-acao="perguntar" data-q="${esc(pergunta)}">${IC.ia} Sugestões do Mestre</button>` : ''}
      <a class="btn" href="${procurarURL(pesquisa)}" target="_blank" rel="noopener">${IC.lupa} Procurar na internet</a>
      <button class="btn" data-acao="fotografar">${IC.camara} Já tenho um</button></div></div>`;
}
function folhaFalta(slot){
  const ctx = contexto(), S = SLOTS[slot], f = [...ctx.sel.faltas, ...ctx.sel.rec].find(x => x.slot === slot), [txt, pesq] = procurarLugar(slot, ctx);
  const para = Object.keys(ctx.sel.precisa).map(c => PREOC_CURTO[c]);
  abrirFolha(`${cab((S.rec ? 'Recomendado: ' : 'Falta: ') + esc(S.nome))}
    <div class="tags">${S.rec ? '<span class="tag agua">Recomendado</span>' : '<span class="tag ouro">Essencial</span>'}${f ? `<span class="tag">${SESS_TXT(f.sessoes)}</span>` : ''}</div>
    <p style="margin:0">${esc(S.porque)}</p>
    <div class="resposta-mestre"><span class="quem">O que procurar${cfg.pele ? ' para pele ' + esc(PELES[cfg.pele].split(' ')[0].toLowerCase()) : ''}${S.rec && para.length ? ' (' + esc(para.slice(0, 3).join(', ')) + ')' : ''}</span>${esc(txt)}</div>
    ${botoesProcura(slot, pesq, `Preciso de ${S.nome.toLowerCase()} para ${f ? SESS_TXT(f.sessoes) : 'a minha rotina'}. Que produtos concretos me aconselhas para a minha pele, à venda em Portugal?`)}`, 'falta');
}
function folhaPreoc(c){
  const [txt, pesq] = PREOC_PROCURAR[c] || ['', c];
  abrirFolha(`${cab('Para ' + esc(PREOC_CURTO[c] || c))}<div class="tags"><span class="tag agua">Opcional</span></div>
    <p style="margin:0">Ainda não tens nada na rotina que trate ${esc(PREOC_CURTO[c] || c)}. Não é obrigatório: só se te incomodar.</p>
    <div class="resposta-mestre"><span class="quem">O que procurar</span>${esc(txt)}</div>
    ${botoesProcura(c, pesq, `Quero tratar ${PREOC_CURTO[c] || c}. Que produto me aconselhas, a pensar na minha pele e na rotina que já tenho?`)}`, 'falta');
}
function folhaCompra(id){
  const c = compras.find(x => x.id === id); if (!c) return;
  const [rot, cls] = VER_COMPRA[c.veredicto] || VER_COMPRA.talvez, d = c.dados;
  abrirFolha(`${cab(esc(d.nome || 'Produto'))}
    ${fotos['c:' + c.id] ? `<img class="foto-grande" src="${fotos['c:' + c.id]}" alt="">` : ''}
    <div class="veredicto-compra ${cls}"><b>${rot}</b>${c.papel ? `<span>${esc(c.papel)}</span>` : ''}</div>
    <div class="tags">${d.marca ? `<span class="tag apagado">${esc(d.marca)}</span>` : ''}<span class="tag">${esc(tipoCurto(d.tipo))}</span>${ativosTags(d)}</div>
    <div class="resposta-mestre"><span class="quem">O Mestre diz</span>${esc(c.porque)}</div>
    ${c.atencao ? `<div class="alerta">${IC.alerta}<div>${esc(c.atencao)}</div></div>` : ''}
    ${c.alternativa ? `<div class="alerta info">${IC.info}<div><b>Em vez disto, procura:</b> ${esc(c.alternativa)}</div></div>` : ''}
    <div class="botoes"><button class="btn${c.veredicto === 'nao' ? '' : ' jade'}" data-acao="comprei" data-id="${c.id}">${IC.visto} ${c.veredicto === 'nao' ? 'Já o tenho: juntar aos frascos' : 'Comprei: juntar aos frascos'}</button>
      <button class="btn" data-acao="verifMais" data-id="${c.id}">${IC.camara} Juntar foto dos ingredientes</button>
      <button class="btn" data-acao="verificar" data-v="${esc(c.alvo || '')}">Verificar outro</button>
      <button class="btn perigo" data-acao="apagarCompra" data-id="${c.id}" aria-label="Apagar">${IC.lixo}</button></div>`, 'compra');
}
function folhaEditar(){
  const r = rascunho, op = (v, txt, sel) => `<option value="${v}"${sel ? ' selected' : ''}>${txt}</option>`;
  abrirFolha(`${cab(r.id && produtos.some(p => p.id === r.id) ? 'Editar frasco' : 'Novo frasco')}
    ${r.foto ? `<img class="foto-grande" src="${r.foto}" alt="">` : ''}
    ${r.duvida ? `<div class="alerta">${IC.alerta}<div>${esc(r.duvida)}</div></div>` : ''}
    ${r.adequado ? `<div class="resposta-mestre"><span class="quem">O Mestre diz</span>${esc(r.adequado)}</div>` : ''}
    <div class="botoes">${r.foto ? '' : `<button class="btn peq-btn" data-acao="fotoRascunho" data-v="1">${IC.camara} Foto do frasco</button>`}
      ${temIA() && r.foto ? `<button class="btn peq-btn" data-acao="fotoRascunho" data-v="2">${IC.camara} Ler a lista de ingredientes</button>` : ''}</div>
    <label class="campo">Nome${r.porLer ? ' <span class="suave mini" style="font-weight:400">(opcional: o Mestre preenche depois)</span>' : ''}<input type="text" data-campo="rNome" value="${esc(r.nome)}" placeholder="Ex.: Sérum de niacinamida 10%"></label>
    <div class="duas"><label class="campo">Marca<input type="text" data-campo="rMarca" value="${esc(r.marca)}"></label>
      <label class="campo">Tipo<select data-campo="rTipo">${Object.entries(TIPOS).map(([k, t]) => op(k, t[0], r.tipo === k)).join('')}</select></label></div>
    <div><h3>Ativos principais</h3><div class="chips">${Object.entries(ATIVOS).map(([k, n]) => `<span class="chip${r.ativos.includes(k) ? ' on' : ''}" data-acao="rAtivo" data-v="${k}" title="${esc(n)}">${esc(ATIVO_CURTO[k])}</span>`).join('')}</div></div>
    <div><h3>Quando</h3><div class="chips">${[['manha', 'Manhã'], ['noite', 'Noite'], ['ambos', 'Manhã e noite']].map(([k, n]) => chip(r.quando === k, 'rQuando', k, n)).join('')}</div>
      <p class="suave mini" style="margin:6px 0 0">A app pode mudar isto para separar ativos que não vão juntos (por exemplo, retinoide sempre à noite).</p></div>
    <div class="duas"><label class="campo">Vezes por semana<select data-campo="rVezes">${op(0, 'Todos os dias', !+r.vezes)}${[1, 2, 3, 4, 5, 6].map(n => op(n, n + (n === 1 ? ' vez' : ' vezes'), +r.vezes === n)).join('')}</select></label>
      <label class="campo">Quantidade<input type="text" data-campo="rQtd" value="${esc(r.qtd)}" placeholder="Ex.: 2 gotas"></label></div>
    <label class="campo">Como usar<textarea rows="3" data-campo="rModo" placeholder="${esc(modoPadrao(Object.assign({}, r, {modo: ''})))}">${esc(r.modo)}</textarea></label>
    <div class="duas"><label class="campo">Espera<input type="text" data-campo="rEspera" value="${esc(r.espera)}" placeholder="Ex.: 1 minuto"></label>
      <label class="campo">Concentração<input type="text" data-campo="rConc" value="${esc(r.conc)}" placeholder="Ex.: retinol 0,3%"></label></div>
    <label class="campo">Atenção<input type="text" data-campo="rAviso" value="${esc(r.aviso)}"></label>
    <div class="duas"><label class="campo">Aberto em<input type="date" data-campo="rAberto" value="${esc(r.aberto)}"></label>
      <label class="campo">Meses depois de aberto<input type="number" min="0" max="60" data-campo="rPao" value="${esc(r.pao || '')}" placeholder="Ex.: 12"></label></div>
    <label class="campo">Validade da embalagem<input type="month" data-campo="rValidade" value="${esc(r.validade)}"></label>
    <button class="btn jade largo" data-acao="guardarFrasco">${IC.visto} Guardar</button>`, 'editar');
}

/* ---------- Vista: Pele ---------- */
const medidaVal = (r, k) => r && r[k] != null ? r[k] : (k === 'geral' ? 2 : 0);
function formPele(){
  const f = peleForm;
  return `<label class="campo">Descreve por palavras tuas <span class="suave mini" style="font-weight:400">(opcional${temIA() ? ', o Mestre lê e preenche' : ''})</span>
      <div class="linha"><textarea rows="2" data-campo="fNota" placeholder="Ex.: zona T oleosa, uma borbulha nova no queixo, bochechas a repuxar">${esc(f.nota)}</textarea><button class="btn icone" data-acao="falar" data-alvo="fNota" aria-label="Falar">${IC.mic}</button></div></label>
    ${MEDIDAS.map(([k, n, et]) => `<div class="medida"><label for="m_${k}">${n}</label><output id="o_${k}">${et[medidaVal(f, k)]}</output>
      <input type="range" id="m_${k}" min="0" max="4" step="1" value="${medidaVal(f, k)}" data-campo="fMedida" data-k="${k}"></div>`).join('')}
    <div><h3>Sinais</h3><div class="chips">${SINAIS.map(s => chip(f.sinais.includes(s), 'fSinal', s, s)).join('')}</div></div>
    ${temIA() ? `<div class="linha"><button class="btn peq-btn" data-acao="fotoPele">${IC.camara} ${f.foto ? 'Trocar foto' : 'Foto da pele'}</button><span class="suave mini cresce">${f.foto ? 'Foto pronta. Só o Mestre a vê; não fica guardada.' : 'Opcional: o Mestre olha para ela. Não fica guardada.'}</span></div>` : ''}
    <button class="btn jade largo" data-acao="guardarPele">${IC.visto} Guardar o registo de hoje</button>`;
}
function grafico(){
  const hoje = inicioDia(new Date()), ini = new Date(hoje - (grafDias - 1) * DIA), dados = pele.filter(r => deChave(r.d) >= ini).sort((a, b) => a.d < b.d ? -1 : 1);
  if (dados.length < 2) return `<p class="suave peq centro" style="padding:14px 0">Com dois ou mais registos aparece aqui a evolução da tua pele.</p>`;
  const W = 340, H = 170, L = 8, R = 8, T = 10, B = 26, x = d => L + (deChave(d) - ini) / ((grafDias - 1) * DIA) * (W - L - R), y = v => T + (4 - v) / 4 * (H - T - B);
  const grelha = [0, 1, 2, 3, 4].map(v => `<path d="M${L} ${y(v)}H${W - R}" stroke="rgba(127,209,180,.08)"/>`).join('');
  const linhas = MEDIDAS.filter(m => grafMedidas.includes(m[0])).map(([k, , , cor]) => {
    const pts = dados.filter(r => r[k] != null).map(r => [x(r.d), y(r[k])]);
    return `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${cor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2.6" fill="${cor}"/>`).join('')}`; }).join('');
  const marcos = produtos.filter(p => p.inicio && deChave(p.inicio) >= ini).map(p => `<g><title>${esc(p.nome)}: começou a ${dataCurta(p.inicio)}</title><path d="M${x(p.inicio)} ${H - B}v-${H - T - B}" stroke="rgba(227,196,126,.25)" stroke-dasharray="2 3"/><path d="M${x(p.inicio) - 4} ${H - B + 9}l4-6 4 6z" fill="#e3c47e"/></g>`).join('');
  const eixo = [0, .5, 1].map(f => { const d = new Date(+ini + f * (grafDias - 1) * DIA); return `<text x="${L + f * (W - L - R)}" y="${H - 4}" text-anchor="${f === 0 ? 'start' : f === 1 ? 'end' : 'middle'}">${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}</text>`; }).join('');
  return `<svg class="grafico" viewBox="0 0 ${W} ${H}">${grelha}${marcos}${linhas}${eixo}</svg>${marcos ? '<p class="suave mini" style="margin:4px 0 0">▲ produtos que entraram na rotina (toca para ver o nome).</p>' : ''}`;
}
function rPele(){
  const hojeK = diaChave(new Date()), deHoje = pele.find(r => r.d === hojeK), ultimo = pele.slice().sort((a, b) => a.d < b.d ? 1 : -1)[0];
  if (!peleForm || peleForm.d !== hojeK) peleForm = deHoje ? Object.assign({foto: ''}, JSON.parse(JSON.stringify(deHoje))) : {d: hojeK, nota: '', sinais: [], foto: '', ...Object.fromEntries(MEDIDAS.map(m => [m[0], medidaVal(ultimo, m[0])]))};
  const lista = pele.slice().sort((a, b) => a.d < b.d ? 1 : -1).slice(0, 15);
  let html = `<h1 class="titulo-vista">A tua pele</h1><p class="sub-vista">Diz-me como está. Vemos juntos se o ritual resulta.</p>
    <div class="placa col"><h2>${deHoje ? 'Hoje (já registado)' : 'Como está hoje?'}</h2>${formPele()}</div>
    <div class="placa col"><h2>Evolução</h2><div class="chips">${[30, 90].map(n => chip(grafDias === n, 'grafDias', n, n + ' dias')).join('')}</div>
      <div class="chips">${MEDIDAS.map(([k, n, , cor]) => `<span class="chip${grafMedidas.includes(k) ? ' on' : ''}" data-acao="grafMedida" data-v="${k}" style="${grafMedidas.includes(k) ? `background:${cor};border-color:${cor}` : ''}">${n.split(' /')[0]}</span>`).join('')}</div>
      ${grafico()}</div>
    <div class="placa col"><h2>Está a funcionar?</h2>${blocoAvaliacao()}</div>`;
  if (lista.length) html += `<div class="placa"><h2>Registos</h2>${lista.map(r => `<div class="registo"><div class="linha entre"><b>${dataCurta(r.d)}</b><span class="suave mini">${esc(MEDIDAS[0][2][medidaVal(r, 'geral')])}</span></div>
      <div class="pontos-pele">${MEDIDAS.slice(1).map(([k, n, et]) => r[k] ? `<span>${n.split(' /')[0]}: ${esc(et[r[k]].toLowerCase())}</span>` : '').join('')}${(r.sinais || []).map(s => `<span>${esc(s)}</span>`).join('')}</div>
      ${r.nota ? `<div style="margin-top:3px">${esc(r.nota)}</div>` : ''}${r.mestre ? `<div class="resposta-mestre" style="margin-top:6px"><span class="quem">O Mestre</span>${esc(r.mestre)}</div>` : ''}</div>`).join('')}</div>`;
  $('#vPele').innerHTML = html;
}
function blocoAvaliacao(){
  if (!temIA()) return `<p class="suave peq" style="margin:0">Com a IA ligada, o Mestre cruza os teus registos com os produtos que começaste e diz-te o que está a resultar.</p><button class="btn" data-acao="irPerfil">${IC.ia} Ligar a IA no Perfil</button>`;
  if (pele.length < 3) return `<p class="suave peq" style="margin:0">Faz pelo menos 3 registos (idealmente 2 ou 3 por semana) para o Mestre poder avaliar.</p>`;
  const EF = {a_funcionar: ['A resultar', ''], cedo: ['Cedo para dizer', 'apagado'], sem_efeito: ['Sem efeito visível', 'aviso'], suspeito: ['Suspeito', 'perigo']};
  const a = avaliacao;
  return `${a ? `<div class="resposta-mestre"><span class="quem">O Mestre diz</span>${mdLeve(a.veredicto || '')}</div>
    ${(a.tendencias || []).length ? `<ul class="peq" style="margin:0;padding-left:18px">${a.tendencias.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    ${(a.produtos || []).map(x => { const p = produtos.find(o => o.id === x.id); const e = EF[x.efeito] || EF.cedo; return p ? `<div class="item" data-acao="verFrasco" data-id="${p.id}">${miniFoto(p)}<div class="t"><b>${nomeP(p)}</b><span>${esc(x.nota || '')}</span></div><span class="tag ${e[1]}">${e[0]}</span></div>` : ''; }).join('')}
    ${(a.ajustes || []).length ? `<h3 style="margin-top:4px">Ajustes</h3><ul class="peq" style="margin:0;padding-left:18px">${a.ajustes.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    ${a.dermatologista ? `<div class="alerta perigo">${IC.alerta}<div>${esc(a.porque || 'Vale a pena mostrares a tua pele a um dermatologista.')}</div></div>` : ''}
    <span class="suave mini">Avaliado a ${dataCurta(diaChave(new Date(a.ts)))}</span>` : `<p class="suave peq" style="margin:0">O Mestre cruza a evolução da tua pele com as datas em que começaste cada produto.</p>`}
    <button class="btn ouro" data-acao="avaliar">${IC.ia} ${a ? 'Avaliar outra vez' : 'Pedir avaliação ao Mestre'}</button>`;
}

/* ---------- Vista: Mestre ---------- */
const PERGUNTAS = ['O que me falta comprar?', 'Estou a usar tudo bem?', 'Tenho borbulhas novas. O que faço?', 'Ajuda-me a escolher um protetor solar', 'Posso simplificar a rotina?'];
function rMestre(){
  const msgs = conversa.length ? conversa.map(m => m.q === 'eu' ? `<div class="msg eu">${esc(m.t)}</div>`
    : `<div class="msg mestre"><span class="quem">O Mestre</span>${mdLeve(m.t)}${(m.produtos || []).map(s => `<div class="sugestao"><div class="t"><b>${esc(s.nome)}</b>${esc(s.porque || '')}${s.preco ? ` <span class="suave">· ${esc(s.preco)}</span>` : ''}</div><a class="btn icone" href="${procurarURL(s.nome)}" target="_blank" rel="noopener" aria-label="Procurar">${IC.lupa}</a></div>`).join('')}</div>`).join('')
    : `<div class="msg mestre"><span class="quem">O Mestre</span><p>Sê bem-vindo, discípulo. A pele é como a água da nascente: com constância e as escolhas certas, torna-se clara e serena.</p><p>Pergunta-me o que quiseres: que creme te falta, o que não deves misturar, o que fazer com uma borbulha teimosa, ou ajuda para encontrares um produto.</p></div>`;
  $('#vMestre').innerHTML = `<div class="linha">${MESTRE_FIG}<div><h1 class="titulo-vista">O Mestre</h1><p class="sub-vista" style="margin:0">Conhece os teus frascos e a tua pele.</p></div></div>
    ${!temIA() ? `<div class="placa col"><p class="suave peq" style="margin:0">O Mestre precisa de uma chave gratuita de IA (Gemini ou Groq). Liga-a no Perfil (demora 1 minuto).</p><button class="btn jade" data-acao="irPerfil">${IC.ia} Ligar a IA</button></div>` : ''}
    <div class="conversa" id="conversa">${msgs}</div>
    ${temIA() ? `<div class="chips">${PERGUNTAS.map(q => `<span class="chip" data-acao="perguntar" data-q="${esc(q)}">${esc(q)}</span>`).join('')}</div>
    ${conversa.length ? '<button class="btn fantasma peq-btn" data-acao="limparConversa" style="align-self:center">Limpar a conversa</button>' : ''}
    <div class="escrever"><textarea id="pergunta" rows="1" placeholder="Pergunta ao Mestre…" enterkeyhint="send"></textarea><button class="btn icone" data-acao="falar" data-alvo="pergunta" aria-label="Falar">${IC.mic}</button><button class="btn icone jade" data-acao="enviarPergunta" aria-label="Enviar">${IC.enviar}</button></div>` : ''}`;
}

/* ---------- Vista: Perfil ---------- */
function rPerfil(){
  const chaveAlheia = !cfg.chave && chaveDeOutraApp();
  $('#vPerfil').innerHTML = `<h1 class="titulo-vista">Perfil</h1>
    <div class="placa col"><h2>A tua pele</h2>
      <label class="campo">Nome<input type="text" data-campo="pNome" value="${esc(cfg.nome)}" autocomplete="given-name"></label>
      <div><h3>Tipo de pele</h3><div class="chips">${Object.entries(PELES).map(([k, n]) => chip(cfg.pele === k, 'pPele', k, n)).join('')}</div></div>
      <div class="chips">${chip(cfg.sensivel, 'pSensivel', '', 'Reage facilmente (sensível)')}</div>
      <div><h3>O que te preocupa</h3><div class="chips">${Object.entries(PREOCUPACOES).map(([k, n]) => chip(cfg.preocupacoes.includes(k), 'pPreoc', k, n)).join('')}</div>
        <p class="suave mini" style="margin:8px 0 0">A rotina só inclui tratamentos para o que marcares aqui e para o que os teus registos em Pele mostrarem. Os outros frascos ficam de fora.</p></div></div>
    <div class="placa col"><h2>Ritmo do ritual</h2>
      <div><h3>Noites de esfoliação por semana</h3><div class="chips">${chip(!+cfg.exf, 'pExf', 0, 'Automático')}${[1, 2, 3].map(n => chip(+cfg.exf === n, 'pExf', n, n)).join('')}</div></div>
      <div><h3>Noites de retinoide por semana</h3><div class="chips">${chip(!+cfg.retFixo, 'pRet', 0, 'Automático (sobe aos poucos)')}${[2, 3, 4, 5].map(n => chip(+cfg.retFixo === n, 'pRet', n, n)).join('')}</div></div>
      <div><h3>A partir de que hora mostro o ritual da noite</h3><div class="chips">${[12, 15, 18, 20].map(n => chip(+cfg.horaNoite === n, 'pHora', n, n + 'h')).join('')}</div></div></div>
    <div class="placa col"><h2>Inteligência artificial</h2>
      <p class="suave peq" style="margin:0">O Mestre usa o Gemini da Google, com uma chave gratuita tua, guardada só neste dispositivo. Para criar: abre <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">aistudio.google.com/app/apikey</a>, entra com a conta Google, toca em "Create API key" e cola a chave aqui.</p>
      ${chaveAlheia ? `<div class="alerta info">${IC.info}<div class="cresce">Encontrei a chave que já usas noutra app tua (Forja ou Garfada).<div style="margin-top:6px"><button class="btn peq-btn" data-acao="usarChaveAlheia">Usar a mesma chave</button></div></div></div>` : ''}
      <label class="campo">Chave do Gemini<div class="linha"><input type="password" id="pChave" value="${esc(cfg.chave)}" placeholder="Cola aqui a chave" autocomplete="off"><button class="btn icone" data-acao="verChave" aria-label="Ver">${IC.lupa}</button></div></label>
      <div class="linha"><button class="btn jade" data-acao="testarIA">Guardar e testar</button><span class="suave mini cresce" id="iaTeste">${temIA() ? 'Modelo: ' + esc(cfg.modelo) : ''}</span></div></div>
    <div class="placa col"><h2>IA de reserva (Groq)</h2>${IA.htmlGroq({sub: 'suave peq', pri: 'btn jade'})}</div>
    <details class="placa col"><summary><h2 style="display:inline">Sincronização entre dispositivos</h2> <span class="suave peq">(opcional)</span></summary>
      <div class="col" style="margin-top:12px"><p class="suave peq" style="margin:0">Guarda os dados num repositório privado teu no GitHub, para teres o mesmo no telemóvel e no PC. Cria um repositório privado (por exemplo, nascente-dados) e um token "fine-grained" com permissão Contents: Read and write só nesse repositório. As fotos dos frascos ficam só em cada dispositivo.</p>
      <label class="campo">Dono (utilizador GitHub)<input type="text" id="gDono" value="${esc(gh.dono)}" autocomplete="off"></label>
      <label class="campo">Repositório<input type="text" id="gRepo" value="${esc(gh.repo)}" placeholder="nascente-dados" autocomplete="off"></label>
      <label class="campo">Token<input type="password" id="gToken" value="${esc(gh.token)}" autocomplete="off"></label>
      <div class="botoes"><button class="btn jade" data-acao="ligarGH">Ligar e sincronizar</button>${gh.token ? '<button class="btn perigo" data-acao="desligarGH">Desligar</button>' : ''}</div>
      <p class="suave peq" id="syncTxt" style="margin:0"></p></div></details>
    <div class="placa col"><h2>Meditação</h2><p class="suave peq" style="margin:0">O teu cultivador é o do Mirante. Cada dia com uma sessão de respiração completa dá 3 de Shen; o progresso vê-se no Mirante.</p>
      <div class="chips">${chip(cfg.medSom !== false, 'medOp', 'medSom', 'Sons da respiração')}${chip(cfg.medVoz !== false, 'medOp', 'medVoz', 'Voz nos guiados')}${chip(cfg.medVibra !== false, 'medOp', 'medVibra', 'Vibração')}</div></div>
    ${blocoCapaPerfil()}
    <div class="placa col"><h2>Cópia de segurança</h2><p class="suave peq" style="margin:0">Exporta tudo (com fotos) para um ficheiro. Útil antes de mudares de telemóvel.</p>
      <div class="botoes"><button class="btn" data-acao="exportar">Exportar</button><button class="btn" data-acao="importar">Importar</button></div></div>
    <p class="apagado mini centro">Os conselhos do Mestre são orientação geral e não substituem um dermatologista. Se tiveres uma reação forte (ardor intenso, inchaço, bolhas), pára o produto e procura um profissional.</p>`;
  estadoSync();
}
