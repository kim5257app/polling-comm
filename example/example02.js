const PollingComm = require('../dist').default;
const Client = require('@kim5257/polling-comm-client').default;

const server = new PollingComm({ port: 5000 });
const server2 = new PollingComm({ port: 5001 });

server.setCluster({ host: 'localhost', port: 6379 });
server2.setCluster({ host: 'localhost', port: 6379 });

server.on('connection', (socket) => {
  console.log('connection:', socket.id);

  socket.on('join', (data) => {
    socket.join(data.group);
  });

  socket.on('send', async (data) => {
    console.log('test:', await socket.get('test'));

    socket.to(data.to).emit('send', {
      message: data.message,
      test: await socket.get('test'),
    });
  });

  socket.on('store', async (data) => {
    console.log('store:', data);
    await socket.set('test', data);
  });
});

server2.on('connection', (socket) => {
  console.log('connection2:', socket.id);

  socket.on('join', (data) => {
    socket.join(data.group);
  });

  socket.on('send', async (data) => {
    console.log('test2:', await socket.get('test'));

    socket.to(data.to).emit('send', {
      message: data.message,
      test: await socket.get('test'),
    });
  });

  socket.on('store', async (data) => {
    console.log('store2:', data);
    await socket.set('test', data);
  });
});

const client = new Client('http://localhost:5000');
const client2 = new Client('http://localhost:5001');

client.on('connected', (socket) => {
  console.log('connected:', socket.id);

  // 연결되면 test 그룹에 가입
  client.emit('join', { group: 'test' });

  client.emit('store', { store: 'TEST' });
});

client2.on('connected', (socket) => {
  client2.emit('store', { store: 'TEST' });
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
