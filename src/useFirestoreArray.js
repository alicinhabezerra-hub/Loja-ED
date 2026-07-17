import { useState, useEffect, useRef } from "react";
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Hook substituto do useState para arrays que precisam ser compartilhados
 * entre todas as pessoas usando o app (cliente, entregador, admin, dono).
 *
 * Uso é idêntico ao useState:
 *   const [pedidos, setPedidos] = useFirestoreArray("pedidos", PEDIDOS_INICIAIS);
 *
 * Por baixo dos panos: guarda cada item do array como um documento na
 * coleção do Firestore (usando o próprio item.id como ID do documento),
 * escuta mudanças em tempo real, e traduz chamadas de "setPedidos(...)"
 * em escritas no Firestore automaticamente — sem precisar mudar nenhum
 * componente que já usa esses arrays.
 */
export function useFirestoreArray(collectionName, seedData = []) {
  const [items, setItems] = useState(seedData);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const seededRef = useRef(false);
  const prontoRef = useRef(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const colRef = collection(db, collectionName);

    const unsub = onSnapshot(
      colRef,
      async (snapshot) => {
        // Primeira vez que a coleção existe mas está vazia: semeia com os
        // dados iniciais (catálogo de produtos, entregadores fixos, etc.)
        if (snapshot.empty && !seededRef.current && seedData.length > 0) {
          seededRef.current = true;
          try {
            const batch = writeBatch(db);
            seedData.forEach((item) => {
              batch.set(doc(db, collectionName, String(item.id)), item);
            });
            await batch.commit();
          } catch (e) {
            console.error(`Erro ao semear ${collectionName}:`, e);
          }
          return; // o snapshot dispara de novo sozinho com os dados semeados
        }
        const lista = snapshot.docs.map((d) => d.data());
        setItems(lista);
        if (!prontoRef.current) {
          prontoRef.current = true;
          setPronto(true);
        }
      },
      (erro) => {
        console.error(`Erro ao sincronizar ${collectionName}:`, erro);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName]);

  const setItemsSincronizado = (atualizador) => {
    const anterior = itemsRef.current;
    const proximo = typeof atualizador === "function" ? atualizador(anterior) : atualizador;

    // Atualiza a tela na hora (sem esperar a rede) para parecer instantâneo
    setItems(proximo);
    itemsRef.current = proximo;

    // Calcula o que mudou e grava só a diferença no Firestore
    const idsAntes = new Set(anterior.map((i) => String(i.id)));
    const idsDepois = new Set(proximo.map((i) => String(i.id)));

    const operacoes = [];
    proximo.forEach((item) => {
      const id = String(item.id);
      const itemAntes = anterior.find((i) => String(i.id) === id);
      if (!itemAntes || JSON.stringify(itemAntes) !== JSON.stringify(item)) {
        operacoes.push(setDoc(doc(db, collectionName, id), item));
      }
    });
    anterior.forEach((item) => {
      const id = String(item.id);
      if (!idsDepois.has(id)) {
        operacoes.push(deleteDoc(doc(db, collectionName, id)));
      }
    });

    Promise.all(operacoes).catch((e) => {
      console.error(`Erro ao gravar em ${collectionName}:`, e);
    });
  };

  return [items, setItemsSincronizado, pronto];
}
