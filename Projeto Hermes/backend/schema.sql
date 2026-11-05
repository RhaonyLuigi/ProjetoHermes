CREATE TABLE usuarios (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  senha TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('motorista','oficina','admin')),
  criado_em TEXT NOT NULL
);
CREATE TABLE sessoes (
  hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_em INTEGER NOT NULL
);
CREATE INDEX sessoes_user ON sessoes(user_id);
CREATE TABLE recuperacoes (
  hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_em INTEGER NOT NULL
);
CREATE TABLE perfis (
  user_id TEXT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  cnpj TEXT UNIQUE,
  sobre TEXT,
  cidade TEXT NOT NULL,
  uf TEXT NOT NULL,
  localidade TEXT NOT NULL,
  verificacao TEXT CHECK (verificacao IN ('pendente','aprovada','suspensa')),
  foto BLOB,
  foto_tipo TEXT
);
CREATE INDEX perfis_localidade ON perfis(localidade, verificacao);
CREATE TABLE veiculos (
  id TEXT PRIMARY KEY,
  motorista_id TEXT NOT NULL REFERENCES usuarios(id),
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano TEXT NOT NULL,
  placa TEXT NOT NULL,
  cor TEXT NOT NULL,
  UNIQUE (motorista_id, placa)
);
CREATE TABLE chamados (
  id TEXT PRIMARY KEY,
  motorista_id TEXT NOT NULL REFERENCES usuarios(id),
  veiculo_id TEXT NOT NULL REFERENCES veiculos(id),
  localidade TEXT NOT NULL,
  categoria TEXT NOT NULL,
  limite_oficinas INTEGER NOT NULL CHECK (limite_oficinas IN (3,4,5,10,20)),
  resumo_triagem TEXT NOT NULL,
  resumo_ia TEXT NOT NULL,
  perguntas TEXT NOT NULL,
  aceites_encerrados INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX chamados_motorista ON chamados(motorista_id, created_at);
CREATE INDEX chamados_localidade ON chamados(localidade, created_at);
CREATE TABLE atendimentos (
  id TEXT PRIMARY KEY,
  chamado_id TEXT NOT NULL REFERENCES chamados(id),
  oficina_id TEXT NOT NULL REFERENCES usuarios(id),
  status TEXT NOT NULL CHECK (status IN ('aceito','aguardando_conclusao','concluido')),
  iniciado_em TEXT NOT NULL,
  concluido_em TEXT,
  UNIQUE (chamado_id, oficina_id)
);
CREATE INDEX atendimentos_oficina ON atendimentos(oficina_id, iniciado_em);
CREATE VIEW chamados_andamento AS
SELECT c.*, COUNT(a.id) AS total_oficinas,
  c.limite_oficinas - COUNT(a.id) AS vagas_restantes,
  CASE
    WHEN COUNT(a.id) > 0 AND SUM(a.status <> 'concluido') = 0 THEN 'concluido'
    WHEN COUNT(a.id) > 0 THEN 'em_atendimento'
    WHEN c.aceites_encerrados = 1 THEN 'encerrado'
    ELSE 'aguardando'
  END AS status
FROM chamados c LEFT JOIN atendimentos a ON a.chamado_id = c.id GROUP BY c.id;
CREATE TABLE mensagens (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  atendimento_id TEXT NOT NULL REFERENCES atendimentos(id),
  remetente_id TEXT NOT NULL REFERENCES usuarios(id),
  tipo_remetente TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  foto BLOB,
  foto_tipo TEXT,
  enviado_em TEXT NOT NULL
);
CREATE INDEX mensagens_chat ON mensagens(atendimento_id, seq);
CREATE TABLE procedimentos (
  id TEXT PRIMARY KEY,
  atendimento_id TEXT NOT NULL REFERENCES atendimentos(id),
  descricao TEXT NOT NULL,
  custo_centavos INTEGER NOT NULL CHECK (custo_centavos BETWEEN 0 AND 100000000),
  created_at TEXT NOT NULL
);
CREATE INDEX procedimentos_chat ON procedimentos(atendimento_id, created_at);
CREATE TABLE avaliacoes (
  id TEXT PRIMARY KEY,
  atendimento_id TEXT NOT NULL UNIQUE REFERENCES atendimentos(id),
  oficina_id TEXT NOT NULL REFERENCES usuarios(id),
  motorista_id TEXT NOT NULL REFERENCES usuarios(id),
  notas TEXT NOT NULL,
  media REAL NOT NULL,
  comentario TEXT NOT NULL,
  resposta_oficina TEXT,
  comentario_adm TEXT,
  revisao_solicitada INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'publica',
  created_at TEXT NOT NULL
);
CREATE INDEX avaliacoes_oficina ON avaliacoes(oficina_id, created_at);
CREATE TABLE notificacoes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  texto TEXT NOT NULL,
  destino TEXT NOT NULL,
  lida INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX notificacoes_user ON notificacoes(user_id, created_at);
CREATE TABLE assinaturas (
  user_id TEXT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  solicitada_em TEXT,
  expira_em INTEGER
);
CREATE TABLE favoritas (
  motorista_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  oficina_id TEXT NOT NULL REFERENCES usuarios(id),
  PRIMARY KEY (motorista_id, oficina_id)
);
CREATE TABLE anuncios (
  publico TEXT PRIMARY KEY CHECK (publico IN ('motorista','oficina')),
  titulo TEXT NOT NULL,
  texto TEXT NOT NULL,
  link TEXT NOT NULL
);
