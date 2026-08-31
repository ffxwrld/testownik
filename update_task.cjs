const fs = require('fs');
const path = '/Users/fifi/.gemini/antigravity/brain/c7beffba-7072-4b89-96c9-b35c07dda360/task.md';
let content = fs.readFileSync(path, 'utf8');

content += `\n- [x] Security Hardening (Anti-cheat RPC, Zip Bomb prevention, Security Headers)\n`;

fs.writeFileSync(path, content);
