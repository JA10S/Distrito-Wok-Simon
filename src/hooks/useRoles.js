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

export function useRoles() {
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'roles'),
      (snapshot) => {
        const rolesData = {};
        snapshot.forEach((doc) => {
          rolesData[doc.id] = doc.data();
        });
        setRoles(rolesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching roles:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateRole = async (roleId, permissions) => {
    try {
      await updateDoc(doc(db, 'roles', roleId), {
        permissions,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating role:', error);
      return { success: false, error: error.message };
    }
  };

  return { roles, loading, updateRole };
}

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersData = [];
        snapshot.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() });
        });
        setUsers(usersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateUserRoles = async (userId, roles) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        roles,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user roles:', error);
      return { success: false, error: error.message };
    }
  };

  const createUser = async (userData) => {
    try {
      await setDoc(doc(db, 'users', userData.uid), {
        ...userData,
        createdAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  };

  return { users, loading, updateUserRoles, createUser };
}
