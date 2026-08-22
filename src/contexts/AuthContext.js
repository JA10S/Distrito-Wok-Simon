import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc,
  collection,
  getDocs
} from 'firebase/firestore';
import app from '../services/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const auth = useRef(getAuth(app));
  const db = useRef(getFirestore(app));

  const getUserData = useCallback(async (userId) => {
    try {
      const userDoc = await getDoc(doc(db.current, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      return null;
    }
  }, []);

  const getAllRoles = useCallback(async () => {
    try {
      const rolesSnapshot = await getDocs(collection(db.current, 'roles'));
      const rolesMap = {};
      rolesSnapshot.forEach((doc) => {
        rolesMap[doc.id] = doc.data();
      });
      return rolesMap;
    } catch (error) {
      console.error('Error al obtener roles:', error);
      return {};
    }
  }, []);

  const getUserPermissions = useCallback(async (roles) => {
    if (!roles || roles.length === 0) return [];
    
    try {
      const allRoles = await getAllRoles();
      const permissions = new Set();
      
      roles.forEach((roleName) => {
        const role = allRoles[roleName];
        if (role && role.permissions) {
          role.permissions.forEach((perm) => permissions.add(perm));
        }
      });
      
      return Array.from(permissions);
    } catch (error) {
      console.error('Error al obtener permisos:', error);
      return [];
    }
  }, [getAllRoles]);

  const login = useCallback(async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth.current, email, password);
      
      if (result.user) {
        const userData = await getUserData(result.user.uid);
        if (userData && userData.roles) {
          setUserRoles(userData.roles);
          localStorage.setItem('userRoles', JSON.stringify(userData.roles));
          const permissions = await getUserPermissions(userData.roles);
          setUserPermissions(permissions);
          return { ...result, roles: userData.roles };
        } else {
          setUserRoles([]);
          setUserPermissions([]);
          localStorage.setItem('userRoles', '[]');
          return { ...result, roles: [] };
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  }, [getUserData, getUserPermissions]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth.current);
      setUserRoles([]);
      setUserPermissions([]);
      localStorage.removeItem('userRoles');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }, []);

  const hasPermission = useCallback((permission) => {
    return userPermissions.includes(permission);
  }, [userPermissions]);

  const hasAnyPermission = useCallback((permissions) => {
    return permissions.some((perm) => userPermissions.includes(perm));
  }, [userPermissions]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth.current, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userData = await getUserData(user.uid);
        if (userData && userData.roles) {
          setUserRoles(userData.roles);
          localStorage.setItem('userRoles', JSON.stringify(userData.roles));
          const permissions = await getUserPermissions(userData.roles);
          setUserPermissions(permissions);
        } else {
          setUserRoles([]);
          setUserPermissions([]);
          localStorage.removeItem('userRoles');
        }
      } else {
        setUserRoles([]);
        setUserPermissions([]);
        localStorage.removeItem('userRoles');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [getUserData, getUserPermissions]);

  const value = {
    currentUser,
    userRoles,
    userPermissions,
    hasPermission,
    hasAnyPermission,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
