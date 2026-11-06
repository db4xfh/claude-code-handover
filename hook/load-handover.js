// SessionStart hook (matcher "clear|compact"), wired in ~/.claude/settings.json
// (see README.md for the snippet). Needs Node.js on PATH.
// Prints the latest /handover note (written by the `handover` skill) into the
// new session's context. Prints nothing when there is no note.
const fs = require('fs');
const path = require('path');
const os = require('os');

const file = path.join(os.homedir(), '.claude', 'handover', 'CURRENT.md');

let source = 'unknown';
try {
  const raw = fs.readFileSync(0, 'utf8');
  if (raw.trim()) source = JSON.parse(raw).source || source;
} catch {}

let stat, body;
try {
  stat = fs.statSync(file);
  body = fs.readFileSync(file, 'utf8').trim();
} catch {
  process.exit(0); // no handover written yet
}
if (!body) process.exit(0);

const hours = (Date.now() - stat.mtimeMs) / 36e5;
const age = hours < 1 ? `${Math.round(hours * 60)} min` : `${hours.toFixed(1)} h`;

const out = [
  `<handover source="${source}" written="${stat.mtime.toISOString()}" age="${age}">`,
  `Loaded automatically from ${file} by a SessionStart hook.`,
  'Before acting: read the RESUME file(s) it points to, re-check git state, and trust the repo over this note where they disagree.',
  'If it lists several topics, ask the user which one this session continues.',
];
if (source === 'compact') {
  out.push('This is a compaction: the compaction summary is newer than this note wherever they conflict.');
}
if (hours > 24) {
  out.push(`STALE: written ${age} ago. Confirm with the user that this is still the work at hand before acting on it.`);
}
out.push('', body, '</handover>');
process.stdout.write(out.join('\n') + '\n');
