# Patrickadas

Projeto de Vibe Coding (Aprendizado)

## Frontend local

Na pasta deste repositório:

- `npm install`: instala as dependências.
- `npm run dev`: inicia o Vite para desenvolvimento.
- `npm run build`: verifica TypeScript e gera `dist/`.
- `npm run preview`: serve o build local.
- `npm test`: gera o build e executa os testes E2E no Chrome instalado.

Os scripts chamam os arquivos JavaScript diretamente para suportar caminhos
Windows com `&`, como a pasta de trabalho deste projeto.

Os testes da home usam API simulada, não acessam banco ou serviço remoto e
verificam desktop (1366×768) e celular (390×844). O Playwright sobe e encerra
o preview em `http://127.0.0.1:4173`. A porta precisa estar livre.
Capturas e traces ficam em `test-results/`, ignorado pelo Git.

A home fica em `/home`, após login dos dois perfis. Catálogo, Meus empréstimos,
Operações e Equipamentos ainda apresentam “Em breve”. O estado local de papel
controla a apresentação; a autorização de dados continua sendo tarefa da API.

