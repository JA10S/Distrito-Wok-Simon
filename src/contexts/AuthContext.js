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
import LoadingScreen from '../components/common/LoadingScreen';

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
  const loadedUidRef = useRef(null);

  const readCache = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  };

  const writeCache = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* almacenamiento no disponible */
    }
  };

  const clearAccess = () => {
    setUserRoles([]);
    setUserPermissions([]);
    loadedUidRef.current = null;
    localStorage.removeItem('userRoles');
    localStorage.removeItem('userPermissions');
  };

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

  /* Trae usuario y roles en paralelo (antes eran 2 llamadas encadenadas) */
  const loadAccessData = useCallback(async (userId) => {
    try {
      const [userData, allRoles] = await Promise.all([
        getUserData(userId),
        getAllRoles()
      ]);
      const roles = userData && userData.roles ? userData.roles : null;
      if (!roles) return { hasAccess: false, roles: [], permissions: [] };
      const permissions = new Set();
      roles.forEach((roleName) => {
        const role = allRoles[roleName];
        if (role && role.permissions) {
          role.permissions.forEach((perm) => permissions.add(perm));
        }
      });
      return { hasAccess: true, roles, permissions: Array.from(permissions) };
    } catch (error) {
      console.error('Error al cargar acceso:', error);
      return { hasAccess: false, roles: [], permissions: [] };
    }
  }, [getUserData, getAllRoles]);

  const login = useCallback(async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth.current, email, password);

      if (result.user) {
        const access = await loadAccessData(result.user.uid);
        if (access.hasAccess) {
          setUserRoles(access.roles);
          setUserPermissions(access.permissions);
          writeCache('userRoles', access.roles);
          writeCache('userPermissions', access.permissions);
          loadedUidRef.current = result.user.uid;
          return { ...result, roles: access.roles };
        } else {
          clearAccess();
          return { ...result, roles: [] };
        }
      }

      return result;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  }, [loadAccessData]);

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
    const unsubscribe = onAuthStateChanged(auth.current, (user) => {
      setCurrentUser(user);

      if (!user) {
        clearAccess();
        setLoading(false);
        return;
      }

      /* Pintar enseguida con los roles/permisos guardados en este dispositivo:
         el render NO espera a Firestore (los permisos son solo de UI,
         la seguridad real la aplican las reglas de Firestore). */
      const cachedRoles = readCache('userRoles');
      if (cachedRoles.length > 0) {
        setUserRoles(cachedRoles);
        setUserPermissions(readCache('userPermissions'));
      }
      setLoading(false);

      if (loadedUidRef.current === user.uid) return;

      /* Refresco en segundo plano (usuario + roles en paralelo) */
      loadAccessData(user.uid).then((access) => {
        loadedUidRef.current = user.uid;
        if (access.hasAccess) {
          setUserRoles(access.roles);
          setUserPermissions(access.permissions);
          writeCache('userRoles', access.roles);
          writeCache('userPermissions', access.permissions);
        } else {
          clearAccess();
        }
      });
    });

    return unsubscribe;
  }, [loadAccessData]);

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
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
}
