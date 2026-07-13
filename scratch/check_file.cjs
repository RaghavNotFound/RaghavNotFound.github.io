const fs = require('fs');
const buf = fs.readFileSync('C:\\Users\\ragha\\.gemini\\antigravity-ide\\brain\\7b475501-33f4-4cba-b4c5-297363e369bd\\gun_magenta_1783941850158.png');
console.log('Size:', buf.length);
console.log('Bytes:', buf.slice(0, 16).toString('hex'));
