import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const indexCss = readFileSync(join(here, 'index.css'), 'utf8');

describe('reader typography CSS guardrails', () => {
  it('emotion support pages have dark-mode ink overrides', () => {
    expect(indexCss).toContain('.emotion-support-page');
    expect(indexCss).toContain(
      ".app-dark-mode .emotion-support-page [class*='text-indigo-']",
    );
  });

  it('immersive shell exposes bottom chrome pad token for scroll clearance', () => {
    expect(indexCss).toContain('--reader-immersive-bottom-chrome-pad');
    expect(indexCss).toContain('.reader-immersive-shell');
  });

  it('verse text action buttons use reader font tokens', () => {
    expect(indexCss).toContain(
      ".reader-root button[type='button'].reader-verse-text-hit",
    );
    const block = indexCss.slice(
      indexCss.indexOf(
        ".reader-root button[type='button'].reader-verse-text-hit",
      ),
    );
    expect(block).toMatch(/font-size:\s*var\(--reader-font-size\)/);
    expect(block).toMatch(/font-family:\s*var\(--reader-font-family\)/);
    expect(block).toMatch(/line-height:\s*var\(--reader-line-height\)/);
  });
});
