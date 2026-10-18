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

/* ---------- Rotina enxuta: só os essenciais e os tratamentos para o que a pele tem de facto ---------- */
const PREOC_CURTO = {acne: 'borbulhas', pontos: 'pontos negros', oleosidade: 'oleosidade', poros: 'poros dilatados', manchas: 'manchas', vermelhidao: 'vermelhidão',
  desidratacao: 'desidratação', rugas: 'linhas finas', olheiras: 'olheiras', textura: 'textura irregular'};
// Quanto cada ativo trata cada problema (1 ajuda, 2 trata, 3 tratamento de referência). Um problema fica coberto quando a soma chega ao que é preciso.
const EFICACIA = {
  retinoide: {acne: 3, rugas: 3, textura: 2, manchas: 2, poros: 2, pontos: 2, oleosidade: 1},
  aha: {textura: 3, manchas: 2, rugas: 1, acne: 1, pontos: 1}, bha: {pontos: 3, acne: 2, oleosidade: 2, poros: 2, textura: 2}, pha: {textura: 2, desidratacao: 1},
  vitc: {manchas: 2, rugas: 2, textura: 1}, niacinamida: {oleosidade: 2, poros: 2, manchas: 2, vermelhidao: 2, acne: 1}, peroxido: {acne: 3},
  azelaico: {acne: 2, vermelhidao: 2, manchas: 2}, cobre: {rugas: 2}, peptidos: {rugas: 1, olheiras: 1}, hialuronico: {desidratacao: 2},
  ceramidas: {desidratacao: 2, vermelhidao: 1}, ureia: {desidratacao: 2, textura: 1}, enxofre: {acne: 2, oleosidade: 1}, zinco: {oleosidade: 1, acne: 1},
  argila: {oleosidade: 2, pontos: 1, poros: 1}, fisico: {textura: 2, pontos: 1}, enzimas: {textura: 2, pontos: 1}, despigmentante: {manchas: 3},
  bakuchiol: {rugas: 2, acne: 1}, calmante: {vermelhidao: 3}, antioxidante: {rugas: 1, manchas: 1}
};
const EFICACIA_TIPO = {olhos: {olheiras: 2, rugas: 1}, oleo: {desidratacao: 2}, mascaraNoite: {desidratacao: 2}, hidratante: {desidratacao: 1}};
const NECESSIDADE_PELE = {oleosa: {oleosidade: 2}, mista: {oleosidade: 2}, seca: {desidratacao: 2}, sensivel: {}, normal: {}};
const SINAL_PREOC = {'Zona T oleosa': ['oleosidade', 2], 'Borbulha nova': ['acne', 2], 'Pontos negros': ['pontos', 3], 'Poros dilatados': ['poros', 3],
  'Descamação': ['desidratacao', 3], 'Manchas': ['manchas', 3], 'Olheiras': ['olheiras', 3], 'Pele baça': ['textura', 2]};
const ESSENCIAIS = ['limpeza', 'hidratante', 'protetor'];

function forcaPara(p){
  const f = {}, juntar = (o, menos = 0) => { for (const [c, v] of Object.entries(o)) f[c] = Math.max(f[c] || 0, Math.max(1, v - menos)); };
  // Produtos de enxaguar só contam pelos ativos que atuam em pouco tempo (gel de limpeza com ácido salicílico ou peróxido), e com menos força.
  for (const a of ativosDe(p)) if (EFICACIA[a] && (!enxaguar(p) || ['peroxido', 'bha', 'aha', 'enxofre'].includes(a))) juntar(EFICACIA[a], enxaguar(p) ? 1 : 0);
  if (EFICACIA_TIPO[p.tipo]) juntar(EFICACIA_TIPO[p.tipo]);
  return f;
}
// O que a pele precisa agora: preocupações do perfil (3), tipo de pele (2) e o que os registos das últimas 2 semanas mostram.
function necessidades(cfg, pele, hoje){
  const n = {}, origem = {}, por = (c, v, o) => { if (v > (n[c] || 0)){ n[c] = v; origem[c] = o; } };
  for (const [c, v] of Object.entries(NECESSIDADE_PELE[cfg.pele] || {})) por(c, v, 'tipo');
  for (const c of cfg.preocupacoes || []) if (PREOC_CURTO[c]) por(c, 3, 'perfil');
  const rec = (pele || []).filter(r => hoje - deChave(r.d) <= 14 * DIA);
  if (rec.length){
    const max = k => Math.max(...rec.map(r => +r[k] || 0)), media = k => rec.reduce((s, r) => s + (+r[k] || 0), 0) / rec.length;
    if (max('borbulhas') >= 2) por('acne', 3, 'registos');
    if (media('oleo') >= 2.5) por('oleosidade', 3, 'registos');
    if (max('irritacao') >= 2) por('vermelhidao', 3, 'registos');
    if (media('secura') >= 2) por('desidratacao', 3, 'registos');
    for (const r of rec) for (const sn of r.sinais || []) if (SINAL_PREOC[sn]) por(SINAL_PREOC[sn][0], SINAL_PREOC[sn][1], 'registos');
  }
  return {n, origem};
}
function motivoFora(p, precisa, rotina){
  const f = forcaPara(p), cs = Object.keys(f);
  if (!cs.length){
    if (p.tipo === 'desmaq') return 'Só faz falta se usares maquilhagem ou protetor resistente à água. O gel de limpeza chega.';
    if (p.tipo === 'tonico') return 'Tónico sem ativos: é um passo a mais que não acrescenta nada.';
    if (p.tipo === 'outro') return 'Não sei para que serve. Edita-o ou pergunta ao Mestre.';
    return 'Não acrescenta nada à tua rotina.';
  }
  const meus = cs.filter(c => precisa[c]);
  const lista = l => l.length > 1 ? l.slice(0, -1).join(', ') + ' e ' + l[l.length - 1] : l[0];
  if (!meus.length) return `Serve para ${lista(cs.sort((a, b) => f[b] - f[a]).slice(0, 3).map(c => PREOC_CURTO[c]))}: não é o que a tua pele precisa agora.`;
  const outros = rotina.filter(o => !ESSENCIAIS.includes(o.tipo) && meus.some(c => forcaPara(o)[c]));
  return outros.length ? `Já tens ${lista(outros.slice(0, 2).map(o => o.nome))} para ${lista(meus.slice(0, 2).map(c => PREOC_CURTO[c]))}. Não precisas dos dois.` : 'A tua rotina já trata disso. Seria um passo a mais.';
}
// Lugares da rotina. Os essenciais existem sempre; os outros entram quando a pele precisa (e aparecem como "recomendado" se não tiveres um produto para eles).
const LUGAR = {
  limpeza: {sess: ['m', 'n'], ord: 2050}, serumDia: {sess: ['m'], ord: 5050}, ativoNoite: {sess: ['n'], ord: 5040}, olhos: {sess: ['m', 'n'], ord: 7050},
  reparador: {sess: ['n'], ord: 7500}, oleo: {sess: ['n'], ord: 8550}, hidratante: {sess: ['m', 'n'], ord: 8050}, protetor: {sess: ['m'], ord: 9050}, mascara: {sess: ['n'], ord: 3550}
};
const RENOVA = ['acne', 'pontos', 'manchas', 'rugas', 'textura', 'poros', 'oleosidade'];
const BASE_REPARA = {calmante: 2, ceramidas: 2, hialuronico: 1.5, ureia: 1, peptidos: 1, cobre: 1, niacinamida: .8};
const idxPrio = p => { const i = PRIORIDADE.indexOf(ativoPrincipal(p)); return i < 0 ? 99 : i; };
const sessDeQuando = q => q === 'manha' ? ['m'] : q === 'noite' ? ['n'] : ['m', 'n'];

function escolherRotina(uso, cfg, pele, hoje){
  const {n: precisa, origem} = necessidades(cfg, pele, hoje);
  const rotina = [], fora = [], livres = [], cand = [], porque = {}, papel = {}, lugares = {}, onde = {}, rec = [];
  const so = (o, ks) => Object.fromEntries(Object.entries(o).filter(([c]) => ks.includes(c)));
  const cobre = (p, needs) => Object.entries(forcaPara(p)).reduce((t, [c, v]) => t + Math.min(needs[c] || 0, v), 0);
  const bonus = p => (p.veredicto === 'essencial' ? 5 : p.veredicto === 'util' ? .5 : 0) + (p.naRotina ? .3 : 0);
  const tratados = (p, needs = precisa) => Object.keys(forcaPara(p)).filter(c => needs[c]).map(c => PREOC_CURTO[c]);
  const lista = l => l.length > 1 ? l.slice(0, -1).join(', ') + ' e ' + l[l.length - 1] : (l[0] || '');
  const melhor = (ps, sc) => { let m = null, ms = 0; for (const p of ps){ const v = sc(p); if (v > ms || (m && v === ms && v > 0 && idxPrio(p) < idxPrio(m))){ m = p; ms = v; } } return m; };
  const pôr = (p, lugar, sess, txt) => {
    if (!rotina.includes(p)) rotina.push(p);
    papel[p.id] = papel[p.id] || lugar; lugares[p.id] = [...new Set([...(lugares[p.id] || []), lugar])]; onde[p.id] = [...new Set([...(onde[p.id] || []), ...sess])];
    if (!porque[p.id]) porque[p.id] = txt;
    const i = cand.indexOf(p); if (i >= 0) cand.splice(i, 1);
  };
  const tem = c => (precisa[c] || 0) > 0, sensivel = cfg.sensivel || cfg.pele === 'sensivel';

  for (const p of uso){
    if (p.tipo === 'labios' && p.forcar !== 'usar'){ livres.push(p); continue; }
    if (p.forcar === 'nao'){ fora.push({p, motivo: 'Tiraste-o da rotina.'}); continue; }
    if (p.porLer && p.forcar !== 'usar'){ fora.push({p, motivo: 'Ainda por ler: o Mestre ainda não identificou este frasco.'}); continue; }
    if (p.veredicto === 'evitar' && p.forcar !== 'usar'){ fora.push({p, motivo: 'O Mestre desaconselha-o para a tua pele.'}); continue; }
    if (p.veredicto === 'dispensavel' && p.forcar !== 'usar'){ fora.push({p, motivo: 'O Mestre considera-o dispensável para a tua pele.'}); continue; }
    cand.push(p);
  }

  // 1. Essenciais: limpeza, hidratante e protetor solar.
  const limps = cand.filter(p => p.tipo === 'limpeza'), suaves = limps.filter(p => !medicada(p)), meds = limps.filter(medicada);
  const querMed = tem('acne') || tem('pontos') || (tem('oleosidade') && origem.oleosidade !== 'tipo');
  if (suaves.length && meds.length && querMed){
    pôr(meds[0], 'limpeza', ['m'], 'Gel de limpeza da manhã: ajuda nas ' + lista(tratados(meds[0]).slice(0, 2)) + '.');
    pôr(suaves[0], 'limpeza', ['n'], 'Essencial: gel de limpeza suave para a noite.');
  } else if (suaves.length || meds.length){
    const l = suaves[0] || meds[0]; pôr(l, 'limpeza', ['m', 'n'], 'Essencial: gel de limpeza.');
  } else { const d = cand.find(p => p.tipo === 'desmaq'); if (d) pôr(d, 'limpeza', ['n'], 'Limpeza da noite.'); }
  const hids = cand.filter(p => p.tipo === 'hidratante');
  if (hids.length === 1) pôr(hids[0], 'hidratante', temAtivo(hids[0], 'spf') ? ['m'] : ['m', 'n'], 'Essencial: hidratante.');
  else if (hids.length > 1){
    const m = hids.find(p => p.quando === 'manha' || temAtivo(p, 'spf')) || hids.find(p => p.quando !== 'noite') || hids[0];
    const n = hids.find(p => p !== m && !temAtivo(p, 'spf') && p.quando !== 'manha') || hids.find(p => p !== m && !temAtivo(p, 'spf'));
    pôr(m, 'hidratante', n ? ['m'] : (temAtivo(m, 'spf') ? ['m'] : ['m', 'n']), 'Essencial: hidratante' + (n ? ' de dia.' : '.'));
    if (n) pôr(n, 'hidratante', ['n'], 'Essencial: hidratante de noite.');
  }
  const prot = cand.find(p => p.tipo === 'protetor'); if (prot) pôr(prot, 'protetor', ['m'], 'Essencial: protetor solar.');

  // 2. Tratamento de noite: retinoide e/ou esfoliante, em noites alternadas.
  const needsN = so(precisa, RENOVA), recN = Object.keys(needsN).length > 0;
  const okN = p => ['serum', 'tratamento', 'tonico', 'esfoliante', 'mascara'].includes(p.tipo) && (ehRet(p) || ehExf(p) || ['azelaico', 'peroxido', 'enxofre', 'bakuchiol', 'despigmentante'].some(a => temAtivo(p, a)));
  const n1 = melhor(cand.filter(okN), p => { const c = cobre(p, needsN); return c > 0 ? c + (ehRet(p) ? 1 : 0) + bonus(p) : 0; });
  if (n1){
    pôr(n1, 'ativoNoite', ['n'], 'Tratamento de noite: ' + lista(tratados(n1, needsN).slice(0, 3)) + '.');
    if (!sensivel){
      const resto = Object.assign({}, needsN); for (const [c, v] of Object.entries(forcaPara(n1))) if (resto[c]) resto[c] = Math.max(0, resto[c] - v);
      const outro = cand.filter(okN).filter(p => ehRet(n1) ? ehExf(p) && !ehRet(p) : ehRet(p));
      const n2 = melhor(outro, p => cobre(p, resto) >= 1 ? cobre(p, resto) + bonus(p) : 0);
      if (n2) pôr(n2, 'ativoNoite', ['n'], 'Tratamento de noite, alternado com ' + n1.nome + ': ' + lista(tratados(n2, needsN).slice(0, 3)) + '.');
    }
  } else if (recN) rec.push({slot: 'ativoNoite', sessoes: ['n']});

  // 3. Sérum de dia: trata durante o dia (vitamina C, niacinamida, ácido azelaico…).
  const okM = p => ['serum', 'tratamento', 'tonico'].includes(p.tipo) && ativosDe(p).length && !ehRet(p) && !ehExf(p) && ((p.quando || TIPOS[p.tipo][2]) !== 'noite' || temAtivo(p, 'vitc'));
  const recM = Object.keys(precisa).length > 0;
  const m1 = melhor(cand.filter(okM), p => { const c = cobre(p, precisa); return c > 0 ? c + bonus(p) : 0; });
  if (m1){
    pôr(m1, 'serumDia', ['m'], 'Sérum de dia: ' + lista(tratados(m1).slice(0, 3)) + '.');
    const resto = Object.assign({}, precisa); for (const [c, v] of Object.entries(forcaPara(m1))) if (resto[c]) resto[c] = Math.max(0, resto[c] - v);
    for (const p of rotina) if (papel[p.id] === 'ativoNoite') for (const [c, v] of Object.entries(forcaPara(p))) if (resto[c]) resto[c] = Math.max(0, resto[c] - v);
    const m2 = melhor(cand.filter(okM), p => cobre(p, resto) >= 2 ? cobre(p, resto) + bonus(p) : 0);
    if (m2) pôr(m2, 'serumDia', ['m'], 'Sérum de dia: ' + lista(tratados(m2).slice(0, 3)) + '.');
  } else if (recM) rec.push({slot: 'serumDia', sessoes: ['m']});

  // 4. Sérum reparador de noite: acalma e reconstrói a barreira (sobretudo com retinoide ou ácidos).
  const comAtivos = rotina.some(p => papel[p.id] === 'ativoNoite');
  const recR = comAtivos || tem('desidratacao') || tem('vermelhidao') || cfg.pele === 'seca' || sensivel;
  const okR = p => ['serum', 'tratamento', 'tonico'].includes(p.tipo) && !ehRet(p) && !ehExf(p) && !temAtivo(p, 'peroxido') && ativosDe(p).some(a => BASE_REPARA[a]);
  const needsR = so(precisa, ['desidratacao', 'vermelhidao', 'rugas']);
  const scR = p => { const c = cobre(p, needsR), base = Math.max(...ativosDe(p).map(a => BASE_REPARA[a] || 0)); return recR || c > 0 ? c + base + bonus(p) : 0; };
  const r1 = melhor(cand.filter(okR), scR) || (recR ? melhor(rotina.filter(p => papel[p.id] === 'serumDia' && okR(p) && !temAtivo(p, 'vitc')), scR) : null);
  if (r1) pôr(r1, 'reparador', ['n'], porque[r1.id] ? porque[r1.id] : 'Sérum reparador: acalma e protege a barreira' + (tratados(r1, needsR).length ? '; trata ' + lista(tratados(r1, needsR)) : '') + '.');
  else if (recR) rec.push({slot: 'reparador', sessoes: ['n']});

  // 5. Contorno de olhos, óleo/máscara de noite e máscara semanal: só se a pele pedir.
  const o1 = melhor(cand.filter(p => p.tipo === 'olhos'), p => { const c = cobre(p, so(precisa, ['olheiras', 'rugas'])); return c > 0 ? c + bonus(p) : 0; });
  if (o1) pôr(o1, 'olhos', sessDeQuando(o1.quando), 'Contorno de olhos: ' + lista(tratados(o1).slice(0, 2)) + '.');
  else if (tem('olheiras')) rec.push({slot: 'olhos', sessoes: ['m', 'n']});
  if ((precisa.desidratacao || 0) >= 2){ const ol = melhor(cand.filter(p => p.tipo === 'oleo' || p.tipo === 'mascaraNoite'), p => cobre(p, precisa) + bonus(p)); if (ol) pôr(ol, 'oleo', ['n'], 'Nutrição de noite para a pele seca.'); }
  const fortes = Object.fromEntries(Object.entries(precisa).filter(([c]) => origem[c] !== 'tipo'));
  const mk = melhor(cand.filter(ehMascara), p => { const c = cobre(p, fortes); return c > 0 ? c + bonus(p) : 0; });
  if (mk) pôr(mk, 'mascara', ['n'], 'Máscara semanal: ' + lista(tratados(mk, fortes).slice(0, 2)) + '.');

  // 6. Escolhas manuais e o que o Mestre considera essencial.
  for (const p of cand.slice()) if (p.forcar === 'usar' || p.veredicto === 'essencial') pôr(p, 'extra', sessDeQuando(quandoEfetivo(p, rotina)), p.forcar === 'usar' ? 'Escolheste usá-lo.' : 'O Mestre considera-o essencial para a tua pele.');

  // 7. O resto fica de fora, com o motivo.
  const lugarDe = p => okN(p) ? 'ativoNoite' : okM(p) ? 'serumDia' : okR(p) ? 'reparador' : p.tipo === 'hidratante' ? 'hidratante' : p.tipo === 'limpeza' ? 'limpeza' : p.tipo === 'protetor' ? 'protetor' : p.tipo === 'olhos' ? 'olhos' : '';
  const NOME_LUGAR = {ativoNoite: 'tratamento de noite', serumDia: 'sérum de dia', reparador: 'sérum reparador', hidratante: 'hidratante', limpeza: 'limpeza', protetor: 'protetor solar', olhos: 'contorno de olhos'};
  for (const p of cand){
    const l = lugarDe(p), dono = l && rotina.find(o => papel[o.id] === l);
    const util = cobre(p, precisa) > 0;
    fora.push({p, motivo: dono && (util || ESSENCIAIS.includes(l)) ? `Já usas ${dono.nome} como ${NOME_LUGAR[l]}. Não precisas dos dois ao mesmo tempo.` : motivoFora(p, precisa, rotina)});
  }

  // 8. O que falta na rotina base e o que cada problema tem a tratá-lo.
  const sessoesDe = p => onde[p.id] || sessDeQuando(quandoEfetivo(p, rotina));
  const temEm = (s, f) => rotina.some(p => sessoesDe(p).includes(s) && f(p, s));
  const faltas = [
    ['limpeza', p => p.tipo === 'limpeza' || p.tipo === 'desmaq', ['m', 'n']],
    ['hidratante', (p, s) => p.tipo === 'hidratante' || (s === 'n' && (p.tipo === 'mascaraNoite' || p.tipo === 'oleo')), ['m', 'n']],
    ['protetor', p => p.tipo === 'protetor' || temAtivo(p, 'spf'), ['m']]
  ].map(([slot, f, ss]) => ({slot, sessoes: ss.filter(x => !temEm(x, f))})).filter(x => x.sessoes.length);
  const resto = Object.assign({}, precisa);
  for (const p of rotina) for (const [c, v] of Object.entries(forcaPara(p))) if (resto[c]) resto[c] = Math.max(0, resto[c] - v);
  const porCobrir = Object.entries(resto).filter(([, v]) => v >= 2).map(([c, v]) => ({c, falta: v, origem: origem[c]}));
  const cobertura = Object.keys(precisa).map(c => ({c, origem: origem[c], por: rotina.filter(p => forcaPara(p)[c]), falta: resto[c]}));
  return {rotina, fora, livres, faltas, rec, porCobrir, cobertura, precisa, porque, papel, lugares, onde};
}
const tipoCurtoM = t => (TIPOS[t] || TIPOS.outro)[0].split(/ [\/(]/)[0];

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
    const q = quandoEfetivo(p, ctx.uso), onde = ctx.sel && ctx.sel.onde[p.id];
    if (onde ? !onde.includes(s) : ((s === 'm' && q === 'noite') || (s === 'n' && q === 'manha'))) continue;
    if (ehRet(p) && noite !== 'ret') continue;
    if (ehExf(p) && plano.exfDia[dow] !== p.id) continue;
    if (ehMascara(p) && !(plano.mascaraDias[p.id] || []).includes(dow)) continue;
    if (temAtivo(p, 'cobre') && s === 'n' && noite === 'exf') continue;
    if (plano.semanais[p.id] && !plano.semanais[p.id].includes(dow)) continue;
    passos.push(p);
  }
  for (const t of ['limpeza', 'hidratante', 'protetor']){
    const ds = passos.filter(p => p.tipo === t); if (ds.length < 2) continue;
    const alvoQ = s === 'm' ? 'manha' : 'noite';
    const fica = (t === 'limpeza' ? ds.find(p => s === 'm' ? medicada(p) : !medicada(p)) : null) || ds.find(p => p.quando === alvoQ) || ds[0];
    passos = passos.filter(p => p.tipo !== t || p === fica);
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
