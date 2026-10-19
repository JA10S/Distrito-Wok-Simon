// Repara settings/theme con la paleta Clásico Diurna limpia.
// Uso: node scripts/repair-theme.js
// Credenciales de prueba del repo (misma práctica que add-new-permissions.js).

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, signOut } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyCQn0wLcAi8thj4Z4ACYG_oSEHntmW1EuU',
  authDomain: 'distrito-wok-simon.firebaseapp.com',
  projectId: 'distrito-wok-simon'
};

// Debe coincidir con PRESETS.clasico.light en src/utils/themeUtils.js
const LIGHT_CLASICO = {
  dorado: '#967A24',
  doradoClaro: '#3E3313',
  doradoOscuro: '#8B6914',
  rojo: '#B0121A',
  rojoOscuro: '#8B0A10',
  negro: '#16130E',
  surface: '#F2F0E9',
  surface2: '#FBFAF6',
  surfaceCard: '#FBFAF6',
  surfaceHero: '#FBFAF6',
  surfaceHeader: '#F2F0E9',
  surfaceFooter: '#FBFAF6',
  surface3: '#E9E6DB',
  ink: '#16130E',
  inkMuted: '#6D6350',
  border: '#D8D3C2'
};

(async () => {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInWithEmailAndPassword(auth, 'admin@distritowok.com', 'Admin123456');
  console.log('[OK] Autenticado como admin de pruebas');

  const ref = doc(db, 'settings', 'theme');
  const snap = await getDoc(ref);
  const prev = snap.exists() ? snap.data() : {};

  const theme = {
    preset: 'clasico',
    mode: 'light',
    layout: prev.layout || 'side',
    radius: prev.radius || 'md',
    colors: LIGHT_CLASICO,
    headingFont: prev.headingFont || 'cormorant',
    bodyFont: prev.bodyFont || 'montserrat'
  };

  await setDoc(ref, theme, { merge: false });
  console.log('[OK] settings/theme sobrescrito con la paleta Clásico Diurna limpia');
  console.log(JSON.stringify(theme, null, 2));

  await signOut(auth);
  process.exit(0);
})().catch((error) => {
  console.error('[ERROR]', error.message);
  process.exit(1);
});
