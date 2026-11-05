Object.assign(App, {
  bindChatIA() {
    const session = DB.getSession();
    const veiculos = DB.getVeiculosByMotorista(session.id);
    let draft = DB.getDraft(session.id);
    if (draft && (DB.getChamadoById(draft.id) || !veiculos.some(v => v.id === draft.veiculoId))) {
      DB.clearDraft(session.id);
      draft = null;
    }
    const limites = DB.limitesMotorista(session.id);
    const limiteValido = limites.includes(draft?.limiteOficinas);
    this.render(Screens.chatIA(draft, veiculos, limites));
    const update = (changes) => {
      DB.saveDraft(session.id, { ...draft, ...changes });
      this.bindChatIA();
      const heading = document.querySelector('.flow-panel h2');
      heading.tabIndex = -1;
      heading.focus();
    };
    document.querySelectorAll('[data-veiculo]').forEach(btn => {
      btn.onclick = () => update({ id: DB._id(), veiculoId: btn.dataset.veiculo, limiteOficinas: null, categoria: '', etapa: 1, indice: 0, respostas: [], resumoIA: '' });
    });
    document.querySelectorAll('[data-limite-oficinas]').forEach(btn => {
      btn.onclick = () => update({ limiteOficinas: Number(btn.dataset.limiteOficinas) });
    });
    document.querySelectorAll('[data-categoria]').forEach(btn => {
      btn.onclick = () => {
        const categoria = btn.dataset.categoria;
        update({ categoria, etapa: 2, indice: 0, respostas: categoria === draft.categoria ? draft.respostas : [], resumoIA: '' });
      };
    });
    const answer = (value) => {
      const resposta = value.trim();
      if (!resposta) return this.toast('Escreva uma resposta para continuar.', 'error');
      const respostas = [...draft.respostas];
      respostas[draft.indice] = resposta;
      const last = draft.indice === Triagem.perguntas(draft.categoria).length - 1;
      update({ respostas, indice: last ? draft.indice : draft.indice + 1, etapa: last ? 3 : 2, resumoIA: '' });
    };
    document.querySelectorAll('[data-resposta]').forEach(btn => {
      btn.onclick = () => answer(btn.dataset.resposta);
    });
    const form = document.getElementById('triagem-resposta');
    if (form) {
      const campo = document.getElementById('resposta-livre');
      campo.oninput = () => {
        const respostas = [...draft.respostas];
        respostas[draft.indice] = campo.value;
        draft = { ...draft, respostas, resumoIA: '' };
        DB.saveDraft(session.id, draft);
      };
      form.onsubmit = (event) => {
        event.preventDefault();
        answer(campo.value);
      };
    }
    const back = document.getElementById('btn-voltar-triagem');
    if (back) back.onclick = () => {
      if (!limiteValido) {
        DB.clearDraft(session.id);
        this.bindChatIA();
      } else if (draft.etapa === 1) {
        update({ limiteOficinas: null });
      } else if (draft.indice === 0) {
        update({ etapa: 1 });
      } else {
        update({ indice: draft.indice - 1 });
      }
    };
    const discard = document.getElementById('btn-descartar-triagem');
    if (discard) discard.onclick = () => {
      if (!confirm('Descartar este rascunho de triagem?')) return;
      DB.clearDraft(session.id);
      this.bindChatIA();
    };
    const edit = document.getElementById('btn-editar-triagem');
    if (edit) edit.onclick = () => update({ etapa: 2, indice: 0 });
    const editLimit = document.getElementById('btn-editar-limite');
    if (editLimit) editLimit.onclick = () => update({ limiteOficinas: null });
    const send = document.getElementById('btn-enviar-chamado');
    if (!send) return;
    send.onclick = async () => {
      send.disabled = true;
      try {
        const salvo = DB.getDraft(session.id);
        if (salvo?.id !== draft.id || salvo.etapa !== 3) {
          this.toast('Confira a versão atual do rascunho.', 'info');
          if (send.isConnected) this.bindChatIA();
          return;
        }
        const chamado = await DB.mutate('publicar', salvo);
        DB.clearDraft(session.id);
        if (send.isConnected) {
          this.toast('Chamado enviado à fila de oficinas.', 'success');
          this.navigate('aguardando', chamado.id);
        }
      } catch (error) {
        if (send.isConnected) this.toast(error.message, 'error');
      } finally { send.disabled = false; }
    };
    this.bindGemini(draft, veiculos, update, send);
  },

  bindGemini(draft, veiculos, update, send) {
    const btn = document.getElementById('btn-resumir-ia');
    if (!btn) return;
    const remove = document.getElementById('btn-remover-ia');
    if (remove) remove.onclick = () => update({ resumoIA: '' });
    btn.onclick = async () => {
      const status = document.getElementById('gemini-status');
      const v = veiculos.find(veiculo => veiculo.id === draft.veiculoId);
      const perguntas = Triagem.perguntas(draft.categoria);
      const dados = [Screens.vehicleName(v), v.ano, ...perguntas.map((p, i) => `${p.texto} ${draft.respostas[i]}`)].join('\n');
      btn.disabled = send.disabled = true;
      if (remove) remove.disabled = true;
      status.textContent = 'Preparando complemento...';
      try {
        const response = await fetch('/api/resumo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dados }),
          signal: AbortSignal.timeout(18000)
        });
        const payload = response.ok && await response.json();
        if (typeof payload?.resumo !== 'string' || !payload.resumo.trim()) throw new Error();
        if (!btn.isConnected) return;
        const atual = DB.getDraft(DB.getSession().id);
        if (JSON.stringify(atual) !== JSON.stringify(draft)) {
          status.textContent = 'As respostas mudaram em outra aba. Confira o rascunho antes de tentar novamente.';
          return;
        }
        update({ resumoIA: payload.resumo });
      } catch {
        if (btn.isConnected) status.textContent = 'O Gemini está indisponível. Você pode enviar o resumo da triagem guiada.';
      } finally {
        btn.disabled = send.disabled = false;
        if (remove) remove.disabled = false;
      }
    };
  },

  bindAceitar() {
    const prioridade = document.getElementById('acesso-prioritario');
    if (prioridade) {
      const id = this.currentParam;
      this.priorityTimer = setTimeout(() => this.navigate('detalhe-oficina', id), Math.max(0, Number(prioridade.dataset.ate) - Date.now()) + 100);
    }
    const btn = document.querySelector('[data-action="aceitar"]');
    if (!btn) return;
    const session = DB.getSession();
    btn.onclick = () => this.runButton(btn, async () => {
      const chamadoId = btn.dataset.chamado;
      try {
        const atendimento = await DB.mutate('aceitar', { chamadoId });
        if (this.currentScreen !== 'detalhe-oficina' || this.currentParam !== chamadoId || DB.getSession()?.id !== session.id) return;
        this.toast('Chamado aceito. A conversa está disponível.', 'success');
        this.navigate('chat-oficina', atendimento.id);
      } catch (error) {
        if (error.status === 409) {
          await DB.refresh();
          if (this.currentScreen === 'detalhe-oficina') this.navigate('detalhe-oficina', chamadoId);
        }
        throw error;
      }
    });
  },

  bindAcompanhamento(chamadoId) {
    document.querySelectorAll('[data-oficina-favorita]').forEach(btn => {
      btn.onclick = () => this.runButton(btn, async () => {
        const oficinaId = btn.dataset.oficinaFavorita;
        const salvar = btn.getAttribute('aria-pressed') !== 'true';
        await DB.mutate('favorita', { oficinaId, salvar });
        btn.setAttribute('aria-pressed', String(salvar));
        btn.textContent = salvar ? '★ Favorita' : '☆ Favoritar';
      });
    });
    const btn = document.getElementById('fechar-aceites');
    if (btn) btn.onclick = () => {
      if (!confirm('Fechar as vagas deste chamado? As conversas abertas continuam disponíveis.')) return;
      this.runButton(btn, async () => {
        await DB.mutate('fechar-vagas', { chamadoId });
        this.toast('Vagas fechadas. Suas conversas continuam disponíveis.', 'success');
        this.navigate('aguardando', chamadoId);
      });
    };
  },

  bindPlano() {
    const btn = document.getElementById('solicitar-plano');
    if (btn) btn.onclick = () => this.runButton(btn, async () => {
      await DB.mutate('solicitar-plano');
      this.navigate('planos');
      this.toast('Solicitação enviada.', 'success');
    });
  },

  bindPainelPro() {
    const controls = [...document.querySelectorAll('[data-periodo-painel]')];
    controls.forEach(btn => {
      btn.onclick = () => {
        controls.forEach(item => item.setAttribute('aria-pressed', String(item === btn)));
        document.getElementById('painel-pro-metricas').innerHTML = Screens.metricasPro(DB.getSession().id, Number(btn.dataset.periodoPainel));
      };
    });
  },

  bindChamados(group = 'novos', query = '') {
    const filters = [...document.querySelectorAll('[data-fila]')];
    const items = [...document.querySelectorAll('[data-grupo]')];
    const search = document.getElementById('busca-chamados');
    search.value = query;
    filters.forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.fila === group)));
    const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const update = () => {
      const group = filters.find(btn => btn.getAttribute('aria-pressed') === 'true').dataset.fila;
      const query = normalize(search.value.trim());
      items.forEach(item => {
        item.hidden = item.dataset.grupo !== group || !normalize(item.textContent).includes(query);
      });
      document.getElementById('fila-vazia').hidden = items.some(item => !item.hidden);
    };
    filters.forEach(btn => btn.onclick = () => {
      filters.forEach(item => item.setAttribute('aria-pressed', String(item === btn)));
      update();
    });
    search.oninput = update;
    update();
  },

  async syncServer() {
    if (document.hidden || !DB.getSession() || DB.writing || this.syncing) return;
    this.syncing = true;
    const before = DB.data;
    try {
      const after = await DB.refresh();
      if (before.session?.id !== after.session?.id) {
        this.history = [];
        this.currentScreen = null;
        this.boot();
        return;
      }
      const changed = key => JSON.stringify(before[key]) !== JSON.stringify(after[key]);
      const { currentScreen: screen, currentParam: param } = this;
      if (changed('notifs')) {
        this.refreshUnread();
        if (screen === 'notificacoes') this.navigate(screen, param);
      }
      const callChanges = ['chamados', 'atendimentos', 'procedimentos', 'oficina_profiles'].some(changed);
      const planChanged = changed('plano');
      if (screen === 'chat-oficina') {
        const latest = after.mensagens?.find(m => m.atendimento_id === param)?.seq;
        const loaded = DB.threads.get(param)?.messages.at(-1)?.seq;
        if (latest && latest !== loaded) await DB.loadChat(param, null, loaded);
        if (this.currentScreen === screen && this.currentParam === param) this.refreshConversation(param);
        return;
      }
      if (screen === 'chamados' && callChanges) {
        const search = document.getElementById('busca-chamados');
        const group = document.querySelector('[data-fila][aria-pressed="true"]').dataset.fila;
        document.querySelector('#screen-container .workshop-grid').innerHTML = Screens.queueCards(DB.getSession().id);
        this.bindChamados(group, search.value);
      } else if ((callChanges || planChanged || changed('anuncio')) && ['home', 'dashboard', 'aguardando', 'detalhe-oficina', 'planos'].includes(screen) ||
                 screen === 'chats' && (callChanges || changed('mensagens'))) {
        const y = window.scrollY;
        this.navigate(screen, param);
        if (this.currentScreen === screen) window.scrollTo(0, y);
      }
    } catch {
      // A próxima sincronização tenta novamente sem apagar dados já carregados.
    } finally { this.syncing = false; }
  },

  refreshConversation(id) {
    const session = DB.getSession();
    const msgs = document.getElementById('chat-oficina-messages');
    if (!msgs || !session) return;
    const wasAtBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 80;
    const existing = new Set([...msgs.querySelectorAll('[data-msg]')].map(el => el.dataset.msg));
    const fresh = DB.getMsgsByAtendimento(id).filter(msg => !existing.has(msg.id));
    if (fresh.length) {
      const first = Number(msgs.querySelector('[data-msg]')?.dataset.seq || 0);
      const old = fresh.filter(msg => msg.seq < first);
      const newer = fresh.filter(msg => msg.seq >= first);
      msgs.querySelector('.empty-panel')?.remove();
      const height = msgs.scrollHeight;
      if (old.length) {
        msgs.insertAdjacentHTML('afterbegin', old.map(msg => Screens.chatBubble(msg, session.id)).join(''));
        msgs.scrollTop += msgs.scrollHeight - height;
      }
      if (newer.length) msgs.insertAdjacentHTML('beforeend', newer.map(msg => Screens.chatBubble(msg, session.id)).join(''));
      if (wasAtBottom || newer.some(msg => msg.remetente_id === session.id)) msgs.scrollTop = msgs.scrollHeight;
    }
    const older = document.getElementById('mensagens-anteriores');
    if (older) older.hidden = !DB.threads.get(id)?.more;
    const at = DB.getAtendimentoById(id);
    if (!at) return this.goHome();
    const state = document.getElementById('conversation-state');
    if (state.dataset.status !== at.status) {
      state.dataset.status = at.status;
      state.innerHTML = Screens.chatActions(at, session.user_type);
      document.getElementById('composer').hidden = at.status === 'concluido';
    }
    const services = document.getElementById('chat-procedures');
    const procs = DB.getProcedimentosByAtendimento(id);
    services.innerHTML = procs.length ? `<h3>Procedimentos</h3>${Screens.procedures(procs)}` : '';
  },

  bindChatOficina(id) {
    const session = DB.getSession();
    const msgs = document.getElementById('chat-oficina-messages');
    const form = document.getElementById('composer');
    const input = document.getElementById('chat-oficina-input');
    document.querySelectorAll('[data-resposta-rapida]').forEach(btn => {
      btn.onclick = () => {
        if (!DB.isAssinante(session.id)) return;
        const resposta = btn.dataset.respostaRapida;
        if (input.value.length + resposta.length + 1 > input.maxLength) return;
        input.value += (input.value ? '\n' : '') + resposta;
        input.focus();
      };
    });
    const file = document.getElementById('chat-foto-input');
    const preview = document.getElementById('chat-foto-preview');
    const attachment = document.getElementById('chat-attachment');
    const send = document.getElementById('chat-oficina-send');
    const attach = document.getElementById('btn-chat-foto');
    const previous = document.getElementById('mensagens-anteriores');
    let pending = null;
    previous.onclick = () => this.runButton(previous, async () => {
      await DB.loadChat(id, DB.getMsgsByAtendimento(id)[0]?.seq);
      if (previous.isConnected) this.refreshConversation(id);
    });
    DB.threads.delete(id);
    DB.loadChat(id).then(() => {
      if (form.isConnected) {
        this.refreshConversation(id);
        msgs.scrollTop = msgs.scrollHeight;
      }
    }).catch(error => { if (form.isConnected) this.toast(error.message, 'error'); });
    let reading = false;
    let photo = '';
    const resetPhoto = () => {
      photo = '';
      file.value = '';
      preview.removeAttribute('src');
      attachment.hidden = true;
    };
    this.refreshConversation(id);
    msgs.scrollTop = msgs.scrollHeight;
    document.getElementById('btn-remove-foto').onclick = resetPhoto;
    attach.onclick = () => file.click();
    file.onchange = async () => {
      const selected = file.files[0];
      if (!selected) return;
      resetPhoto();
      reading = true;
      send.disabled = attach.disabled = true;
      try {
        photo = await this.readPhoto(selected);
        preview.src = photo;
        attachment.hidden = false;
      } catch (error) {
        this.toast(error.message, 'error');
      } finally {
        reading = false;
        send.disabled = attach.disabled = false;
      }
    };
    input.onkeydown = event => {
      if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
      event.preventDefault();
      form.requestSubmit();
    };
    form.onsubmit = async event => {
      event.preventDefault();
      const text = input.value.trim();
      if ((!text && !photo) || reading || send.disabled) return;
      send.disabled = attach.disabled = input.disabled = true;
      try {
        if (!pending || pending.conteudo !== text || pending.foto !== photo) pending = { id: DB._id(), conteudo: text, foto: photo };
        await DB.mutate('mensagem', { atendimentoId: id, ...pending });
        pending = null;
        if (!form.isConnected) return;
        input.value = '';
        resetPhoto();
        await DB.loadChat(id, null, DB.getMsgsByAtendimento(id).at(-1)?.seq);
        if (form.isConnected) this.refreshConversation(id);
      } catch (error) {
        this.toast(error.message, 'error');
      } finally {
        send.disabled = attach.disabled = input.disabled = false;
        if (form.isConnected && !form.hidden) input.focus();
      }
    };
  },

  async readPhoto(file) {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type) || file.size > 2 * 1024 * 1024) {
      throw new Error('Selecione uma imagem JPG, PNG, WebP ou GIF de até 2 MB.');
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      reader.readAsDataURL(file);
    });
  }
});

setInterval(() => App.syncServer(), 4000);
