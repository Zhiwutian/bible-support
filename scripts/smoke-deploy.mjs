#!/usr/bin/env node

const deployUrl = process.env.DEPLOY_URL;

if (!deployUrl) {
  console.error('DEPLOY_URL is required, for example: DEPLOY_URL=https://app.onrender.com');
  process.exit(1);
}

const base = deployUrl.replace(/\/+$/, '');

function ensureOk(response, label) {
  if (!response.ok) {
    throw new Error(`${label} failed with ${response.status} ${response.statusText}`);
  }
}

async function getJson(path, label) {
  const response = await fetch(`${base}${path}`, {
    headers: { Accept: 'application/json' },
  });
  ensureOk(response, label);
  return response.json();
}

async function run() {
  console.log(`Smoke testing deployment at ${base}`);

  const pageResponse = await fetch(`${base}/`);
  ensureOk(pageResponse, 'GET /');
  console.log('PASS GET /');

  const health = await getJson('/api/health', 'GET /api/health');
  if (!health?.data) throw new Error('GET /api/health returned unexpected payload');
  console.log('PASS GET /api/health');

  const emotions = await getJson('/api/emotions', 'GET /api/emotions');
  const firstEmotion = emotions?.data?.[0];
  if (!firstEmotion?.slug) {
    throw new Error('GET /api/emotions returned no emotion slug');
  }
  console.log(`PASS GET /api/emotions (${emotions.data.length} rows)`);

  const scriptures = await getJson(
    `/api/emotions/${encodeURIComponent(firstEmotion.slug)}/scriptures`,
    'GET /api/emotions/:slug/scriptures',
  );
  const firstScripture = scriptures?.data?.[0];
  if (!firstScripture?.id) {
    throw new Error('GET /api/emotions/:slug/scriptures returned no scripture id');
  }
  console.log(`PASS GET /api/emotions/${firstEmotion.slug}/scriptures (${scriptures.data.length} rows)`);

  const context = await getJson(
    `/api/scripture-context?scriptureId=${encodeURIComponent(firstScripture.id)}`,
    'GET /api/scripture-context?scriptureId=...',
  );
  if (!context?.data?.reference) {
    throw new Error('GET /api/scripture-context did not return expected context payload');
  }
  console.log('PASS GET /api/scripture-context?scriptureId=...');

  console.log('Smoke test completed successfully.');
}

run().catch((error) => {
  console.error(`Smoke test failed: ${error.message}`);
  process.exit(1);
});
