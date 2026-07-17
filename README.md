# Loja ED

App de delivery com 4 painéis (Cliente, Entregador, Admin, Dono), feito em React + Vite + Tailwind, com dados compartilhados em tempo real via Firebase.

## Antes de tudo: configure o banco de dados

**Esse passo é obrigatório** — sem ele, cada pessoa que abre o app vê só os próprios dados, e pedidos/contas não aparecem para admin, entregador ou dono.

Siga o passo a passo em **[CONFIGURAR_FIREBASE.md](./CONFIGURAR_FIREBASE.md)** (leva uns 5 minutos, é gratuito).

## Rodar localmente

Precisa ter o [Node.js](https://nodejs.org) instalado (versão 18 ou mais recente).

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Publicar no Netlify

### Opção 1 — Arrastar e soltar (mais simples)

1. Rode `npm run build` no seu computador. Isso cria uma pasta `dist/`.
2. Acesse [app.netlify.com/drop](https://app.netlify.com/drop)
3. Arraste a pasta `dist/` pra lá.
4. Pronto — o Netlify te dá um link público na hora.

### Opção 2 — Conectado ao GitHub (recomendado, permite atualizações automáticas)

1. Suba esta pasta inteira pra um repositório no GitHub.
2. No [Netlify](https://app.netlify.com), clique em "Add new site" → "Import an existing project".
3. Escolha o repositório.
4. O Netlify já vai detectar as configurações certas (estão no arquivo `netlify.toml`):
   - Comando de build: `npm run build`
   - Pasta de publicação: `dist`
5. Clique em "Deploy".

A partir daí, qualquer alteração que você enviar pro GitHub atualiza o site automaticamente.

## Códigos de acesso

- **Entregadores**: `ENT-1`, `ENT-2`
- **Admins**: `ADM-1`, `ADM-2`
- **Dono**: `DONO2026`

Clientes se cadastram normalmente pelo app (nome, e-mail/telefone, senha).

## Como os dados são compartilhados

Pedidos, contas, mensagens de chat, cupons, avaliações e solicitações de recuperação de senha ficam salvos no Firestore (banco de dados do Firebase) e sincronizam em tempo real entre todos os dispositivos — assim que o cliente faz um pedido, ele já aparece pro admin sem precisar recarregar a página. A sessão de login (quem está logado em cada aparelho) continua salva localmente em cada navegador, já que isso é individual por dispositivo.

