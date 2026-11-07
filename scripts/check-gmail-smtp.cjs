// Authenticates only: no MAIL FROM, RCPT TO or DATA commands are sent.
// Credentials remain in memory and are never written to disk or printed.
const tls = require('node:tls');
const readline = require('node:readline');
const { Writable } = require('node:stream');

async function main() {
  if (!process.stdin.isTTY) throw new Error('Abra um terminal interativo e execute node scripts/check-gmail-smtp.cjs.');
  let hidden = false;
  const output = new Writable({ write(chunk, encoding, done) { if (!hidden) process.stdout.write(chunk, encoding); done(); } });
  const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
  rl.on('SIGINT', () => { rl.close(); process.exit(130); });
  const ask = query => new Promise(resolve => rl.question(query, resolve));
  console.log('Teste de autenticação Gmail SMTP. Nenhum e-mail será enviado.');
  let email, password;
  try {
    email = (await ask('Conta Gmail remetente [portuguesmais02@gmail.com]: ')).trim() || 'portuguesmais02@gmail.com';
    if (!/^[^\s@]+@gmail\.com$/i.test(email)) throw new Error('Use a conta @gmail.com que gerou a senha de app.');
    process.stdout.write('Senha de app (entrada oculta; não use sua senha normal): ');
    hidden = true;
    password = (await ask('')).replace(/\s/g, '');
  } finally { hidden = false; rl.close(); process.stdout.write('\n'); }
  if (password.length !== 16) throw new Error('A senha de app deve ter 16 caracteres após remover os espaços.');
  const socket = tls.connect({ host: 'smtp.gmail.com', port: 465, servername: 'smtp.gmail.com', rejectUnauthorized: true });
  socket.setTimeout(15000, () => socket.destroy(new Error('Tempo de conexão excedido.')));
  let buffer = '', failure;
  const replies = [], waiters = [];
  function finish(error) { failure = error; for (const waiter of waiters.splice(0)) waiter.reject(error); }
  socket.on('error', finish);
  socket.on('close', () => finish(new Error('A conexão SMTP foi encerrada.')));
  socket.on('data', chunk => {
    buffer += chunk.toString('utf8');
    let end;
    while ((end = buffer.indexOf('\r\n')) !== -1) {
      const line = buffer.slice(0, end); buffer = buffer.slice(end + 2);
      if (!/^\d{3} /.test(line)) continue;
      const code = Number(line.slice(0, 3));
      const waiter = waiters.shift();
      if (waiter) waiter.resolve(code); else replies.push(code);
    }
  });
  const receive = () => failure ? Promise.reject(failure) : replies.length ? Promise.resolve(replies.shift()) : new Promise((resolve, reject) => waiters.push({ resolve, reject }));
  const command = async (value, expected) => {
    socket.write(value + '\r\n');
    const code = await receive();
    if (code !== expected) {
      const error = new Error(code === 535 ? 'Gmail recusou as credenciais (535). Confira se a senha de app pertence à conta remetente e continua ativa.' : `Gmail respondeu SMTP ${code}.`);
      throw error;
    }
  };
  try {
    if (await receive() !== 220) throw new Error('O Gmail não retornou a saudação SMTP esperada.');
    console.log('Conexão TLS com smtp.gmail.com: OK.');
    await command('EHLO localhost', 250);
    await command('AUTH LOGIN', 334);
    await command(Buffer.from(email).toString('base64'), 334);
    await command(Buffer.from(password).toString('base64'), 235);
    password = '';
    console.log('Autenticação Gmail: OK (235).');
    console.log('Se o Supabase ainda retorna 535, compare o usuário e a senha efetivamente salvos no SMTP do mesmo projeto. Este teste não verifica a entrega de mensagens.');
    await command('QUIT', 221);
  } finally { password = ''; socket.destroy(); }
}
main().catch(error => { console.error('Diagnóstico:', error.message); process.exitCode = 1; });
