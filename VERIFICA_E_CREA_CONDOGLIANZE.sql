-- 🔍 SCRIPT DI VERIFICA E CREAZIONE TABELLA CONDOGLIANZE
-- Esegui questo script per verificare se la tabella esiste e crearla se necessario

-- 1️⃣ VERIFICA SE LA TABELLA ESISTE
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'condoglianze';

-- Se il risultato è vuoto, la tabella non esiste e devi eseguire il resto dello script
-- Se vedi 'condoglianze' nel risultato, la tabella esiste già

-- 2️⃣ CREA LA TABELLA (solo se non esiste)
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

-- 3️⃣ CREA INDICI (solo se non esistono)
CREATE INDEX IF NOT EXISTS idx_condoglianze_necrologio_id ON condoglianze(necrologio_id);
CREATE INDEX IF NOT EXISTS idx_condoglianze_status ON condoglianze(status);
CREATE INDEX IF NOT EXISTS idx_condoglianze_data_invio ON condoglianze(data_invio DESC);

-- 4️⃣ ABILITA RLS
ALTER TABLE condoglianze ENABLE ROW LEVEL SECURITY;

-- 5️⃣ RIMUOVI POLICY ESISTENTI (per evitare errori)
DROP POLICY IF EXISTS "Lettura pubblica condoglianze" ON condoglianze;
DROP POLICY IF EXISTS "Inserimento pubblico condoglianze" ON condoglianze;
DROP POLICY IF EXISTS "Aggiornamento status condoglianze" ON condoglianze;

-- 6️⃣ CREA POLICY NUOVE
CREATE POLICY "Lettura pubblica condoglianze" 
ON condoglianze 
FOR SELECT 
TO public 
USING (status = 'active');

CREATE POLICY "Inserimento pubblico condoglianze" 
ON condoglianze 
FOR INSERT 
TO public 
WITH CHECK (status = 'active');

CREATE POLICY "Aggiornamento status condoglianze" 
ON condoglianze 
FOR UPDATE 
TO public 
USING (true) 
WITH CHECK (status IN ('active', 'deleted'));

-- 7️⃣ VERIFICA FINALE
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'condoglianze' 
ORDER BY ordinal_position;

-- 8️⃣ VERIFICA POLICY
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'condoglianze';

-- ✅ SE VEDI I RISULTATI DELLE QUERY 7 E 8, LA TABELLA È CONFIGURATA CORRETTAMENTE!
