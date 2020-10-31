const PollingComm = require('../dist').default;
const Client = require('@kim5257/polling-comm-client').default;

const server = new PollingComm({ port: 4000 });

server.on('connection', (socket) => {
  console.log('connection:', socket.id);

  socket.on('echo', (data) => {
    socket.emit('echo', data);
  });
});

const client = new Client('http://localhost:4000');

client.on('connected', (socket) => {
  console.log('connected:', socket.id);
});

client.on('disconnected', () => {
  console.log('disconnected');
});

client.on('echo', (data) => {
  console.log('-> recv:', JSON.stringify(data));
});

let count = 2;

const timeoutHandler = () => {
  const data = { message: 'TEST' };

  console.log('<- emit:', JSON.stringify(data));
  client.emit('echo', { message: 'TEST' });

  count = count - 1;
  if (count > 0) {
    setTimeout(timeoutHandler, 2000);
  } else {
    console.log('end');
    client.close();
    server.close();
  }
}

setTimeout(timeoutHandler, 2000);
