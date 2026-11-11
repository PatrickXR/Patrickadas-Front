import { defineConfig } from 'orval';
import { readFileSync, writeFileSync } from 'node:fs';

export default defineConfig({
  validation: {
    input: '../Backend/openapi.json',
    output: { target: './src/api/validation.ts', client: 'zod', clean: false,
      override: { zod: { strict: { body: true } } } },
  },
  patrickadas: {
    hooks: { afterAllFilesWrite: () => {
      const file = './src/api/generated.ts';
      writeFileSync(file, readFileSync(file, 'utf8').replace(/[\t ]+$/gm, ''));
    } },
    input: '../Backend/openapi.json',
    output: { target: './src/api/generated.ts', client: 'fetch', clean: false,
      override: { fetch: { includeHttpResponseReturnType: false },
        mutator: { path: './src/api/request.ts', name: 'apiRequest' } } },
  },
});
