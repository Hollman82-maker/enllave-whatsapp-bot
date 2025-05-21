
const venom = require('venom-bot');
const express = require('express');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;
const menuData = require('./menu.json');
const LOG_FILE = './logs.json';
let seenUsers = new Set();

// Ruta básica para verificar el bot en Railway
// Forzar nuevo deploy en Railway
app.get('/', (req, res) => {
  res.send('✅ Bot de Enllave activo en Railway');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});

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

venom
  .create({
    session: 'enllave-session',
    headless: true,
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox', '--headless=new']
  })
  .then((client) => {
    console.log('✅ Venom bot iniciado correctamente');
    start(client);
  })
  .catch((err) => {
    console.error('❌ Error al iniciar venom-bot:', err);
  });

function start(client) {
  client.onMessage(async (message) => {
    const number = message.from;
    const texto = message.body.trim();
    let response = '';

    const sendContactButtons = async (contactos, title) => {
      await client.sendButtons(
        number,
        title,
        contactos.map((c) => ({
          buttonText: `Contactar a ${c.nombre}`,
          url: c.link
        })),
        'Haz clic para contactar:'
      );
    };

    if (texto === '0') {
      seenUsers.delete(number);
      await client.sendText(number, '🔄 Reiniciando menú...\n\n' + menuData.menu);
    } else if (!seenUsers.has(number)) {
      seenUsers.add(number);
      await client.sendText(number, menuData.menu);
    } else if (menuData.respuestas[texto]) {
      const respuesta = menuData.respuestas[texto];
      if (Array.isArray(respuesta)) {
        await sendContactButtons(respuesta, `Has seleccionado: ${menuData.opciones[texto]}`);
      } else {
        await client.sendText(number, respuesta);
      }
      logInteraction(number, texto, respuesta);
    } else {
      await client.sendText(number, '❌ Opción no válida. Escribe un número del menú o 0 para reiniciar.');
    }
  });
}
