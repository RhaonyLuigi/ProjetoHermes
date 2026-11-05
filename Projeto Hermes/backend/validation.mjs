export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function text(value, label, max, min = 1) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed.length < min || trimmed.length > max || /[\0\u0001-\u0008]/.test(trimmed)) {
    throw new HttpError(400, `Confira o campo ${label}.`);
  }
  return trimmed;
}

export function email(value) {
  const normalized = text(value, 'e-mail', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new HttpError(400, 'Informe um e-mail válido.');
  return normalized;
}

export function uuid(value) {
  if (typeof value !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value)) throw new HttpError(400, 'Identificador inválido.');
  return value.toLowerCase();
}

export function role(user, expected) {
  if (user.user_type !== expected) throw new HttpError(403, 'Seu perfil não tem acesso a esta ação.');
}

const ufs = new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '));
export function location(data) {
  const cidade = text(data.cidade, 'cidade', 90, 2).replace(/\s+/g, ' ');
  const uf = text(data.uf, 'estado', 2).toUpperCase();
  if (!ufs.has(uf)) throw new HttpError(400, 'Selecione uma UF válida.');
  const key = cidade.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  return { cidade, uf, localidade: `${key}/${uf}` };
}

export function image(value) {
  if (!value) return { bytes: null, type: null };
  if (typeof value !== 'string' || value.length > 2_800_000) throw new HttpError(413, 'Envie uma imagem de até 2 MB.');
  const match = value.match(/^data:image\/(jpeg|png|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) throw new HttpError(400, 'Envie uma imagem JPG, PNG, WebP ou GIF.');
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 2 * 1024 * 1024) throw new HttpError(413, 'Envie uma imagem de até 2 MB.');
  const type = match[1];
  const valid = {
    jpeg: bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
    png: bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    gif: ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString()),
    webp: bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP'
  };
  if (!valid[type]) throw new HttpError(400, 'O conteúdo da imagem é inválido.');
  return { bytes, type: `image/${type}` };
}
