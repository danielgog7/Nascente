'use strict';
/* Nascente — motor da rotina.
   Regras locais (funcionam sem IA e sem internet): ordem dos passos, ativos que não vão juntos,
   noites de retinoide / esfoliação / recuperação, e fila de produtos repetidos (um em uso, os outros em espera). */

const DIA = 864e5;
const pad = n => String(n).padStart(2, '0');
const diaChave = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const deChave = k => { const [a, m, d] = k.split('-').map(Number); return new Date(a, m - 1, d); };
const DIAS_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_LONGO = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const SEMANA = [1, 2, 3, 4, 5, 6, 0]; // começa à segunda

/* ---------- Catálogos ---------- */
// tipo: [nome, ordem no ritual, quando por defeito, ícone, essencial]
const TIPOS = {
  desmaq:       ['Desmaquilhante / óleo de limpeza', 10, 'noite', 'doseador', 0],
  limpeza:      ['Gel ou espuma de limpeza', 20, 'ambos', 'doseador', 1],
  esfoliante:   ['Esfoliante', 30, 'noite', 'bisnaga', 0],
  mascara:      ['Máscara (para enxaguar)', 35, 'noite', 'boiao', 0],
  tonico:       ['Tónico / essência', 40, 'ambos', 'frasco', 0],
  serum:        ['Sérum', 50, 'ambos', 'contagotas', 0],
  tratamento:   ['Tratamento (borbulhas, manchas, retinoide)', 60, 'noite', 'bisnaga', 0],
  olhos:        ['Contorno de olhos', 70, 'ambos', 'mini', 0],
  outro:        ['Outro', 75, 'ambos', 'frasco', 0],
  hidratante:   ['Hidratante', 80, 'ambos', 'boiao', 1],
  oleo:         ['Óleo facial', 85, 'noite', 'contagotas', 0],
  mascaraNoite: ['Máscara de noite (sem enxaguar)', 88, 'noite', 'boiao', 0],
  protetor:     ['Protetor solar', 90, 'manha', 'bisnaga', 1],
  labios:       ['Bálsamo de lábios', 95, 'ambos', 'batom', 0]
};
const ATIVOS = {
  retinoide: 'Retinoide (retinol, retinal, adapaleno)', aha: 'AHA (glicólico, láctico, mandélico)', bha: 'BHA (ácido salicílico)',
  pha: 'PHA (gluconolactona)', vitc: 'Vitamina C', niacinamida: 'Niacinamida', peroxido: 'Peróxido de benzoílo', azelaico: 'Ácido azelaico',
  cobre: 'Péptidos de cobre', peptidos: 'Péptidos', hialuronico: 'Ácido hialurónico', ceramidas: 'Ceramidas', ureia: 'Ureia',
  enxofre: 'Enxofre', zinco: 'Zinco', argila: 'Argila / carvão', fisico: 'Grânulos esfoliantes', enzimas: 'Enzimas esfoliantes',
  despigmentante: 'Despigmentantes (arbutina, tranexâmico)', bakuchiol: 'Bakuchiol', calmante: 'Calmantes (centella, pantenol)',
  antioxidante: 'Antioxidantes (vit. E, ferúlico)', spf: 'Filtro solar'
};
const ATIVO_CURTO = {retinoide: 'Retinoide', aha: 'AHA', bha: 'BHA', pha: 'PHA', vitc: 'Vit. C', niacinamida: 'Niacinamida', peroxido: 'Peróxido', azelaico: 'Azelaico',
  cobre: 'Cobre', peptidos: 'Péptidos', hialuronico: 'Hialurónico', ceramidas: 'Ceramidas', ureia: 'Ureia', enxofre: 'Enxofre', zinco: 'Zinco', argila: 'Argila',
  fisico: 'Grânulos', enzimas: 'Enzimas', despigmentante: 'Despigmentante', bakuchiol: 'Bakuchiol', calmante: 'Calmante', antioxidante: 'Antioxidante', spf: 'SPF'};
const EXF = new Set(['aha', 'bha', 'pha', 'fisico', 'enzimas']);
// Prioridade para escolher o ativo principal de um produto (e para ordenar séruns: vitamina C primeiro, os mais fortes antes dos hidratantes).
const PRIORIDADE = ['vitc', 'retinoide', 'peroxido', 'aha', 'bha', 'pha', 'azelaico', 'despigmentante', 'niacinamida', 'cobre', 'bakuchiol', 'peptidos', 'enxofre', 'zinco', 'hialuronico', 'ceramidas', 'calmante', 'ureia', 'antioxidante'];

const MODO = {
  desmaq: 'Com a pele seca, massaja cerca de 1 minuto para dissolver protetor e impurezas. Junta um pouco de água para emulsionar e enxagua.',
  limpeza: 'Molha o rosto, faz espuma nas mãos e massaja 30 a 60 segundos. Enxagua com água morna e seca com toques suaves.',
  esfoliante: 'Na pele limpa e seca, aplica uma camada fina, sem tocar nos olhos nem nos lábios. Respeita o tempo indicado no frasco.',
  mascara: 'Camada uniforme na pele limpa. Deixa atuar o tempo indicado (normalmente 10 a 15 minutos) e enxagua bem.',
  tonico: 'Aplica com as mãos ou com um disco de algodão, a pequenos toques, até a pele absorver.',
  serum: '2 a 3 gotas nas pontas dos dedos. Espalha no rosto e pescoço a toques leves e espera cerca de 1 minuto.',
  tratamento: 'Camada fina só onde precisas. Se for retinoide: quantidade de uma ervilha para o rosto todo, longe dos olhos e dos cantos do nariz.',
  olhos: 'Um grão de arroz por olho. Aplica com o dedo anelar, a toques, no osso à volta do olho.',
  outro: 'Segue as indicações do produto.',
  hidratante: 'Quantidade de uma avelã. Aquece entre os dedos e espalha no rosto e pescoço, de dentro para fora.',
  oleo: '2 a 3 gotas aquecidas nas mãos. Pressiona sobre o rosto.',
  mascaraNoite: 'Camada fina como último passo da noite. Não se enxagua.',
  protetor: 'Dois dedos de produto para rosto e pescoço, 15 minutos antes de sair. Renova a cada 2 horas se estiveres ao sol.',
  labios: 'Aplica sempre que sentires os lábios secos.'
};

function modoPadrao(p){
  if (p.modo) return p.modo;
  if (ehRet(p)) return 'Com a pele limpa e bem seca, quantidade de uma ervilha para o rosto todo. Evita olhos, cantos do nariz e da boca. Se arder, aplica o hidratante antes (técnica sanduíche).';
  if (ehExf(p) && p.tipo !== 'esfoliante' && p.tipo !== 'mascara') return 'Na pele limpa e seca, aplica uma camada fina (com um disco de algodão se for líquido), sem tocar nos olhos nem nos lábios. Não enxagues.';
  return MODO[p.tipo] || MODO.outro;
}

// Pares que não vão juntos no mesmo ritual: [grupo A, grupo B, gravidade, porquê, solução]
const CONFLITOS = [
  ['retinoide', 'exf', 'evitar', 'Ambos aceleram a renovação da pele: juntos irritam, secam e fragilizam a barreira.', 'Noites diferentes.'],
  ['retinoide', 'peroxido', 'evitar', 'O peróxido de benzoílo degrada alguns retinoides e juntos irritam muito.', 'Peróxido de manhã, retinoide à noite.'],
  ['retinoide', 'vitc', 'cuidado', 'Rendem mais separados e juntos podem irritar.', 'Vitamina C de manhã, retinoide à noite.'],
  ['retinoide', 'retinoide', 'evitar', 'Dois retinoides no mesmo ritual é demasiado forte.', 'Usa um de cada vez; o outro fica em espera.'],
  ['vitc', 'exf', 'cuidado', 'Os ácidos esfoliantes juntos com a vitamina C aumentam a irritação.', 'Vitamina C de manhã, esfoliantes à noite.'],
  ['vitc', 'peroxido', 'evitar', 'O peróxido de benzoílo oxida a vitamina C e anula-a.', 'Em rituais diferentes.'],
  ['cobre', 'vitc', 'cuidado', 'Péptidos de cobre e vitamina C anulam-se parcialmente.', 'Cobre à noite, vitamina C de manhã.'],
  ['cobre', 'exf', 'cuidado', 'Os ácidos desestabilizam os péptidos de cobre.', 'Cobre nas noites sem esfoliação.'],
  ['exf', 'exf', 'evitar', 'Esfoliar duas vezes no mesmo ritual danifica a barreira da pele.', 'Um esfoliante por noite, em rotação.'],
  ['peroxido', 'exf', 'cuidado', 'Juntos secam e irritam a pele.', 'Em rituais diferentes.'],
  ['enxofre', 'retinoide', 'cuidado', 'Juntos ressecam muito a pele.', 'Em rituais diferentes.']
];
const PESO = {retinoide: 6, exf: 5, peroxido: 4, vitc: 3, cobre: 2, enxofre: 1};

/* ---------- Classificação dos produtos ---------- */
const ativosDe = p => Array.isArray(p.ativos) ? p.ativos : [];
const temAtivo = (p, a) => ativosDe(p).includes(a);
const enxaguar = p => ['limpeza', 'desmaq'].includes(p.tipo); // contacto curto: não conta para conflitos
const ehRet = p => !enxaguar(p) && temAtivo(p, 'retinoide');
const ehExf = p => p.tipo === 'esfoliante' || (!enxaguar(p) && ativosDe(p).some(a => EXF.has(a)));
const ehMascara = p => p.tipo === 'mascara' && !ehExf(p);
const medicada = p => p.tipo === 'limpeza' && ativosDe(p).some(a => a === 'peroxido' || EXF.has(a));
const ativoPrincipal = p => PRIORIDADE.find(a => temAtivo(p, a)) || 'base';
// Grupos de conflito de um produto (os produtos de enxaguar ficam de fora).
function grupos(p){
  if (enxaguar(p)) return [];
  const g = new Set(ativosDe(p).filter(a => PESO[a]));
  if (ehExf(p)) g.add('exf');
  return [...g];
}
function chaveFila(p){
  if (p.tipo === 'outro') return 'outro:' + p.id;
  if (p.tipo === 'limpeza') return 'limpeza:' + (medicada(p) ? ativoPrincipal(p) : 'suave');
  if (['serum', 'tratamento', 'esfoliante', 'tonico'].includes(p.tipo)) return p.tipo + ':' + ativoPrincipal(p);
  if (p.tipo === 'mascara') return 'mascara:' + (temAtivo(p, 'argila') ? 'argila' : ehExf(p) ? 'exf' : 'hidra');
  return p.tipo + ':' + (p.quando === 'manha' || p.quando === 'noite' ? p.quando : 'x');
}
const validadeDe = p => {
  const ds = [];
  if (p.aberto && +p.pao) { const d = deChave(p.aberto); d.setMonth(d.getMonth() + +p.pao); ds.push(d); }
  if (/^\d{4}-\d{2}$/.test(p.validade || '')) { const [a, m] = p.validade.split('-').map(Number); ds.push(new Date(a, m, 0)); }
  return ds.length ? new Date(Math.min(...ds)) : null;
};

/* ---------- Fila: com produtos repetidos, um está em uso e os outros esperam ---------- */
function calcularFila(produtos){
  const vivos = produtos.filter(p => !p.fim && !p.pausa), grupos = {};
  for (const p of vivos) (grupos[chaveFila(p)] = grupos[chaveFila(p)] || []).push(p);
  const uso = [], espera = [];
  for (const lista of Object.values(grupos)){
    lista.sort((a, b) => (b.agora || 0) - (a.agora || 0) || (a.aberto ? 0 : 1) - (b.aberto ? 0 : 1) || String(a.aberto || '').localeCompare(String(b.aberto || ''))
      || ((validadeDe(a) || 9e15) - (validadeDe(b) || 9e15)) || (a.criado || 0) - (b.criado || 0));
    uso.push(lista[0]);
    lista.slice(1).forEach((p, i) => espera.push({p, depois: lista[i], pos: i + 1}));
  }
  return {uso, espera};
}

/* ---------- Quando vai cada produto (manhã, noite ou ambos) ---------- */
function quandoEfetivo(p, uso){
  if (p.tipo === 'protetor') return 'manha';
  if (ehRet(p) || ehExf(p) || ['mascara', 'mascaraNoite'].includes(p.tipo)) return 'noite';
  const q = p.quando || TIPOS[p.tipo][2];
  const ha = f => uso.some(o => o !== p && f(o));
  if (temAtivo(p, 'vitc') && q !== 'noite') return 'manha';
  if (temAtivo(p, 'vitc') && ha(o => ehRet(o) || ehExf(o) || temAtivo(o, 'peroxido'))) return 'manha';
  if (temAtivo(p, 'peroxido') && !enxaguar(p) && ha(o => temAtivo(o, 'vitc') && !enxaguar(o))) return 'noite';
  if (temAtivo(p, 'peroxido') && !enxaguar(p) && ha(ehRet)) return 'manha';
  if (temAtivo(p, 'cobre') && ha(o => temAtivo(o, 'vitc'))) return 'noite';
  if (medicada(p) && ha(ehRet) && ha(o => o.tipo === 'limpeza' && !medicada(o))) return 'manha';
  if (p.tipo === 'limpeza' && !medicada(p) && ha(o => medicada(o)) && ha(ehRet)) return 'noite';
  return q;
}

/* ---------- Plano da semana ---------- */
const ESPALHAR = {1: [3], 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 6], 5: [1, 2, 3, 5, 6], 6: [1, 2, 3, 4, 5, 6]};
const EXF_DIAS = {1: [3], 2: [2, 6], 3: [1, 3, 5]};
const RET_ORDEM = [1, 4, 0, 3, 5, 2, 6];
const RAMPA = {normal: [2, 2, 3, 3, 4, 4, 4, 4, 5], sensivel: [2, 2, 2, 3, 3, 3, 4, 4, 4]};

function planoSemana(ctx){
  const {uso, cfg, pele, hoje} = ctx, notas = [];
  const rets = uso.filter(ehRet), exfs = uso.filter(ehExf), mascaras = uso.filter(ehMascara);
  const sensivel = cfg.sensivel || cfg.pele === 'sensivel' || cfg.pele === 'seca';
  let E = 0, R = 0;
  if (exfs.length){
    E = +cfg.exf || (sensivel ? 1 : cfg.pele === 'oleosa' && (cfg.preocupacoes || []).some(x => x === 'acne' || x === 'pontos') ? 3 : 2);
    E = Math.min(E, exfs.reduce((s, p) => s + (+p.vezes || 2), 0), 3);
  }
  if (rets.length){
    if (+cfg.retFixo) R = +cfg.retFixo;
    else {
      const sem = cfg.retInicio ? Math.max(0, Math.floor((hoje - deChave(cfg.retInicio)) / (7 * DIA))) : 0, r = RAMPA[sensivel ? 'sensivel' : 'normal'];
      R = r[Math.min(sem, r.length - 1)];
      if (sem < r.length - 1) notas.push(`Retinoide em adaptação (semana ${sem + 1}): ${R} noites por semana. A app aumenta sozinha à medida que a pele se habitua.`);
    }
  }
  // Pele irritada nos últimos dias: abranda.
  const recentes = (pele || []).filter(r => hoje - deChave(r.d) <= 4 * DIA);
  if (recentes.some(r => r.irritacao >= 3) && (R || E)){
    if (R > 1) R--; if (E > 1) E--;
    notas.push('A tua pele está irritada: esta semana há menos noites de retinoide e esfoliação, e mais noites de recuperação.');
  }
  if (R + E > 6) R = 6 - E;
  const noites = Array(7).fill(rets.length || exfs.length ? 'descanso' : 'normal');
  const exfDias = E ? EXF_DIAS[E] : [];
  for (const d of exfDias) noites[d] = 'exf';
  RET_ORDEM.filter(d => noites[d] !== 'exf').slice(0, R).forEach(d => { noites[d] = 'ret'; });
  // Esfoliantes em rotação: cada noite de esfoliação usa um só.
  const exfDia = {}, quota = new Map(exfs.map(p => [p.id, +p.vezes || 2]));
  let i = 0;
  for (const d of exfDias){
    for (let k = 0; k < exfs.length; k++){
      const p = exfs[(i + k) % exfs.length];
      if (quota.get(p.id) > 0){ exfDia[d] = p.id; quota.set(p.id, quota.get(p.id) - 1); i = (i + k + 1) % exfs.length; break; }
    }
  }
  // Máscaras nas noites de recuperação.
  const livres = SEMANA.filter(d => noites[d] === 'descanso' || noites[d] === 'normal'), mascaraDias = {};
  let j = 0;
  for (const p of mascaras){
    const n = Math.min(+p.vezes || 1, 2), dias = [];
    for (let k = 0; k < n && livres.length; k++){ dias.push(livres[j % livres.length]); j++; }
    if (dias.length) mascaraDias[p.id] = dias; else notas.push(`Não há noites livres para a máscara ${p.nome}: usa-a numa noite em que saltes o resto da rotina.`);
  }
  // Produtos comuns que não são diários.
  const semanais = {};
  for (const p of uso) if (!ehRet(p) && !ehExf(p) && !ehMascara(p) && p.tipo !== 'protetor' && +p.vezes && +p.vezes < 7) semanais[p.id] = ESPALHAR[+p.vezes];
  return {noites, exfDia, mascaraDias, semanais, R, E, notas};
}

const NOITES = {
  ret: ['Noite de Renovação', 'retinoide', 'lua'],
  exf: ['Noite de Purificação', 'esfoliação', 'ouro'],
  descanso: ['Noite de Repouso', 'recuperação da barreira', 'jade'],
  normal: ['Ritual da Lua', '', 'jade']
};

/* ---------- Um ritual (manhã ou noite) de um dia ---------- */
function conflitoEntre(a, b){
  const ga = grupos(a), gb = grupos(b);
  for (const c of CONFLITOS){
    if ((ga.includes(c[0]) && gb.includes(c[1])) || (ga.includes(c[1]) && gb.includes(c[0]))) return c;
  }
  return null;
}
const pesoDe = p => Math.max(0, ...grupos(p).map(g => PESO[g] || 0));
function ordemDe(p){
  const k = PRIORIDADE.indexOf(ativoPrincipal(p));
  return TIPOS[p.tipo][1] * 100 + (k < 0 ? 99 : k);
}
function sessao(data, s, ctx, plano){
  const dow = data.getDay(), noite = plano.noites[dow], notas = [];
  let passos = [];
  for (const p of ctx.uso){
    const q = quandoEfetivo(p, ctx.uso);
    if ((s === 'm' && q === 'noite') || (s === 'n' && q === 'manha')) continue;
    if (ehRet(p) && noite !== 'ret') continue;
    if (ehExf(p) && plano.exfDia[dow] !== p.id) continue;
    if (ehMascara(p) && !(plano.mascaraDias[p.id] || []).includes(dow)) continue;
    if (temAtivo(p, 'cobre') && s === 'n' && noite === 'exf') continue;
    if (plano.semanais[p.id] && !plano.semanais[p.id].includes(dow)) continue;
    passos.push(p);
  }
  passos.sort((a, b) => ordemDe(a) - ordemDe(b));
  // Pares incompatíveis: ficam os mais importantes (retinoide > esfoliante > peróxido > vitamina C > cobre); os outros entram noutros dias.
  const escolhidos = [];
  for (const p of passos.slice().sort((a, b) => pesoDe(b) - pesoDe(a))) if (!escolhidos.some(o => conflitoEntre(o, p))) escolhidos.push(p);
  passos = passos.filter(p => escolhidos.includes(p));
  return {passos, noite: s === 'n' ? noite : null, notas};
}

/* ---------- Leituras para o utilizador ---------- */
function quandoTexto(p, ctx, plano){
  const m = [], n = [];
  for (const d of SEMANA){
    const dt = new Date(ctx.hoje); dt.setDate(dt.getDate() + ((d - dt.getDay() + 7) % 7));
    if (sessao(dt, 'm', ctx, plano).passos.includes(p)) m.push(d);
    if (sessao(dt, 'n', ctx, plano).passos.includes(p)) n.push(d);
  }
  const fmt = (ds, todos, alguns) => ds.length === 7 ? todos : ds.length ? alguns + ' (' + ds.map(d => DIAS_CURTO[d]).join(', ') + ')' : '';
  const partes = [fmt(m, 'todas as manhãs', 'de manhã'), fmt(n, 'todas as noites', 'à noite')].filter(Boolean);
  return {texto: partes.join(' e ') || 'não entra na rotina desta semana', m, n};
}
function paresIncompativeis(ctx, plano){
  const r = [];
  for (let a = 0; a < ctx.uso.length; a++) for (let b = a + 1; b < ctx.uso.length; b++){
    const c = conflitoEntre(ctx.uso[a], ctx.uso[b]);
    if (!c) continue;
    const qa = quandoTexto(ctx.uso[a], ctx, plano), qb = quandoTexto(ctx.uso[b], ctx, plano);
    const juntos = qa.m.some(d => qb.m.includes(d)) || qa.n.some(d => qb.n.includes(d));
    r.push({a: ctx.uso[a], b: ctx.uso[b], gravidade: c[2], porque: c[3], solucao: c[4], qa: qa.texto, qb: qb.texto, juntos});
  }
  return r;
}
function faltas(uso){
  const f = [];
  if (!uso.some(p => p.tipo === 'limpeza' || p.tipo === 'desmaq')) f.push(['limpeza', 'um produto de limpeza suave']);
  if (!uso.some(p => p.tipo === 'hidratante' || p.tipo === 'mascaraNoite')) f.push(['hidratante', 'um hidratante']);
  if (!uso.some(p => p.tipo === 'protetor' || temAtivo(p, 'spf'))) f.push(['protetor', uso.some(p => ehRet(p) || ehExf(p) || temAtivo(p, 'vitc')) ? 'protetor solar (obrigatório com retinoides, ácidos e vitamina C)' : 'protetor solar']);
  return f;
}

/* ---------- Reinos de cultivo (constância) ---------- */
const REINOS = [
  [0, 'Despertar do Qi', 'Sentes o primeiro fio de energia na pele.'],
  [10, 'Refinamento do Corpo', 'A rotina começa a criar raízes.'],
  [30, 'Fundação', 'A barreira da pele fortalece-se.'],
  [70, 'Núcleo Dourado', 'A constância tornou-se natural.'],
  [140, 'Alma Nascente', 'A pele renova-se como água de nascente.'],
  [250, 'Transformação Divina', 'Poucos chegam tão longe.'],
  [400, 'Imortal da Pele de Jade', 'Pele de jade, espírito sereno.']
];
function reino(pontos){
  let i = 0; while (i + 1 < REINOS.length && pontos >= REINOS[i + 1][0]) i++;
  const prox = REINOS[i + 1];
  return {i, nome: REINOS[i][1], frase: REINOS[i][2], prox: prox ? prox[1] : null, falta: prox ? prox[0] - pontos : 0,
    pct: prox ? (pontos - REINOS[i][0]) / (prox[0] - REINOS[i][0]) : 1};
}
