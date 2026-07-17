# Configurar o Firebase (banco de dados compartilhado)

Sem isso, cada pessoa que abre o site vê só os próprios dados — cliente,
entregador, admin e dono ficam "ilhados" uns dos outros. Com o Firebase
configurado, todo mundo passa a ver os mesmos pedidos, contas e mensagens
em tempo real. É gratuito para o tamanho de uso de uma loja pequena/média.

Leva uns 5 minutos. Segue o passo a passo:

## 1. Criar o projeto no Firebase

1. Acesse **[console.firebase.google.com](https://console.firebase.google.com)** e faça login com uma conta Google.
2. Clique em **"Criar um projeto"** (ou "Add project").
3. Dê um nome, por exemplo `loja-ed`. Pode desativar o Google Analytics (não é necessário) e seguir em frente.
4. Aguarde a criação — leva uns 30 segundos.

## 2. Criar o banco de dados (Firestore)

1. No menu à esquerda, clique em **"Firestore Database"** (ou "Compilação" → "Firestore Database").
2. Clique em **"Criar banco de dados"**.
3. Escolha a localização mais próxima de você (ex: `southamerica-east1` para Brasil).
4. Em **modo de segurança**, escolha **"Iniciar no modo de teste"** (test mode). Isso libera leitura/escrita por 30 dias — depois vamos ajustar a regra para funcionar sem expirar (passo 5 abaixo).
5. Clique em **"Ativar"**.

## 3. Criar o "app da Web" e pegar as chaves

1. No menu à esquerda, clique no ⚙️ (Configurações do projeto) → **"Configurações do projeto"**.
2. Role até **"Seus apps"** e clique no ícone **`</>`** (Web).
3. Dê um apelido, por exemplo `loja-ed-web`. Não precisa marcar Firebase Hosting.
4. Clique em **"Registrar app"**.
5. Vai aparecer um bloco de código parecido com este:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "loja-ed-xxxxx.firebaseapp.com",
  projectId: "loja-ed-xxxxx",
  storageBucket: "loja-ed-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

6. **Copie esses valores.**

## 4. Colar as chaves no projeto

1. Abra o arquivo **`src/firebase.js`** (dentro da pasta deste projeto).
2. Substitua os textos `"COLE_AQUI_..."` pelos valores que você copiou no passo anterior. Fica assim:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "loja-ed-xxxxx.firebaseapp.com",
  projectId: "loja-ed-xxxxx",
  storageBucket: "loja-ed-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

3. Salve o arquivo.

> Essas chaves não são "secretas" no sentido tradicional — elas identificam o projeto, mas quem controla o acesso de verdade são as regras de segurança do Firestore (próximo passo). Não tem problema esse arquivo ficar visível no código do site.

## 5. Ajustar a regra de segurança (para não expirar em 30 dias)

O modo de teste expira depois de 30 dias e passa a bloquear tudo. Para
manter o app funcionando permanentemente (já que ele não usa login do
Firebase, e sim os códigos/senhas próprios do app), ajuste a regra:

1. No Firestore, vá na aba **"Regras"** (Rules).
2. Substitua o conteúdo por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Clique em **"Publicar"**.

> Isso deixa o banco aberto para leitura/escrita por qualquer um que
> souber o endereço do seu projeto — aceitável para uma loja pequena
> testando o app, mas não é o ideal para um negócio grande com dados
> sensíveis. Se isso crescer, vale migrar para autenticação real do
> Firebase (Firebase Auth) com regras por usuário — nesse caso é só pedir
> ajuda para configurar isso depois.

## 6. Testar

1. Rode `npm install` (só precisa na primeira vez, ou depois de mudar o `package.json`).
2. Rode `npm run dev`.
3. Abra o app em duas abas diferentes do navegador — faça um pedido como cliente numa aba, e veja se ele aparece no painel do Admin na outra aba (depois de avançar o status para "Preparando").

Se aparecer, está tudo funcionando. Pode publicar no Netlify normalmente — o arquivo `src/firebase.js` com as chaves já coladas vai junto no build.
