// Firebase Configuration e Setup
// ==============================

// 🔥 CONFIGURAZIONE FIREBASE
const firebaseConfig = {
    // ⚠️ SOSTITUISCI CON LA TUA CONFIGURAZIONE FIREBASE
    apiKey: "AIzaSyCP62VX5B1-3x9x1jSBlIvCc4OHMRSWd4U",
    authDomain: "sito-funebre-santaniello.firebaseapp.com",
    projectId: "sito-funebre-santaniello",
    storageBucket: "sito-funebre-santaniello.firebasestorage.app",
    messagingSenderId: "114116539074",
    appId: "1:114116539074:web:2984e1e213a8d0e59d415b"
};

// 🏗️ INIZIALIZZAZIONE FIREBASE
class FirebaseManager {
    constructor() {
        this.app = null;
        this.db = null;
        this.storage = null;
        this.isInitialized = false;
        this.isOnline = navigator.onLine;
        
        // Monitora connessione
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🟢 Connessione Firebase ripristinata');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('🔴 Connessione Firebase persa - modalità offline');
        });
    }

    // 🚀 Inizializza Firebase
    async init() {
        try {
            // Controlla se Firebase SDK è caricato
            if (typeof firebase === 'undefined') {
                console.warn('⚠️ Firebase SDK non caricato - modalità fallback');
                return false;
            }

            // Inizializza Firebase App
            this.app = firebase.initializeApp(firebaseConfig);
            this.db = firebase.firestore();
            this.storage = firebase.storage();
            
            // Configura persistenza offline
            await this.db.enablePersistence({ synchronizeTabs: true });
            
            this.isInitialized = true;
            console.log('✅ Firebase inizializzato con successo');
            
            return true;
        } catch (error) {
            console.error('❌ Errore inizializzazione Firebase:', error);
            
            // Se persistenza già abilitata, continua comunque
            if (error.code === 'failed-precondition') {
                this.isInitialized = true;
                console.log('✅ Firebase inizializzato (persistenza già attiva)');
                return true;
            }
            
            return false;
        }
    }

    // 📁 Upload file su Firebase Storage
    async uploadFile(file, path) {
        if (!this.isInitialized || !this.storage) {
            throw new Error('Firebase Storage non inizializzato');
        }

        try {
            const storageRef = this.storage.ref();
            const fileRef = storageRef.child(path);
            
            console.log(`📁 Caricando file su Storage: ${path}`);
            
            // Upload del file
            const snapshot = await fileRef.put(file);
            
            // Ottieni URL di download
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            console.log(`✅ File caricato su Storage: ${downloadURL}`);
            
            return {
                downloadURL,
                fullPath: snapshot.ref.fullPath,
                name: file.name,
                size: file.size,
                type: file.type
            };
        } catch (error) {
            console.error('❌ Errore upload Storage:', error);
            throw error;
        }
    }

    // 🗑️ Elimina file da Firebase Storage
    async deleteFile(filePath) {
        if (!this.isInitialized || !this.storage) {
            throw new Error('Firebase Storage non inizializzato');
        }

        try {
            const storageRef = this.storage.ref();
            const fileRef = storageRef.child(filePath);
            
            await fileRef.delete();
            console.log(`✅ File eliminato da Storage: ${filePath}`);
        } catch (error) {
            // Se il file non esiste, non è un errore critico
            if (error.code !== 'storage/object-not-found') {
                console.error('❌ Errore eliminazione Storage:', error);
                throw error;
            }
        }
    }

    // 💾 Salva necrologio su Firestore (con Storage URLs)
    async saveObituary(obituaryData) {
        if (!this.isInitialized) {
            throw new Error('Firebase non inizializzato');
        }

        try {
            let photoStorageInfo = null;
            let manifestoStorageInfo = null;

            // Upload foto se presente
            if (obituaryData.photoFile && obituaryData.photoFile instanceof File) {
                const photoPath = `necrologi/photos/${Date.now()}_${obituaryData.photoFile.name}`;
                photoStorageInfo = await this.uploadFile(obituaryData.photoFile, photoPath);
            }

            // Upload manifesto se presente
            if (obituaryData.manifestoFile && obituaryData.manifestoFile instanceof File) {
                const manifestoPath = `necrologi/manifesti/${Date.now()}_${obituaryData.manifestoFile.name}`;
                manifestoStorageInfo = await this.uploadFile(obituaryData.manifestoFile, manifestoPath);
            }

            // Prepara dati per Firestore (solo URLs, non file binari)
            const firestoreData = {
                ...obituaryData,
                // Salva solo gli URL delle immagini, non i dati binari
                photoURL: photoStorageInfo?.downloadURL || null,
                photoStoragePath: photoStorageInfo?.fullPath || null,
                photoFileName: photoStorageInfo?.name || null,
                photoFileSize: photoStorageInfo?.size || null,
                photoFileType: photoStorageInfo?.type || null,
                
                manifestoURL: manifestoStorageInfo?.downloadURL || null,
                manifestoStoragePath: manifestoStorageInfo?.fullPath || null,
                manifestoFileName: manifestoStorageInfo?.name || null,
                manifestoFileSize: manifestoStorageInfo?.size || null,
                manifestoFileType: manifestoStorageInfo?.type || null,
                
                // Rimuovi gli oggetti file originali
                photoFile: null,
                manifestoFile: null,
                
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                publishDate: obituaryData.publishDate || new Date().toISOString().split('T')[0],
                status: 'active' // active, hidden, archived
            };

            // Salva con ID auto-generato
            const docRef = await this.db.collection('necrologi').add(firestoreData);
            
            console.log('✅ Necrologio salvato su Firebase:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('❌ Errore salvataggio Firebase:', error);
            throw error;
        }
    }

    // 📖 Carica tutti i necrologi da Firestore
    async loadObituaries() {
        if (!this.isInitialized) {
            console.warn('⚠️ Firebase non disponibile - usando fallback');
            return [];
        }

        try {
            const snapshot = await this.db.collection('necrologi')
                .where('status', '==', 'active')
                .orderBy('createdAt', 'desc')
                .get();

            const obituaries = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                
                obituaries.push({
                    id: doc.id,
                    ...data,
                    // Mantieni compatibilità con il vecchio formato
                    photoFile: data.photoURL ? {
                        data: data.photoURL, // Ora è un URL invece di Base64
                        name: data.photoFileName,
                        type: data.photoFileType,
                        size: data.photoFileSize
                    } : null,
                    
                    manifestoFile: data.manifestoURL ? {
                        data: data.manifestoURL, // Ora è un URL invece di Base64
                        name: data.manifestoFileName,
                        type: data.manifestoFileType,
                        size: data.manifestoFileSize
                    } : null,
                    
                    // Converti timestamp Firestore a date string
                    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
                    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null
                });
            });

            console.log(`✅ Caricati ${obituaries.length} necrologi da Firebase`);
            return obituaries;
        } catch (error) {
            console.error('❌ Errore caricamento Firebase:', error);
            return [];
        }
    }

    // 🗑️ Elimina necrologio (soft delete + pulizia Storage)
    async deleteObituary(obituaryId) {
        if (!this.isInitialized) {
            throw new Error('Firebase non inizializzato');
        }

        try {
            // Prima recupera i dati per eliminare i file da Storage
            const doc = await this.db.collection('necrologi').doc(obituaryId).get();
            if (doc.exists) {
                const data = doc.data();
                
                // Elimina i file da Storage se presenti
                if (data.photoStoragePath) {
                    await this.deleteFile(data.photoStoragePath);
                }
                if (data.manifestoStoragePath) {
                    await this.deleteFile(data.manifestoStoragePath);
                }
            }
            
            // Soft delete del documento
            await this.db.collection('necrologi').doc(obituaryId).update({
                status: 'archived',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Necrologio archiviato:', obituaryId);
            return { success: true };
        } catch (error) {
            console.error('❌ Errore eliminazione Firebase:', error);
            throw error;
        }
    }

    // 📝 Aggiorna necrologio (con gestione Storage)
    async updateObituary(obituaryId, updateData) {
        if (!this.isInitialized) {
            throw new Error('Firebase non inizializzato');
        }

        try {
            let photoStorageInfo = null;
            let manifestoStorageInfo = null;

            // Recupera i dati esistenti per gestire i file vecchi
            const existingDoc = await this.db.collection('necrologi').doc(obituaryId).get();
            const existingData = existingDoc.data();

            // Upload nuova foto se presente
            if (updateData.photoFile && updateData.photoFile instanceof File) {
                // Elimina la vecchia foto se presente
                if (existingData?.photoStoragePath) {
                    await this.deleteFile(existingData.photoStoragePath);
                }
                
                const photoPath = `necrologi/photos/${Date.now()}_${updateData.photoFile.name}`;
                photoStorageInfo = await this.uploadFile(updateData.photoFile, photoPath);
            }

            // Upload nuovo manifesto se presente
            if (updateData.manifestoFile && updateData.manifestoFile instanceof File) {
                // Elimina il vecchio manifesto se presente
                if (existingData?.manifestoStoragePath) {
                    await this.deleteFile(existingData.manifestoStoragePath);
                }
                
                const manifestoPath = `necrologi/manifesti/${Date.now()}_${updateData.manifestoFile.name}`;
                manifestoStorageInfo = await this.uploadFile(updateData.manifestoFile, manifestoPath);
            }

            // Prepara dati per l'aggiornamento
            const updatePayload = {
                ...updateData,
                // Aggiorna info foto se caricata
                ...(photoStorageInfo && {
                    photoURL: photoStorageInfo.downloadURL,
                    photoStoragePath: photoStorageInfo.fullPath,
                    photoFileName: photoStorageInfo.name,
                    photoFileSize: photoStorageInfo.size,
                    photoFileType: photoStorageInfo.type
                }),
                // Aggiorna info manifesto se caricato
                ...(manifestoStorageInfo && {
                    manifestoURL: manifestoStorageInfo.downloadURL,
                    manifestoStoragePath: manifestoStorageInfo.fullPath,
                    manifestoFileName: manifestoStorageInfo.name,
                    manifestoFileSize: manifestoStorageInfo.size,
                    manifestoFileType: manifestoStorageInfo.type
                }),
                // Rimuovi gli oggetti file
                photoFile: null,
                manifestoFile: null,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await this.db.collection('necrologi').doc(obituaryId).update(updatePayload);
            
            console.log('✅ Necrologio aggiornato:', obituaryId);
            return { success: true };
        } catch (error) {
            console.error('❌ Errore aggiornamento Firebase:', error);
            throw error;
        }
    }

    // 🔄 Listener in tempo reale per necrologi
    setupRealtimeListener(callback) {
        if (!this.isInitialized) {
            console.warn('⚠️ Listener Firebase non disponibile');
            return null;
        }

        return this.db.collection('necrologi')
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const obituaries = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    
                    obituaries.push({
                        id: doc.id,
                        ...data,
                        // Mantieni compatibilità con il vecchio formato
                        photoFile: data.photoURL ? {
                            data: data.photoURL, // URL invece di Base64
                            name: data.photoFileName,
                            type: data.photoFileType,
                            size: data.photoFileSize
                        } : null,
                        
                        manifestoFile: data.manifestoURL ? {
                            data: data.manifestoURL, // URL invece di Base64
                            name: data.manifestoFileName,
                            type: data.manifestoFileType,
                            size: data.manifestoFileSize
                        } : null,
                        
                        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
                        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null
                    });
                });

                console.log(`🔄 Aggiornamento realtime: ${obituaries.length} necrologi`);
                callback(obituaries);
            }, error => {
                console.error('❌ Errore listener Firebase:', error);
            });
    }

    // 📊 Statistiche
    async getStats() {
        if (!this.isInitialized) {
            return { total: 0, active: 0, archived: 0 };
        }

        try {
            const [activeSnapshot, archivedSnapshot] = await Promise.all([
                this.db.collection('necrologi').where('status', '==', 'active').get(),
                this.db.collection('necrologi').where('status', '==', 'archived').get()
            ]);

            return {
                total: activeSnapshot.size + archivedSnapshot.size,
                active: activeSnapshot.size,
                archived: archivedSnapshot.size
            };
        } catch (error) {
            console.error('❌ Errore statistiche Firebase:', error);
            return { total: 0, active: 0, archived: 0 };
        }
    }
}

// 🌍 Istanza globale Firebase Manager
window.firebaseManager = new FirebaseManager();

// 🚀 Auto-inizializzazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', async () => {
    await window.firebaseManager.init();
});