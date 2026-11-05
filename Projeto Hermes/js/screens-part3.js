/* ============================================================
   PROJETO HERMES — Screens Part 3: Chats, Notificações, Dashboard, Procedimentos, Perfil
   ============================================================ */

// ---- TELA 13: REGISTRAR PROCEDIMENTO ----
Screens.registrarProcedimento = (atendimentoId) => {
  const procs = DB.getProcedimentosByAtendimento(atendimentoId);
  const procsHtml = procs.length ? Screens.procedures(procs) : '<p class="muted">Nenhum serviço registrado.</p>';

  return `<div class="screen" id="screen-procedimento" style="padding-top:24px">
  <div class="screen-header">
    <button class="back-btn" id="btn-back-proc" aria-label="Voltar à conversa">←</button>
    <h1>Serviços do atendimento</h1>
  </div>
  <div class="card">
    <div class="form-group">
      <label for="proc-desc">Descrição do Procedimento</label>
      <input class="input" type="text" id="proc-desc" maxlength="200" placeholder="Ex: Troca de pastilhas" />
    </div>
    <div class="form-group">
      <label for="proc-custo">Custo (R$)</label>
      <input class="input" type="number" id="proc-custo" placeholder="150,00" min="0" max="1000000" step="0.01" />
    </div>
    <button class="btn btn-primary" id="btn-add-proc">Adicionar serviço</button>
  </div>
  <div class="section-title">Serviços registrados</div>
  <div id="procs-list">${procsHtml}</div>
  <button class="btn btn-secondary" id="btn-concluir-atendimento" style="margin-top:16px">Solicitar conclusão ao motorista</button>
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

  const pFoto = Screens.foto(profile?.foto_url)
    ? `<img src="${profile.foto_url}" style="width:100%;height:100%;object-fit:cover"/>`
    : (isOficina ? '🔧' : '👤');

  const avatarSrc = `<div style="width:80px;height:80px;border-radius:50%;background:#E0E0E0;display:flex;align-items:center;justify-content:center;font-size:36px;overflow:hidden;position:relative" id="btn-change-foto">
    ${pFoto}
    <div style="position:absolute;bottom:0;width:100%;background:rgba(0,0,0,0.5);color:white;font-size:10px;text-align:center;padding:2px 0;cursor:pointer">Editar</div>
    <input type="file" id="input-change-foto" style="display:none" accept="image/*" />
  </div>`;

  // ---- Seção Info Oficina ----
  let oficinaExtra = '';
  if (isOficina && profile && profile.sobre) {
    oficinaExtra = `<div class="divider"></div>
    <div style="padding:6px 0">
      <div style="font-size:13px;font-weight:600;color:#424242;margin-bottom:4px">Sobre</div>
      <div style="font-size:13px;color:#9E9E9E;line-height:1.5">${Screens.multiline(profile.sobre)}</div>
    </div>`;
  }

  return `<div class="screen" id="screen-perfil" style="padding-top:32px;padding-bottom:80px">
  <div style="display:flex;flex-direction:column;align-items:center">${avatarSrc}</div>
  <div class="perfil-name">${Screens.escape(name)}</div>
  <div class="perfil-email">${Screens.escape(session.email)}</div>
  <div class="card" style="margin-top:8px">
    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0">
      <span style="font-size:14px">Tipo de conta</span>
      <span class="badge ${isOficina ? 'badge-orange' : 'badge-blue'}">${isOficina ? '🔧 Oficina' : '🚗 Motorista'}</span>
    </div>
    <div class="divider"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0">
      <span style="font-size:14px">${isOficina ? 'CNPJ' : 'Telefone'}</span>
      <span style="font-size:14px;color:#9E9E9E">${Screens.escape(profile?.cnpj || profile?.telefone || '—')}</span>
    </div>
    ${oficinaExtra}
    ${isOficina ? `<button class="btn btn-secondary" onclick="App.navigate('perfil-oficina', '${session.id}')" style="margin-top:12px;font-size:14px;background:#F0F0F0;color:#007AFF">⭐ Ver Minhas Avaliações</button>` : ''}
  </div>
  ${isOficina ? '' : '<button class="btn btn-secondary" onclick="App.navigate(\'veiculos\')">Minha garagem</button>'}
  <div class="row-actions" style="margin-top:16px">${Screens.atalhoPlano(session)}<button class="btn btn-danger btn-sm" id="btn-logout">Sair da conta</button></div>
</div>`;
};
