import { readFileSync, writeFileSync } from 'fs';

const filePath = '/home/user/Star-Canine/src/Game.jsx';
let content = readFileSync(filePath, 'utf-8');

// Replace all Unicode curly quotes with ASCII straight quotes
// Left single quote U+2018, Right single quote U+2019
// Left double quote U+201C, Right double quote U+201D
content = content.replace(/\u2018/g, "'");
content = content.replace(/\u2019/g, "'");
content = content.replace(/\u201C/g, '"');
content = content.replace(/\u201D/g, '"');
content = content.replace(/\u2013/g, '-');
content = content.replace(/\u2014/g, '-');
content = content.replace(/\u2026/g, '...');

writeFileSync(filePath, content);
console.log('Fixed quotes in Game.jsx');
console.log('File size:', content.length);
