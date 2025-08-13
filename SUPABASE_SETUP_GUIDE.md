# 🟢 GUIDA SETUP SUPABASE - Migrazione da Firebase

## 🎯 Perché Supabase?

**Problemi Firebase risolti:**
- ❌ Errori CORS complessi da configurare
- ❌ Configurazione Storage complicata
- ❌ Regole di sicurezza complesse
- ❌ CDN a volte bloccati da firewall

**Vantaggi Supabase:**
- ✅ **Zero problemi CORS** - funziona out-of-the-box
- ✅ **Storage semplice** - upload diretto senza configurazioni
- ✅ **Database PostgreSQL** - più potente di Firestore
- ✅ **Dashboard intuitiva** - gestione facile
- ✅ **API REST automatiche** - nessuna configurazione manuale

---

## 🚀 SETUP RAPIDO (10 minuti)

### **Passo 1: Crea Account Supabase**
1. Vai su [https://supabase.com](https://supabase.com)
2. Clicca **"Start your project"**
3. Registrati con GitHub, Google, o email
4. Verifica email se richiesto

### **Passo 2: Crea Nuovo Progetto**
1. Clicca **"New project"**
2. Scegli organizzazione (o creane una)
3. Compila:
   - **Name:** `Santaniello Necrologi`
   - **Database Password:** `una password sicura` (salvala!)
   - **Region:** `Europe West (Ireland)` o `Europe Central (Frankfurt)`
   - **Pricing Plan:** `Free` (0$/mese)
4. Clicca **"Create new project"**
5. ⏳ Attendi 2-3 minuti per il provisioning

### **Passo 3: Ottieni Configurazione**
1. Nella dashboard, vai su **Settings** > **API**
2. Copia questi valori:
   - **Project URL** (es: `https://xyzcompany.supabase.co`)
   - **anon/public key** (la chiave lunga che inizia con `eyJ...`)

### **Passo 4: Configura il Progetto**
1. Apri `js/supabase-config.js`
2. Sostituisci le righe 8-9:

```javascript
// PRIMA:
url: 'YOUR_SUPABASE_URL',
anonKey: 'YOUR_SUPABASE_ANON_KEY',

// DOPO:
url: 'https://tuoprogettosupabase.supabase.co',
anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
```

### **Passo 5: Crea Tabella Database**
1. Nella dashboard Supabase, vai su **SQL Editor**
2. Clicca **"New query"**
3. Incolla e esegui questo SQL:

```sql
-- Crea tabella necrologi
CREATE TABLE necrologi (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birth_date DATE,
    death_date DATE,
    age INTEGER,
    city VARCHAR(255),
    description TEXT,
    funeral_date TIMESTAMP,
    funeral_location VARCHAR(255),
    photo_url TEXT,
    photo_file_name VARCHAR(255),
    photo_file_size INTEGER,
    photo_file_type VARCHAR(100),
    manifesto_url TEXT,
    manifesto_file_name VARCHAR(255),
    manifesto_file_size INTEGER,
    manifesto_file_type VARCHAR(100),
    publish_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Abilita Row Level Security (opzionale, per sicurezza)
ALTER TABLE necrologi ENABLE ROW LEVEL SECURITY;

-- Policy per lettura pubblica
CREATE POLICY "Lettura pubblica necrologi" 
ON necrologi FOR SELECT 
TO public 
USING (status = 'active');

-- Policy per scrittura (solo admin - opzionale)
CREATE POLICY "Scrittura admin necrologi" 
ON necrologi FOR ALL 
TO public 
USING (true);
```

4. Clicca **"Run"** (pulsante play)
5. Verifica che appaia "Success. No rows returned"

### **Passo 6: Crea Storage Bucket**
1. Vai su **Storage** nella sidebar
2. Clicca **"Create a new bucket"**
3. Compila:
   - **Name:** `necrologi-files`
   - **Public bucket:** ✅ **Sì** (per accesso diretto alle immagini)
4. Clicca **"Create bucket"**
5. Il bucket apparirà nella lista

### **Passo 7: Configura Storage Policy**
1. Nel bucket `necrologi-files`, clicca sui 3 puntini → **"Manage policies"**
2. Clicca **"New policy"** per INSERT
3. Scegli **"Get started quickly"** → **"Enable insert for all users"**
4. Clicca **"Save policy"**
5. Ripeti per SELECT: **"Enable read access for all users"**
6. Ripeti per DELETE: **"Enable delete for all users"**

---

## 🧪 TEST FUNZIONALITÀ

### **Passo 1: Test Connessione**
1. Apri il sito e vai su `admin.html`
2. Apri Console (F12)
3. Dovresti vedere:
   ```
   ✅ Supabase inizializzato correttamente
   ✅ Supabase Manager pronto
   ```

### **Passo 2: Test Upload**
1. Inserisci password admin: `admin2024`
2. Compila form necrologio di test:
   - Nome: "Test Supabase"
   - Date di nascita/morte
   - Città: "Napoli"
   - Carica una foto di test
3. Clicca **"Crea Necrologio"**
4. Dovresti vedere: `✅ Necrologio salvato su Supabase`

### **Passo 3: Verifica Database**
1. Vai su **Table Editor** > **necrologi** in Supabase
2. Dovresti vedere il record appena creato
3. Vai su **Storage** > **necrologi-files**
4. Dovresti vedere la foto caricata

---

## 🔄 MIGRAZIONE DA FIREBASE

### **Opzione A: Migrazione Automatica (Consigliata)**
Il sistema è progettato per funzionare in parallelo:
1. ✅ I dati Firebase esistenti continuano a funzionare
2. ✅ I nuovi dati vanno automaticamente su Supabase
3. ✅ Nessuna perdita di dati

### **Opzione B: Migrazione Manuale**
Se vuoi migrare tutti i dati esistenti:

1. **Esporta da Firebase:**
   - Vai su Firebase Console > Firestore
   - Esporta collection `necrologi`

2. **Importa in Supabase:**
   - Usa il SQL Editor per inserimenti bulk
   - O usa l'API REST per import automatico

### **Opzione C: Doppio Sistema**
Mantieni entrambi i sistemi attivi:
- Firebase per dati esistenti
- Supabase per dati nuovi

---

## 🎛️ CONFIGURAZIONI AVANZATE

### **1. Autenticazione Admin (Opzionale)**
```sql
-- Crea tabella utenti admin
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Policy più sicura
DROP POLICY "Scrittura admin necrologi" ON necrologi;
CREATE POLICY "Scrittura solo admin autenticati" 
ON necrologi FOR ALL 
TO authenticated
USING (auth.jwt() ->> 'email' IN (
    SELECT email FROM admin_users WHERE role = 'admin'
));
```

### **2. Backup Automatico**
```sql
-- Funzione backup automatico
CREATE OR REPLACE FUNCTION backup_necrologio()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO necrologi_backup (
        original_id, action, data, created_at
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        row_to_json(COALESCE(NEW, OLD)),
        NOW()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger per backup
CREATE TRIGGER backup_necrologi_changes
    AFTER INSERT OR UPDATE OR DELETE ON necrologi
    FOR EACH ROW EXECUTE FUNCTION backup_necrologio();
```

### **3. Ottimizzazioni Performance**
```sql
-- Indici per query veloci
CREATE INDEX idx_necrologi_status ON necrologi(status);
CREATE INDEX idx_necrologi_city ON necrologi(city);
CREATE INDEX idx_necrologi_date ON necrologi(death_date DESC);
CREATE INDEX idx_necrologi_created ON necrologi(created_at DESC);
```

---

## 📊 MONITORAGGIO

### **Dashboard Supabase:**
- **Database:** Visualizza tabelle e dati
- **Storage:** Gestisce file caricati  
- **API:** Monitora chiamate e performance
- **Logs:** Debug errori e problemi
- **Settings:** Configurazioni progetto

### **Metriche Utili:**
- Numero necrologi totali
- Upload file giornalieri
- Traffico API
- Spazio storage utilizzato

---

## 🆘 RISOLUZIONE PROBLEMI

### **❌ "Supabase SDK non caricato"**
**Soluzione:**
```html
<!-- Aggiungi prima di supabase-config.js -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### **❌ "Configurazione non impostata"**
**Soluzione:**
1. Verifica che `url` e `anonKey` siano corretti
2. Rimuovi spazi extra dalle chiavi
3. Assicurati che l'URL finisca con `.supabase.co`

### **❌ "Permission denied"**
**Soluzione:**
1. Verifica RLS policies nella dashboard
2. Controlla che il bucket sia pubblico
3. Verifica configurazione API settings

### **❌ "Tabella non esiste"**
**Soluzione:**
1. Esegui di nuovo lo script SQL di creazione
2. Verifica nome tabella in `supabase-config.js`
3. Controlla errori nel SQL Editor

---

## 🎉 VANTAGGI OTTENUTI

| Caratteristica | Firebase | Supabase |
|----------------|----------|----------|
| **Setup CORS** | ❌ Complesso | ✅ Automatico |
| **Upload File** | ❌ Regole complesse | ✅ Drag & drop |
| **Database** | ❌ NoSQL limitato | ✅ PostgreSQL completo |
| **Dashboard** | ❌ Dispersiva | ✅ Tutto in un posto |
| **Costo** | ❌ Caro per storage | ✅ Gratuito fino a 500MB |
| **Performance** | ❌ Variabile | ✅ Consistente |
| **Backup** | ❌ Manuale | ✅ Automatico |

---

## 🔜 PROSSIMI PASSI

Dopo la migrazione puoi:
- [ ] **Autenticazione utenti** completa
- [ ] **Notifiche real-time** per nuovi necrologi
- [ ] **API REST** per integrazioni esterne
- [ ] **Analytics** avanzate
- [ ] **Multi-tenant** per più aziende funebri
- [ ] **App mobile** con stesso backend

---

**✅ Migrazione completata!** Il tuo sito ora usa Supabase senza problemi CORS! 🚀
