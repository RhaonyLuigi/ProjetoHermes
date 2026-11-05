# Hermes

Protótipo acadêmico que conecta motoristas e oficinas. O motorista escolhe o limite de oficinas, descreve o sintoma, revisa o pré-diagnóstico e envia um chamado. Cada oficina que aceita ocupa uma vaga e abre uma conversa separada com o motorista.

## Experimentar

Abra `index.html` no Chrome ou Edge e escolha **Entrar como motorista**. Para usar um endereço local estável, execute `node server.mjs` na pasta do projeto e abra [Hermes no navegador](http://127.0.0.1:4173). O servidor usa Node.js 20 ou superior e dispensa instalação de dependências.

1. Em **Iniciar triagem**, escolha um veículo e o limite de oficinas. Responda às perguntas, revise o resumo e envie o chamado.
2. Em **Trocar perfil**, entre como **Oficina Avenida** e aceite o chamado. Repita com **Oficina Central** e **Oficina Horizonte** até o limite escolhido.
3. Volte ao perfil **Motorista**. Abra o chamado para ver as vagas e conversar separadamente com as oficinas. **Fechar vagas** encerra novos aceites e mantém as conversas que já existem.
4. Como oficina, abra a conversa, registre os serviços e solicite a conclusão. Como motorista, confira os valores e confirme a conclusão desse atendimento. Você pode manter os perfis em abas separadas do mesmo navegador.

## Planos de demonstração

- **Motorista gratuito** permite até 3, 4 ou 5 oficinas por chamado.
- **Motorista Plus** remove os anúncios de demonstração, permite até 3, 5, 10 ou 20 oficinas, salva favoritas e mostra os valores registrados de cada oficina no acompanhamento.
- **Oficina Pro** remove os anúncios, oferece respostas rápidas no chat e inclui um painel de desempenho com filtros de 7 e 30 dias. Oficinas Pro têm até 2 minutos de acesso antecipado a chamados novos. As vagas restantes são liberadas antes se todas as assinantes aptas já tiverem aceitado.

Ative ou desative o plano em **Planos**. A simulação fica salva por perfil neste navegador e dispensa pagamento. Chamados enviados mantêm o limite escolhido mesmo após mudar de plano.

## Complemento com Gemini

A triagem guiada usa categorias e perguntas locais. Com uma [chave da API Gemini](https://aistudio.google.com/docs/api-key) e um modelo compatível com [generateContent](https://aistudio.google.com/api-reference/generate-content), a revisão oferece a opção **Gerar com Gemini**. Configure as variáveis `GEMINI_API_KEY` e `GEMINI_MODEL` no terminal que executa `node server.mjs`. Use o identificador do modelo sem o prefixo `models/`.

O servidor usa a chave para solicitar o complemento. Somente ao clicar em gerar, o app envia ao Gemini o modelo e ano do veículo e as respostas da triagem. Use dados fictícios na demonstração e evite escrever dados pessoais no relato. Se a API estiver indisponível, você pode enviar o resumo da triagem guiada.

## Escopo do protótipo

Contas, chamados, mensagens e avaliações são armazenados neste navegador. A sincronização funciona entre abas da mesma origem. Os dados abertos via arquivo e pelo endereço local ficam em armazenamentos separados. A moderação também é local. Uma implantação para motoristas e oficinas reais exige autenticação e armazenamento compartilhado no servidor.
