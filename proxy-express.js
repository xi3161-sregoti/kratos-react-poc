const express = require('express');
const httpProxy = require('http-proxy');
const { hostname } = require('os');
const url = require('url');
const cors = require('cors');

const argv = require('yargs')
  .option('listen-addr', {
    alias: 'l',
    description: 'Address to listen on',
    type: 'string',
    default: 'http://localhost:5000'
  })
  .option('to-addr', {
    alias: 't',
    description: 'Address to reverse proxy to',
    type: 'string',
    demandOption: true
  })
  .argv;

const listenAddr = new URL(argv['listen-addr']);
const toAddr = argv['to-addr'];

const reactAppProxy = httpProxy.createProxyServer({
  target: toAddr,
  changeOrigin: true,
  ws: true
});

const devServerProxy = httpProxy.createProxyServer({
  target: 'http://3.7.100.88:4433',
  changeOrigin: true
});

const app = express();

app.use(cors({ origin: '*' }));

app.use((req, res) => {
  if (req.url.startsWith('/self-service') || req.url.startsWith('/session') || req.url.startsWith('/v1')) {
    console.log('proxying to dev server');

    devServerProxy.web(req, res);

    devServerProxy.on('proxyRes', (proxyRes, req, res) => {
      if (proxyRes.headers['location']) {
        const location = new URL(proxyRes.headers['location']);
        location.host = listenAddr.host;
        proxyRes.headers['location'] = location.toString();;
      }

      if (proxyRes.headers['set-cookie']) {
        proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(cookie => {
          return cookie.replace(/domain=[^;]*/i, `domain=${listenAddr}`);
        });
      }

      return;
    });

  } else {
    reactAppProxy.web(req, res);
  }
});

const server = app.listen(port=listenAddr.port, () => {
  console.log(`Reverse proxy listening on ${listenAddr.hostname} ${listenAddr.port}, forwarding to ${toAddr}`);
});
