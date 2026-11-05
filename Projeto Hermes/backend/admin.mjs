import { existsSync } from 'node:fs';
import { openDatabase } from './db.mjs';
import { createAccount, issueRecovery } from './auth.mjs';

const [action, argument] = process.argv.slice(2);
if (!['criar', 'recuperar', 'backup'].includes(action) || !argument) {
  console.error('Use npm run admin -- criar EMAIL, recuperar EMAIL ou backup CAMINHO.');
  process.exitCode = 1;
} else {
  const db = openDatabase();
  try {
    if (action === 'criar') {
      if (!process.env.HERMES_ADMIN_PASSWORD) throw new Error('Defina HERMES_ADMIN_PASSWORD no ambiente antes de criar o administrador.');
      await createAccount(db, { email: argument, senha: process.env.HERMES_ADMIN_PASSWORD }, true);
      console.log('Conta administrativa criada.');
    } else if (action === 'recuperar') {
      const base = process.env.PUBLIC_URL || `http://127.0.0.1:${process.env.PORT || 4173}`;
      const link = new URL('/', base);
      link.hash = 'recuperar=' + issueRecovery(db, argument);
      console.log('Link privado de uso único, válido por 30 minutos.');
      console.log(link.href);
    } else {
      if (existsSync(argument)) throw new Error('Escolha um caminho de backup que ainda não existe.');
      await db.backup(argument);
      console.log('Backup consistente criado.');
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally { db.close(); }
}
