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
        this.loadCondolences();
        this.loadOtherObituaries();
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
        
        // Update the page content with obituary data
        this.updatePageContent();
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
        
        if (birthDate) birthDate.textContent = Utils.formatDate(this.obituary.dataNascita);
        if (deathDate) deathDate.textContent = Utils.formatDate(this.obituary.dataMorte);
        if (obituaryCity) obituaryCity.textContent = this.obituary.comune;
        if (obituaryAge) obituaryAge.textContent = `${this.obituary.eta || this.calculateAge()} anni`;

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
            return 0;
        }
        
        const birth = new Date(this.obituary.dataNascita);
        const death = new Date(this.obituary.dataMorte);
        return death.getFullYear() - birth.getFullYear();
    }

    // 📄 Mostra il manifesto inline se presente
    addManifestoLink() {
        // Controllo di sicurezza: verifica che obituary esista
        if (!this.obituary) {
            console.warn('⚠️ Obituary non caricato, impossibile mostrare manifesto');
            return;
        }
        
        console.log('🔍 Debug manifesto completo:', {
            hasObituary: !!this.obituary,
            obituaryName: this.obituary.nome,
            obituaryId: this.obituary.id,
            obituarySource: this.obituary.source,
            hasManifestoFile: !!this.obituary.manifestoFile,
            manifestoFile: this.obituary.manifestoFile
        });
        
        // Verifica manifesto - dovrebbe essere già mappato correttamente in main.js
        if (!this.obituary.manifestoFile) {
            console.log('📄 Nessun manifesto disponibile per questo necrologio');
            return;
        }
        
        console.log('📄 Manifesto trovato, procedo con la visualizzazione');

        // Trova un punto dove inserire il manifesto (dopo la descrizione)
        const descriptionEl = document.getElementById('obituary-description');
        if (!descriptionEl) {
            console.error('❌ Elemento #obituary-description non trovato');
            return;
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
        
        // Inserisci dopo la descrizione (stesso metodo che funziona per Mario Rossi)
        descriptionEl.parentNode.insertBefore(manifestoDiv, descriptionEl.nextSibling);
        
        console.log('✅ Manifesto inserito per:', this.obituary.nome);
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

    loadCondolences() {
        const condolencesList = document.getElementById('condolences-list');
        const condolencesCount = document.getElementById('condolences-count');
        
        if (!this.obituary || !this.obituary.condoglianze) {
            return;
        }

        const condolences = this.obituary.condoglianze;
        
        if (condolences.length === 0) {
            // Already has default "no condolences" message
            condolencesCount.textContent = '(0)';
            return;
        }

        condolencesCount.textContent = `(${condolences.length})`;
        
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

    loadOtherObituaries() {
        const container = document.getElementById('other-obituaries');
        
        // Controlla se l'elemento esiste
        if (!container) {
            console.warn('⚠️ Elemento #other-obituaries non trovato, salto il caricamento');
            return;
        }
        
        const otherObituaries = this.obituariesManager.getAll()
            .filter(obit => obit.id !== this.obituaryId)
            .slice(0, 2); // Show only 2 other obituaries

        console.log(`📋 Caricando ${otherObituaries.length} altri necrologi per la sidebar`);

        container.innerHTML = otherObituaries.map(obituary => `
            <div class="necrologio-card bg-white rounded-lg shadow p-6">
                <div class="flex items-start space-x-4">
                    <img src="${this.obituariesManager.getObituaryPhoto(obituary)}" alt="${obituary.nome}" class="w-16 h-20 object-cover rounded">
                    <div class="flex-1">
                        <h3 class="font-bold text-funeral-dark text-lg mb-2">${obituary.nome}</h3>
                        <p class="text-sm text-gray-600 mb-1">
                            <i class="fas fa-calendar mr-1"></i>
                            ${this.formatDate(obituary.dataNascita)} - ${this.formatDate(obituary.dataMorte)}
                        </p>
                        <p class="text-sm text-gray-600 mb-3">
                            <i class="fas fa-map-marker-alt mr-1"></i>
                            ${obituary.comune}
                        </p>
                                                    ${obituary.testo ? `<p class="text-sm text-gray-700 line-clamp-2 mb-3">${obituary.testo}</p>` : ''}
                        <a href="${this.getObituaryLink(obituary)}" class="text-funeral-gold hover:text-funeral-blue font-semibold text-sm">
                            Leggi tutto →
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    addCondolence(condolenceData) {
        if (this.obituariesManager.addCondolence(this.obituaryId, condolenceData)) {
            this.obituary = this.obituariesManager.getById(this.obituaryId);
            this.loadCondolences();
            return true;
        }
        return false;
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

        setTimeout(() => {
            console.log('Processing condolence submission...');
            // Add condolence using the existing method
            if (obituaryDetailPage && obituaryDetailPage.addCondolence(condolence)) {
                console.log('Condolence added successfully');
                Utils.showNotification('Condoglianze inviate con successo. Grazie per il tuo messaggio.', 'success');
                closeCondolenceModalDetail();
            } else {
                console.error('Failed to add condolence');
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