// server-lib/socketInstance.js

const { Server } = require('socket.io');

/**
 * Esta es la única instancia del servidor de Socket.IO para toda la aplicación.
 * La exportamos para que cualquier parte del backend pueda importarla y usarla.
 * NO la adjuntamos a un servidor HTTP aquí; eso se hará en server.js.
 */
const io = new Server();

module.exports = io;


 