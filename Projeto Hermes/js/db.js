/* ============================================================
   PROJETO HERMES — Database (localStorage)
   ============================================================ */

const DB = {
  // ---- helpers ----
  _get(key) {
    try { return JSON.parse(localStorage.getItem('hermes_' + key)) || []; }
    catch { return []; }
  },
  _set(key, data) { localStorage.setItem('hermes_' + key, JSON.stringify(data)); },
  _id() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },
  _now() { return new Date().toISOString(); },

  // ---- SESSION ----
  getSession() {
    try { return JSON.parse(localStorage.getItem('hermes_session')); }
    catch { return null; }
  },
  setSession(user) { localStorage.setItem('hermes_session', JSON.stringify(user)); },
  clearSession() { localStorage.removeItem('hermes_session'); },

  // ---- USERS ----
  createUser(email, password, userType) {
    const users = this._get('users');
    if (users.find(u => u.email === email)) return { error: 'Email já cadastrado.' };
    const user = { id: this._id(), email, password, user_type: userType, created_at: this._now() };
    users.push(user);
    this._set('users', users);
    return { user };
  },
  findUser(email, password) {
    const users = this._get('users');
    return users.find(u => u.email === email && u.password === password) || null;
  },
  getUserById(id) {
    return this._get('users').find(u => u.id === id) || null;
  },

  // ---- MOTORISTA PROFILES ----
  saveMotoristaProfile(userId, data) {
    const profiles = this._get('motorista_profiles').filter(p => p.user_id !== userId);
    const profile = { id: this._id(), user_id: userId, ...data, created_at: this._now() };
    profiles.push(profile);
    this._set('motorista_profiles', profiles);
    return profile;
  },
  getMotoristaProfile(userId) {
    // accepts user_id or motorista profile id
    return this._get('motorista_profiles').find(p => p.user_id === userId || p.id === userId) || null;
  },

  // ---- OFICINA PROFILES ----
  saveOficinaProfile(userId, data) {
    const profiles = this._get('oficina_profiles').filter(p => p.user_id !== userId);
    const profile = { id: this._id(), user_id: userId, ...data, created_at: this._now() };
    profiles.push(profile);
    this._set('oficina_profiles', profiles);
    return profile;
  },
  updateProfileFoto(userId, type, fotoUrl) {
    if (type === 'motorista') {
      const p = this.getMotoristaProfile(userId);
      if (p) this.saveMotoristaProfile(userId, { ...p, foto_url: fotoUrl });
    } else if (type === 'oficina') {
      const p = this.getOficinaProfile(userId);
      if (p) this.saveOficinaProfile(userId, { ...p, foto_url: fotoUrl });
    }
  },
  getOficinaProfile(userId) {
    return this._get('oficina_profiles').find(p => p.user_id === userId) || null;
  },
  getAllOficinas() { return this._get('oficina_profiles'); },

  // ---- VEICULOS ----
  saveVeiculo(motoristaId, data) {
    const veiculos = this._get('veiculos');
    const v = { id: this._id(), motorista_id: motoristaId, ...data, created_at: this._now() };
    veiculos.push(v);
    this._set('veiculos', veiculos);
    return v;
  },
  getVeiculosByMotorista(motoristaId) {
    return this._get('veiculos').filter(v => v.motorista_id === motoristaId);
  },
  getVeiculoById(id) {
    return this._get('veiculos').find(v => v.id === id) || null;
  },

  // ---- CHAMADOS ----
  createChamado(motoristaId, veiculoId) {
    const chamados = this._get('chamados');
    const c = { id: this._id(), motorista_id: motoristaId, veiculo_id: veiculoId, diagnostico_ia: '', status: 'em_diagnostico', created_at: this._now() };
    chamados.push(c);
    this._set('chamados', chamados);
    return c;
  },
  updateChamadoDiag(id, diag) {
    const chamados = this._get('chamados');
    const idx = chamados.findIndex(c => c.id === id);
    if (idx >= 0) { chamados[idx].diagnostico_ia = diag; this._set('chamados', chamados); }
  },
  getChamadoById(id) { return this._get('chamados').find(c => c.id === id) || null; },
  getChamadosAbertos() { return this._get('chamados').filter(c => c.status === 'aguardando').sort((a,b) => new Date(b.created_at) - new Date(a.created_at)); },
  getChamadosByMotorista(motoristaId) { return this._get('chamados').filter(c => c.motorista_id === motoristaId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)); },
  updateChamadoStatus(id, status) {
    const chamados = this._get('chamados');
    const idx = chamados.findIndex(c => c.id === id);
    if (idx >= 0) { chamados[idx].status = status; this._set('chamados', chamados); }
  },

  // ---- DIAGNOSTICO PERGUNTAS ----
  savePergunta(chamadoId, pergunta, resposta, ordem) {
    const perguntas = this._get('diagnostico_perguntas');
    perguntas.push({ id: this._id(), chamado_id: chamadoId, pergunta, resposta, ordem, created_at: this._now() });
    this._set('diagnostico_perguntas', perguntas);
  },
  getPerguntasByChamado(chamadoId) {
    return this._get('diagnostico_perguntas').filter(p => p.chamado_id === chamadoId);
  },

  // ---- ATENDIMENTOS ----
  createAtendimento(chamadoId, oficinaId) {
    const atendimentos = this._get('atendimentos');
    const existing = atendimentos.find(a => a.chamado_id === chamadoId && a.status !== 'recusado');
    if (existing) return existing;
    const a = { id: this._id(), chamado_id: chamadoId, oficina_id: oficinaId, status: 'aceito', iniciado_em: this._now(), concluido_em: null };
    atendimentos.push(a);
    this._set('atendimentos', atendimentos);
    DB.updateChamadoStatus(chamadoId, 'em_atendimento');
    return a;
  },
  getAtendimentoByChamado(chamadoId) {
    return this._get('atendimentos').find(a => a.chamado_id === chamadoId && a.status !== 'recusado') || null;
  },
  getAtendimentosByOficina(oficinaId) {
    return this._get('atendimentos').filter(a => a.oficina_id === oficinaId).sort((a,b) => new Date(b.iniciado_em) - new Date(a.iniciado_em));
  },
  getAtendimentosByMotorista(motoristaId) {
    const chamados = this.getChamadosByMotorista(motoristaId);
    const ids = chamados.map(c => c.id);
    return this._get('atendimentos').filter(a => ids.includes(a.chamado_id)).sort((a,b) => new Date(b.iniciado_em) - new Date(a.iniciado_em));
  },
  getPropostasByChamado(chamadoId) {
    return []; // mock to prevent crashes since propostas were removed
  },
  solicitarConclusao(id) {
    const atendimentos = this._get('atendimentos');
    const idx = atendimentos.findIndex(a => a.id === id);
    if (idx >= 0) {
      atendimentos[idx].status = 'aguardando_conclusao';
      this._set('atendimentos', atendimentos);
    }
  },
  concludeAtendimento(id) {
    const atendimentos = this._get('atendimentos');
    const idx = atendimentos.findIndex(a => a.id === id);
    if (idx >= 0) {
      atendimentos[idx].status = 'concluido';
      atendimentos[idx].concluido_em = this._now();
      this._set('atendimentos', atendimentos);
      DB.updateChamadoStatus(atendimentos[idx].chamado_id, 'concluido');
    }
  },
  getAtendimentoById(id) { return this._get('atendimentos').find(a => a.id === id) || null; },
  
  // ---- AVALIACOES ----
  saveAvaliacao(atendimentoId, oficinaId, motoristaId, notas, comentario) {
    const avs = this._get('avaliacoes');
    const media = (notas.transparencia + notas.prazo + notas.qualidade + notas.organizacao) / 4;
    const a = { 
      id: this._id(), 
      atendimento_id: atendimentoId, 
      oficina_id: oficinaId, 
      motorista_id: motoristaId, 
      notas, 
      media,
      comentario,
      status: 'publica',
      resposta_oficina: null,
      revisao_solicitada: false,
      comentario_adm: null,
      created_at: this._now() 
    };
    avs.push(a);
    this._set('avaliacoes', avs);
    return a;
  },
  getAvaliacoesPublicas(oficinaId) {
    return this._get('avaliacoes').filter(a => a.oficina_id === oficinaId && a.status === 'publica' && !a.revisao_solicitada).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  },
  getAvaliacoesComRevisao() {
    return this._get('avaliacoes').filter(a => a.revisao_solicitada && a.status === 'publica');
  },
  getAvaliacaoById(id) {
    return this._get('avaliacoes').find(a => a.id === id) || null;
  },
  responderAvaliacao(avalId, resposta) {
    const avs = this._get('avaliacoes');
    const av = avs.find(a => a.id === avalId);
    if (av) { av.resposta_oficina = resposta; this._set('avaliacoes', avs); }
  },
  solicitarRevisaoAvaliacao(avalId) {
    const avs = this._get('avaliacoes');
    const av = avs.find(a => a.id === avalId);
    if (av) { av.revisao_solicitada = true; this._set('avaliacoes', avs); }
  },
  excluirAvaliacao(avalId) {
    let avs = this._get('avaliacoes');
    avs = avs.filter(a => a.id !== avalId);
    this._set('avaliacoes', avs);
  },
  comentarAvaliacaoAdmin(avalId, comentario) {
    const avs = this._get('avaliacoes');
    const av = avs.find(a => a.id === avalId);
    if (av) {
      av.comentario_adm = comentario;
      av.revisao_solicitada = false;
      this._set('avaliacoes', avs);
    }
  },

  // ---- PROCEDIMENTOS ----
  saveProcedimento(atendimentoId, descricao, custo) {
    const procs = this._get('procedimentos');
    const p = { id: this._id(), atendimento_id: atendimentoId, descricao, custo, created_at: this._now() };
    procs.push(p);
    this._set('procedimentos', procs);
    return p;
  },
  getProcedimentosByAtendimento(atendimentoId) {
    return this._get('procedimentos').filter(p => p.atendimento_id === atendimentoId);
  },

  // ---- MENSAGENS ----
  saveMsg(atendimentoId, remetenteId, tipoRemetente, conteudo, fotoUrl = null) {
    const msgs = this._get('mensagens');
    const m = { id: this._id(), atendimento_id: atendimentoId, remetente_id: remetenteId, tipo_remetente: tipoRemetente, conteudo, foto_url: fotoUrl, enviado_em: this._now() };
    msgs.push(m);
    this._set('mensagens', msgs);
    return m;
  },
  getMsgsByAtendimento(atendimentoId) {
    return this._get('mensagens').filter(m => m.atendimento_id === atendimentoId);
  },

  // ---- NOTIFICACOES ----
  addNotif(userId, titulo, texto) {
    const notifs = this._get('notifs');
    notifs.unshift({ id: this._id(), user_id: userId, titulo, texto, lida: false, created_at: this._now() });
    this._set('notifs', notifs);
  },
  getNotifsByUser(userId) { return this._get('notifs').filter(n => n.user_id === userId); },
  markAllRead(userId) {
    const notifs = this._get('notifs').map(n => n.user_id === userId ? { ...n, lida: true } : n);
    this._set('notifs', notifs);
  },

  // ---- STATS OFICINA ----
  getStatsOficina(oficinaId) {
    const ats = this.getAtendimentosByOficina(oficinaId);
    const total = ats.length;
    const concluidos = ats.filter(a => a.status === 'concluido').length;
    const emAndamento = ats.filter(a => a.status === 'aceito').length;
    const mesAtual = new Date().getMonth();
    const concluidosMes = ats.filter(a => a.status === 'concluido' && new Date(a.concluido_em).getMonth() === mesAtual).length;
    return { total, concluidos, emAndamento, concluidosMes, avaliacao: 4.8 };
  }
};
