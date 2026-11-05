Screens.conexao = (message) => `<div class="screen screen-centered">
  ${Screens.empty('alert', 'Conexão indisponível', Screens.escape(message), '<button class="btn btn-primary btn-sm" data-retry>Tentar novamente</button>')}
</div>`;

Screens.verificacao = (perfil) => {
  if (!perfil || perfil.verificacao === 'aprovada') return '';
  return `<aside class="priority-note">${Screens.icon('shield')}<div>
    <strong>${perfil.verificacao === 'suspensa' ? 'Cadastro suspenso' : 'Cadastro em análise'}</strong>
    <p>A aprovação pela administração libera o aceite de novos chamados na sua cidade.</p>
  </div></aside>`;
};

Screens.adminGestao = () => {
  const admin = DB.data.admin || {};
  const oficinas = admin.oficinas || [];
  const assinaturas = admin.assinaturas || [];
  const anuncios = admin.anuncios || [];
  return `<div class="screen workspace-screen">
    ${Screens.pageTitle('ADMINISTRAÇÃO', 'Gestão do Hermes', 'Confira cadastros de oficinas, gerencie planos e publique anúncios.')}
    <div class="workshop-grid admin-grid">
      <section class="flow-panel">
        <h2>Verificação de oficinas</h2>
        <p>Confirme os dados da empresa antes de aprovar seu acesso a chamados.</p>
        <div class="request-list">${oficinas.map(item => `<article class="request-row">
          <div class="request-title"><strong>${Screens.escape(item.nome)}</strong><p>${Screens.escape(item.cnpj)} · ${Screens.escape(item.cidade)} / ${Screens.escape(item.uf)}</p>
          <p>Status: ${Screens.escape(item.verificacao)}</p></div>
          <button class="btn btn-secondary btn-sm" data-admin-oficina="${item.user_id}" data-status="${item.verificacao === 'aprovada' ? 'suspensa' : 'aprovada'}">${item.verificacao === 'aprovada' ? 'Suspender' : 'Aprovar'}</button>
        </article>`).join('') || '<p class="muted">Nenhuma oficina cadastrada.</p>'}</div>
      </section>
      <section class="flow-panel">
        <h2>Assinaturas</h2>
        <p>Ative por 30 dias após confirmar a adesão. Uma renovação acrescenta 30 dias ao período vigente.</p>
        <div class="request-list">${assinaturas.map(item => {
          const ativo = item.expira_em > Date.now();
          return `<article class="request-row">
            <div class="request-title"><strong>${Screens.escape(item.email)}</strong><p>${item.user_type === 'oficina' ? 'Oficina Pro' : 'Motorista Plus'} · ${ativo ? 'Ativo até ' + Screens.formatDate(item.expira_em) : item.solicitada_em ? 'Solicitação pendente' : 'Inativo'}</p></div>
            <div class="row-actions">
              <button class="btn btn-secondary btn-sm" data-admin-plano="${item.id}" data-ativa="true">${ativo ? 'Renovar' : 'Ativar 30 dias'}</button>
              ${ativo || item.solicitada_em ? `<button class="text-button" data-admin-plano="${item.id}" data-ativa="false">${ativo ? 'Desativar' : 'Recusar'}</button>` : ''}
            </div>
          </article>`;
        }).join('') || '<p class="muted">Nenhuma solicitação registrada.</p>'}</div>
      </section>
    </div>
    <section class="flow-panel admin-anuncios">
      <h2>Espaços publicitários</h2><p>Defina um anúncio por perfil. O espaço aparece no painel de contas gratuitas.</p>
      <div class="workshop-grid">${['motorista', 'oficina'].map(role => {
        const anuncio = anuncios.find(item => item.publico === role);
        return `<form data-admin-anuncio="${role}">
          <h3>${role === 'motorista' ? 'Motoristas' : 'Oficinas'}</h3>
          <div class="form-group"><label for="ad-titulo-${role}">Título</label><input class="input" id="ad-titulo-${role}" name="titulo" maxlength="90" required value="${Screens.escape(anuncio?.titulo)}"></div>
          <div class="form-group"><label for="ad-texto-${role}">Texto</label><textarea class="input" id="ad-texto-${role}" name="texto" maxlength="250" required>${Screens.escape(anuncio?.texto)}</textarea></div>
          <div class="form-group"><label for="ad-link-${role}">Link HTTPS opcional</label><input class="input" id="ad-link-${role}" name="link" type="url" maxlength="600" value="${Screens.escape(anuncio?.link)}"></div>
          <div class="row-actions"><button class="btn btn-primary btn-sm">Salvar anúncio</button>
          ${anuncio ? '<button type="button" class="text-button" data-remover-anuncio>Remover anúncio</button>' : ''}</div>
        </form>`;
      }).join('')}</div>
    </section>
  </div>`;
};

App.bindAdminGestao = function () {
  const save = (button, action, data) => this.runButton(button, async () => {
    await DB.mutate(action, data);
    this.navigate('admin-gestao');
    this.toast('Alteração salva.', 'success');
  });
  document.querySelectorAll('[data-admin-oficina]').forEach(btn => {
    btn.onclick = () => {
      if (btn.dataset.status === 'suspensa' && !confirm('Suspender o acesso desta oficina a novos chamados?')) return;
      save(btn, 'admin-verificacao', { userId: btn.dataset.adminOficina, status: btn.dataset.status });
    };
  });
  document.querySelectorAll('[data-admin-plano]').forEach(btn => {
    btn.onclick = () => {
      if (!confirm('Confirmar a alteração neste plano?')) return;
      save(btn, 'admin-assinatura', { userId: btn.dataset.adminPlano, ativa: btn.dataset.ativa === 'true' });
    };
  });
  document.querySelectorAll('[data-admin-anuncio]').forEach(form => {
    form.onsubmit = event => {
      event.preventDefault();
      save(form.querySelector('button'), 'admin-anuncio', { publico: form.dataset.adminAnuncio, ...Object.fromEntries(new FormData(form)) });
    };
    const remove = form.querySelector('[data-remover-anuncio]');
    if (remove) remove.onclick = () => {
      if (confirm('Remover este anúncio?')) save(remove, 'admin-anuncio', { publico: form.dataset.adminAnuncio, remover: true });
    };
  });
};
