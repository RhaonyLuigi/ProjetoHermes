/* ============================================================
   PROJETO HERMES — App Controller
   ============================================================ */

const App = {
  currentScreen: null,
  currentParam: null,
  history: [],

  // ---- TOAST ----
  toast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    document.getElementById('toast-container').appendChild(t);
    setTimeout(() => { t.style.animation = 'toastOut 0.3s ease forwards'; setTimeout(() => t.remove(), 300); }, 3000);
  },

  // ---- RENDER ----
  render(html) {
    const sc = document.getElementById('screen-container');
    sc.innerHTML = html;
    sc.scrollTop = 0;
    window.scrollTo(0, 0);
  },

  // ---- BOTTOM NAV ----
  showNav(type) {
    if (type === 'none') return this.hideNav();
    const nav = document.getElementById('bottom-nav');
    const common = [['chats', 'chat', 'Conversas'], ['notificacoes', 'bell', 'Avisos'], ['perfil', 'user', 'Perfil']];
    const menus = {
      motorista: [['home', 'home', 'Início'], ['chat-ia', 'spark', 'Triagem'], ['veiculos', 'car', 'Garagem'], ...common],
      oficina: [['dashboard', 'grid', 'Painel'], ['chamados', 'list', 'Chamados'], ...common],
      admin: [['admin-dashboard', 'shield', 'Revisões'], ['perfil', 'user', 'Perfil']]
    };
    const session = DB.getSession();
    const demo = DB.isDemo(session);
    const role = { motorista: 'Motorista', oficina: 'Oficina', admin: 'Moderação' }[type];
    nav.classList.remove('hidden');
    document.getElementById('app').classList.add('has-nav');
    const bar = document.getElementById('app-bar');
    bar.hidden = false;
    bar.innerHTML = `<div class="bar-brand">${Screens.brand()}</div><div class="bar-context"><span class="bar-role">${role}</span><span class="bar-divider"></span><span>Ambiente local</span></div>
      ${demo ? `<div class="bar-actions"><span class="demo-tag"><i></i> Demonstração</span>
        <details class="demo-switch"><summary class="switch-button">${Screens.icon('swap', 16)} Trocar perfil</summary>
          <div class="demo-options">${Object.entries(DB.demoPerfis).map(([key, perfil]) => `<button type="button" data-demo="${key}" ${perfil.email === session.email ? 'disabled' : ''} onclick="App.switchDemo('${key}')">${perfil.nome} ${perfil.email === session.email ? '<small>Perfil atual</small>' : ''}</button>`).join('')}</div>
        </details></div>` : ''}`;
    nav.innerHTML = `<div class="nav-brand">${Screens.brand()}<small>ASSISTÊNCIA AUTOMOTIVA</small></div>
      <div class="nav-label-group">${role.toUpperCase()}</div>
      <div class="nav-links">${menus[type].map(([screen, icon, label]) => `<button class="nav-item" data-screen="${screen}" onclick="App.navigate('${screen}')"><span class="nav-icon">${Screens.icon(icon, 18)}</span><span class="nav-label">${label}</span>${screen === 'notificacoes' ? '<span class="nav-dot" hidden></span>' : ''}</button>`).join('')}</div>
      <div class="nav-foot"><span class="local-indicator"></span><div><strong>${demo ? 'Modo demonstração' : 'Sessão local'}</strong><small>Dados neste navegador</small></div></div>`;
    this.refreshUnread();
    this.setActiveNav();
  },

  setActiveNav(screen) {
    const aliases = { aguardando: 'home', 'chat-oficina': 'chats', 'detalhe-oficina': 'chamados', procedimento: 'chats' };
    const s = screen || aliases[this.currentScreen] || this.currentScreen;
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.screen === s);
      if (btn.dataset.screen === s) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
  },

  hideNav() {
    document.getElementById('bottom-nav').classList.add('hidden');
    document.getElementById('app').classList.remove('has-nav');
    document.getElementById('app-bar').hidden = true;
  },

  refreshUnread() {
    const dot = document.querySelector('.nav-dot');
    const session = DB.getSession();
    if (dot && session) dot.hidden = !DB.getNotifsByUser(session.id).some(n => !n.lida);
  },

  switchDemo(type) {
    if (!DB.isDemo(DB.getSession())) return;
    DB.setupDemoData(type);
    this.history = [];
    this.currentScreen = null;
    this.boot();
  },

  // ---- NAVIGATE ----
  navigate(screen, param) {
    const session = DB.getSession();
    const publicScreens = ['login', 'register', 'forgot'];
    if (!session && !publicScreens.includes(screen)) return this.navigate('login');
    const role = session?.user_type;
    const motorista = ['home', 'chat-ia', 'aguardando', 'veiculos', 'veiculo-form', 'avaliar', 'checkin-motorista'];
    const oficina = ['dashboard', 'chamados', 'detalhe-oficina', 'procedimento', 'checkin-oficina'];
    if (motorista.includes(screen) && role !== 'motorista' || oficina.includes(screen) && role !== 'oficina' ||
        screen.startsWith('admin-') && role !== 'admin' || role === 'admin' && ['chats', 'notificacoes'].includes(screen)) return this.goHome();

    if (screen === 'aguardando' || screen === 'detalhe-oficina') {
      const chamado = DB.getChamadoById(param);
      const allowed = chamado && (role === 'motorista'
        ? chamado.motorista_id === session.id && chamado.status !== 'em_diagnostico'
        : chamado.status === 'aguardando' || DB.getParticipacaoOficina(param, session.id));
      if (!allowed) return this.goHome();
    }
    if (['chat-oficina', 'procedimento', 'avaliar'].includes(screen)) {
      const atendimento = DB.getAtendimentoById(param);
      const chamado = atendimento && DB.getChamadoById(atendimento.chamado_id);
      if (!chamado || !DB.atendimentoConfirmado(atendimento) || !(role === 'oficina' && atendimento.oficina_id === session.id ||
          role === 'motorista' && chamado.motorista_id === session.id)) return this.goHome();
      if (screen === 'procedimento' && atendimento.status !== 'aceito' ||
          screen === 'avaliar' && atendimento.status !== 'aguardando_conclusao') return this.navigate('chat-oficina', param);
    }
    if (screen === 'perfil-oficina' && !DB.getOficinaProfile(param) || screen === 'admin-revisao' && !DB.getAvaliacaoById(param)) return this.goHome();

    if (this.currentScreen && this.currentScreen !== screen) {
      this.history.push({ screen: this.currentScreen, param: this.currentParam });
    }
    this.currentScreen = screen;
    this.currentParam = param;
    switch (screen) {
      case 'login': this.hideNav(); this.render(Screens.login()); this.bindLogin(); break;
      case 'register': this.hideNav(); this.render(Screens.register()); this.bindRegister(); break;
      case 'forgot': this.hideNav(); this.render(Screens.forgotPassword()); this.bindForgot(); break;
      case 'checkin-motorista': this.hideNav(); this.render(Screens.checkinMotorista()); this.bindCheckinMotorista(); break;
      case 'checkin-oficina': this.hideNav(); this.render(Screens.checkinOficina()); this.bindCheckinOficina(); break;
      case 'veiculo-form': this.hideNav(); this.render(Screens.cadastrarVeiculo()); this.bindVeiculoForm(); break;
      case 'chat-ia': this.showNav('motorista'); this.bindChatIA(); break;
      case 'aguardando':
        this.showNav('motorista');
        this.render(Screens.detalheChamado(DB.getChamadoById(param), false));
        this.bindEscolherOficina(param);
        break;
      case 'detalhe-oficina':
        this.showNav('oficina');
        this.render(Screens.detalheChamado(DB.getChamadoById(param), true));
        this.bindAceitar();
        break;
      case 'chat-oficina':
        this.showNav(role);
        this.render(Screens.chatOficina(param));
        this.bindChatOficina(param);
        break;
      case 'veiculos': this.showNav('motorista'); this.render(Screens.meusVeiculos()); this.bindMeusVeiculos(); this.setActiveNav('veiculos'); break;
      case 'chats': { const t = session && session.user_type === 'oficina' ? 'oficina' : 'motorista'; this.showNav(t); this.render(Screens.chatsLista()); this.bindChatsLista(); this.setActiveNav('chats'); break; }
      case 'notificacoes': this.showNav(role); this.render(Screens.notificacoes()); DB.markAllRead(session.id); this.refreshUnread(); break;
      case 'dashboard': this.showNav('oficina'); this.render(Screens.dashboardOficina()); break;
      case 'chamados': this.showNav('oficina'); this.render(Screens.chamadosOficina()); this.bindChamados(); this.setActiveNav('chamados'); break;
      case 'procedimento': this.showNav('oficina'); this.render(Screens.registrarProcedimento(param)); this.bindProcedimento(param); break;
      case 'perfil': const t = session && session.user_type === 'oficina' ? 'oficina' : (session && session.user_type === 'admin' ? 'admin' : 'motorista'); this.showNav(t); this.render(Screens.perfil()); this.bindPerfil(); this.setActiveNav('perfil'); break;
      case 'home': this.showNav('motorista'); this.render(Screens.dashboardMotorista()); this.setActiveNav('home'); break;
      case 'avaliar': this.showNav('none'); this.render(Screens.avaliarOficina(param)); this.bindAvaliar(param); break;
      case 'perfil-oficina': this.showNav('none'); this.render(Screens.perfilOficinaPublico(param)); this.bindPerfilOficinaPublico(); document.getElementById('btn-back-perfil-oficina').onclick = () => this.goBack(); break;
      case 'admin-dashboard': this.showNav('admin'); this.render(Screens.adminDashboard()); this.bindAdminDashboard(); this.setActiveNav('admin-dashboard'); break;
      case 'admin-revisao': this.showNav('none'); this.render(Screens.adminRevisao(param)); this.bindAdminRevisao(param); break;
      default: this.navigate('login');
    }
  },

  goBack() {
    if (this.history.length > 0) {
      const prev = this.history.pop();
      this.currentScreen = null; 
      this.navigate(prev.screen, prev.param);
    } else {
      this.goHome();
    }
  },

  goHome() {
    const session = DB.getSession();
    if (!session) return this.navigate('login');
    if (session.user_type === 'oficina') return this.navigate('dashboard');
    if (session.user_type === 'admin') return this.navigate('admin-dashboard');
    this.navigate('home');
  },

  // ---- BOOT ----
  boot() {
    const session = DB.getSession();
    if (!session) return this.navigate('login');
    if (session.user_type === 'admin') return this.navigate('admin-dashboard');

    if (session.user_type === 'motorista') {
      const profile = DB.getMotoristaProfile(session.id);
      if (!profile) return this.navigate('checkin-motorista');
      this.goHome();
    } else {
      const profile = DB.getOficinaProfile(session.id);
      if (!profile) return this.navigate('checkin-oficina');
      this.navigate('dashboard');
    }
  },

  // ---- BIND: LOGIN ----
  bindLogin() {
    const form = document.getElementById('login-form');
    form.onsubmit = async event => {
      event.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const senha = document.getElementById('login-senha').value;
      const submit = document.getElementById('btn-entrar');
      submit.disabled = true;
      try {
        const user = await DB.findUser(email, senha);
        if (!form.isConnected) return;
        if (!user) return this.toast('E-mail ou senha incorretos.', 'error');
        DB.setSession(user);
        this.history = [];
        this.currentScreen = null;
        this.boot();
      } catch {
        this.toast('Use o servidor local para acessar sua conta.', 'error');
      } finally {
        submit.disabled = false;
      }
    };
    document.getElementById('link-forgot').onclick = () => this.navigate('forgot');
    document.getElementById('link-cadastro').onclick = () => this.navigate('register');
    document.getElementById('btn-demo-admin').onclick = () => {
      DB.setSession({ id: 'admin', user_type: 'admin', email: 'admin@hermes' });
      this.history = [];
      this.boot();
    };

    const btnDemoMot = document.getElementById('btn-demo-mot');
    if (btnDemoMot) btnDemoMot.onclick = () => {
      DB.setupDemoData('motorista');
      this.boot();
    };

    const btnDemoOfi = document.getElementById('btn-demo-ofi');
    if (btnDemoOfi) btnDemoOfi.onclick = () => {
      DB.setupDemoData('oficina');
      this.boot();
    };
  },

  // ---- BIND: REGISTER ----
  bindRegister() {
    // Track selected type via toggle
    let selectedType = 'motorista';
    const btnM = document.getElementById('reg-toggle-motorista');
    const btnO = document.getElementById('reg-toggle-oficina');
    if (btnM && btnO) {
      btnM.onclick = () => { selectedType = 'motorista'; btnM.classList.add('active'); btnO.classList.remove('active'); };
      btnO.onclick = () => { selectedType = 'oficina'; btnO.classList.add('active'); btnM.classList.remove('active'); };
    }
    const submit = document.getElementById('btn-criar');
    submit.onclick = async () => {
      const emailInput = document.getElementById('reg-email');
      const email = emailInput.value.trim();
      const senha = document.getElementById('reg-senha').value;
      const confirm = document.getElementById('reg-confirm').value;
      if (!email || !senha) return this.toast('Preencha todos os campos.', 'error');
      if (!emailInput.reportValidity()) return;
      if (senha !== confirm) return this.toast('As senhas não coincidem.', 'error');
      if (senha.length < 6) return this.toast('Senha deve ter ao menos 6 caracteres.', 'error');
      submit.disabled = true;
      try {
        const result = await DB.createUser(email, senha, selectedType);
        if (result.error) return this.toast(result.error, 'error');
        if (!submit.isConnected) return;
        DB.setSession(result.user);
        this.toast('Conta criada. Complete seu perfil.', 'success');
        this.boot();
      } catch {
        this.toast('Use o servidor local para criar sua conta.', 'error');
      } finally {
        submit.disabled = false;
      }
    };
    document.getElementById('link-login').onclick = () => this.navigate('login');
  },

  // ---- BIND: FORGOT ----
  bindForgot() {
    document.getElementById('btn-back-forgot').onclick = () => this.navigate('login');
  },

  // ---- BIND: CHECKIN MOTORISTA ----
  bindCheckinMotorista() {
    const circle = document.getElementById('avatar-motorista-circle');
    const input = document.getElementById('avatar-motorista-input');
    circle.onclick = () => input.click();
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        circle.innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
        circle.dataset.foto = ev.target.result;
      };
      reader.readAsDataURL(file);
    };
    document.getElementById('btn-salvar-motorista').onclick = () => {
      const session = DB.getSession();
      if (!session) return this.navigate('login');
      const nome = document.getElementById('motorista-nome').value.trim();
      const tel = document.getElementById('motorista-tel').value.trim();
      if (!nome || !tel) return this.toast('Preencha nome e telefone.', 'error');
      DB.saveMotoristaProfile(session.id, { nome, telefone: tel, foto_url: document.getElementById('avatar-motorista-circle').dataset.foto || '' });
      this.toast('Perfil salvo!', 'success');
      this.navigate('veiculo-form', 'home');
    };
  },

  // ---- BIND: CHECKIN OFICINA ----
  bindCheckinOficina() {
    const circle = document.getElementById('avatar-oficina-circle');
    const input = document.getElementById('avatar-oficina-input');
    circle.onclick = () => input.click();
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        circle.innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
        circle.dataset.foto = ev.target.result;
      };
      reader.readAsDataURL(file);
    };
    document.getElementById('btn-salvar-oficina').onclick = () => {
      const session = DB.getSession();
      if (!session) return this.navigate('login');
      const nome = document.getElementById('oficina-nome').value.trim();
      const cnpj = document.getElementById('oficina-cnpj').value.trim();
      const sobre = document.getElementById('oficina-sobre').value.trim();
      if (!nome || !cnpj) return this.toast('Preencha nome e CNPJ.', 'error');
      DB.saveOficinaProfile(session.id, { nome_oficina: nome, cnpj, sobre, foto_url: document.getElementById('avatar-oficina-circle').dataset.foto || '' });
      this.toast('Perfil da oficina salvo!', 'success');
      this.navigate('dashboard');
    };
  },

  // ---- BIND: VEICULO FORM ----
  bindVeiculoForm() {
    document.getElementById('btn-back-veiculo').onclick = () => this.goBack();
    document.getElementById('btn-salvar-veiculo').onclick = () => {
      const session = DB.getSession();
      if (!session) return this.navigate('login');
      const marca = document.getElementById('v-marca').value.trim();
      const modelo = document.getElementById('v-modelo').value.trim();
      const ano = document.getElementById('v-ano').value.trim();
      const placa = document.getElementById('v-placa').value.trim().toUpperCase();
      const cor = document.getElementById('v-cor').value.trim();
      if (!marca || !modelo || !ano || !placa) return this.toast('Preencha todos os campos obrigatórios.', 'error');
      if (!/^\d{4}$/.test(ano)) return this.toast('Informe o ano com quatro dígitos.', 'error');
      DB.saveVeiculo(session.id, { marca, modelo, ano, placa, cor });
      this.toast('Veículo cadastrado!', 'success');
      this.navigate(this.currentParam || 'veiculos');
    };
  },

  // ---- BIND: MEUS VEÍCULOS ----
  bindMeusVeiculos() {
    const btn = document.getElementById('btn-add-veiculo');
    if (btn) btn.onclick = () => this.navigate('veiculo-form');
  },

  // ---- BIND: CHATS LISTA ----
  bindChatsLista() {
    document.querySelectorAll('[data-action="abrir-chat"]').forEach(btn => {
      btn.onclick = () => this.navigate('chat-oficina', btn.dataset.atendimento);
    });
  },

  // ---- BIND: PROCEDIMENTO ----
  bindProcedimento(atendimentoId) {
    document.getElementById('btn-back-proc').onclick = () => this.navigate('chat-oficina', atendimentoId);

    const add = document.getElementById('btn-add-proc');
    const close = document.getElementById('btn-concluir-atendimento');
    add.onclick = async () => {
      const desc = document.getElementById('proc-desc').value.trim();
      const costInput = document.getElementById('proc-custo');
      if (!desc || !costInput.value || !costInput.checkValidity()) return this.toast('Informe uma descrição e um valor válido.', 'error');
      add.disabled = true;
      try {
        const saved = await this.withLocalWrite(() => {
          if (DB.getAtendimentoById(atendimentoId)?.status !== 'aceito') return false;
          DB.saveProcedimento(atendimentoId, desc, costInput.valueAsNumber.toFixed(2));
          return true;
        });
        if (!add.isConnected) return;
        if (!saved) return this.navigate('chat-oficina', atendimentoId);
        document.getElementById('proc-desc').value = '';
        costInput.value = '';
        document.getElementById('procs-list').innerHTML = Screens.procedures(DB.getProcedimentosByAtendimento(atendimentoId));
        this.toast('Serviço registrado.', 'success');
      } catch {
        this.toast('Não foi possível salvar o serviço.', 'error');
      } finally {
        add.disabled = false;
      }
    };

    close.onclick = async () => {
      close.disabled = true;
      try {
        const updated = await this.withLocalWrite(() => {
          if (!DB.solicitarConclusao(atendimentoId)) return false;
          const at = DB.getAtendimentoById(atendimentoId);
          const chamado = DB.getChamadoById(at.chamado_id);
          DB.addNotif(chamado.motorista_id, 'A oficina solicitou a conclusão', 'Confira os serviços e confirme a conclusão na conversa.', { screen: 'chat-oficina', id: at.id });
          return true;
        });
        if (!close.isConnected) return;
        if (updated) this.toast('Pedido de conclusão enviado.', 'success');
        this.navigate('chat-oficina', atendimentoId);
      } catch {
        this.toast('Não foi possível atualizar o atendimento.', 'error');
      } finally {
        close.disabled = false;
      }
    };
  },

  // ---- BIND: PERFIL ----
  bindPerfil() {
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) btnLogout.onclick = () => { DB.clearSession(); this.history = []; this.currentScreen = null; this.navigate('login'); };

    const btnFoto = document.getElementById('btn-change-foto');
    const inputFoto = document.getElementById('input-change-foto');
    if (btnFoto && inputFoto) {
      btnFoto.onclick = () => inputFoto.click();
      inputFoto.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const photo = await this.readPhoto(file);
          if (!inputFoto.isConnected) return;
          const session = DB.getSession();
          DB.updateProfileFoto(session.id, session.user_type, photo);
          this.toast('Foto de perfil atualizada!', 'success');
          this.render(Screens.perfil());
          this.bindPerfil();
        } catch (error) {
          this.toast(error.message, 'error');
        }
      };
    }
  },

  // ---- BIND: AVALIAR ----
  bindAvaliar(atendimentoId) {
    const notas = { transparencia: 0, prazo: 0, qualidade: 0, organizacao: 0 };
    document.querySelectorAll('.star-rating').forEach(el => {
      const crit = el.dataset.criteria;
      const stars = el.querySelectorAll('button');
      stars.forEach(s => {
        s.onclick = () => {
          const val = parseInt(s.dataset.val);
          notas[crit] = val;
          stars.forEach(st => {
            st.classList.toggle('active', Number(st.dataset.val) <= val);
            st.setAttribute('aria-pressed', String(st === s));
          });
        };
      });
    });

    const submit = document.getElementById('btn-enviar-avaliacao');
    const skip = document.getElementById('btn-pular-avaliacao');
    const finish = async (avaliar, comentario = '') => {
      submit.disabled = skip.disabled = true;
      try {
        const updated = await this.withLocalWrite(() => {
          const at = DB.getAtendimentoById(atendimentoId);
          if (at?.status !== 'aguardando_conclusao') return false;
          const chamado = DB.getChamadoById(at.chamado_id);
          if (avaliar) DB.saveAvaliacao(atendimentoId, at.oficina_id, chamado.motorista_id, notas, comentario);
          DB.concludeAtendimento(atendimentoId);
          DB.addNotif(at.oficina_id, 'Atendimento concluído', 'O motorista confirmou a conclusão.', { screen: 'chat-oficina', id: at.id });
          return true;
        });
        if (!submit.isConnected) return;
        if (updated) this.toast(avaliar ? 'Atendimento concluído e avaliação salva.' : 'Atendimento concluído.', 'success');
        this.navigate('aguardando', DB.getAtendimentoById(atendimentoId).chamado_id);
      } catch {
        this.toast('Não foi possível concluir o atendimento.', 'error');
      } finally {
        submit.disabled = skip.disabled = false;
      }
    };
    submit.onclick = () => {
      const comentario = document.getElementById('aval-comentario').value.trim();
      if (notas.transparencia === 0 || notas.prazo === 0 || notas.qualidade === 0 || notas.organizacao === 0) {
        return this.toast('Por favor, dê uma nota em todos os critérios.', 'error');
      }
      if (!comentario) {
        return this.toast('Por favor, escreva um comentário sobre o atendimento.', 'error');
      }
      finish(true, comentario);
    };

    skip.onclick = () => finish(false);
  },

  // ---- BIND: PERFIL OFICINA PUBLICO (RESPONDER/REVISAR) ----
  bindPerfilOficinaPublico() {
    document.querySelectorAll('[data-action="responder-aval"]').forEach(btn => {
      btn.onclick = () => {
        const avalId = btn.dataset.aval;
        const resposta = prompt('Digite sua resposta para esta avaliação:');
        if (resposta && resposta.trim() !== '') {
          DB.responderAvaliacao(avalId, resposta);
          this.toast('Resposta enviada!', 'success');
          this.render(Screens.perfilOficinaPublico(this.currentParam));
          this.bindPerfilOficinaPublico();
        }
      };
    });
    document.querySelectorAll('[data-action="revisar-aval"]').forEach(btn => {
      btn.onclick = () => {
        const avalId = btn.dataset.aval;
        if (confirm('Tem certeza que deseja solicitar a revisão desta avaliação para a administração?')) {
          DB.solicitarRevisaoAvaliacao(avalId);
          this.toast('Revisão solicitada à administração.', 'info');
          this.render(Screens.perfilOficinaPublico(this.currentParam));
          this.bindPerfilOficinaPublico();
        }
      };
    });
  },

  // ---- BIND: ADMIN DASHBOARD E REVISAO ----
  bindAdminDashboard() {
    document.querySelectorAll('[data-action="abrir-revisao"]').forEach(btn => {
      btn.onclick = () => {
        this.navigate('admin-revisao', btn.dataset.aval);
      };
    });
  },
  bindAdminRevisao(avalId) {
    const btnExcluir = document.getElementById('btn-admin-excluir');
    if (btnExcluir) btnExcluir.onclick = () => {
      if (confirm('Confirmar a exclusão desta avaliação?')) {
        DB.excluirAvaliacao(avalId);
        this.toast('Avaliação excluída.', 'success');
        this.navigate('admin-dashboard');
      }
    };
    const btnComentar = document.getElementById('btn-admin-comentar');
    if (btnComentar) btnComentar.onclick = () => {
      const comentario = prompt('Comentário do Administrador para o público:');
      if (comentario && comentario.trim() !== '') {
        DB.comentarAvaliacaoAdmin(avalId, comentario);
        this.toast('Avaliação mantida e comentário adicionado.', 'success');
        this.navigate('admin-dashboard');
      }
    };
  }
};

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => App.boot());
