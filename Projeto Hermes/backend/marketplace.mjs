import { id, now } from './db.mjs';
import { HttpError, image, location, role, text, uuid } from './validation.mjs';
import Triagem from '../js/ai.js';

const DAY = 86400000;
const eligible = (c) => c && !c.aceites_encerrados && c.vagas_restantes > 0 && ['aguardando', 'em_atendimento'].includes(c.status);
const profile = (db, userId) => db.get('SELECT user_id,nome,telefone,cnpj,sobre,cidade,uf,localidade,verificacao,foto_tipo FROM perfis WHERE user_id=?', userId);
const plan = (db, userId) => db.get('SELECT solicitada_em,expira_em FROM assinaturas WHERE user_id=?', userId) || {};
const subscribed = (db, userId) => plan(db, userId).expira_em > Date.now();
const call = (db, key) => db.get('SELECT * FROM chamados_andamento WHERE id=?', key);
const messageFields = 'seq,id,atendimento_id,remetente_id,tipo_remetente,conteudo,foto_tipo,enviado_em';
const toMessage = ({ foto_tipo, ...m }) => ({ ...m, foto_url: foto_tipo ? `/api/fotos/mensagem/${m.id}` : '' });
const photoUrl = (p) => p.foto_tipo ? `/api/fotos/perfil/${p.user_id}` : '';
const publicShop = (p) => ({
  user_id: p.user_id, nome_oficina: p.nome, sobre: p.sobre, cidade: p.cidade, uf: p.uf,
  foto_url: photoUrl(p), verificacao: p.verificacao
});
const toReview = ({ notas, ...a }) => ({ ...a, notas: JSON.parse(notas) });
const toService = ({ custo_centavos, ...p }) => ({ ...p, custo: custo_centavos / 100 });

function notify(db, userId, title, detail, screen, target) {
  db.run('INSERT INTO notificacoes(id,user_id,titulo,texto,destino,created_at) VALUES(?,?,?,?,?,?)',
    id(), userId, title, detail, JSON.stringify({ screen, id: target }), now());
}

function allowedChat(db, user, atId) {
  const at = db.get('SELECT a.*,c.motorista_id FROM atendimentos a JOIN chamados c ON c.id=a.chamado_id WHERE a.id=?', uuid(atId));
  if (!at || !(user.id === at.motorista_id || user.id === at.oficina_id)) throw new HttpError(404, 'Conversa não encontrada.');
  return at;
}

function priorityUntil(db, c, shopId, isPro = subscribed(db, shopId)) {
  const until = Date.parse(c.created_at) + 120000;
  if (isPro || !(until > Date.now())) return null;
  const rival = db.get(`SELECT 1 FROM perfis p JOIN assinaturas s ON s.user_id=p.user_id
    WHERE p.localidade=? AND p.verificacao='aprovada' AND s.expira_em>?
    AND NOT EXISTS(SELECT 1 FROM atendimentos a WHERE a.chamado_id=? AND a.oficina_id=p.user_id) LIMIT 1`,
  c.localidade, Date.now(), c.id);
  return rival ? until : null;
}

function saveProfile(db, user, data, editing = false) {
  if (!['motorista', 'oficina'].includes(user.user_type)) throw new HttpError(403, 'Perfil indisponível.');
  const shop = user.user_type === 'oficina';
  const nome = text(data.nome, 'nome', 100, 2);
  const place = location(data);
  const telefone = shop ? null : text(data.telefone, 'telefone', 25);
  if (telefone && !/^\+?[\d ()-]{8,25}$/.test(telefone)) throw new HttpError(400, 'Informe um telefone válido.');
  const cnpj = shop ? text(data.cnpj, 'CNPJ', 24).replace(/[.\s/-]/g, '').toUpperCase() : null;
  if (cnpj && !/^[A-Z0-9]{12}\d{2}$/.test(cnpj)) throw new HttpError(400, 'Informe os 14 caracteres do CNPJ.');
  const sobre = shop ? text(data.sobre, 'sobre a oficina', 1000, 0) : null;
  const foto = image(data.foto_url);
  db.tx(() => {
    const existing = profile(db, user.id);
    if (editing && !existing) throw new HttpError(404, 'Seu perfil ainda não foi cadastrado.');
    if (!editing && existing) throw new HttpError(409, 'Seu perfil já está cadastrado.');
    if (cnpj && db.get('SELECT 1 FROM perfis WHERE cnpj=? AND user_id<>?', cnpj, user.id)) throw new HttpError(409, 'Este CNPJ já está cadastrado.');
    if (editing) {
      const revisao = shop && (existing.cnpj !== cnpj || existing.localidade !== place.localidade || existing.nome !== nome);
      db.run(`UPDATE perfis SET nome=?,telefone=?,cnpj=?,sobre=?,cidade=?,uf=?,localidade=?,verificacao=?
        WHERE user_id=?`, nome, telefone, cnpj, sobre, place.cidade, place.uf, place.localidade,
      revisao && existing.verificacao !== 'suspensa' ? 'pendente' : existing.verificacao, user.id);
      return;
    }
    db.run(`INSERT INTO perfis(user_id,nome,telefone,cnpj,sobre,cidade,uf,localidade,verificacao,foto,foto_tipo)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)`, user.id, nome, telefone, cnpj, sobre,
    place.cidade, place.uf, place.localidade, shop ? 'pendente' : null, foto.bytes, foto.type);
  });
}

function saveVehicle(db, user, data) {
  role(user, 'motorista');
  if (!profile(db, user.id)) throw new HttpError(403, 'Complete seu perfil.');
  const placa = text(data.placa, 'placa', 12).replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(placa)) throw new HttpError(400, 'Informe uma placa brasileira válida.');
  const ano = text(data.ano, 'ano', 4);
  if (!/^\d{4}$/.test(ano) || +ano < 1900 || +ano > new Date().getFullYear() + 2) throw new HttpError(400, 'Confira o ano do veículo.');
  const marca = text(data.marca, 'marca', 60);
  const modelo = text(data.modelo, 'modelo', 60);
  const cor = text(data.cor, 'cor', 35, 0);
  db.tx(() => {
    if (db.get('SELECT 1 FROM veiculos WHERE motorista_id=? AND placa=?', user.id, placa)) throw new HttpError(409, 'Você já cadastrou esse veículo.');
    db.run('INSERT INTO veiculos VALUES(?,?,?,?,?,?,?)', id(), user.id, marca, modelo, ano, placa, cor);
  });
}

function publish(db, user, draft) {
  role(user, 'motorista');
  const key = uuid(draft.id);
  const previous = call(db, key);
  if (previous) {
    if (previous.motorista_id === user.id) return { id: key };
    throw new HttpError(409, 'Crie um novo rascunho.');
  }
  const vehicleId = uuid(draft.veiculoId);
  const place = profile(db, user.id);
  if (!place || !db.get('SELECT 1 FROM veiculos WHERE id=? AND motorista_id=?', vehicleId, user.id)) {
    throw new HttpError(404, 'Veículo não encontrado.');
  }
  const limit = draft.limiteOficinas;
  const allowed = subscribed(db, user.id) ? [3, 5, 10, 20] : [3, 4, 5];
  if (!allowed.includes(limit)) throw new HttpError(400, 'Selecione um limite disponível no seu plano.');
  if (!Object.hasOwn(Triagem.categorias, draft.categoria) || !Array.isArray(draft.respostas) || draft.respostas.length !== 4) {
    throw new HttpError(400, 'Complete a triagem.');
  }
  const respostas = draft.respostas.map(item => text(item, 'resposta da triagem', 500));
  const resumo = Triagem.resumo({ categoria: draft.categoria, respostas });
  const perguntas = Triagem.perguntas(draft.categoria).map((item, i) => ({ pergunta: item.texto, resposta: respostas[i] }));
  const resumoIA = text(draft.resumoIA, 'complemento', 1600, 0);
  db.run(`INSERT INTO chamados(id,motorista_id,veiculo_id,localidade,categoria,limite_oficinas,resumo_triagem,resumo_ia,perguntas,created_at)
    VALUES(?,?,?,?,?,?,?,?,?,?)`, key, user.id, vehicleId, place.localidade, draft.categoria, limit, JSON.stringify(resumo),
  resumoIA, JSON.stringify(perguntas), now());
  return { id: key };
}

function accept(db, user, key) {
  role(user, 'oficina');
  const c = call(db, uuid(key));
  const p = profile(db, user.id);
  const existing = c && db.get('SELECT id FROM atendimentos WHERE chamado_id=? AND oficina_id=?', c.id, user.id);
  if (existing) return existing;
  if (p?.verificacao !== 'aprovada') throw new HttpError(403, 'A oficina precisa estar aprovada para aceitar chamados.');
  if (!c || c.localidade !== p.localidade) throw new HttpError(404, 'Chamado não encontrado na sua região.');
  if (!eligible(c)) throw new HttpError(409, 'Este chamado não tem vagas disponíveis.');
  if (priorityUntil(db, c, user.id)) throw new HttpError(409, 'O chamado ainda está no período de acesso antecipado.');
  const at = { id: id() };
  db.run('INSERT INTO atendimentos(id,chamado_id,oficina_id,status,iniciado_em) VALUES(?,?,?,?,?)', at.id, c.id, user.id, 'aceito', now());
  notify(db, c.motorista_id, 'Uma oficina aceitou seu chamado', 'Uma nova conversa está disponível.', 'chat-oficina', at.id);
  return at;
}

function saveMessage(db, user, data) {
  const at = allowedChat(db, user, data.atendimentoId);
  const key = uuid(data.id);
  const saved = db.get('SELECT atendimento_id,remetente_id FROM mensagens WHERE id=?', key);
  if (saved) {
    if (saved.atendimento_id === at.id && saved.remetente_id === user.id) return { id: key };
    throw new HttpError(409, 'Identificador de mensagem já usado.');
  }
  if (at.status === 'concluido') throw new HttpError(409, 'Este atendimento foi concluído.');
  const body = text(data.conteudo, 'mensagem', 2000, 0);
  const attachment = image(data.foto);
  if (!body && !attachment.bytes) throw new HttpError(400, 'Escreva uma mensagem ou anexe uma foto.');
  db.run('INSERT INTO mensagens(id,atendimento_id,remetente_id,tipo_remetente,conteudo,foto,foto_tipo,enviado_em) VALUES(?,?,?,?,?,?,?,?)',
    key, at.id, user.id, user.user_type, body, attachment.bytes, attachment.type, now());
  const recipient = user.id === at.oficina_id ? at.motorista_id : at.oficina_id;
  notify(db, recipient, 'Nova mensagem', 'Abra a conversa para ler a mensagem.', 'chat-oficina', at.id);
  return { id: key };
}

function finish(db, user, data) {
  role(user, 'motorista');
  const at = allowedChat(db, user, data.atendimentoId);
  if (at.status === 'concluido') return { chamadoId: at.chamado_id };
  if (at.status !== 'aguardando_conclusao') throw new HttpError(409, 'A oficina precisa solicitar a conclusão.');
  if (data.notas) {
    const notas = Object.fromEntries(['transparencia', 'prazo', 'qualidade', 'organizacao'].map(k => [k, data.notas[k]]));
    const values = Object.values(notas);
    if (!values.every(n => Number.isInteger(n) && n >= 1 && n <= 5)) throw new HttpError(400, 'Dê uma nota de 1 a 5 em cada critério.');
    const comentario = text(data.comentario, 'comentário', 1000);
    db.run(`INSERT INTO avaliacoes(id,atendimento_id,oficina_id,motorista_id,notas,media,comentario,created_at)
      VALUES(?,?,?,?,?,?,?,?)`, id(), at.id, at.oficina_id, user.id, JSON.stringify(notas),
    values.reduce((sum, n) => sum + n, 0) / values.length, comentario, now());
  }
  db.run("UPDATE atendimentos SET status='concluido',concluido_em=? WHERE id=?", now(), at.id);
  notify(db, at.oficina_id, 'Atendimento concluído', 'O motorista confirmou a conclusão.', 'chat-oficina', at.id);
  return { chamadoId: at.chamado_id };
}

function editReview(db, user, data) {
  const key = uuid(data.id);
  const review = db.get('SELECT * FROM avaliacoes WHERE id=?', key);
  if (!review || review.status !== 'publica') throw new HttpError(404, 'Avaliação não encontrada.');
  if (user.user_type === 'oficina' && user.id === review.oficina_id) {
    if (data.acao === 'revisar') return db.run('UPDATE avaliacoes SET revisao_solicitada=1 WHERE id=?', key);
    if (data.acao === 'responder') return db.run('UPDATE avaliacoes SET resposta_oficina=? WHERE id=?', text(data.texto, 'resposta', 1000), key);
  }
  if (user.user_type === 'admin' && review.revisao_solicitada) {
    if (data.acao === 'excluir') return db.run("UPDATE avaliacoes SET status='removida',revisao_solicitada=0 WHERE id=?", key);
    if (data.acao === 'comentar') return db.run('UPDATE avaliacoes SET comentario_adm=?,revisao_solicitada=0 WHERE id=?', text(data.texto, 'comentário', 1000), key);
  }
  throw new HttpError(403, 'Ação indisponível para esta avaliação.');
}

function manage(db, user, action, data) {
  role(user, 'admin');
  const audit = (target, decision) => db.run('INSERT INTO auditoria VALUES(?,?,?,?,?,?)', id(), user.id, action, target, decision, now());
  if (action === 'admin-verificacao') {
    const key = uuid(data.userId);
    if (!['aprovada', 'suspensa'].includes(data.status)) throw new HttpError(400, 'Selecione uma decisão válida.');
    const changed = db.run('UPDATE perfis SET verificacao=? WHERE user_id=? AND verificacao IS NOT NULL', data.status, key);
    if (!changed.changes) throw new HttpError(404, 'Oficina não encontrada.');
    audit(key, data.status);
    return;
  }
  if (action === 'admin-assinatura') {
    const key = uuid(data.userId);
    if (!db.get("SELECT 1 FROM usuarios WHERE id=? AND user_type IN ('motorista','oficina')", key)) throw new HttpError(404, 'Conta não encontrada.');
    const current = plan(db, key);
    const expiry = data.ativa === true ? Math.max(Date.now(), current.expira_em || 0) + 30 * DAY : null;
    db.run(`INSERT INTO assinaturas(user_id,expira_em) VALUES(?,?) ON CONFLICT(user_id)
      DO UPDATE SET expira_em=excluded.expira_em,solicitada_em=NULL`, key, expiry);
    audit(key, expiry ? 'ativo até ' + new Date(expiry).toISOString() : 'inativo');
    return;
  }
  if (action === 'admin-anuncio') {
    if (!['motorista','oficina'].includes(data.publico)) throw new HttpError(400, 'Selecione o público.');
    if (data.remover === true) {
      db.run('DELETE FROM anuncios WHERE publico=?', data.publico);
      audit(data.publico, 'removido');
      return;
    }
    const titulo = text(data.titulo, 'título', 90);
    const corpo = text(data.texto, 'texto do anúncio', 250);
    const link = text(data.link, 'link do anúncio', 600, 0);
    if (link) {
      let url;
      try { url = new URL(link); } catch {}
      if (url?.protocol !== 'https:' || url.username || url.password) throw new HttpError(400, 'Use um endereço HTTPS para o anúncio.');
    }
    db.run(`INSERT INTO anuncios VALUES(?,?,?,?) ON CONFLICT(publico)
      DO UPDATE SET titulo=excluded.titulo,texto=excluded.texto,link=excluded.link`, data.publico, titulo, corpo, link);
    audit(data.publico, 'publicado');
  }
}

export function action(db, user, name, data) {
  if (name === 'perfil') return saveProfile(db, user, data);
  if (name === 'atualizar-perfil') return saveProfile(db, user, data, true);
  if (name === 'veiculo') return saveVehicle(db, user, data);
  return db.tx(() => {
    switch (name) {
      case 'foto-perfil': {
        const foto = image(data.foto);
        return db.run('UPDATE perfis SET foto=?,foto_tipo=? WHERE user_id=?', foto.bytes, foto.type, user.id);
      }
      case 'publicar': return publish(db, user, data);
      case 'aceitar': return accept(db, user, data.chamadoId);
      case 'fechar-vagas': {
        role(user, 'motorista');
        const c = call(db, uuid(data.chamadoId));
        if (!c || c.motorista_id !== user.id) throw new HttpError(404, 'Chamado não encontrado.');
        if (eligible(c)) db.run('UPDATE chamados SET aceites_encerrados=1 WHERE id=?', c.id);
        return true;
      }
      case 'mensagem': return saveMessage(db, user, data);
      case 'servico': {
        role(user, 'oficina');
        const at = allowedChat(db, user, data.atendimentoId);
        const key = uuid(data.id);
        const existing = db.get('SELECT atendimento_id FROM procedimentos WHERE id=?', key);
        if (existing?.atendimento_id === at.id) return true;
        if (existing || at.status !== 'aceito') throw new HttpError(409, 'O atendimento já mudou de etapa.');
        if (!Number.isInteger(data.centavos) || data.centavos < 0 || data.centavos > 100000000) throw new HttpError(400, 'Informe um valor válido.');
        db.run('INSERT INTO procedimentos VALUES(?,?,?,?,?)', key, at.id, text(data.descricao, 'descrição', 200), data.centavos, now());
        return true;
      }
      case 'solicitar-conclusao': {
        role(user, 'oficina');
        const at = allowedChat(db, user, data.atendimentoId);
        if (at.status !== 'aceito') return true;
        db.run("UPDATE atendimentos SET status='aguardando_conclusao' WHERE id=?", at.id);
        notify(db, at.motorista_id, 'A oficina solicitou a conclusão', 'Confira os serviços e confirme na conversa.', 'chat-oficina', at.id);
        return true;
      }
      case 'concluir': return finish(db, user, data);
      case 'avisos-lidos': return db.run('UPDATE notificacoes SET lida=1 WHERE user_id=? AND lida=0', user.id);
      case 'avaliacao': return editReview(db, user, data);
      case 'favorita': {
        role(user, 'motorista');
        if (!subscribed(db, user.id)) throw new HttpError(403, 'Recurso do Motorista Plus.');
        const key = uuid(data.oficinaId);
        if (!canSeeWorkshop(db, user, key)) throw new HttpError(404, 'Oficina não encontrada.');
        if (data.salvar === true) db.run('INSERT OR IGNORE INTO favoritas VALUES(?,?)', user.id, key);
        else db.run('DELETE FROM favoritas WHERE motorista_id=? AND oficina_id=?', user.id, key);
        return true;
      }
      case 'solicitar-plano': {
        if (user.user_type === 'admin') throw new HttpError(403, 'Plano indisponível.');
        if (!subscribed(db, user.id)) db.run(`INSERT INTO assinaturas(user_id,solicitada_em) VALUES(?,?) ON CONFLICT(user_id)
          DO UPDATE SET solicitada_em=COALESCE(assinaturas.solicitada_em,excluded.solicitada_em)`, user.id, now());
        return true;
      }
      case 'admin-verificacao':
      case 'admin-assinatura':
      case 'admin-anuncio': return manage(db, user, name, data);
      default: throw new HttpError(404, 'Ação não encontrada.');
    }
  });
}

function canSeeWorkshop(db, user, key) {
  const p = profile(db, key);
  if (!p?.verificacao) return false;
  if (user.id === key) return true;
  if (user.user_type !== 'motorista') return false;
  return p.verificacao === 'aprovada' && p.localidade === profile(db, user.id)?.localidade ||
    Boolean(db.get('SELECT 1 FROM atendimentos a JOIN chamados c ON c.id=a.chamado_id WHERE a.oficina_id=? AND c.motorista_id=? LIMIT 1', key, user.id));
}

export function chatMessages(db, user, atId, params) {
  allowedChat(db, user, atId);
  const before = params.get('antes');
  const after = params.get('depois');
  if (before && after || [before, after].some(v => v !== null && !/^[1-9]\d{0,14}$/.test(v))) throw new HttpError(400, 'Página inválida.');
  if (after) {
    const latest = db.all(`SELECT ${messageFields} FROM mensagens WHERE atendimento_id=? AND seq>? ORDER BY seq ASC LIMIT 51`, atId, Number(after));
    return { messages: latest.slice(0, 50).map(toMessage), more: latest.length > 50 };
  }
  const rows = db.all(`SELECT ${messageFields} FROM mensagens WHERE atendimento_id=? AND seq<? ORDER BY seq DESC LIMIT 51`,
    atId, before ? Number(before) : Number.MAX_SAFE_INTEGER);
  return { messages: rows.slice(0, 50).reverse().map(toMessage), more: rows.length > 50 };
}

export function photo(db, user, kind, key) {
  const validKey = uuid(key);
  if (kind === 'mensagem') {
    const row = db.get('SELECT atendimento_id,foto,foto_tipo FROM mensagens WHERE id=?', validKey);
    if (!row?.foto) throw new HttpError(404, 'Imagem indisponível.');
    allowedChat(db, user, row.atendimento_id);
    return row;
  }
  if (validKey !== user.id && !canSeeWorkshop(db, user, validKey)) throw new HttpError(404, 'Imagem indisponível.');
  const row = db.get('SELECT foto,foto_tipo FROM perfis WHERE user_id=?', validKey);
  if (!row?.foto) throw new HttpError(404, 'Imagem indisponível.');
  return row;
}

export function state(db, user) {
  if (!user) return { session: null };
  if (user.user_type === 'admin') {
    return { session: user, admin: {
      oficinas: db.all("SELECT user_id,nome,cnpj,cidade,uf,verificacao FROM perfis WHERE verificacao IS NOT NULL ORDER BY nome"),
      assinaturas: db.all('SELECT u.id,u.email,u.user_type,s.solicitada_em,s.expira_em FROM assinaturas s JOIN usuarios u ON u.id=s.user_id ORDER BY s.solicitada_em DESC'),
      anuncios: db.all('SELECT * FROM anuncios')
    }, avaliacoes: db.all("SELECT * FROM avaliacoes WHERE revisao_solicitada=1 AND status='publica' ORDER BY created_at DESC").map(toReview) };
  }
  const p = profile(db, user.id);
  const motorista = user.user_type === 'motorista';
  const plano = plan(db, user.id);
  const ativo = plano.expira_em > Date.now();
  const atendimentos = motorista
    ? db.all('SELECT a.* FROM atendimentos a JOIN chamados c ON c.id=a.chamado_id WHERE c.motorista_id=? ORDER BY a.iniciado_em DESC', user.id)
    : db.all('SELECT * FROM atendimentos WHERE oficina_id=? ORDER BY iniciado_em DESC', user.id);
  const included = new Set(atendimentos.map(a => a.chamado_id));
  const ownerCalls = motorista
    ? db.all('SELECT * FROM chamados_andamento WHERE motorista_id=? ORDER BY created_at DESC', user.id)
    : atendimentos.map(a => call(db, a.chamado_id));
  const available = !motorista && p?.verificacao === 'aprovada'
    ? db.all(`SELECT c.* FROM chamados_andamento c WHERE c.localidade=? AND c.aceites_encerrados=0
      AND c.vagas_restantes>0 AND c.status IN ('aguardando','em_atendimento')
      AND NOT EXISTS(SELECT 1 FROM atendimentos a WHERE a.chamado_id=c.id AND a.oficina_id=?)
      ORDER BY c.created_at DESC LIMIT 150`, p.localidade, user.id) : [];
  const chamados = [...ownerCalls, ...available].map(({ localidade, ...c }) => ({
    ...c, perguntas: JSON.parse(c.perguntas), resumo_triagem: JSON.parse(c.resumo_triagem),
    recebe_oficinas: Boolean(eligible(c)), prioridade_ate: !motorista && !included.has(c.id) ? priorityUntil(db, { ...c, localidade }, user.id, ativo) : null
  }));
  const favoritas = motorista ? db.all('SELECT oficina_id FROM favoritas WHERE motorista_id=?', user.id).map(f => f.oficina_id) : [];
  const officeIds = motorista ? new Set([...atendimentos.map(a => a.oficina_id), ...favoritas]) : new Set(p ? [user.id] : []);
  const oficina_profiles = [...officeIds].map(key => profile(db, key)).filter(Boolean).map(publicShop);
  if (!motorista && p) Object.assign(oficina_profiles[0], { cnpj: p.cnpj });
  const motorista_profiles = motorista ? (p ? [{ user_id: p.user_id, nome: p.nome, telefone: p.telefone, cidade: p.cidade, uf: p.uf, foto_url: photoUrl(p) }] : [])
    : [...new Set(ownerCalls.map(c => c.motorista_id))].map(key => profile(db, key)).filter(Boolean).map(driver => ({ user_id: driver.user_id, nome: driver.nome }));
  const veiculos = motorista ? db.all('SELECT * FROM veiculos WHERE motorista_id=?', user.id)
    : [...new Set(chamados.map(c => c.veiculo_id))].map(key => db.get('SELECT id,marca,modelo,ano FROM veiculos WHERE id=?', key)).filter(Boolean);
  const mensagens = atendimentos.map(at => db.get(`SELECT ${messageFields} FROM mensagens WHERE atendimento_id=? ORDER BY seq DESC LIMIT 1`, at.id)).filter(Boolean).map(toMessage);
  const procedimentos = atendimentos.flatMap(at => db.all('SELECT * FROM procedimentos WHERE atendimento_id=? ORDER BY created_at', at.id)).map(toService);
  const avaliacoes = [...officeIds].flatMap(key => db.all(`SELECT * FROM avaliacoes
    WHERE oficina_id=? AND status='publica' AND (revisao_solicitada=0 OR oficina_id=?) ORDER BY created_at DESC LIMIT 100`, key, user.id)).map(toReview);
  const knownAuthors = new Set(motorista_profiles.map(driver => driver.user_id));
  for (const author of new Set(avaliacoes.map(a => a.motorista_id))) {
    if (!knownAuthors.has(author)) {
      const publicAuthor = db.get('SELECT nome FROM perfis WHERE user_id=?', author);
      if (publicAuthor) motorista_profiles.push({ user_id: author, nome: publicAuthor.nome.split(/\s+/)[0] });
    }
  }
  const counts = {};
  if (!motorista && ativo) {
    for (const dias of [7, 30]) {
      counts[dias] = db.get(`SELECT COUNT(m.seq) AS total FROM mensagens m JOIN atendimentos a ON a.id=m.atendimento_id
        WHERE a.oficina_id=? AND m.enviado_em>=?`, user.id, new Date(Date.now() - dias * DAY).toISOString()).total;
    }
  }
  return {
    session: user, plano: { ...plano, ativo }, anuncio: ativo ? null : db.get('SELECT * FROM anuncios WHERE publico=?', user.user_type) || null,
    favoritas, chamados, atendimentos, oficina_profiles, motorista_profiles, veiculos, mensagens, procedimentos, avaliacoes, counts,
    notifs: db.all('SELECT * FROM notificacoes WHERE user_id=? ORDER BY created_at DESC LIMIT 100', user.id)
      .map(n => ({ ...n, destino: JSON.parse(n.destino) }))
  };
}
