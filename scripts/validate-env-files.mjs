import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const workspaceRoot = process.cwd();
const serverEnvPath = resolve(workspaceRoot, 'server/.env');
const clientEnvPath = resolve(workspaceRoot, 'client/.env.local');

/**
 * Parse simple KEY=VALUE env files into key/value entries.
 */
function parseEnvFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const map = new Map();
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) continue;
    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim();
    if (key) map.set(key, value);
  }
  return map;
}

function readAndValidate() {
  const errors = [];

  if (!existsSync(serverEnvPath)) {
    errors.push(
      'Missing `server/.env` (run: cp server/.env.example server/.env)',
    );
  }
  if (!existsSync(clientEnvPath)) {
    errors.push(
      'Missing `client/.env.local` (run: cp client/.env.example client/.env.local)',
    );
  }
  if (errors.length > 0) return errors;

  const serverEnv = parseEnvFile(serverEnvPath);
  const clientEnv = parseEnvFile(clientEnvPath);

  const requiredServerKeys = ['TOKEN_SECRET', 'CORS_ORIGIN'];
  for (const key of requiredServerKeys) {
    if (!(serverEnv.get(key) ?? '').trim()) {
      errors.push(`Missing required server key in .env: ${key}`);
    }
  }

  const authEnabled =
    (serverEnv.get('AUTH_ENABLED') ?? '').trim().toLowerCase() === 'true';
  if (authEnabled) {
    const requiredAuthKeys = [
      'AUTH_ISSUER',
      'AUTH_CLIENT_ID',
      'AUTH_REDIRECT_URI',
      'AUTH_LOGIN_REDIRECT_URI',
      'AUTH_LOGOUT_REDIRECT_URI',
      'SESSION_SECRET',
    ];
    for (const key of requiredAuthKeys) {
      if (!(serverEnv.get(key) ?? '').trim()) {
        errors.push(
          `Missing required server auth key in .env when AUTH_ENABLED=true: ${key}`,
        );
      }
    }
  }

  const apiBaseUrl = (clientEnv.get('VITE_API_BASE_URL') ?? '').trim();
  if (apiBaseUrl && !/^https?:\/\//.test(apiBaseUrl)) {
    errors.push(
      'Invalid client key `VITE_API_BASE_URL`: expected absolute URL (http/https)',
    );
  }

  return errors;
}

const errors = readAndValidate();
if (errors.length > 0) {
  console.error('\nEnvironment configuration check failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error('\nSee docs/configuration.md for setup details.\n');
  process.exit(1);
}

console.log('Environment configuration check passed.');
