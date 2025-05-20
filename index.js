// index.js
const venom = require('venom-bot');
const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

const menuData = require('./menu.json');
const LOG_FILE = './logs.json';

let seenUsers = new Set();

function logInteraction(user, message, response) {
    const log = {
        timestamp: new Date().toISOString(),
        user,
        message,
        response
    };
    let logs = [];
    if (fs.existsSync(LOG_FILE)) {
        try {
            logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
        } catch (err) {
            console.error('Error leyendo logs:', err);
            logs = [];
        }
    }
    logs.push(log);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

venom
  .create({
    session: 'enllave',
    headless: true,
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.platform === 'linux' ? '/usr/bin/google-chrome-stable' : undefined
  })
  .then((client) => start(client))
  .catch((error) => {
    console.error('❌ Error al iniciar Venom:', error);
  });

function start(client) {
    client.onMessage(async (message) => {
        const number = message.from;
        const texto = message.body.trim();

        let response = "";

        if (texto === "0") {
            seenUsers.delete(number);
            response = "🔄 Reiniciando menú...\n\n" + menuData.menu;
        } else if (!seenUsers.has(number)) {
            seenUsers.add(number);
            response = menuData.menu;
        } else if (menuData.respuestas[texto]) {
            response = menuData.respuestas[texto];
        } else {
            response = "❌ Opción no válida. Escribe un número del menú o 0 para reiniciar.";
        }

        await client.sendText(number, response);
        logInteraction(number, texto, response);
    });
}

app.get('/', (req, res) => {
  res.send('Bot de Enllave corriendo...');
});

app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en puerto ${PORT}`);
});
