'use strict';
/* Nascente — IA (o Mestre), fotos, sincronização, ações, fundo animado e arranque. */

/* ---------- IA (Gemini, chave do utilizador) ---------- */
const API = 'https://generativelanguage.googleapis.com/v1beta/';
let iaPedido = null, iaPensarSempre = false, iaEsperaCancelada = false;
function cancelarIA(){ iaEsperaCancelada = true; if (iaPedido){ iaPedido.cancelado = true; iaPedido.ctl.abort(); } }
// Limites do plano gratuito: são por projeto e por modelo (partilhados com a Forja e a Garfada se usarem a mesma chave) e repõem-se à meia-noite do Pacífico.
class ErroLimite extends Error {}
const diaPacifico = () => new Date().toLocaleDateString('en-CA', {timeZone: 'America/Los_Angeles'});
function horaReset(){
  const agora = new Date(), la = new Date(agora.toLocaleString('en-US', {timeZone: 'America/Los_Angeles'})), meia = new Date(la); meia.setHours(24, 0, 0, 0);
  return new Date(+agora + (meia - la)).toLocaleTimeString('pt-PT', {hour: '2-digit', minute: '2-digit'});
}
function modelosCandidatos(){
  const hoje = diaPacifico(), esg = cfg.esgotados || {};
  return [...(cfg.modelos || []), cfg.modelo, 'gemini-flash-latest', 'gemini-flash-lite-latest'].filter((m, i, l) => m && l.indexOf(m) === i && esg[m] !== hoje);
}
function limiteInfo(j){
  const det = (j.error && j.error.details) || [], ids = det.filter(d => /QuotaFailure/.test(d['@type'] || '')).flatMap(d => (d.violations || []).map(v => v.quotaId || '')).join(' ');
  const ri = det.find(d => /RetryInfo/.test(d['@type'] || '')), espera = ri ? parseFloat(ri.retryDelay) || 30 : 30;
  const porDia = /PerDay/i.test(ids) || (!/PerMinute/i.test(ids) && espera > 90);
  return {porDia, espera: Math.min(Math.max(espera, 5), 65)};
}
function iaAviso(txt){ const el = document.querySelector('.a-meditar p') || document.querySelector('#aPensar p'); if (el) el.textContent = txt; }
async function esperarIA(seg){
  iaEsperaCancelada = false;
  for (let s = Math.ceil(seg); s > 0; s--){ if (iaEsperaCancelada) throw new Error('Cancelado.'); iaAviso(`Muitos pedidos seguidos. O Mestre respira… ${s} s`); await new Promise(r => setTimeout(r, 1000)); }
}
async function gemini(texto, {json = true, imagens = [], espera = 60000} = {}){
  if (!cfg.chave) throw new Error('Falta a chave do Gemini no Perfil.');
  const gc = json ? {temperature: .3, responseMimeType: 'application/json'} : {temperature: .6};
  const parts = [{text: texto}, ...imagens.map(d => ({inline_data: {mime_type: 'image/jpeg', data: String(d).split(',')[1]}}))];
  const pedir = async (modelo, pensar) => {
    const ped = iaPedido = {ctl: new AbortController(), cancelado: false}, t = setTimeout(() => ped.ctl.abort(), espera);
    try {
      return await fetch(`${API}models/${encodeURIComponent(modelo)}:generateContent`, {method: 'POST', signal: ped.ctl.signal,
        headers: {'Content-Type': 'application/json', 'x-goog-api-key': cfg.chave},
        body: JSON.stringify({contents: [{role: 'user', parts}], generationConfig: pensar ? gc : Object.assign({thinkingConfig: {thinkingBudget: 0}}, gc)})});
    } catch(e){
      if (ped.cancelado) throw new Error('Cancelado.');
      if (ped.ctl.signal.aborted) throw new Error('O Mestre demorou demasiado a responder. Tenta outra vez.');
      throw new Error('Sem ligação à internet.');
    } finally { clearTimeout(t); if (iaPedido === ped) iaPedido = null; }
  };
  if (!(cfg.modelos || []).length) try { await listarModelos(); } catch(e){}
  const candidatos = modelosCandidatos();
  for (let i = 0, esperou = false; i < candidatos.length; i++){
    const modelo = String(candidatos[i]).replace(/^models\//, '');
    let r = await pedir(modelo, iaPensarSempre || !/flash/i.test(modelo)), j = await r.json().catch(() => ({}));
    if (!r.ok && r.status === 400 && /think/i.test((j.error && j.error.message) || '') && !iaPensarSempre){
      iaPensarSempre = true; r = await pedir(modelo, true); j = await r.json().catch(() => ({}));
    }
    if (r.status === 429){
      const info = limiteInfo(j);
      if (!info.porDia && !esperou){ esperou = true; await esperarIA(info.espera); i--; continue; }
      cfg.esgotados = Object.assign({}, cfg.esgotados, {[modelo]: diaPacifico()}); guardarCfg();
      iaAviso('Este modelo esgotou por hoje. A tentar outro…'); esperou = false; continue;
    }
    if (r.status === 404 && i + 1 < candidatos.length) continue;
    if (!r.ok){
      const msg = (j.error && j.error.message) || '';
      if (r.status === 401 || r.status === 403 || /api key/i.test(msg)) throw new Error('Chave do Gemini inválida. Verifica no Perfil.');
      throw new Error('Erro do Gemini: ' + (msg || r.status));
    }
    if (modelo !== cfg.modelo){ cfg.modelo = modelo; guardarCfg(); }
    const txt = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).filter(p => !p.thought).map(p => p.text || '').join('');
    if (!txt) throw new Error('O Mestre não respondeu. Tenta outra vez.');
    return txt;
  }
  throw new ErroLimite(`O Mestre esgotou as forças de hoje: o limite diário gratuito do Gemini acabou em todos os modelos (é partilhado com as outras apps que usam a mesma chave). Volta às ${horaReset()}.`);
}
function lerJSON(txt){
  const s = String(txt).replace(/```(?:json)?/gi, ''), a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('Resposta da IA em formato inválido.');
  return JSON.parse(s.slice(a, b + 1));
}
async function listarModelos(){
  let r;
  try { r = await fetch(API + 'models?pageSize=1000', {headers: {'x-goog-api-key': cfg.chave}}); } catch(e){ throw new Error('Sem ligação à internet.'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error([400, 401, 403].includes(r.status) ? 'Chave inválida.' : 'Erro: ' + ((j.error && j.error.message) || r.status));
  const pts = n => (/latest/.test(n) ? 100 : 0) - (/lite/.test(n) ? 10 : 0) - (/preview/.test(n) ? 5 : 0) + (parseFloat((n.match(/\d+(\.\d+)?/) || [])[0]) || 0);
  const nomes = (j.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace(/^models\//, ''))
    .filter(n => /flash/i.test(n) && !/(image|tts|audio|live|embed|exp)/i.test(n)).sort((a, b) => pts(b) - pts(a));
  cfg.modelos = nomes.slice(0, 8);
  if (nomes.length && !nomes.includes(cfg.modelo)) cfg.modelo = nomes[0];
  guardarCfg();
  return nomes;
}
// As outras apps (Forja, Garfada, Mirante) vivem no mesmo endereço: se já houver lá uma chave do Gemini, oferece-se para a usar.
function chaveDeOutraApp(){
  try {
    for (let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i); if (!k || k.startsWith('nascente.')) continue;
      const m = String(localStorage.getItem(k) || '').match(/"(AIza[0-9A-Za-z_\-]{30,})"/);
      if (m) return m[1];
    }
  } catch(e){}
  return '';
}

/* ---------- Textos de contexto para o Mestre ---------- */
const PT = 'Escreve em português de Portugal (PT-PT, nunca do Brasil): trata o utilizador por "tu" e usa termos de Portugal (creme, protetor solar, borbulhas, farmácia, parafarmácia).';
const MESTRE = 'És o Mestre da Nascente: um sábio sereno com conhecimentos profundos de dermatologia e cosmética (ao nível de um farmacêutico e de um dermatologista). Falas com calma e clareza, com um toque subtil de mestre de cultivo wuxia (no máximo uma imagem poética curta, nunca à custa da clareza). Dás conselhos práticos, seguros e baseados em evidência. Não receitas medicamentos sujeitos a receita médica; se houver acne grave (nódulos ou quistos dolorosos), sinais de infeção, reação alérgica forte, ou algo que não melhora em 8 a 12 semanas, recomendas um dermatologista.';
const perfilTxt = () => `${PELES[cfg.pele] || 'tipo não indicado'}${cfg.sensivel ? ', reage facilmente (sensível)' : ''}; preocupações: ${cfg.preocupacoes.map(k => PREOCUPACOES[k]).filter(Boolean).join(', ') || 'nenhuma indicada'}.`;
const produtoTxt = p => `${p.nome}${p.marca ? ' (' + p.marca + ')' : ''}: ${(TIPOS[p.tipo] || TIPOS.outro)[0]}; ativos: ${ativosDe(p).map(a => ATIVOS[a]).join(', ') || 'sem ativos fortes'}${p.conc ? '; ' + p.conc : ''}`;
function inventarioTxt(ctx){
  const l = [];
  for (const p of ctx.uso) l.push(`- [${p.id}] ${produtoTxt(p)} | em uso: ${quandoTexto(p, ctx, ctx.plano).texto}`);
  for (const e of ctx.espera) l.push(`- [${e.p.id}] ${produtoTxt(e.p)} | em espera (repete a função de ${e.depois.nome})`);
  for (const p of produtos.filter(x => x.pausa && !x.fim)) l.push(`- [${p.id}] ${produtoTxt(p)} | em pausa`);
  return l.join('\n') || '(nenhum)';
}
const registoTxt = r => `${r.d}: geral ${medidaVal(r, 'geral')}, oleosidade ${medidaVal(r, 'oleo')}, secura ${medidaVal(r, 'secura')}, borbulhas ${medidaVal(r, 'borbulhas')}, irritação ${medidaVal(r, 'irritacao')}${(r.sinais || []).length ? '; sinais: ' + r.sinais.join(', ') : ''}${r.nota ? '; nas palavras dele: "' + r.nota + '"' : ''}`;
const peleTxt = (n, exceto) => pele.filter(r => r.d !== exceto).sort((a, b) => a.d < b.d ? 1 : -1).slice(0, n).reverse().map(registoTxt).join('\n') || '(sem registos)';
function rotinaTxt(ctx){
  const a = agoraRitual(), m = sessao(a.data, 'm', ctx, ctx.plano), n = sessao(a.data, 'n', ctx, ctx.plano), nomes = se => se.passos.map(p => p.nome).join(' > ') || '(nada)';
  return `Manhã: ${nomes(m)}\nNoite de hoje (${NOITES[n.noite][0]}): ${nomes(n)}\nNa semana: ${ctx.plano.R} noites de retinoide, ${ctx.plano.E} de esfoliação.`;
}
const linhaTempoTxt = () => produtos.filter(p => p.inicio || p.fim).map(p => `- [${p.id}] ${p.nome}: entrou ${p.inicio || '?'}${p.fim ? ', acabou ' + p.fim : ''}${p.pausa ? ', em pausa' : ''}`).join('\n') || '(sem datas)';

/* ---------- Pedidos ao Mestre ---------- */
function normalizarProduto(o){
  const tipo = TIPOS[o.tipo] ? o.tipo : 'outro', txt = (v, n = 300) => String(v || '').trim().slice(0, n);
  let vezes = parseInt(o.vezes, 10); vezes = vezes >= 1 && vezes < 7 ? vezes : 0;
  const pao = parseInt(o.pao, 10);
  return {nome: txt(o.nome, 120), marca: txt(o.marca, 60), tipo, ativos: (Array.isArray(o.ativos) ? o.ativos : []).filter(a => ATIVOS[a]),
    conc: txt(o.concentracao, 120), quando: ['manha', 'noite', 'ambos'].includes(o.quando) ? o.quando : TIPOS[tipo][2], vezes,
    modo: txt(o.modo), qtd: txt(o.quantidade, 80), espera: txt(o.espera, 80), aviso: txt(o.aviso), pao: pao > 0 && pao <= 60 ? pao : '',
    validade: /^\d{4}-\d{2}$/.test(o.validade || '') ? o.validade : '', funcao: txt(o.funcao, 200), adequado: txt(o.adequado), duvida: txt(o.duvida)};
}
async function lerProduto(imagens){
  const prompt = `${MESTRE}
Tarefa: identificar o produto de cuidado de pele nas fotos (a frente do frasco e, se houver, a lista de ingredientes). Lê a marca e o nome no rótulo. Se reconheceres o produto, usa o que sabes da fórmula (INCI) para identificar os ativos e a concentração. Não inventes: se não conseguires ler algo, deixa vazio e explica em "duvida".
Pele do utilizador: ${perfilTxt()}
Tipos possíveis (campo "tipo"): ${Object.entries(TIPOS).map(([k, t]) => k + ' = ' + t[0]).join('; ')}.
Ativos possíveis (campo "ativos": só os que o produto tem em quantidade relevante): ${Object.entries(ATIVOS).map(([k, n]) => k + ' = ' + n).join('; ')}.
${PT}
Responde só com JSON:
{"nome":"nome do produto como aparece no rótulo","marca":"","tipo":"uma das chaves","ativos":["chaves"],"concentracao":"ex.: retinol 0,3%; niacinamida 10%, ou vazio","quando":"manha|noite|ambos","vezes":número de vezes por semana para começar (7 = todos os dias),"modo":"como aplicar, 1 a 2 frases práticas","quantidade":"ex.: 2 a 3 gotas","espera":"tempo de espera antes do passo seguinte, ou vazio","aviso":"precaução importante, ou vazio","pao":meses de validade depois de aberto (símbolo do frasco aberto, ex.: 12M; se não se vir, o habitual para este tipo),"validade":"AAAA-MM se a data de validade estiver visível, senão vazio","funcao":"para que serve, numa frase","adequado":"numa frase: se é adequado à pele do utilizador e porquê","duvida":"vazio, ou o que não conseguiste confirmar"}`;
  return normalizarProduto(lerJSON(await gemini(prompt, {imagens})));
}
async function reverFrascos(){
  if (!cfg.chave) return irPara('vPerfil');
  abrirFolha(aMeditar('O Mestre medita sobre os teus frascos…'), 'ia');
  const ctx = contexto();
  const prompt = `${MESTRE}
Revê os frascos do utilizador tendo em conta a pele dele e os registos recentes.
Pele: ${perfilTxt()}
Frascos (o id está entre parênteses retos):
${inventarioTxt(ctx)}
Registos recentes da pele (0 a 4; geral: mais é melhor; restantes: mais é pior):
${peleTxt(8)}
Significado: "essencial" = base da rotina para esta pele (limpeza, hidratante, protetor e o tratamento principal para as preocupações dele); "util" = traz benefício mas não é indispensável; "dispensavel" = repete outro, não traz nada a esta pele ou complica a rotina, por isso gasta-se e não se recompra; "evitar" = pode piorar a pele dele. "recomprar" = true só se valer a pena comprar outro quando acabar.
Em "faltam" indica só o que faz mesmo falta (máximo 3), com as características a procurar e até 3 exemplos concretos à venda em Portugal (farmácias, parafarmácias, supermercados), de gamas de preço diferentes.
${PT}
Responde só com JSON: {"resumo":"2 a 4 frases: o que está bem e o que simplificar","produtos":[{"id":"","veredicto":"essencial|util|dispensavel|evitar","recomprar":true,"nota":"1 frase"}],"faltam":[{"tipo":"","porque":"","procurar":"","exemplos":[""]}],"alertas":["avisos importantes, se houver"]}`;
  try {
    const o = lerJSON(await gemini(prompt)), agora = Date.now();
    for (const x of o.produtos || []){
      const p = produtos.find(q => q.id === x.id); if (!p) continue;
      p.veredicto = VEREDICTOS[x.veredicto] ? x.veredicto : ''; p.recomprar = typeof x.recomprar === 'boolean' ? x.recomprar : null;
      p.notaMestre = String(x.nota || '').slice(0, 300); p.atualizado = agora;
    }
    revisao = {ts: agora, resumo: String(o.resumo || ''), alertas: (o.alertas || []).map(String).filter(Boolean).slice(0, 4),
      faltam: (o.faltam || []).slice(0, 3).map(f => ({tipo: String(f.tipo || ''), porque: String(f.porque || ''), procurar: String(f.procurar || ''), exemplos: (f.exemplos || []).map(String).filter(Boolean).slice(0, 3)}))};
    LS.set('revisao', revisao); guardarProdutos();
    if (folhaAtual === 'ia') fecharFolha();
    irPara('vFrascos'); setTimeout(() => { const el = [...document.querySelectorAll('#vFrascos h2')].find(h => h.textContent.includes('Conselho')); el && el.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 120);
  } catch(e){ if (folhaAtual === 'ia'){ fecharFolha(); toast(e.message, 4000); } }
}
async function comentarPele(r, foto){
  const ctx = contexto();
  const prompt = `${MESTRE}
O utilizador registou hoje como está a pele.
Pele: ${perfilTxt()}
Registo de hoje: ${registoTxt(r)}${foto ? '\nJunta uma foto da pele: observa-a com atenção (oleosidade, borbulhas, vermelhidão, textura).' : ''}
Registos anteriores (0 a 4; geral: mais é melhor; restantes: mais é pior):
${peleTxt(10, r.d)}
Ritual atual:
${rotinaTxt(ctx)}
Produtos e datas em que entraram ou saíram:
${linhaTempoTxt()}
Se o texto do utilizador descrever a pele, converte-o em valores de 0 a 4 (geral: 0 má a 4 ótima; restantes: 0 nada a 4 muito).
${PT}
Responde só com JSON: {"valores":{"geral":2,"oleo":0,"secura":0,"borbulhas":0,"irritacao":0},"comentario":"2 a 3 frases: o que vês e o que pode estar a causar","acao":"um conselho prático para os próximos dias","alerta":"vazio, ou quando procurar um dermatologista"}`;
  return lerJSON(await gemini(prompt, {imagens: foto ? [foto] : []}));
}
async function avaliar(){
  if (!cfg.chave) return irPara('vPerfil');
  abrirFolha(aMeditar('O Mestre lê o caminho da tua pele…'), 'ia');
  const ctx = contexto();
  const prompt = `${MESTRE}
Avalia se os cuidados estão a resultar, cruzando a evolução da pele com as datas em que cada produto entrou ou saiu da rotina. Retinoides e ácidos podem piorar a pele nas primeiras 4 a 6 semanas (purga) e os resultados costumam ver-se a partir de 8 a 12 semanas; borbulhas em zonas onde ele não costuma ter, logo após começar um produto, são mais suspeitas de reação do que de purga.
Pele: ${perfilTxt()}
Registos (0 a 4; geral: mais é melhor; restantes: mais é pior):
${peleTxt(60)}
Produtos e datas:
${linhaTempoTxt()}
Ritual atual:
${rotinaTxt(ctx)}
${PT}
Responde só com JSON: {"veredicto":"2 a 3 frases","tendencias":["até 4 tendências observadas"],"produtos":[{"id":"","efeito":"a_funcionar|cedo|sem_efeito|suspeito","nota":"1 frase"}],"ajustes":["até 3 ajustes concretos"],"dermatologista":false,"porque":"se dermatologista for true, porquê"}`;
  try {
    const o = lerJSON(await gemini(prompt));
    avaliacao = {ts: Date.now(), veredicto: String(o.veredicto || ''), tendencias: (o.tendencias || []).map(String).slice(0, 4),
      produtos: (o.produtos || []).filter(x => produtos.some(p => p.id === x.id)).slice(0, 12), ajustes: (o.ajustes || []).map(String).slice(0, 3),
      dermatologista: !!o.dermatologista, porque: String(o.porque || '')};
    LS.set('avaliacao', avaliacao); marcarSujo();
    if (folhaAtual === 'ia') fecharFolha();
    rPele();
  } catch(e){ if (folhaAtual === 'ia'){ fecharFolha(); toast(e.message, 4000); } }
}
let aPerguntar = false;
async function perguntarMestre(q){
  q = String(q || '').trim(); if (!q || aPerguntar) return;
  if (!cfg.chave) return irPara('vPerfil');
  if (vista !== 'vMestre') irPara('vMestre');
  aPerguntar = true;
  const historico = conversa.slice(-10).map(m => (m.q === 'eu' ? 'Discípulo: ' : 'Mestre: ') + m.t).join('\n') || '(início)';
  conversa.push({q: 'eu', t: q, ts: Date.now()}); LS.set('conversa', conversa); rMestre();
  const box = $('#conversa'); box.insertAdjacentHTML('beforeend', '<div class="msg mestre" id="aPensar"><span class="quem">O Mestre</span><p class="suave">medita…</p></div>');
  $('#aPensar').scrollIntoView({behavior: 'smooth', block: 'end'});
  const ctx = contexto();
  const prompt = `${MESTRE}
Estás a conversar com ${cfg.nome || 'o teu discípulo'} na app Nascente, que monta a rotina de cuidados de pele a partir dos frascos que ele tem.
Pele: ${perfilTxt()}
Frascos:
${inventarioTxt(ctx)}
Ritual:
${rotinaTxt(ctx)}
Registos recentes da pele (0 a 4; geral: mais é melhor; restantes: mais é pior):
${peleTxt(6)}
Conversa até agora:
${historico}
Nova pergunta: ${q}
Responde de forma clara e concreta (cerca de 150 palavras no máximo, a menos que ele peça detalhe). Podes usar listas com "- " e **negrito**. Se recomendares produtos para comprar, põe-nos também em "produtos" (até 4, à venda em Portugal, com preço aproximado).
${PT}
Responde só com JSON: {"resposta":"texto","produtos":[{"nome":"marca e nome","porque":"","preco":"~15 €"}]}`;
  try {
    const o = lerJSON(await gemini(prompt));
    conversa.push({q: 'mestre', t: String(o.resposta || '…'), ts: Date.now(), produtos: (o.produtos || []).slice(0, 4).map(s => ({nome: String(s.nome || ''), porque: String(s.porque || ''), preco: String(s.preco || '')})).filter(s => s.nome)});
  } catch(e){
    conversa.push({q: 'mestre', t: 'Não consegui responder: ' + e.message, ts: Date.now()});
  }
  conversa = conversa.slice(-40); LS.set('conversa', conversa); aPerguntar = false;
  if (vista === 'vMestre'){ rMestre(); const ms = document.querySelectorAll('#conversa .msg'); ms.length && ms[ms.length - 1].scrollIntoView({behavior: 'smooth', block: 'start'}); }
}

/* ---------- Fotos (IndexedDB) ---------- */
let idb = null;
function abrirIDB(){
  return new Promise(res => {
    try { const r = indexedDB.open('nascente', 1); r.onupgradeneeded = () => r.result.createObjectStore('fotos'); r.onsuccess = () => res(idb = r.result); r.onerror = () => res(null); }
    catch(e){ res(null); }
  });
}
async function carregarFotos(){
  const db = await abrirIDB(); if (!db) return;
  await new Promise(res => {
    try { const c = db.transaction('fotos').objectStore('fotos').openCursor();
      c.onsuccess = () => { const k = c.result; if (k){ fotos[k.key] = k.value; k.continue(); } else res(); }; c.onerror = () => res(); }
    catch(e){ res(); }
  });
}
function fotoGuardar(id, url){ fotos[id] = url; try { idb && idb.transaction('fotos', 'readwrite').objectStore('fotos').put(url, id); } catch(e){} }
function fotoApagar(id){ delete fotos[id]; try { idb && idb.transaction('fotos', 'readwrite').objectStore('fotos').delete(id); } catch(e){} }
function comprimir(file, max, q){
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const s = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
      c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', q));
    };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Não consegui abrir a imagem.')); };
    im.src = url;
  });
}
function escolherFoto(cb){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => { if (inp.files && inp.files[0]) cb(inp.files[0]); };
  inp.click();
}

/* ---------- Frascos: criar e editar ---------- */
const novoRascunho = extra => Object.assign({id: uid(), nome: '', marca: '', tipo: 'serum', ativos: [], quando: 'ambos', vezes: 0, qtd: '', modo: '', espera: '', conc: '', aviso: '',
  aberto: '', pao: '', validade: '', funcao: '', adequado: '', duvida: '', foto: '', fotoNova: false, fotosIA: []}, extra || {});
async function lerRascunhoIA(){
  abrirFolha(aMeditar(rascunho.fotosIA.length > 1 ? 'O Mestre lê os ingredientes…' : 'O Mestre está a ler o rótulo…'), 'ia');
  try {
    const o = await lerProduto(rascunho.fotosIA);
    for (const [k, v] of Object.entries(o)) if (Array.isArray(v) ? v.length : v !== '' && v !== 0) rascunho[k] = v;
    rascunho.duvida = o.duvida; rascunho.porLer = false;
    if (folhaAtual === 'ia') folhaEditar();
  } catch(e){
    if (folhaAtual !== 'ia' || e.message === 'Cancelado.') return;
    rascunho.porLer = true;
    rascunho.duvida = e.message + ' Guarda o frasco assim (o nome é opcional). Mais tarde, em Frascos, toca em "Ler agora" e o Mestre preenche tudo a partir da foto.';
    folhaEditar();
  }
}
// Frascos guardados sem leitura (limite, sem rede): o Mestre lê-os depois, a partir da foto guardada.
function aplicarLeitura(p, o){
  const generico = !p.nome || p.nome === 'Frasco por identificar';
  for (const k of ['tipo', 'ativos', 'quando', 'vezes', 'conc', 'modo', 'qtd', 'espera', 'aviso', 'pao', 'validade', 'funcao']){ const v = o[k]; if (Array.isArray(v) ? v.length : v !== '' && v !== 0) p[k] = v; }
  if (generico && o.nome) p.nome = o.nome;
  if (!p.marca && o.marca) p.marca = o.marca;
  if (o.adequado && !p.notaMestre) p.notaMestre = o.adequado;
  p.porLer = false; p.atualizado = Date.now(); fotoApagar(p.id + ':ia');
}
async function lerPendentes(lista){
  if (!cfg.chave) return irPara('vPerfil');
  lista = lista || produtos.filter(p => p.porLer && !p.fim);
  if (!lista.length) return;
  abrirFolha(aMeditar(`O Mestre lê os rótulos… 1 de ${lista.length}`), 'ia');
  let ok = 0, erro = '';
  for (let i = 0; i < lista.length; i++){
    if (folhaAtual !== 'ia') break;
    const p = lista[i], imgs = fotos[p.id + ':ia'] || (fotos[p.id] ? [fotos[p.id]] : []);
    if (!imgs.length) continue;
    iaAviso(`O Mestre lê os rótulos… ${i + 1} de ${lista.length}`);
    try { aplicarLeitura(p, await lerProduto(imgs)); ok++; guardarProdutos(); }
    catch(e){ erro = e.message; if (e instanceof ErroLimite || e.message === 'Cancelado.') break; }
    if (i + 1 < lista.length) await new Promise(r => setTimeout(r, 2500));
  }
  if (folhaAtual === 'ia') fecharFolha();
  renderAtual();
  toast(ok ? `O Mestre leu ${ok} de ${lista.length} frascos.${erro ? ' ' + erro : ''}` : erro || 'Nada para ler.', 5000);
}
function fotografar(){
  escolherFoto(async f => {
    try {
      const [ia, mini] = await Promise.all([comprimir(f, 1280, .82), comprimir(f, 420, .8)]);
      rascunho = novoRascunho({foto: mini, fotoNova: true, fotosIA: [ia]});
      if (!cfg.chave){ folhaEditar(); toast('Sem IA ligada: preenche à mão. No Perfil podes ligar o Mestre para ler os rótulos.', 4500); return; }
      lerRascunhoIA();
    } catch(e){ toast(e.message); }
  });
}
function guardarFrasco(){
  const r = rascunho;
  if (!r.nome.trim()){ if (!r.porLer) return toast('Falta o nome do produto.'); r.nome = 'Frasco por identificar'; }
  const campos = ['nome', 'marca', 'tipo', 'ativos', 'quando', 'vezes', 'qtd', 'modo', 'espera', 'conc', 'aviso', 'aberto', 'pao', 'validade', 'funcao'];
  let p = produtos.find(x => x.id === r.id), novo = !p;
  if (novo){ p = {id: r.id, criado: Date.now()}; produtos.push(p); }
  for (const k of campos) p[k] = r[k];
  p.nome = p.nome.trim(); p.vezes = +p.vezes || 0; p.pao = +p.pao || ''; p.atualizado = Date.now();
  if (r.fotoNova && r.foto) fotoGuardar(p.id, r.foto);
  if (r.porLer && r.fotosIA.length){ p.porLer = true; fotoGuardar(p.id + ':ia', r.fotosIA.slice()); }
  else if (!r.porLer && p.porLer && r.fotosIA.length){ p.porLer = false; fotoApagar(p.id + ':ia'); }
  guardarProdutos(); fecharFolha(); rascunho = null; renderAtual();
  const ctx = contexto(), esp = ctx.espera.find(e => e.p === p);
  toast(esp ? `${p.nome} fica em espera: entra quando ${esp.depois.nome} acabar.` : `${p.nome}: ${quandoTexto(p, ctx, ctx.plano).texto}.`, 4200);
}
function folhaAcabou(p){
  const ctx = contexto(), seguinte = ctx.uso.find(o => chaveFila(o) === chaveFila(p));
  const essencial = p.recomprar === true || (p.recomprar !== false && (TIPOS[p.tipo] || TIPOS.outro)[4] && !medicada(p));
  const lista = ctx.uso.slice().sort((a, b) => ordemDe(a) - ordemDe(b));
  let corpo;
  if (seguinte) corpo = `<p>Passa a usar o <b>${nomeP(seguinte)}</b>. Já entrou no teu ritual, no mesmo lugar.</p>`;
  else if (essencial) corpo = `<p>Precisas de um novo <b>${esc(tipoCurto(p.tipo).toLowerCase())}</b>: é um passo essencial do teu ritual.</p>
    <div class="botoes">${cfg.chave ? `<button class="btn ouro" data-acao="perguntar" data-q="${esc(`Acabou-se o meu ${p.nome}. Que ${tipoCurto(p.tipo).toLowerCase()} devo comprar para a minha pele?`)}">${IC.ia} O que comprar?</button>` : ''}
    <a class="btn" href="${procurarURL(p.marca ? p.marca + ' ' + p.nome : p.nome)}" target="_blank" rel="noopener">${IC.lupa} Procurar o mesmo</a></div>`;
  else corpo = `<p>Não precisas de o substituir. ${lista.length ? 'Continua só com estes:' : ''}</p>${lista.length ? `<div class="lista">${lista.map(o => `<div class="item">${miniFoto(o)}<div class="t"><b>${nomeP(o)}</b><span>${esc(tipoCurto(o.tipo))}</span></div></div>`).join('')}</div>` : ''}`;
  const falta = faltas(ctx.uso);
  abrirFolha(`${cab('Acabou: ' + nomeP(p))}${corpo}${falta.length && !essencial ? falta.map(([, t]) => `<div class="alerta">${IC.alerta}<div>Falta-te ${esc(t)}.</div></div>`).join('') : ''}`, 'acabou');
}

/* ---------- Ritual ---------- */
function verificarCompleto(dia, s, el){
  const ctx = contexto(), se = sessao(deChave(dia), s, ctx, ctx.plano), r = registos[dia], feitos = r[s] || {};
  const tudo = se.passos.length && se.passos.every(p => feitos[p.id]);
  if (tudo && !r[s + 'F']){
    const antes = reino(pontos()).i; r[s + 'F'] = Date.now(); const depois = reino(pontos());
    festa(depois.i > antes ? 'Ascendeste' : 'Ritual completo', depois.i > antes ? depois.nome : 'O teu qi fluiu');
    if (el){ const b = el.getBoundingClientRect(); qiExplosao(b.left + b.width / 2, b.top + b.height / 2); }
  } else if (!tudo) delete r[s + 'F'];
}
function marcarPasso(el){
  const {id, dia, s} = el.dataset, r = registos[dia] = registos[dia] || {}, f = r[s] = r[s] || {};
  if (f[id]) delete f[id];
  else {
    f[id] = Date.now(); vibrar(12);
    const p = produtos.find(x => x.id === id);
    if (p && !p.aberto){ p.aberto = dia; p.atualizado = Date.now(); guardarProdutos(); }
  }
  r.ts = Date.now(); verificarCompleto(dia, s, el); guardarRegistos(); rRitual();
}
function marcarTudo(el){
  const {dia, s} = el.dataset, ctx = contexto(), se = sessao(deChave(dia), s, ctx, ctx.plano), r = registos[dia] = registos[dia] || {}, f = r[s] = r[s] || {};
  let mud = false;
  for (const p of se.passos){ if (!f[p.id]) f[p.id] = Date.now(); if (!p.aberto){ p.aberto = dia; p.atualizado = Date.now(); mud = true; } }
  if (mud) guardarProdutos();
  r.ts = Date.now(); verificarCompleto(dia, s, el); guardarRegistos(); rRitual();
}
function festa(titulo, sub){
  const d = document.createElement('div'); d.className = 'festa'; d.innerHTML = `<div>${esc(titulo)}<small>${esc(sub)}</small></div>`;
  document.body.appendChild(d); vibrar([20, 50, 30]); setTimeout(() => d.remove(), 2300);
}

/* ---------- Pele ---------- */
async function guardarRegistoPele(){
  const f = peleForm, existente = pele.find(r => r.d === f.d);
  const r = Object.assign(existente || {id: uid()}, {d: f.d, ts: Date.now(), nota: String(f.nota || '').trim().slice(0, 500), sinais: f.sinais.slice()},
    Object.fromEntries(MEDIDAS.map(m => [m[0], +medidaVal(f, m[0])])));
  if (!existente) pele.push(r);
  guardarPele();
  if (!cfg.chave){ peleForm = null; rPele(); return toast('Registo guardado.'); }
  abrirFolha(aMeditar(f.foto ? 'O Mestre observa a tua pele…' : 'O Mestre medita sobre o teu registo…'), 'ia');
  try {
    const o = await comentarPele(r, f.foto);
    if (!(f.tocados || []).length && r.nota && o.valores) for (const m of MEDIDAS){ const v = parseInt(o.valores[m[0]], 10); if (v >= 0 && v <= 4) r[m[0]] = v; }
    r.mestre = [o.comentario, o.acao, o.alerta].map(x => String(x || '').trim()).filter(Boolean).join(' ').slice(0, 700); r.ts = Date.now();
    guardarPele(); peleForm = null; rPele();
    if (folhaAtual === 'ia') abrirFolha(`${cab('O Mestre')}<div class="resposta-mestre">${esc(o.comentario || '')}</div>${o.acao ? `<div class="alerta info">${IC.info}<div>${esc(o.acao)}</div></div>` : ''}${o.alerta ? `<div class="alerta perigo">${IC.alerta}<div>${esc(o.alerta)}</div></div>` : ''}`, 'mestre');
  } catch(e){ peleForm = null; rPele(); if (folhaAtual === 'ia'){ fecharFolha(); toast('Registo guardado. ' + e.message, 4000); } }
}

/* ---------- Voz ---------- */
let reconhecimento = null;
function ouvir(btn, alvo, depois){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return toast('O reconhecimento de voz não está disponível neste navegador.');
  if (reconhecimento){ reconhecimento.stop(); return; }
  const r = reconhecimento = new SR(); r.lang = 'pt-PT'; r.interimResults = true;
  let ouviu = false; btn.classList.add('a-ouvir');
  r.onresult = e => { alvo.value = Array.from(e.results).map(x => x[0].transcript).join(''); ouviu = true; alvo.dispatchEvent(new Event('input', {bubbles: true})); };
  r.onerror = e => toast(e.error === 'not-allowed' ? 'Sem permissão para usar o microfone.' : e.error === 'no-speech' ? 'Não ouvi nada. Tenta outra vez.' : 'Não consegui ouvir. Tenta outra vez.');
  r.onend = () => { reconhecimento = null; btn.classList.remove('a-ouvir'); if (ouviu && alvo.value.trim() && depois) depois(); };
  try { r.start(); } catch(e){ reconhecimento = null; btn.classList.remove('a-ouvir'); }
}

/* ---------- Cópia de segurança ---------- */
const dadosLocais = () => ({app: 'nascente', versao: 1, cfg: Object.assign(Object.fromEntries(PARTILHADO.map(k => [k, cfg[k]])), {ts: cfg.ts || 0}),
  produtos, apagados, registos, pele, revisao, avaliacao});
function exportar(){
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(Object.assign(dadosLocais(), {fotos, conversa, exportado: new Date().toISOString()}))], {type: 'application/json'}));
  a.download = 'nascente-' + diaChave(new Date()) + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function importar(){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = async () => {
    try {
      const d = JSON.parse(await inp.files[0].text()); if (d.app !== 'nascente') throw new Error();
      fundir(d); for (const [id, url] of Object.entries(d.fotos || {})) if (!fotos[id]) fotoGuardar(id, url);
      if (Array.isArray(d.conversa) && !conversa.length){ conversa = d.conversa; LS.set('conversa', conversa); }
      marcarSujo(); toast('Importado.'); renderAtual();
    } catch(e){ toast('Ficheiro inválido.'); }
  };
  inp.click();
}

/* ---------- Sincronização (GitHub, repositório privado do utilizador) ---------- */
const FICH = 'nascente.json';
const ghLigado = () => !!(gh.dono && gh.repo && gh.token);
const b64enc = s => { const b = new TextEncoder().encode(s); let t = ''; for (let i = 0; i < b.length; i += 8192) t += String.fromCharCode(...b.subarray(i, i + 8192)); return btoa(t); };
const b64dec = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, '')), c => c.charCodeAt(0)));
let tSync;
function marcarSujo(){ sync.sujo = Date.now(); LS.set('sync', sync); estadoSync(); agendarSync(); }
function agendarSync(ms){ if (!ghLigado()) return; clearTimeout(tSync); tSync = setTimeout(sincronizar, ms || 2000); }
async function ghPedido(caminho, opt = {}){
  try {
    return await fetch(`https://api.github.com/repos/${encodeURIComponent(gh.dono)}/${encodeURIComponent(gh.repo)}${caminho}`, Object.assign({cache: 'no-store'}, opt, {
      headers: Object.assign({'Authorization': 'Bearer ' + gh.token, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'}, opt.headers || {})}));
  } catch(e){ throw new Error('Sem ligação ao GitHub.'); }
}
function erroGH(r){
  if (r.status === 401) return new Error('Token do GitHub inválido ou expirado.');
  if (r.status === 403) return new Error('Sem permissão: o token precisa de "Contents: Read and write" neste repositório.');
  if (r.status === 404) return new Error('Repositório não encontrado, ou o token não tem acesso a ele.');
  return new Error('Erro do GitHub: ' + r.status);
}
async function lerRemoto(p){
  const r = await ghPedido('/contents/' + p);
  if (r.status === 404) return null;
  if (!r.ok) throw erroGH(r);
  const j = await r.json(); if (Array.isArray(j)) return null;
  let txt = j.content ? b64dec(j.content) : '';
  if (!txt){ const r2 = await ghPedido('/contents/' + p, {headers: {'Accept': 'application/vnd.github.raw+json'}}); if (!r2.ok) throw erroGH(r2); txt = await r2.text(); }
  return {sha: j.sha, dados: JSON.parse(txt)};
}
async function escreverRemoto(p, dados, sha){
  const corpo = {message: 'Nascente: dados', content: b64enc(JSON.stringify(dados))}; if (sha) corpo.sha = sha;
  const r = await ghPedido('/contents/' + p, {method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(corpo)});
  if (r.status === 409 || r.status === 422) return {conflito: true};
  if (!r.ok) throw erroGH(r);
  return {sha: (await r.json()).content.sha};
}
function fundir(r){
  if (!r || r.app !== 'nascente') return false;
  const antes = JSON.stringify(dadosLocais());
  for (const [id, ts] of Object.entries(r.apagados || {})) if (!apagados[id] || apagados[id] < ts) apagados[id] = ts;
  const porId = (local, rem, campo) => {
    for (const x of rem || []){ const i = local.findIndex(o => o.id === x.id); if (i < 0) local.push(x); else if ((x[campo] || 0) > (local[i][campo] || 0)) local[i] = x; }
    return local.filter(o => !(apagados[o.id] && apagados[o.id] >= (o[campo] || 0)));
  };
  produtos = porId(produtos, r.produtos, 'atualizado');
  pele = porId(pele, r.pele, 'ts');
  for (const [k, v] of Object.entries(r.registos || {})) if (!registos[k] || (v.ts || 0) > (registos[k].ts || 0)) registos[k] = v;
  if (r.cfg && (r.cfg.ts || 0) > (cfg.ts || 0)){ for (const k of PARTILHADO) if (k in r.cfg) cfg[k] = r.cfg[k]; cfg.ts = r.cfg.ts; if (cfg.pele) cfg.pronto = true; LS.set('cfg', cfg); }
  if (r.revisao && (!revisao || r.revisao.ts > revisao.ts)){ revisao = r.revisao; LS.set('revisao', revisao); }
  if (r.avaliacao && (!avaliacao || r.avaliacao.ts > avaliacao.ts)){ avaliacao = r.avaliacao; LS.set('avaliacao', avaliacao); }
  LS.set('produtos', produtos); LS.set('apagados', apagados); LS.set('pele', pele); LS.set('registos', registos);
  return JSON.stringify(dadosLocais()) !== antes;
}
let aSincronizar = false;
async function sincronizar(){
  if (!ghLigado() || aSincronizar) return;
  aSincronizar = true; estadoSync('A sincronizar…');
  try {
    for (let i = 0; i < 3; i++){
      const rem = await lerRemoto(FICH);
      if (rem && fundir(rem.dados) && folhaAtual !== 'editar') renderAtual();
      const local = dadosLocais();
      if (rem && JSON.stringify(rem.dados) === JSON.stringify(local)){ sync.sha = rem.sha; sync.sujo = 0; break; }
      const w = await escreverRemoto(FICH, local, rem ? rem.sha : undefined);
      if (w.conflito) continue;
      sync.sha = w.sha; sync.sujo = 0; break;
    }
    sync.ultimo = Date.now(); sync.erro = '';
  } catch(e){ sync.erro = e.message; }
  finally { aSincronizar = false; LS.set('sync', sync); estadoSync(); }
}
function estadoSync(txt){
  const pt = $('#syncPonto'); if (!pt) return;
  pt.hidden = !ghLigado(); pt.className = 'ponto' + (sync.erro ? ' erro' : sync.sujo ? ' sujo' : '');
  const el = $('#syncTxt'); if (!el) return;
  el.textContent = txt || (!ghLigado() ? '' : sync.erro ? 'Erro: ' + sync.erro : sync.ultimo ? 'Sincronizado a ' + new Date(sync.ultimo).toLocaleString('pt-PT', {dateStyle: 'short', timeStyle: 'short'}) + (sync.sujo ? ' · alterações por enviar' : '') : 'Ainda não sincronizado.');
}

/* ---------- Fundo: qi a subir e ondas na água ---------- */
const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const qi = {cv: null, c: null, w: 0, h: 0, parts: [], ondas: [], brilho: {}};
function brilhoSprite(cor){
  const s = document.createElement('canvas'); s.width = s.height = 32; const c = s.getContext('2d'), g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, `rgba(${cor},1)`); g.addColorStop(.25, `rgba(${cor},.55)`); g.addColorStop(1, `rgba(${cor},0)`); c.fillStyle = g; c.fillRect(0, 0, 32, 32); return s;
}
const novaParticula = (inicio, x, y, efemera) => ({x: x ?? Math.random() * qi.w, y: y ?? (inicio ? Math.random() * qi.h : qi.h + 10), r: .7 + Math.random() * 1.8,
  v: efemera ? .8 + Math.random() * 1.8 : .12 + Math.random() * .35, fase: Math.random() * 6.28, amp: .2 + Math.random() * .5, ouro: efemera || Math.random() < .22, efemera, vx: efemera ? (Math.random() - .5) * 2.4 : 0});
function onda(x, y, forca = 1){ if (reduzido || !qi.c) return; qi.ondas.push({x, y, r: 1, max: 34 + 60 * forca, a: .5 * forca + .12}); if (qi.ondas.length > 16) qi.ondas.shift(); }
function qiExplosao(x, y){ if (reduzido || !qi.c) return; for (let i = 0; i < 26; i++) qi.parts.push(novaParticula(false, x + (Math.random() - .5) * 40, y + (Math.random() - .5) * 20, true)); onda(x, y, 1.4); }
function qiIniciar(){
  qi.cv = $('#qi'); qi.c = qi.cv.getContext('2d'); if (!qi.c) return;
  qi.brilho = {jade: brilhoSprite('160,236,210'), ouro: brilhoSprite('227,196,126')};
  const ajustar = () => { const dpr = Math.min(1.5, devicePixelRatio || 1); qi.w = innerWidth; qi.h = innerHeight; qi.cv.width = qi.w * dpr; qi.cv.height = qi.h * dpr; qi.c.setTransform(dpr, 0, 0, dpr, 0, 0); };
  ajustar(); addEventListener('resize', ajustar);
  const n = Math.round(Math.min(44, Math.max(18, qi.w * qi.h / 17000)));
  for (let i = 0; i < n; i++) qi.parts.push(novaParticula(true));
  if (!reduzido) requestAnimationFrame(passoQi);
}
function passoQi(t){
  requestAnimationFrame(passoQi);
  if (document.hidden) return;
  const c = qi.c; c.clearRect(0, 0, qi.w, qi.h);
  c.globalCompositeOperation = 'lighter';
  for (const p of qi.parts){
    p.y -= p.v; p.x += Math.sin(t / 1600 + p.fase) * p.amp * .4 + p.vx;
    if (p.efemera){ p.v *= .985; p.vx *= .97; p.vida = (p.vida || 0) + 1; }
    const fade = p.efemera ? Math.max(0, 1 - p.vida / 110) : Math.min(1, (qi.h - p.y) / 120) * Math.min(1, p.y / (qi.h * .15));
    c.globalAlpha = Math.max(0, Math.min(1, (.45 + .35 * Math.sin(t / 700 + p.fase * 3)) * fade));
    const s = p.r * 9; c.drawImage(p.ouro ? qi.brilho.ouro : qi.brilho.jade, p.x - s / 2, p.y - s / 2, s, s);
    if (!p.efemera && p.y < -10) Object.assign(p, novaParticula(false));
  }
  qi.parts = qi.parts.filter(p => !p.efemera || p.vida < 110);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.lineWidth = 1.2;
  for (const o of qi.ondas){
    o.r += .9 + o.r * .012; const al = o.a * (1 - o.r / o.max); if (al <= 0) continue;
    c.strokeStyle = `rgba(190,240,222,${al})`; c.beginPath(); c.ellipse(o.x, o.y, o.r, o.r * .32, 0, 0, 6.283); c.stroke();
    if (o.r > 12){ c.strokeStyle = `rgba(190,240,222,${al * .5})`; c.beginPath(); c.ellipse(o.x, o.y, o.r * .6, o.r * .19, 0, 0, 6.283); c.stroke(); }
  }
  qi.ondas = qi.ondas.filter(o => o.r < o.max);
  if (Math.random() < .012) onda(Math.random() * qi.w, qi.h * (.84 + Math.random() * .14), .6);
}

/* ---------- Capa ---------- */
let tCapa;
function mostrarCapa(){
  const c = $('#capa');
  c.innerHTML = `<div class="cena"><svg viewBox="0 0 200 180" fill="none"><path class="gota" d="M100 112c6 9 9 14 9 18a9 9 0 0 1-18 0c0-4 3-9 9-18z" fill="#7fd1b4" fill-opacity=".6" stroke="#dffff3" stroke-width="1.4"/>
    <ellipse class="an an1" cx="100" cy="150" rx="90" ry="18" stroke="#7fd1b4" stroke-width="1.5"/><ellipse class="an an2" cx="100" cy="150" rx="60" ry="12" stroke="#bff0dc" stroke-width="1.3"/><ellipse class="an an3" cx="100" cy="150" rx="34" ry="7" stroke="#e3c47e" stroke-width="1.2"/>
    <path d="M0 150h200" stroke="#7fd1b4" stroke-opacity=".18"/></svg><h1>NASCENTE</h1><p>o caminho da pele de jade</p></div>`;
  c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
  c.classList.remove('sair'); c.hidden = false; clearTimeout(tCapa); tCapa = setTimeout(() => { c.hidden = true; }, 3700);
}
function fecharCapa(){ const c = $('#capa'); c.classList.add('sair'); clearTimeout(tCapa); tCapa = setTimeout(() => { c.hidden = true; }, 500); }

/* ---------- Navegação ---------- */
const RENDER = {vRitual: () => rRitual(), vFrascos: () => rFrascos(), vPele: () => rPele(), vMestre: () => rMestre(), vPerfil: () => rPerfil()};
function renderAtual(){ RENDER[vista](); atualizarTopo(); }
function irPara(v){
  if (!RENDER[v]) v = 'vRitual';
  vista = v;
  for (const s of document.querySelectorAll('.vista')) s.hidden = s.id !== v;
  for (const b of document.querySelectorAll('#nav button')) b.classList.toggle('on', b.dataset.vista === v);
  renderAtual(); scrollTo({top: 0});
}

/* ---------- Ações ---------- */
const alternar = (lista, v) => { const i = lista.indexOf(v); if (i < 0) lista.push(v); else lista.splice(i, 1); };
function folhaComScroll(){ const c = $('#folhaCaixa'), y = c.scrollTop; folhaEditar(); $('#folhaCaixa').scrollTop = y; }
const ACOES = {
  fecharFolha, irPerfil: () => { fecharFolha(); irPara('vPerfil'); },
  comecar(){ const n = $('#bNome'); if (n) cfg.nome = n.value.trim(); if (!cfg.pele) return toast('Escolhe o teu tipo de pele.'); cfg.pronto = true; guardarCfg(true); rRitual(); },
  pPele(el){ cfg.pele = el.dataset.v; guardarCfg(true); renderAtual(); },
  pPreoc(el){ alternar(cfg.preocupacoes, el.dataset.v); guardarCfg(true); el.classList.toggle('on'); },
  pSensivel(el){ cfg.sensivel = !cfg.sensivel; guardarCfg(true); el.classList.toggle('on'); },
  pExf(el){ cfg.exf = +el.dataset.v; guardarCfg(true); rPerfil(); },
  pRet(el){ cfg.retFixo = +el.dataset.v; guardarCfg(true); rPerfil(); },
  pHora(el){ cfg.horaNoite = +el.dataset.v; guardarCfg(true); rPerfil(); },
  pCapa(el){ cfg.capa = cfg.capa === false; guardarCfg(); el.classList.toggle('on'); },
  verCapa: mostrarCapa,
  usarChaveAlheia(){ cfg.chave = chaveDeOutraApp(); guardarCfg(); rPerfil(); ACOES.testarIA(); },
  verChave(){ const i = $('#pChave'); i.type = i.type === 'password' ? 'text' : 'password'; },
  async testarIA(){
    const i = $('#pChave'), st = $('#iaTeste'); if (i) cfg.chave = i.value.trim(); guardarCfg();
    if (!cfg.chave){ if (st) st.textContent = 'Sem chave.'; return; }
    if (st) st.textContent = 'A testar…';
    try { const n = await listarModelos(); if (st) st.textContent = n.length ? 'Ligado. Modelo: ' + cfg.modelo : 'Chave válida, mas sem modelos Flash disponíveis.'; toast('O Mestre está pronto.'); }
    catch(e){ if (st) st.textContent = e.message; }
  },
  async ligarGH(){
    gh = {dono: $('#gDono').value.trim(), repo: $('#gRepo').value.trim(), token: $('#gToken').value.trim()}; LS.set('gh', gh);
    if (!ghLigado()) return toast('Preenche os três campos.');
    sync.sujo = Date.now(); await sincronizar(); rPerfil(); toast(sync.erro ? sync.erro : 'Sincronizado.');
  },
  desligarGH(){ if (!confirm('Desligar a sincronização? Os dados ficam neste dispositivo.')) return; gh = {dono: '', repo: '', token: ''}; LS.set('gh', gh); sync = {sha: '', sujo: 0, ultimo: 0, erro: ''}; LS.set('sync', sync); rPerfil(); },
  exportar, importar,
  ritualSel(el){ ritualSel = el.dataset.v; passoAberto = null; rRitual(); },
  abrirPasso(el){ passoAberto = passoAberto === el.dataset.id ? null : el.dataset.id; rRitual(); },
  marcarPasso, marcarTudo,
  verDia: el => folhaDia(+el.dataset.v),
  fotografar,
  novoManual(){ rascunho = novoRascunho(); folhaEditar(); },
  fotoRascunho(el){
    const segunda = el.dataset.v === '2';
    escolherFoto(async f => {
      try {
        const [ia, mini] = await Promise.all([comprimir(f, 1280, .82), segunda ? null : comprimir(f, 420, .8)]);
        if (segunda) rascunho.fotosIA = [...rascunho.fotosIA.slice(0, 2), ia]; else { rascunho.foto = mini; rascunho.fotoNova = true; rascunho.fotosIA = [ia]; }
        if (cfg.chave) lerRascunhoIA(); else folhaEditar();
      } catch(e){ toast(e.message); }
    });
  },
  rAtivo(el){ alternar(rascunho.ativos, el.dataset.v); el.classList.toggle('on'); },
  rQuando(el){ rascunho.quando = el.dataset.v; rascunho.quandoManual = true; folhaComScroll(); },
  guardarFrasco,
  verFrasco: el => folhaFrasco(el.dataset.id),
  editar(el){ const p = produtos.find(x => x.id === el.dataset.id); if (!p) return; rascunho = novoRascunho(Object.assign(JSON.parse(JSON.stringify(p)), {foto: fotos[p.id] || '', fotoNova: false, fotosIA: [], duvida: '', adequado: ''})); folhaEditar(); },
  acabou(el){ const p = produtos.find(x => x.id === el.dataset.id); if (!p) return; p.fim = diaChave(new Date()); p.atualizado = Date.now(); guardarProdutos(); renderAtual(); folhaAcabou(p); },
  reativar(el){ const p = produtos.find(x => x.id === el.dataset.id); if (!p) return; delete p.fim; p.atualizado = Date.now(); guardarProdutos(); renderAtual(); folhaFrasco(p.id); },
  usarAgora(el){ const p = produtos.find(x => x.id === el.dataset.id); if (!p) return; p.agora = Date.now(); p.atualizado = Date.now(); guardarProdutos(); renderAtual(); folhaFrasco(p.id); toast('Passou para uso. O outro fica em espera.'); },
  abriHoje(el){ const p = produtos.find(x => x.id === el.dataset.id); if (!p) return; p.aberto = diaChave(new Date()); p.atualizado = Date.now(); guardarProdutos(); folhaFrasco(p.id); },
  pausar(el){ const p = produtos.find(x => x.id === el.dataset.id); if (!p) return; p.pausa = !p.pausa; p.atualizado = Date.now(); guardarProdutos(); renderAtual(); folhaFrasco(p.id); },
  apagar(el){
    const i = produtos.findIndex(x => x.id === el.dataset.id); if (i < 0 || !confirm(`Apagar ${produtos[i].nome}? Se só acabou, usa "Acabou".`)) return;
    apagados[produtos[i].id] = Date.now(); fotoApagar(produtos[i].id); fotoApagar(produtos[i].id + ':ia'); produtos.splice(i, 1); guardarProdutos(); fecharFolha(); renderAtual();
  },
  reverFrascos,
  lerPendentes: el => lerPendentes(el.dataset.id ? produtos.filter(p => p.id === el.dataset.id) : null),
  falar(el){ const alvo = document.querySelector(`[data-campo="${el.dataset.alvo}"]`) || document.getElementById(el.dataset.alvo); if (alvo) ouvir(el, alvo); },
  fSinal(el){ alternar(peleForm.sinais, el.dataset.v); el.classList.toggle('on'); },
  fotoPele(){ escolherFoto(async f => { try { peleForm.foto = await comprimir(f, 1024, .8); rPele(); toast('Foto pronta. Toca em Guardar.'); } catch(e){ toast(e.message); } }); },
  guardarPele: guardarRegistoPele,
  grafDias(el){ grafDias = +el.dataset.v; rPele(); },
  grafMedida(el){ alternar(grafMedidas, el.dataset.v); rPele(); },
  avaliar,
  perguntar(el){ fecharFolha(); perguntarMestre(el.dataset.q); },
  enviarPergunta(){ const t = $('#pergunta'); if (!t || !t.value.trim()) return; const q = t.value; t.value = ''; perguntarMestre(q); },
  limparConversa(){ if (!confirm('Apagar a conversa com o Mestre?')) return; conversa = []; LS.set('conversa', conversa); rMestre(); }
};
const CAMPOS = {
  rNome: el => { rascunho.nome = el.value; }, rMarca: el => { rascunho.marca = el.value; }, rQtd: el => { rascunho.qtd = el.value; }, rModo: el => { rascunho.modo = el.value; },
  rEspera: el => { rascunho.espera = el.value; }, rConc: el => { rascunho.conc = el.value; }, rAviso: el => { rascunho.aviso = el.value; }, rAberto: el => { rascunho.aberto = el.value; },
  rPao: el => { rascunho.pao = el.value; }, rValidade: el => { rascunho.validade = el.value; }, rVezes: el => { rascunho.vezes = +el.value; },
  rTipo: el => { rascunho.tipo = el.value; if (!rascunho.quandoManual) rascunho.quando = TIPOS[el.value][2]; folhaComScroll(); },
  fNota: el => { peleForm.nota = el.value; },
  fMedida: el => { const k = el.dataset.k; peleForm[k] = +el.value; (peleForm.tocados = peleForm.tocados || []).includes(k) || peleForm.tocados.push(k); const o = $('#o_' + k), m = MEDIDAS.find(x => x[0] === k); if (o) o.textContent = m[2][+el.value]; },
  pNome: el => { cfg.nome = el.value.trim(); clearTimeout(CAMPOS.t); CAMPOS.t = setTimeout(() => guardarCfg(true), 600); }
};

/* ---------- Eventos ---------- */
document.addEventListener('click', e => {
  if (!$('#capa').hidden && e.target.closest('#capa')) return fecharCapa();
  const v = e.target.closest('[data-vista]'); if (v){ irPara(v.dataset.vista); return; }
  const a = e.target.closest('[data-acao]'); if (!a) return;
  const f = ACOES[a.dataset.acao]; if (f) f(a, e);
});
document.addEventListener('input', e => { const c = e.target.closest('[data-campo]'); if (c && CAMPOS[c.dataset.campo]) CAMPOS[c.dataset.campo](c, e); });
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && e.target.id === 'pergunta'){ e.preventDefault(); ACOES.enviarPergunta(); }
  if (e.key === 'Escape' && !$('#folha').hidden) fecharFolha();
});
const CLICAVEL = '.btn, .chip, .item, .frasco, .dia, #nav button, .abas button, .marcar';
document.addEventListener('pointerdown', e => {
  const el = e.target.closest(CLICAVEL);
  onda(e.clientX, e.clientY, el ? .5 : 1);
  if (!el || reduzido) return;
  const r = el.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, o = document.createElement('span');
  o.className = 'onda'; o.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
  el.appendChild(o); setTimeout(() => o.remove(), 700);
}, {passive: true});
let ultimaSessao = '';
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  agendarSync(800);
  const a = agoraRitual(), k = diaChave(a.data) + a.s;
  if (vista === 'vRitual' && k !== ultimaSessao){ ultimaSessao = k; ritualSel = null; rRitual(); }
});

/* ---------- Arranque ---------- */
(async function iniciar(){
  await carregarFotos();
  qiIniciar();
  const q = new URLSearchParams(location.search);
  irPara(q.get('v') || 'vRitual');
  const a = agoraRitual(); ultimaSessao = diaChave(a.data) + a.s;
  if (cfg.capa !== false && !sessionStorage.getItem('nascente.capa')){ try { sessionStorage.setItem('nascente.capa', '1'); } catch(e){} mostrarCapa(); }
  if (q.get('acao') === 'fotografar') setTimeout(fotografar, 400);
  estadoSync(); if (ghLigado()) agendarSync(700);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
