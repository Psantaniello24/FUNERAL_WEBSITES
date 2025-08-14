-- 🔧 SCRIPT PER CORREGGERE ID INCONSISTENTI NELLE CONDOGLIANZE
-- 
-- Questo script corregge il problema degli ID inconsistenti tra salvataggio e caricamento
-- Esegui questo script in Supabase SQL Editor per sistemare i dati esistenti

-- 1️⃣ VEDI LO STATO ATTUALE
SELECT 
    necrologio_id,
    COUNT(*) as numero_condoglianze
FROM condoglianze 
WHERE status = 'active'
GROUP BY necrologio_id
ORDER BY necrologio_id;

-- 2️⃣ MOSTRA TUTTI I DATI DETTAGLIATI
SELECT 
    id,
    necrologio_id,
    nome,
    messaggio,
    data_invio
FROM condoglianze 
WHERE status = 'active'
ORDER BY necrologio_id, data_invio DESC;

-- 3️⃣ SE VEDI ID INCONSISTENTI (es: alcuni con "fallback_1" e altri con "1")
-- PUOI CORREGGERE MANUALMENTE CON QUESTI COMANDI:

-- Esempio: Se hai condoglianze salvate con ID "1" ma il necrologio usa "fallback_1"
-- UPDATE condoglianze 
-- SET necrologio_id = 'fallback_1' 
-- WHERE necrologio_id = '1' AND status = 'active';

-- Esempio: Se hai condoglianze salvate con ID "test_123" ma il necrologio usa "123"  
-- UPDATE condoglianze 
-- SET necrologio_id = '123' 
-- WHERE necrologio_id = 'test_123' AND status = 'active';

-- 4️⃣ VERIFICA DOPO LE CORREZIONI
SELECT 
    necrologio_id,
    COUNT(*) as numero_condoglianze,
    STRING_AGG(nome, ', ') as nomi_mittenti
FROM condoglianze 
WHERE status = 'active'
GROUP BY necrologio_id
ORDER BY necrologio_id;

-- ✅ ISTRUZIONI:
-- 1. Esegui prima le query SELECT per vedere lo stato attuale
-- 2. Identifica gli ID inconsistenti confrontando con gli ID dei necrologi nel tuo sito
-- 3. Usa i comandi UPDATE per correggere gli ID dove necessario
-- 4. Ricontrolla con l'ultima SELECT
--
-- 🎯 OBIETTIVO: 
-- Ogni condoglianza deve avere necrologio_id IDENTICO all'ID usato nella pagina del necrologio
