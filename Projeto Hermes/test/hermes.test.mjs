import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createAppServer } from '../server.mjs';
import { openDatabase } from '../backend/db.mjs';
import { createAccount, issueRecovery } from '../backend/auth.mjs';

const secret = 'senha local para teste';
const profile = (nome) => ({ nome, cidade: 'São Paulo', uf: 'SP', telefone: '(11) 99000-1000' });
const picture = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';

test('contas, capacidade, escopo das conversas e persistência em SQLite', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'hermes-test-'));
  const filename = join(directory, 'hermes.sqlite');
  const db = openDatabase(filename);
  const adminUser = await createAccount(db, { email: 'admin@example.test', senha: secret }, true);
  const server = createAppServer({ db, publicUrl: '' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  function client() {
    let cookie = '';
    async function request(path, data, expected = 200, origin = base) {
      const response = await fetch(base + path, {
        headers: { Cookie: cookie, ...(data === undefined ? {} : { 'Content-Type': 'application/json', Origin: origin }) },
        ...(data === undefined ? {} : { method: 'POST', body: JSON.stringify(data) })
      });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';')[0];
      const payload = response.headers.get('content-type')?.includes('application/json') ? await response.json() : Buffer.from(await response.arrayBuffer());
      if (expected !== null) assert.equal(response.status, expected, `${path}: ${payload?.error || response.status}`);
      return { payload, response };
    }
    return {
      request,
      snapshot: async () => (await request('/api/estado')).payload,
      act: async (name, data, expected) => request('/api/acoes/' + name, data || {}, expected),
      async signup(email, role) {
        const { response } = await request('/api/cadastro', { email, senha: secret, user_type: role });
        assert.match(response.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/);
        return (await this.snapshot()).session.id;
      }
    };
  }

  let id;
  try {
    const visitor = client();
    assert.deepEqual(await visitor.snapshot(), { session: null });
    await visitor.act('mensagem', {}, 401);
    await visitor.request('/api/cadastro', { email: 'intruso@example.test', senha: secret, user_type: 'admin' }, 400);
    await visitor.request('/api/cadastro', { email: 'intruso@example.test', senha: secret, user_type: 'motorista' }, 403, 'https://outra-origem.example');
    await visitor.request('/data/hermes.sqlite', undefined, 404);
    const index = await visitor.request('/');
    assert.match(index.response.headers.get('content-security-policy'), /script-src 'self'/);
    assert.match(index.payload.toString(), /manifest.webmanifest/);
    const manifest = await visitor.request('/manifest.webmanifest');
    assert.equal(JSON.parse(manifest.payload).display, 'standalone');
    await visitor.request('/img/icon-192.png');
    await visitor.request('/img/icon-512.png');

    const admin = client();
    await admin.request('/api/login', { email: adminUser.email, senha: secret });
    const driver = client();
    const driverId = await driver.signup('motorista@example.test', 'motorista');
    await driver.act('perfil', profile('Motorista Teste'));
    await driver.act('veiculo', { marca: 'Honda', modelo: 'Civic', ano: '2020', placa: 'ABC-1234', cor: 'Prata' });
    const car = (await driver.snapshot()).veiculos[0];
    id = randomUUID();
    const draft = { id, veiculoId: car.id, limiteOficinas: 3, categoria: 'freios', respostas: ['Chiado', 'Hoje', 'Sempre', 'Ao frear'], resumoIA: '' };
    await driver.act('publicar', { ...draft, limiteOficinas: 20 }, 400);
    await driver.act('publicar', draft);
    await driver.act('publicar', draft);
    assert.equal((await driver.snapshot()).chamados.length, 1);

    const shops = [];
    for (let i = 0; i < 5; i++) {
      const shop = client();
      shop.id = await shop.signup(`oficina${i}@example.test`, 'oficina');
      await shop.act('perfil', { ...profile(`Oficina ${i}`), cnpj: String(i + 10000000000000), sobre: 'Serviços', ...(i === 4 ? { cidade: 'Campinas' } : {}) });
      await shop.act('aceitar', { chamadoId: id }, 403);
      await admin.act('admin-verificacao', { userId: shop.id, status: 'aprovada' });
      shops.push(shop);
    }
    await shops[4].act('aceitar', { chamadoId: id }, 404);
    assert.equal((await shops[4].snapshot()).chamados.length, 0);
    const pool = await shops[0].snapshot();
    assert.equal(pool.veiculos[0].placa, undefined);
    assert.equal(pool.motorista_profiles.length, 0);
    const attempts = await Promise.all(shops.slice(0, 4).map(shop => shop.act('aceitar', { chamadoId: id }, null)));
    assert.equal(attempts.filter(a => a.response.status === 200).length, 3);
    assert.equal(attempts.filter(a => a.response.status === 409).length, 1);
    const winnerIndex = attempts.findIndex(a => a.response.status === 200);
    const winner = shops[winnerIndex];
    const at = attempts[winnerIndex].payload.result.id;
    const other = shops.find((shop, i) => i !== winnerIndex && attempts[i]?.response.status === 200);
    assert.equal((await winner.act('aceitar', { chamadoId: id })).payload.result.id, at);
    const assigned = (await driver.snapshot()).chamados[0];
    assert.equal(assigned.total_oficinas, 3);
    assert.equal(assigned.recebe_oficinas, false);
    await other.request('/api/conversas/' + at, undefined, 404);

    const messageId = randomUUID();
    await driver.act('mensagem', { id: messageId, atendimentoId: at, conteudo: '<b>Relato privado</b>', foto: picture });
    await driver.act('mensagem', { id: messageId, atendimentoId: at, conteudo: '<b>Relato privado</b>', foto: picture });
    const messages = (await winner.request('/api/conversas/' + at)).payload.messages;
    assert.equal(messages.length, 1);
    assert.equal(messages[0].conteudo, '<b>Relato privado</b>');
    assert.match((await winner.request(messages[0].foto_url)).response.headers.get('content-type'), /image\/png/);
    await other.request(messages[0].foto_url, undefined, 404);
    await admin.request('/api/conversas/' + at, undefined, 404);
    await driver.act('concluir', { atendimentoId: at }, 409);
    await winner.act('servico', { atendimentoId: at, id: randomUUID(), descricao: 'Revisão', centavos: 12050 });
    await winner.act('solicitar-conclusao', { atendimentoId: at });
    await driver.act('concluir', { atendimentoId: at, notas: { transparencia: 5, prazo: 5, qualidade: 5, organizacao: 5 }, comentario: 'Atendimento claro.' });
    await winner.act('mensagem', { id: randomUUID(), atendimentoId: at, conteudo: 'Depois do encerramento' }, 409);
    assert.equal((await driver.snapshot()).chamados[0].status, 'em_atendimento');

    await admin.act('admin-anuncio', { publico: 'motorista', titulo: 'Parceiro', texto: 'Campanha', link: 'javascript:alert(1)' }, 400);
    await admin.act('admin-anuncio', { publico: 'motorista', titulo: 'Parceiro', texto: 'Campanha', link: 'https://example.test' });
    assert.equal((await driver.snapshot()).anuncio.titulo, 'Parceiro');
    await driver.act('admin-assinatura', { userId: driverId, ativa: true }, 403);
    await driver.act('solicitar-plano');
    assert.equal((await driver.snapshot()).plano.ativo, false);
    await admin.act('admin-assinatura', { userId: driverId, ativa: true });
    assert.equal((await driver.snapshot()).anuncio, null);
    await driver.act('favorita', { oficinaId: winner.id, salvar: true });
    assert.deepEqual((await driver.snapshot()).favoritas, [winner.id]);
    await admin.act('admin-assinatura', { userId: winner.id, ativa: true });
    const premiumCall = randomUUID();
    await driver.act('publicar', { ...draft, id: premiumCall, limiteOficinas: 20 });
    await other.act('aceitar', { chamadoId: premiumCall }, 409);
    await winner.act('aceitar', { chamadoId: premiumCall });
    await other.act('aceitar', { chamadoId: premiumCall });
    await driver.act('fechar-vagas', { chamadoId: premiumCall });
    assert.equal((await driver.snapshot()).chamados.find(c => c.id === premiumCall).total_oficinas, 2);
    await admin.act('admin-assinatura', { userId: driverId, ativa: false });
    assert.equal((await driver.snapshot()).chamados.find(c => c.id === premiumCall).limite_oficinas, 20);
    await winner.act('atualizar-perfil', { ...profile('Oficina atualizada'), cnpj: String(winnerIndex + 10000000000000), sobre: 'Serviços' });
    assert.equal((await winner.snapshot()).oficina_profiles[0].verificacao, 'pendente');
    assert.equal((await winner.request('/api/conversas/' + at)).payload.messages.length, 1);
    assert.ok(db.get("SELECT COUNT(*) AS total FROM auditoria WHERE acao='admin-assinatura'").total >= 3);

    const recovery = issueRecovery(db, 'motorista@example.test');
    await visitor.request('/api/recuperar', { token: recovery, senha: 'nova senha local segura' });
    assert.deepEqual(await driver.snapshot(), { session: null });
    await visitor.request('/api/recuperar', { token: recovery, senha: 'outra senha local segura' }, 400);
    await visitor.request('/api/login', { email: 'motorista@example.test', senha: 'nova senha local segura' });
    assert.equal((await visitor.snapshot()).session.id, driverId);
  } finally {
    await new Promise(resolve => server.close(resolve));
    const reopened = openDatabase(filename);
    try {
      if (id) assert.equal(reopened.get('SELECT COUNT(*) AS total FROM chamados WHERE id=?', id).total, 1);
    } finally {
      reopened.close();
      for (const suffix of ['', '-wal', '-shm']) rmSync(filename + suffix, { force: true });
      rmdirSync(directory);
    }
  }
});
