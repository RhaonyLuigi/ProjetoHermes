/* ============================================================
   PROJETO HERMES — App Controller
   ============================================================ */

const App = {
  currentScreen: null,
  currentParam: null,
  history: [],
  priorityTimer: null,

  // ---- TOAST ----
  toast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    document.getElementById('toast-container').replaceChildren(t);
    setTimeout(() => { t.style.animation = 'toastOut 0.3s ease forwards'; setTimeout(() => t.remove(), 300); }, 3000);
  },

  // ---- RENDER ----
  render(html) {
    const sc = document.getElementById('screen-container');
    sc.innerHTML = html;
    sc.scrollTop = 0;
    window.scrollTo(0, 0);
    Install.update();
  },

  // ---- BOTTOM NAV ----
  showNav(type) {
    if (type === 'none') return this.hideNav();
    const nav = document.getElementById('bottom-nav');
    const common = [['chats', 'chat', 'Conversas'], ['notificacoes', 'bell', 'Avisos'], ['perfil', 'user', 'Perfil']];
    const menus = {
      motorista: [['home', 'home', 'Início'], ['chat-ia', 'spark', 'Triagem'], ['veiculos', 'car', 'Garagem'], ...common],
      oficina: [['dashboard', 'grid', 'Painel'], ['chamados', 'list', 'Chamados'], ...common],
      admin: [['admin-gestao', 'grid', 'Gestão'], ['admin-dashboard', 'shield', 'Revisões'], ['perfil', 'user', 'Perfil']]
    };
    const role = { motorista: 'Motorista', oficina: 'Oficina', admin: 'Moderação' }[type];
    nav.classList.remove('hidden');
    document.getElementById('app').classList.add('has-nav');
    const bar = document.getElementById('app-bar');
    bar.hidden = false;
    bar.innerHTML = `<div class="bar-brand">${Screens.brand()}</div><div class="bar-context"><span class="bar-role">${role}</span></div>
      <button class="switch-button" data-install hidden>Instalar app</button>`;
    nav.innerHTML = `<div class="nav-brand">${Screens.brand()}<small>ASSISTÊNCIA AUTOMOTIVA</small></div>
      <div class="nav-label-group">${role.toUpperCase()}</div>
      <div class="nav-links">${menus[type].map(([screen, icon, label]) => `<button class="nav-item" data-screen="${screen}" data-nav="${screen}"><span class="nav-icon">${Screens.icon(icon, 18)}</span><span class="nav-label">${label}</span>${screen === 'notificacoes' ? '<span class="nav-dot" hidden></span>' : ''}</button>`).join('')}</div>`;
    this.refreshUnread();
    this.setActiveNav();
  },

  setActiveNav(screen) {
    const aliases = { aguardando: 'home', 'chat-oficina': 'chats', 'detalhe-oficina': 'chamados', procedimento: 'chats', planos: 'perfil' };
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

  async runButton(button, operation) {
    if (button.disabled) return;
    button.disabled = true;
    try { return await operation(); }
    catch (error) {
      this.toast(error.message, 'error');
      if (error.status === 401) {
        DB.setSnapshot({ session: null });
        this.navigate('login');
      }
    } finally { button.disabled = false; }
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
        screen.startsWith('admin-') && role !== 'admin' || role === 'admin' && ['chats', 'notificacoes', 'planos'].includes(screen)) return this.goHome();

    if (screen === 'aguardando' || screen === 'detalhe-oficina') {
      const chamado = DB.getChamadoById(param);
      const allowed = chamado && (role === 'motorista'
        ? chamado.motorista_id === session.id && chamado.status !== 'em_diagnostico'
        : chamado.recebe_oficinas || DB.getParticipacaoOficina(param, session.id));
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
    clearTimeout(this.priorityTimer);
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
        this.bindAcompanhamento(param);
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
      case 'notificacoes': this.showNav(role); this.render(Screens.notificacoes());
        if (DB.getNotifsByUser(session.id).some(n => !n.lida)) DB.mutate('avisos-lidos').then(() => this.refreshUnread()).catch(error => this.toast(error.message, 'error'));
        break;
      case 'dashboard': this.showNav('oficina'); this.render(Screens.dashboardOficina()); this.bindPainelPro(); break;
      case 'chamados': this.showNav('oficina'); this.render(Screens.chamadosOficina()); this.bindChamados(); this.setActiveNav('chamados'); break;
      case 'procedimento': this.showNav('oficina'); this.render(Screens.registrarProcedimento(param)); this.bindProcedimento(param); break;
      case 'perfil': const t = session && session.user_type === 'oficina' ? 'oficina' : (session && session.user_type === 'admin' ? 'admin' : 'motorista'); this.showNav(t); this.render(Screens.perfil()); this.bindPerfil(); this.setActiveNav('perfil'); break;
      case 'planos': this.showNav(role); this.render(Screens.planos(session)); this.bindPlano(session); break;
      case 'home': this.showNav('motorista'); this.render(Screens.dashboardMotorista()); this.setActiveNav('home'); break;
      case 'avaliar': this.showNav('none'); this.render(Screens.avaliarOficina(param)); this.bindAvaliar(param); break;
      case 'perfil-oficina': this.showNav('none'); this.render(Screens.perfilOficinaPublico(param)); this.bindPerfilOficinaPublico(); document.getElementById('btn-back-perfil-oficina').onclick = () => this.goBack(); break;
      case 'admin-gestao': this.showNav('admin'); this.render(Screens.adminGestao()); this.bindAdminGestao(); break;
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
    if (session.user_type === 'admin') return this.navigate('admin-gestao');
    this.navigate('home');
  },

  // ---- BOOT ----
  boot() {
    const session = DB.getSession();
    if (!session) return this.navigate('login');
    if (session.user_type === 'admin') return this.navigate('admin-gestao');

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

  bindLogin() {
    const form = document.getElementById('login-form');
    const button = document.getElementById('btn-entrar');
    form.onsubmit = event => {
      event.preventDefault();
      this.runButton(button, async () => {
        await DB.authenticate('/api/login', {
          email: document.getElementById('login-email').value,
          senha: document.getElementById('login-senha').value
        });
        this.history = [];
        this.currentScreen = null;
        this.boot();
      });
    };
  },

  bindRegister() {
    let selectedType = 'motorista';
    const buttons = [...document.querySelectorAll('[data-tipo-conta]')];
    buttons.forEach(button => button.onclick = () => {
      selectedType = button.dataset.tipoConta;
      buttons.forEach(item => {
        item.classList.toggle('active', item === button);
        item.setAttribute('aria-pressed', String(item === button));
      });
    });
    const submit = document.getElementById('btn-criar');
    document.getElementById('register-form').onsubmit = event => {
      event.preventDefault();
      const email = document.getElementById('reg-email').value;
      const senha = document.getElementById('reg-senha').value;
      if (senha !== document.getElementById('reg-confirm').value) return this.toast('As senhas não coincidem.', 'error');
      this.runButton(submit, async () => {
        await DB.authenticate('/api/cadastro', { email, senha, user_type: selectedType });
        this.history = [];
        this.currentScreen = null;
        this.toast('Conta criada. Complete seu perfil.', 'success');
        this.boot();
      });
    };
  },

  bindForgot() {
    const form = document.getElementById('recuperar-form');
    if (!form) return;
    form.onsubmit = event => {
      event.preventDefault();
      const senha = document.getElementById('recuperar-senha').value;
      if (senha !== document.getElementById('recuperar-confirmar').value) return this.toast('As senhas não coincidem.', 'error');
      this.runButton(form.querySelector('button'), async () => {
        await DB.request('/api/recuperar', { token: new URLSearchParams(location.hash.slice(1)).get('recuperar'), senha });
        window.history.replaceState(null, '', location.pathname);
        DB.setSnapshot({ session: null });
        this.toast('Senha redefinida. Entre com a nova senha.', 'success');
        this.navigate('login');
      });
    };
  },

  bindCheckinMotorista() { this.bindCheckin('motorista'); },
  bindCheckinOficina() { this.bindCheckin('oficina'); },

  bindCheckin(tipo) {
    const oficina = tipo === 'oficina';
    const circle = document.getElementById('avatar-' + tipo + '-circle');
    const input = document.getElementById('avatar-' + tipo + '-input');
    const submit = document.getElementById('btn-salvar-' + tipo);
    let foto = '';
    circle.onclick = () => input.click();
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      this.runButton(submit, async () => {
        foto = await this.readPhoto(file);
        const img = document.createElement('img');
        img.src = foto;
        img.alt = '';
        circle.replaceChildren(img);
      });
    };
    submit.onclick = () => this.runButton(submit, async () => {
      const value = field => document.getElementById(tipo + '-' + field).value;
      await DB.mutate('perfil', {
        nome: value('nome'), cidade: value('cidade'), uf: value('uf'), foto_url: foto,
        ...(oficina ? { cnpj: value('cnpj'), sobre: value('sobre') } : { telefone: value('tel') })
      });
      this.toast(oficina ? 'Cadastro enviado para verificação.' : 'Perfil salvo.', 'success');
      this.navigate(oficina ? 'dashboard' : 'veiculo-form', oficina ? undefined : 'home');
    });
  },

  bindVeiculoForm() {
    const submit = document.getElementById('btn-salvar-veiculo');
    submit.onclick = () => this.runButton(submit, async () => {
      const fields = ['marca', 'modelo', 'ano', 'placa', 'cor'];
      const data = Object.fromEntries(fields.map(key => [key, document.getElementById('v-' + key).value]));
      const next = this.currentParam;
      await DB.mutate('veiculo', data);
      this.toast('Veículo cadastrado.', 'success');
      this.navigate(next || 'veiculos');
    });
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

  bindProcedimento(atendimentoId) {
    document.getElementById('btn-back-proc').onclick = () => this.navigate('chat-oficina', atendimentoId);
    const add = document.getElementById('btn-add-proc');
    const close = document.getElementById('btn-concluir-atendimento');
    let pending = null;
    add.onclick = () => this.runButton(add, async () => {
      const desc = document.getElementById('proc-desc');
      const cost = document.getElementById('proc-custo');
      if (!desc.value.trim() || !cost.value || !cost.checkValidity()) return this.toast('Informe uma descrição e um valor válido.', 'error');
      const centavos = Math.round(cost.valueAsNumber * 100);
      if (!pending || pending.descricao !== desc.value || pending.centavos !== centavos) pending = { id: DB._id(), descricao: desc.value, centavos };
      await DB.mutate('servico', { atendimentoId, ...pending });
      pending = null;
      if (!add.isConnected) return;
      desc.value = '';
      cost.value = '';
      document.getElementById('procs-list').innerHTML = Screens.procedures(DB.getProcedimentosByAtendimento(atendimentoId));
      this.toast('Serviço registrado.', 'success');
    });
    close.onclick = () => this.runButton(close, async () => {
      await DB.mutate('solicitar-conclusao', { atendimentoId });
      this.toast('Pedido de conclusão enviado.', 'success');
      this.navigate('chat-oficina', atendimentoId);
    });
  },

  // ---- BIND: PERFIL ----
  bindPerfil() {
    const edit = document.getElementById('editar-perfil');
    if (edit) edit.onsubmit = event => {
      event.preventDefault();
      this.runButton(edit.querySelector('button'), async () => {
        await DB.mutate('atualizar-perfil', Object.fromEntries(new FormData(edit)));
        this.navigate('perfil');
        this.toast('Perfil atualizado.', 'success');
      });
    };
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) btnLogout.onclick = () => this.runButton(btnLogout, async () => {
      await DB.clearSession();
      this.history = [];
      this.currentScreen = null;
      this.navigate('login');
    });

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
          await DB.mutate('foto-perfil', { foto: photo });
          if (!inputFoto.isConnected) return;
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
    const finish = (avaliar, comentario = '') => this.runButton(avaliar ? submit : skip, async () => {
      const result = await DB.mutate('concluir', { atendimentoId, notas: avaliar ? notas : null, comentario });
      this.toast('Atendimento concluído.', 'success');
      this.navigate('aguardando', result.chamadoId);
    });
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

  bindPerfilOficinaPublico() {
    const oficinaId = this.currentParam;
    document.querySelectorAll('[data-action="responder-aval"],[data-action="revisar-aval"]').forEach(button => {
      button.onclick = () => {
        const responder = button.dataset.action === 'responder-aval';
        const mensagem = responder ? prompt('Digite sua resposta para a avaliação:') : '';
        if (responder ? !mensagem?.trim() : !confirm('Solicitar revisão desta avaliação?')) return;
        this.runButton(button, async () => {
          await DB.mutate('avaliacao', { id: button.dataset.aval, acao: responder ? 'responder' : 'revisar', texto: mensagem });
          if (this.currentScreen === 'perfil-oficina') this.navigate('perfil-oficina', oficinaId);
        });
      };
    });
  },

  bindAdminDashboard() {
    document.querySelectorAll('[data-action="abrir-revisao"]').forEach(btn => {
      btn.onclick = () => this.navigate('admin-revisao', btn.dataset.aval);
    });
  },

  bindAdminRevisao(avalId) {
    const remove = document.getElementById('btn-admin-excluir');
    const comment = document.getElementById('btn-admin-comentar');
    remove.onclick = () => {
      if (!confirm('Remover esta avaliação?')) return;
      this.runButton(remove, async () => {
        await DB.mutate('avaliacao', { id: avalId, acao: 'excluir' });
        this.navigate('admin-dashboard');
      });
    };
    comment.onclick = () => {
      const texto = prompt('Comentário da administração:');
      if (!texto?.trim()) return;
      this.runButton(comment, async () => {
        await DB.mutate('avaliacao', { id: avalId, acao: 'comentar', texto });
        this.navigate('admin-dashboard');
      });
    };
  },

  async initialize() {
    try {
      await DB.refresh();
      if (new URLSearchParams(location.hash.slice(1)).has('recuperar')) this.navigate('forgot');
      else this.boot();
    } catch (error) {
      this.render(Screens.conexao(error.message));
    }
  }
};

document.addEventListener('click', event => {
  const button = event.target.closest('button[data-nav],button[data-voltar],button[data-retry]');
  if (!button || button.disabled) return;
  if (button.hasAttribute('data-voltar')) App.goBack();
  else if (button.hasAttribute('data-retry')) App.initialize();
  else App.navigate(button.dataset.nav, button.dataset.param);
});
document.addEventListener('DOMContentLoaded', () => App.initialize());
