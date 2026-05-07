/* ============================================================
   PROJETO HERMES — Screens Part 3: Chats, Notificações, Dashboard, Procedimentos, Perfil
   ============================================================ */

// ---- TELA CHATS LISTA ----
Screens.chatsLista = () => {
  const session = DB.getSession();
  if (!session) return '';
  const isOficina = session.user_type === 'oficina';

  // Busca todos os atendimentos relacionados ao usuário
  let atendimentos = [];
  if (isOficina) {
    atendimentos = DB.getAtendimentosByOficina(session.id);
  } else {
    atendimentos = DB.getAtendimentosByMotorista(session.id);
  }

  const itensHtml = atendimentos.length ? atendimentos.map(at => {
    const chamado = DB.getChamadoById(at.chamado_id);
    const msgs = DB.getMsgsByAtendimento(at.id);
    const lastMsg = msgs.length ? msgs[msgs.length - 1] : null;
    const unread = msgs.filter(m => m.remetente_id !== session.id).length;

    // Nome do outro lado
    let nomeOutro = '—';
    let avatarOutro = isOficina ? '👤' : '🔧';
    if (isOficina) {
      const mp = chamado ? DB.getMotoristaProfile(chamado.motorista_id) : null;
      nomeOutro = mp ? mp.nome : 'Motorista';
    } else {
      const op = DB.getOficinaProfile(at.oficina_id);
      nomeOutro = op ? op.nome_oficina : 'Oficina';
      if (op && op.foto_url) avatarOutro = `<img src="${op.foto_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
    }

    const veiculo = chamado ? DB.getVeiculoById(chamado.veiculo_id) : null;
    const veiculoStr = veiculo ? `${veiculo.marca} ${veiculo.modelo}` : '';
    const statusMap = { aceito: 'Em andamento', concluido: 'Concluído', recusado: 'Recusado' };
    const statusClass = { aceito: 'badge-green', concluido: 'badge-blue', recusado: 'badge-red' };

    return `<div style="background:#fff;border-radius:16px;padding:16px;margin-bottom:12px;box-shadow:0 4px 16px rgba(0,0,0,0.08);display:flex;gap:14px;align-items:center;cursor:pointer" data-action="abrir-chat" data-atendimento="${at.id}">
      <div style="width:50px;height:50px;border-radius:50%;background:#E0E0E0;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;overflow:hidden">${avatarOutro}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:700;font-size:15px">${nomeOutro}</span>
          <span style="font-size:11px;color:#9E9E9E">${lastMsg ? Screens.timeSince(lastMsg.enviado_em) : Screens.timeSince(at.iniciado_em)}</span>
        </div>
        <div style="font-size:12px;color:#9E9E9E;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${veiculoStr}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
          <span style="font-size:13px;color:#424242;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px">${lastMsg ? lastMsg.conteudo : 'Nenhuma mensagem ainda.'}</span>
          <span class="badge ${statusClass[at.status] || 'badge-blue'}" style="margin-left:8px;flex-shrink:0">${statusMap[at.status] || at.status}</span>
        </div>
      </div>
    </div>`;
  }).join('') : `<div class="empty-state"><span class="empty-icon">💬</span><p>Nenhuma conversa ativa ainda.<br>${isOficina ? 'Aceite um chamado para iniciar um chat.' : 'Conclua um diagnóstico com a IA para começar.'}</p></div>`;

  return `<div class="screen" id="screen-chats" style="padding-top:24px">
  <div class="screen-header"><h1>💬 Chats</h1></div>
  ${itensHtml}
</div>`;
};

// ---- TELA 11: NOTIFICAÇÕES ----
Screens.notificacoes = () => {
  const session = DB.getSession();
  if (!session) return '';
  const notifs = DB.getNotifsByUser(session.id);
  DB.markAllRead(session.id);
  const html = notifs.length ? notifs.map(n => `
    <div class="notif-item ${n.lida ? '' : 'unread'}">
      <span class="notif-icon">${n.titulo.includes('aceitou') ? '✅' : n.titulo.includes('mensagem') ? '💬' : n.titulo.includes('concluído') ? '🏁' : '🔔'}</span>
      <div class="notif-text">
        <h4>${n.titulo}</h4>
        <p>${n.texto} · ${Screens.timeSince(n.created_at)}</p>
      </div>
    </div>`).join('')
    : `<div class="empty-state"><span class="empty-icon">🔔</span><p>Nenhuma notificação ainda.</p></div>`;
  return `<div class="screen" id="screen-notificacoes" style="padding-top:24px">
  <div class="screen-header"><h1>Notificações</h1></div>
  ${html}
</div>`;
};

// ---- TELA 12: DASHBOARD OFICINA ----
Screens.dashboardOficina = () => {
  const session = DB.getSession();
  if (!session) return '';
  const profile = DB.getOficinaProfile(session.id);
  const stats = DB.getStatsOficina(session.id);
  const chamados = DB.getChamadosAbertos().filter(c => !DB.getAtendimentoByChamado(c.id) && !DB.getPropostasByChamado(c.id).some(p => p.oficina_id === session.id));

  const avatarHtml = profile && profile.foto_url
    ? `<img src="${profile.foto_url}" style="width:100%;height:100%;object-fit:cover"/>`
    : '🔧';

  const chamadosHtml = chamados.length ? chamados.map(c => {
    const mProfile = DB.getMotoristaProfile(c.motorista_id) || { nome: 'Motorista' };
    const veiculo = DB.getVeiculoById(c.veiculo_id) || { marca: '—', modelo: '' };
    const diag = c.diagnostico_ia ? c.diagnostico_ia.slice(0, 100) + '...' : 'Sem diagnóstico.';
    return `<div class="chamado-card">
      <div class="chamado-motorista">${mProfile.nome}</div>
      <div class="chamado-veiculo">🚗 ${veiculo.marca} ${veiculo.modelo} ${veiculo.ano || ''}</div>
      <div class="chamado-diag">${diag}</div>
      <div class="chamado-meta">
        <span class="chamado-time">⏱ ${Screens.timeSince(c.created_at)}</span>
        <div style="display:flex;gap:4px;width:100%"><button class="btn btn-sm" data-action="saber-mais" data-diag="${encodeURIComponent(c.diagnostico_ia)}" style="flex:1;background:#E0E0E0;color:#424242">SABER MAIS</button><button class="btn btn-sm btn-primary" data-action="aceitar" data-chamado="${c.id}" style="flex:1">✅ ENVIAR PROPOSTA</button></div>
      </div>
    </div>`;
  }).join('') : `<div class="empty-state"><span class="empty-icon">📋</span><p>Nenhum chamado aberto no momento.</p></div>`;

  const historicoAts = DB.getAtendimentosByOficina(session.id).filter(a => a.status === 'concluido');
  const histHtml = historicoAts.length ? historicoAts.map(a => {
    const chamado = DB.getChamadoById(a.chamado_id);
    const mProfile = chamado ? DB.getMotoristaProfile(chamado.motorista_id) : null;
    return `<div class="card card-sm" style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-weight:600;font-size:14px">${mProfile ? mProfile.nome : 'Motorista'}</div>
        <div style="font-size:12px;color:#9E9E9E">${Screens.formatDate(a.concluido_em)}</div>
      </div>
      <span class="badge badge-green">Concluído</span>
    </div>`;
  }).join('') : `<div style="font-size:13px;color:#9E9E9E;padding:8px 0">Nenhum atendimento concluído.</div>`;

  return `<div class="screen" id="screen-dashboard" style="padding-top:24px">
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px">
    <div style="width:54px;height:54px;border-radius:16px;background:#E0E0E0;display:flex;align-items:center;justify-content:center;font-size:26px;overflow:hidden;flex-shrink:0">${avatarHtml}</div>
    <div>
      <div style="font-size:18px;font-weight:800">${profile ? profile.nome_oficina : 'Oficina'}</div>
      <div style="font-size:13px;color:#9E9E9E">Dashboard</div>
    </div>
  </div>
  <div class="metrics-grid">
    <div class="metric-card"><div class="metric-value">${stats.total}</div><div class="metric-label">Chamados Atendidos</div></div>
    <div class="metric-card"><div class="metric-value">${stats.concluidosMes}</div><div class="metric-label">Concluídos Este Mês</div></div>
    <div class="metric-card"><div class="metric-value">${stats.emAndamento}</div><div class="metric-label">Em Andamento</div></div>
    <div class="metric-card"><div class="metric-value"><span class="stars">★</span> ${stats.avaliacao}</div><div class="metric-label">Avaliação Média</div></div>
  </div>
  <div class="section-title">📋 Chamados Abertos</div>
  ${chamadosHtml}
  <div class="section-title">📂 Histórico</div>
  ${histHtml}
  </div>`;
};

// ---- TELA CHAMADOS OFICINA (dedicada) ----
Screens.chamadosOficina = () => {
  const session = DB.getSession();
  if (!session) return '';
  const todos = DB.getChamadosAbertos();
  const emAndamento = DB.getAtendimentosByOficina(session.id).filter(a => a.status === 'aceito');

  const buildCard = (c, jaAceito) => {
    const mProfile = DB.getMotoristaProfile(c.motorista_id) || { nome: 'Motorista' };
    const veiculo = DB.getVeiculoById(c.veiculo_id) || { marca: '?', modelo: '' };
    const diag = c.diagnostico_ia ? c.diagnostico_ia.slice(0, 140) + (c.diagnostico_ia.length > 140 ? '...' : '') : 'Sem diagnóstico gerado.';
    return `<div class="chamado-card" style="border-left-color:${jaAceito ? '#34C759' : '#007AFF'}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <div>
          <div class="chamado-motorista">👤 ${mProfile.nome}</div>
          <div class="chamado-veiculo">🚗 ${veiculo.marca} ${veiculo.modelo} ${veiculo.ano || ''} · ${veiculo.placa || ''}</div>
        </div>
        ${jaAceito ? '<span class="badge badge-green">Em andamento</span>' : '<span class="badge badge-blue">Aguardando</span>'}
      </div>
      <div class="chamado-diag" style="background:#F8F9FF;border-radius:8px;padding:10px;margin-bottom:10px">${diag}</div>
      <div class="chamado-meta">
        <span class="chamado-time">🕐 ${Screens.timeSince(c.created_at)}</span>
        ${jaAceito
          ? `<button class="btn btn-sm" data-action="ver-chat" data-atendimento="${jaAceito.id}" style="background:#34C759;color:white">💬 CONTINUAR CHAT</button>`
          : `<div style="display:flex;gap:4px;width:100%"><button class="btn btn-sm" data-action="saber-mais" data-diag="${encodeURIComponent(c.diagnostico_ia)}" style="flex:1;background:#E0E0E0;color:#424242">SABER MAIS</button><button class="btn btn-sm btn-primary" data-action="aceitar" data-chamado="${c.id}" style="flex:1">✅ ENVIAR PROPOSTA</button></div>`}
      </div>
    </div>`;
  };

  const emAndamentoHtml = emAndamento.map(a => {
    const chamado = DB.getChamadoById(a.chamado_id);
    return chamado ? buildCard(chamado, a) : '';
  }).join('');

  const abertosHtml = todos
    .filter(c => !DB.getAtendimentoByChamado(c.id) && !DB.getPropostasByChamado(c.id).some(p => p.oficina_id === session.id))
    .map(c => buildCard(c, null)).join('')
    || (emAndamento.length ? '' : `<div class="empty-state"><span class="empty-icon">📭</span><p>Nenhum novo chamado aberto no momento.<br>Novos chamados aparecem aqui automaticamente.</p></div>`);

  return `<div class="screen" id="screen-chamados" style="padding-top:24px">
  <div class="screen-header">
    <h1>Chamados</h1>
    <button class="btn btn-sm" onclick="App.navigate('chamados')" style="background:rgba(0,122,255,0.1);color:#007AFF">🔄 Atualizar</button>
  </div>
  ${emAndamento.length ? `<div class="section-title">🟢 Em Andamento</div>${emAndamentoHtml}` : ''}
  <div class="section-title">📩 Novos Chamados</div>
  ${abertosHtml}
  <button class="btn btn-secondary" id="btn-ver-historico" style="margin-top:12px">📂 Ver Histórico Completo</button>
</div>`;
};

// ---- TELA 13: REGISTRAR PROCEDIMENTO ----
Screens.registrarProcedimento = (atendimentoId) => {
  const procs = DB.getProcedimentosByAtendimento(atendimentoId);
  const procsHtml = procs.length ? procs.map(p => `
    <div class="card card-sm" style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:14px">${p.descricao}</span>
      <span style="font-weight:700;color:#007AFF">R$ ${p.custo}</span>
    </div>`).join('')
    : `<div style="font-size:13px;color:#9E9E9E;padding:8px 0">Nenhum procedimento adicionado.</div>`;

  return `<div class="screen" id="screen-procedimento" style="padding-top:24px">
  <div class="screen-header">
    <button class="back-btn" id="btn-back-proc">←</button>
    <h1>Procedimentos</h1>
  </div>
  <div class="card">
    <div class="form-group">
      <label for="proc-desc">Descrição do Procedimento</label>
      <input class="input" type="text" id="proc-desc" placeholder="Ex: Troca de pastilha de freio" />
    </div>
    <div class="form-group">
      <label for="proc-custo">Custo (R$)</label>
      <input class="input" type="number" id="proc-custo" placeholder="150.00" min="0" step="0.01" />
    </div>
    <button class="btn btn-primary" id="btn-add-proc" data-atendimento="${atendimentoId}">+ ADICIONAR</button>
  </div>
  <div class="section-title">📋 Procedimentos Adicionados</div>
  <div id="procs-list">${procsHtml}</div>
  <button class="btn btn-danger" id="btn-concluir-atendimento" data-atendimento="${atendimentoId}" style="margin-top:16px">🏁 CONCLUIR ATENDIMENTO</button>
</div>`;
};

// ---- TELA PERFIL ----
Screens.perfil = () => {
  const session = DB.getSession();
  if (!session) return '';
  const isOficina = session.user_type === 'oficina';
  const isAdmin = session.user_type === 'admin';
  const profile = isOficina ? DB.getOficinaProfile(session.id) : (!isAdmin ? DB.getMotoristaProfile(session.id) : null);
  const name = profile ? (profile.nome || profile.nome_oficina || '') : session.email;

  if (isAdmin) {
    return `<div class="screen" id="screen-perfil" style="padding-top:24px;padding-bottom:80px">
      <div class="screen-header"><h1>Perfil do Administrador</h1></div>
      <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:24px;margin-top:20px">
        <div style="width:80px;height:80px;border-radius:50%;background:#E0E0E0;display:flex;align-items:center;justify-content:center;font-size:36px">🛡️</div>
        <h2 style="font-size:20px;margin-top:12px">Administração</h2>
        <div style="font-size:14px;color:#9E9E9E;margin-top:4px">admin@hermes</div>
      </div>
      <div class="card" style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0">
          <span style="font-size:14px">Tipo de conta</span>
          <span class="badge badge-orange">🛡️ Admin</span>
        </div>
      </div>
      <button class="btn btn-danger" id="btn-logout" style="margin-top:16px">Sair da Conta</button>
    </div>`;
  }

  const pFoto = profile && profile.foto_url
    ? `<img src="${profile.foto_url}" style="width:100%;height:100%;object-fit:cover"/>`
    : (isOficina ? '🔧' : '👤');

  const avatarSrc = `<div style="width:80px;height:80px;border-radius:50%;background:#E0E0E0;display:flex;align-items:center;justify-content:center;font-size:36px;overflow:hidden;position:relative" id="btn-change-foto">
    ${pFoto}
    <div style="position:absolute;bottom:0;width:100%;background:rgba(0,0,0,0.5);color:white;font-size:10px;text-align:center;padding:2px 0;cursor:pointer">Editar</div>
    <input type="file" id="input-change-foto" style="display:none" accept="image/*" />
  </div>`;

  // ---- Seção Garagem (apenas motorista) ----
  let garagemHtml = '';
  if (!isOficina) {
    const veiculos = DB.getVeiculosByMotorista(session.id);
    const chamados = DB.getChamadosByMotorista(session.id);

    const veiculosHtml = veiculos.length ? veiculos.map(v => {
      const vChamados = chamados.filter(c => c.veiculo_id === v.id);
      const hist = vChamados.map(c => {
        const at = DB.getAtendimentoByChamado(c.id);
        const ofName = at ? ((DB.getOficinaProfile(at.oficina_id) || {}).nome_oficina || '—') : '—';
        const procs = at ? DB.getProcedimentosByAtendimento(at.id) : [];
        const labels = { aguardando: 'Aguardando', em_atendimento: 'Em andamento', concluido: 'Concluído' };
        const badge = { aguardando: 'badge-blue', em_atendimento: 'badge-orange', concluido: 'badge-green' };
        return `<div style="padding:10px 0;border-bottom:1px solid #F5F5F5">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px;font-weight:600">${ofName}</span>
            <span class="badge ${badge[c.status]}">${labels[c.status]}</span>
          </div>
          <div style="font-size:11px;color:#9E9E9E;margin-top:2px">${Screens.formatDate(c.created_at)}</div>
          ${procs.map(p => `<div style="font-size:12px;margin-top:4px;color:#424242">• ${p.descricao} — <b>R$ ${p.custo}</b></div>`).join('')}
        </div>`;
      }).join('') || '<div style="font-size:13px;color:#BDBDBD;padding:8px 0">Nenhum atendimento ainda.</div>';

      return `<div style="background:#fff;border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,0.07);margin-bottom:12px;overflow:hidden">
        <div style="padding:16px;display:flex;align-items:center;gap:14px;cursor:pointer" onclick="const s = this.nextElementSibling.style; s.display = s.display === 'none' ? 'block' : 'none'">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#C5CAE9,#9FA8DA);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">🚗</div>
          <div style="flex:1">
            <div style="font-weight:700;font-size:15px">${v.marca} ${v.modelo}</div>
            <div style="font-size:12px;color:#9E9E9E;margin-top:2px">${v.ano} · ${v.placa} · ${v.cor}</div>
          </div>
          <span style="font-size:18px;color:#C5CAE9;transition:transform 0.2s">›</span>
        </div>
        <div class="veiculo-detail" style="padding:0 16px 16px;display:none">
          <div style="font-size:12px;font-weight:700;color:#9E9E9E;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Histórico de Atendimentos</div>
          ${hist}
        </div>
      </div>`;
    }).join('')
      : `<div class="empty-state" style="padding:20px 0"><span class="empty-icon" style="font-size:36px">🚗</span><p style="font-size:13px">Nenhum veículo cadastrado ainda.</p></div>`;

    garagemHtml = `
    <div class="section-title" style="margin-top:8px">🏎️ Minha Garagem</div>
    ${veiculosHtml}
    <button class="btn btn-primary" id="btn-add-veiculo-perfil" style="margin-top:4px">+ Adicionar Veículo</button>`;
  }

  // ---- Seção Info Oficina ----
  let oficinaExtra = '';
  if (isOficina && profile && profile.sobre) {
    oficinaExtra = `<div class="divider"></div>
    <div style="padding:6px 0">
      <div style="font-size:13px;font-weight:600;color:#424242;margin-bottom:4px">Sobre</div>
      <div style="font-size:13px;color:#9E9E9E;line-height:1.5">${profile.sobre}</div>
    </div>`;
  }

  return `<div class="screen" id="screen-perfil" style="padding-top:32px;padding-bottom:80px">
  <div style="display:flex;flex-direction:column;align-items:center">${avatarSrc}</div>
  <div class="perfil-name">${name}</div>
  <div class="perfil-email">${session.email}</div>
  <div class="card" style="margin-top:8px">
    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0">
      <span style="font-size:14px">Tipo de conta</span>
      <span class="badge ${isOficina ? 'badge-orange' : 'badge-blue'}">${isOficina ? '🔧 Oficina' : '🚗 Motorista'}</span>
    </div>
    <div class="divider"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0">
      <span style="font-size:14px">${isOficina ? 'CNPJ' : 'Telefone'}</span>
      <span style="font-size:14px;color:#9E9E9E">${profile ? (profile.cnpj || profile.telefone || '—') : '—'}</span>
    </div>
    ${oficinaExtra}
    ${isOficina ? `<button class="btn btn-secondary" onclick="App.navigate('perfil-oficina', '${session.id}')" style="margin-top:12px;font-size:14px;background:#F0F0F0;color:#007AFF">⭐ Ver Minhas Avaliações</button>` : ''}
  </div>
  ${garagemHtml}
  <button class="btn btn-danger" id="btn-logout" style="margin-top:16px">Sair da conta</button>
</div>`;
};
