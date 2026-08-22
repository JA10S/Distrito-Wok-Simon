import { useState, useEffect } from 'react';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot 
} from 'firebase/firestore';
import { app } from '../services/firebase';

const db = getFirestore(app);

const COLLECTIONS = ['arroces', 'corrientes', 'porciones', 'bebidas'];

export function useMenuAdmin() {
  const [menuItems, setMenuItems] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribes = [];

    COLLECTIONS.forEach((collectionName) => {
      const unsubscribe = onSnapshot(
        collection(db, collectionName),
        (snapshot) => {
          const items = [];
          snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
          });
          setMenuItems((prev) => ({ ...prev, [collectionName]: items }));
          setLoading(false);
        },
        (error) => {
          console.error(`Error fetching ${collectionName}:`, error);
          setLoading(false);
        }
      );
      unsubscribes.push(unsubscribe);
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, []);

  const addItem = async (collectionName, itemData) => {
    try {
      const docRef = doc(collection(db, collectionName));
      await setDoc(docRef, {
        ...itemData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error adding item:', error);
      return { success: false, error: error.message };
    }
  };

  const updateItem = async (collectionName, itemId, itemData) => {
    try {
      await updateDoc(doc(db, collectionName, itemId), {
        ...itemData,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating item:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteItem = async (collectionName, itemId) => {
    try {
      await deleteDoc(doc(db, collectionName, itemId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting item:', error);
      return { success: false, error: error.message };
    }
  };

  return { menuItems, loading, addItem, updateItem, deleteItem };
}
