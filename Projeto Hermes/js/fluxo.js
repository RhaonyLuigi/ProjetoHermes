Object.assign(App, {
  bindChatIA() {
    const session = DB.getSession();
    const veiculos = DB.getVeiculosByMotorista(session.id);
    let draft = DB.getDraft(session.id);
    if (draft && (DB.getChamadoById(draft.id) || !veiculos.some(v => v.id === draft.veiculoId))) {
      DB.clearDraft(session.id);
      draft = null;
    }
    this.render(Screens.chatIA(draft, veiculos));
    const update = (changes) => {
      DB.saveDraft(session.id, { ...draft, ...changes });
      this.bindChatIA();
      const heading = document.querySelector('.flow-panel h2');
      heading.tabIndex = -1;
      heading.focus();
    };
    document.querySelectorAll('[data-veiculo]').forEach(btn => {
      btn.onclick = () => update({ id: DB._id(), veiculoId: btn.dataset.veiculo, categoria: '', etapa: 1, indice: 0, respostas: [], resumoIA: '' });
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
      if (draft.etapa === 1) {
        DB.clearDraft(session.id);
        this.bindChatIA();
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
    const send = document.getElementById('btn-enviar-chamado');
    if (!send) return;
    send.onclick = async () => {
      send.disabled = true;
      try {
        const chamado = await this.withLocalWrite(() => {
          const salvo = DB.getDraft(session.id);
          if (salvo?.id !== draft.id || salvo.etapa !== 3) return null;
          const resumo = Triagem.resumo(salvo);
          const perguntas = Triagem.perguntas(salvo.categoria).map((p, i) => ({ pergunta: p.texto, resposta: salvo.respostas[i] }));
          const publicado = DB.publicarChamado(session.id, salvo, resumo, perguntas);
          if (!publicado) return null;
          DB.clearDraft(session.id);
          DB.getAllOficinas().forEach(of => DB.addNotif(of.user_id, 'Novo chamado disponível', 'Um motorista enviou um pré-diagnóstico para análise.', { screen: 'detalhe-oficina', id: publicado.id }));
          return publicado;
        });
        if (!chamado) {
          this.toast('O rascunho mudou em outra aba. Confira a versão atual.', 'info');
          if (send.isConnected) this.bindChatIA();
          return;
        }
        if (send.isConnected) {
          this.toast('Chamado enviado à fila de oficinas.', 'success');
          this.navigate('aguardando', chamado.id);
        }
      } catch {
        if (send.isConnected) {
          send.disabled = false;
          this.toast('Não foi possível salvar o chamado neste navegador.', 'error');
        }
      }
    };
    this.bindGemini(draft, veiculos, update, send);
  },

  withLocalWrite(operation) {
    return navigator.locks ? navigator.locks.request('hermes-write', operation) : Promise.resolve().then(operation);
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
    const btn = document.querySelector('[data-action="aceitar"]');
    if (!btn) return;
    const session = DB.getSession();
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        const chamadoId = btn.dataset.chamado;
        const proposta = await this.withLocalWrite(() => {
          const chamado = DB.getChamadoById(chamadoId);
          const interesse = DB.registrarInteresse(chamadoId, session.id);
          if (interesse) DB.addNotif(chamado.motorista_id, 'Uma oficina se ofereceu para atender', 'Veja o perfil da oficina e compare as opções do chamado.', { screen: 'aguardando', id: chamadoId });
          return interesse;
        });
        if (this.currentScreen !== 'detalhe-oficina' || this.currentParam !== chamadoId || DB.getSession()?.id !== session.id) return;
        if (proposta) this.toast('Interesse enviado ao motorista.', 'success');
        this.navigate('detalhe-oficina', chamadoId);
      } catch {
        btn.disabled = false;
        this.toast('Não foi possível enviar o interesse neste navegador.', 'error');
      }
    };
  },

  bindEscolherOficina(chamadoId) {
    const session = DB.getSession();
    const opcoes = [...document.querySelectorAll('[data-escolher-oficina]')];
    opcoes.forEach(btn => {
      btn.onclick = async () => {
        opcoes.forEach(opcao => { opcao.disabled = true; });
        try {
          const escolha = await this.withLocalWrite(() => {
            const resultado = DB.escolherOficina(chamadoId, btn.dataset.escolherOficina, session.id);
            if (!resultado) return null;
            const { atendimento, outras } = resultado;
            DB.addNotif(atendimento.oficina_id, 'O motorista escolheu sua oficina', 'Abra a conversa para combinar o atendimento.', { screen: 'chat-oficina', id: atendimento.id });
            outras.forEach(proposta => {
              DB.addNotif(proposta.oficina_id, 'O motorista escolheu outra oficina', 'Você pode consultar o chamado em Interesses.', { screen: 'detalhe-oficina', id: chamadoId });
            });
            return atendimento;
          });
          if (this.currentScreen !== 'aguardando' || this.currentParam !== chamadoId || DB.getSession()?.id !== session.id) return;
          if (escolha) {
            this.toast('Oficina escolhida. A conversa está disponível.', 'success');
            this.navigate('chat-oficina', escolha.id);
          } else {
            this.toast('As opções do chamado foram atualizadas.', 'info');
            this.navigate('aguardando', chamadoId);
          }
        } catch {
          this.toast('Não foi possível salvar a escolha neste navegador.', 'error');
        } finally {
          opcoes.forEach(opcao => { opcao.disabled = false; });
        }
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

  syncStorage(event) {
    if (!event.key?.startsWith('hermes_') || !DB.getSession()) return;
    const { currentScreen, currentParam } = this;
    if (event.key === 'hermes_notifs') this.refreshUnread();
    if (currentScreen === 'chat-oficina' && ['hermes_mensagens', 'hermes_atendimentos', 'hermes_procedimentos'].includes(event.key)) {
      this.refreshConversation(currentParam);
    }
    if (['hermes_atendimentos', 'hermes_chamados', 'hermes_procedimentos'].includes(event.key) &&
        ['aguardando', 'detalhe-oficina', 'home', 'dashboard', 'chats'].includes(currentScreen)) this.navigate(currentScreen, currentParam);
    if (['hermes_atendimentos', 'hermes_chamados'].includes(event.key) && currentScreen === 'chamados') {
      const search = document.getElementById('busca-chamados');
      const group = document.querySelector('[data-fila][aria-pressed="true"]').dataset.fila;
      document.querySelector('#screen-container .workshop-grid').innerHTML = Screens.queueCards(DB.getSession().id);
      this.bindChamados(group, search.value);
    }
  },

  refreshConversation(id) {
    const session = DB.getSession();
    const msgs = document.getElementById('chat-oficina-messages');
    if (!msgs || !session) return;
    const wasAtBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 80;
    const existing = new Set([...msgs.querySelectorAll('[data-msg]')].map(el => el.dataset.msg));
    const fresh = DB.getMsgsByAtendimento(id).filter(msg => !existing.has(msg.id));
    if (fresh.length) {
      msgs.querySelector('.empty-panel')?.remove();
      msgs.insertAdjacentHTML('beforeend', fresh.map(msg => Screens.chatBubble(msg, session.id)).join(''));
      if (wasAtBottom || fresh.some(msg => msg.remetente_id === session.id)) msgs.scrollTop = msgs.scrollHeight;
    }
    const at = DB.getAtendimentoById(id);
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
    const file = document.getElementById('chat-foto-input');
    const preview = document.getElementById('chat-foto-preview');
    const attachment = document.getElementById('chat-attachment');
    const send = document.getElementById('chat-oficina-send');
    const attach = document.getElementById('btn-chat-foto');
    const at = DB.getAtendimentoById(id);
    const c = DB.getChamadoById(at.chamado_id);
    const destinatario = session.user_type === 'oficina' ? c.motorista_id : at.oficina_id;
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
        const sent = await this.withLocalWrite(() => {
          const atual = DB.getAtendimentoById(id);
          if (!DB.atendimentoConfirmado(atual) || atual.status === 'concluido') return false;
          DB.saveMsg(id, session.id, session.user_type, text, photo);
          DB.addNotif(destinatario, 'Nova mensagem na conversa', text.slice(0, 100) || 'Você recebeu uma foto.', { screen: 'chat-oficina', id });
          return true;
        });
        if (!form.isConnected) return;
        if (sent) {
          input.value = '';
          resetPhoto();
        } else this.toast('O atendimento foi concluído.', 'info');
        this.refreshConversation(id);
      } catch {
        this.toast('Falha ao salvar a mensagem. Confira o espaço disponível e tente novamente.', 'error');
      } finally {
        send.disabled = attach.disabled = input.disabled = false;
        if (form.isConnected && !form.hidden) input.focus();
      }
    };
  },

  async readPhoto(file) {
    if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type) || file.size > 2 * 1024 * 1024) {
      throw new Error('Selecione uma imagem JPG, PNG, WebP, GIF ou AVIF de até 2 MB.');
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      reader.readAsDataURL(file);
    });
  }
});

window.addEventListener('storage', event => App.syncStorage(event));
