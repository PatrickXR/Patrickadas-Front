const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const files = ['src/api/generated.ts', 'src/api/validation.ts'];
const before = files.map(file => fs.readFileSync(file));
try {
  const result = spawnSync(process.execPath, ['node_modules/orval/dist/bin/orval.js', '--config', 'orval.config.ts'], { stdio: 'inherit', windowsHide: true });
  if (result.status !== 0) process.exitCode = result.status || 1;
  else if (files.some((file, index) => !before[index].equals(fs.readFileSync(file)))) {
    console.error('Cliente divergente do OpenAPI. Execute npm run api:generate e versione o resultado.');
    process.exitCode = 1;
  } else console.log('Contrato e cliente gerado conferem.');
} finally { files.forEach((file, index) => fs.writeFileSync(file, before[index])); }
