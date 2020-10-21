const PollingComm = require('../dist').default;
const client = require('@kim5257/polling-comm-client').default;

const server = new PollingComm({ port: 4000 });

server.on('connection', (socket) => {
  console.log('connection:', socket.id);

  socket.on('echo', (data) => {
    console.log('echo:', JSON.stringify(data));
    socket.emit('echo', data);
  });
});
