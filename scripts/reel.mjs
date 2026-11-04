#!/usr/bin/env node
// Manage the reel protection.
//
//   npm run reel -- link framestore-melbourne   new private link for one application
//   npm run reel -- links                       list all private links
//   npm run reel -- password NEW_PASSWORD       change the password
//   npm run reel -- password --off              remove the password (private links keep working)
//   npm run reel -- public                      show the reel to everyone, no password
//   npm run reel -- private                     protect it again
//
// Every change is saved in the local .env / reel-tokens.txt and, if the
// GitHub CLI (gh) is installed and logged in, pushed to the repository
// secrets with a new deploy. Add --local to skip GitHub.

import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const SITE = 'https://kevinrosso.me';
const TOKENS_FILE = 'reel-tokens.txt';
const ENV_FILE = '.env';

const args = process.argv.slice(2);
const local = args.includes('--local');
const positional = args.filter((a) => !a.startsWith('--'));
const [command, value] = positional;

// ---------- helpers ----------

const readTokens = () =>
  existsSync(TOKENS_FILE)
    ? readFileSync(TOKENS_FILE, 'utf8')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'))
    : [];

const linkFor = (token) => `${SITE}/#reel=${token}`;

function setEnv(key, val) {
  const lines = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8').split(/\r?\n/) : [];
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  const i = lines.findIndex((l) => l.startsWith(`${key}=`));
  // Quoted, so characters like # are not read as comments.
  const line = `${key}="${String(val).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  if (i >= 0) lines[i] = line;
  else lines.push(line);
  writeFileSync(ENV_FILE, lines.join('\n') + '\n');
}

function hasGh() {
  try {
    execFileSync('gh', ['auth', 'status'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function github(changes) {
  if (local) {
    console.log('Saved locally only (--local).');
    return;
  }
  if (!hasGh()) {
    console.log('\nGitHub CLI not found or not logged in. Update these secrets by hand');
    console.log('(Settings > Secrets and variables > Actions), then re-run the deploy:');
    for (const [k, v] of Object.entries(changes)) console.log(`  ${k} = ${v === null ? '(delete it)' : v}`);
    return;
  }
  for (const [k, v] of Object.entries(changes)) {
    if (v === null) {
      try {
        execFileSync('gh', ['secret', 'delete', k], { stdio: 'inherit' });
      } catch {
        /* secret did not exist */
      }
    } else {
      execFileSync('gh', ['secret', 'set', k, '--body', v], { stdio: 'inherit' });
    }
  }
  execFileSync('gh', ['workflow', 'run', 'deploy.yml'], { stdio: 'inherit' });
  console.log('GitHub updated, new deploy started (about a minute).');
}

function usage() {
  console.log(`Usage:
  npm run reel -- link <label>        new private link for one application
  npm run reel -- links               list all private links
  npm run reel -- password <new>      change the password
  npm run reel -- password --off      remove the password
  npm run reel -- public              reel visible to everyone
  npm run reel -- private             reel protected again
Add --local to change only the local .env.`);
}

// ---------- commands ----------

switch (command) {
  case 'link': {
    if (!value) {
      usage();
      process.exit(1);
    }
    const label = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (readTokens().some((l) => l.split('=')[0] === label)) {
      console.error(`A link for "${label}" already exists. Run "npm run reel -- links" to see it.`);
      process.exit(1);
    }
    const token = randomBytes(15).toString('base64url');
    appendFileSync(TOKENS_FILE, `${label}=${token}\n`);
    console.log(`\nLabel: ${label}\nLink:  ${linkFor(token)}\n`);
    github({ REEL_LINK_TOKENS: readTokens().join(',') });
    break;
  }

  case 'links': {
    const entries = readTokens();
    if (!entries.length) console.log('No links yet.');
    for (const line of entries) {
      const [label, token] = line.split('=');
      console.log(`${label.padEnd(32)} ${linkFor(token)}`);
    }
    break;
  }

  case 'password': {
    if (args.includes('--off')) {
      setEnv('REEL_PASSWORD', '');
      console.log('Password removed. Visitors will see "Reel available on request"; private links still work.');
      github({ REEL_PASSWORD: null });
    } else if (value) {
      setEnv('REEL_PASSWORD', value);
      setEnv('REEL_PUBLIC', 'false');
      console.log('Password changed.');
      github({ REEL_PASSWORD: value, REEL_PUBLIC: 'false' });
    } else {
      usage();
      process.exit(1);
    }
    break;
  }

  case 'public': {
    setEnv('REEL_PUBLIC', 'true');
    console.log('The reel is now public: no password, visible to everyone.');
    github({ REEL_PUBLIC: 'true' });
    break;
  }

  case 'private': {
    setEnv('REEL_PUBLIC', 'false');
    console.log('The reel is protected again (password and private links).');
    github({ REEL_PUBLIC: 'false' });
    break;
  }

  default:
    usage();
    process.exit(command ? 1 : 0);
}
