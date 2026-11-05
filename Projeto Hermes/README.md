# Hermes

Aplicativo de assistência automotiva com servidor Node.js e banco SQLite persistente. Motoristas e oficinas usam contas próprias. Cada oficina aprovada da mesma cidade pode aceitar um chamado enquanto houver vagas. O aceite abre uma conversa privada, com fotos, serviços registrados e conclusão individual.

## Rodar no computador

Na pasta do projeto, execute o comando abaixo com Node.js 24 ou superior. O Hermes cria o banco em `data/hermes.sqlite` e funciona sem instalar bibliotecas.

```powershell
npm start
```

Abra [Hermes local](http://127.0.0.1:4173) e use **Criar conta**. Para entrar como motorista e oficina ao mesmo tempo, use perfis diferentes do navegador ou uma janela anônima. Escolha a mesma cidade e UF nas duas contas.

## Administração

No PowerShell, crie uma conta administrativa com um e-mail seu e uma senha privada de pelo menos 12 caracteres. O comando pede a senha no terminal.

```powershell
$env:HERMES_ADMIN_PASSWORD = Read-Host 'Senha do administrador' -MaskInput
try {
  npm run admin -- criar seu-email@exemplo.com
} finally {
  Remove-Item Env:HERMES_ADMIN_PASSWORD
}
```

Entre com essa conta e abra **Gestão**.

- **Oficinas** começam em análise. Após conferir os dados da empresa, aprove a oficina para liberar os chamados da região.
- **Assinaturas** são solicitadas pelo perfil do cliente e confirmadas pela administração. A ativação dura 30 dias e pode ser renovada ou desativada. O sistema aplica os benefícios no servidor. A cobrança automática depende de escolher e integrar um provedor de pagamentos.
- **Anúncios** aceitam título, texto e link HTTPS opcional. Há um espaço no painel de motoristas gratuitos e outro no painel de oficinas gratuitas.
- **Revisões** permite tratar avaliações encaminhadas por oficinas. As conversas privadas ficam restritas a quem participa do atendimento.

### Recuperação e backup

```powershell
npm run admin -- recuperar seu-email@exemplo.com
npm run admin -- backup caminho/do/backup.sqlite
```

O comando de recuperação gera um link privado de uso único que vence em 30 minutos. Entregue-o ao titular depois de confirmar a identidade. A redefinição revoga as sessões antigas. O backup precisa de um caminho novo.

## Instalar no celular

O Hermes é um aplicativo web instalável. Em um endereço HTTPS, abra-o no navegador do celular e use **Instalar app** ou **Adicionar à Tela de Início**. O servidor é necessário para carregar contas, enviar chamados e trocar mensagens. [Instalação de aplicativos web](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)

## Disponibilizar para outras pessoas

Execute `npm start` em um servidor Node com HTTPS e um volume persistente para o arquivo do banco. Configure `PUBLIC_URL` com a origem HTTPS, sem caminho, e `DATABASE_PATH` com o caminho do volume. A instância do Hermes deve atender atrás do proxy HTTPS do provedor. O app usa uma instância com o SQLite no disco local. O GitHub Pages serve arquivos estáticos e a versão com servidor precisa de uma hospedagem que execute Node.

`.env.example` documenta as opções. Mantenha o banco, os backups e as variáveis de ambiente fora do repositório público. As contas e chamados da versão anterior eram dados do navegador. A versão com servidor começa com contas cadastradas no banco.

O complemento com Gemini é opcional. Defina `GEMINI_API_KEY` e `GEMINI_MODEL` no ambiente para habilitar a opção na revisão. A triagem guiada funciona com perguntas locais. [Documentação da API Gemini](https://aistudio.google.com/api-reference/generate-content)

## Verificar o servidor

`npm test` executa o cenário de integração em um banco temporário. Ele verifica isolamento das conversas, limite de vagas, permissões, planos, anúncios, redefinição de senha e persistência.
