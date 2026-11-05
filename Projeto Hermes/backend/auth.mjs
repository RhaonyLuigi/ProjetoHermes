import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { id, now } from './db.mjs';
import { email, HttpError } from './validation.mjs';

const scrypt = promisify(scryptCallback);
const DAY = 86400000;
const sessionLifetime = 14 * DAY;
const derive = (password, salt) => scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 48 * 1024 * 1024 });
const token = () => randomBytes(32).toString('base64url');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const cookieToken = (req) => req.headers.cookie?.match(/(?:^|; )hermes_session=([a-zA-Z0-9_-]{43})(?:;|$)/)?.[1];

async function hashPassword(value) {
  if (typeof value !== 'string' || value.length < 12 || value.length > 128) {
    throw new HttpError(400, 'A senha deve ter de 12 a 128 caracteres.');
  }
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${(await derive(value, salt)).toString('hex')}`;
}

export async function createAccount(db, data, isAdmin = false) {
  const address = email(data.email);
  const role = isAdmin ? 'admin' : data.user_type;
  if (!['motorista', 'oficina', ...(isAdmin ? ['admin'] : [])].includes(role)) throw new HttpError(400, 'Selecione um tipo de conta.');
  if (db.get('SELECT 1 FROM usuarios WHERE email=?', address)) throw new HttpError(409, 'Já existe uma conta com esse e-mail.');
  const password = await hashPassword(data.senha);
  const user = { id: id(), email: address, user_type: role };
  try {
    db.run('INSERT INTO usuarios(id,email,senha,user_type,criado_em) VALUES(?,?,?,?,?)', user.id, address, password, role, now());
  } catch (error) {
    if (db.get('SELECT 1 FROM usuarios WHERE email=?', address)) throw new HttpError(409, 'Já existe uma conta com esse e-mail.');
    throw error;
  }
  return user;
}

export async function login(db, data) {
  const address = email(data.email);
  if (typeof data.senha !== 'string' || !data.senha || data.senha.length > 128) throw new HttpError(401, 'E-mail ou senha incorretos.');
  const user = db.get('SELECT id,email,user_type,senha FROM usuarios WHERE email=?', address);
  const [salt, expected] = user ? user.senha.split(':') : ['0'.repeat(32), '0'.repeat(128)];
  const actual = await derive(data.senha, salt);
  if (!timingSafeEqual(actual, Buffer.from(expected, 'hex')) || !user) throw new HttpError(401, 'E-mail ou senha incorretos.');
  return { id: user.id, email: user.email, user_type: user.user_type };
}

export function sessionUser(db, req) {
  const raw = cookieToken(req);
  if (!raw) return null;
  return db.get('SELECT u.id,u.email,u.user_type FROM sessoes s JOIN usuarios u ON u.id=s.user_id WHERE s.hash=? AND s.expira_em>?', digest(raw), Date.now()) || null;
}

export function endSession(db, req) {
  const raw = cookieToken(req);
  if (raw) db.run('DELETE FROM sessoes WHERE hash=?', digest(raw));
}

export function sessionCookie(db, user, secure) {
  const raw = user ? token() : '';
  if (user) {
    const time = Date.now();
    db.run('DELETE FROM sessoes WHERE expira_em<=?', time);
    db.run('INSERT INTO sessoes VALUES(?,?,?)', digest(raw), user.id, time + sessionLifetime);
  }
  return `hermes_session=${raw}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${user ? sessionLifetime / 1000 : 0}${secure ? '; Secure' : ''}`;
}

export function issueRecovery(db, address) {
  const user = db.get('SELECT id FROM usuarios WHERE email=?', email(address));
  if (!user) throw new HttpError(404, 'Conta não encontrada.');
  const raw = token();
  db.tx(() => {
    db.run('DELETE FROM recuperacoes WHERE user_id=? OR expira_em<=?', user.id, Date.now());
    db.run('INSERT INTO recuperacoes VALUES(?,?,?)', digest(raw), user.id, Date.now() + 30 * 60000);
  });
  return raw;
}

export async function resetPassword(db, data) {
  if (typeof data.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(data.token)) throw new HttpError(400, 'Link inválido ou expirado.');
  const key = digest(data.token);
  const password = await hashPassword(data.senha);
  db.tx(() => {
    const found = db.get('SELECT user_id FROM recuperacoes WHERE hash=? AND expira_em>?', key, Date.now());
    if (!found) throw new HttpError(400, 'Link inválido ou expirado.');
    db.run('UPDATE usuarios SET senha=? WHERE id=?', password, found.user_id);
    db.run('DELETE FROM recuperacoes WHERE user_id=?', found.user_id);
    db.run('DELETE FROM sessoes WHERE user_id=?', found.user_id);
  });
}
