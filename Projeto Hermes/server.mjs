import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { openDatabase } from './backend/db.mjs';
import { createAccount, endSession, login, resetPassword, sessionCookie, sessionUser } from './backend/auth.mjs';
import { action, chatMessages, photo, state } from './backend/marketplace.mjs';
import { geminiEnabled, summary } from './backend/gemini.mjs';
import { HttpError, role } from './backend/validation.mjs';

const types = {
  html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8',
  svg: 'image/svg+xml', png: 'image/png', webmanifest: 'application/manifest+json'
};

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

async function readJson(req, limit) {
  if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    req.resume();
    throw new HttpError(415, 'Formato de dados inválido.');
  }
  if (Number(req.headers['content-length']) > limit) {
    req.resume();
    throw new HttpError(413, 'O envio excede o tamanho permitido.');
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > limit) {
      req.resume();
      throw new HttpError(413, 'O envio excede o tamanho permitido.');
    }
    chunks.push(chunk);
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch { throw new HttpError(400, 'Dados inválidos.'); }
}

function limiter() {
  const buckets = new Map();
  return (key, max, duration) => {
    const now = Date.now();
    if (buckets.size >= 5000) {
      for (const [k, value] of buckets) if (value.until <= now) buckets.delete(k);
      if (buckets.size >= 5000 && !buckets.has(key)) throw new HttpError(429, 'Tente novamente em alguns minutos.');
    }
    const old = buckets.get(key);
    const value = old?.until > now ? old : { count: 0, until: now + duration };
    if (value.count >= max) throw new HttpError(429, 'Muitas tentativas. Tente novamente em alguns minutos.');
    value.count++;
    buckets.set(key, value);
  };
}

export function createAppServer({ db = openDatabase(), publicUrl = process.env.PUBLIC_URL } = {}) {
  const base = publicUrl ? new URL(publicUrl) : null;
  if (base && (base.protocol !== 'https:' || base.pathname !== '/' || base.search || base.hash || base.username || base.password)) {
    throw new Error('PUBLIC_URL deve ser a origem HTTPS do app.');
  }
  const rateLimit = limiter();
  let pendingAuth = 0;
  const server = createServer({ requestTimeout: 20000, headersTimeout: 10000 }, async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self'");
    if (base) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    try {
      const host = req.headers.host || '';
      if (base ? host !== base.host : !/^(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(host)) {
        throw new HttpError(403, 'Use o endereço configurado do Hermes.');
      }
      if (!req.url?.startsWith('/') || req.url.startsWith('//')) throw new HttpError(400, 'Endereço inválido.');
      const origin = base?.origin || `http://${host}`;
      const url = new URL(req.url, origin);
      const path = url.pathname;
      if (req.method === 'GET' && path === '/api/health') {
        db.get('SELECT 1');
        return json(res, 200, { ok: true });
      }
      if (path.startsWith('/api/')) {
        const user = sessionUser(db, req);
        if (req.method === 'GET' && path === '/api/estado') return json(res, 200, state(db, user));
        if (req.method === 'POST') {
          if (req.headers.origin !== origin) throw new HttpError(403, 'Origem inválida.');
          if (['/api/cadastro', '/api/login', '/api/recuperar'].includes(path)) {
            const data = await readJson(req, 6000);
            const ip = base && typeof req.headers['x-forwarded-for'] === 'string'
              ? req.headers['x-forwarded-for'].split(',').at(-1).trim() : req.socket.remoteAddress;
            rateLimit('ip:' + ip, 35, 15 * 60000);
            if (typeof data.email === 'string') rateLimit('account:' + data.email.trim().toLowerCase().slice(0, 254), 8, 15 * 60000);
            if (pendingAuth >= 8) throw new HttpError(429, 'Muitas tentativas simultâneas. Tente novamente.');
            pendingAuth++;
            try {
              if (path === '/api/recuperar') {
                await resetPassword(db, data);
                res.setHeader('Set-Cookie', sessionCookie(db, null, Boolean(base)));
                return json(res, 200, { ok: true });
              }
              const account = path === '/api/cadastro' ? await createAccount(db, data) : await login(db, data);
              endSession(db, req);
              res.setHeader('Set-Cookie', sessionCookie(db, account, Boolean(base)));
              return json(res, 200, { ok: true });
            } finally { pendingAuth--; }
          }
          if (path === '/api/sair') {
            await readJson(req, 256);
            endSession(db, req);
            res.setHeader('Set-Cookie', sessionCookie(db, null, Boolean(base)));
            return json(res, 200, { ok: true });
          }
        }
        if (!user) throw new HttpError(401, 'Entre na sua conta para continuar.');
        const chat = path.match(/^\/api\/conversas\/([a-f0-9-]+)$/i);
        if (req.method === 'GET' && chat) return json(res, 200, chatMessages(db, user, chat[1], url.searchParams));
        const pic = path.match(/^\/api\/fotos\/(mensagem|perfil)\/([a-f0-9-]+)$/i);
        if (req.method === 'GET' && pic) {
          const image = photo(db, user, pic[1], pic[2]);
          res.writeHead(200, { 'Content-Type': image.foto_tipo, 'Cache-Control': 'private, no-store' });
          return res.end(image.foto);
        }
        if (req.method === 'POST' && path === '/api/resumo') {
          role(user, 'motorista');
          rateLimit('gemini:' + user.id, 5, 60 * 60000);
          return json(res, 200, await summary(await readJson(req, 16384)));
        }
        const command = path.match(/^\/api\/acoes\/([a-z-]+)$/);
        if (req.method === 'POST' && command) {
          rateLimit('write:' + user.id, 100, 60000);
          const large = ['mensagem', 'foto-perfil', 'perfil'].includes(command[1]);
          const data = await readJson(req, large ? 2_900_000 : 16_384);
          const result = action(db, user, command[1], data);
          return json(res, 200, { result: result ?? null, state: state(db, user) });
        }
        throw new HttpError(404, 'Rota não encontrada.');
      }

      const filename = path === '/' ? '/index.html' : path;
      if (!['GET', 'HEAD'].includes(req.method) ||
          !/^\/(?:index\.html|offline\.html|manifest\.webmanifest|sw\.js|(?:css|js|img)\/[a-z0-9-]+\.(?:css|js|svg|png))$/.test(filename)) {
        throw new HttpError(404, 'Arquivo não encontrado.');
      }
      let content;
      try { content = await readFile(new URL('.' + filename, import.meta.url)); }
      catch (error) {
        if (error.code === 'ENOENT') throw new HttpError(404, 'Arquivo não encontrado.');
        throw error;
      }
      const type = types[filename.split('.').at(-1)];
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': filename.endsWith('.html') ? 'no-store' : 'no-cache' });
      if (req.method === 'HEAD') return res.end();
      return res.end(filename === '/index.html' && geminiEnabled
        ? content.toString('utf8').replace('<html lang="pt-BR">', '<html lang="pt-BR" data-gemini="enabled">') : content);
    } catch (error) {
      if (res.headersSent) return res.end();
      if (!req.complete) req.resume();
      if (error instanceof HttpError) return json(res, error.status, { error: error.message });
      console.error('Falha no Hermes', error.code || error.name);
      return json(res, 500, { error: 'O Hermes encontrou um erro. Tente novamente.' });
    }
  });
  server.on('close', () => db.close());
  return server;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const port = Number(process.env.PORT || 4173);
  const host = process.env.HOST || (process.env.PUBLIC_URL ? '0.0.0.0' : '127.0.0.1');
  const server = createAppServer();
  server.listen(port, host, () => console.log(`Hermes disponível em ${process.env.PUBLIC_URL || `http://${host}:${port}`}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
}
