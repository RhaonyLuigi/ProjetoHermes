Screens.atalhoPlano = (session) => `<button class="btn btn-secondary btn-sm plan-link" onclick="App.navigate('planos')">${Screens.icon('spark', 16)} ${DB.isAssinante(session.id) ? 'Meu plano' : 'Ver planos'}</button>`;

Screens.planos = (session) => {
  const oficina = session.user_type === 'oficina';
  const ativo = DB.isAssinante(session.id);
  const nome = oficina ? 'Oficina Pro' : 'Motorista Plus';
  const gratuito = oficina
    ? ['Fila de chamados e chat com motoristas', 'Painel básico de atendimentos', 'Acesso aos chamados após a janela de prioridade, quando houver']
    : ['Escolha até 3, 4 ou 5 oficinas por chamado', 'Converse com todas as oficinas que aceitarem', 'Triagem guiada e histórico de atendimentos'];
  const pago = oficina
    ? ['Experiência sem anúncios', 'Acesso antecipado a chamados novos por até 2 minutos', 'Painel com métricas de 7 ou 30 dias', 'Respostas rápidas no chat']
    : ['Experiência sem anúncios', 'Escolha até 3, 5, 10 ou 20 oficinas por chamado', 'Salve oficinas favoritas', 'Compare valores registrados sem abrir cada conversa'];
  const lista = itens => `<ul class="plano-beneficios">${itens.map(texto => `<li>${Screens.icon('check', 16)} ${texto}</li>`).join('')}</ul>`;
  return `<div class="screen workspace-screen">
    ${Screens.pageTitle('ASSINATURAS', 'Planos Hermes', 'Compare os benefícios e experimente os planos com o seu perfil atual.')}
    <div class="plano-grid">
      <section class="plano-card">
        <span class="eyebrow">ESSENCIAL</span><h2>Gratuito</h2><p>O atendimento do Hermes com anúncios de demonstração.</p>
        ${lista(gratuito)}
        ${ativo ? '<button class="btn btn-secondary" id="alternar-plano">Voltar ao gratuito</button>' : '<span class="status status-green">Seu plano atual</span>'}
      </section>
      <section class="plano-card plano-destaque">
        <span class="eyebrow">DEMONSTRAÇÃO</span><h2>${nome}</h2><p>Recursos extras para o seu perfil, sem cobrança durante a demonstração.</p>
        ${lista(pago)}
        ${ativo ? '<span class="status status-green">Seu plano atual</span>' : `<button class="btn btn-accent" id="alternar-plano">Ativar ${nome} ${Screens.icon('arrow', 16)}</button>`}
      </section>
    </div>
    <p class="muted plano-nota">A ativação é simulada e fica salva neste navegador. ${oficina ? 'O acesso antecipado dura até dois minutos quando ainda há uma oficina assinante apta a aceitar o chamado.' : 'Cada chamado mantém o limite escolhido no envio.'}</p>
  </div>`;
};

Screens.anuncio = (session) => {
  if (DB.isAssinante(session.id)) return '';
  const oficina = session.user_type === 'oficina';
  return `<aside class="anuncio-demo" aria-label="Anúncio de demonstração">
    <span class="icon-tile">${Screens.icon(oficina ? 'wrench' : 'car')}</span>
    <div><span class="eyebrow">PUBLICIDADE · DEMONSTRAÇÃO</span><strong>${oficina ? 'Equipamentos para o dia a dia da oficina' : 'Check-up antes de pegar a estrada'}</strong></div>
    <button class="text-button" onclick="App.navigate('planos')">Remover anúncios ${Screens.icon('arrow', 16)}</button>
  </aside>`;
};

Screens.favoritas = (session) => {
  if (!DB.isAssinante(session.id)) return '';
  const oficinas = DB.getFavoritas(session.id).map(id => DB.getOficinaProfile(id)).filter(Boolean);
  return `<div class="favoritas-panel"><h3>Oficinas favoritas</h3>
    ${oficinas.map(oficina => `<button class="text-button" onclick="App.navigate('perfil-oficina', '${Screens.escape(oficina.user_id)}')">${Screens.escape(oficina.nome_oficina)} ${Screens.icon('arrow', 16)}</button>`).join('')
    || '<p class="muted">Favorite uma oficina no acompanhamento de um chamado para encontrá-la aqui.</p>'}</div>`;
};

Screens.metricasPro = (oficinaId, dias) => {
  const inicio = Date.now() - dias * 86400000;
  const noPeriodo = data => Date.parse(data) >= inicio;
  const atendimentos = DB.getAtendimentosByOficina(oficinaId).filter(at => DB.atendimentoConfirmado(at));
  const conversas = atendimentos.filter(at => at.status === 'aceito').length;
  const aguardando = atendimentos.filter(at => at.status === 'aguardando_conclusao').length;
  const mensagens = atendimentos.flatMap(at => DB.getMsgsByAtendimento(at.id)).filter(msg => noPeriodo(msg.enviado_em)).length;
  const servicos = atendimentos.flatMap(at => DB.getProcedimentosByAtendimento(at.id)).filter(p => noPeriodo(p.created_at));
  const valores = servicos.reduce((soma, p) => soma + (Number(p.custo) || 0), 0);
  const metricas = [
    ['Atendimentos iniciados', atendimentos.filter(at => noPeriodo(at.iniciado_em)).length],
    ['Atendimentos concluídos', atendimentos.filter(at => noPeriodo(at.concluido_em)).length],
    ['Mensagens trocadas', mensagens],
    ['Serviços registrados', Screens.money(valores)]
  ];
  return `<div class="pro-metricas">${metricas.map(([label, valor]) => `<div><strong>${valor}</strong><span>${label}</span></div>`).join('')}</div>
    <p class="muted">Agora: ${conversas} em conversa · ${aguardando} aguardando confirmação.</p>`;
};

Screens.painelPro = (oficinaId) => `<section class="flow-panel pro-painel">
  <div class="section-heading"><div><p class="eyebrow">OFICINA PRO</p><h2>Painel de desempenho</h2><p>Acompanhe a atividade da sua oficina no período.</p></div>
    <div class="queue-filters" aria-label="Período do painel"><button class="filter-chip" data-periodo-painel="7" aria-pressed="true">7 dias</button><button class="filter-chip" data-periodo-painel="30" aria-pressed="false">30 dias</button></div></div>
  <div id="painel-pro-metricas" aria-live="polite">${Screens.metricasPro(oficinaId, 7)}</div>
</section>`;

Screens.respostasRapidas = () => {
  const respostas = [
    ['Recebemos seu relato', 'Olá! Recebemos seu relato e podemos conversar sobre o veículo.'],
    ['Combinar horário', 'Qual dia e horário funcionam melhor para você?'],
    ['Pedir detalhes', 'Você pode descrever quando o sintoma aparece e se houve alguma manutenção recente?']
  ];
  return `<details class="respostas-rapidas"><summary>Respostas rápidas</summary><div class="queue-filters">
    ${respostas.map(([label, texto]) => `<button type="button" class="filter-chip" data-resposta-rapida="${Screens.escape(texto)}">${label}</button>`).join('')}</div></details>`;
};
