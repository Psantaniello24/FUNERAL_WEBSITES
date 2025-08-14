// Supabase Configuration e Setup
// ================================

// 🟢 CONFIGURAZIONE SUPABASE
const supabaseConfig = {
    // ⚠️ SOSTITUISCI CON LA TUA CONFIGURAZIONE SUPABASE
    // Vai su https://supabase.com/dashboard
    // Crea un nuovo progetto
    // Copia URL e anon key da Settings > API
    url: 'https://zivcmlajjrmlzfvfgfjp.supabase.co', // Es: https://xyzcompany.supabase.co
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppdmNtbGFqanJtbHpmdmZnZmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMDUzMTYsImV4cCI6MjA3MDU4MTMxNn0.p72To6q8vuuDnoXF7eLcih5nJkjlbqsJ01GQB7crHC0', // La chiave pubblica (anon/public)
    
    // Configurazioni opzionali
    options: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        },
        realtime: {
            params: {
                eventsPerSecond: 2
            }
        }
    }
};

// 🏗️ INIZIALIZZAZIONE SUPABASE
class SupabaseManager {
    constructor() {
        this.supabase = null;
        this.isInitialized = false;
        this.isOnline = navigator.onLine;
        this.tableName = 'necrologi';
        this.bucketName = 'necrologi-files';
        
        // Monitora connessione
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🟢 Connessione Supabase ripristinata');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('🔴 Connessione Supabase persa - modalità offline');
        });
    }

    // 🚀 Inizializza Supabase
    async init() {
        try {
            // Controlla se Supabase è disponibile
            if (typeof supabase === 'undefined') {
                console.warn('⚠️ Supabase SDK non caricato');
                return false;
            }

            // Controlla configurazione
            if (supabaseConfig.url === 'YOUR_SUPABASE_URL' || 
                supabaseConfig.anonKey === 'YOUR_SUPABASE_ANON_KEY') {
                console.warn('⚠️ Configurazione Supabase non impostata');
                console.warn('💡 Aggiorna supabaseConfig in js/supabase-config.js');
                return false;
            }

            // Inizializza client Supabase
            this.supabase = supabase.createClient(
                supabaseConfig.url, 
                supabaseConfig.anonKey,
                supabaseConfig.options
            );

            // Test connessione
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('count', { count: 'exact', head: true });

            if (error && error.code !== 'PGRST116') { // PGRST116 = tabella non esiste (ok per primo avvio)
                console.warn('⚠️ Errore connessione Supabase:', error.message);
                return false;
            }

            this.isInitialized = true;
            console.log('✅ Supabase inizializzato correttamente');
            
            // Crea tabella se non esiste
            await this.createTableIfNotExists();
            
            // Crea bucket se non esiste
            await this.createBucketIfNotExists();
            
            return true;
            
        } catch (error) {
            console.error('❌ Errore inizializzazione Supabase:', error);
            this.isInitialized = false;
            return false;
        }
    }

    // 🗃️ Crea tabella necrologi se non esiste
    async createTableIfNotExists() {
        try {
            // Supabase gestisce automaticamente la creazione tramite Dashboard
            // Questa è solo una verifica
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('id')
                .limit(1);

            if (error && error.code === 'PGRST116') {
                console.log('📋 Tabella necrologi non trovata');
                console.log('💡 Crea la tabella dalla Dashboard Supabase:');
                console.log(`
CREATE TABLE ${this.tableName} (
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
                `);
            }
        } catch (error) {
            console.warn('⚠️ Impossibile verificare tabella:', error.message);
        }
    }

    // 🪣 Crea bucket storage se non esiste
    async createBucketIfNotExists() {
        try {
            // Metodo più affidabile: testa direttamente l'accesso al bucket
            // invece di usare listBuckets() che può fallire con anon key
            const { data: testAccess, error: accessError } = await this.supabase.storage
                .from(this.bucketName)
                .list('', { limit: 1 });
            
            if (!accessError) {
                // Bucket esiste ed è accessibile
                console.log('✅ Bucket storage già esistente e accessibile:', this.bucketName);
                return;
            }
            
            console.warn('⚠️ Errore accesso bucket:', accessError.message);
            
            // Se errore non è "bucket not found", potrebbe essere un problema di policy
            if (!accessError.message.includes('not found') && !accessError.message.includes('does not exist')) {
                console.error('❌ PROBLEMA POLICY BUCKET - Verifica le policy RLS su Supabase Dashboard');
                console.log('🔧 Vai su: Supabase Dashboard > Storage > necrologi-files > Policies');
                console.log('📋 Assicurati che ci siano policy per SELECT, INSERT, UPDATE, DELETE pubbliche');
                // Non bloccare l'esecuzione, continua comunque
                return;
            }

            // Solo se il bucket veramente non esiste, prova a crearlo
            console.log('🔄 Bucket non trovato, tentativo di creazione...');
            const bucketExists = false; // Forza creazione
            
            if (!bucketExists) {
                // Crea bucket automaticamente
                console.log('🔄 Creando bucket mancante:', this.bucketName);
                
                const { data, error } = await this.supabase.storage.createBucket(this.bucketName, {
                    public: true, // Files pubblicamente accessibili
                    allowedMimeTypes: ['image/*', 'application/pdf'],
                    fileSizeLimit: 10485760 // 10MB
                });

                if (error) {
                    console.error('❌ Errore creazione bucket automatica:', error.message);
                    console.log('💡 AZIONE RICHIESTA: Crea manualmente il bucket dalla Dashboard Supabase:');
                    console.log(`   1. Vai su Storage → New bucket`);
                    console.log(`   2. Name: ${this.bucketName}`);
                    console.log(`   3. Public bucket: ✅ SÌ`);
                    console.log(`   4. File size limit: 10MB`);
                    return false;
                } else {
                    console.log('✅ Bucket storage creato automaticamente:', this.bucketName);
                    
                    // Crea policy di accesso pubblico
                    try {
                        // Nota: questo potrebbe non funzionare con anon key, ma proviamo
                        await this.createPublicStoragePolicy();
                    } catch (policyError) {
                        console.warn('⚠️ Policy automatica fallita, configura manualmente');
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Errore gestione bucket:', error.message);
        }
    }

    // 🔐 Crea policy di accesso pubblico per storage
    async createPublicStoragePolicy() {
        try {
            // Crea policy per accesso pubblico (potrebbe fallire con anon key)
            const policySQL = `
                CREATE POLICY IF NOT EXISTS "Public access necrologi" 
                ON storage.objects 
                FOR ALL 
                TO public 
                USING (bucket_id = '${this.bucketName}');
            `;
            
            // Nota: questo richiede privilegi admin, quindi potrebbe fallire
            console.log('🔐 Tentativo creazione policy storage...');
            // Non possiamo eseguire SQL direttamente con anon key
            console.log('💡 Policy da creare manualmente se necessario');
            
        } catch (error) {
            console.warn('⚠️ Impossibile creare policy automaticamente:', error.message);
        }
    }

    // 📁 Upload file su Supabase Storage
    async uploadFile(file, path) {
        if (!this.isInitialized || !file) {
            throw new Error('Supabase non inizializzato o file mancante');
        }

        try {
            // Genera nome file unico
            const timestamp = Date.now();
            const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const fullPath = `${path}/${fileName}`;

            console.log('📤 Upload file su Supabase Storage:', fullPath);

            // Upload file
            const { data, error } = await this.supabase.storage
                .from(this.bucketName)
                .upload(fullPath, file, {
                    cacheControl: '3600',
                    upsert: false // Non sovrascrivere file esistenti
                });

            if (error) {
                console.error('❌ Errore upload Supabase:', error);
                throw error;
            }

            // Ottieni URL pubblico
            const { data: urlData } = this.supabase.storage
                .from(this.bucketName)
                .getPublicUrl(fullPath);

            console.log('✅ File caricato su Supabase Storage');

            return {
                downloadURL: urlData.publicUrl,
                fullPath: fullPath,
                name: file.name,
                size: file.size,
                type: file.type,
                bucket: this.bucketName
            };

        } catch (error) {
            console.error('❌ Errore upload Supabase Storage:', error);
            throw error;
        }
    }

    // 🗑️ Elimina file da Supabase Storage
    async deleteFile(filePath) {
        if (!this.isInitialized || !filePath) {
            return;
        }

        try {
            const { error } = await this.supabase.storage
                .from(this.bucketName)
                .remove([filePath]);

            if (error) {
                console.warn('⚠️ Errore eliminazione file Storage:', error.message);
            } else {
                console.log('✅ File eliminato da Storage:', filePath);
            }
        } catch (error) {
            console.warn('⚠️ Errore eliminazione file:', error.message);
        }
    }

    // 💾 Salva necrologio su Supabase
    async saveObituary(obituaryData) {
        if (!this.isInitialized) {
            throw new Error('Supabase non inizializzato');
        }

        try {
            console.log('💾 Salvando necrologio su Supabase...');

            // 📁 Upload foto se presente
            let photoStorageInfo = null;
            if (obituaryData.photoFile instanceof File) {
                const photoPath = `photos`;
                photoStorageInfo = await this.uploadFile(obituaryData.photoFile, photoPath);
            }

            // 📄 Upload manifesto se presente
            let manifestoStorageInfo = null;
            if (obituaryData.manifestoFile instanceof File) {
                const manifestoPath = `manifesti`;
                manifestoStorageInfo = await this.uploadFile(obituaryData.manifestoFile, manifestoPath);
            }

            // Prepara dati per database
            const dbData = {
                name: obituaryData.name,
                birth_date: obituaryData.birthDate || null,
                death_date: obituaryData.deathDate || null,
                age: parseInt(obituaryData.age) || null,
                city: obituaryData.city || null,
                description: obituaryData.description || null,
                funeral_date: obituaryData.funeralDate || null,
                funeral_location: obituaryData.funeralLocation || null,
                
                // Info foto
                photo_url: photoStorageInfo?.downloadURL || obituaryData.photo || null,
                photo_file_name: photoStorageInfo?.name || null,
                photo_file_size: photoStorageInfo?.size || null,
                photo_file_type: photoStorageInfo?.type || null,
                
                // Info manifesto
                manifesto_url: manifestoStorageInfo?.downloadURL || null,
                manifesto_file_name: manifestoStorageInfo?.name || null,
                manifesto_file_size: manifestoStorageInfo?.size || null,
                manifesto_file_type: manifestoStorageInfo?.type || null,
                
                publish_date: obituaryData.publishDate || new Date().toISOString().split('T')[0],
                status: 'active'
            };

            // Se è un aggiornamento (ha ID), usa upsert
            if (obituaryData.id) {
                dbData.id = obituaryData.id;
                dbData.updated_at = new Date().toISOString();
                
                const { data, error } = await this.supabase
                    .from(this.tableName)
                    .upsert(dbData)
                    .select()
                    .single();

                if (error) throw error;
                
                console.log('✅ Necrologio aggiornato su Supabase:', data.id);
                return { success: true, id: data.id, data };
            } else {
                // Nuovo necrologio
                const { data, error } = await this.supabase
                    .from(this.tableName)
                    .insert(dbData)
                    .select()
                    .single();

                if (error) throw error;
                
                console.log('✅ Necrologio salvato su Supabase:', data.id);
                return { success: true, id: data.id, data };
            }

        } catch (error) {
            console.error('❌ Errore salvataggio Supabase:', error);
            throw error;
        }
    }

    // 📖 Carica tutti i necrologi da Supabase
    async loadObituaries() {
        if (!this.isInitialized) {
            console.warn('⚠️ Supabase non inizializzato');
            return [];
        }

        try {
            console.log('📖 Caricando necrologi da Supabase...');

            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Errore caricamento Supabase:', error);
                return [];
            }

            console.log(`✅ Caricati ${data.length} necrologi da Supabase`);

            // Converti formato database in formato applicazione
            return data.map(row => ({
                id: row.id,
                name: row.name,
                birthDate: row.birth_date,
                deathDate: row.death_date,
                age: row.age,
                city: row.city,
                description: row.description,
                funeralDate: row.funeral_date,
                funeralLocation: row.funeral_location,
                
                // URLs diretti per le immagini
                photoURL: row.photo_url,
                photoFileName: row.photo_file_name,
                photoFileSize: row.photo_file_size,
                photoFileType: row.photo_file_type,
                
                manifestoURL: row.manifesto_url,
                manifestoFileName: row.manifesto_file_name,
                manifestoFileSize: row.manifesto_file_size,
                manifestoFileType: row.manifesto_file_type,
                
                publishDate: row.publish_date,
                status: row.status,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));

        } catch (error) {
            console.error('❌ Errore caricamento necrologi:', error);
            return [];
        }
    }

    // 🗑️ Elimina necrologio (soft delete)
    async deleteObituary(id) {
        if (!this.isInitialized) {
            throw new Error('Supabase non inizializzato');
        }

        try {
            console.log('🗑️ Eliminando necrologio da Supabase:', id);

            // Prima ottieni i dati per eliminare i file
            const { data: obituary, error: fetchError } = await this.supabase
                .from(this.tableName)
                .select('photo_url, manifesto_url')
                .eq('id', id)
                .single();

            if (fetchError) {
                console.warn('⚠️ Errore recupero dati necrologio:', fetchError.message);
            }

            // Elimina file storage se esistenti
            if (obituary?.photo_url) {
                const photoPath = this.extractPathFromUrl(obituary.photo_url);
                if (photoPath) await this.deleteFile(photoPath);
            }

            if (obituary?.manifesto_url) {
                const manifestoPath = this.extractPathFromUrl(obituary.manifesto_url);
                if (manifestoPath) await this.deleteFile(manifestoPath);
            }

            // Soft delete: marca come eliminato invece di cancellare
            const { error } = await this.supabase
                .from(this.tableName)
                .update({ 
                    status: 'deleted',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            console.log('✅ Necrologio eliminato da Supabase');
            return { success: true };

        } catch (error) {
            console.error('❌ Errore eliminazione Supabase:', error);
            throw error;
        }
    }

    // 🔗 Estrae path file da URL Supabase
    extractPathFromUrl(url) {
        try {
            if (!url || !url.includes(this.bucketName)) return null;
            
            const urlParts = url.split(`/${this.bucketName}/`);
            return urlParts[1] || null;
        } catch (error) {
            console.warn('⚠️ Errore estrazione path da URL:', error.message);
            return null;
        }
    }

    // 💌 Salva una condoglianza su Supabase
    async saveCondolence(condolenceData) {
        if (!this.isInitialized) {
            throw new Error('Supabase non inizializzato');
        }

        try {
            console.log('💌 Salvando condoglianza su Supabase...');

            // Prepara dati per database
            const dbData = {
                necrologio_id: condolenceData.necrologio_id,
                nome: condolenceData.nome,
                email: condolenceData.email || null,
                messaggio: condolenceData.messaggio,
                data_invio: condolenceData.data || new Date().toISOString(),
                status: 'active'
            };

            // Salva su database
            const { data, error } = await this.supabase
                .from('condoglianze')
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Condoglianza salvata su Supabase:', data.id);
            return { success: true, id: data.id, data };

        } catch (error) {
            console.error('❌ Errore salvataggio condoglianza:', error);
            throw error;
        }
    }

    // 📋 Carica condoglianze per un necrologio da Supabase
    async loadCondolences(obituaryId) {
        if (!this.isInitialized) {
            console.warn('⚠️ Supabase non inizializzato per caricamento condoglianze');
            return [];
        }

        try {
            console.log('📋 Caricando condoglianze da Supabase per necrologio:', obituaryId);

            // Usa l'ID esatto come salvato nel database (senza pulizia automatica)
            console.log(`🔍 Cercando condoglianze per ID esatto: "${obituaryId}"`);

            const { data, error } = await this.supabase
                .from('condoglianze')
                .select('*')
                .eq('necrologio_id', obituaryId)
                .eq('status', 'active')
                .order('data_invio', { ascending: false });

            if (error) {
                console.error('❌ Errore caricamento condoglianze Supabase:', error);
                return [];
            }

            console.log(`✅ Caricate ${data.length} condoglianze da Supabase per necrologio "${obituaryId}"`);

            // Converti formato database in formato applicazione
            return data.map(row => ({
                id: row.id,
                nome: row.nome,
                email: row.email,
                messaggio: row.messaggio,
                data: row.data_invio,
                necrologio_id: row.necrologio_id
            }));

        } catch (error) {
            console.error('❌ Errore caricamento condoglianze:', error);
            return [];
        }
    }

    // 🗑️ Elimina condoglianza (soft delete)
    async deleteCondolence(id) {
        if (!this.isInitialized) {
            throw new Error('Supabase non inizializzato');
        }

        try {
            console.log('🗑️ Eliminando condoglianza da Supabase:', id);

            // Soft delete: marca come eliminata invece di cancellare
            const { error } = await this.supabase
                .from('condoglianze')
                .update({ 
                    status: 'deleted',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            console.log('✅ Condoglianza eliminata da Supabase');
            return { success: true };

        } catch (error) {
            console.error('❌ Errore eliminazione condoglianza:', error);
            throw error;
        }
    }

    // 📊 Ottieni statistiche necrologi
    async getStatistics() {
        if (!this.isInitialized) {
            return { total: 0, thisMonth: 0, thisYear: 0 };
        }

        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('created_at, status');

            if (error) throw error;

            const now = new Date();
            const thisMonth = data.filter(item => {
                const createdDate = new Date(item.created_at);
                return createdDate.getMonth() === now.getMonth() && 
                       createdDate.getFullYear() === now.getFullYear() &&
                       item.status === 'active';
            }).length;

            const thisYear = data.filter(item => {
                const createdDate = new Date(item.created_at);
                return createdDate.getFullYear() === now.getFullYear() &&
                       item.status === 'active';
            }).length;

            return {
                total: data.filter(item => item.status === 'active').length,
                thisMonth,
                thisYear
            };

        } catch (error) {
            console.error('❌ Errore statistiche:', error);
            return { total: 0, thisMonth: 0, thisYear: 0 };
        }
    }
}

// 🌐 Inizializzazione globale
let supabaseManager = null;

// Auto-inizializzazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inizializzando Supabase Manager...');
    
    supabaseManager = new SupabaseManager();
    const initialized = await supabaseManager.init();
    
    if (initialized) {
        console.log('✅ Supabase Manager pronto');
        // Rende disponibile globalmente per compatibilità
        window.supabaseManager = supabaseManager;
    } else {
        console.warn('⚠️ Supabase Manager non inizializzato - modalità fallback');
    }
});

// Export per moduli ES6 (se supportati)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupabaseManager, supabaseConfig };
}
