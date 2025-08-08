# 📖 Guida Completa - Sistema Gestione Necrologi

## 🎯 **Come Aggiungere Necrologi Facilmente**

Hai ora **3 modi semplici** per aggiungere e gestire necrologi sul tuo sito!

---

## 🔧 **Metodo 1: Pannello Admin (Più Facile)**

### **Accesso**
1. **Dal sito**: Clicca l'icona **⚙️** nell'header del sito
2. **URL diretto**: `tuodominio.com/admin.html`

### **Come Usare il Pannello**
1. **Compila il form** con tutti i dati del necrologio:
   - ✅ Nome completo del defunto
   - ✅ Date di nascita e morte (età calcolata automaticamente)
   - ✅ Comune di residenza
   - ✅ Foto (URL opzionale)
   - ✅ Testo commemorativo
   - ✅ Dettagli funerale (data, ora, luogo)

2. **Vedi l'anteprima** in tempo reale mentre compili

3. **Copia il codice** generato automaticamente

4. **Incolla in `js/main.js`** nella sezione obituaries

### **✨ Vantaggi**
- ✅ **Interfaccia grafica** user-friendly
- ✅ **Anteprima immediata** del risultato
- ✅ **Codice auto-generato** pronto per l'uso
- ✅ **Salvataggio locale** temporaneo
- ✅ **Validazione automatica** dei campi

---

## 📄 **Metodo 2: File JSON (Più Professionale)**

### **File**: `data/necrologi.json`

### **Struttura Necrologio**
```json
{
  "id": 4,
  "name": "Nome Cognome",
  "birthDate": "1950-05-15",
  "deathDate": "2024-02-01",
  "age": 73,
  "city": "Napoli",
  "photo": "https://esempio.com/foto.jpg",
  "description": "Testo commemorativo...",
  "funeralDate": "2024-02-03T15:00",
  "funeralLocation": "Chiesa San Giuseppe, Via Roma 45",
  "publishDate": "2024-02-01"
}
```

### **Come Aggiungere**
1. **Apri** `data/necrologi.json`
2. **Aggiungi** una virgola dopo l'ultimo necrologio
3. **Incolla** il nuovo necrologio prima della parentesi finale
4. **Salva** il file
5. **Ricarica** il sito - appare automaticamente!

### **✨ Vantaggi**
- ✅ **Caricamento automatico** all'avvio
- ✅ **Backup permanente** dei dati
- ✅ **Facile da modificare** con editor
- ✅ **Struttura organizzata**

---

## 💻 **Metodo 3: Modifica Codice JavaScript**

### **File**: `js/main.js` → Classe `ObituariesManager`

### **Come Aggiungere**
1. **Trova** la sezione `loadDefaultObituaries()`
2. **Aggiungi** il nuovo necrologio nell'array:

```javascript
{
    id: 4,
    nome: "Nome Cognome",
    dataNascita: "1950-05-15",
    dataMorte: "2024-02-01",
    eta: 73,
    foto: "https://esempio.com/foto.jpg",
    luogoEsequie: "Chiesa San Giuseppe, Via Roma 45",
    oraEsequie: "15:00",
    dataEsequie: "2024-02-03",
    testo: "Testo commemorativo...",
    comune: "Napoli",
    condoglianze: []
}
```

---

## 🔄 **Sistema Automatico**

### **Come Funziona**
Il sistema **carica automaticamente** necrologi da:

1. **File JSON** (`data/necrologi.json`) - Dati permanenti
2. **LocalStorage Admin** - Necrologi aggiunti dal pannello
3. **Fallback JavaScript** - Se JSON non disponibile

### **Priorità di Caricamento**
```
JSON + Admin → JavaScript Fallback → Errore
```

### **Sincronizzazione**
- ✅ **Aggiornamento automatico** delle visualizzazioni
- ✅ **Merge intelligente** di fonti multiple
- ✅ **Conversione formati** automatica
- ✅ **Backup di sicurezza** sempre attivo

---

## 📊 **Statistiche e Monitoraggio**

### **Console Log**
Apri **F12 → Console** per vedere:
```
✅ Caricati 5 necrologi (3 da JSON, 2 da admin)
```

### **Verifica Funzionamento**
1. **Homepage**: Controlla sezione "Necrologi Recenti"
2. **Pagina Necrologi**: Verifica lista completa
3. **Console**: Conferma caricamento dati

---

## 🎨 **Personalizzazioni Avanzate**

### **Campi Disponibili**
- ✅ **Nome completo**
- ✅ **Date nascita/morte + età**
- ✅ **Foto** (URL o placeholder)
- ✅ **Comune di residenza**
- ✅ **Testo commemorativo**
- ✅ **Dettagli funerale** (data, ora, luogo)
- ✅ **Data pubblicazione**
- ✅ **Sistema condoglianze**

### **Filtri e Ricerca**
- 🔍 **Ricerca per nome**
- 🏘️ **Filtro per comune**
- 📅 **Ordinamento per data**
- 🎯 **Combinazione filtri**

---

## 🛠️ **Risoluzione Problemi**

### **Necrologio Non Appare**
1. **Controlla Console** (F12) per errori
2. **Verifica JSON** con validator online
3. **Controlla ID univoci** (no duplicati)
4. **Ricarica pagina** con Ctrl+F5

### **Foto Non Carica**
1. **URL pubblico** e accessibile
2. **HTTPS** se sito è HTTPS
3. **Dimensioni ragionevoli** (max 1MB)
4. **Formato supportato** (jpg, png, webp)

### **Errori Comuni**
- ❌ **Virgole mancanti** nel JSON
- ❌ **Date formato sbagliato** (usa YYYY-MM-DD)
- ❌ **ID duplicati**
- ❌ **Virgolette non chiuse**

---

## 🎯 **Best Practices**

### **Gestione Foto**
- ✅ **Unsplash** per foto di prova: `https://images.unsplash.com/photo-ID?w=300&h=400&fit=crop`
- ✅ **Dimensioni ottimali**: 300x400px
- ✅ **Formato consigliato**: JPG o WebP
- ✅ **Backup locale** per foto importanti

### **Testi Commemorativi**
- ✅ **Lunghezza ideale**: 50-150 parole
- ✅ **Tono rispettoso** e appropriato
- ✅ **Informazioni essenziali**: famiglia, qualità personali
- ✅ **Evita caratteri speciali** nelle stringhe JSON

### **Organizzazione**
- ✅ **ID progressivi** (1, 2, 3, ...)
- ✅ **Date aggiornate** e realistiche
- ✅ **Backup regolari** del file JSON
- ✅ **Test dopo ogni modifica**

---

## 🚀 **Workflow Consigliato**

### **Per Aggiunta Rapida**
1. **Usa Pannello Admin** per creare
2. **Copia codice generato**
3. **Incolla in JSON** per permanenza
4. **Test e verifica**

### **Per Gestione Professionale**
1. **Modifica diretta JSON**
2. **Usa editor con validazione**
3. **Backup prima delle modifiche**
4. **Deploy e test completo**

---

## 📞 **Supporto Tecnico**

### **Debug Veloce**
```javascript
// Console del browser
console.log(window.obituariesManager.obituaries);
```

### **Reset Sistema**
```javascript
// Pulisce localStorage admin
localStorage.removeItem('adminObituaries');
location.reload();
```

### **Informazioni Sistema**
Il sistema è **completamente client-side**, quindi:
- ✅ **Nessun database** richiesto
- ✅ **Funziona su hosting statico**
- ✅ **Compatible con GitHub Pages/Netlify/Render**
- ✅ **Backup nei file**

---

**🎉 Il sistema è ora pronto per gestire necrologi in modo semplice e professionale!**