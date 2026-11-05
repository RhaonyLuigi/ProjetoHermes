const DB = {
  data: { session: null },
  threads: new Map(),
  revision: 0,
  writing: 0,

  _get(key) { return this.data[key] || []; },
  _id() { return crypto.randomUUID(); },
  getSession() { return this.data.session; },
  isAssinante(userId) { return this.data.session?.id === userId && this.data.plano?.ativo === true; },
  limitesMotorista(userId) { return this.isAssinante(userId) ? [3, 5, 10, 20] : [3, 4, 5]; },
  getFavoritas() { return this._get('favoritas'); },

  async request(path, data) {
    let response;
    try {
      response = await fetch(path, {
        cache: 'no-store',
        signal: AbortSignal.timeout(20000),
        ...(data === undefined ? {} : {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        })
      });
    } catch {
      throw new Error('Não foi possível conectar ao servidor do Hermes.');
    }
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      const error = new Error(payload?.error || 'Servidor do Hermes indisponível.');
      error.status = response.status;
      throw error;
    }
    return payload;
  },

  setSnapshot(snapshot) {
    if (this.data.session?.id !== snapshot.session?.id) this.threads.clear();
    this.data = snapshot;
  },

  async refresh() {
    const order = ++this.revision;
    const snapshot = await this.request('/api/estado');
    if (order === this.revision && !this.writing) this.setSnapshot(snapshot);
    return this.data;
  },

  async mutate(action, input = {}) {
    this.revision++;
    this.writing++;
    try {
      const result = await this.request('/api/acoes/' + action, input);
      this.setSnapshot(result.state);
      return result.result;
    } finally {
      this.revision++;
      this.writing--;
    }
  },

  async authenticate(path, data) {
    await this.request(path, data);
    await this.refresh();
    return this.getSession();
  },
  async clearSession() {
    const user = this.getSession();
    await this.request('/api/sair', {});
    if (user) this.clearDraft(user.id);
    this.setSnapshot({ session: null });
    this.revision++;
  },

  getMotoristaProfile(userId) { return this._get('motorista_profiles').find(p => p.user_id === userId) || null; },
  getOficinaProfile(userId) { return this._get('oficina_profiles').find(p => p.user_id === userId) || null; },
  getVeiculosByMotorista(userId) { return this._get('veiculos').filter(v => v.motorista_id === userId); },
  getVeiculoById(id) { return this._get('veiculos').find(v => v.id === id) || null; },

  getDraft(userId) {
    try { return JSON.parse(sessionStorage.getItem('hermes_ativo_triagem_' + userId)); }
    catch { return null; }
  },
  saveDraft(userId, draft) { sessionStorage.setItem('hermes_ativo_triagem_' + userId, JSON.stringify(draft)); },
  clearDraft(userId) { sessionStorage.removeItem('hermes_ativo_triagem_' + userId); },

  getChamadoById(id) { return this._get('chamados').find(c => c.id === id) || null; },
  getChamadosByMotorista(id) { return this._get('chamados').filter(c => c.motorista_id === id); },
  getChamadosAbertos(oficinaId) {
    const own = new Set(this.getAtendimentosByOficina(oficinaId).map(a => a.chamado_id));
    return this._get('chamados').filter(c => c.recebe_oficinas && !own.has(c.id));
  },
  getPerguntasByChamado(id) { return this.getChamadoById(id)?.perguntas || []; },
  prioridadeAte(chamado) { return chamado.prioridade_ate > Date.now() ? chamado.prioridade_ate : null; },
  getAtendimentoById(id) { return this._get('atendimentos').find(a => a.id === id) || null; },
  getConversasByChamado(id) { return this._get('atendimentos').filter(a => a.chamado_id === id); },
  getParticipacaoOficina(chamadoId, oficinaId) {
    return this._get('atendimentos').find(a => a.chamado_id === chamadoId && a.oficina_id === oficinaId) || null;
  },
  getAtendimentosByOficina(id) { return this._get('atendimentos').filter(a => a.oficina_id === id); },
  getAtendimentosByMotorista(id) { return this._get('atendimentos').filter(a => this.getChamadoById(a.chamado_id)?.motorista_id === id); },
  atendimentoConfirmado(at) { return ['aceito', 'aguardando_conclusao', 'concluido'].includes(at?.status); },

  async loadChat(id, before, after) {
    const user = this.getSession()?.id;
    const path = '/api/conversas/' + encodeURIComponent(id);
    let next = this.threads.has(id) ? after : null;
    do {
      const cursor = before ? '?antes=' + before : next ? '?depois=' + next : '';
      const payload = await this.request(path + cursor);
      if (this.getSession()?.id !== user) return;
      const existing = this.threads.get(id);
      const messages = new Map((existing?.messages || []).map(m => [m.seq, m]));
      payload.messages.forEach(m => messages.set(m.seq, m));
      this.threads.set(id, {
        messages: [...messages.values()].sort((a, b) => a.seq - b.seq),
        more: next ? existing?.more ?? false : payload.more
      });
      next = next && payload.more ? payload.messages.at(-1)?.seq : null;
    } while (next);
  },
  getMsgsByAtendimento(id) { return this.threads.get(id)?.messages || this._get('mensagens').filter(m => m.atendimento_id === id); },
  getProcedimentosByAtendimento(id) { return this._get('procedimentos').filter(p => p.atendimento_id === id); },

  getAvaliacoesPublicas(id) { return this._get('avaliacoes').filter(a => a.oficina_id === id && !a.revisao_solicitada); },
  getAvaliacoesComRevisao() { return this._get('avaliacoes').filter(a => a.revisao_solicitada); },
  getAvaliacaoById(id) { return this._get('avaliacoes').find(a => a.id === id) || null; },
  getNotifsByUser(id) { return this._get('notifs').filter(n => n.user_id === id); },
  getStatsOficina(id) {
    const atendimentos = this.getAtendimentosByOficina(id);
    const concluidos = atendimentos.filter(a => a.status === 'concluido').length;
    const avaliacoes = this.getAvaliacoesPublicas(id);
    const media = avaliacoes.length ? avaliacoes.reduce((total, a) => total + a.media, 0) / avaliacoes.length : null;
    return { concluidos, emAndamento: atendimentos.length - concluidos, avaliacao: media?.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) };
  }
};
