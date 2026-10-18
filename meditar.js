'use strict';
/* Nascente — Meditar: exercícios curtos de respiração e relaxamento (até 5 minutos), sobretudo para antes de dormir.
   O cultivador é o do Mirante (mesmo desenho em cultivador-arte.js e o retrato guardado pelo Mirante neste navegador).
   Cada dia com uma sessão completa dá 3 de Shen (o espírito, na testa do cultivador). O progresso vê-se no Mirante. */

const SHEN_RGB = '79,214,214';
const EVID = {forte: ['Evidência forte', ''], moderada: ['Evidência moderada', 'agua'], preliminar: ['Evidência preliminar', 'aviso']};
const PARA = {sono: 'Adormecer', stress: 'Stress', ansiedade: 'Ansiedade', relaxar: 'Relaxar', humor: 'Humor'};
const FONTE_STANFORD = ['Balban et al., Cell Reports Medicine (2023): ensaio aleatorizado, 108 pessoas, 5 min por dia durante um mês', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9873947'];
const FONTE_LENTA = ['Zaccaro et al., Frontiers in Human Neuroscience (2018): revisão sistemática sobre a respiração lenta', 'https://doi.org/10.3389/fnhum.2018.00353'];
const EXERCICIOS = [
  {id: 'suspiro', nome: 'Suspiro cíclico', para: ['stress', 'humor', 'ansiedade'], tipo: 'resp', min: 5, opcoes: [1, 3, 5], evid: 'forte',
    ciclo: [['in', 2.4, 'Inspira pelo nariz'], ['in2', 1, 'Mais um pouco'], ['out', 6, 'Expira devagar pela boca']],
    curto: 'Duas inspirações seguidas e uma expiração longa. O que mais melhorou o humor num estudo de Stanford.',
    como: ['Inspira pelo nariz até encher os pulmões.', 'Sem expirar, faz uma segunda inspiração curta para os encher por completo.', 'Expira devagar pela boca, até ao fim. A expiração dura mais do que as duas inspirações juntas.'],
    porque: 'Num ensaio aleatorizado, 5 minutos por dia de suspiro cíclico durante um mês melhoraram mais o humor e baixaram mais a frequência respiratória do que a meditação. O efeito cresceu com os dias de prática.',
    fonte: FONTE_STANFORD},
  {id: 'caixa', nome: 'Respiração em caixa', para: ['ansiedade', 'stress'], tipo: 'resp', min: 3, opcoes: [1, 3, 5], evid: 'moderada',
    ciclo: [['in', 4, 'Inspira'], ['hold', 4, 'Suster'], ['out', 4, 'Expira'], ['hold2', 4, 'Suster, vazio']],
    curto: 'Quatro tempos iguais: inspira, suster, expira, suster. Para recuperar o controlo num momento de tensão.',
    como: ['Inspira pelo nariz durante 4 segundos.', 'Suster o ar 4 segundos, sem força.', 'Expira durante 4 segundos.', 'Fica 4 segundos sem ar e recomeça.'],
    porque: 'Usada por militares e equipas de emergência. No mesmo ensaio de Stanford baixou a ansiedade, embora menos do que o suspiro cíclico.',
    aviso: 'Se a retenção te deixar desconfortável, encurta-a ou passa para a Respiração de ressonância.', fonte: FONTE_STANFORD},
  {id: 'ressonancia', nome: 'Respiração de ressonância', para: ['relaxar', 'stress'], tipo: 'resp', min: 5, opcoes: [3, 5], evid: 'moderada',
    ciclo: [['in', 5, 'Inspira pelo nariz, a barriga sobe'], ['out', 5.5, 'Expira devagar, a barriga desce']],
    curto: 'Cerca de 6 respirações por minuto, com a barriga. O ritmo em que o coração e a respiração entram em sintonia.',
    como: ['Põe uma mão na barriga e outra no peito.', 'Inspira pelo nariz durante 5 segundos: só a mão da barriga sobe.', 'Expira devagar durante 5 segundos e meio.'],
    porque: 'Respirar devagar, perto de 6 vezes por minuto, aumenta a variabilidade da frequência cardíaca e a atividade do nervo vago, o travão do stress. As revisões associam-na a mais calma e menos ansiedade.',
    fonte: FONTE_LENTA},
  {id: 'expira', nome: 'Expiração longa', para: ['sono', 'relaxar'], tipo: 'resp', min: 5, opcoes: [3, 5], evid: 'moderada',
    ciclo: [['in', 4, 'Inspira pelo nariz'], ['out', 7, 'Expira devagar, como quem sopra uma vela sem a apagar']],
    curto: 'Inspira 4 segundos, expira 7. Expirar mais tempo do que se inspira abranda o coração e prepara o corpo para dormir.',
    como: ['Deitado, inspira pelo nariz durante 4 segundos.', 'Expira devagar pela boca ou pelo nariz durante 7 segundos.', 'Não forces: se 7 for muito, começa com 6.'],
    porque: 'Na expiração o coração abranda naturalmente. Alongar a expiração reforça esse efeito e ativa o sistema nervoso do repouso. É a base de quase todas as técnicas de respiração para adormecer.',
    fonte: FONTE_LENTA},
  {id: '478', nome: 'Respiração 4-7-8', para: ['sono'], tipo: 'resp', ciclos: 4, opcoes: [4, 8], evid: 'preliminar',
    ciclo: [['in', 4, 'Inspira pelo nariz'], ['hold', 7, 'Suster'], ['out', 8, 'Expira pela boca, com um sopro']],
    curto: 'Inspira 4, suster 7, expira 8. Começa com 4 ciclos, já deitado.',
    como: ['Encosta a ponta da língua atrás dos dentes de cima.', 'Inspira pelo nariz contando até 4.', 'Suster o ar contando até 7.', 'Expira pela boca, com um sopro, contando até 8.'],
    porque: 'Muito popular para adormecer. Há poucos estudos e pequenos: mostram que baixa a frequência cardíaca e a tensão arterial, mas ainda faltam ensaios sobre o sono. Se a retenção te incomodar, usa a Expiração longa.',
    aviso: 'Se ficares tonto, volta a respirar normalmente.',
    fonte: ['Physiological Reports (2022): 4-7-8 e variabilidade da frequência cardíaca em jovens adultos', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9277512/']},
  {id: 'pmr', nome: 'Relaxamento muscular progressivo', para: ['sono', 'stress'], tipo: 'guiado', min: 5, evid: 'forte',
    curto: 'Contrai e solta cada grupo de músculos, dos pés à cabeça. A técnica de relaxamento mais estudada para dormir.',
    como: ['Contrai cada grupo de músculos durante 5 segundos, com força mas sem dor.', 'Solta de repente e repara na diferença durante 15 segundos.', 'O cultivador mostra-te onde está a atenção. Com a voz ligada, podes fazer de olhos fechados.'],
    porque: 'Dezenas de ensaios mostram melhorias na qualidade do sono e na ansiedade. A Academia Americana de Medicina do Sono inclui-a nas terapias recomendadas para a insónia.',
    fonte: ['Edinger et al., Journal of Clinical Sleep Medicine (2021): recomendações da AASM para a insónia', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7853203/']},
  {id: 'imagem', nome: 'A nascente (imagem guiada)', para: ['sono', 'relaxar'], tipo: 'guiado', min: 4, evid: 'moderada',
    curto: 'Imaginas uma nascente na montanha, com todos os sentidos. Ocupa a mente e afasta os pensamentos que não te deixam dormir.',
    como: ['Deita-te e fecha os olhos.', 'Ouve a voz e imagina cada detalhe: sons, cheiros, temperatura.', 'Se a mente fugir para outra coisa, volta à nascente sem te zangares.'],
    porque: 'Em pessoas com insónia, imaginar uma cena calma e envolvente fez adormecer mais depressa do que só tentar distrair-se.',
    fonte: ['Harvey e Payne, Behaviour Research and Therapy (2002)', 'https://doi.org/10.1016/S0005-7967(01)00012-2']}
];
const EXI = Object.fromEntries(EXERCICIOS.map(e => [e.id, e]));

// Relaxamento muscular: zonas do cultivador (coordenadas do desenho 300 x 360).
const ZONAS = {pes: [[118, 304], [182, 304]], pernas: [[100, 288], [200, 288]], barriga: [[150, 236]], peito: [[150, 190]], maos: [[150, 257]], bracos: [[88, 222], [212, 222]],
  ombros: [[112, 160], [188, 160]], pescoco: [[150, 142]], maxilar: [[150, 130]], rosto: [[150, 112]], testa: [[150, 98]], tudo: [[150, 200]]};
const PMR = [
  ['pes', 'Encolhe os dedos dos pés e aperta os pés.', 'Solta. Sente os pés pesados e quentes.'],
  ['pernas', 'Estica as pernas e aperta as coxas e os gémeos.', 'Solta as pernas. Deixa-as cair.'],
  ['barriga', 'Aperta a barriga, como se fosses levar um toque.', 'Solta e deixa a barriga subir e descer com a respiração.'],
  ['peito', 'Inspira fundo e suster, com o peito cheio.', 'Expira devagar. Sente o peito a soltar-se.'],
  ['maos', 'Fecha as mãos com força.', 'Abre as mãos. Repara no formigueiro e no calor.'],
  ['bracos', 'Dobra os braços e aperta os bíceps.', 'Solta os braços ao lado do corpo.'],
  ['ombros', 'Sobe os ombros até às orelhas.', 'Deixa os ombros cair. Mais um pouco.'],
  ['pescoco', 'Encosta o queixo ao peito, devagar.', 'Volta ao centro e solta o pescoço.'],
  ['maxilar', 'Cerra os dentes, sem magoar.', 'Solta o maxilar. A boca fica entreaberta.'],
  ['rosto', 'Fecha os olhos com força e aperta o rosto.', 'Solta. O rosto descansa.'],
  ['testa', 'Franze a testa e sobe as sobrancelhas.', 'Solta. A testa fica lisa como água parada.']
];
const IMAGEM = [
  'Fecha os olhos. Respira devagar e deixa o corpo ficar pesado.',
  'Estás num caminho de montanha, à noite. O ar é fresco e cheira a pinheiro e a terra húmida.',
  'Ao longe ouves água a correr. Segues o som, sem pressa, passo a passo.',
  'Chegas a uma nascente. A água sai entre as pedras e cai num lago pequeno e muito calmo.',
  'A lua reflete-se na água. Pequenas ondas abrem-se em círculos, devagar.',
  'Sentas-te numa pedra lisa, ainda morna do sol do dia. O corpo apoia-se nela, pesado.',
  'Mergulhas as mãos na água fresca. Repara na temperatura, no movimento, no som.',
  'A cada expiração, a tensão do dia escorre das mãos para a água, e a corrente leva-a.',
  'Fica aqui o tempo que quiseres. A nascente continua a correr, calma, enquanto adormeces.'
];

/* ---------- Dados ---------- */
const diaSessao = () => { const d = new Date(); if (d.getHours() < 5) d.setDate(d.getDate() - 1); return diaChave(d); };
const guardarResp = () => { LS.set('respiracao', respiracao); marcarSujo(); };
const respHoje = () => respiracao.some(x => x.d === diaChave(agoraRitual().data) && x.completo);
// O Shen do dia, com as mesmas regras do Mirante: manhã 3, noite 3, respiração 3, registo da pele 1.
function shenHoje(){
  const k = diaChave(agoraRitual().data), r = registos[k] || {};
  const partes = [['Manhã', r.mF ? 3 : 0, 3], ['Noite', r.nF ? 3 : 0, 3], ['Respiração', respiracao.some(x => x.d === k && x.completo) ? 3 : 0, 3], ['Pele', pele.some(x => x.d === k) ? 1 : 0, 1]];
  return {partes, total: partes.reduce((t, p) => t + p[1], 0)};
}
// O retrato que o Mirante guardou neste navegador (as apps partilham o endereço e a memória).
function retratoMirante(){ try { const r = JSON.parse(localStorage.getItem('mirante.retrato')); return r && typeof r.r === 'number' ? r : null; } catch(e){ return null; } }
function avatarSinc(id, extra = {}){
  const R = retratoMirante(), sh = shenHoje(), hojeK = diaChave(new Date());
  const hoje = R && R.dia === hojeK ? Object.assign({}, R.hoje) : {jing: 0, qi: 0, forma: 0};
  const tes = Object.assign({ativos: R ? Object.assign({}, R.ativos, {shen: true}) : {shen: true}}, hoje, {shen: sh.total});
  return avatarM(Object.assign({r: R ? R.r : 0, f: R ? R.pct : 0, fluxo: R ? R.fluxoN || 0 : 0, id, tes, desvio: R ? (R.desvio || []).filter(t => t !== 'shen') : [], obj: R ? R.obj : null}, extra));
}

/* ---------- Vista Meditar ---------- */
let filtroMed = '';
const icEx = e => svg(e.tipo === 'guiado' ? (e.id === 'pmr' ? '<circle cx="12" cy="5" r="2"/><path d="M12 7v7M7 10.5l5-2 5 2M9 21l3-7 3 7"/><path d="M4 12h2M18 12h2" opacity=".6"/>' : '<path d="M3 17c3 0 3-2 6-2s3 2 6 2 3-2 6-2"/><path d="M3 21c3 0 3-2 6-2s3 2 6 2 3-2 6-2" opacity=".5"/><path d="M12 3c2.5 3.5 4 5.6 4 7.5a4 4 0 0 1-8 0C8 8.6 9.5 6.5 12 3z"/>')
  : '<circle cx="12" cy="12" r="2.6"/><circle cx="12" cy="12" r="6" opacity=".65"/><circle cx="12" cy="12" r="9.5" opacity=".35"/>', 1.5);
const duracaoTxt = (e, v) => e.ciclos ? `${v || e.ciclos} ciclos · ${Math.round((v || e.ciclos) * e.ciclo.reduce((s, f) => s + f[1], 0) / 6) / 10} min` : `${v || e.min} min`;
function sugestao(){
  const h = new Date().getHours(), noite = h >= 20 || h < 5, d = new Date().getDate();
  if (noite) return ['pmr', 'expira', 'imagem'][d % 3];
  return h < 12 ? 'ressonancia' : 'suspiro';
}
function rMeditar(){
  const R = retratoMirante(), sh = shenHoje(), sug = EXI[sugestao()], hn = new Date().getHours() >= 20 || new Date().getHours() < 5;
  const P = palcoM(R ? R.r : 0), semana = SEMANA.map(dw => { const k = diaChave(dataDaSemana(dw)), l = respiracao.filter(x => x.d === k); return {dw, k, feito: l.some(x => x.completo), min: l.reduce((t, x) => t + (+x.dur || 0), 0)}; });
  const minSem = Math.round(semana.reduce((t, x) => t + x.min, 0) / 60), hojeK = diaChave(agoraRitual().data);
  const lista = EXERCICIOS.filter(e => !filtroMed || e.para.includes(filtroMed));
  const ult = respiracao.slice().sort((a, b) => b.ts - a.ts).slice(0, 5);
  $('#vMeditar').innerHTML = `<h1 class="titulo-vista">Meditar</h1><p class="sub-vista">Poucos minutos para acalmar o espírito antes de dormir.</p>
    <div class="placa simples med-hero">
      <div class="med-palco">${P.fundo}<div class="med-fig capa-figura p${P.p}">${P.base}${avatarSinc('mh')}</div></div>
      <div class="med-info">
        <span class="suave mini">${R ? 'O teu cultivador · ' + esc(R.reino) : 'O teu cultivador'}</span>
        <b class="med-shen">Shen <span>${sh.total}</span> <small>de 10 hoje</small></b>
        <div class="med-partes">${sh.partes.map(([n, v, m]) => `<span class="${v ? 'on' : ''}">${n}<b>${v ? '+' + v : '·'}</b></span>`).join('')}</div>
        ${R ? '' : `<p class="suave mini" style="margin:6px 0 0">Abre o Mirante uma vez neste dispositivo para o cultivador aparecer igual ao de lá.</p>`}
      </div></div>
    <div class="placa col med-sug"><span class="suave mini">${hn ? 'Para adormecer' : 'Sugestão para agora'}</span>
      <div class="linha"><span class="med-ic">${icEx(sug)}</span><div class="cresce"><b class="serifa" style="font-size:20px">${esc(sug.nome)}</b><span class="suave peq" style="display:block">${esc(duracaoTxt(sug))} · ${esc(sug.curto)}</span></div></div>
      <button class="btn jade largo" data-acao="medComecar" data-id="${sug.id}">${IC.retomar} Começar${respHoje() ? '' : ' · +3 Shen'}</button></div>
    <div class="chips">${chip(!filtroMed, 'medFiltro', '', 'Todos')}${Object.entries(PARA).map(([k, n]) => chip(filtroMed === k, 'medFiltro', k, n)).join('')}</div>
    <div class="placa"><div class="lista">${lista.map(e => `<div class="item med-ex" data-acao="medVer" data-id="${e.id}"><span class="med-ic">${icEx(e)}</span>
      <div class="t"><b>${esc(e.nome)}</b><span>${esc(duracaoTxt(e))} · ${e.para.map(p => PARA[p]).join(', ')}</span></div><span class="tag ${EVID[e.evid][1]}">${e.evid}</span></div>`).join('')}</div></div>
    <div class="placa col"><h2>A tua semana</h2>
      <div class="semana">${semana.map(x => `<div class="dia${x.k === hojeK ? ' hoje' : ''}"><small>${DIAS_CURTO[x.dw]}</small><span class="med-gota${x.feito ? ' on' : ''}"></span><span class="mini suave">${x.min ? Math.round(x.min / 60) + '′' : ''}</span></div>`).join('')}</div>
      <p class="suave peq" style="margin:0">${minSem ? `${minSem} min esta semana.` : 'Ainda sem sessões esta semana.'} O progresso do cultivador vê-se no Mirante.</p>
      ${ult.length ? `<div class="lista">${ult.map(x => `<div class="item"><span class="med-ic">${icEx(EXI[x.ex] || EXERCICIOS[0])}</span><div class="t"><b>${esc(x.nome)}</b><span>${dataCurta(x.d)} · ${Math.max(1, Math.round(x.dur / 60))} min${x.completo ? '' : ' · incompleta'}${x.sentir ? ' · ' + esc(x.sentir) : ''}</span></div>${x.completo ? `<span class="tag">Shen</span>` : ''}</div>`).join('')}</div>` : ''}</div>
    <div class="placa col"><h2>Guia</h2><div class="chips">${chip(cfg.medSom !== false, 'medOp', 'medSom', 'Sons da respiração')}${chip(cfg.medVoz !== false, 'medOp', 'medVoz', 'Voz nos guiados')}${chip(cfg.medVibra !== false, 'medOp', 'medVibra', 'Vibração')}</div>
      <p class="suave mini" style="margin:0">Com o som ligado podes fazer os exercícios de olhos fechados: um tom sobe quando inspiras e desce quando expiras.</p></div>`;
}
function folhaExercicio(id){
  const e = EXI[id]; if (!e) return;
  const op = e.ciclos ? e.opcoes : e.opcoes || [e.min];
  abrirFolha(`${cab(esc(e.nome), `<span class="med-ic">${icEx(e)}</span>`)}
    <div class="tags"><span class="tag ${EVID[e.evid][1]}">${EVID[e.evid][0]}</span>${e.para.map(p => `<span class="tag apagado">${PARA[p]}</span>`).join('')}</div>
    <p style="margin:0">${esc(e.curto)}</p>
    <div class="col"><h3>Como fazer</h3><ol class="med-passos">${e.como.map(c => `<li>${esc(c)}</li>`).join('')}</ol></div>
    ${e.tipo === 'resp' ? `<div class="med-ritmo">${e.ciclo.map(([f, s, t]) => `<span class="mr-${f}"><b>${String(s).replace('.', ',')} s</b>${esc(t.split(',')[0])}</span>`).join('')}</div>` : ''}
    <div class="resposta-mestre"><span class="quem">Porque funciona</span>${esc(e.porque)}<br><a href="${e.fonte[1]}" target="_blank" rel="noopener" class="mini">${esc(e.fonte[0])}</a></div>
    ${e.aviso ? `<div class="alerta">${IC.alerta}<div>${esc(e.aviso)}</div></div>` : ''}
    ${op.length > 1 ? `<div><h3>Duração</h3><div class="chips">${op.map(v => chip(v === (e.ciclos || e.min), 'medDur', v, e.ciclos ? v + ' ciclos' : v + ' min')).join('')}</div></div>` : ''}
    <button class="btn jade largo" data-acao="medComecar" data-id="${e.id}">${IC.retomar} Começar${respHoje() ? '' : ' · +3 Shen'}</button>`, 'exercicio');
  medDurSel = e.ciclos || e.min;
}
let medDurSel = 0;

/* ---------- A sessão ---------- */
const SES = {on: false, ex: null, fases: [], total: 0, t0: 0, pausa: 0, pausadoEm: 0, i: -1, raf: 0, enchimento: 0, trava: null, fim: false, plano: 0};
const ses = {cv: null, c: null, w: 0, h: 0, ps: [], acc: 0, ult: 0, spr: null, sprB: null, alvo: {x: 0, y: 0}, corpo: {x: 0, y: 0}, figura: null};
function montarFases(e, v){
  const f = [];
  let t = 0; const add = (fase, s, txt, extra) => { f.push(Object.assign({f: fase, s, txt, ini: t}, extra || {})); t += s; };
  if (e.tipo === 'resp'){
    const ciclo = e.ciclo.reduce((s, x) => s + x[1], 0), n = e.ciclos ? v : Math.max(1, Math.round(v * 60 / ciclo));
    add('prep', 3, 'Prepara-te. Respira normalmente.');
    for (let i = 0; i < n; i++) for (const [fase, s, txt] of e.ciclo) add(fase, s, txt, {ciclo: i + 1, de: n});
  } else if (e.id === 'pmr'){
    add('voz', 14, 'Deita-te ou senta-te confortável. Vamos contrair cada grupo de músculos durante 5 segundos e depois soltar.', {zona: 'tudo'});
    for (const [z, c, s] of PMR){ add('contrai', 5, c, {zona: z}); add('solta', 15, s, {zona: z}); }
    add('voz', 18, 'Agora o corpo todo está solto. Respira devagar e sente o peso do corpo.', {zona: 'tudo'});
    add('voz', 14, 'A cada expiração, a tensão que sobrou escorre para a água da nascente.', {zona: 'tudo'});
  } else {
    IMAGEM.forEach(txt => add('voz', 26, txt));
  }
  return {fases: f, total: t};
}
function comecarSessao(id){
  const e = EXI[id]; if (!e) return;
  fecharFolha();
  const v = medDurSel && (e.ciclos ? e.opcoes : (e.opcoes || [e.min])).includes(medDurSel) ? medDurSel : (e.ciclos || e.min);
  const m = montarFases(e, v);
  Object.assign(SES, {on: true, ex: e, fases: m.fases, total: m.total, t0: performance.now(), pausa: 0, pausadoEm: 0, i: -1, enchimento: 0, fim: false, plano: m.total});
  const R = retratoMirante(), P = palcoM(R ? R.r : 0), el = $('#sessao');
  el.className = 'tipo-' + e.tipo; el.hidden = false; document.body.style.overflow = 'hidden';
  el.innerHTML = `<div class="ses-fundo">${P.fundo}</div><canvas id="sesQi" aria-hidden="true"></canvas>
    <div class="ses-topo"><button class="btn icone fantasma" data-acao="sesSair" aria-label="Terminar">${IC.x}</button>
      <div class="cresce centro"><b class="serifa">${esc(e.nome)}</b><small>${R ? esc(R.reino) : ''}</small></div><span id="sesTempo" class="ses-tempo"></span></div>
    <div class="ses-fig capa-figura p${P.p}" id="sesFig">${P.base}<div class="ses-guia" id="sesGuia"><i></i></div>${avatarSinc('ss')}<div id="sesZonas"></div></div>
    <div class="ses-base"><p class="ses-fase" id="sesFase"></p><p class="ses-ciclo mini suave" id="sesCiclo"></p><p class="ses-conta" id="sesConta"></p>
      <div class="ses-barra"><i id="sesBarra"></i></div>
      <div class="ses-ctrl"><button class="btn fantasma peq-btn" data-acao="sesPausa" id="sesPausaB">${IC.pausa} Pausa</button><button class="btn fantasma peq-btn" data-acao="sesSom" id="sesSomB">${cfg.medSom !== false ? 'Som ligado' : 'Som desligado'}</button></div></div>`;
  ses.cv = $('#sesQi'); ses.c = ses.cv.getContext('2d'); ses.ps = []; ses.spr = spriteSes(SHEN_RGB); ses.sprB = spriteSes('235,255,250');
  ses.figura = $('#sesFig .cultivador'); if (ses.figura) ses.figura.classList.add('guiado');
  sesGeo(); pedirTrava();
  try { speechSynthesis.cancel(); } catch(e){}
  cancelAnimationFrame(SES.raf); SES.raf = requestAnimationFrame(passoSessao);
}
function spriteSes(cor){ const s = document.createElement('canvas'); s.width = s.height = 32; const c = s.getContext('2d'), g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, `rgba(${cor},1)`); g.addColorStop(.3, `rgba(${cor},.5)`); g.addColorStop(1, `rgba(${cor},0)`); c.fillStyle = g; c.fillRect(0, 0, 32, 32); return s; }
function sesGeo(){
  if (!ses.cv) return; const dpr = Math.min(1.5, devicePixelRatio || 1);
  ses.w = innerWidth; ses.h = innerHeight; ses.cv.width = ses.w * dpr; ses.cv.height = ses.h * dpr; ses.c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const svgEl = $('#sesFig .cultivador'); if (!svgEl) return;
  const b = svgEl.getBoundingClientRect(), pt = (x, y) => ({x: b.left + x / 300 * b.width, y: b.top + y / 360 * b.height});
  ses.alvo = pt(150, 99); ses.corpo = pt(150, 200); ses.box = b;
  const g = $('#sesGuia'); if (g){ const c = pt(150, 190), r = b.width * .62; Object.assign(g.style, {left: (c.x - b.left - r) + 'px', top: (c.y - b.top - r) + 'px', width: 2 * r + 'px', height: 2 * r + 'px'}); }
}
addEventListener('resize', () => { if (SES.on) setTimeout(sesGeo, 60); });
const easeIO = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
function passoSessao(ts){
  if (!SES.on) return;
  SES.raf = requestAnimationFrame(passoSessao);
  const agora = performance.now(), t = SES.pausadoEm ? (SES.pausadoEm - SES.t0 - SES.pausa) / 1000 : (agora - SES.t0 - SES.pausa) / 1000;
  const dt = Math.min(.05, (ts - (ses.ult || ts)) / 1000); ses.ult = ts;
  if (SES.fim) return desenharSes(dt);
  if (t >= SES.total) return terminarSessao(true);
  let i = SES.i < 0 ? 0 : SES.i; while (i > 0 && t < SES.fases[i].ini) i--; while (i + 1 < SES.fases.length && t >= SES.fases[i + 1].ini) i++;
  const F = SES.fases[i], p = Math.min(1, Math.max(0, (t - F.ini) / F.s));
  if (i !== SES.i){ SES.i = i; mudouFase(F, SES.fases[i - 1]); }
  // Enchimento dos pulmões (0 vazio, 1 cheio), que move a guia e o corpo do cultivador.
  let e = SES.enchimento;
  if (SES.ex.tipo === 'resp'){
    const prox = SES.fases[i + 1];
    if (F.f === 'in') e = easeIO(p) * (prox && prox.f === 'in2' ? .82 : 1);
    else if (F.f === 'in2') e = .82 + easeIO(p) * .22;
    else if (F.f === 'out') e = (F.e0 ?? (F.e0 = SES.enchimento)) * (1 - easeIO(p));
    else if (F.f === 'hold2' || F.f === 'prep') e = F.f === 'prep' ? .15 + .1 * Math.sin(t * 2) : 0;
  } else { const ritmo = (t % 11) / 11; e = ritmo < 5 / 11 ? easeIO(ritmo * 11 / 5) : 1 - easeIO((ritmo * 11 - 5) / 6); e *= F.f === 'contrai' ? .6 : 1; }
  SES.enchimento = e;
  const resto = Math.max(0, F.s - (t - F.ini)), prog = Math.min(1, t / SES.total);
  $('#sesConta').textContent = SES.ex.tipo === 'resp' && F.f !== 'prep' ? Math.ceil(resto) : '';
  $('#sesBarra').style.width = (prog * 100).toFixed(1) + '%';
  const falta = Math.max(0, Math.ceil(SES.total - t)); $('#sesTempo').textContent = `${Math.floor(falta / 60)}:${pad(falta % 60)}`;
  const g = $('#sesGuia i'); if (g) g.style.transform = `scale(${(.42 + e * .58).toFixed(3)})`;
  if (ses.figura){
    const corpo = ses.figura.querySelector('.c-respira'), aura = ses.figura.querySelector('.c-aura'), shen = ses.figura.querySelector('.d-shen .c-dan-h');
    if (corpo) corpo.style.transform = `scale(${(1 + e * .022).toFixed(4)}, ${(1 + e * .034).toFixed(4)})`;
    if (aura){ aura.style.transform = `scale(${(1 + e * .1).toFixed(3)})`; aura.style.opacity = (.35 + e * .45 + prog * .2).toFixed(2); }
    if (shen) shen.style.transform = `scale(${(1 + prog * 1.4 + (F.f === 'out' ? (1 - p) * .25 : 0)).toFixed(3)})`;
  }
  // Partículas de Shen: entram na testa ao inspirar; ao expirar, uma bruma clara sai do corpo.
  const taxa = SES.pausadoEm ? 0 : SES.ex.tipo === 'resp' ? ({in: 42, in2: 60, hold: 6, hold2: 2, out: 0, prep: 6})[F.f] || 8 : F.f === 'solta' ? 26 : 12;
  ses.acc += dt * taxa;
  while (ses.acc > 1 && ses.ps.length < 220){ ses.acc--; ses.ps.push(moteEntra()); }
  if (!SES.pausadoEm && ((SES.ex.tipo === 'resp' && F.f === 'out') || F.f === 'solta') && Math.random() < dt * (F.f === 'solta' ? 14 : 18)) ses.ps.push(moteSai(F));
  desenharSes(dt);
}
function moteEntra(){
  const a = Math.random() * Math.PI * 2, R = Math.max(ses.w, ses.h) * (.25 + Math.random() * .4);
  return {x: ses.alvo.x + Math.cos(a) * R, y: ses.alvo.y + Math.sin(a) * R * .9, a, R, rot: (Math.random() < .5 ? -1 : 1) * (.4 + Math.random() * .6), v: .5 + Math.random() * .5, s: 5 + Math.random() * 6, vida: 0, tipo: 'in'};
}
function moteSai(F){
  const z = F.zona && ZONAS[F.zona] ? ZONAS[F.zona][Math.floor(Math.random() * ZONAS[F.zona].length)] : [150, 200], b = ses.box;
  const x = b ? b.left + z[0] / 300 * b.width : ses.corpo.x, y = b ? b.top + z[1] / 360 * b.height : ses.corpo.y;
  return {x, y, vx: (Math.random() - .5) * 30, vy: -10 - Math.random() * 22, s: 7 + Math.random() * 8, vida: 0, tipo: 'out'};
}
function desenharSes(dt){
  const c = ses.c; c.clearRect(0, 0, ses.w, ses.h); c.globalCompositeOperation = 'lighter';
  for (const p of ses.ps){
    p.vida += dt;
    if (p.tipo === 'in'){
      const f = SES.ex && SES.fases[SES.i] ? SES.fases[SES.i].f : 'in', vel = SES.pausadoEm ? 0 : f === 'in' || f === 'in2' ? 1.6 : f.startsWith('hold') || f === 'contrai' ? .35 : .9;
      p.R -= p.v * vel * (50 + 120 / Math.max(.4, p.R / 100)) * dt; p.a += p.rot * dt * (1 + 70 / Math.max(20, p.R));
      p.x = ses.alvo.x + Math.cos(p.a) * p.R; p.y = ses.alvo.y + Math.sin(p.a) * p.R * .9;
      c.globalAlpha = Math.max(0, Math.min(1, p.vida * 1.4) * Math.min(1, p.R / 26) * .85);
      const s = p.s * (.5 + Math.min(1, p.R / 150) * .7); c.drawImage(ses.spr, p.x - s / 2, p.y - s / 2, s, s);
    } else {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 4 * dt;
      c.globalAlpha = Math.max(0, .5 * (1 - p.vida / 2.4)); const s = p.s * (1 + p.vida * .8); c.drawImage(ses.sprB, p.x - s / 2, p.y - s / 2, s, s);
    }
  }
  ses.ps = ses.ps.filter(p => p.tipo === 'in' ? p.R > 5 : p.vida < 2.4); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
function mudouFase(F, ant){
  $('#sesFase').textContent = F.txt;
  const el = $('#sessao'); el.dataset.fase = F.f;
  if (F.zona !== undefined || (ant && ant.zona)) mostrarZona(F);
  if (F.f !== 'prep') somFase(F);
  if (cfg.medVibra !== false && SES.ex.tipo === 'resp' && F.f !== 'prep') vibrar(F.f === 'in' ? 18 : F.f === 'out' ? [10, 60, 10] : 8);
  if (SES.ex.tipo === 'guiado' && cfg.medVoz !== false) falar(F.txt);
  $('#sesCiclo').textContent = SES.ex.tipo === 'resp' && F.ciclo && F.de > 1 && F.de <= 12 ? `Ciclo ${F.ciclo} de ${F.de}` : '';
}
function mostrarZona(F){
  const box = $('#sesZonas'); if (!box) return;
  const z = F.zona && ZONAS[F.zona]; if (!z){ box.innerHTML = ''; return; }
  box.innerHTML = z.map(([x, y]) => `<span class="ses-zona ${F.f}" style="left:${(x / 300 * 100).toFixed(2)}%;top:${(y / 360 * 100).toFixed(2)}%;--tam:${F.zona === 'tudo' ? 74 : 16}%"></span>`).join('');
}
// Sons sintetizados: um tom que sobe ao inspirar e desce ao expirar; um sino suave ao suster.
let audioM = null;
function somFase(F){
  if (cfg.medSom === false) return;
  try {
    audioM = audioM || new (window.AudioContext || window.webkitAudioContext)(); if (audioM.state === 'suspended') audioM.resume();
    const t = audioM.currentTime, g = audioM.createGain(), o = audioM.createOscillator(), dur = Math.min(F.s, 9);
    o.type = 'sine'; g.connect(audioM.destination); o.connect(g);
    if (F.f === 'in' || F.f === 'in2' || F.f === 'out'){
      const [a, b] = F.f === 'out' ? [262, 174] : F.f === 'in2' ? [262, 294] : [174, 262];
      o.frequency.setValueAtTime(a, t); o.frequency.exponentialRampToValueAtTime(b, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.07, t + .35); g.gain.setValueAtTime(.07, t + Math.max(.4, dur - .5)); g.gain.linearRampToValueAtTime(0, t + dur);
      o.start(t); o.stop(t + dur + .05);
    } else {
      o.frequency.value = F.f === 'contrai' ? 330 : F.f === 'solta' ? 220 : 392; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.08, t + .01); g.gain.exponentialRampToValueAtTime(.0005, t + 1.8);
      o.start(t); o.stop(t + 1.9);
    }
  } catch(e){}
}
let vozPT = null;
function falar(txt){
  try {
    if (!('speechSynthesis' in window)) return;
    if (!vozPT){ const vs = speechSynthesis.getVoices(); vozPT = vs.find(v => /pt[-_]PT/i.test(v.lang)) || vs.find(v => /^pt/i.test(v.lang)) || null; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt); u.lang = 'pt-PT'; if (vozPT) u.voice = vozPT; u.rate = .88; u.pitch = .92; u.volume = .9;
    speechSynthesis.speak(u);
  } catch(e){}
}
try { if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { vozPT = null; }; } catch(e){}
async function pedirTrava(){ try { if ('wakeLock' in navigator) SES.trava = await navigator.wakeLock.request('screen'); } catch(e){} }
function soltarTrava(){ try { SES.trava && SES.trava.release(); } catch(e){} SES.trava = null; }
function pausarSessao(){
  if (!SES.on || SES.fim) return;
  if (SES.pausadoEm){ SES.pausa += performance.now() - SES.pausadoEm; SES.pausadoEm = 0; $('#sesPausaB').innerHTML = `${IC.pausa} Pausa`; $('#sessao').classList.remove('pausado'); }
  else { SES.pausadoEm = performance.now(); $('#sesPausaB').innerHTML = `${IC.retomar} Continuar`; $('#sessao').classList.add('pausado'); try { speechSynthesis.cancel(); } catch(e){} }
}
function terminarSessao(chegouAoFim){
  if (!SES.on || SES.fim) return;
  SES.fim = true; try { speechSynthesis.cancel(); } catch(e){}
  const agora = performance.now(), feito = ((SES.pausadoEm || agora) - SES.t0 - SES.pausa) / 1000, completo = chegouAoFim || feito >= SES.plano * .8;
  const jaHavia = respHoje();
  if (feito >= 20){
    respiracao.push({id: uid(), d: diaSessao(), ts: Date.now(), ex: SES.ex.id, nome: SES.ex.nome, dur: Math.round(Math.min(feito, SES.plano)), plano: Math.round(SES.plano), completo});
    guardarResp();
  }
  const el = $('#sessao'); el.classList.add('fim'); el.dataset.fase = 'fim';
  if (completo){
    if (cfg.medSom !== false) somFase({f: 'hold', s: 2});
    vibrar([20, 60, 30]);
    for (let i = 0; i < 50; i++) ses.ps.push(Object.assign(moteEntra(), {R: 60 + Math.random() * 160, v: 1.4}));
  }
  const shenTxt = completo ? (jaHavia ? 'O Shen de hoje já estava recolhido. O espírito agradece.' : '+3 Shen para o teu cultivador') : 'Sessão curta: para o Shen contar, faz pelo menos 80% do exercício.';
  $('.ses-base').innerHTML = `<p class="ses-fase">${completo ? 'Shen recolhido' : 'Até à próxima'}</p><p class="suave" style="margin:0 0 12px">${esc(shenTxt)}</p>
    ${feito >= 20 ? `<div class="chips centro-chips">${['Mais calmo', 'Com sono', 'Igual'].map(s => `<span class="chip" data-acao="sesSentir" data-v="${s}">${s}</span>`).join('')}</div>` : ''}
    <div class="ses-ctrl"><button class="btn peq-btn" data-acao="medComecar" data-id="${SES.ex.id}">Repetir</button><button class="btn jade peq-btn" data-acao="sesFechar">Fechar</button></div>`;
  setTimeout(() => { if (SES.fim){ SES.on = false; cancelAnimationFrame(SES.raf); } }, completo ? 2800 : 300);
  soltarTrava();
  if (vista === 'vMeditar') rMeditar(); else if (vista === 'vRitual') rRitual();
}
function fecharSessao(){
  SES.on = false; cancelAnimationFrame(SES.raf); soltarTrava(); try { speechSynthesis.cancel(); } catch(e){}
  const el = $('#sessao'); el.hidden = true; el.innerHTML = ''; document.body.style.overflow = '';
  renderAtual();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && SES.on && !SES.fim && !SES.pausadoEm) pausarSessao(); });
addEventListener('storage', e => { if (e.key === 'mirante.retrato' && vista === 'vMeditar' && !SES.on) rMeditar(); });

// Cartão para o ritual da noite: acabar o dia com a respiração.
function blocoAntesDormir(){
  const e = EXI[sugestao()], feito = respHoje();
  return `<div class="placa col med-noite"><div class="linha"><span class="med-ic">${icEx(e)}</span><div class="cresce"><span class="suave mini">Antes de dormir</span><b class="serifa" style="font-size:19px;display:block">${feito ? 'Shen de hoje recolhido' : esc(e.nome)}</b>
    <span class="suave peq">${feito ? 'Fizeste a respiração de hoje. Podes repetir se quiseres.' : esc(duracaoTxt(e)) + ' para acalmar o corpo e o espírito.'}</span></div></div>
    <div class="botoes"><button class="btn${feito ? '' : ' jade'}" data-acao="medComecar" data-id="${e.id}">${IC.retomar} ${feito ? 'Repetir' : 'Começar · +3 Shen'}</button><button class="btn fantasma" data-vista="vMeditar">Outros exercícios</button></div></div>`;
}

const ACOES_MED = {
  medVer: el => folhaExercicio(el.dataset.id),
  medComecar: el => { const e = EXI[el.dataset.id]; if (e && folhaAtual !== 'exercicio') medDurSel = e.ciclos || e.min; if (!$('#sessao').hidden) fecharSessaoSilencio(); comecarSessao(el.dataset.id); },
  medDur(el){ medDurSel = +el.dataset.v; el.parentNode.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === el)); },
  medFiltro(el){ filtroMed = el.dataset.v; rMeditar(); },
  medOp(el){ cfg[el.dataset.v] = cfg[el.dataset.v] === false; guardarCfg(); el.classList.toggle('on'); },
  sesSair(){ if (SES.fim) return fecharSessao(); terminarSessao(false); },
  sesPausa: pausarSessao,
  sesSom(el){ cfg.medSom = cfg.medSom === false; guardarCfg(); el.textContent = cfg.medSom !== false ? 'Som ligado' : 'Som desligado'; },
  sesSentir(el){ const u = respiracao[respiracao.length - 1]; if (u){ u.sentir = el.dataset.v; u.ts = Date.now(); guardarResp(); } el.parentNode.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === el)); },
  sesFechar: fecharSessao
};
function fecharSessaoSilencio(){ SES.on = false; cancelAnimationFrame(SES.raf); soltarTrava(); }
