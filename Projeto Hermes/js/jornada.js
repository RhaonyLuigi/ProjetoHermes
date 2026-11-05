const icones = {
  home: '<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
  car: '<path d="m5 10 2-5h10l2 5m-15 7v2m16-2v2M3 11l2-1h14l2 1v6H3zM7 13.5h1m8 0h1"/>',
  spark: '<path d="M12 2c0 6-4 10-10 10 6 0 10 4 10 10 0-6 4-10 10-10-6 0-10-4-10-10z"/>',
  chat: '<path d="M21 4H3v13h5l4 4 4-4h5zM7 9h10M7 13h6"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 0 0 4 0"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  wrench: '<path d="M14 7a5 5 0 0 0-6 6l-5 5a2 2 0 0 0 3 3l5-5a5 5 0 0 0 6-6l-3 3-3-3 3-3Z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  swap: '<path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="m9 12 2 2 4-4"/>',
  bolt: '<path d="m13 2-8 12h7l-1 8 8-12h-7z"/>',
  temp: '<path d="M9 14V5a3 3 0 1 1 6 0v9a5 5 0 1 1-6 0Z"/><path d="M12 10v7"/>',
  activity: '<path d="M2 12h5l3-8 4 16 3-8h5"/>',
  gauge: '<path d="M4 19a9 9 0 1 1 16 0zM12 15l4-6"/>',
  dots: '<path d="M5 12h.01M12 12h.01M19 12h.01"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  alert: '<path d="M12 3 2 20h20zM12 9v4m0 3h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>'
};

Screens.icon = (name, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icones[name] || ''}</svg>`;
Screens.escape = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
Screens.multiline = (value) => Screens.escape(value).replace(/\r?\n/g, '<br>');
Screens.foto = (value) => /^data:image\/(?:jpeg|png|gif|webp|avif);base64,[a-z0-9+/=]+$/i.test(value || '') ? value : '';
Screens.money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
Screens.brand = () => `<span class="brand"><span class="brand-mark"><svg width="25" height="25" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M5 22 10 6h4l-5 16H5Zm9 0 5-16h4l-5 16h-4Z" fill="currentColor"/><path d="M9 12h10v4H9z" fill="currentColor"/></svg></span><span>hermes<span class="brand-dot">.</span></span></span>`;
Screens.vehicleName = (v) => v ? `${v.marca} ${v.modelo}` : 'Veículo';
Screens.empty = (icon, title, text, action = '') => `<div class="empty-panel"><span class="icon-tile">${Screens.icon(icon)}</span><strong>${title}</strong><p>${text}</p>${action}</div>`;
Screens.pageTitle = (label, title, subtitle, action = '') => `<div class="page-heading"><div><p class="eyebrow">${label}</p><h1>${title}</h1><p class="page-subtitle">${subtitle}</p></div>${action}</div>`;
Screens.status = (chamado, atendimento) => {
  const labels = {
    aguardando: ['Aguardando oficina', 'amber'],
    em_atendimento: ['Em atendimento', 'blue'],
    aceito: ['Em atendimento', 'blue'],
    proposta: ['Interesse enviado', 'blue'],
    nao_selecionado: ['Outra oficina escolhida', 'muted'],
    aguardando_conclusao: ['Aguardando confirmação', 'amber'],
    concluido: ['Concluído', 'green'],
    recusado: ['Encerrado', 'muted'],
    encerrado: ['Encerrado', 'muted']
  };
  const [label, color] = labels[atendimento?.status] || labels[chamado.status] || ['Rascunho', 'muted'];
  return `<span class="status status-${color}">${label}</span>`;
};

Screens.login = () => `
  <div class="welcome screen">
    <section class="welcome-story">
      ${Screens.brand()}
      <div class="welcome-copy">
        <span class="hero-label"><span></span> ASSISTÊNCIA AUTOMOTIVA</span>
        <h1>Da primeira dúvida<br>à oficina<span>.</span></h1>
        <p>Conte o que está acontecendo com seu veículo, prepare um pré-diagnóstico e converse com quem pode ajudar.</p>
      </div>
      <img class="welcome-diagram" src="img/vehicle-diagram.svg" alt="" />
      <small>PROJETO ACADÊMICO <span>·</span> HERMES</small>
    </section>
    <section class="welcome-access">
      <div class="welcome-access-inner">
        <p class="eyebrow">EXPLORE O HERMES</p>
        <h2>Por onde quer começar?</h2>
        <p class="page-subtitle">Experimente os dois lados do atendimento com dados de demonstração.</p>
        <div class="demo-choices">
          <button class="demo-choice demo-primary" id="btn-demo-mot"><span class="icon-tile">${Screens.icon('car')}</span><span><strong>Entrar como motorista</strong><small>Relate um problema no veículo</small></span>${Screens.icon('arrow')}</button>
          <button class="demo-choice" id="btn-demo-ofi"><span class="icon-tile">${Screens.icon('wrench')}</span><span><strong>Entrar como oficina</strong><small>Analise chamados e converse com motoristas</small></span>${Screens.icon('arrow')}</button>
        </div>
        <details class="login-details"><summary>Já tem uma conta local?</summary>
          <form id="login-form">
            <div class="form-group"><label for="login-email">E-mail</label><input class="input" type="email" id="login-email" autocomplete="username" required></div>
            <div class="form-group"><label for="login-senha">Senha</label><input class="input" type="password" id="login-senha" autocomplete="current-password" required></div>
            <button class="btn btn-primary" id="btn-entrar">Entrar</button>
            <div class="row-actions"><button class="text-button" type="button" id="link-cadastro">Criar conta local</button><button class="text-button" type="button" id="link-forgot">Esqueci a senha</button></div>
          </form>
        </details>
        <p class="local-note">${Screens.icon('shield', 16)} Os dados desta demonstração ficam neste navegador.</p>
        <button class="text-button" id="btn-demo-admin">Moderação local de avaliações</button>
      </div>
    </section>
  </div>`;

Screens.driverCard = (c) => {
  const v = DB.getVeiculoById(c.veiculo_id);
  const categoria = Triagem.categorias[c.categoria]?.nome || 'Assistência automotiva';
  return `<article class="request-row">
    <span class="icon-tile">${Screens.icon('car')}</span>
    <div class="request-title"><strong>${Screens.escape(Screens.vehicleName(v))}</strong><p>${Screens.escape(categoria)} · ${c.total_oficinas} de ${c.limite_oficinas} oficinas</p></div>
    ${Screens.status(c)}
    <button class="text-button request-link" onclick="App.navigate('aguardando', '${Screens.escape(c.id)}')">Ver chamado ${Screens.icon('arrow', 16)}</button>
  </article>`;
};

Screens.dashboardMotorista = () => {
  const session = DB.getSession();
  const profile = DB.getMotoristaProfile(session.id);
  const nome = profile?.nome?.trim().split(/\s+/)[0] || 'motorista';
  const veiculos = DB.getVeiculosByMotorista(session.id);
  const chamados = DB.getChamadosByMotorista(session.id);
  const abertos = chamados.filter(c => ['aguardando', 'em_atendimento'].includes(c.status));
  const historico = chamados.filter(c => ['concluido', 'recusado', 'encerrado'].includes(c.status));
  const draft = DB.getDraft(session.id);
  return `<div class="screen workspace-screen">
    ${Screens.pageTitle('ÁREA DO MOTORISTA', `Olá, ${Screens.escape(nome)}`, 'Acompanhe seus veículos e atendimentos em um só lugar.', Screens.atalhoPlano(session))}
    <section class="service-hero">
      <img class="service-diagram" src="img/vehicle-diagram.svg" alt="">
      <div class="service-copy">
        <span class="hero-label"><span></span> TRIAGEM DE SINTOMAS</span>
        <h2>O que está acontecendo<br>com seu veículo?</h2>
        <p>Responda algumas perguntas e envie à oficina um resumo do que você percebeu.</p>
        <button class="btn btn-accent" onclick="App.navigate('chat-ia')">${Screens.icon(draft ? 'arrow' : 'plus', 18)} ${draft ? 'Retomar triagem' : 'Iniciar triagem'}</button>
      </div>
    </section>
    ${Screens.anuncio(session)}
    <div class="dashboard-grid">
      <section>
        <div class="section-heading"><div><h2>Meus chamados <span>${abertos.length}</span></h2><p>Acompanhe o andamento de cada solicitação.</p></div></div>
        <div class="request-list">${abertos.length ? abertos.map(Screens.driverCard).join('') : Screens.empty('list', 'Nenhum chamado aberto', 'Os chamados enviados aparecem aqui.')}</div>
        ${historico.length ? `<details class="history-panel"><summary>Histórico de chamados <span>${historico.length}</span></summary><div class="request-list">${historico.map(Screens.driverCard).join('')}</div></details>` : ''}
      </section>
      <aside class="garage-panel">
        <div class="section-heading"><div><h2>Minha garagem</h2><p>Seus veículos cadastrados.</p></div><span class="icon-tile">${Screens.icon('car')}</span></div>
        ${veiculos.slice(0, 3).map(v => `<div class="garage-car"><strong>${Screens.escape(Screens.vehicleName(v))}</strong><small>${Screens.escape([v.ano, v.placa].filter(Boolean).join(' · '))}</small></div>`).join('') || '<p class="muted">Nenhum veículo cadastrado.</p>'}
        <button class="text-button" onclick="App.navigate('veiculos')">Ver garagem ${Screens.icon('arrow', 16)}</button>
        ${Screens.favoritas(session)}
      </aside>
    </div>
  </div>`;
};

Screens.meusVeiculos = () => {
  const session = DB.getSession();
  const veiculos = DB.getVeiculosByMotorista(session.id);
  const chamados = DB.getChamadosByMotorista(session.id).filter(c => c.status !== 'em_diagnostico');
  return `<div class="screen workspace-screen">
    ${Screens.pageTitle('ÁREA DO MOTORISTA', 'Minha garagem', 'Consulte o histórico de atendimentos por veículo.',
      `<button class="btn btn-primary btn-sm" id="btn-add-veiculo">${Screens.icon('plus', 17)} Adicionar veículo</button>`)}
    <div class="garage-list">${veiculos.map(v => {
      const historico = chamados.filter(c => c.veiculo_id === v.id);
      return `<details class="garage-panel garage-vehicle">
        <summary><span class="icon-tile">${Screens.icon('car')}</span><span><strong>${Screens.escape(Screens.vehicleName(v))}</strong>
          <small>${Screens.escape([v.ano, v.placa, v.cor].filter(Boolean).join(' · '))}</small></span></summary>
        <div class="request-list">${historico.length ? historico.map(Screens.driverCard).join('') : '<p class="muted">Nenhum chamado para este veículo.</p>'}</div>
      </details>`;
    }).join('') || Screens.empty('car', 'Sua garagem está vazia', 'Cadastre um veículo para iniciar uma triagem.')}</div>
  </div>`;
};

Screens.chatIA = (draft, veiculos, limites) => {
  const v = veiculos.find(item => item.id === draft?.veiculoId);
  const categoria = v && draft.etapa > 1 && Triagem.categorias[draft.categoria];
  const limite = v && limites.includes(draft.limiteOficinas) ? draft.limiteOficinas : null;
  const etapa = !v ? 0 : !limite ? 1 : !categoria ? 2 : draft.etapa + 1;
  const pergunta = categoria && etapa === 3 ? Triagem.perguntas(draft.categoria)[draft.indice] : null;
  const steps = ['Veículo', 'Limite', 'Sintoma', 'Perguntas', 'Revisão'];
  let conteudo;
  if (!v) {
    conteudo = `<h2>Qual veículo precisa de atenção?</h2><p>Escolha um veículo da sua garagem para começar.</p>
      <div class="choice-grid">${veiculos.map(item => `<button class="choice-card" data-veiculo="${Screens.escape(item.id)}"><span class="icon-tile">${Screens.icon('car')}</span><span><strong>${Screens.escape(Screens.vehicleName(item))}</strong><small>${Screens.escape([item.ano, item.placa].filter(Boolean).join(' · '))}</small></span>${Screens.icon('arrow', 17)}</button>`).join('')}
      <button class="choice-card choice-outline" onclick="App.navigate('veiculo-form', 'chat-ia')"><span class="icon-tile">${Screens.icon('plus')}</span><span><strong>Cadastrar veículo</strong><small>Adicione à sua garagem</small></span></button></div>`;
  } else if (!limite) {
    conteudo = `<h2>Quantas oficinas podem aceitar?</h2><p>Esse é o máximo de oficinas que podem entrar no chamado. Você pode conversar com todas as que aceitarem.</p>
      <div class="choice-grid limite-grid">${limites.map(numero => `<button class="choice-card" data-limite-oficinas="${numero}"><span class="icon-tile">${numero}</span><strong>Até ${numero} oficinas</strong>${Screens.icon('arrow', 16)}</button>`).join('')}</div>
      ${Screens.atalhoPlano(DB.getSession())}`;
  } else if (!categoria) {
    conteudo = `<h2>Qual é o principal sintoma?</h2><p>Escolha a opção mais próxima do que você percebeu.</p>
      <div class="choice-grid">${Object.entries(Triagem.categorias).map(([key, grupo]) => `<button class="choice-card" data-categoria="${key}"><span class="icon-tile">${Screens.icon(grupo.icone)}</span><span><strong>${grupo.nome}</strong><small>${grupo.exemplo}</small></span></button>`).join('')}</div>`;
  } else if (pergunta) {
    const value = draft.respostas[draft.indice] || '';
    conteudo = `<div class="question-count"><span>Pergunta ${draft.indice + 1} de 4</span><progress max="4" value="${draft.indice + 1}"></progress></div>
      <h2>${pergunta.texto}</h2><p>${pergunta.dica || 'Escolha uma resposta ou descreva com suas palavras.'}</p>
      <div class="answer-options">${pergunta.opcoes.map(opcao => `<button class="answer-chip" data-resposta="${Screens.escape(opcao)}">${Screens.escape(opcao)} ${Screens.icon('arrow', 15)}</button>`).join('')}</div>
      <form id="triagem-resposta" class="answer-form">
        <label for="resposta-livre">Sua resposta</label>
        <textarea id="resposta-livre" class="input" maxlength="500" required placeholder="Escreva aqui...">${Screens.escape(value)}</textarea>
        <button class="btn btn-primary btn-sm">Continuar ${Screens.icon('arrow', 16)}</button>
      </form>`;
  } else {
    const resumo = Triagem.resumo(draft);
    conteudo = `<h2>Revise o pré-diagnóstico</h2><p>Confira o que a oficina vai receber antes de enviar o chamado.</p>
      ${Screens.resumoTriagem(resumo, draft.resumoIA)}
      <details class="history-panel"><summary>Ver perguntas e respostas</summary>${Screens.respostas(Triagem.perguntas(draft.categoria).map((p, i) => ({ pergunta: p.texto, resposta: draft.respostas[i] })))}</details>
      ${Screens.opcaoGemini(draft)}
      <div class="row-actions review-actions"><button class="btn btn-secondary btn-sm" id="btn-editar-triagem">Editar respostas</button><button class="text-button" id="btn-editar-limite">Alterar limite</button><button class="btn btn-primary btn-sm" id="btn-enviar-chamado">Enviar chamado ${Screens.icon('arrow', 16)}</button></div>`;
  }

  return `<div class="screen workspace-screen">
    ${Screens.pageTitle('ASSISTENTE HERMES', 'Triagem do veículo', 'Prepare as informações que ajudam a oficina a investigar o problema.')}
    <ol class="steps" aria-label="Etapas da triagem">${steps.map((label, i) => `<li class="${i === etapa ? 'step-active' : i < etapa ? 'step-done' : ''}" ${i === etapa ? 'aria-current="step"' : ''}><span>${i < etapa ? Screens.icon('check', 14) : i + 1}</span>${label}</li>`).join('')}</ol>
    <div class="triage-grid">
      <section class="flow-panel">
        ${etapa > 0 && etapa < 4 ? `<button class="text-button flow-back" id="btn-voltar-triagem">${Screens.icon('back', 16)} Voltar</button>` : ''}
        ${conteudo}
      </section>
      <aside class="context-panel"><span class="icon-tile">${Screens.icon('spark')}</span><h2>Sua triagem</h2>
        <dl><dt>Veículo</dt><dd>${v ? Screens.escape(Screens.vehicleName(v)) : 'A selecionar'}</dd><dt>Limite</dt><dd>${limite ? `${limite} oficinas` : 'A selecionar'}</dd><dt>Sintoma</dt><dd>${categoria?.nome || 'A selecionar'}</dd></dl>
        <p>Você pode sair e retomar de onde parou neste navegador.</p>
        ${draft ? '<button class="text-button" id="btn-descartar-triagem">Descartar rascunho</button>' : ''}
      </aside>
    </div>
  </div>`;
};

Screens.resumoTriagem = (resumo, resumoIA = '') => `
  ${resumo.alerta ? `<div class="priority-note">${Screens.icon('alert')}<div><strong>Sinal de atenção</strong><p>Se o sintoma comprometer a condução, pare em local seguro e procure assistência antes de continuar.</p></div></div>` : ''}
  <div class="report"><p class="eyebrow">PRÉ-DIAGNÓSTICO</p><h3>Relato do motorista</h3><p>${Screens.multiline(resumo.relato)}</p>
  <h3>O que a oficina pode verificar</h3><p>${Screens.multiline(resumo.inspecao)}</p>
  ${resumoIA ? `<h3>Complemento do Gemini</h3><p>${Screens.multiline(resumoIA)}</p>` : ''}
  <p class="report-note">A oficina confirma a causa e informa o custo após avaliar o veículo.</p></div>`;

Screens.respostas = (items) => `<dl class="answers-list">${items.map(item => `<div><dt>${Screens.escape(item.pergunta)}</dt><dd>${Screens.multiline(item.resposta)}</dd></div>`).join('')}</dl>`;

Screens.opcaoGemini = (draft) => document.documentElement.dataset.gemini === 'enabled' ? `<details class="history-panel gemini-panel">
  <summary>Complemento opcional com Gemini</summary>
  <p>Ao solicitar o complemento, o modelo do veículo e suas respostas serão enviados ao Gemini. Revise os textos antes de compartilhar.</p>
  <button class="btn btn-secondary btn-sm" id="btn-resumir-ia">${Screens.icon('spark', 16)} ${draft.resumoIA ? 'Gerar novamente' : 'Gerar com Gemini'}</button>
  ${draft.resumoIA ? '<button class="text-button" id="btn-remover-ia">Remover complemento</button>' : ''}
  <p id="gemini-status" role="status"></p>
</details>` : '';

Screens.oficinasDoChamado = (chamado, atendimentos, session) => {
  const assinante = DB.isAssinante(session.id);
  const favoritas = assinante ? DB.getFavoritas(session.id) : [];
  return `<section class="flow-panel ofertas-panel" aria-labelledby="ofertas-title">
  <h2 id="ofertas-title">Conversas deste chamado</h2>
  <p>Cada oficina tem uma conversa própria. Abra quantas precisar para comparar os atendimentos.</p>
  <div class="ofertas-grid">${atendimentos.map(atendimento => {
    const oficinaId = atendimento.oficina_id;
    const oficina = DB.getOficinaProfile(oficinaId);
    const nome = Screens.escape(oficina?.nome_oficina || 'Oficina');
    const avaliacoes = DB.getAvaliacoesPublicas(oficinaId);
    const total = avaliacoes.length;
    const media = total ? (avaliacoes.reduce((soma, item) => soma + item.media, 0) / total)
      .toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '';
    const procs = assinante ? DB.getProcedimentosByAtendimento(atendimento.id) : [];
    const favorita = favoritas.includes(oficinaId);
    return `<article class="oferta-card">
      <div class="oferta-header"><span class="icon-tile">${Screens.icon('wrench')}</span><div><h3>${nome}</h3><p class="muted">${total ? `★ ${media} de 5 · ${total} ${total === 1 ? 'avaliação' : 'avaliações'}` : 'Sem avaliações'}</p></div></div>
      <p class="oferta-sobre">${Screens.escape(oficina?.sobre || 'Atendimento automotivo.')}</p>
      <div class="oferta-meta">${Screens.status(chamado, atendimento)}
      ${assinante ? `<button class="text-button" data-oficina-favorita="${Screens.escape(oficinaId)}" aria-pressed="${favorita}">${favorita ? '★ Favorita' : '☆ Favoritar'}</button>` : ''}</div>
      ${procs.length ? `<p class="muted">Serviços registrados <strong>${Screens.money(procs.reduce((soma, p) => soma + (Number(p.custo) || 0), 0))}</strong></p>` : ''}
      <div class="row-actions oferta-actions">
        <button class="text-button" onclick="App.navigate('perfil-oficina', '${Screens.escape(oficinaId)}')" aria-label="Ver perfil de ${nome}">Ver perfil</button>
        <button class="btn btn-primary btn-sm" data-abrir-atendimento="${Screens.escape(atendimento.id)}" onclick="App.navigate('chat-oficina', this.dataset.abrirAtendimento)" aria-label="Abrir conversa com ${nome}">Abrir conversa ${Screens.icon('chat', 16)}</button>
      </div>
    </article>`;
  }).join('')}</div>
</section>`;
};

Screens.detalheChamado = (c, isOficina) => {
  const v = DB.getVeiculoById(c.veiculo_id);
  const session = DB.getSession();
  const participacao = isOficina ? DB.getParticipacaoOficina(c.id, session.id) : null;
  const at = DB.atendimentoConfirmado(participacao) ? participacao : null;
  const conversas = isOficina ? [] : DB.getConversasByChamado(c.id);
  const prioridadeAte = isOficina && !participacao ? DB.prioridadeAte(c, session.id) : null;
  const perguntas = DB.getPerguntasByChamado(c.id);
  const procs = at ? DB.getProcedimentosByAtendimento(at.id) : [];
  const done = c.status === 'concluido';
  const stages = [['Triagem enviada', true], ['Conversas abertas', c.total_oficinas > 0 || done], ['Concluído', done]];
  let proximoPasso = '';
  if (at) {
    proximoPasso = `<button class="btn btn-primary" onclick="App.navigate('chat-oficina', '${Screens.escape(at.id)}')">${Screens.icon('chat', 17)} Abrir conversa</button>`;
  } else if (participacao?.status === 'nao_selecionado') {
    proximoPasso = '<p>Participação encerrada no fluxo anterior do Hermes.</p>';
  } else if (prioridadeAte) {
    proximoPasso = `<p id="acesso-prioritario" data-ate="${prioridadeAte}">Acesso antecipado do Oficina Pro. Se houver vagas, o acesso geral será liberado em até 2 minutos.</p>${Screens.atalhoPlano(session)}`;
  } else if (isOficina && c.recebe_oficinas) {
    proximoPasso = `<p>Ao aceitar, você ocupa uma vaga e abre uma conversa com o motorista.</p><button class="btn btn-primary" data-action="aceitar" data-chamado="${Screens.escape(c.id)}">Aceitar chamado ${Screens.icon('arrow', 17)}</button>`;
  } else if (!isOficina && c.recebe_oficinas) {
    proximoPasso = '<p>Você pode fechar as vagas quando tiver conversas suficientes.</p><button class="btn btn-secondary" id="fechar-aceites">Fechar vagas</button>';
  }
  return `<div class="screen workspace-screen">
    <button class="text-button detail-back" onclick="App.navigate('${isOficina ? 'chamados' : 'home'}')">${Screens.icon('back', 16)} Voltar aos chamados</button>
    ${Screens.pageTitle('ACOMPANHAMENTO', Screens.escape(Screens.vehicleName(v)), `Chamado aberto em ${Screens.formatDate(c.enviado_em || c.created_at)}`, Screens.status(c, participacao))}
    ${conversas.length ? Screens.oficinasDoChamado(c, conversas, session) : ''}
    <div class="triage-grid">
      <section class="flow-panel detail-panel">
        <h2>Pré-diagnóstico</h2>
        ${c.resumo_triagem ? Screens.resumoTriagem(c.resumo_triagem, c.resumo_ia) : `<div class="report"><p>${Screens.multiline(c.diagnostico_ia || 'O resumo ainda não está disponível.')}</p></div>`}
        ${perguntas.length ? `<details class="history-panel"><summary>Perguntas e respostas <span>${perguntas.length}</span></summary>${Screens.respostas(perguntas)}</details>` : ''}
        ${procs.length ? `<div class="procedures"><h3>Procedimentos registrados</h3>${Screens.procedures(procs)}</div>` : ''}
      </section>
      <aside class="context-panel">
        <h2>Andamento</h2>
        <div class="vagas-resumo"><strong>${c.total_oficinas} de ${c.limite_oficinas} oficinas</strong>
          <progress max="${c.limite_oficinas}" value="${c.total_oficinas}" aria-label="Vagas preenchidas"></progress>
          <span>${c.recebe_oficinas ? `${c.vagas_restantes} ${c.vagas_restantes === 1 ? 'vaga disponível' : 'vagas disponíveis'}` : 'Recebimento encerrado'}</span></div>
        <ol class="timeline">${stages.map(([text, concluida]) => `<li class="${concluida ? 'done' : ''}"><span>${concluida ? Screens.icon('check', 12) : ''}</span>${text}</li>`).join('')}</ol>
        ${proximoPasso}
      </aside>
    </div>
  </div>`;
};

Screens.procedures = (procs) => `<dl class="cost-list">
  ${procs.map(p => `<div><dt>${Screens.escape(p.descricao)}</dt><dd>${Screens.money(p.custo)}</dd></div>`).join('')}
  <div class="cost-total"><dt>Total</dt><dd>${Screens.money(procs.reduce((total, p) => total + (Number(p.custo) || 0), 0))}</dd></div>
</dl>`;

Screens.workshopCard = (c, at) => {
  const v = DB.getVeiculoById(c.veiculo_id);
  const motorista = DB.getMotoristaProfile(c.motorista_id);
  const categoria = Triagem.categorias[c.categoria]?.nome || 'Assistência automotiva';
  const relato = c.resumo_triagem?.relato || c.diagnostico_ia || '';
  return `<article class="workshop-card">
    <div class="workshop-card-top"><span class="icon-tile">${Screens.icon('car')}</span>${Screens.status(c, at)}</div>
    <h3>${Screens.escape(Screens.vehicleName(v))}</h3><p class="muted">${Screens.escape(motorista?.nome || 'Motorista')} · ${Screens.escape(categoria)}</p>
    <p class="workshop-excerpt">${Screens.escape(relato.slice(0, 130))}${relato.length > 130 ? '…' : ''}</p>
    ${!at ? `<p class="muted">${c.vagas_restantes} ${c.vagas_restantes === 1 ? 'vaga disponível' : 'vagas disponíveis'}</p>` : ''}
    <div class="workshop-card-bottom"><small>${Screens.timeSince(c.enviado_em || c.created_at)}</small><button class="text-button" onclick="App.navigate('detalhe-oficina', '${Screens.escape(c.id)}')">Ver chamado ${Screens.icon('arrow', 16)}</button></div>
  </article>`;
};

Screens.dashboardOficina = () => {
  const session = DB.getSession();
  const profile = DB.getOficinaProfile(session.id);
  const stats = DB.getStatsOficina(session.id);
  const novos = DB.getChamadosAbertos(session.id);
  const metrics = [
    ['list', novos.length, 'Novos chamados'],
    ['chat', stats.emAndamento, 'Em andamento'],
    ['check', stats.concluidos, 'Concluídos'],
    ['spark', stats.avaliacao ?? '—', 'Avaliação média']
  ];
  return `<div class="screen workspace-screen">
    ${Screens.pageTitle('ÁREA DA OFICINA', Screens.escape(profile?.nome_oficina || 'Painel da oficina'), 'Analise os sintomas e organize os atendimentos da sua oficina.', Screens.atalhoPlano(session))}
    <div class="metrics-strip">${metrics.map(([icon, value, label]) => `<div class="metric-tile"><span class="icon-tile">${Screens.icon(icon)}</span><strong>${value}</strong><span>${label}</span></div>`).join('')}</div>
    ${DB.isAssinante(session.id) ? Screens.painelPro(session.id) : Screens.anuncio(session)}
    <div class="section-heading"><div><h2>Chamados disponíveis</h2><p>Leia o pré-diagnóstico e aceite para abrir uma conversa.</p></div><button class="text-button" onclick="App.navigate('chamados')">Ver todos ${Screens.icon('arrow', 16)}</button></div>
    <div class="workshop-grid">${novos.slice(0, 4).map(c => Screens.workshopCard(c)).join('')}</div>
    ${novos.length ? '' : Screens.empty('list', 'Nenhum chamado disponível', 'Novas solicitações aparecem nesta fila quando os motoristas enviarem uma triagem.') }
  </div>`;
};

Screens.queueCards = (oficinaId) => {
  const novos = DB.getChamadosAbertos(oficinaId);
  const atendimentos = DB.getAtendimentosByOficina(oficinaId).filter(at => at.status !== 'recusado');
  const cards = [...novos.map(c => [c, null]), ...atendimentos.map(at => [DB.getChamadoById(at.chamado_id), at])].filter(([c]) => c);
  return cards.map(([c, at]) => {
    const grupos = { nao_selecionado: 'concluidos', concluido: 'concluidos' };
    const grupo = at ? grupos[at.status] || 'ativos' : 'novos';
    return `<div data-grupo="${grupo}">${Screens.workshopCard(c, at)}</div>`;
  }).join('');
};

Screens.chamadosOficina = () => {
  const groups = [['novos', 'Disponíveis'], ['ativos', 'Em atendimento'], ['concluidos', 'Encerrados']];
  return `<div class="screen workspace-screen">
    ${Screens.pageTitle('ÁREA DA OFICINA', 'Fila de chamados', 'Encontre solicitações por veículo, sintoma ou motorista.')}
    <div class="queue-toolbar">
      <div class="queue-filters" aria-label="Filtrar chamados">${groups.map(([id, label], i) => `<button class="filter-chip" data-fila="${id}" aria-pressed="${i === 0}">${label}</button>`).join('')}</div>
      <label class="queue-search">${Screens.icon('search', 18)}<input class="input" id="busca-chamados" type="search" aria-label="Buscar chamados" placeholder="Buscar chamados"></label>
    </div>
    <div class="workshop-grid">${Screens.queueCards(DB.getSession().id)}</div>
    <div id="fila-vazia" hidden>${Screens.empty('search', 'Nenhum chamado encontrado', 'Os chamados desta etapa aparecem aqui. Ajuste a busca para ver outros resultados.')}</div>
  </div>`;
};

Screens.chatBubble = (m, userId) => {
  const photo = Screens.foto(m.foto_url);
  return `<div class="bubble ${m.remetente_id === userId ? 'bubble-user' : 'bubble-oficina'}" data-msg="${Screens.escape(m.id)}">
    ${photo ? `<img src="${photo}" alt="Imagem anexada à conversa">` : ''}${Screens.multiline(m.conteudo)}
    <span class="bubble-time">${Screens.formatTime(m.enviado_em)}</span></div>`;
};

Screens.chatActions = (at, role) => {
  const id = Screens.escape(at.id);
  if (at.status === 'concluido') return '<span class="status status-green">Atendimento concluído</span>';
  if (at.status === 'aguardando_conclusao') {
    return role === 'oficina'
      ? '<span class="status status-amber">Aguardando confirmação</span>'
      : `<button class="btn btn-primary btn-sm" onclick="App.navigate('avaliar', '${id}')">Confirmar conclusão</button>`;
  }
  return role === 'oficina'
    ? `<button class="btn btn-secondary btn-sm" onclick="App.navigate('procedimento', '${id}')">${Screens.icon('list', 16)} Registrar serviços</button>`
    : '<span class="status status-blue">Em atendimento</span>';
};

Screens.chatOficina = (id) => {
  const at = DB.getAtendimentoById(id);
  const session = DB.getSession();
  const isOficina = session.user_type === 'oficina';
  const c = DB.getChamadoById(at.chamado_id);
  const veiculo = DB.getVeiculoById(c.veiculo_id);
  const contato = isOficina ? DB.getMotoristaProfile(c.motorista_id)?.nome : DB.getOficinaProfile(at.oficina_id)?.nome_oficina;
  const role = isOficina ? 'Motorista' : 'Oficina';
  return `<div class="screen workspace-screen conversation-screen">
    <button class="text-button detail-back" onclick="App.navigate('chats')">${Screens.icon('back', 16)} Todas as conversas</button>
    <div class="conversation-grid">
      <section class="conversation-panel" aria-label="Conversa do atendimento">
        <header class="conversation-heading">
          <span class="icon-tile">${Screens.icon(isOficina ? 'user' : 'wrench')}</span>
          <div><h1>${Screens.escape(contato || role)}</h1><p>${role} · ${Screens.escape(Screens.vehicleName(veiculo))}</p></div>
        </header>
        <div class="chat-messages" id="chat-oficina-messages" role="log" aria-label="Mensagens">
          ${DB.getMsgsByAtendimento(id).map(msg => Screens.chatBubble(msg, session.id)).join('') || Screens.empty('chat', 'A conversa está aberta', 'Envie uma mensagem para combinar a avaliação do veículo.')}
        </div>
        <form id="composer" class="composer" ${at.status === 'concluido' ? 'hidden' : ''}>
          ${isOficina && DB.isAssinante(session.id) ? Screens.respostasRapidas() : ''}
          <div id="chat-attachment" hidden><img id="chat-foto-preview" alt="Prévia do anexo"><button type="button" class="text-button" id="btn-remove-foto">Remover foto</button></div>
          <div class="chat-input-row">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-chat-foto" aria-label="Anexar foto">${Screens.icon('plus')}</button>
            <input type="file" id="chat-foto-input" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden>
            <textarea class="input" id="chat-oficina-input" aria-label="Sua mensagem" placeholder="Escreva uma mensagem..." rows="1" maxlength="2000"></textarea>
            <button class="btn btn-primary btn-sm" id="chat-oficina-send" aria-label="Enviar mensagem">${Screens.icon('arrow')}</button>
          </div>
        </form>
      </section>
      <aside class="context-panel">
        <h2>Atendimento</h2>
        <div id="conversation-state" data-status="${Screens.escape(at.status)}">${Screens.chatActions(at, session.user_type)}</div>
        <div id="chat-procedures"></div>
        <button class="text-button" onclick="App.navigate('${isOficina ? 'detalhe-oficina' : 'aguardando'}', '${Screens.escape(c.id)}')">Ver pré-diagnóstico ${Screens.icon('arrow', 16)}</button>
        ${isOficina ? '' : `<button class="text-button" onclick="App.navigate('perfil-oficina', '${Screens.escape(at.oficina_id)}')">Ver perfil da oficina ${Screens.icon('arrow', 16)}</button>`}
      </aside>
    </div>
  </div>`;
};

Screens.chatsLista = () => {
  const session = DB.getSession();
  const isOficina = session.user_type === 'oficina';
  const atendimentos = isOficina
    ? DB.getAtendimentosByOficina(session.id).filter(at => DB.atendimentoConfirmado(at))
    : DB.getAtendimentosByMotorista(session.id);
  const items = atendimentos.map(at => {
    const c = DB.getChamadoById(at.chamado_id);
    const last = DB.getMsgsByAtendimento(at.id).at(-1);
    const v = c && DB.getVeiculoById(c.veiculo_id);
    const nome = isOficina ? DB.getMotoristaProfile(c?.motorista_id)?.nome : DB.getOficinaProfile(at.oficina_id)?.nome_oficina;
    return { at, c, last, v, nome };
  }).filter(item => item.c).sort((a, b) => (b.last?.enviado_em || b.at.iniciado_em).localeCompare(a.last?.enviado_em || a.at.iniciado_em));
  return `<div class="screen workspace-screen">
    ${Screens.pageTitle('ATENDIMENTOS', 'Conversas', 'Continue a conversa e acompanhe os serviços do atendimento.')}
    <div class="request-list">${items.map(({ at, c, last, v, nome }) => `<button class="request-row conversation-row" data-action="abrir-chat" data-atendimento="${Screens.escape(at.id)}">
      <span class="icon-tile">${Screens.icon('chat')}</span><span class="request-title"><strong>${Screens.escape(nome || (isOficina ? 'Motorista' : 'Oficina'))}</strong><small>${Screens.escape(Screens.vehicleName(v))} · ${Screens.escape(last?.conteudo || (last?.foto_url ? 'Foto anexada' : 'A conversa está aberta'))}</small></span>
      ${Screens.status(c, at)}${Screens.icon('arrow', 16)}</button>`).join('') ||
      Screens.empty('chat', 'Nenhuma conversa ainda', isOficina ? 'Aceite um chamado para iniciar uma conversa.' : 'Cada oficina que aceitar seu chamado abrirá uma conversa.')}</div>
  </div>`;
};

Screens.notificacoes = () => {
  const session = DB.getSession();
  const notifs = DB.getNotifsByUser(session.id);
  return `<div class="screen workspace-screen">
    ${Screens.pageTitle('ATUALIZAÇÕES', 'Avisos', 'Acompanhe novas mensagens e mudanças nos seus chamados.')}
    <div class="request-list">${notifs.map(n => `<article class="request-row notice-row ${n.lida ? '' : 'notice-new'}">
      <span class="icon-tile">${Screens.icon('bell')}</span><div class="request-title"><strong>${Screens.escape(n.titulo)}</strong><p>${Screens.escape(n.texto)} · ${Screens.timeSince(n.created_at)}</p></div>
      ${n.destino && ['aguardando', 'detalhe-oficina', 'chat-oficina'].includes(n.destino.screen) ? `<button class="text-button request-link" onclick="App.navigate('${n.destino.screen}', '${Screens.escape(n.destino.id)}')">Abrir ${Screens.icon('arrow', 16)}</button>` : ''}
    </article>`).join('') || Screens.empty('bell', 'Tudo em dia', 'Novos avisos aparecem aqui.')}</div>
  </div>`;
};
