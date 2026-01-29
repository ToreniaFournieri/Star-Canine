import { readFileSync, writeFileSync } from 'fs';

const inputPath = '/home/user/Star-Canine/React_J.jsx';
const outputPath = '/home/user/Star-Canine/src/Game.jsx';

let content = readFileSync(inputPath, 'utf-8');

// Replace Unicode curly quotes with ASCII quotes
content = content.replace(/\u2018/g, "'");
content = content.replace(/\u2019/g, "'");
content = content.replace(/\u201C/g, '"');
content = content.replace(/\u201D/g, '"');
content = content.replace(/\u2013/g, '--');  // en-dash to double minus (for i--)
content = content.replace(/\u2014/g, '--');  // em-dash to double minus
content = content.replace(/\u2026/g, '...');

// Remove markdown code block markers
// The pattern is: a line that is just ``` or ```something
content = content.replace(/^```.*$/gm, '');

// Remove empty lines that might have been created
// Keep at most 2 consecutive empty lines
content = content.replace(/\n{3,}/g, '\n\n');

writeFileSync(outputPath, content);

console.log('Cleaned and saved to:', outputPath);
console.log('File size:', content.length);

// Verify no ``` remain
const remaining = content.match(/```/g);
if (remaining) {
  console.error('WARNING: Still found', remaining.length, 'backtick sequences');
} else {
  console.log('SUCCESS: No markdown blocks remaining');
}
