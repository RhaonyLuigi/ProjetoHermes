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
      A conta fica neste navegador. Você pode voltar e usar um dos perfis de demonstração para explorar o Hermes.
    </p>
  </div>
</div>`;

// ---- TELA 4: CHECKIN MOTORISTA ----
Screens.checkinMotorista = () => `
<div class="screen" id="screen-checkin-motorista" style="padding-top:24px">
  <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:50%"></div></div>
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
    <button class="back-btn" id="btn-back-veiculo" aria-label="Voltar">←</button>
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

// ---- TELA: AVALIAR OFICINA ----
Screens.avaliarOficina = (atendimentoId) => {
  const procs = DB.getProcedimentosByAtendimento(atendimentoId);
  const criteria = [
    ['transparencia', 'Transparência e comunicação'], ['prazo', 'Cumprimento do prazo'],
    ['qualidade', 'Qualidade do atendimento'], ['organizacao', 'Organização e limpeza']
  ];
  return `<div class="screen" id="screen-avaliar" style="padding-top:24px">
    <div class="screen-header">
      <button class="back-btn" aria-label="Voltar à conversa" onclick="App.goBack()">←</button>
      <h1>Confirmar conclusão</h1>
    </div>
    ${procs.length ? `<div class="card"><h2 class="card-title">Serviços registrados</h2>${Screens.procedures(procs)}</div>` : ''}
    <div class="card">
      <p class="muted" style="margin-bottom:16px">Se quiser, avalie o atendimento. A avaliação aparece no perfil da oficina neste navegador.</p>
      ${criteria.map(([key, label]) => `<div class="form-group">
        <label id="nota-${key}">${label}</label>
        <div class="star-rating" data-criteria="${key}" role="group" aria-labelledby="nota-${key}">
          ${[1, 2, 3, 4, 5].map(value => `<button data-val="${value}" aria-label="Nota ${value} de 5" aria-pressed="false">★</button>`).join('')}
        </div>
      </div>`).join('')}

      <div class="form-group">
        <label for="aval-comentario">Deixe um comentário</label>
        <textarea class="input" id="aval-comentario" maxlength="1000" placeholder="Conte como foi o atendimento..." rows="3"></textarea>
      </div>

      <button class="btn btn-primary" id="btn-enviar-avaliacao" style="margin-top:24px">Concluir e avaliar</button>
      <button class="btn btn-secondary" id="btn-pular-avaliacao" style="margin-top:8px">Concluir sem avaliação</button>
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
        <b>✅ Comentário da Administração:</b><br>${Screens.multiline(av.comentario_adm)}
      </div>`;
    }

    if (av.resposta_oficina) {
      extraHtml += `<div style="background:#F5F5F5;padding:10px;border-radius:8px;margin-top:8px;font-size:12px">
        <b>Sua Resposta:</b><br>${Screens.multiline(av.resposta_oficina)}
      </div>`;
    } else if (isDono) {
      extraHtml += `<div style="margin-top:8px;display:flex;gap:4px">
        <button class="btn btn-sm btn-secondary" data-action="responder-aval" data-aval="${av.id}" style="flex:1;font-size:11px">Responder</button>
        ${!av.revisao_solicitada ? `<button class="btn btn-sm" data-action="revisar-aval" data-aval="${av.id}" style="flex:1;background:#FF3B30;color:white;font-size:11px">Solicitar Revisão</button>` : `<span style="font-size:11px;color:#FF3B30;flex:1;text-align:center;align-self:center">Revisão Solicitada</span>`}
      </div>`;
    }

    return `<div class="card" style="margin-bottom:12px;padding:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-weight:700;font-size:14px">${Screens.escape(mName)}</div>
        <div style="color:#FF9500;font-size:14px">★ ${av.media.toFixed(1)}</div>
      </div>
      <div style="font-size:12px;color:#424242;margin-bottom:8px"><i>"${Screens.multiline(av.comentario || 'Sem comentário.')}"</i></div>
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
      <div style="width:80px;height:80px;border-radius:50%;background:#E0E0E0;display:flex;align-items:center;justify-content:center;font-size:36px;overflow:hidden">${Screens.foto(profile.foto_url) ? `<img src="${profile.foto_url}" style="width:100%;height:100%;object-fit:cover"/>` : '🔧'}</div>
      <h2 style="font-size:20px;margin-top:12px">${Screens.escape(profile.nome_oficina)}</h2>
      <div style="font-size:16px;color:#FF9500;margin-top:4px;font-weight:700">★ ${mediaGeral > 0 ? mediaGeral : 'Sem avaliações'} <span style="font-size:13px;color:#9E9E9E;font-weight:400">(${avaliacoes.length})</span></div>
      <div style="font-size:13px;color:#424242;margin-top:12px;text-align:center;padding:0 16px">${Screens.multiline(profile.sobre)}</div>
    </div>
    <div class="section-title">Avaliações</div>
    ${avsHtml}
  </div>`;
};

// ---- TELA: ADMIN DASHBOARD ----
Screens.adminDashboard = () => {
  const avs = DB.getAvaliacoesComRevisao();
  const html = avs.length ? avs.map(av => {
    const ofProfile = DB.getOficinaProfile(av.oficina_id);
    const mProfile = DB.getMotoristaProfile(av.motorista_id);
    return `<div class="card" style="margin-bottom:12px">
      <div style="font-weight:bold;margin-bottom:6px">Avaliação de ${Screens.escape(mProfile?.nome || 'Motorista')} para ${Screens.escape(ofProfile?.nome_oficina || 'Oficina')}</div>
      <div style="color:#FF9500;margin-bottom:6px">★ ${av.media.toFixed(1)}</div>
      <div style="font-size:12px;margin-bottom:10px"><i>"${Screens.multiline(av.comentario)}"</i></div>
      <button class="btn btn-sm btn-primary" data-action="abrir-revisao" data-aval="${av.id}">🔍 Analisar Revisão</button>
    </div>`;
  }).join('') : `<div class="empty-state"><span class="empty-icon">🛡️</span><p>Tudo tranquilo! Nenhuma revisão pendente.</p></div>`;

  return `<div class="screen" style="padding-top:24px;padding-bottom:80px;">
    <div class="screen-header">
      <h1>Moderação de avaliações</h1>
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
    const tipo = m.tipo_remetente || m.remetente_tipo;
    const cor = tipo === 'motorista' ? '#007AFF' : '#34C759';
    return `<div style="font-size:12px;margin-bottom:6px"><b style="color:${cor}">${tipo === 'motorista' ? 'Motorista' : 'Oficina'}:</b> ${Screens.multiline(m.conteudo)}</div>`;
  }).join('') : '<div style="font-size:12px;color:#9e9e9e">Chat vazio.</div>';

  return `<div class="screen" style="padding-top:24px;display:flex;flex-direction:column;height:100vh">
    <div class="screen-header">
      <button class="back-btn" onclick="App.navigate('admin-dashboard')">←</button>
      <h1>Revisar Avaliação</h1>
    </div>
    <div class="card" style="flex:1;overflow-y:auto">
      <h3 style="font-size:14px;margin-bottom:8px">Avaliação Original:</h3>
      <div style="color:#FF9500;font-size:16px;margin-bottom:4px">★ ${av.media.toFixed(1)}</div>
      <div style="font-size:13px;margin-bottom:16px"><i>"${Screens.multiline(av.comentario)}"</i></div>
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
