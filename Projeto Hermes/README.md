# Hermes

Protótipo acadêmico que conecta motoristas e oficinas. O motorista descreve o sintoma, revisa o pré-diagnóstico e envia um chamado. Várias oficinas podem consultar o relato e oferecer atendimento. O motorista compara as opções e escolhe a oficina com quem vai conversar.

## Experimentar

Abra `index.html` no Chrome ou Edge e escolha **Entrar como motorista**. Para usar um endereço local estável, execute `node server.mjs` na pasta do projeto e abra [Hermes no navegador](http://127.0.0.1:4173). O servidor usa Node.js 20 ou superior e dispensa instalação de dependências.

1. Em **Iniciar triagem**, escolha um veículo e responda às perguntas. Revise o resumo e envie o chamado.
2. Em **Trocar perfil**, escolha **Oficina Avenida**. Abra o chamado e clique em **Tenho interesse**. Repita como **Oficina Central** para oferecer uma segunda opção ao mesmo motorista.
3. Volte ao perfil **Motorista**. Abra o chamado, compare as oficinas interessadas e escolha uma para iniciar a conversa.
4. Como oficina escolhida, abra **Conversas** para responder. Registre os serviços e solicite a conclusão. Como motorista, confira os valores, confirme e, se quiser, avalie. Você pode manter os perfis em abas separadas do mesmo navegador.

## Complemento com Gemini

A triagem guiada usa categorias e perguntas locais. Com uma [chave da API Gemini](https://aistudio.google.com/docs/api-key) e um modelo compatível com [generateContent](https://aistudio.google.com/api-reference/generate-content), a revisão oferece a opção **Gerar com Gemini**. Configure as variáveis `GEMINI_API_KEY` e `GEMINI_MODEL` no terminal que executa `node server.mjs`. Use o identificador do modelo sem o prefixo `models/`.

O servidor usa a chave para solicitar o complemento. Somente ao clicar em gerar, o app envia ao Gemini o modelo e ano do veículo e as respostas da triagem. Use dados fictícios na demonstração e evite escrever dados pessoais no relato. Se a API estiver indisponível, você pode enviar o resumo da triagem guiada.

## Escopo do protótipo

Contas, chamados, mensagens e avaliações são armazenados neste navegador. A sincronização funciona entre abas da mesma origem. Os dados abertos via arquivo e pelo endereço local ficam em armazenamentos separados. A moderação também é local. Uma implantação para motoristas e oficinas reais exige autenticação e armazenamento compartilhado no servidor.
