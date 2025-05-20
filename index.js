const venom = require('venom-bot');
const express = require('express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const menuData = require('./menu.json');
const LOG_FILE = './logs.json';

let seenUsers = new Set();

// ✅ Ruta de salud para Railway
app.get('/', (req, res) => {
  res.send('✅ Bot Enllave está activo');
});

app.listen(PORT, () => {
  console.log(`✅ Servidor Express escuchando en puerto ${PORT}`);
});

// 📝 Función de registro
function logInteraction(user, message, response) {
  const log = {
    timestamp: new Date().toISOString(),
    user,
    message,
    response,
  };
  let logs = [];
  if (fs.existsSync(LOG_FILE)) {
    logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
  }
  logs.push(log);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

// 🚀 Crear el bot optimizado para Railway
venom
  .create({
    session: 'enllave-session',
    headless: true,
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox', '--headless=new'],
  })
  .then((client) => {
    console.log('✅ Venom bot iniciado correctamente');
    start(client);
  })
  .catch((error) => console.error('❌ Error al iniciar Venom Bot:', error));

function start(client) {
  client.onMessage(async (message) => {
    const number = message.from;
    const texto = message.body.trim();
    let response = '';

    if (texto === '0') {
      seenUsers.delete(number);
      response = '🔄 Reiniciando menú...\n\n' + menuData.menu;
    } else if (!seenUsers.has(number)) {
      seenUsers.add(number);
      response = menuData.menu;
    } else if (menuData.respuestas[texto]) {
      response = menuData.respuestas[texto];
    } else {
      response = '❌ Opción no válida. Escribe un número del menú o 0 para reiniciar.';
    }

    await client.sendText(number, response);
    logInteraction(number, texto, response);
  });
}