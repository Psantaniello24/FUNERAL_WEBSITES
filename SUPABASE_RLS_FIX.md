# 🔧 FIX ERRORI SUPABASE RLS - Row Level Security

## 🚨 PROBLEMA IDENTIFICATO

Gli errori che stai vedendo sono causati dalle **Row Level Security (RLS) policies** di Supabase che bloccano le operazioni di scrittura e upload.

```
❌ StorageApiError: new row violates row-level security policy
❌ Errore upload Supabase: StorageApiError: new row violates row-level security policy
```

## 🛠️ SOLUZIONE RAPIDA (2 minuti)

### **Passo 1: Disabilita RLS Temporaneamente**
Vai nel **SQL Editor** di Supabase ed esegui:

```sql
-- Disabilita RLS per la tabella necrologi
ALTER TABLE necrologi DISABLE ROW LEVEL SECURITY;

-- Elimina tutte le policy esistenti che causano conflitti
DROP POLICY IF EXISTS "Lettura pubblica necrologi" ON necrologi;
DROP POLICY IF EXISTS "Scrittura admin necrologi" ON necrologi;
DROP POLICY IF EXISTS "Scrittura solo admin autenticati" ON necrologi;
```

### **Passo 2: Configura Storage Policies**
Vai su **Storage** → **Policies** → **necrologi-files** e clicca **"New Policy"**:

#### Policy 1: INSERT (Upload)
```sql
CREATE POLICY "Consenti upload a tutti" 
ON storage.objects 
FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'necrologi-files');
```

#### Policy 2: SELECT (Download/Visualizzazione)
```sql
CREATE POLICY "Consenti lettura a tutti" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'necrologi-files');
```

#### Policy 3: DELETE (Eliminazione)
```sql
CREATE POLICY "Consenti eliminazione a tutti" 
ON storage.objects 
FOR DELETE 
TO public 
USING (bucket_id = 'necrologi-files');
```

### **Passo 3: Verifica Bucket Pubblico**
1. Vai su **Storage** → **necrologi-files**
2. Clicca sui 3 puntini → **"Edit bucket"**
3. Assicurati che **"Public bucket"** sia ✅ **attivato**

## 🧪 TEST IMMEDIATO

Dopo aver applicato le fix:

1. **Ricarica** `admin.html` (F5)
2. **Login:** `admin2024`
3. **Crea necrologio di test:**
   - Nome: "Test Fix RLS"
   - Date qualsiasi
   - Città: "Napoli" 
   - **Carica una foto** (importante per testare Storage)
4. **Verifica messaggio:** `🟢 Necrologio creato su Supabase con successo!`

## 📋 ALTERNATIVE SE IL PROBLEMA PERSISTE

### **Opzione A: Policies Più Permissive**
Se le policies sopra non funzionano, usa queste più ampie:

```sql
-- Per Storage - Accesso completo
CREATE POLICY "Accesso completo storage" 
ON storage.objects 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);
```

### **Opzione B: Disabilita RLS su Storage**
```sql
-- Disabilita RLS completamente su Storage (solo per sviluppo)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

### **Opzione C: Usa Service Key (Sviluppo)**
Se nulla funziona, temporaneamente nel `supabase-config.js`:

```javascript
const supabaseConfig = {
    url: 'https://zivcmlajjrmlzfvfgfjp.supabase.co',
    // Usa service_role key invece di anon key (SOLO PER SVILUPPO)
    anonKey: 'TUA_SERVICE_ROLE_KEY', // Da Settings > API > service_role
    // ...
};
```

⚠️ **ATTENZIONE:** La service key bypassa tutte le security policies. Usala solo per test!

## 🔐 CONFIGURAZIONE SICURA PER PRODUZIONE

Una volta che tutto funziona, per la produzione usa:

```sql
-- Riabilita RLS
ALTER TABLE necrologi ENABLE ROW LEVEL SECURITY;

-- Policy sicura per lettura
CREATE POLICY "Lettura pubblica necrologi" 
ON necrologi FOR SELECT 
TO public 
USING (status = 'active');

-- Policy per scrittura con autenticazione (opzionale)
CREATE POLICY "Scrittura autenticata" 
ON necrologi FOR INSERT 
TO authenticated 
WITH CHECK (true);
```

## 🎯 RISULTATO ATTESO

Dopo il fix dovresti vedere:

✅ **Console Browser (F12):**
```
🟢 Supabase inizializzato correttamente
📤 Upload file su Supabase Storage: photos/1234567890_foto.jpg
✅ File caricato su Supabase Storage
💾 Salvando necrologio su Supabase...
✅ Necrologio salvato su Supabase: 1
🟢 Necrologio creato su Supabase con successo!
```

✅ **Dashboard Supabase:**
- Tabella `necrologi` con il nuovo record
- Storage `necrologi-files` con la foto caricata

## 🆘 SE CONTINUI AD AVERE PROBLEMI

1. **Controlla Console Browser (F12)** per errori specifici
2. **Verifica URL e chiavi** in `supabase-config.js`
3. **Prova in modalità incognito** per escludere cache
4. **Inviami screenshot** degli errori per debug specifico

---

**🎉 Una volta risolto, avrai un sistema completamente funzionante senza errori CORS!**
