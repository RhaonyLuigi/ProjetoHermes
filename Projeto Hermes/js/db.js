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
    try {
      const current = sessionStorage.getItem('hermes_session');
      if (current !== null) return JSON.parse(current);
      const legacy = localStorage.getItem('hermes_session');
      if (legacy) {
        this.setSession(JSON.parse(legacy));
        return JSON.parse(sessionStorage.getItem('hermes_session'));
      }
      return null;
    }
    catch { return null; }
  },
  setSession(user) {
    const { id, email, user_type } = user;
    sessionStorage.setItem('hermes_session', JSON.stringify({ id, email, user_type }));
    localStorage.removeItem('hermes_session');
  },
  clearSession() {
    sessionStorage.removeItem('hermes_session');
    localStorage.removeItem('hermes_session');
  },

  demoPerfis: {
    motorista: { email: 'demo_mot@hermes.com', tipo: 'motorista', nome: 'Motorista' },
    oficina: { email: 'demo_ofi@hermes.com', tipo: 'oficina', nome: 'Oficina Avenida' },
    central: { email: 'demo_central@hermes.com', tipo: 'oficina', nome: 'Oficina Central' },
    horizonte: { email: 'demo_horizonte@hermes.com', tipo: 'oficina', nome: 'Oficina Horizonte' }
  },
  isDemo(user) {
    return Object.values(this.demoPerfis).some(perfil => user?.email === perfil.email && user.user_type === perfil.tipo);
  },

  isAssinante(userId) { return localStorage.getItem('hermes_plano_' + userId) === 'ativo'; },
  setAssinante(userId, ativo) {
    if (ativo) localStorage.setItem('hermes_plano_' + userId, 'ativo');
    else localStorage.removeItem('hermes_plano_' + userId);
  },
  limitesMotorista(userId) { return this.isAssinante(userId) ? [3, 5, 10, 20] : [3, 4, 5]; },
  getFavoritas(userId) { return this._get('favoritas_' + userId); },
  toggleFavorita(userId, oficinaId) {
    if (!this.isAssinante(userId) || !this.getOficinaProfile(oficinaId)) return;
    const favoritas = this.getFavoritas(userId);
    this._set('favoritas_' + userId, favoritas.includes(oficinaId)
      ? favoritas.filter(id => id !== oficinaId) : [...favoritas, oficinaId]);
  },

  // ---- USERS ----
  async passwordHash(password, salt) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: Uint8Array.from(atob(salt), char => char.charCodeAt(0)), iterations: 600000, hash: 'SHA-256' }, key, 256);
    return btoa(String.fromCharCode(...new Uint8Array(bits)));
  },

  async createUser(email, password, userType) {
    email = email.trim().toLowerCase();
    if (Object.values(this.demoPerfis).some(perfil => perfil.email === email)) return { error: 'Este endereço é reservado para a demonstração.' };
    const salt = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
    const hash = await this.passwordHash(password, salt);
    const users = this._get('users');
    if (users.some(u => u.email.toLowerCase() === email)) return { error: 'E-mail já cadastrado.' };
    const user = { id: this._id(), email, salt, hash, user_type: userType, created_at: this._now() };
    users.push(user);
    this._set('users', users);
    return { user };
  },
  async findUser(email, password) {
    const user = this._get('users').find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || this.isDemo(user)) return null;
    if (user.hash) return await this.passwordHash(password, user.salt) === user.hash ? user : null;
    if (user.password !== password) return null;
    const salt = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
    const hash = await this.passwordHash(password, salt);
    const users = this._get('users').map(u => {
      if (u.id !== user.id) return u;
      const { password: _legacy, ...profile } = u;
      return { ...profile, salt, hash };
    });
    this._set('users', users);
    return user;
  },

  // ---- MOTORISTA PROFILES ----
  saveMotoristaProfile(userId, data) {
    const profiles = this._get('motorista_profiles').filter(p => p.user_id !== userId);
    const profile = { id: this._id(), user_id: userId, created_at: this._now(), ...data };
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
    const profile = { id: this._id(), user_id: userId, created_at: this._now(), ...data };
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

  getDraft(userId) {
    try { return JSON.parse(localStorage.getItem('hermes_triagem_' + userId)); }
    catch { return null; }
  },
  saveDraft(userId, draft) {
    localStorage.setItem('hermes_triagem_' + userId, JSON.stringify(draft));
  },
  clearDraft(userId) { localStorage.removeItem('hermes_triagem_' + userId); },

  publicarChamado(userId, draft, resumo, perguntas) {
    const veiculo = this.getVeiculoById(draft.veiculoId);
    if (veiculo?.motorista_id !== userId || !this.limitesMotorista(userId).includes(draft.limiteOficinas)) return null;
    const chamados = this._get('chamados');
    const existing = chamados.find(c => c.id === draft.id && c.motorista_id === userId);
    if (existing) return existing;
    const now = this._now();
    const chamado = {
      id: draft.id, motorista_id: userId, veiculo_id: draft.veiculoId,
      categoria: draft.categoria, resumo_triagem: resumo, resumo_ia: draft.resumoIA || '',
      diagnostico_ia: [resumo.relato, resumo.inspecao, draft.resumoIA].filter(Boolean).join('\n\n'),
      perguntas, limite_oficinas: draft.limiteOficinas, status: 'aguardando', created_at: now, enviado_em: now
    };
    chamados.push(chamado);
    this._set('chamados', chamados);
    return chamado;
  },

  // ---- CHAMADOS ----
  comStatusAtual(chamado, atendimentos) {
    const quantidade = atendimentos.length;
    const limite = chamado.limite_oficinas ?? Math.max(3, quantidade);
    let status = chamado.status;
    if (quantidade) status = atendimentos.every(at => at.status === 'concluido') ? 'concluido' : 'em_atendimento';
    else if (chamado.aceites_encerrados) status = 'encerrado';
    const vagas = Math.max(0, limite - quantidade);
    const recebe = ['aguardando', 'em_atendimento'].includes(status) && !chamado.aceites_encerrados && vagas > 0;
    return { ...chamado, status, limite_oficinas: limite, total_oficinas: quantidade, vagas_restantes: vagas, recebe_oficinas: recebe };
  },
  getChamadoById(id) {
    const chamado = this._get('chamados').find(c => c.id === id) || null;
    return chamado ? this.comStatusAtual(chamado, this.getConversasByChamado(id)) : null;
  },
  getChamadosAbertos(oficinaId) {
    const atendimentos = this._get('atendimentos');
    const jaParticipa = new Set(atendimentos.filter(a => a.oficina_id === oficinaId && a.status !== 'recusado').map(a => a.chamado_id));
    return this._get('chamados').map(c => this.comStatusAtual(c, atendimentos.filter(a => a.chamado_id === c.id && this.atendimentoConfirmado(a))))
      .filter(c => c.recebe_oficinas && !jaParticipa.has(c.id))
      .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  },
  getChamadosByMotorista(motoristaId) {
    const atendimentos = this._get('atendimentos').filter(a => this.atendimentoConfirmado(a));
    return this._get('chamados').filter(c => c.motorista_id === motoristaId)
      .map(c => this.comStatusAtual(c, atendimentos.filter(a => a.chamado_id === c.id))).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  },
  fecharAceites(chamadoId, motoristaId) {
    const chamados = this._get('chamados');
    const chamado = chamados.find(c => c.id === chamadoId && c.motorista_id === motoristaId);
    if (!chamado || !this.comStatusAtual(chamado, this.getConversasByChamado(chamadoId)).recebe_oficinas) return false;
    chamado.aceites_encerrados = true;
    this._set('chamados', chamados);
    return true;
  },

  // ---- DIAGNOSTICO PERGUNTAS ----
  getPerguntasByChamado(chamadoId) {
    const chamado = this.getChamadoById(chamadoId);
    return chamado?.perguntas || this._get('diagnostico_perguntas')
      .filter(p => p.chamado_id === chamadoId && p.resposta?.trim()).sort((a,b) => a.ordem - b.ordem);
  },

  // ---- ATENDIMENTOS ----
  atendimentoConfirmado(atendimento) {
    return ['aceito', 'aguardando_conclusao', 'concluido'].includes(atendimento?.status);
  },
  prioridadeAte(chamado, oficinaId) {
    const fim = Date.parse(chamado.enviado_em || chamado.created_at) + 120000;
    if (!chamado.recebe_oficinas || !(fim > Date.now()) || this.isAssinante(oficinaId)) return null;
    const participantes = new Set(this.getConversasByChamado(chamado.id).map(a => a.oficina_id));
    return this.getAllOficinas().some(of => !participantes.has(of.user_id) && this.isAssinante(of.user_id)) ? fim : null;
  },
  aceitarChamado(chamadoId, oficinaId) {
    const chamado = this.getChamadoById(chamadoId);
    if (!chamado?.recebe_oficinas || !this.getOficinaProfile(oficinaId) || this.prioridadeAte(chamado, oficinaId)) return null;
    const atendimentos = this._get('atendimentos');
    if (atendimentos.some(a => a.chamado_id === chamadoId && a.oficina_id === oficinaId && a.status !== 'recusado')) return null;
    const atendimento = { id: this._id(), chamado_id: chamadoId, oficina_id: oficinaId, status: 'aceito', iniciado_em: this._now(), concluido_em: null };
    atendimentos.push(atendimento);
    this._set('atendimentos', atendimentos);
    return atendimento;
  },
  getConversasByChamado(chamadoId) {
    return this._get('atendimentos').filter(a => a.chamado_id === chamadoId && this.atendimentoConfirmado(a));
  },
  getParticipacaoOficina(chamadoId, oficinaId) {
    return this._get('atendimentos').find(a => a.chamado_id === chamadoId && a.oficina_id === oficinaId && a.status !== 'recusado') || null;
  },
  migrarInteresses() {
    const atendimentos = this._get('atendimentos');
    const propostas = atendimentos.filter(a => a.status === 'proposta');
    if (!propostas.length) return;
    const abertos = new Set(this._get('chamados').filter(c => c.status === 'aguardando').map(c => c.id));
    propostas.forEach(a => {
      a.status = abertos.has(a.chamado_id) ? 'aceito' : 'nao_selecionado';
      a.iniciado_em = a.proposto_em || this._now();
    });
    this._set('atendimentos', atendimentos);
  },
  getAtendimentosByOficina(oficinaId) {
    return this._get('atendimentos').filter(a => a.oficina_id === oficinaId)
      .sort((a,b) => new Date(b.iniciado_em || b.proposto_em) - new Date(a.iniciado_em || a.proposto_em));
  },
  getAtendimentosByMotorista(motoristaId) {
    const chamados = this.getChamadosByMotorista(motoristaId);
    const ids = new Set(chamados.map(c => c.id));
    return this._get('atendimentos').filter(a => ids.has(a.chamado_id) && this.atendimentoConfirmado(a))
      .sort((a,b) => new Date(b.iniciado_em) - new Date(a.iniciado_em));
  },
  solicitarConclusao(id) {
    const atendimentos = this._get('atendimentos');
    const idx = atendimentos.findIndex(a => a.id === id);
    if (idx >= 0 && atendimentos[idx].status === 'aceito') {
      atendimentos[idx].status = 'aguardando_conclusao';
      this._set('atendimentos', atendimentos);
      return true;
    }
    return false;
  },
  concludeAtendimento(id) {
    const atendimentos = this._get('atendimentos');
    const idx = atendimentos.findIndex(a => a.id === id);
    if (idx >= 0 && atendimentos[idx].status === 'aguardando_conclusao') {
      atendimentos[idx].status = 'concluido';
      atendimentos[idx].concluido_em = this._now();
      this._set('atendimentos', atendimentos);
      return true;
    }
    return false;
  },
  getAtendimentoById(id) { return this._get('atendimentos').find(a => a.id === id) || null; },
  
  // ---- AVALIACOES ----
  saveAvaliacao(atendimentoId, oficinaId, motoristaId, notas, comentario) {
    const avs = this._get('avaliacoes');
    const existing = avs.find(a => a.atendimento_id === atendimentoId);
    if (existing) return existing;
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
  addNotif(userId, titulo, texto, destino = null) {
    const notifs = this._get('notifs');
    notifs.unshift({ id: this._id(), user_id: userId, titulo, texto, destino, lida: false, created_at: this._now() });
    try { this._set('notifs', notifs); }
    catch (error) {
      if (error.name !== 'QuotaExceededError') throw error;
    }
  },
  getNotifsByUser(userId) { return this._get('notifs').filter(n => n.user_id === userId); },
  markAllRead(userId) {
    const notifs = this._get('notifs').map(n => n.user_id === userId ? { ...n, lida: true } : n);
    this._set('notifs', notifs);
  },

  // ---- STATS OFICINA ----
  getStatsOficina(oficinaId) {
    const ats = this.getAtendimentosByOficina(oficinaId);
    const concluidos = ats.filter(a => a.status === 'concluido').length;
    const emAndamento = ats.filter(a => ['aceito', 'aguardando_conclusao'].includes(a.status)).length;
    const reviews = this.getAvaliacoesPublicas(oficinaId);
    const avaliacao = reviews.length ? (reviews.reduce((sum, a) => sum + a.media, 0) / reviews.length).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : null;
    return { concluidos, emAndamento, avaliacao };
  },

  // ---- DEMO MODE ----
  setupDemoData(type) {
    if (!Object.hasOwn(this.demoPerfis, type)) return;
    const user = this.getDemoUser(type);
    Object.keys(this.demoPerfis).filter(key => key !== type).forEach(key => this.getDemoUser(key));
    this.setSession(user);
  },

  getDemoUser(type) {
    const { email, tipo, nome } = this.demoPerfis[type];
    const users = this._get('users');
    let user = users.find(u => u.email === email && u.user_type === tipo);
    
    if (!user) {
      user = { id: this._id(), email, user_type: tipo, created_at: this._now() };
      this._set('users', [...users, user]);
      
      if (tipo === 'motorista') {
        this.saveMotoristaProfile(user.id, { nome: 'Rafael Lima', telefone: '(11) 98888-8888', foto_url: '' });
        this.saveVeiculo(user.id, { marca: 'Honda', modelo: 'Civic', ano: '2021', placa: 'ABC-1234', cor: 'Prata' });
        this.saveVeiculo(user.id, { marca: 'Fiat', modelo: 'Toro', ano: '2023', placa: 'XYZ-9876', cor: 'Branca' });
        const v = this.getVeiculosByMotorista(user.id)[0];
        const draft = { id: this._id(), veiculoId: v.id, limiteOficinas: 3, categoria: 'freios', respostas: ['Chiado ou rangido', 'Há alguns dias', 'Às vezes', 'O ruído aparece principalmente em baixa velocidade.'] };
        this.publicarChamado(user.id, draft, Triagem.resumo(draft), Triagem.perguntas(draft.categoria).map((p, i) => ({ pergunta: p.texto, resposta: draft.respostas[i] })));
      } else {
        const central = type === 'central';
        const sobre = { oficina: 'Mecânica geral e manutenção preventiva.', central: 'Diagnóstico elétrico, suspensão e revisão de freios.', horizonte: 'Revisão, arrefecimento e diagnóstico de motor.' };
        this.saveOficinaProfile(user.id, { nome_oficina: nome, cnpj: '00.000.000/0000-00', sobre: sobre[type], foto_url: '' });
        // Adiciona uma avaliação fictícia para enriquecer o perfil
        const m = { id: 'mock_mot_1', user_id: 'mock_mot_1', nome: 'Carlos (Cliente Satisfeito)', created_at: this._now() };
        let profs = this._get('motorista_profiles');
        if (!profs.find(p => p.id === 'mock_mot_1')) {
          profs.push(m);
          this._set('motorista_profiles', profs);
        }
        this.saveAvaliacao({ oficina: 'mock_at_1', central: 'mock_at_2', horizonte: 'mock_at_3' }[type], user.id, m.id,
          { transparencia: 5, prazo: central ? 4 : 5, qualidade: central ? 5 : 4, organizacao: 5 },
          central ? 'Explicaram os serviços e os valores com clareza.' : 'Ótimo atendimento! Muito ágeis.');
      }
    }
    
    return user;
  }
};
