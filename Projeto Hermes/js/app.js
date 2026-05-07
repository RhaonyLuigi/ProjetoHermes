/* ============================================================
   PROJETO HERMES — App Controller
   ============================================================ */

const App = {
  currentScreen: null,
  currentParam: null,
  history: [],
  currentChamadoId: null,
  currentAtendimentoId: null,
  pollInterval: null,

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
  },

  // ---- BOTTOM NAV ----
  showNav(type) {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;
    if (type === 'none') { nav.classList.add('hidden'); return; }
    nav.classList.remove('hidden');
    if (type === 'motorista') {
      nav.innerHTML = `
        <button class="nav-item" data-screen="home" onclick="App.goHome()"><span class="nav-icon">🏠</span><span class="nav-label">Início</span></button>
        <button class="nav-item" data-screen="chat-ia" onclick="App.navigate('chat-ia')"><span class="nav-icon">🤖</span><span class="nav-label">Chat IA</span></button>
        <button class="nav-item" data-screen="chats" onclick="App.navigate('chats')"><span class="nav-icon">💬</span><span class="nav-label">Chats</span></button>
        <button class="nav-item" data-screen="notificacoes" onclick="App.navigate('notificacoes')"><span class="nav-icon">🔔</span><span class="nav-label">Avisos</span></button>
        <button class="nav-item" data-screen="perfil" onclick="App.navigate('perfil')"><span class="nav-icon">👤</span><span class="nav-label">Perfil</span></button>`;
    } else if (type === 'oficina') {
      nav.innerHTML = `
        <button class="nav-item" data-screen="dashboard" onclick="App.navigate('dashboard')"><span class="nav-icon">📊</span><span class="nav-label">Dashboard</span></button>
        <button class="nav-item" data-screen="chamados" onclick="App.navigate('chamados')"><span class="nav-icon">📋</span><span class="nav-label">Chamados</span></button>
        <button class="nav-item" data-screen="chats" onclick="App.navigate('chats')"><span class="nav-icon">💬</span><span class="nav-label">Chats</span></button>
        <button class="nav-item" data-screen="notificacoes" onclick="App.navigate('notificacoes')"><span class="nav-icon">🔔</span><span class="nav-label">Avisos</span></button>
        <button class="nav-item" data-screen="perfil" onclick="App.navigate('perfil')"><span class="nav-icon">👤</span><span class="nav-label">Perfil</span></button>`;
    } else if (type === 'admin') {
      nav.innerHTML = `
        <button class="nav-item" data-screen="admin-dashboard" onclick="App.navigate('admin-dashboard')"><span class="nav-icon">🛡️</span><span class="nav-label">Revisões</span></button>
        <button class="nav-item" data-screen="perfil" onclick="App.navigate('perfil')"><span class="nav-icon">👤</span><span class="nav-label">Perfil</span></button>`;
    }
    this.setActiveNav();
  },

  setActiveNav(screen) {
    const s = screen || this.currentScreen;
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.screen === s);
    });
  },

  hideNav() { document.getElementById('bottom-nav').classList.add('hidden'); },

  // ---- NAVIGATE ----
  navigate(screen, param) {
    if (this.currentScreen && this.currentScreen !== screen) {
      this.history.push({ screen: this.currentScreen, param: this.currentParam });
    }
    this.currentScreen = screen;
    this.currentParam = param;
    if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }

    const session = DB.getSession();

    switch (screen) {
      case 'login': this.hideNav(); this.render(Screens.login()); this.bindLogin(); break;
      case 'register': this.hideNav(); this.render(Screens.register()); this.bindRegister(); break;
      case 'forgot': this.hideNav(); this.render(Screens.forgotPassword()); this.bindForgot(); break;
      case 'checkin-motorista': this.hideNav(); this.render(Screens.checkinMotorista()); this.bindCheckinMotorista(); break;
      case 'checkin-oficina': this.hideNav(); this.render(Screens.checkinOficina()); this.bindCheckinOficina(); break;
      case 'veiculo-form': this.hideNav(); this.render(Screens.cadastrarVeiculo()); this.bindVeiculoForm(); break;
      case 'chat-ia': this.showNav('motorista'); this.render(Screens.chatIA()); this.bindChatIA(); this.setActiveNav('chat-ia'); break;
      case 'aguardando':
        this.currentChamadoId = param;
        this.showNav('motorista');
        this.render(Screens.aguardandoOficinas(param));
        this.bindAguardando(param);
        this.setActiveNav('home');
        this.startPollingAguardando(param);
        break;
      case 'chat-oficina':
        this.currentAtendimentoId = param;
        this.render(Screens.chatOficina(param));
        this.bindChatOficina(param);
        if (session && session.user_type === 'motorista') this.showNav('motorista');
        else this.showNav('oficina');
        this.startPollingChat(param);
        break;
      case 'veiculos': this.showNav('motorista'); this.render(Screens.meusVeiculos()); this.bindMeusVeiculos(); this.setActiveNav('veiculos'); break;
      case 'chats': { const t = session && session.user_type === 'oficina' ? 'oficina' : 'motorista'; this.showNav(t); this.render(Screens.chatsLista()); this.bindChatsLista(); this.setActiveNav('chats'); break; }
      case 'notificacoes': this.showNav(session && session.user_type === 'oficina' ? 'oficina' : 'motorista'); this.render(Screens.notificacoes()); this.setActiveNav('notificacoes'); break;
      case 'dashboard': this.showNav('oficina'); this.render(Screens.dashboardOficina()); this.bindDashboard(); this.setActiveNav('dashboard'); break;
      case 'chamados': this.showNav('oficina'); this.render(Screens.chamadosOficina()); this.bindChamados(); this.setActiveNav('chamados'); break;
      case 'procedimento': this.render(Screens.registrarProcedimento(param)); this.bindProcedimento(param); break;
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
      // To avoid pushing it again, we manually navigate without pushing
      const s = prev.screen;
      const p = prev.param;
      this.history.pop(); // avoid double push logic trick or just let it push and clear?
      // Actually navigate pushes current, so let's just clear history
      this.currentScreen = null; 
      this.navigate(s, p);
      this.history.pop(); // remove the duplicate we just pushed
    } else {
      this.goHome();
    }
  },

  goHome() {
    const session = DB.getSession();
    if (!session) return this.navigate('login');
    if (session.user_type === 'oficina') return this.navigate('dashboard');
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

  // ---- POLLING ----
  startPollingAguardando(chamadoId) {
    this.pollInterval = setInterval(() => {
      const chamado = DB.getChamadoById(chamadoId);
      if (chamado && chamado.status === 'em_atendimento') {
        clearInterval(this.pollInterval);
        this.render(Screens.aguardandoOficinas(chamadoId));
        this.bindAguardando(chamadoId);
        this.toast('Uma oficina aceitou seu chamado! 🎉', 'success');
      }
    }, 3000);
  },

  startPollingChat(atendimentoId) {
    let lastCount = DB.getMsgsByAtendimento(atendimentoId).length;
    const session = DB.getSession();
    this.pollInterval = setInterval(() => {
      const msgs = DB.getMsgsByAtendimento(atendimentoId);
      if (msgs.length > lastCount) {
        // Only render messages from the OTHER party to avoid duplication
        const newMsgs = msgs.slice(lastCount).filter(m => m.remetente_id !== session.id);
        lastCount = msgs.length;
        const container = document.getElementById('chat-oficina-messages');
        if (container && newMsgs.length > 0) {
          newMsgs.forEach(m => {
            const div = document.createElement('div');
            div.className = 'bubble bubble-oficina';
            let content = m.conteudo;
            if (m.foto_url) {
              content = `<img src="${m.foto_url}" style="max-width:100%;border-radius:8px;margin-bottom:4px"/><br>` + content;
            }
            div.innerHTML = `${content}<span class="bubble-time">${Screens.formatTime(m.enviado_em)}</span>`;
            container.appendChild(div);
          });
          container.scrollTop = container.scrollHeight;
        }
      }
    }, 2000);
  },

  // ---- BIND: LOGIN ----
  bindLogin() {
    let clicks = 0;
    let timer = null;
    const logo = document.getElementById('logo-login');
    if (logo) {
      logo.onclick = () => {
        clicks++;
        if (clicks === 1) timer = setTimeout(() => clicks = 0, 3000);
        if (clicks >= 5) {
          clearTimeout(timer);
          clicks = 0;
          document.getElementById('admin-btn-container').innerHTML = `<button class="btn btn-secondary" style="background:#FF9500;color:white" onclick="App.loginAdmin()">Entrar como Admin</button>`;
        }
      };
    }

    document.getElementById('btn-entrar').onclick = () => {
      const email = document.getElementById('login-email').value.trim();
      const senha = document.getElementById('login-senha').value;
      if (!email || !senha) return this.toast('Preencha todos os campos.', 'error');
      const user = DB.findUser(email, senha);
      if (!user) return this.toast('Email ou senha incorretos.', 'error');
      DB.setSession(user);
      this.boot();
    };
    document.getElementById('link-forgot').onclick = () => this.navigate('forgot');
    document.getElementById('link-cadastro').onclick = () => this.navigate('register');
  },

  loginAdmin() {
    const senha = prompt("Digite a senha do Administrador:");
    if (senha === "teste123") {
      DB.setSession({ id: 'admin', user_type: 'admin', email: 'admin@hermes' });
      this.toast('Bem-vindo, Administrador!', 'success');
      this.navigate('admin-dashboard');
    } else {
      if (senha !== null) this.toast('Senha incorreta.', 'error');
    }
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
    document.getElementById('btn-criar').onclick = () => {
      const email = document.getElementById('reg-email').value.trim();
      const senha = document.getElementById('reg-senha').value;
      const confirm = document.getElementById('reg-confirm').value;
      if (!email || !senha) return this.toast('Preencha todos os campos.', 'error');
      if (senha !== confirm) return this.toast('As senhas não coincidem.', 'error');
      if (senha.length < 6) return this.toast('Senha deve ter ao menos 6 caracteres.', 'error');
      const result = DB.createUser(email, senha, selectedType);
      if (result.error) return this.toast(result.error, 'error');
      DB.setSession(result.user);
      this.toast('Conta criada! Complete seu perfil.', 'success');
      this.navigate(selectedType === 'oficina' ? 'checkin-oficina' : 'checkin-motorista');
    };
    document.getElementById('link-login').onclick = () => this.navigate('login');
  },

  // ---- BIND: FORGOT ----
  bindForgot() {
    document.getElementById('btn-back-forgot').onclick = () => this.navigate('login');
    document.getElementById('btn-enviar-reset').onclick = () => {
      const email = document.getElementById('forgot-email').value.trim();
      if (!email) return this.toast('Informe seu email.', 'error');
      this.toast('Link enviado para ' + email, 'success');
      setTimeout(() => this.navigate('login'), 2000);
    };
  },

  // ---- BIND: CHECKIN MOTORISTA ----
  bindCheckinMotorista() {
    document.getElementById('toggle-oficina').onclick = () => this.navigate('checkin-oficina');
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
      this.navigate('veiculo-form');
    };
  },

  // ---- BIND: CHECKIN OFICINA ----
  bindCheckinOficina() {
    document.getElementById('toggle2-motorista').onclick = () => this.navigate('checkin-motorista');
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
    document.getElementById('btn-salvar-veiculo').onclick = () => {
      const session = DB.getSession();
      if (!session) return this.navigate('login');
      const marca = document.getElementById('v-marca').value.trim();
      const modelo = document.getElementById('v-modelo').value.trim();
      const ano = document.getElementById('v-ano').value.trim();
      const placa = document.getElementById('v-placa').value.trim().toUpperCase();
      const cor = document.getElementById('v-cor').value.trim();
      if (!marca || !modelo || !ano || !placa) return this.toast('Preencha todos os campos obrigatórios.', 'error');
      DB.saveVeiculo(session.id, { marca, modelo, ano, placa, cor });
      this.toast('Veículo cadastrado!', 'success');
      this.navigate('chat-ia');
    };
  },

  // ---- BIND: CHAT IA ----
  bindChatIA() {
    const session = DB.getSession();
    if (!session) return this.navigate('login');
    AI.reset();
    const veiculos = DB.getVeiculosByMotorista(session.id);
    let chamado = null;
    let perguntaOrdem = 0;
    let diagConcluido = false;

    const addBubble = (text, type) => {
      const msgs = document.getElementById('chat-ia-messages');
      const div = document.createElement('div');
      div.className = `bubble bubble-${type}`;
      div.innerHTML = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
      return div;
    };

    const showTyping = () => {
      const msgs = document.getElementById('chat-ia-messages');
      const div = document.createElement('div');
      div.className = 'typing-indicator';
      div.id = 'typing';
      div.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    };

    const removeTyping = () => { const t = document.getElementById('typing'); if (t) t.remove(); };

    const sendToIA = async (userMsg) => {
      if (userMsg) {
        addBubble(userMsg, 'user');
        DB.savePergunta(chamado.id, AI.history.length > 0 ? AI.history[AI.history.length - 1].content : 'Resposta', userMsg, perguntaOrdem++);
      }
      showTyping();
      const input = document.getElementById('chat-ia-input');
      const sendBtn = document.getElementById('chat-ia-send');
      if (input) input.disabled = true;
      if (sendBtn) sendBtn.disabled = true;

      const response = await AI.chat(userMsg || '', veiculos);
      removeTyping();
      if (input) input.disabled = false;
      if (sendBtn) sendBtn.disabled = false;

      addBubble(response, 'ia');

      if (response.includes('[DIAGNOSTICO_CONCLUIDO]') && !diagConcluido) {
        diagConcluido = true;
        const diag = response.replace('[DIAGNOSTICO_CONCLUIDO]', '').trim();
        DB.updateChamadoDiag(chamado.id, diag);
        DB.updateChamadoStatus(chamado.id, 'aguardando');
        
        const mProfile = DB.getMotoristaProfile(session.id);
        const nomeMot = mProfile ? mProfile.nome : 'Motorista';
        const allOficinas = DB.getAllOficinas();
        allOficinas.forEach(of => DB.addNotif(of.user_id, 'Novo chamado disponível', `${nomeMot} enviou um diagnóstico para análise.`));

        const input2 = document.getElementById('chat-ia-input');
        const row = document.getElementById('chat-ia-input-row');
        if (input2) input2.disabled = true;
        if (row) {
          const btn = document.createElement('button');
          btn.className = 'btn btn-primary';
          btn.style.marginTop = '12px';
          btn.textContent = '📋 VER STATUS DO CHAMADO';
          btn.onclick = () => App.navigate('aguardando', chamado.id);
          document.getElementById('chat-ia-messages').after(btn);
        }
      }
    };

    const handleSend = () => {
      const input = document.getElementById('chat-ia-input');
      if (!input || diagConcluido) return;
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      sendToIA(text);
    };

    document.getElementById('chat-ia-send').onclick = handleSend;
    document.getElementById('chat-ia-input').onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const showVehicleSelector = () => {
      const msgs = document.getElementById('chat-ia-messages');
      const div = document.createElement('div');
      div.className = 'bubble bubble-ia';
      div.innerHTML = 'Olá! Qual veículo vamos diagnosticar hoje?<br>';
      veiculos.forEach(v => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-primary';
        btn.style.marginTop = '8px';
        btn.style.width = '100%';
        btn.textContent = `🚗 ${v.marca} ${v.modelo} (${v.placa || ''})`;
        btn.onclick = () => {
          chamado = DB.createChamado(session.id, v.id);
          div.querySelectorAll('button').forEach(b => b.disabled = true);
          addBubble(`Quero diagnosticar o ${v.marca} ${v.modelo}.`, 'user');
          setTimeout(() => sendToIA(''), 600);
        };
        div.appendChild(btn);
      });
      if (veiculos.length === 0) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-primary';
        btn.style.marginTop = '8px';
        btn.style.width = '100%';
        btn.textContent = '+ Cadastrar Veículo';
        btn.onclick = () => App.navigate('veiculo-form');
        div.appendChild(btn);
      }
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    };

    // Iniciar fluxo de escolha de veículo
    setTimeout(showVehicleSelector, 300);
  },

  // ---- BIND: AGUARDANDO ----
  bindAguardando(chamadoId) {
    const btn = document.getElementById('btn-back-aguardando');
    if (btn) btn.onclick = () => this.navigate('chat-ia');
    const btnNovo = document.getElementById('btn-novo-chamado');
    if (btnNovo) btnNovo.onclick = () => { AI.reset(); this.navigate('chat-ia'); };
    const btnChat = document.getElementById('btn-iniciar-chat-oficina');
    if (btnChat) {
      btnChat.onclick = () => {
        const atId = btnChat.dataset.atendimento;
        this.navigate('chat-oficina', atId);
      };
    }
  },

  // ---- BIND: CHAT OFICINA ----
  bindChatOficina(atendimentoId) {
    const session = DB.getSession();
    const msgs = document.getElementById('chat-oficina-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;

    document.getElementById('btn-back-chat').onclick = () => {
      if (session.user_type === 'oficina') this.navigate('dashboard');
      else {
        const at = DB.getAtendimentoById(atendimentoId);
        this.navigate('aguardando', at ? at.chamado_id : '');
      }
    };

    document.getElementById('chat-oficina-send').onclick = () => {
      const input = document.getElementById('chat-oficina-input');
      const text = input ? input.value.trim() : '';
      const fotoInput = document.getElementById('chat-foto-input');
      const foto = fotoInput && fotoInput.dataset.foto ? fotoInput.dataset.foto : null;
      
      if (!text && !foto) return;
      if (input) input.value = '';
      if (fotoInput) {
        fotoInput.dataset.foto = '';
        fotoInput.value = '';
      }
      
      const previewCont = document.getElementById('chat-foto-preview-container');
      if (previewCont) previewCont.style.display = 'none';
      
      const msg = DB.saveMsg(atendimentoId, session.id, session.user_type, text, foto);
      const at = DB.getAtendimentoById(atendimentoId);
      if (at) {
        const chamado = DB.getChamadoById(at.chamado_id);
        if (chamado && session.user_type === 'oficina') {
          DB.addNotif(chamado.motorista_id, 'Nova mensagem', `Nova mensagem da oficina.`);
        }
      }
      const container = document.getElementById('chat-oficina-messages');
      if (container) {
        const div = document.createElement('div');
        div.className = 'bubble bubble-user';
        let content = text;
        if (foto) content = `<img src="${foto}" style="max-width:100%;border-radius:8px;margin-bottom:4px"/><br>` + content;
        div.innerHTML = `${content}<span class="bubble-time">${Screens.formatTime(msg.enviado_em)}</span>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
      }
    };

    document.getElementById('chat-oficina-input').onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('chat-oficina-send').click(); }
    };

    const procBtn = document.getElementById('btn-registrar-proc');
    if (procBtn) procBtn.onclick = () => this.navigate('procedimento', atendimentoId);

    const btnConcluirMot = document.getElementById('btn-concluir-motorista');
    if (btnConcluirMot) {
      btnConcluirMot.onclick = () => this.navigate('avaliar', atendimentoId);
    }
    
    const btnVerAv = document.getElementById('btn-ver-avaliacoes');
    if (btnVerAv) {
      btnVerAv.onclick = () => this.navigate('perfil-oficina', btnVerAv.dataset.oficina);
    }

    const btnFoto = document.getElementById('btn-chat-foto');
    const inputFoto = document.getElementById('chat-foto-input');
    const previewCont = document.getElementById('chat-foto-preview-container');
    const previewImg = document.getElementById('chat-foto-preview');
    const btnRemoveFoto = document.getElementById('btn-remove-foto');

    if (btnFoto && inputFoto) {
      btnFoto.onclick = () => inputFoto.click();
      inputFoto.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          inputFoto.dataset.foto = ev.target.result;
          if (previewCont && previewImg) {
            previewImg.src = ev.target.result;
            previewCont.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      };
    }
    
    if (btnRemoveFoto) {
      btnRemoveFoto.onclick = () => {
        inputFoto.dataset.foto = '';
        inputFoto.value = '';
        previewCont.style.display = 'none';
      };
    }
  },

  // ---- BIND: MEUS VEÍCULOS ----
  bindMeusVeiculos() {
    const btn = document.getElementById('btn-add-veiculo');
    if (btn) btn.onclick = () => this.navigate('veiculo-form');
  },

  // ---- BIND: DASHBOARD ----
  bindDashboard() {
    this._bindAceitarBtns();
  },

  // ---- BIND: CHAMADOS ----
  bindChamados() {
    this._bindAceitarBtns();
    const btnHist = document.getElementById('btn-ver-historico');
    if (btnHist) btnHist.onclick = () => this.navigate('dashboard');
  },

  // ---- BIND: CHATS LISTA ----
  bindChatsLista() {
    document.querySelectorAll('[data-action="abrir-chat"]').forEach(btn => {
      btn.onclick = () => this.navigate('chat-oficina', btn.dataset.atendimento);
    });
  },

  _bindAceitarBtns() {
    const session = DB.getSession();
    document.querySelectorAll('[data-action="aceitar"]').forEach(btn => {
      btn.onclick = () => {
        const chamadoId = btn.dataset.chamado;
        const chamado = DB.getChamadoById(chamadoId);
        if (!chamado) return;
        if (chamado.status === 'em_atendimento' || chamado.status === 'concluido') {
          return this.toast('Este chamado já foi assumido por outra oficina.', 'error');
        }
        const at = DB.createAtendimento(chamadoId, session.id);
        DB.addNotif(chamado.motorista_id, 'Oficina aceitou seu chamado! ✅', 'Uma oficina está pronta para te atender e abriu o chat.');
        this.toast('Chamado aceito! Iniciando chat...', 'success');
        setTimeout(() => this.navigate('chat-oficina', at.id), 800);
      };
    });
    document.querySelectorAll('[data-action="ver-chat"]').forEach(btn => {
      btn.onclick = () => this.navigate('chat-oficina', btn.dataset.atendimento);
    });
    document.querySelectorAll('[data-action="saber-mais"]').forEach(btn => {
      btn.onclick = () => {
        const diag = decodeURIComponent(btn.dataset.diag);
        alert("Diagnóstico Completo:\n\n" + diag);
      };
    });
  },

  // ---- BIND: PROCEDIMENTO ----
  bindProcedimento(atendimentoId) {
    document.getElementById('btn-back-proc').onclick = () => this.navigate('chat-oficina', atendimentoId);

    document.getElementById('btn-add-proc').onclick = () => {
      const desc = document.getElementById('proc-desc').value.trim();
      const custo = document.getElementById('proc-custo').value.trim();
      if (!desc || !custo) return this.toast('Preencha descrição e custo.', 'error');
      DB.saveProcedimento(atendimentoId, desc, parseFloat(custo).toFixed(2));
      document.getElementById('proc-desc').value = '';
      document.getElementById('proc-custo').value = '';
      const procs = DB.getProcedimentosByAtendimento(atendimentoId);
      document.getElementById('procs-list').innerHTML = procs.map(p => `
        <div class="card card-sm" style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:14px">${p.descricao}</span>
          <span style="font-weight:700;color:#007AFF">R$ ${p.custo}</span>
        </div>`).join('');
      this.toast('Procedimento adicionado!', 'success');
    };

    document.getElementById('btn-concluir-atendimento').onclick = () => {
      const session = DB.getSession();
      DB.solicitarConclusao(atendimentoId);
      const at = DB.getAtendimentoById(atendimentoId);
      if (at) {
        const chamado = DB.getChamadoById(at.chamado_id);
        if (chamado) DB.addNotif(chamado.motorista_id, 'Conclusão solicitada 🏁', 'A oficina enviou os procedimentos. Conclua o atendimento e deixe sua avaliação.');
      }
      this.toast('Conclusão solicitada ao motorista!', 'success');
      setTimeout(() => this.navigate('dashboard'), 1000);
    };
  },

  // ---- BIND: PERFIL ----
  bindPerfil() {
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) btnLogout.onclick = () => { DB.clearSession(); this.navigate('login'); };

    const btnAddVec = document.getElementById('btn-add-veiculo-perfil');
    if (btnAddVec) btnAddVec.onclick = () => this.navigate('veiculo-form');

    const btnFoto = document.getElementById('btn-change-foto');
    const inputFoto = document.getElementById('input-change-foto');
    if (btnFoto && inputFoto) {
      btnFoto.onclick = () => inputFoto.click();
      inputFoto.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const session = DB.getSession();
          DB.updateProfileFoto(session.id, session.user_type, ev.target.result);
          this.toast('Foto de perfil atualizada!', 'success');
          this.render(Screens.perfil());
          this.bindPerfil();
        };
        reader.readAsDataURL(file);
      };
    }
  },

  // ---- BIND: AVALIAR ----
  bindAvaliar(atendimentoId) {
    const notas = { transparencia: 0, prazo: 0, qualidade: 0, organizacao: 0 };
    document.querySelectorAll('.star-rating').forEach(el => {
      const crit = el.dataset.criteria;
      const stars = el.querySelectorAll('span');
      stars.forEach(s => {
        s.onclick = () => {
          const val = parseInt(s.dataset.val);
          notas[crit] = val;
          stars.forEach(st => st.style.color = parseInt(st.dataset.val) <= val ? '#FF9500' : '#E0E0E0');
        };
      });
    });

    document.getElementById('btn-enviar-avaliacao').onclick = () => {
      const comentario = document.getElementById('aval-comentario').value.trim();
      if (notas.transparencia === 0 || notas.prazo === 0 || notas.qualidade === 0 || notas.organizacao === 0) {
        return this.toast('Por favor, dê uma nota em todos os critérios.', 'error');
      }
      if (!comentario) {
        return this.toast('Por favor, escreva um comentário sobre o atendimento.', 'error');
      }
      DB.concludeAtendimento(atendimentoId);
      const at = DB.getAtendimentoById(atendimentoId);
      const chamado = DB.getChamadoById(at.chamado_id);
      DB.saveAvaliacao(atendimentoId, at.oficina_id, chamado.motorista_id, notas, comentario);
      this.toast('Atendimento concluído e avaliação salva!', 'success');
      this.navigate('home');
    };

    document.getElementById('btn-pular-avaliacao').onclick = () => {
      DB.concludeAtendimento(atendimentoId);
      this.toast('Atendimento concluído sem avaliação.', 'info');
      this.navigate('home');
    };
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
