-- ✅ SCRIPT SQL PER CREARE LA TABELLA CONDOGLIANZE IN SUPABASE
-- 
-- Copia e incolla questo script nella sezione SQL Editor di Supabase
-- per creare la tabella necessaria per salvare le condoglianze in modo permanente

-- 🗃️ Crea tabella condoglianze
CREATE TABLE IF NOT EXISTS condoglianze (
    id SERIAL PRIMARY KEY,
    necrologio_id VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    messaggio TEXT NOT NULL,
    data_invio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📊 Aggiungi indici per migliorare le prestazioni
CREATE INDEX IF NOT EXISTS idx_condoglianze_necrologio_id ON condoglianze(necrologio_id);
CREATE INDEX IF NOT EXISTS idx_condoglianze_status ON condoglianze(status);
CREATE INDEX IF NOT EXISTS idx_condoglianze_data_invio ON condoglianze(data_invio DESC);

-- 🔐 Abilita Row Level Security (RLS)
ALTER TABLE condoglianze ENABLE ROW LEVEL SECURITY;

-- 🗑️ Rimuovi policy esistenti se presenti (per evitare conflitti)
DROP POLICY IF EXISTS "Lettura pubblica condoglianze" ON condoglianze;
DROP POLICY IF EXISTS "Inserimento pubblico condoglianze" ON condoglianze;
DROP POLICY IF EXISTS "Aggiornamento status condoglianze" ON condoglianze;

-- 📖 Policy per lettura pubblica (tutti possono leggere le condoglianze attive)
CREATE POLICY "Lettura pubblica condoglianze" 
ON condoglianze 
FOR SELECT 
TO public 
USING (status = 'active');

-- ✍️ Policy per inserimento pubblico (tutti possono aggiungere condoglianze)
CREATE POLICY "Inserimento pubblico condoglianze" 
ON condoglianze 
FOR INSERT 
TO public 
WITH CHECK (status = 'active');

-- 🔄 Policy per aggiornamento (solo per soft delete)
CREATE POLICY "Aggiornamento status condoglianze" 
ON condoglianze 
FOR UPDATE 
TO public 
USING (true) 
WITH CHECK (status IN ('active', 'deleted'));

-- ✅ TABELLA CONDOGLIANZE CREATA CON SUCCESSO!
-- 
-- La tabella include:
-- - id: Identificativo unico auto-incrementale
-- - necrologio_id: ID del necrologio (supporta tutti i formati: numerico, con prefissi, ecc.)
-- - nome: Nome di chi invia la condoglianza
-- - email: Email (opzionale)
-- - messaggio: Testo della condoglianza
-- - data_invio: Timestamp automatico di quando è stata inviata
-- - status: Stato della condoglianza ('active' o 'deleted' per soft delete)
-- - created_at/updated_at: Timestamp di creazione e aggiornamento
--
-- Le policy RLS permettono:
-- - Lettura pubblica delle condoglianze attive
-- - Inserimento pubblico di nuove condoglianze
-- - Aggiornamento solo per cambiare lo status (soft delete)
--
-- 🎉 Ora le condoglianze saranno salvate permanentemente nel database!
