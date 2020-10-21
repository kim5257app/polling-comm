const PollingComm = require('../dist').default;
const Client = require('@kim5257/polling-comm-client').default;

const server = new PollingComm({ port: 4000 });

server.on('connection', (socket) => {
  console.log('connection:', socket.id);

  socket.on('join', (data) => {
    socket.join(data.group);
  });

  socket.on('send', (data) => {
    socket.to(data.to).emit('send', { message: data.message });
  });
});

const client = new Client('http://localhost:4000');
const client2 = new Client('http://localhost:4000');

client.on('connected', (socket) => {
  console.log('connected:', socket.id);

  // 연결되면 test 그룹에 가입
  client.emit('join', { group: 'test' });
});

client.on('disconnected', () => {
  console.log('disconnected');
});

client.on('send', (data) => {
  console.log('->:', JSON.stringify(data));
});

client2.on('send', (data) => {
  console.log('->:', JSON.stringify(data));
});

setInterval(() => {
  const data = { message: 'TEST' };

  console.log('<-:', JSON.stringify(data));
  client2.emit('send', { to: 'test', message: 'TEST' });
}, 5000);
