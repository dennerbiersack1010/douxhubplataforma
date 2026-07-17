#!/usr/bin/env node
const https = require('https');

const options = {
  hostname: 'douxhub.space',
  port: 443,
  path: '/api/admin/cleanup-test-users/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': 0
  }
};

const req = https.request(options, (res) => {
  let data = '';
  console.log(`Status: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

req.end();
