const PollingComm = require('../dist').default;

const server = new PollingComm({ port: 4000 });

server.on('connection', (socket) => {
  console.log('connection:', socket.id);
});
