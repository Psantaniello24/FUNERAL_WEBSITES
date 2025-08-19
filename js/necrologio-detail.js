// JavaScript for individual obituary detail page

class ObituaryDetailPage {
    constructor() {
        // Usa l'istanza globale se disponibile, altrimenti creane una nuova
        this.obituariesManager = window.globalObituariesManager || new ObituariesManager();
        if (!window.globalObituariesManager) {
            window.globalObituariesManager = this.obituariesManager;
        }
        this.obituaryId = this.getObituaryIdFromUrl();
        this.obituary = null;
        this.init();
    }

    getObituaryIdFromUrl() {
        // Check if this is the generic detail page with URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const idParam = urlParams.get('id');
        
        console.log('🔍 Estrazione ID da URL:', {
            search: window.location.search,
            pathname: window.location.pathname,
            idParam: idParam
        });
        
        if (idParam) {
            console.log('✅ ID trovato da parametro URL:', idParam);
            // From URL parameter (e.g., necrologio-detail.html?id=firebase_abc123)
            return idParam;
        }
        
        // Extract ID from URL like "necrologio-1.html" (legacy static pages)
        const pathname = window.location.pathname;
        const match = pathname.match(/necrologio-(\d+)\.html/);
        const legacyId = match ? parseInt(match[1]) : null;
        
        console.log('🔍 ID estratto da pathname:', legacyId);
        return legacyId;
    }

    async init() {
        console.log('🔄 Inizializzando pagina dettaglio necrologio...');
        
        // Aspetta che Supabase sia inizializzato se disponibile
        if (window.supabaseManager && !window.supabaseManager.isInitialized) {
            console.log('⏳ Aspettando inizializzazione Supabase per pagina dettaglio...');
            let attempts = 0;
            const maxAttempts = 20;
            
            while (!window.supabaseManager.isInitialized && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 300));
                attempts++;
                if (attempts % 5 === 0) {
                    console.log(`⏳ Aspettando Supabase... tentativo ${attempts}/${maxAttempts}`);
                }
            }
            
            if (window.supabaseManager.isInitialized) {
                console.log('✅ Supabase inizializzato per pagina dettaglio');
            } else {
                console.warn('⚠️ Timeout Supabase per pagina dettaglio');
            }
        }
        
        // Wait for obituaries to be loaded
        await this.waitForObituaries();
        this.loadObituary();
        await this.loadCondolences();

    }

    async waitForObituaries() {
        console.log('⏳ Aspettando caricamento necrologi...');
        
        // Carica esplicitamente i dati se non sono già caricati
        if (!this.obituariesManager.obituaries || this.obituariesManager.obituaries.length === 0) {
            console.log('🔄 Necrologi non ancora caricati, avvio caricamento...');
            await this.obituariesManager.loadObituaries();
        }
        
        // Wait until obituaries are loaded
        const maxWait = 15000; // 15 seconds maximum
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            if (this.obituariesManager.obituaries && this.obituariesManager.obituaries.length > 0) {
                console.log(`📋 Caricati ${this.obituariesManager.obituaries.length} necrologi per pagina dettaglio`);
                return;
            }
            // Wait 200ms before checking again
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        console.warn('⚠️ Timeout aspettando caricamento necrologi');
    }

    loadObituary() {
        console.log('🔍 Caricando obituary con ID:', this.obituaryId);
        console.log('📊 Necrologi disponibili:', this.obituariesManager.obituaries.length);
        
        // Debug: mostra tutti gli ID disponibili
        console.log('📋 IDs disponibili:', this.obituariesManager.obituaries.map(o => ({
            id: o.id,
            nome: o.nome,
            tipo: typeof o.id,
            source: o.source,
            hasManifesto: !!o.manifestoFile
        })));
        
        // Debug specifico per manifesti
        const obituariesWithManifesto = this.obituariesManager.obituaries.filter(o => o.manifestoFile);
        console.log(`📄 Necrologi con manifesto (${obituariesWithManifesto.length}):`, 
            obituariesWithManifesto.map(o => ({
                id: o.id,
                nome: o.nome,
                source: o.source,
                manifestoName: o.manifestoFile.name,
                manifestoType: o.manifestoFile.type
            }))
        );
        
        this.obituary = this.obituariesManager.getById(this.obituaryId);
        
        if (!this.obituary) {
            console.error(`❌ Obituary con ID "${this.obituaryId}" (tipo: ${typeof this.obituaryId}) non trovato`);
            
            // Test di ricerca con diversi formati ID
            console.log('🔍 Test ricerca ID:');
            const testIds = [
                this.obituaryId,
                String(this.obituaryId),
                parseInt(this.obituaryId),
                `json_${this.obituaryId}`,
                `admin_${this.obituaryId}`,
                `supabase_${this.obituaryId}`
            ];
            
            testIds.forEach(testId => {
                const result = this.obituariesManager.getById(testId);
                console.log(`  - "${testId}": ${result ? `✅ ${result.nome}` : '❌ Non trovato'}`);
            });
            
            // Show error message instead of redirecting immediately
            this.showNotFoundMessage();
            return;
        }
        
        console.log('✅ Obituary caricato:', this.obituary.nome);
        
        // Hide loading screen if it exists
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }

        // Update page title and meta
        document.title = `${this.obituary.nome} - Necrologio | Agenzia Funebre Santaniello`;
        
        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = `Necrologio di ${this.obituary.nome} (${new Date(this.obituary.dataNascita).getFullYear()}-${new Date(this.obituary.dataMorte).getFullYear()}). Invia le tue condoglianze alla famiglia. Agenzia Funebre Santaniello.`;
        }
        
        // Update the page content with obituary data FIRST
        this.updatePageContent();
        
        // Update Open Graph meta tags for social sharing AFTER content is loaded
        this.updateOpenGraphTags();
        
        // Force immediate meta tag refresh for crawlers
        this.forceMetaTagRefresh();
    }

    // Aggiorna i meta tag Open Graph per la condivisione social
    // Questo metodo popola dinamicamente i meta tag quando i dati del necrologio vengono caricati
    updateOpenGraphTags() {
        if (!this.obituary) {
            console.warn('⚠️ Impossibile aggiornare Open Graph: obituary non caricato');
            return;
        }

        // Costruisci il titolo: "In memoria di [nome_defunto]"
        const ogTitle = `In memoria di ${this.obituary.nome}`;
        
        // Costruisci la descrizione con i dati del funerale
        const dataFunerale = Utils.formatDate(this.obituary.dataEsequie);
        const luogoFunerale = this.obituary.luogoEsequie || 'Chiesa da definire';
        const ogDescription = `Ci ha lasciato ${this.obituary.nome}, i funerali si terranno il ${dataFunerale} presso ${luogoFunerale}.`;
        
        // Ottieni l'URL dell'immagine del defunto
        const ogImage = this.getObituaryImageUrl();
        
        // URL canonico della pagina
        const ogUrl = window.location.href;
        
        // Pre-carica e verifica l'immagine prima di impostarla
        this.preloadAndSetImage(ogImage, () => {
            // Aggiorna i meta tag Open Graph SOLO dopo aver verificato l'immagine
            this.updateMetaTag('property', 'og:title', ogTitle);
            this.updateMetaTag('property', 'og:description', ogDescription);
            this.updateMetaTag('property', 'og:image', ogImage);
            this.updateMetaTag('property', 'og:url', ogUrl);
            
            // Aggiungi meta tag critici per Facebook
            this.updateMetaTag('property', 'og:image:secure_url', ogImage); // URL HTTPS per Facebook
            this.updateMetaTag('property', 'og:image:type', this.getImageMimeType(ogImage));
            this.updateMetaTag('property', 'og:image:width', '1200');
            this.updateMetaTag('property', 'og:image:height', '630');
            this.updateMetaTag('property', 'og:image:alt', `Foto di ${this.obituary.nome}`);
            
            // Meta tag aggiuntivi per forzare il refresh di Facebook
            this.updateMetaTag('property', 'og:updated_time', new Date().toISOString());
            this.updateMetaTag('name', 'robots', 'index,follow');
            
            // Aggiorna anche i meta tag Twitter
            this.updateMetaTag('name', 'twitter:image', ogImage);
            this.updateMetaTag('name', 'twitter:title', ogTitle);
            this.updateMetaTag('name', 'twitter:description', ogDescription);
            
            console.log('✅ Meta tag Open Graph aggiornati con immagine verificata:', {
                title: ogTitle,
                description: ogDescription,
                image: ogImage,
                url: ogUrl,
                imageAccessible: true,
                isSupabaseUrl: ogImage.includes('supabase.co/storage/v1/object/public/')
            });
        });
        
        // Aggiorna anche title e meta description per coerenza
        document.title = ogTitle + ' - Onoranze Funebri Santaniello';
        this.updateMetaTag('name', 'description', ogDescription);
        
        // Verifica aggiuntiva per Facebook Debugger
        if (ogImage.includes('supabase.co/storage/v1/object/public/')) {
            console.log('🎯 URL perfetto per Facebook Debugger! Tipo:', ogImage.includes('necrologi-files') ? 'Supabase Storage' : 'Altro');
        } else {
            console.log('⚠️ URL potrebbe non essere ottimale per Facebook. Verificare che sia pubblicamente accessibile.');
        }
    }

    // Metodo helper per aggiornare un meta tag
    updateMetaTag(attribute, value, content) {
        // Rimuovi tag esistente se presente
        const existingTag = document.querySelector(`meta[${attribute}="${value}"]`);
        if (existingTag) {
            existingTag.remove();
        }
        
        // Crea nuovo meta tag
        const metaTag = document.createElement('meta');
        metaTag.setAttribute(attribute, value);
        metaTag.setAttribute('content', content);
        
        // Inserisci nel head, preferibilmente dopo il title
        const titleTag = document.querySelector('title');
        if (titleTag && titleTag.nextSibling) {
            document.head.insertBefore(metaTag, titleTag.nextSibling);
        } else {
            document.head.appendChild(metaTag);
        }
        
        console.log(`📝 Meta tag aggiornato: ${attribute}="${value}" content="${content.substring(0, 50)}..."`);
    }

    // Ottieni l'URL pubblico dell'immagine del defunto per Open Graph
    getObituaryImageUrl() {
        let imageUrl = '';
        
        console.log('🔍 DEBUG COMPLETO IMMAGINE NECROLOGIO:');
        console.log('=====================================');
        console.log('Nome:', this.obituary.nome);
        console.log('ID:', this.obituary.id);
        console.log('Source:', this.obituary.source);
        console.log('');
        console.log('DATI IMMAGINE DISPONIBILI:');
        console.log('- foto:', this.obituary.foto);
        console.log('- photo:', this.obituary.photo);
        console.log('- photoFile:', this.obituary.photoFile);
        
        if (this.obituary.photoFile) {
            console.log('  - photoFile.data:', this.obituary.photoFile.data?.substring(0, 150) + '...');
            console.log('  - photoFile.name:', this.obituary.photoFile.name);
            console.log('  - photoFile.type:', this.obituary.photoFile.type);
            console.log('  - photoFile.size:', this.obituary.photoFile.size);
        }
        
        // DATI AGGIUNTIVI DA SUPABASE
        console.log('');
        console.log('DATI SUPABASE AGGIUNTIVI:');
        console.log('- photoURL:', this.obituary.photoURL);
        console.log('- photoFileName:', this.obituary.photoFileName);
        console.log('- photoFileType:', this.obituary.photoFileType);
        console.log('=====================================');
        
        // PRIORITÀ PER OPEN GRAPH: Solo URL pubblici accessibili da Facebook
        
        // 1. PRIORITÀ MASSIMA: photoURL diretto da Supabase (campo originale)
        if (this.obituary.photoURL && this.obituary.photoURL.startsWith('https://')) {
            imageUrl = this.obituary.photoURL;
            console.log('✅ [PRIORITÀ 1] Usando photoURL diretto da Supabase:', imageUrl);
        }
        // 2. URL da Supabase Storage mappato in 'foto' (pubblico)
        else if (this.obituary.foto && this.obituary.foto.startsWith('https://') && 
                 !this.obituary.foto.includes('placeholder')) {
            imageUrl = this.obituary.foto;
            console.log('✅ [PRIORITÀ 2] Usando URL Supabase (foto) per Open Graph:', imageUrl);
        }
        // 3. photoFile.data se è un URL pubblico di Supabase (non base64)
        else if (this.obituary.photoFile && this.obituary.photoFile.data && 
                 this.obituary.photoFile.data.startsWith('https://') &&
                 this.obituary.photoFile.data.includes('supabase.co')) {
            imageUrl = this.obituary.photoFile.data;
            console.log('✅ [PRIORITÀ 3] Usando photoFile.data URL Supabase per Open Graph:', imageUrl);
        }
        // 4. Tenta di generare URL pubblico usando photoFileName
        else if (this.obituary.photoFileName && window.supabaseManager) {
            console.log('🔄 [PRIORITÀ 4] Tentando di generare URL da photoFileName:', this.obituary.photoFileName);
            imageUrl = this.tryGenerateSupabaseUrl();
        }
        // 5. URL photo alternativo (se pubblico)
        else if (this.obituary.photo && this.obituary.photo.startsWith('https://')) {
            imageUrl = this.obituary.photo;
            console.log('✅ [PRIORITÀ 5] Usando URL photo per Open Graph:', imageUrl);
        }
        // 6. URL relativi convertiti in assoluti (solo se non sono base64 o placeholder)
        else if ((this.obituary.foto || this.obituary.photo) && 
                 !(this.obituary.foto?.startsWith('data:') || this.obituary.photo?.startsWith('data:')) &&
                 !(this.obituary.foto?.includes('placeholder') || this.obituary.photo?.includes('placeholder'))) {
            const relativeUrl = this.obituary.foto || this.obituary.photo;
            imageUrl = new URL(relativeUrl, window.location.origin).href;
            console.log('✅ [PRIORITÀ 6] Convertito URL relativo per Open Graph:', imageUrl);
        }
        // 7. Immagine di default del sito come fallback per Open Graph
        else {
            console.log('⚠️ [FALLBACK] Nessuna immagine valida trovata, usando fallback');
            imageUrl = this.generateFallbackImage();
        }
        
        // Verifica finale che l'URL sia di Supabase Storage
        if (imageUrl.includes('supabase.co/storage/v1/object/public/')) {
            console.log('✅ Confermato: URL Supabase Storage valido per Facebook');
        } else {
            console.warn('⚠️ URL non è da Supabase Storage:', imageUrl);
        }
        
        console.log('🎯 URL finale per Open Graph:', imageUrl);
        return imageUrl;
    }

    // Tenta di generare URL pubblico Supabase se possibile
    tryGenerateSupabaseUrl() {
        try {
            // Se abbiamo informazioni sul file foto, tentiamo di generare l'URL pubblico
            if (this.obituary.photoFileName && window.supabaseManager && window.supabaseManager.supabase) {
                // Costruisci il path del file basato sul nome del file
                const filePath = `photos/${this.obituary.photoFileName}`;
                
                // Genera URL pubblico usando Supabase
                const { data } = window.supabaseManager.supabase.storage
                    .from('necrologi-files')
                    .getPublicUrl(filePath);
                
                if (data && data.publicUrl) {
                    console.log('✅ Generato URL pubblico Supabase:', data.publicUrl);
                    return data.publicUrl;
                }
            }
        } catch (error) {
            console.warn('⚠️ Errore generazione URL Supabase:', error);
        }
        
        // Fallback se non riusciamo a generare l'URL
        return this.generateFallbackImage();
    }

    // Genera immagine di fallback per Open Graph
    generateFallbackImage() {
        const fallbackUrl = new URL('images/old_photos/FINALE_1.png', window.location.origin).href;
        console.log('⚠️ Usando immagine default del sito per Open Graph:', fallbackUrl);
        return fallbackUrl;
    }

    // Determina il tipo MIME dell'immagine dall'URL
    getImageMimeType(imageUrl) {
        const extension = imageUrl.split('.').pop()?.toLowerCase();
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml'
        };
        return mimeTypes[extension] || 'image/jpeg'; // Default a JPEG
    }

    // Pre-carica l'immagine e verifica che sia accessibile prima di impostarla nei meta tag
    preloadAndSetImage(imageUrl, callback) {
        console.log('🔄 Pre-caricamento immagine per Open Graph:', imageUrl);
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        // Timeout per evitare attese infinite
        const timeout = setTimeout(() => {
            console.warn('⚠️ Timeout pre-caricamento immagine, procedo comunque');
            callback();
        }, 5000); // 5 secondi timeout
        
        img.onload = () => {
            clearTimeout(timeout);
            console.log('✅ Immagine pre-caricata con successo:', `${img.naturalWidth}x${img.naturalHeight}`);
            
            // Verifica dimensioni minime per Facebook
            if (img.naturalWidth >= 200 && img.naturalHeight >= 200) {
                console.log('✅ Dimensioni immagine OK per Facebook');
                callback();
            } else {
                console.warn('⚠️ Immagine troppo piccola per Facebook, ma procedo comunque');
                callback();
            }
        };
        
        img.onerror = (error) => {
            clearTimeout(timeout);
            console.error('❌ Errore pre-caricamento immagine:', error);
            console.log('🔄 Procedo comunque con i meta tag');
            callback();
        };
        
        // Avvia il caricamento
        img.src = imageUrl;
    }

    // Metodo di test per verificare i meta tag Open Graph (utilizzabile dalla console)
    testOpenGraphTags() {
        console.log('🧪 Test completo meta tag Open Graph:');
        
        const ogTags = {
            'og:title': document.querySelector('meta[property="og:title"]')?.content,
            'og:description': document.querySelector('meta[property="og:description"]')?.content,
            'og:image': document.querySelector('meta[property="og:image"]')?.content,
            'og:image:secure_url': document.querySelector('meta[property="og:image:secure_url"]')?.content,
            'og:image:type': document.querySelector('meta[property="og:image:type"]')?.content,
            'og:image:width': document.querySelector('meta[property="og:image:width"]')?.content,
            'og:image:height': document.querySelector('meta[property="og:image:height"]')?.content,
            'og:url': document.querySelector('meta[property="og:url"]')?.content,
            'og:type': document.querySelector('meta[property="og:type"]')?.content,
            'og:updated_time': document.querySelector('meta[property="og:updated_time"]')?.content
        };
        
        console.table(ogTags);
        
        // Test specifico per l'immagine
        const imageUrl = ogTags['og:image'];
        if (imageUrl) {
            console.log('🔍 Analisi dettagliata immagine Open Graph:');
            console.log('URL:', imageUrl);
            console.log('È HTTPS:', imageUrl.startsWith('https://'));
            console.log('È Supabase:', imageUrl.includes('supabase.co'));
            console.log('È pubblico:', imageUrl.includes('/storage/v1/object/public/'));
            console.log('Tipo MIME:', ogTags['og:image:type']);
            console.log('Dimensioni:', `${ogTags['og:image:width']}x${ogTags['og:image:height']}`);
            
            // Test di accessibilità dell'immagine
            this.testImageAccessibility(imageUrl);
            
            // Link utili per debug
            console.log('🔗 Facebook Debugger:', `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(window.location.href)}`);
            console.log('🔗 Facebook Batch Invalidator:', `https://developers.facebook.com/tools/debug/og/batch/`);
        }
        
        return ogTags;
    }

    // Testa l'accessibilità dell'immagine
    testImageAccessibility(imageUrl) {
        console.log('🌐 Test accessibilità immagine...');
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            console.log('✅ Immagine accessibile! Dimensioni reali:', `${img.naturalWidth}x${img.naturalHeight}`);
            if (img.naturalWidth < 200 || img.naturalHeight < 200) {
                console.warn('⚠️ Immagine troppo piccola per Facebook (minimo raccomandato: 200x200)');
            }
            if (img.naturalWidth < 600 || img.naturalHeight < 315) {
                console.warn('⚠️ Immagine non ottimale per Facebook (raccomandato: 1200x630)');
            }
        };
        
        img.onerror = (error) => {
            console.error('❌ Immagine NON accessibile! Errore:', error);
            console.log('🔍 Possibili cause:');
            console.log('- URL non pubblico');
            console.log('- CORS non configurato correttamente');
            console.log('- File non esistente');
            console.log('- Permessi Supabase Storage non corretti');
        };
        
        img.src = imageUrl;
    }

    // Forza Facebook a ricaricare i meta tag
    refreshFacebookCache() {
        const currentUrl = window.location.href;
        
        console.log('🔄 Forzando Facebook a ricaricare i meta tag...');
        
        // Aggiorna il timestamp per forzare il refresh
        this.updateMetaTag('property', 'og:updated_time', new Date().toISOString());
        
        // Apri Facebook Debugger in una nuova finestra
        const debugUrl = `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(currentUrl)}`;
        window.open(debugUrl, '_blank');
        
        console.log('✅ Facebook Debugger aperto. Clicca "Scrape Again" per forzare il refresh.');
        console.log('🔗 URL Debug:', debugUrl);
        
        // Istruzioni per l'utente
        console.log('📋 Istruzioni:');
        console.log('1. Nella finestra del Facebook Debugger, clicca "Scrape Again"');
        console.log('2. Verifica che l\'immagine sia ora visibile');
        console.log('3. Se necessario, usa "Batch Invalidator" per URLs multiple');
        
        return debugUrl;
    }

    // Forza Facebook a fare un nuovo scraping della pagina
    forceFacebookRescrape() {
        console.log('🔄 Forzando Facebook a fare un nuovo scraping...');
        
        // Aggiorna tutti i meta tag con timestamp corrente
        const timestamp = new Date().toISOString();
        this.updateMetaTag('property', 'og:updated_time', timestamp);
        
        // Forza un refresh completo dei meta tag
        this.updateOpenGraphTags();
        
        // Apri Facebook Debugger
        const currentUrl = window.location.href;
        const debugUrl = `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(currentUrl)}`;
        
        // Apri in nuova finestra
        const debugWindow = window.open(debugUrl, '_blank');
        
        console.log('✅ Facebook Debugger aperto. Segui questi passi:');
        console.log('1. Clicca "Scrape Again" nel Facebook Debugger');
        console.log('2. Verifica che l\'immagine Supabase sia ora visibile');
        console.log('3. Se l\'immagine non appare, controlla i permessi Supabase Storage');
        
        // Mostra informazioni sulla pagina corrente
        const ogImage = document.querySelector('meta[property="og:image"]')?.content;
        console.log('🔍 Immagine attuale nei meta tag:', ogImage);
        
        if (ogImage && ogImage.includes('supabase.co')) {
            console.log('✅ L\'immagine è da Supabase Storage - dovrebbe funzionare');
        } else {
            console.warn('⚠️ L\'immagine non è da Supabase Storage - potrebbe essere il problema');
        }
        
        return {
            debugUrl,
            currentImage: ogImage,
            timestamp
        };
    }

    // Forza il refresh immediato dei meta tag per i crawler
    forceMetaTagRefresh() {
        // Aggiunge un timestamp unico per forzare i crawler a ricaricare
        const timestamp = Date.now();
        
        // Aggiorna URL canonico con timestamp per forzare refresh
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('_og_refresh', timestamp);
        
        // Aggiorna meta tag con timestamp
        this.updateMetaTag('property', 'og:updated_time', new Date().toISOString());
        
        // Forza un refresh della pagina per i crawler che potrebbero averla già visitata
        if (document.readyState === 'complete') {
            // Aggiunge un elemento nascosto che i crawler possono rilevare
            const refreshIndicator = document.createElement('meta');
            refreshIndicator.setAttribute('name', 'og-refresh-timestamp');
            refreshIndicator.setAttribute('content', timestamp.toString());
            document.head.appendChild(refreshIndicator);
        }
        
        console.log('🔄 Meta tag refresh forzato con timestamp:', timestamp);
    }

    // Diagnosi completa dei problemi Open Graph
    diagnoseOpenGraphIssues() {
        console.log('🔍 DIAGNOSI COMPLETA OPEN GRAPH');
        console.log('================================');
        
        // 1. Verifica presenza obituary
        if (!this.obituary) {
            console.error('❌ PROBLEMA: Nessun obituary caricato');
            return;
        }
        
        console.log('✅ Obituary caricato:', this.obituary.nome);
        
        // 2. Analizza dati immagine disponibili
        console.log('\n📊 DATI IMMAGINE DISPONIBILI:');
        console.log('- foto:', this.obituary.foto);
        console.log('- photo:', this.obituary.photo);
        console.log('- photoFile:', this.obituary.photoFile ? {
            hasData: !!this.obituary.photoFile.data,
            dataPreview: this.obituary.photoFile.data?.substring(0, 100),
            name: this.obituary.photoFile.name,
            type: this.obituary.photoFile.type
        } : 'null');
        console.log('- source:', this.obituary.source);
        
        // 3. Test URL immagine
        const imageUrl = this.getObituaryImageUrl();
        console.log('\n🎯 URL IMMAGINE FINALE:', imageUrl);
        
        // 4. Verifica requisiti Facebook
        console.log('\n✅ VERIFICA REQUISITI FACEBOOK:');
        const checks = {
            'HTTPS': imageUrl.startsWith('https://'),
            'URL Pubblico': !imageUrl.startsWith('data:') && !imageUrl.includes('localhost'),
            'Supabase Storage': imageUrl.includes('supabase.co/storage/v1/object/public/'),
            'Estensione Valida': /\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl)
        };
        
        Object.entries(checks).forEach(([check, passed]) => {
            console.log(`${passed ? '✅' : '❌'} ${check}:`, passed);
        });
        
        // 5. Test accessibilità immagine
        console.log('\n🌐 TEST ACCESSIBILITÀ IMMAGINE:');
        this.testImageAccessibility(imageUrl);
        
        // 6. Verifica meta tag
        console.log('\n📝 META TAG ATTUALI:');
        this.testOpenGraphTags();
        
        // 7. Possibili soluzioni
        console.log('\n💡 POSSIBILI SOLUZIONI:');
        if (!checks['HTTPS']) {
            console.log('🔧 Problema HTTPS: Assicurati che l\'immagine sia servita via HTTPS');
        }
        if (!checks['URL Pubblico']) {
            console.log('🔧 Problema URL: L\'immagine deve essere pubblicamente accessibile');
        }
        if (!checks['Supabase Storage']) {
            console.log('🔧 Problema Supabase: Verifica che l\'immagine sia caricata su Supabase Storage');
        }
        if (!checks['Estensione Valida']) {
            console.log('🔧 Problema formato: Usa JPG, PNG, GIF o WebP');
        }
        
        console.log('\n🔄 PASSI PER RISOLVERE:');
        console.log('1. Verifica che l\'immagine sia caricata correttamente su Supabase');
        console.log('2. Controlla i permessi del bucket Supabase (deve essere pubblico)');
        console.log('3. Usa refreshFacebookCache() per forzare Facebook a ricaricare');
        console.log('4. Verifica nel Facebook Debugger che non ci siano errori CORS');
        
        return {
            obituary: !!this.obituary,
            imageUrl,
            checks,
            recommendations: Object.entries(checks).filter(([, passed]) => !passed).map(([check]) => check)
        };
    }

    // Debug specifico per i dati dell'immagine
    debugImageData() {
        console.log('🖼️ DEBUG DATI IMMAGINE NECROLOGIO');
        console.log('==================================');
        
        if (!this.obituary) {
            console.error('❌ Nessun obituary caricato');
            return;
        }
        
        console.log('📊 INFORMAZIONI OBITUARY:');
        console.log(`- Nome: ${this.obituary.nome}`);
        console.log(`- ID: ${this.obituary.id}`);
        console.log(`- Source: ${this.obituary.source}`);
        
        console.log('\n📷 DATI IMMAGINE DISPONIBILI:');
        console.log(`- foto: ${this.obituary.foto}`);
        console.log(`- photo: ${this.obituary.photo}`);
        console.log(`- photoURL: ${this.obituary.photoURL}`);
        console.log(`- photoFileName: ${this.obituary.photoFileName}`);
        console.log(`- photoFileType: ${this.obituary.photoFileType}`);
        console.log(`- photoFileSize: ${this.obituary.photoFileSize}`);
        
        if (this.obituary.photoFile) {
            console.log('\n📁 PHOTOFILE OBJECT:');
            console.log(`- hasData: ${!!this.obituary.photoFile.data}`);
            console.log(`- name: ${this.obituary.photoFile.name}`);
            console.log(`- type: ${this.obituary.photoFile.type}`);
            console.log(`- size: ${this.obituary.photoFile.size}`);
            if (this.obituary.photoFile.data) {
                const dataPreview = this.obituary.photoFile.data.substring(0, 100);
                console.log(`- data preview: ${dataPreview}...`);
                console.log(`- is URL: ${this.obituary.photoFile.data.startsWith('http')}`);
                console.log(`- is base64: ${this.obituary.photoFile.data.startsWith('data:')}`);
            }
        } else {
            console.log('\n📁 PHOTOFILE: null');
        }
        
        console.log('\n🎯 TEST LOGICA PRIORITÀ:');
        const imageUrl = this.getObituaryImageUrl();
        console.log(`- URL finale: ${imageUrl}`);
        console.log(`- È Supabase: ${imageUrl.includes('supabase.co')}`);
        console.log(`- È pubblico: ${imageUrl.includes('/storage/v1/object/public/')}`);
        console.log(`- È placeholder: ${imageUrl.includes('placeholder') || imageUrl.includes('FINALE_1')}`);
        
        console.log('\n💡 RACCOMANDAZIONI:');
        if (!this.obituary.photoURL) {
            console.log('❌ photoURL è null/undefined - problema nel database Supabase');
        } else if (!this.obituary.photoURL.startsWith('https://')) {
            console.log('❌ photoURL non inizia con https:// - URL non valido');
        } else if (!this.obituary.photoURL.includes('supabase.co')) {
            console.log('❌ photoURL non è da Supabase Storage');
        } else {
            console.log('✅ photoURL sembra corretto');
        }
        
        return {
            obituary: {
                nome: this.obituary.nome,
                id: this.obituary.id,
                source: this.obituary.source
            },
            imageData: {
                foto: this.obituary.foto,
                photoURL: this.obituary.photoURL,
                photoFileName: this.obituary.photoFileName,
                photoFile: this.obituary.photoFile ? {
                    hasData: !!this.obituary.photoFile.data,
                    isURL: this.obituary.photoFile.data?.startsWith('http'),
                    isBase64: this.obituary.photoFile.data?.startsWith('data:')
                } : null
            },
            finalUrl: imageUrl
        };
    }

    showNotFoundMessage() {
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="container mx-auto px-4 py-16 text-center">
                    <div class="max-w-md mx-auto">
                        <i class="fas fa-exclamation-triangle text-6xl text-funeral-gold mb-6"></i>
                        <h1 class="text-2xl font-bold text-funeral-dark mb-4">Necrologio non trovato</h1>
                        <p class="text-gray-600 mb-8">Il necrologio richiesto non è disponibile o potrebbe essere stato rimosso.</p>
                        <a href="necrologi.html" class="bg-funeral-gold text-funeral-dark px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors">
                            <i class="fas fa-arrow-left mr-2"></i>
                            Torna ai Necrologi
                        </a>
                    </div>
                </div>
            `;
        }
    }

    updatePageContent() {
        // Controllo di sicurezza: verifica che obituary sia caricato
        if (!this.obituary) {
            console.error('❌ Impossibile aggiornare contenuto: obituary non caricato');
            this.showNotFoundMessage();
            return;
        }
        // Update photo and name using specific IDs
        const photoImg = document.getElementById('obituary-photo');
        const nameH1 = document.getElementById('obituary-name');
        
        if (photoImg) {
            // Priorità: photoFile -> foto/photo -> placeholder
            if (this.obituary.photoFile && this.obituary.photoFile.data) {
                // Usa la foto caricata (base64)
                photoImg.src = this.obituary.photoFile.data;
            } else if (this.obituary.foto || this.obituary.photo) {
                // Usa URL foto (compatibilità italiano/inglese)
                photoImg.src = this.obituary.foto || this.obituary.photo;
            } else {
                // Placeholder se nessuna foto disponibile
                photoImg.src = 'images/placeholder-small.svg';
            }
            photoImg.alt = this.obituary.nome || this.obituary.name || 'Foto';
        }
        if (nameH1) nameH1.textContent = this.obituary.nome || this.obituary.name;

        // Update personal details using specific IDs
        const birthDate = document.getElementById('birth-date');
        const deathDate = document.getElementById('death-date');
        const obituaryCity = document.getElementById('obituary-city');
        const obituaryAge = document.getElementById('obituary-age');
        
        if (birthDate) {
            if (this.obituary.dataNascita) {
                birthDate.textContent = Utils.formatDate(this.obituary.dataNascita);
                birthDate.parentElement.style.display = 'flex';
            } else {
                birthDate.parentElement.style.display = 'none';
            }
        }
        if (deathDate) deathDate.textContent = Utils.formatDate(this.obituary.dataMorte);
        if (obituaryCity) obituaryCity.textContent = this.obituary.comune;
        if (obituaryAge) {
            const age = this.obituary.eta || this.calculateAge();
            if (age && age > 0) {
                obituaryAge.textContent = `${age} anni`;
                obituaryAge.parentElement.style.display = 'flex';
            } else {
                obituaryAge.parentElement.style.display = 'none';
            }
        }

        // Update marital status if present
        const maritalStatusRow = document.getElementById('marital-status-row');
        const maritalStatusElement = document.getElementById('obituary-marital-status');
        
        if (this.obituary.maritalStatus && maritalStatusElement && maritalStatusRow) {
            const maritalText = this.getMaritalStatusText(this.obituary.maritalStatus, this.obituary.spouseName);
            maritalStatusElement.textContent = maritalText;
            maritalStatusRow.style.display = 'flex';
        } else if (maritalStatusRow) {
            maritalStatusRow.style.display = 'none';
        }

        // Update funeral details using specific IDs
        const funeralDate = document.getElementById('funeral-date');
        const funeralTime = document.getElementById('funeral-time');
        const funeralLocation = document.getElementById('funeral-location');
        
        if (funeralDate) funeralDate.textContent = Utils.formatDate(this.obituary.dataEsequie);
        if (funeralTime) funeralTime.textContent = this.obituary.oraEsequie;
        if (funeralLocation) funeralLocation.textContent = this.obituary.luogoEsequie;

        // Update description using specific ID
        const obituaryDescription = document.getElementById('obituary-description');
        if (obituaryDescription) {
            const description = this.obituary.testo || this.obituary.description || '';
            obituaryDescription.textContent = description;
            
            // Nascondi la sezione "In Memoria" se non c'è testo commemorativo
            const memorySection = obituaryDescription.closest('.bg-white');
            if (memorySection) {
                if (description.trim()) {
                    memorySection.style.display = 'block';
                } else {
                    memorySection.style.display = 'none';
                }
            }
        }

        // Aggiungi link manifesto se presente
        console.log('🔄 Chiamando addManifestoLink per:', this.obituary.nome);
        this.addManifestoLink();

        // Update breadcrumb using specific ID
        const breadcrumbName = document.getElementById('breadcrumb-name');
        if (breadcrumbName) breadcrumbName.textContent = this.obituary.nome;

        // Update page title in head
        document.title = `${this.obituary.nome} - Necrologio | Agenzia Funebre Santaniello`;

        // Update condolence button with correct ID
        const condolenceBtn = document.getElementById('condolence-btn');
        console.log('🔍 Debug condoglianze:', {
            condolenceBtn: !!condolenceBtn,
            obituaryId: this.obituaryId,
            obituaryName: this.obituary.nome
        });
        
        if (condolenceBtn) {
            // For dynamic pages, just use openCondolenceFormDetail without parameters
            // since the function will get the obituary from obituaryDetailPage.obituary
            condolenceBtn.setAttribute('onclick', `openCondolenceFormDetail()`);
            console.log('✅ Bottone condoglianze configurato correttamente');
        } else {
            console.warn('⚠️ Bottone condoglianze (#condolence-btn) non trovato nel DOM');
        }
    }

    calculateAge() {
        // Controllo di sicurezza: verifica che obituary esista
        if (!this.obituary || !this.obituary.dataNascita || !this.obituary.dataMorte) {
            console.warn('⚠️ Dati obituary mancanti per calcolo età');
            return null;
        }
        
        const birth = new Date(this.obituary.dataNascita);
        const death = new Date(this.obituary.dataMorte);
        let age = death.getFullYear() - birth.getFullYear();
        const monthDiff = death.getMonth() - birth.getMonth();
        
        // Aggiusta l'età se il compleanno non è ancora passato
        if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
            age--;
        }
        
        return age > 0 ? age : null;
    }

    getMaritalStatusText(maritalStatus, spouseName) {
        const statusMap = {
            'celibe': 'Celibe',
            'nubile': 'Nubile', 
            'coniugato': 'Coniugato/a',
            'vedovo': 'Vedovo/a',
            'divorziato': 'Divorziato/a'
        };
        
        let text = statusMap[maritalStatus] || maritalStatus;
        
        if (spouseName && (maritalStatus === 'coniugato' || maritalStatus === 'vedovo' || maritalStatus === 'divorziato')) {
            if (maritalStatus === 'coniugato') {
                text += ` con ${spouseName}`;
            } else if (maritalStatus === 'vedovo') {
                text += ` di ${spouseName}`;
            } else if (maritalStatus === 'divorziato') {
                text += ` da ${spouseName}`;
            }
        }
        
        return text;
    }

    // 📄 Mostra il manifesto inline se presente
    addManifestoLink() {
        // Controllo di sicurezza: verifica che obituary esista
        if (!this.obituary) {
            console.warn('⚠️ Obituary non caricato, impossibile mostrare manifesto');
            return;
        }
        
        console.log('🔍 Debug manifesto:', this.obituary.nome, 'ha manifesto:', !!this.obituary.manifestoFile);
        
        if (this.obituary.manifestoFile) {
            console.log('📄 Manifesto trovato:', this.obituary.manifestoFile.name, 'URL:', this.obituary.manifestoFile.data);
        }
        
        // Verifica manifesto - dovrebbe essere già mappato correttamente in main.js
        if (!this.obituary.manifestoFile) {
            console.log('📄 Nessun manifesto per:', this.obituary.nome);
            return;
        }
        
        console.log('📄 Manifesto trovato, procedo con la visualizzazione');

        // Trova il container delle condoglianze per inserire il manifesto dopo
        const condolencesContainer = document.querySelector('.bg-white.rounded-lg.shadow-lg:last-child') || 
                                   document.getElementById('condolences-section') ||
                                   document.querySelector('[class*="condolence"]') ||
                                   document.querySelector('.mt-8.bg-white');
        
        console.log('🔍 Container condoglianze trovato:', condolencesContainer);
        
        if (!condolencesContainer) {
            console.error('❌ Container condoglianze non trovato, uso fallback');
            // Fallback: inserisci alla fine del main content
            const mainContent = document.querySelector('main') || document.querySelector('.container') || document.body;
            if (mainContent) {
                mainContent.appendChild(manifestoDiv);
                console.log('✅ Manifesto inserito nel main content come fallback');
                return;
            }
        }

        // Rimuovi manifesto esistente se presente
        const existingManifesto = document.getElementById('manifesto-viewer');
        if (existingManifesto) existingManifesto.remove();

        // Crea la sezione del manifesto
        const manifestoDiv = document.createElement('div');
        manifestoDiv.id = 'manifesto-viewer';
        manifestoDiv.className = 'mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg';
        
        // Header del manifesto
        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex items-center gap-3 mb-4';
        headerDiv.innerHTML = `
            <i class="fas fa-file-alt text-blue-600 text-xl"></i>
            <div>
                <p class="font-semibold text-gray-900">${this.obituary.manifestoFile.name}</p>
                <p class="text-sm text-blue-600">Manifesto Commemorativo</p>
            </div>
        `;
        
        manifestoDiv.appendChild(headerDiv);
        
        // Determina il tipo di file e mostra di conseguenza
        const fileType = this.obituary.manifestoFile.type || 'unknown';
        const manifestoContent = document.createElement('div');
        manifestoContent.className = 'bg-white rounded-lg overflow-hidden shadow-sm';
        
        console.log('📄 Tipo file manifesto:', fileType);
        
        if (fileType === 'application/pdf') {
            // Per PDF, usa un iframe
            manifestoContent.innerHTML = `
                <iframe 
                    src="${this.obituary.manifestoFile.data}" 
                    class="w-full h-96 border-0"
                    title="Manifesto Commemorativo"
                ></iframe>
                <div class="p-3 bg-gray-50 border-t text-center">
                    <a href="${this.obituary.manifestoFile.data}" 
                       target="_blank" 
                       class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        <i class="fas fa-external-link-alt mr-1"></i>
                        Apri in nuova finestra
                    </a>
                </div>
            `;
        } else if (fileType && fileType.startsWith('image/')) {
            // Per immagini, mostra direttamente
            manifestoContent.innerHTML = `
                <img 
                    src="${this.obituary.manifestoFile.data}" 
                    alt="Manifesto Commemorativo" 
                    class="w-full max-h-96 object-contain bg-white"
                    onclick="this.classList.toggle('max-h-96'); this.classList.toggle('max-h-none');"
                    style="cursor: zoom-in;"
                    title="Clicca per ingrandire/ridurre"
                >
                <div class="p-3 bg-gray-50 border-t text-center">
                    <p class="text-sm text-gray-600">
                        <i class="fas fa-search-plus mr-1"></i>
                        Clicca sull'immagine per ingrandire
                    </p>
                </div>
            `;
        } else {
            // Per altri tipi di file, mostra un messaggio
            manifestoContent.innerHTML = `
                <div class="p-6 text-center">
                    <i class="fas fa-file-alt text-gray-400 text-4xl mb-3"></i>
                    <p class="text-gray-600 mb-2">Tipo di file non visualizzabile direttamente</p>
                    <a href="${this.obituary.manifestoFile.data}" 
                       target="_blank" 
                       class="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-external-link-alt mr-2"></i>
                        Apri File
                    </a>
                </div>
            `;
        }
        
        manifestoDiv.appendChild(manifestoContent);
        
        // Inserisci dopo le condoglianze
        console.log('🔧 Inserendo manifesto nel DOM per:', this.obituary.nome);
        console.log('📍 Container condoglianze:', condolencesContainer);
        
        try {
            // Inserisci dopo il container delle condoglianze
            if (condolencesContainer.parentNode) {
                condolencesContainer.parentNode.insertBefore(manifestoDiv, condolencesContainer.nextSibling);
                console.log('✅ Manifesto inserito dopo le condoglianze');
            } else {
                // Fallback: inserisci dopo il container stesso
                condolencesContainer.appendChild(manifestoDiv);
                console.log('✅ Manifesto inserito dentro il container condoglianze');
            }
            
            // Verifica che sia stato inserito
            setTimeout(() => {
                const inserted = document.getElementById('manifesto-viewer');
                console.log('🔍 Verifica inserimento:', {
                    presente: !!inserted,
                    visibile: inserted ? inserted.offsetHeight > 0 : false,
                    altezza: inserted ? inserted.offsetHeight : 'N/A'
                });
                
                if (inserted) {
                    console.log('✅ Manifesto inserito correttamente nella posizione desiderata');
                } else {
                    console.error('❌ Manifesto non trovato dopo inserimento');
                }
            }, 100);
            
        } catch (error) {
            console.error('❌ Errore inserimento manifesto:', error);
        }
    }

    // Generate the correct link for an obituary (same as in ObituariesManager)
    getObituaryLink(obituary) {
        const cleanId = typeof obituary.id === 'string' ? obituary.id.replace(/^(json_|admin_|firebase_)/, '') : obituary.id;
        
        // Check if this is likely a Firebase/admin obituary (has prefix or is not a simple number)
        if (typeof obituary.id === 'string' && obituary.id.includes('_')) {
            // Use dynamic page with URL parameter
            return `necrologio-detail.html?id=${encodeURIComponent(obituary.id)}`;
        }
        
        // For simple numeric IDs (1, 2, 3), check if static file exists
        const numericId = parseInt(cleanId);
        if (!isNaN(numericId) && numericId >= 1 && numericId <= 3) {
            // Use static file for IDs 1-3 (assuming these exist)
            return `necrologio-${cleanId}.html`;
        }
        
        // For any other case, use dynamic page
        return `necrologio-detail.html?id=${encodeURIComponent(obituary.id)}`;
    }

    async loadCondolences() {
        const condolencesList = document.getElementById('condolences-list');
        const condolencesCount = document.getElementById('condolences-count');
        
        if (!this.obituary) {
            console.warn('⚠️ Impossibile caricare condoglianze: obituary non trovato');
            return;
        }

        try {
            console.log('📋 Caricando condoglianze per necrologio:', this.obituary.nome);
            console.log('🔍 Debug caricamento condoglianze:', {
                obituaryId: this.obituaryId,
                obituaryIdType: typeof this.obituaryId,
                hasObituariesManager: !!this.obituariesManager,
                hasLoadCondolencesMethod: !!(this.obituariesManager && this.obituariesManager.loadCondolences),
                hasSupabaseManager: !!window.supabaseManager,
                supabaseInitialized: !!(window.supabaseManager && window.supabaseManager.isInitialized)
            });

            // Carica condoglianze dal database se disponibile
            let condolences = [];
            
            if (this.obituariesManager && this.obituariesManager.loadCondolences) {
                console.log(`🔄 Chiamando loadCondolences con ID: "${this.obituaryId}"`);
                const dbCondolences = await this.obituariesManager.loadCondolences(this.obituaryId);
                console.log('📋 Risultato loadCondolences:', dbCondolences);
                
                if (dbCondolences && dbCondolences.length > 0) {
                    condolences = dbCondolences;
                    console.log(`✅ Caricate ${condolences.length} condoglianze dal database`);
                    
                    // Aggiorna anche l'obituary locale con le condoglianze del database
                    this.obituary.condoglianze = condolences;
                } else {
                    console.log('⚠️ Nessuna condoglianza trovata nel database');
                }
            } else {
                console.warn('⚠️ ObituariesManager o metodo loadCondolences non disponibile');
            }
            
            // Fallback: usa condoglianze locali se non ci sono quelle del database
            if (condolences.length === 0 && this.obituary.condoglianze) {
                condolences = this.obituary.condoglianze;
                console.log(`📋 Usando ${condolences.length} condoglianze locali`);
            }

            // Aggiorna il contatore
            if (condolencesCount) {
                condolencesCount.textContent = `(${condolences.length})`;
            }

            // Se non ci sono condoglianze, mostra messaggio predefinito
            if (condolences.length === 0) {
                if (condolencesList) {
                    condolencesList.innerHTML = `
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-heart text-3xl mb-4 text-gray-300"></i>
                            <p>Nessuna condoglianza ancora. Sii il primo a lasciare un messaggio di cordoglio.</p>
                        </div>
                    `;
                }
                return;
            }

            // Mostra le condoglianze
            if (condolencesList) {
                condolencesList.innerHTML = condolences.map(condolence => `
                    <div class="border-l-4 border-funeral-gold pl-6 py-4">
                        <div class="flex items-start justify-between">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 bg-funeral-gold text-funeral-dark rounded-full flex items-center justify-center font-semibold">
                                    ${condolence.nome.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 class="font-semibold text-funeral-dark">${condolence.nome}</h4>
                                    <p class="text-sm text-gray-500">${this.formatDate(condolence.data)}</p>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <p class="text-gray-700 leading-relaxed">${condolence.messaggio}</p>
                        </div>
                    </div>
                `).join('');
            }

            console.log(`✅ Visualizzate ${condolences.length} condoglianze`);

        } catch (error) {
            console.error('❌ Errore caricamento condoglianze:', error);
            
            // Fallback in caso di errore
            if (condolencesCount) {
                condolencesCount.textContent = '(0)';
            }
            if (condolencesList) {
                condolencesList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-exclamation-triangle text-3xl mb-4 text-yellow-500"></i>
                        <p>Errore nel caricamento delle condoglianze. Riprova più tardi.</p>
                    </div>
                `;
            }
        }
    }



    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    async addCondolence(condolenceData) {
        try {
            console.log('💌 Aggiungendo condoglianza nella pagina dettaglio...');
            
            // Usa il metodo asincrono dell'ObituariesManager
            const success = await this.obituariesManager.addCondolence(this.obituaryId, condolenceData);
            
            if (success) {
                console.log('✅ Condoglianza aggiunta con successo');
                
                // Ricarica l'obituary aggiornato
                this.obituary = this.obituariesManager.getById(this.obituaryId);
                
                // Ricarica le condoglianze dal database
                await this.loadCondolences();
                
                return true;
            } else {
                console.error('❌ Errore aggiunta condoglianza');
                return false;
            }
        } catch (error) {
            console.error('❌ Errore nel processo di aggiunta condoglianza:', error);
            return false;
        }
    }
}

// Condolence form functionality
function openCondolenceFormDetail(obituaryId) {
    console.log('🔄 Apertura form condoglianze...', obituaryId);
    console.log('🔍 Debug stato:', {
        obituaryDetailPage: !!obituaryDetailPage,
        hasObituary: !!obituaryDetailPage?.obituary,
        obituaryName: obituaryDetailPage?.obituary?.nome,
        Utils: !!Utils,
        showNotification: !!Utils?.showNotification
    });
    
    // Use the existing obituary data from the page instead of reloading
    const obituary = obituaryDetailPage?.obituary;
    
    if (!obituary) {
        console.error('❌ Obituary not found for condolence form. ObituaryDetailPage:', obituaryDetailPage);
        
        // Fallback: prova a usare Utils se disponibile
        if (Utils && Utils.showNotification) {
            Utils.showNotification('Errore: necrologio non trovato. Riprova tra qualche secondo.', 'error');
        } else {
            alert('Errore: necrologio non trovato. Riprova tra qualche secondo.');
        }
        return;
    }
    
    console.log('✅ Apertura form condoglianze per:', obituary.nome);

    const modal = document.createElement('div');
    modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'condolence-modal-detail';
    
    modal.innerHTML = `
        <div class="modal-content bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold text-funeral-dark">Condoglianze per ${obituary.nome}</h3>
                <button onclick="closeCondolenceModalDetail()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center space-x-4">
                    <img src="${this.obituariesManager.getObituaryPhoto(obituary)}" alt="${obituary.nome}" class="w-16 h-20 object-cover rounded">
                    <div>
                        <p class="font-bold text-funeral-dark text-lg">${obituary.nome}</p>
                        <p class="text-sm text-gray-600">
                            ${Utils.formatDate(obituary.dataNascita)} - ${Utils.formatDate(obituary.dataMorte)}
                        </p>
                        <p class="text-sm text-gray-500">${obituary.comune}</p>
                    </div>
                </div>
            </div>
            
            <form id="condolence-form">
                <input type="hidden" name="obituary_id" value="${obituary.id}">
                
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-funeral-dark mb-2">
                        <i class="fas fa-user mr-1"></i> Nome Completo *
                    </label>
                    <input 
                        type="text" 
                        name="nome" 
                        required 
                        class="form-input w-full p-3 border border-gray-300 rounded-lg"
                        placeholder="Il tuo nome e cognome"
                    >
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-funeral-dark mb-2">
                        <i class="fas fa-envelope mr-1"></i> Email *
                    </label>
                    <input 
                        type="email" 
                        name="email" 
                        required 
                        class="form-input w-full p-3 border border-gray-300 rounded-lg"
                        placeholder="La tua email"
                    >
                </div>
                
                <div class="mb-6">
                    <label class="block text-sm font-semibold text-funeral-dark mb-2">
                        <i class="fas fa-heart mr-1"></i> Messaggio di Condoglianze *
                    </label>
                    <textarea 
                        name="messaggio" 
                        required 
                        rows="5" 
                        class="form-input w-full p-3 border border-gray-300 rounded-lg" 
                        placeholder="Scrivi qui il tuo messaggio di cordoglio per la famiglia..."
                    ></textarea>
                    <p class="text-xs text-gray-500 mt-1">Minimo 10 caratteri</p>
                </div>
                
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div class="flex items-start">
                        <i class="fas fa-info-circle text-blue-500 mr-2 mt-0.5"></i>
                        <div class="text-sm text-blue-700">
                            <p class="font-semibold mb-1">Informazioni sulla privacy</p>
                            <p>Le tue condoglianze saranno visibili pubblicamente su questa pagina. I tuoi dati personali saranno trattati secondo la nostra Privacy Policy.</p>
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <button 
                        type="button" 
                        onclick="closeCondolenceModalDetail()" 
                        class="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                    >
                        <i class="fas fa-times mr-2"></i>
                        Annulla
                    </button>
                    <button 
                        type="submit" 
                        class="flex-1 bg-funeral-gold text-funeral-dark py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
                    >
                        <i class="fas fa-heart mr-2"></i>
                        Invia Condoglianze
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Focus on first input
    setTimeout(() => {
        const firstInput = modal.querySelector('input[name="nome"]');
        if (firstInput) firstInput.focus();
    }, 100);
}

// Assign to global immediately after function definition
window.openCondolenceFormDetail = openCondolenceFormDetail;

function closeCondolenceModalDetail() {
    const modal = document.getElementById('condolence-modal-detail');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Assign to global immediately after function definition
window.closeCondolenceModalDetail = closeCondolenceModalDetail;

// Share functionality
function shareObituary() {
    const obituary = obituaryDetailPage.obituary;
    if (!obituary) return;

    const shareData = {
        title: `Necrologio di ${obituary.nome}`,
        text: obituary.testo ? 
            `${obituary.nome} (${new Date(obituary.dataNascita).getFullYear()}-${new Date(obituary.dataMorte).getFullYear()}) - ${obituary.testo.substring(0, 100)}...` :
            `${obituary.nome} (${new Date(obituary.dataNascita).getFullYear()}-${new Date(obituary.dataMorte).getFullYear()})`,
        url: window.location.href
    };

    // Check if Web Share API is supported
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => {
                Utils.showNotification('Necrologio condiviso con successo', 'success');
            })
            .catch((error) => {
                console.log('Error sharing:', error);
                fallbackShare();
            });
    } else {
        fallbackShare();
    }
}

function fallbackShare() {
    const url = window.location.href;
    
    const modal = document.createElement('div');
    modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'share-modal';
    
    modal.innerHTML = `
        <div class="modal-content bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-funeral-dark">Condividi Necrologio</h3>
                <button onclick="closeShareModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="space-y-3">
                <button 
                    onclick="shareToFacebook('${url}')" 
                    class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                    <i class="fab fa-facebook-f mr-2"></i>
                    Condividi su Facebook
                </button>
                
                <button 
                    onclick="shareToWhatsApp('${url}')" 
                    class="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                    <i class="fab fa-whatsapp mr-2"></i>
                    Condividi su WhatsApp
                </button>
                
                <button 
                    onclick="copyToClipboard('${url}')" 
                    class="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                >
                    <i class="fas fa-copy mr-2"></i>
                    Copia Link
                </button>
            </div>
            
            <div class="mt-4 p-3 bg-gray-100 rounded-lg">
                <p class="text-xs text-gray-600 break-all">${url}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

function shareToFacebook(url) {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
    closeShareModal();
}

function shareToWhatsApp(url) {
    const text = `Necrologio di ${obituaryDetailPage.obituary.nome} - ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    closeShareModal();
}

function copyToClipboard(url) {
    navigator.clipboard.writeText(url).then(() => {
        Utils.showNotification('Link copiato negli appunti', 'success');
        closeShareModal();
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        Utils.showNotification('Link copiato negli appunti', 'success');
        closeShareModal();
    });
}

// Custom form handler for condolence form
class CondolenceFormHandler extends FormHandler {
    handleCondolenceForm(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const rules = {
            nome: { required: true, minLength: 2 },
            email: { required: true, email: true },
            messaggio: { required: true, minLength: 10 }
        };

        const errors = this.validateForm(formData, rules);
        
        if (Object.keys(errors).length > 0) {
            this.showFieldErrors(errors);
            return;
        }

        this.clearFieldErrors();

        const condolence = {
            nome: formData.get('nome'),
            email: formData.get('email'),
            messaggio: formData.get('messaggio')
        };

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Invio in corso...';
        submitBtn.disabled = true;

        setTimeout(async () => {
            try {
                console.log('Processing condolence submission...');
                
                // Add condolence using the existing method (now async)
                if (obituaryDetailPage) {
                    const success = await obituaryDetailPage.addCondolence(condolence);
                    
                    if (success) {
                        console.log('Condolence added successfully');
                        Utils.showNotification('Condoglianze inviate con successo. Grazie per il tuo messaggio.', 'success');
                        closeCondolenceModalDetail();
                    } else {
                        console.error('Failed to add condolence');
                        Utils.showNotification('Errore nell\'invio delle condoglianze. Riprova più tardi.', 'error');
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    }
                } else {
                    console.error('ObituaryDetailPage not available');
                    Utils.showNotification('Errore nell\'invio delle condoglianze. Riprova più tardi.', 'error');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Error in condolence submission:', error);
                Utils.showNotification('Errore nell\'invio delle condoglianze. Riprova più tardi.', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }, 1500);
    }
}

// Initialize obituary detail page
let obituaryDetailPage;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing obituary detail page...');
    obituaryDetailPage = new ObituaryDetailPage();
    
    // Make obituaryDetailPage globally available for testing
    window.obituaryDetailPage = obituaryDetailPage;
    
    // Rendi disponibili le funzioni di debug globalmente
    window.testOpenGraph = () => obituaryDetailPage?.testOpenGraphTags();
    window.refreshFacebookCache = () => obituaryDetailPage?.refreshFacebookCache();
    window.diagnoseOpenGraph = () => obituaryDetailPage?.diagnoseOpenGraphIssues();
    window.forceFacebookRescrape = () => obituaryDetailPage?.forceFacebookRescrape();
    window.debugImageData = () => obituaryDetailPage?.debugImageData();
    
    // Override form handler for condolences
    const formHandler = new CondolenceFormHandler();
    
    // Handle condolence form submission using event delegation
    document.addEventListener('submit', function(e) {
        if (e.target.id === 'condolence-form') {
            console.log('Condolence form submitted');
            e.preventDefault();
            formHandler.handleCondolenceForm(e);
        }
    });
    
    console.log('Obituary detail page initialized');
});