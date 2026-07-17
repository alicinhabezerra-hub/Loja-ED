import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ============================================================
// COLE AQUI AS CHAVES DO SEU PROJETO FIREBASE
// ============================================================
// Onde encontrar: console.firebase.google.com → seu projeto →
// ⚙️ Configurações do projeto → role até "Seus apps" → app da Web →
// "Configuração do SDK" → escolha "Config"
//
// Veja o passo a passo completo em CONFIGURAR_FIREBASE.md
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyBXGnn3AcK9gvrQPEV2nsi8b-LZijtkhQM",
  authDomain: "loja-ed.firebaseapp.com",
  projectId: "loja-ed",
  storageBucket: "loja-ed.firebasestorage.app",
  messagingSenderId: "205750577054",
  appId: "1:205750577054:web:9dc2fc195d3c1acbe5188f",
};

export const firebaseConfigurado = firebaseConfig.apiKey !== "COLE_AQUI_SUA_API_KEY";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
