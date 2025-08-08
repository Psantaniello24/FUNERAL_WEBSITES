# 🔥 Guida Setup Firebase per Necrologi

## 📋 **Panoramica**

Il sistema è ora configurato per utilizzare **Firebase Firestore** come database di produzione per i necrologi. Questa guida ti aiuta a configurare Firebase per il tuo sito.

---

## 🚀 **Passo 1: Creare Progetto Firebase**

### **1.1 Accedi alla Console Firebase**
1. Vai su [https://console.firebase.google.com](https://console.firebase.google.com)
2. Accedi con il tuo account Google
3. Clicca **"Crea un progetto"**

### **1.2 Configura il Progetto**
1. **Nome progetto**: `sito-funebre-santaniello` (o quello che preferisci)
2. **Google Analytics**: Puoi disabilitarlo per semplicità
3. Clicca **"Crea progetto"**

---

## 🔧 **Passo 2: Configurare Firestore**

### **2.1 Attiva Firestore Database**
1. Nel menu laterale, vai su **"Firestore Database"**
2. Clicca **"Crea database"**
3. Scegli **"Inizia in modalità test"** (per ora)
4. Seleziona la **regione Europe** (europe-west1 o europe-west2)

### **2.2 Configura Regole di Sicurezza**
Nel tab **"Regole"**, sostituisci il contenuto con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Consenti lettura pubblica dei necrologi
    match /necrologi/{document} {
      allow read: if true;
      // Solo autenticati possono scrivere
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🔑 **Passo 3: Ottenere Configurazione**

### **3.1 Registra la Web App**
1. Nella **Panoramica del progetto**, clicca sull'icona **"</>"** (Web)
2. **Nome app**: `Sito Funebre Admin`
3. **NON** attivare Firebase Hosting per ora
4. Clicca **"Registra app"**

### **3.2 Copia la Configurazione**
Firebase ti mostrerà un codice simile a questo:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "tuo-progetto.firebaseapp.com",
  projectId: "tuo-progetto-id",
  storageBucket: "tuo-progetto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

---

## ⚙️ **Passo 4: Configurare il Sito**

### **4.1 Modifica firebase-config.js**
Apri `js/firebase-config.js` e sostituisci:

```javascript
// 🔥 CONFIGURAZIONE FIREBASE
const firebaseConfig = {
    // ⚠️ SOSTITUISCI CON LA TUA CONFIGURAZIONE FIREBASE
    apiKey: "your-api-key-here",              // ← Sostituisci
    authDomain: "your-project.firebaseapp.com", // ← Sostituisci
    projectId: "your-project-id",             // ← Sostituisci
    storageBucket: "your-project.appspot.com", // ← Sostituisci
    messagingSenderId: "123456789",           // ← Sostituisci
    appId: "your-app-id"                      // ← Sostituisci
};
```

Con i valori che hai copiato da Firebase.

---

## 🧪 **Passo 5: Testare l'Integrazione**

### **5.1 Testa l'Admin Panel**
1. Apri `admin.html`
2. Inserisci password: `admin2024`
3. Compila un necrologio di test
4. Clicca **"Aggiungi Necrologio"**
5. Dovresti vedere: **"🔥 Necrologio salvato su Firebase con successo!"**

### **5.2 Verifica su Firebase Console**
1. Vai su **Firestore Database** nella console
2. Dovresti vedere una collection **"necrologi"**
3. Con il documento del necrologio appena creato

### **5.3 Testa la Visualizzazione**
1. Vai su `index.html` → Sezione "Necrologi Recenti"
2. Vai su `necrologi.html` → Lista completa
3. Apri **F12 → Console** e cerca: **"🔥 Caricamento da Firebase..."**

---

## 🔒 **Passo 6: Sicurezza (Opzionale)**

### **6.1 Abilita Autenticazione**
1. Nel menu Firebase, vai su **"Authentication"**
2. Vai nel tab **"Sign-in method"**
3. Abilita **"Email/Password"**
4. Crea utente admin in **"Users"**

### **6.2 Aggiorna Regole Firestore**
Sostituisci le regole con una versione più sicura:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /necrologi/{document} {
      allow read: if true;
      allow create, update, delete: if request.auth != null 
        && request.auth.token.email in ['tuaemail@admin.com'];
    }
  }
}
```

---

## 📊 **Funzionalità Disponibili**

### **✅ Cosa Funziona Ora**
- ✅ **Salvataggio su Firebase** dall'admin panel
- ✅ **Caricamento da Firebase** su tutte le pagine
- ✅ **Persistenza offline** (dati cached)
- ✅ **Fallback locale** se Firebase non disponibile
- ✅ **Eliminazione necrologi** (soft delete)
- ✅ **Aggiornamenti in tempo reale** (opzionale)
- ✅ **Backup automatico** su localStorage

### **🎯 Sistema Ibrido**
Il sistema carica dati con questa **priorità**:
1. **🔥 Firebase** (produzione)
2. **📄 JSON file** (backup)
3. **💾 localStorage** (temporaneo)
4. **📋 Dati predefiniti** (fallback)

---

## 🆘 **Risoluzione Problemi**

### **❌ "Firebase non inizializzato"**
- Verifica che `firebase-config.js` sia incluso
- Controlla la configurazione in `firebaseConfig`
- Apri F12 Console per vedere errori

### **❌ "Permission denied"**
- Controlla le regole Firestore
- Verifica che la modalità test sia attiva
- Controlla data scadenza regole test

### **❌ "Module not found"**
- Verifica connessione internet
- I CDN Firebase potrebbero essere bloccati
- Prova a ricaricare la pagina

---

## 🎉 **Congratulazioni!**

Il tuo sito funebre ora utilizza Firebase per:
- 🔥 **Database cloud** professionale
- 📱 **Sincronizzazione tempo reale**
- 🔒 **Backup automatico**
- 🌐 **Scalabilità globale**

### **🔜 Prossimi Passi**
- [ ] Configurare autenticazione utenti
- [ ] Aggiungere notifiche push
- [ ] Implementare search avanzata
- [ ] Analytics e statistiche

**Il sistema è ora pronto per la produzione!** 🚀