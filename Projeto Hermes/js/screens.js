/* ============================================================
   PROJETO HERMES — Screens Part 1: Auth Screens
   ============================================================ */

const Screens = {};

// ---- HELPERS ----
Screens.formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};
Screens.formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR');
};
Screens.timeSince = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
};

// ---- TELA 1: LOGIN ----
Screens.login = () => `
<div class="screen screen-centered" id="screen-login">
  <div class="logo" id="logo-login" style="margin-bottom:32px">
    <div class="logo-title">HERMES</div>
    <div class="logo-subtitle">Inteligência Automotiva</div>
  </div>
  <div id="admin-btn-container" style="margin-bottom:16px; min-height:40px;"></div>
  <div class="card" style="width:100%">
    <div class="form-group">
      <label for="login-email">Email</label>
      <input class="input" type="email" id="login-email" placeholder="seu@email.com" />
    </div>
    <div class="form-group">
      <label for="login-senha">Senha</label>
      <input class="input" type="password" id="login-senha" placeholder="••••••••" />
    </div>
    <div style="margin-bottom:16px">
      <button class="btn btn-primary" id="btn-entrar">ENTRAR</button>
    </div>
    <div style="text-align:center">
      <a class="link" id="link-forgot">Esqueceu sua senha?</a>
    </div>
  </div>
  <div style="margin-top:16px;text-align:center">
    <span style="font-size:14px;color:#9E9E9E">Não tem conta? </span>
    <a class="link" id="link-cadastro">Cadastre-se</a>
  </div>
</div>`;

// ---- TELA 2: CADASTRO ----
Screens.register = () => `
<div class="screen screen-centered" id="screen-register">
  <div class="logo" style="margin-bottom:20px">
    <span class="logo-icon">🔧</span>
    <div class="logo-title">Projeto Hermes</div>
    <div class="logo-subtitle">Preencha seus dados para criar sua conta.</div>
  </div>
  <div class="card" style="width:100%">
    <div class="toggle-pill" style="margin-bottom:20px">
      <button id="reg-toggle-motorista" class="active">🚗 Motorista</button>
      <button id="reg-toggle-oficina">🔧 Oficina</button>
    </div>
    <div class="form-group">
      <label for="reg-email">Email</label>
      <input class="input" type="email" id="reg-email" placeholder="seu@email.com" />
    </div>
    <div class="form-group">
      <label for="reg-senha">Senha</label>
      <input class="input" type="password" id="reg-senha" placeholder="••••••••" />
    </div>
    <div class="form-group">
      <label for="reg-confirm">Confirmar Senha</label>
      <input class="input" type="password" id="reg-confirm" placeholder="••••••••" />
    </div>
    <button class="btn btn-primary" id="btn-criar">CRIAR CONTA</button>
  </div>
  <div style="margin-top:16px;text-align:center">
    <span style="font-size:14px;color:#9E9E9E">Já tem conta? </span>
    <a class="link" id="link-login">Entrar</a>
  </div>
</div>`;

// ---- TELA 3: ESQUECI A SENHA ----
Screens.forgotPassword = () => `
<div class="screen screen-centered" id="screen-forgot">
  <div class="screen-header" style="width:100%;justify-content:flex-start;padding-top:0">
    <button class="back-btn" id="btn-back-forgot">←</button>
  </div>
  <div style="text-align:center;margin-bottom:28px">
    <span style="font-size:52px">🔑</span>
    <h1 style="font-size:22px;font-weight:800;margin:12px 0 8px">Esqueceu sua Senha?</h1>
    <p style="font-size:14px;color:#9E9E9E;line-height:1.6;max-width:300px;margin:0 auto">
      Sem problemas! Digite o e-mail cadastrado abaixo e enviaremos um link para você criar uma nova senha agora mesmo.
    </p>
  </div>
  <div class="card" style="width:100%">
    <div class="form-group">
      <label for="forgot-email">Email</label>
      <input class="input" type="email" id="forgot-email" placeholder="seu@email.com" />
    </div>
    <button class="btn btn-primary" id="btn-enviar-reset">ENVIAR</button>
  </div>
</div>`;

// ---- TELA 4: CHECKIN MOTORISTA ----
Screens.checkinMotorista = () => `
<div class="screen" id="screen-checkin-motorista" style="padding-top:24px">
  <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:50%"></div></div>
  <div class="toggle-pill" id="toggle-tipo">
    <button class="active" id="toggle-motorista">🚗 Motorista</button>
    <button id="toggle-oficina">🔧 Oficina</button>
  </div>
  <div class="logo" style="margin-bottom:20px;text-align:left">
    <div class="logo-title" style="font-size:22px">Meu Perfil</div>
    <div class="logo-subtitle">Complete seu perfil para continuar</div>
  </div>
  <div class="avatar-upload">
    <div class="avatar-circle" id="avatar-motorista-circle">
      <span class="avatar-plus">+</span>
    </div>
    <span class="avatar-label">Foto de Perfil</span>
    <input type="file" id="avatar-motorista-input" accept="image/*" style="display:none" />
  </div>
  <div class="form-group">
    <label for="motorista-nome">Seu Nome</label>
    <input class="input" type="text" id="motorista-nome" placeholder="João Silva" />
  </div>
  <div class="form-group">
    <label for="motorista-tel">Seu Telefone</label>
    <input class="input" type="tel" id="motorista-tel" placeholder="(11) 99999-9999" />
  </div>
  <div style="margin-top:8px">
    <button class="btn btn-primary" id="btn-salvar-motorista">CONTINUAR</button>
  </div>
</div>`;

// ---- TELA 5: CHECKIN OFICINA ----
Screens.checkinOficina = () => `
<div class="screen" id="screen-checkin-oficina" style="padding-top:24px">
  <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:50%"></div></div>
  <div class="toggle-pill">
    <button id="toggle2-motorista">🚗 Motorista</button>
    <button class="active" id="toggle2-oficina">🔧 Oficina</button>
  </div>
  <div class="logo" style="margin-bottom:20px;text-align:left">
    <div class="logo-title" style="font-size:22px">Perfil da Oficina</div>
    <div class="logo-subtitle">Complete o perfil da sua oficina</div>
  </div>
  <div class="avatar-upload">
    <div class="avatar-circle" id="avatar-oficina-circle">
      <span class="avatar-plus">+</span>
    </div>
    <span class="avatar-label">Foto da Oficina</span>
    <input type="file" id="avatar-oficina-input" accept="image/*" style="display:none" />
  </div>
  <div class="form-group">
    <label for="oficina-nome">Nome da Oficina</label>
    <input class="input" type="text" id="oficina-nome" placeholder="Auto Mecânica Silva" />
  </div>
  <div class="form-group">
    <label for="oficina-cnpj">CNPJ</label>
    <input class="input" type="text" id="oficina-cnpj" placeholder="00.000.000/0001-00" />
  </div>
  <div class="form-group">
    <label for="oficina-sobre">Sobre</label>
    <textarea class="input" id="oficina-sobre" placeholder="Fale um pouco sobre sua oficina..."></textarea>
  </div>
  <div style="margin-top:8px">
    <button class="btn btn-primary" id="btn-salvar-oficina">CONTINUAR</button>
  </div>
</div>`;

// ---- TELA 6: CADASTRAR VEÍCULO ----
Screens.cadastrarVeiculo = () => `
<div class="screen" id="screen-veiculo" style="padding-top:24px">
  <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:100%"></div></div>
  <div class="screen-header" style="padding-top:0">
    <span style="font-size:32px">🚗</span>
    <div>
      <h1 style="font-size:20px">Meu Veículo</h1>
      <p style="font-size:13px;color:#9E9E9E">Cadastre o veículo para atendimento</p>
    </div>
  </div>
  <div class="card">
    <div class="form-group">
      <label for="v-marca">Marca</label>
      <input class="input" type="text" id="v-marca" placeholder="Toyota, Honda, Fiat..." />
    </div>
    <div class="form-group">
      <label for="v-modelo">Modelo</label>
      <input class="input" type="text" id="v-modelo" placeholder="Corolla, Civic, Uno..." />
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label for="v-ano">Ano</label>
        <input class="input" type="number" id="v-ano" placeholder="2020" />
      </div>
      <div class="form-group">
        <label for="v-cor">Cor</label>
        <input class="input" type="text" id="v-cor" placeholder="Prata" />
      </div>
    </div>
    <div class="form-group">
      <label for="v-placa">Placa</label>
      <input class="input" type="text" id="v-placa" placeholder="ABC-1234" style="text-transform:uppercase" />
    </div>
  </div>
  <button class="btn btn-primary" id="btn-salvar-veiculo">SALVAR E CONTINUAR</button>
</div>`;

// ---- TELA 7: CHAT IA ----
Screens.chatIA = () => `
<div class="screen" id="screen-chat-ia" style="padding-top:16px;padding-bottom:0;display:flex;flex-direction:column;height:100vh">
  <div class="screen-header">
    <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#007AFF,#5AC8FA);display:flex;align-items:center;justify-content:center;font-size:22px">🤖</div>
    <div style="flex:1">
      <h1 style="font-size:17px">Assistente Hermes</h1>
      <p style="font-size:12px;color:#9E9E9E">Diagnóstico inteligente</p>
    </div>
    <span class="badge badge-blue">IA Ativa</span>
  </div>
  <div class="chat-messages" id="chat-ia-messages"></div>
  <div class="chat-input-row" id="chat-ia-input-row">
    <textarea class="input" id="chat-ia-input" placeholder="Digite sua resposta..." rows="1"></textarea>
    <button class="send-btn" id="chat-ia-send">➤</button>
  </div>
</div>`;

// ---- TELA 8: AGUARDANDO OFICINAS / PROPOSTAS ----
Screens.aguardandoOficinas = (chamadoId) => {
  const chamado = DB.getChamadoById(chamadoId);
  const diag = chamado ? chamado.diagnostico_ia : '';
  const atendimento = chamado ? DB.getAtendimentoByChamado(chamadoId) : null;
  const propostas = DB.getPropostasByChamado(chamadoId);

  const statusBadge = chamado && chamado.status === 'em_atendimento'
    ? '<span class="badge badge-green">✅ Em atendimento</span>'
    : '<span class="badge badge-blue">🔵 Aguardando...</span>';

  let oficinasHtml = '';
  if (atendimento) {
    const ofProfile = DB.getOficinaProfile(atendimento.oficina_id);
    if (ofProfile) {
      oficinasHtml = `<div class="section-title" style="margin-top:16px">Oficina Selecionada</div>
      <div class="chamado-card" style="border-left-color:#34C759">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
          <div style="width:48px;height:48px;border-radius:12px;background:#E0E0E0;display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden">${ofProfile.foto_url ? `<img src="${ofProfile.foto_url}" style="width:100%;height:100%;object-fit:cover"/>` : '🔧'}</div>
          <div><div class="chamado-motorista">${ofProfile.nome_oficina}</div><div class="chamado-veiculo">${ofProfile.sobre || 'Oficina parceira'}</div></div>
        </div>
        <button class="btn btn-primary" id="btn-iniciar-chat-oficina" data-atendimento="${atendimento.id}">💬 ABRIR CHAT</button>
      </div>`;
    }
  } else if (propostas.length > 0) {
    oficinasHtml = `<div class="section-title" style="margin-top:16px">Propostas Recebidas (${propostas.length})</div>
    ${propostas.map(p => {
      const ofProfile = DB.getOficinaProfile(p.oficina_id);
      if (!ofProfile) return '';

      const avaliacoes = DB.getAvaliacoesPublicas(p.oficina_id);
      let mediaGeral = 0;
      if (avaliacoes.length) {
        mediaGeral = (avaliacoes.reduce((acc, av) => acc + av.media, 0) / avaliacoes.length).toFixed(1);
      }

      return `<div class="chamado-card" style="border-left-color:#007AFF">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <div style="width:48px;height:48px;border-radius:12px;background:#E0E0E0;display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden">${ofProfile.foto_url ? `<img src="${ofProfile.foto_url}" style="width:100%;height:100%;object-fit:cover"/>` : '🔧'}</div>
          <div style="flex:1">
            <div class="chamado-motorista">${ofProfile.nome_oficina}</div>
            <div style="font-size:12px;color:#FF9500;font-weight:600">★ ${mediaGeral > 0 ? mediaGeral : 'Novo'} (${avaliacoes.length} avaliações)</div>
            <div style="font-size:12px;color:#007AFF;cursor:pointer;margin-top:2px" onclick="App.navigate('perfil-oficina', '${p.oficina_id}')">Ver Perfil Completo</div>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" style="width:100%" data-action="aceitar-proposta" data-atendimento="${p.id}">ACEITAR OFICINA</button>
      </div>`;
    }).join('')}`;
  }

  return `<div class="screen" id="screen-aguardando" style="padding-top:24px">
  <div class="screen-header">
    <button class="back-btn" id="btn-back-aguardando">←</button>
    <h1>Chamado Aberto</h1>
    ${statusBadge}
  </div>
  <div class="card">
    <div class="card-title">📋 Diagnóstico da IA</div>
    <div style="margin-top:10px;font-size:14px;line-height:1.6;color:#424242">${diag || 'Processando diagnóstico...'}</div>
  </div>
  ${oficinasHtml || `<div class="empty-state"><span class="empty-icon">⏳</span><p>Aguardando oficinas responderem...<br>Você receberá uma notificação quando enviarem propostas.</p></div>`}
  <button class="btn btn-secondary" id="btn-novo-chamado" style="margin-top:16px">+ Novo Diagnóstico</button>
</div>`;
};

// ---- TELA 9: CHAT MOTORISTA ↔ OFICINA ----
Screens.chatOficina = (atendimentoId) => {
  const at = DB.getAtendimentoById(atendimentoId);
  const session = DB.getSession();
  const isOficina = session && session.user_type === 'oficina';
  let headerName = 'Chat', headerSub = '', avatarSrc = '👤', oficinaId = null;
  const chamado = at ? DB.getChamadoById(at.chamado_id) : null;

  if (at) {
    if (isOficina) {
      const mProfile = chamado ? DB.getMotoristaProfile(chamado.motorista_id) : null;
      headerName = mProfile ? mProfile.nome : 'Motorista'; headerSub = 'Motorista';
      if (mProfile && mProfile.foto_url) avatarSrc = `<img src="${mProfile.foto_url}" style="width:100%;height:100%;object-fit:cover"/>`;
    } else {
      const ofProfile = DB.getOficinaProfile(at.oficina_id);
      headerName = ofProfile ? ofProfile.nome_oficina : 'Oficina'; headerSub = 'Oficina Parceira';
      oficinaId = at.oficina_id;
      if (ofProfile && ofProfile.foto_url) avatarSrc = `<img src="${ofProfile.foto_url}" style="width:100%;height:100%;object-fit:cover"/>`; else avatarSrc = '🔧';
    }
  }
  const msgs = at ? DB.getMsgsByAtendimento(atendimentoId) : [];
  const bubblesHtml = msgs.map(m => {
    const isMe = m.remetente_id === session.id;
    let content = m.conteudo;
    if (m.foto_url) {
      content = `<img src="${m.foto_url}" style="max-width:100%;border-radius:8px;margin-bottom:4px"/><br>` + content;
    }
    return `<div class="bubble ${isMe ? 'bubble-user' : 'bubble-oficina'}">${content}<span class="bubble-time">${Screens.formatTime(m.enviado_em)}</span></div>`;
  }).join('');

  const procBtn = isOficina && at && at.status === 'aceito'
    ? `<button class="btn btn-sm" id="btn-registrar-proc" data-atendimento="${atendimentoId}" style="background:#FF9500;color:white;margin-right:4px">📋</button>` : '';

  const actionBtn = !isOficina && at && (at.status === 'aceito' || at.status === 'aguardando_conclusao')
    ? `<button class="btn btn-sm" id="btn-concluir-motorista" data-atendimento="${atendimentoId}" style="background:#34C759;color:white;margin-right:4px">Concluir e Avaliar</button>` : '';

  const reviewsLink = !isOficina && oficinaId
    ? `<div style="font-size:11px;color:#007AFF;cursor:pointer;margin-top:2px" id="btn-ver-avaliacoes" data-oficina="${oficinaId}">⭐ Ver avaliações da oficina</div>` : '';

  return `<div class="screen" id="screen-chat-oficina" style="padding-top:16px;padding-bottom:0;display:flex;flex-direction:column;height:100vh">
  <div class="screen-header" style="align-items:flex-start">
    <button class="back-btn" id="btn-back-chat">←</button>
    <div style="width:40px;height:40px;border-radius:50%;background:#E0E0E0;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">${avatarSrc}</div>
    <div style="flex:1;margin-left:10px">
      <h1 style="font-size:16px;line-height:1.2">${headerName}</h1>
      <p style="font-size:12px;color:#9E9E9E;line-height:1">${headerSub}</p>
      ${reviewsLink}
    </div>
    <div style="display:flex;gap:8px">
      ${procBtn}
      ${actionBtn}
    </div>
  </div>
  <div class="chat-messages" id="chat-oficina-messages">${bubblesHtml}</div>
  
  <div id="chat-foto-preview-container" style="display:none; padding: 0 16px; margin-bottom: 8px;">
    <div style="position:relative; display:inline-block;">
      <img id="chat-foto-preview" style="height: 60px; border-radius: 8px; border: 1px solid #E0E0E0;" />
      <button id="btn-remove-foto" style="position:absolute; top:-8px; right:-8px; background:#FF3B30; color:white; border-radius:50%; width:22px; height:22px; font-size:12px; font-weight:bold; border:none; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.2);">X</button>
    </div>
  </div>

  <div class="chat-input-row" style="align-items:center; ${at && at.status === 'concluido' ? 'display:none;' : ''}">
    <button class="btn btn-sm" id="btn-chat-foto" style="background:transparent;font-size:20px;padding:0 8px;color:#9E9E9E">📷</button>
    <input type="file" id="chat-foto-input" accept="image/*" style="display:none" />
    <textarea class="input" id="chat-oficina-input" placeholder="Digite uma mensagem..." rows="1" style="flex:1;margin-bottom:0;border-radius:20px"></textarea>
    <button class="send-btn" id="chat-oficina-send" data-atendimento="${atendimentoId}" style="margin-left:8px">➤</button>
  </div>
  ${at && at.status === 'concluido' ? `<div style="text-align:center;padding:16px;color:#9E9E9E;font-size:13px">Atendimento concluído.</div>` : ''}
</div>`;
};

// ---- TELA: AVALIAR OFICINA ----
Screens.avaliarOficina = (atendimentoId) => {
  return `<div class="screen" id="screen-avaliar" style="padding-top:24px">
    <div class="screen-header">
      <h1>Avaliar Atendimento</h1>
    </div>
    <div class="card">
      <p style="font-size:14px;color:#424242;margin-bottom:16px">Avalie o serviço da oficina. Esta avaliação ficará visível no perfil da oficina após ela também concluir o atendimento.</p>
      
      <div class="form-group">
        <label>Transparência e Comunicação</label>
        <div class="star-rating" data-criteria="transparencia">
          <span data-val="1">★</span><span data-val="2">★</span><span data-val="3">★</span><span data-val="4">★</span><span data-val="5">★</span>
        </div>
      </div>

      <div class="form-group">
        <label>Cumprimento de Prazo</label>
        <div class="star-rating" data-criteria="prazo">
          <span data-val="1">★</span><span data-val="2">★</span><span data-val="3">★</span><span data-val="4">★</span><span data-val="5">★</span>
        </div>
      </div>

      <div class="form-group">
        <label>Qualidade do Atendimento</label>
        <div class="star-rating" data-criteria="qualidade">
          <span data-val="1">★</span><span data-val="2">★</span><span data-val="3">★</span><span data-val="4">★</span><span data-val="5">★</span>
        </div>
      </div>

      <div class="form-group">
        <label>Organização e Limpeza</label>
        <div class="star-rating" data-criteria="organizacao">
          <span data-val="1">★</span><span data-val="2">★</span><span data-val="3">★</span><span data-val="4">★</span><span data-val="5">★</span>
        </div>
      </div>

      <div class="form-group">
        <label for="aval-comentario">Deixe um comentário</label>
        <textarea class="input" id="aval-comentario" placeholder="Conte como foi o atendimento..." rows="3"></textarea>
      </div>

      <button class="btn btn-primary" id="btn-enviar-avaliacao" data-atendimento="${atendimentoId}" style="margin-top:24px">ENVIAR AVALIAÇÃO</button>
      <button class="btn btn-secondary" id="btn-pular-avaliacao" data-atendimento="${atendimentoId}" style="margin-top:8px">PULAR</button>
    </div>
  </div>`;
};

// ---- TELA: PERFIL OFICINA PUBLICO ----
Screens.perfilOficinaPublico = (oficinaId) => {
  const profile = DB.getOficinaProfile(oficinaId);
  if (!profile) return '<div class="screen"><div class="screen-header"><button class="back-btn" id="btn-back-perfil-oficina">←</button><h1>Erro</h1></div><p>Oficina não encontrada.</p></div>';

  const session = DB.getSession();
  const isDono = session && session.user_type === 'oficina' && session.id === oficinaId;

  const avaliacoes = DB.getAvaliacoesPublicas(oficinaId);
  let mediaGeral = 0;
  if (avaliacoes.length) {
    mediaGeral = (avaliacoes.reduce((acc, av) => acc + av.media, 0) / avaliacoes.length).toFixed(1);
  }

  const avsHtml = avaliacoes.length ? avaliacoes.map(av => {
    const mProfile = DB.getMotoristaProfile(av.motorista_id);
    const mName = mProfile ? mProfile.nome : 'Motorista';
    let extraHtml = '';

    if (av.comentario_adm) {
      extraHtml += `<div style="background:#E8F5E9;padding:10px;border-radius:8px;margin-top:8px;font-size:12px;border-left:3px solid #34C759">
        <b>✅ Comentário da Administração:</b><br>${av.comentario_adm}
      </div>`;
    }

    if (av.resposta_oficina) {
      extraHtml += `<div style="background:#F5F5F5;padding:10px;border-radius:8px;margin-top:8px;font-size:12px">
        <b>Sua Resposta:</b><br>${av.resposta_oficina}
      </div>`;
    } else if (isDono) {
      extraHtml += `<div style="margin-top:8px;display:flex;gap:4px">
        <button class="btn btn-sm btn-secondary" data-action="responder-aval" data-aval="${av.id}" style="flex:1;font-size:11px">Responder</button>
        ${!av.revisao_solicitada ? `<button class="btn btn-sm" data-action="revisar-aval" data-aval="${av.id}" style="flex:1;background:#FF3B30;color:white;font-size:11px">Solicitar Revisão</button>` : `<span style="font-size:11px;color:#FF3B30;flex:1;text-align:center;align-self:center">Revisão Solicitada</span>`}
      </div>`;
    }

    return `<div class="card" style="margin-bottom:12px;padding:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-weight:700;font-size:14px">${mName}</div>
        <div style="color:#FF9500;font-size:14px">★ ${av.media.toFixed(1)}</div>
      </div>
      <div style="font-size:12px;color:#424242;margin-bottom:8px"><i>"${av.comentario || 'Sem comentário.'}"</i></div>
      <div style="font-size:12px;color:#757575;display:grid;grid-template-columns:1fr 1fr;gap:4px;background:#FAFAFA;padding:6px;border-radius:6px">
        <div>Transp.: ${av.notas.transparencia}</div>
        <div>Prazo: ${av.notas.prazo}</div>
        <div>Quali.: ${av.notas.qualidade}</div>
        <div>Org.: ${av.notas.organizacao}</div>
      </div>
      <div style="font-size:11px;color:#9E9E9E;margin-top:8px">${Screens.formatDate(av.created_at)}</div>
      ${extraHtml}
    </div>`;
  }).join('') : '<div style="text-align:center;color:#9E9E9E;padding:20px;font-size:14px">Nenhuma avaliação pública ainda.</div>';

  return `<div class="screen" id="screen-perfil-oficina" style="padding-top:24px">
    <div class="screen-header">
      <button class="back-btn" id="btn-back-perfil-oficina">←</button>
      <h1>Perfil da Oficina</h1>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:24px">
      <div style="width:80px;height:80px;border-radius:50%;background:#E0E0E0;display:flex;align-items:center;justify-content:center;font-size:36px;overflow:hidden">${profile.foto_url ? `<img src="${profile.foto_url}" style="width:100%;height:100%;object-fit:cover"/>` : '🔧'}</div>
      <h2 style="font-size:20px;margin-top:12px">${profile.nome_oficina}</h2>
      <div style="font-size:16px;color:#FF9500;margin-top:4px;font-weight:700">★ ${mediaGeral > 0 ? mediaGeral : 'Sem avaliações'} <span style="font-size:13px;color:#9E9E9E;font-weight:400">(${avaliacoes.length})</span></div>
      <div style="font-size:13px;color:#424242;margin-top:12px;text-align:center;padding:0 16px">${profile.sobre || ''}</div>
    </div>
    <div class="section-title">Avaliações</div>
    ${avsHtml}
  </div>`;
};

// ---- TELA: DASHBOARD MOTORISTA ----
Screens.dashboardMotorista = () => {
  const session = DB.getSession();
  if (!session) return '';
  const chamados = DB.getChamadosByMotorista(session.id);
  const abertos = chamados.filter(c => c.status === 'aguardando' || c.status === 'em_atendimento');
  const historico = chamados.filter(c => c.status === 'concluido' || c.status === 'recusado');

  const buildCard = (c) => {
    const v = DB.getVeiculoById(c.veiculo_id) || { marca: '', modelo: '' };
    const at = DB.getAtendimentoByChamado(c.id);
    let statusBadge = '<span class="badge badge-blue">Aguardando</span>';
    let btnHtml = `<button class="btn btn-sm btn-secondary" onclick="App.navigate('aguardando', '${c.id}')">Ver Detalhes</button>`;

    if (c.status === 'em_atendimento' && at) {
      statusBadge = '<span class="badge badge-orange">Em Atendimento</span>';
      btnHtml = `<button class="btn btn-sm btn-primary" onclick="App.navigate('chat-oficina', '${at.id}')">Abrir Chat</button>`;
    } else if (c.status === 'concluido') {
      statusBadge = '<span class="badge badge-green">Concluído</span>';
      btnHtml = `<div style="font-size:12px;color:#9E9E9E">${Screens.formatDate(c.created_at)}</div>`;
    }

    let ofName = '—';
    if (at) {
      const ofP = DB.getOficinaProfile(at.oficina_id);
      if (ofP) ofName = ofP.nome_oficina;
    }

    return `<div class="chamado-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-weight:700;font-size:14px">🚗 ${v.marca} ${v.modelo}</div>
        ${statusBadge}
      </div>
      ${c.status !== 'aguardando' ? `<div style="font-size:13px;color:#424242;margin-bottom:12px">Oficina: <b>${ofName}</b></div>` : ''}
      <div style="display:flex;justify-content:space-between;align-items:center">
        ${btnHtml}
      </div>
    </div>`;
  };

  const abertosHtml = abertos.length ? abertos.map(buildCard).join('') : `<div class="empty-state"><span class="empty-icon">✅</span><p>Nenhum chamado aberto.</p></div>`;
  const histHtml = historico.length ? historico.map(buildCard).join('') : `<div style="font-size:13px;color:#9E9E9E;padding:8px 0;text-align:center">Nenhum histórico disponível.</div>`;

  return `<div class="screen" id="screen-dashboard-motorista" style="padding-top:24px">
    <div class="screen-header">
      <h1>Meu Painel</h1>
      <button class="btn btn-sm" onclick="App.navigate('chat-ia')" style="background:rgba(0,122,255,0.1);color:#007AFF">+ Novo Chamado</button>
    </div>
    <div class="section-title">Chamados Abertos</div>
    ${abertosHtml}
    <div class="section-title" style="margin-top:24px">Histórico de Chamados</div>
    ${histHtml}
  </div>`;
};

// ---- TELA 10: MEUS VEÍCULOS / HISTÓRICO ----
Screens.meusVeiculos = () => {
  const session = DB.getSession();
  if (!session) return '';
  const veiculos = DB.getVeiculosByMotorista(session.id);
  const chamados = DB.getChamadosByMotorista(session.id);
  const veiculosHtml = veiculos.length ? veiculos.map(v => {
    const vChamados = chamados.filter(c => c.veiculo_id === v.id);
    const hist = vChamados.map(c => {
      const at = DB.getAtendimentoByChamado(c.id);
      const ofName = at ? ((DB.getOficinaProfile(at.oficina_id) || {}).nome_oficina || '—') : '—';
      const procs = at ? DB.getProcedimentosByAtendimento(at.id) : [];
      const labels = { aguardando: 'Aguardando', em_atendimento: 'Em andamento', concluido: 'Concluído' };
      return `<div style="padding:10px 0;border-bottom:1px solid #F0F0F0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;font-weight:600">${ofName}</span>
          <span class="badge ${c.status === 'concluido' ? 'badge-green' : c.status === 'em_atendimento' ? 'badge-orange' : 'badge-blue'}">${labels[c.status]}</span>
        </div>
        <div style="font-size:12px;color:#9E9E9E;margin-top:2px">${Screens.formatDate(c.created_at)}</div>
        ${procs.map(p => `<div style="font-size:12px;margin-top:4px;color:#424242">• ${p.descricao} — <b>R$ ${p.custo}</b></div>`).join('')}
      </div>`;
    }).join('') || '<div style="font-size:13px;color:#9E9E9E;padding:8px 0">Nenhum atendimento ainda.</div>';
    return `<div class="veiculo-card" onclick="this.querySelector('.veiculo-detail').classList.toggle('open')">
      <div class="veiculo-header">
        <span class="veiculo-icon">🚗</span>
        <div class="veiculo-info"><h3>${v.marca} ${v.modelo}</h3><p>${v.ano} • ${v.placa} • ${v.cor}</p></div>
        <span style="font-size:18px;color:#9E9E9E">›</span>
      </div>
      <div class="veiculo-detail">${hist}</div>
    </div>`;
  }).join('') : `<div class="empty-state"><span class="empty-icon">🚗</span><p>Nenhum veículo cadastrado.</p></div>`;
  return `<div class="screen" id="screen-veiculos" style="padding-top:24px">
  <div class="screen-header"><h1>Meu Histórico</h1></div>
  ${veiculosHtml}
  <button class="btn btn-primary" id="btn-add-veiculo" style="margin-top:8px">+ Adicionar Veículo</button>
</div>`;
};

// ---- TELA: ADMIN DASHBOARD ----
Screens.adminDashboard = () => {
  const avs = DB.getAvaliacoesComRevisao();
  const html = avs.length ? avs.map(av => {
    const ofProfile = DB.getOficinaProfile(av.oficina_id);
    const mProfile = DB.getMotoristaProfile(av.motorista_id);
    return `<div class="card" style="margin-bottom:12px">
      <div style="font-weight:bold;margin-bottom:6px">Avaliação de ${mProfile ? mProfile.nome : 'Motorista'} para ${ofProfile ? ofProfile.nome_oficina : 'Oficina'}</div>
      <div style="color:#FF9500;margin-bottom:6px">★ ${av.media.toFixed(1)}</div>
      <div style="font-size:12px;margin-bottom:10px"><i>"${av.comentario || ''}"</i></div>
      <button class="btn btn-sm btn-primary" data-action="abrir-revisao" data-aval="${av.id}">🔍 Analisar Revisão</button>
    </div>`;
  }).join('') : `<div class="empty-state"><span class="empty-icon">🛡️</span><p>Tudo tranquilo! Nenhuma revisão pendente.</p></div>`;

  return `<div class="screen" style="padding-top:24px;padding-bottom:80px;">
    <div class="screen-header">
      <h1>Admin Dashboard</h1>
    </div>
    <div class="section-title">Revisões Solicitadas</div>
    ${html}
  </div>`;
};

// ---- TELA: ADMIN REVISÃO ----
Screens.adminRevisao = (avalId) => {
  const av = DB.getAvaliacaoById(avalId);
  if (!av) return `<div class="screen"><p>Avaliação não encontrada.</p></div>`;

  const msgs = DB.getMsgsByAtendimento(av.atendimento_id);
  const chatHtml = msgs.length ? msgs.map(m => {
    const cor = m.remetente_tipo === 'motorista' ? '#007AFF' : '#34C759';
    return `<div style="font-size:12px;margin-bottom:6px"><b style="color:${cor}">${m.remetente_tipo.toUpperCase()}:</b> ${m.conteudo}</div>`;
  }).join('') : '<div style="font-size:12px;color:#9e9e9e">Chat vazio.</div>';

  return `<div class="screen" style="padding-top:24px;display:flex;flex-direction:column;height:100vh">
    <div class="screen-header">
      <button class="back-btn" onclick="App.navigate('admin-dashboard')">←</button>
      <h1>Revisar Avaliação</h1>
    </div>
    <div class="card" style="flex:1;overflow-y:auto">
      <h3 style="font-size:14px;margin-bottom:8px">Avaliação Original:</h3>
      <div style="color:#FF9500;font-size:16px;margin-bottom:4px">★ ${av.media.toFixed(1)}</div>
      <div style="font-size:13px;margin-bottom:16px"><i>"${av.comentario || ''}"</i></div>
      <h3 style="font-size:14px;margin-bottom:8px;border-top:1px solid #E0E0E0;padding-top:16px">Histórico de Chat do Chamado:</h3>
      <div style="background:#F5F5F5;padding:10px;border-radius:8px;max-height:200px;overflow-y:auto;border:1px solid #E0E0E0">
        ${chatHtml}
      </div>
    </div>
    <div style="display:flex;gap:8px;padding-top:16px">
      <button class="btn btn-danger" id="btn-admin-excluir" style="flex:1">Excluir Avaliação</button>
      <button class="btn btn-primary" id="btn-admin-comentar" style="flex:1">Manter e Comentar</button>
    </div>
  </div>`;
};
