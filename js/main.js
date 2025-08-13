// Main JavaScript file for Santaniello Funeral Home

// Utility functions
class Utils {
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    static formatTime(timeString) {
        const time = new Date(`2000-01-01T${timeString}`);
        return time.toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification bg-white border-l-4 p-4 rounded shadow-lg ${
            type === 'success' ? 'border-green-500' : 
            type === 'error' ? 'border-red-500' : 
            'border-blue-500'
        }`;
        
        notification.innerHTML = `
            <div class="flex">
                <div class="flex-shrink-0">
                    <i class="fas ${
                        type === 'success' ? 'fa-check-circle text-green-500' :
                        type === 'error' ? 'fa-exclamation-circle text-red-500' :
                        'fa-info-circle text-blue-500'
                    }"></i>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-gray-700">${message}</p>
                </div>
                <div class="ml-auto pl-3">
                    <button class="text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    static showLoading(element) {
        element.innerHTML = '<div class="spinner mx-auto"></div>';
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePhone(phone) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    }

    static getCleanId(id) {
        if (typeof id === 'string') {
            // Remove prefixes like 'json_', 'admin_', etc.
            return id.replace(/^(json_|admin_|firebase_)/, '');
        }
        return id;
    }
}

// 📋 Gestione Necrologi
class ObituariesManager {
    constructor() {
        this.obituaries = [];
        this.isLoading = false;
        this.isLoaded = false;
        console.log('📋 ObituariesManager creato');
    }

    // 🔄 Carica necrologi da tutte le fonti disponibili
    async loadObituaries() {
        if (this.isLoading) {
            console.log('⏳ Caricamento già in corso...');
            return;
        }
        
        if (this.isLoaded && this.obituaries.length > 0) {
            console.log('✅ Dati già caricati, restituisco dati esistenti');
            return;
        }
        
        this.isLoading = true;
        console.log('🔄 Inizio caricamento necrologi...');
        
        try {
            let supabaseObituaries = [];
            let jsonObituaries = [];
            let adminObituaries = [];

            // 🗄️ PRIORITÀ 1: Carica da Supabase
            console.log('🔍 Verificando Supabase...', {
                supabaseManager: !!window.supabaseManager,
                isInitialized: window.supabaseManager?.isInitialized
            });
            
            // Aspetta che Supabase Manager sia disponibile e inizializzato
            let attempts = 0;
            const maxAttempts = 20; // Aumentato il numero di tentativi
            
            while ((!window.supabaseManager || !window.supabaseManager.isInitialized) && attempts < maxAttempts) {
                console.log(`⏳ Tentativo ${attempts + 1}/${maxAttempts} - Aspettando Supabase Manager...`);
                await new Promise(resolve => setTimeout(resolve, 300));
                attempts++;
            }
            
            if (window.supabaseManager && window.supabaseManager.isInitialized) {
                    console.log('🟢 Caricando da Supabase...');
                    const supabaseData = await window.supabaseManager.loadObituaries();
                    console.log(`📊 Supabase ha restituito ${supabaseData.length} necrologi`);
                    
                    supabaseObituaries = supabaseData.map(obit => ({
                        id: `supabase_${obit.id}`, // Prefisso per evitare conflitti
                        nome: obit.name,
                        dataNascita: obit.birthDate,
                        dataMorte: obit.deathDate,
                        eta: obit.age,
                        foto: obit.photoURL || "images/placeholder-person.svg",
                        photoFile: obit.photoURL ? {
                            data: obit.photoURL,
                            name: obit.photoFileName,
                            type: obit.photoFileType,
                            size: obit.photoFileSize
                        } : null,
                        manifestoFile: obit.manifestoURL ? {
                            data: obit.manifestoURL,
                            name: obit.manifestoFileName,
                            type: obit.manifestoFileType,
                            size: obit.manifestoFileSize
                        } : null,
                        luogoEsequie: obit.funeralLocation || "Casa Funeraria Santaniello",
                        oraEsequie: obit.funeralDate ? new Date(obit.funeralDate).toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'}) : "10:00",
                        dataEsequie: obit.funeralDate ? obit.funeralDate.split('T')[0] : obit.deathDate,
                        testo: obit.description,
                        comune: obit.city,
                        condoglianze: [],
                        source: 'supabase'
                    }));
            } else {
                if (window.supabaseManager) {
                    console.warn('⚠️ Supabase Manager trovato ma non inizializzato dopo attesa');
                } else {
                    console.warn('⚠️ Supabase Manager non disponibile dopo attesa');
                }
            }

            // 📄 PRIORITÀ 2: Carica da file JSON (backup/sviluppo)
            console.log('🔍 Tentando caricamento da JSON...');
            try {
                const response = await fetch('data/necrologi.json');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const data = await response.json();
                console.log(`📊 JSON contiene ${data.obituaries?.length || 0} necrologi`);
                
                jsonObituaries = (data.obituaries || []).map(obit => ({
                    id: `json_${obit.id}`, // Prefisso per evitare conflitti
                    nome: obit.name,
                    dataNascita: obit.birthDate, // Corretto: usa birthDate dal JSON
                    dataMorte: obit.deathDate,   // Corretto: usa deathDate dal JSON
                    eta: obit.age,
                    foto: obit.photo || "images/placeholder-person.svg",
                    photoFile: obit.photoFile || null, // Aggiungi photoFile per immagini caricate
                    manifestoFile: obit.manifestoFile || null, // Aggiungi manifestoFile per manifesti caricati
                    luogoEsequie: obit.funeralLocation || "Casa Funeraria Santaniello", // Corretto: usa funeralLocation
                    oraEsequie: obit.funeralDate ? new Date(obit.funeralDate).toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'}) : "10:00", // Corretto: usa funeralDate
                    dataEsequie: obit.funeralDate ? obit.funeralDate.split('T')[0] : obit.deathDate, // Corretto: usa funeralDate e deathDate
                    testo: obit.description,
                    comune: obit.city,
                    condoglianze: [],
                    source: 'json'
                }));
            } catch (jsonError) {
                console.warn('⚠️ File JSON non trovato o non valido:', jsonError.message);
            }

            // 💾 PRIORITÀ 3: Carica da localStorage (admin panel)
            console.log('🔍 Verificando localStorage...');
            const adminData = JSON.parse(localStorage.getItem('obituaries') || '[]');
            console.log(`📊 localStorage contiene ${adminData.length} necrologi`);
            adminObituaries = adminData.map(obit => ({
                id: `admin_${obit.id}`, // Prefisso per evitare conflitti
                nome: obit.name,
                dataNascita: obit.birthDate,
                dataMorte: obit.deathDate,
                eta: obit.age,
                foto: obit.photo || "images/placeholder-person.svg",
                photoFile: obit.photoFile || null, // Aggiungi photoFile per immagini caricate
                manifestoFile: obit.manifestoFile || null, // Aggiungi manifestoFile per manifesti caricati
                luogoEsequie: obit.funeralLocation || "Casa Funeraria Santaniello",
                oraEsequie: obit.funeralDate ? new Date(obit.funeralDate).toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'}) : "10:00",
                dataEsequie: obit.funeralDate ? obit.funeralDate.split('T')[0] : obit.deathDate,
                testo: obit.description,
                comune: obit.city,
                condoglianze: [],
                source: 'admin'
            }));

            // 🔄 Combina tutte le fonti (Supabase ha priorità)
            this.obituaries = [
                ...supabaseObituaries,
                ...jsonObituaries,
                ...adminObituaries
            ];

            // 📊 Log risultati dettagliati
            const sources = {
                supabase: supabaseObituaries.length,
                json: jsonObituaries.length,
                admin: adminObituaries.length
            };
            
            console.log(`✅ Caricati ${this.obituaries.length} necrologi totali:`, sources);
            console.log('📋 Dettaglio necrologi caricati:');
            this.obituaries.forEach((obit, index) => {
                console.log(`  ${index + 1}. ${obit.nome} (${obit.comune}) [${obit.source}] - ID: ${obit.id}`);
            });
            
            // Se non ci sono necrologi, usa fallback
            if (this.obituaries.length === 0) {
                console.log('📋 Nessun necrologio trovato, uso dati predefiniti');
                this.loadDefaultObituaries();
            }

            // Aggiorna le visualizzazioni
            this.updateDisplays();
            
            this.isLoaded = true;
            this.isLoading = false;
            
        } catch (error) {
            console.error('❌ Errore caricamento necrologi:', error);
            this.loadDefaultObituaries();
            this.isLoaded = true;
            this.isLoading = false;
        }
    }

    // 🎯 Ottieni foto del necrologio con priorità
    getObituaryPhoto(obituary) {
        console.log('📸 Ottenendo foto per:', obituary.nome);
        
        // Priorità 1: URL diretto da Supabase (foto)
        if (obituary.foto && obituary.foto !== 'images/placeholder-person.svg') {
            console.log('✅ Usando obituary.foto:', obituary.foto);
            return obituary.foto;
        }
        
        // Priorità 2: photoFile.data (file caricato)
        if (obituary.photoFile && obituary.photoFile.data) {
            console.log('✅ Usando photoFile.data:', obituary.photoFile.data);
            return obituary.photoFile.data;
        }
        
        // Priorità 3: photo (URL diretto)
        if (obituary.photo && obituary.photo !== 'images/placeholder-person.svg') {
            console.log('✅ Usando obituary.photo:', obituary.photo);
            return obituary.photo;
        }
        
        // Fallback: placeholder
        console.log('⚠️ Usando placeholder per:', obituary.nome);
        return 'images/placeholder-person.svg';
    }

    // Altri metodi necessari
    getRecent(limit = 3) {
        return this.obituaries.slice(0, limit);
    }

    getById(id) {
        console.log(`🔍 Ricerca necrologio con ID: "${id}" (tipo: ${typeof id})`);
        
        // Normalizza l'ID di ricerca
        const searchId = String(id); // Converti sempre a stringa
        const searchNumeric = parseInt(id); // Converti sempre a numero
        
        // Cerca con diverse strategie di matching
        const obituary = this.obituaries.find(obit => {
            const obituaryId = obit.id;
            const obituaryIdStr = String(obituaryId);
            const obituaryIdNum = parseInt(obituaryId);
            
            // Test di matching multipli
            const matches = [
                // Matching esatto
                obituaryId === id,
                obituaryId === searchId,
                obituaryId === searchNumeric,
                
                // Matching come stringhe
                obituaryIdStr === searchId,
                
                // Matching come numeri (se entrambi sono numeri validi)
                !isNaN(obituaryIdNum) && !isNaN(searchNumeric) && obituaryIdNum === searchNumeric,
                
                // Matching con prefissi
                obituaryId === `json_${searchId}`,
                obituaryId === `admin_${searchId}`,
                obituaryId === `supabase_${searchId}`,
                
                // Matching con ID puliti
                Utils.getCleanId(obituaryId) === searchId,
                Utils.getCleanId(obituaryId) === String(searchNumeric),
                !isNaN(parseInt(Utils.getCleanId(obituaryId))) && !isNaN(searchNumeric) && 
                parseInt(Utils.getCleanId(obituaryId)) === searchNumeric
            ];
            
            const found = matches.some(match => match === true);
            
            if (found) {
                console.log(`✅ Match trovato per ${obituaryId} vs ${id}:`, {
                    obituaryId,
                    obituaryIdStr,
                    obituaryIdNum,
                    searchId,
                    searchNumeric,
                    matchingTests: matches.map((m, i) => `${i}: ${m}`).filter(m => m.includes('true'))
                });
            }
            
            return found;
        });
        
        if (!obituary) {
            console.warn(`⚠️ Necrologio con ID "${id}" non trovato`);
            console.log('📋 ID disponibili:', this.obituaries.map(o => ({
                id: o.id,
                tipo: typeof o.id,
                nome: o.nome,
                cleanId: Utils.getCleanId(o.id)
            })));
            
            // Suggerisci ID simili
            if (!isNaN(searchNumeric)) {
                const suggestions = this.obituaries.filter(obit => {
                    const cleanId = Utils.getCleanId(obit.id);
                    const cleanNumeric = parseInt(cleanId);
                    return !isNaN(cleanNumeric) && Math.abs(cleanNumeric - searchNumeric) <= 2;
                });
                
                if (suggestions.length > 0) {
                    console.log('💡 Suggerimenti ID simili:', suggestions.map(s => ({
                        id: s.id,
                        tipo: typeof s.id,
                        nome: s.nome
                    })));
                }
            }
        } else {
            console.log(`✅ Necrologio trovato: ${obituary.nome} (ID: ${obituary.id}, tipo: ${typeof obituary.id})`);
        }
        
        return obituary || null;
    }

    getAll() {
        return [...this.obituaries];
    }

    search(comune = '', searchTerm = '') {
        let results = [...this.obituaries];
        
        // Filtra per comune se specificato
        if (comune) {
            results = results.filter(obit => 
                obit.comune && obit.comune.toLowerCase() === comune.toLowerCase()
            );
        }
        
        // Filtra per termine di ricerca se specificato
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(obit => 
                obit.nome.toLowerCase().includes(term) ||
                (obit.testo && obit.testo.toLowerCase().includes(term))
            );
        }
        
        return results;
    }

    getObituaryLink(obituary) {
        // Sempre usa la pagina dinamica per consistenza
        const link = `necrologio-detail.html?id=${encodeURIComponent(obituary.id)}`;
        
        // Debug: verifica che l'ID esista davvero
        const exists = this.getById(obituary.id);
        if (!exists) {
            console.warn(`⚠️ Generando link per ID inesistente: ${obituary.id}`);
        }
        
        return link;
    }
    
    // Metodo per validare tutti i link generati
    validateAllLinks() {
        console.log('🔍 Validando tutti i link dei necrologi...');
        
        const invalidLinks = [];
        this.obituaries.forEach(obituary => {
            const testLookup = this.getById(obituary.id);
            if (!testLookup) {
                invalidLinks.push({
                    id: obituary.id,
                    nome: obituary.nome,
                    source: obituary.source
                });
            }
        });
        
        if (invalidLinks.length > 0) {
            console.warn('⚠️ Trovati link potenzialmente problematici:', invalidLinks);
        } else {
            console.log('✅ Tutti i link sono validi');
        }
        
        return invalidLinks;
    }

    updateDisplays() {
        // Aggiorna eventuali display nella pagina
        const event = new CustomEvent('obituariesLoaded', { detail: this.obituaries });
        document.dispatchEvent(event);
    }

    loadDefaultObituaries() {
        // Fallback con dati predefiniti se necessario
        console.log('📋 Caricando necrologi di fallback...');
        this.obituaries = [
            {
                id: 'fallback_1',
                nome: "Mario Rossi",
                dataNascita: "1950-03-15",
                dataMorte: "2024-01-10",
                eta: 74,
                foto: "images/placeholder-mario.svg",
                photoFile: null,
                manifestoFile: null,
                luogoEsequie: "Chiesa San Giuseppe, Via Roma 45, Nola",
                oraEsequie: "10:00",
                dataEsequie: "2024-01-12",
                testo: "Con profondo dolore annunciamo la scomparsa del caro Mario, padre e nonno esemplare.",
                comune: "Nola",
                condoglianze: [],
                source: 'fallback'
            },
            {
                id: 'fallback_2',
                nome: "Anna Bianchi",
                dataNascita: "1945-07-22",
                dataMorte: "2024-01-08",
                eta: 79,
                foto: "images/placeholder-anna.svg",
                photoFile: null,
                manifestoFile: null,
                luogoEsequie: "Casa Funeraria Santaniello",
                oraEsequie: "15:00",
                dataEsequie: "2024-01-10",
                testo: "Anna ci ha lasciati serenamente, circondata dall'amore della sua famiglia.",
                comune: "Nola",
                condoglianze: [],
                source: 'fallback'
            },
            {
                id: 'fallback_3',
                nome: "Giuseppe Verdi",
                dataNascita: "1940-11-08",
                dataMorte: "2024-01-05",
                eta: 84,
                foto: "images/placeholder-giuseppe.svg",
                photoFile: null,
                manifestoFile: null,
                luogoEsequie: "Chiesa Santa Maria delle Grazie",
                oraEsequie: "11:00",
                dataEsequie: "2024-01-07",
                testo: "Maestro di vita e di lavoro, ha lasciato un segno indelebile in tutti coloro che hanno avuto la fortuna di conoscerlo.",
                comune: "Torre del Greco",
                condoglianze: [],
                source: 'fallback'
            }
        ];
        console.log('📋 Caricati 3 necrologi di fallback');
    }
}

// Mobile menu functionality
class MobileMenu {
    constructor() {
        this.menuBtn = document.getElementById('mobile-menu-btn');
        this.menu = document.getElementById('mobile-menu');
        this.init();
    }

    init() {
        if (this.menuBtn && this.menu) {
            this.menuBtn.addEventListener('click', () => this.toggle());
        }
    }

    toggle() {
        this.menu.classList.toggle('hidden');
        const icon = this.menuBtn.querySelector('i');
        if (this.menu.classList.contains('hidden')) {
            icon.className = 'fas fa-bars text-xl';
        } else {
            icon.className = 'fas fa-times text-xl';
        }
    }

    close() {
        this.menu.classList.add('hidden');
        const icon = this.menuBtn.querySelector('i');
        icon.className = 'fas fa-bars text-xl';
    }
}



// Products data and functionality
class ProductsManager {
    constructor() {
        this.products = [
            {
                id: 1,
                nome: "Pacchetto Colazione",
                categoria: "oggetti",
                prezzo: 30,
                immagine: "images/product_images/pacchetto_colazione.png",
                descrizione: "10 cornetti + 10 caffè + 5 latte"
            },
            {
                id: 2,
                nome: "Manifesto Commemorativo",
                categoria: "oggetti",
                prezzo: 50,
                immagine: "images/product_images/manifesto_commemorativo.svg",
                descrizione: "Un manifesto per omaggiare il defunto"
            },
            {
                id: 3,
                nome: "Cuscino di Fiori Misti",
                categoria: "cuscini",
                prezzo: 65,
                immagine: "images/product_images/cuscino_fiori_misti.jpeg",
                descrizione: "Composizione floreale a forma di cuscino con fiori di stagione."
            },
            {
                id: 4,
                nome: "Candela Commemorativa",
                categoria: "oggetti",
                prezzo: 25,
                immagine: "images/product_images/candela_funebre.png",
                descrizione: "Candela profumata con incisione personalizzabile per ricordare i propri cari."
            },
            {
                id: 5,
                nome: "Bouquet di Fiori",
                categoria: "bouquet",
                prezzo: 30,
                immagine: "images/product_images/bouquet_di_fiori.jpeg",
                descrizione: "Un elegante bouquet composto di fiori"
            },
            {
                id: 6,
                nome: "Croce di Orchidee",
                categoria: "croci",
                prezzo: 100,
                immagine: "images/product_images/croce_di_orchidee.jpeg",
                descrizione: "Composizione a forma di croce realizzata con orchidee bianche."
            }
        ];
    }

    getAll() {
        return this.products;
    }

    getById(id) {
        return this.products.find(product => product.id === parseInt(id));
    }

    getByCategory(category) {
        if (!category) return this.products;
        return this.products.filter(product => product.categoria === category);
    }

    getCategories() {
        const categories = [...new Set(this.products.map(p => p.categoria))];
        return categories.map(cat => ({
            value: cat,
            label: this.getCategoryLabel(cat)
        }));
    }

    getCategoryLabel(category) {
        const labels = {
            'corone': 'Corone',
            'bouquet': 'Bouquet',
            'cuscini': 'Cuscini',
            'croci': 'Croci',
            'oggetti': 'Oggetti Commemorativi'
        };
        return labels[category] || category;
    }
}

// Form validation and submission
class FormHandler {
    constructor() {
        this.init();
    }

    init() {
        // Contact form
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactForm(e));
        }

        // Condolence form
        const condolenceForm = document.getElementById('condolence-form');
        if (condolenceForm) {
            condolenceForm.addEventListener('submit', (e) => this.handleCondolenceForm(e));
        }

        // Product order form
        const orderForm = document.getElementById('order-form');
        if (orderForm) {
            orderForm.addEventListener('submit', (e) => this.handleOrderForm(e));
        }
    }

    validateForm(formData, rules) {
        const errors = {};

        for (const [field, rule] of Object.entries(rules)) {
            const value = formData.get(field);
            
            if (rule.required && (!value || value.trim() === '')) {
                errors[field] = 'Questo campo è obbligatorio';
                continue;
            }

            if (value && rule.email && !Utils.validateEmail(value)) {
                errors[field] = 'Inserisci un indirizzo email valido';
            }

            if (value && rule.phone && !Utils.validatePhone(value)) {
                errors[field] = 'Inserisci un numero di telefono valido';
            }

            if (value && rule.minLength && value.length < rule.minLength) {
                errors[field] = `Minimo ${rule.minLength} caratteri`;
            }
        }

        return errors;
    }

    showFieldErrors(errors) {
        // Clear previous errors
        document.querySelectorAll('.field-error').forEach(el => el.remove());

        for (const [field, message] of Object.entries(errors)) {
            const fieldElement = document.querySelector(`[name="${field}"]`);
            if (fieldElement) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'field-error text-red-500 text-sm mt-1';
                errorDiv.textContent = message;
                fieldElement.parentNode.appendChild(errorDiv);
                fieldElement.classList.add('border-red-500');
            }
        }
    }

    clearFieldErrors() {
        document.querySelectorAll('.field-error').forEach(el => el.remove());
        document.querySelectorAll('.border-red-500').forEach(el => {
            el.classList.remove('border-red-500');
        });
    }

    handleContactForm(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const rules = {
            nome: { required: true, minLength: 2 },
            email: { required: true, email: true },
            telefono: { phone: true },
            messaggio: { required: true, minLength: 10 }
        };

        const errors = this.validateForm(formData, rules);
        
        if (Object.keys(errors).length > 0) {
            this.showFieldErrors(errors);
            return;
        }

        this.clearFieldErrors();
        
        // Simulate form submission
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Invio in corso...';
        submitBtn.disabled = true;

        setTimeout(() => {
            Utils.showNotification('Messaggio inviato con successo. Ti contatteremo presto.', 'success');
            e.target.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 1500);
    }

    handleCondolenceForm(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const rules = {
            nome: { required: true, minLength: 2 },
            email: { required: true, email: true },
            messaggio: { required: true, minLength: 5 }
        };

        const errors = this.validateForm(formData, rules);
        
        if (Object.keys(errors).length > 0) {
            this.showFieldErrors(errors);
            return;
        }

        this.clearFieldErrors();

        // Add condolence to obituary
        const obituaryId = window.location.pathname.split('/').pop().replace('.html', '').replace('necrologio-', '');
        const obituariesManager = new ObituariesManager();
        
        const condolence = {
            nome: formData.get('nome'),
            email: formData.get('email'),
            messaggio: formData.get('messaggio')
        };

        if (obituariesManager.addCondolence(parseInt(obituaryId), condolence)) {
            Utils.showNotification('Condoglianze inviate con successo.', 'success');
            e.target.reset();
            // Refresh condolences display if on obituary page
            if (typeof displayCondolences === 'function') {
                displayCondolences(parseInt(obituaryId));
            }
        } else {
            Utils.showNotification('Errore nell\'invio delle condoglianze.', 'error');
        }
    }

    handleOrderForm(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const rules = {
            nome: { required: true, minLength: 2 },
            email: { required: true, email: true },
            telefono: { required: true, phone: true },
            indirizzo: { required: true, minLength: 10 }
        };

        const errors = this.validateForm(formData, rules);
        
        if (Object.keys(errors).length > 0) {
            this.showFieldErrors(errors);
            return;
        }

        this.clearFieldErrors();

        // Simulate order processing
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Elaborazione...';
        submitBtn.disabled = true;

        setTimeout(() => {
            Utils.showNotification('Ordine ricevuto con successo. Ti contatteremo per la conferma.', 'success');
            e.target.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            // Redirect to confirmation page or close modal
            if (document.getElementById('order-modal')) {
                closeOrderModal();
            }
        }, 2000);
    }
}

// Search functionality
class SearchManager {
    constructor() {
        this.init();
    }

    init() {
        const searchInput = document.getElementById('search-input');
        const comuneSelect = document.getElementById('comune-select');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => this.performSearch());
        }
        
        if (comuneSelect) {
            comuneSelect.addEventListener('change', () => this.performSearch());
        }
    }

    performSearch() {
        const searchTerm = document.getElementById('search-input')?.value || '';
        const comune = document.getElementById('comune-select')?.value || '';
        
        const obituariesManager = new ObituariesManager();
        const results = obituariesManager.search(comune, searchTerm);
        
        if (typeof displayObituaries === 'function') {
            displayObituaries(results);
        }
    }
}

// Gallery functionality
class Gallery {
    constructor() {
        this.currentIndex = 0;
        this.images = [];
        this.init();
    }

    init() {
        document.querySelectorAll('.gallery-img').forEach((img, index) => {
            img.addEventListener('click', () => this.openModal(index));
            this.images.push(img.src);
        });
    }

    openModal(index) {
        this.currentIndex = index;
        const modal = this.createModal();
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        this.updateModalContent();

        // Close on escape key
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="modal-content relative max-w-4xl max-h-full p-4">
                <button class="absolute top-4 right-4 text-white text-2xl z-10 hover:text-gray-600" onclick="this.closest('.modal').remove(); document.body.style.overflow = 'auto';">
                    <i class="fas fa-times"></i>
                </button>
                <button class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-2xl hover:text-gray-600" onclick="window.gallery.prev()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl hover:text-gray-600" onclick="window.gallery.next()">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <img id="modal-image" class="max-w-full max-h-full object-contain" alt="Gallery image">
                <div class="text-center mt-4 text-white">
                    <span id="image-counter"></span>
                </div>
            </div>
        `;
        return modal;
    }

    updateModalContent() {
        const modalImage = document.getElementById('modal-image');
        const imageCounter = document.getElementById('image-counter');
        
        if (modalImage && imageCounter) {
            modalImage.src = this.images[this.currentIndex];
            imageCounter.textContent = `${this.currentIndex + 1} di ${this.images.length}`;
        }
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.updateModalContent();
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.updateModalContent();
    }

    handleKeydown(e) {
        const modal = document.querySelector('.modal');
        if (!modal) return;

        switch(e.key) {
            case 'Escape':
                modal.remove();
                document.body.style.overflow = 'auto';
                document.removeEventListener('keydown', this.handleKeydown.bind(this));
                break;
            case 'ArrowLeft':
                this.prev();
                break;
            case 'ArrowRight':
                this.next();
                break;
        }
    }
}

// Global functions for modal management
function openOrderModal(productId) {
    const productsManager = new ProductsManager();
    const product = productsManager.getById(productId);
    
    if (!product) return;

    const modal = document.createElement('div');
    modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'order-modal';
    
    modal.innerHTML = `
        <div class="modal-content bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-gray-800">Ordina: ${product.nome}</h3>
                <button onclick="closeOrderModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="mb-4">
                <img src="${product.immagine}" alt="${product.nome}" class="w-full h-32 object-cover rounded">
                <p class="text-2xl font-bold text-gray-600 mt-2">€${product.prezzo}</p>
            </div>
            
            <form id="order-form">
                <input type="hidden" name="prodotto_id" value="${product.id}">
                <input type="hidden" name="prodotto_nome" value="${product.nome}">
                <input type="hidden" name="prezzo" value="${product.prezzo}">
                
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-800 mb-2">Nome Completo *</label>
                    <input type="text" name="nome" required class="form-input w-full p-3 border border-gray-300 rounded-lg">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-800 mb-2">Email *</label>
                    <input type="email" name="email" required class="form-input w-full p-3 border border-gray-300 rounded-lg">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-800 mb-2">Telefono *</label>
                    <input type="tel" name="telefono" required class="form-input w-full p-3 border border-gray-300 rounded-lg">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-800 mb-2">Indirizzo di Consegna *</label>
                    <textarea name="indirizzo" required rows="3" class="form-input w-full p-3 border border-gray-300 rounded-lg"></textarea>
                </div>
                
                <div class="mb-6">
                    <label class="block text-sm font-semibold text-gray-800 mb-2">Messaggio (opzionale)</label>
                    <textarea name="messaggio" rows="3" class="form-input w-full p-3 border border-gray-300 rounded-lg" placeholder="Messaggio per il biglietto o istruzioni speciali"></textarea>
                </div>
                
                <button type="submit" class="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-gray-800 font-semibold py-3 rounded-lg hover:from-gray-500 hover:to-gray-600 transition-colors">
                    Conferma Ordine - €${product.prezzo}
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Piccolo delay per assicurarsi che tutti gli script siano caricati
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Initialize mobile menu
    new MobileMenu();
    
    // Initialize form handler
    new FormHandler();
    
    // Initialize search if on obituaries page
    if (window.location.pathname.includes('necrologi')) {
        new SearchManager();
    }
    
    // Initialize gallery if gallery images exist
    if (document.querySelectorAll('.gallery-img').length > 0) {
        window.gallery = new Gallery();
    }
    
    // Load recent obituaries on homepage
    if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
        loadRecentObituaries();
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Load recent obituaries for homepage
async function loadRecentObituaries() {
    const container = document.getElementById('recent-obituaries');
    if (!container) {
        console.warn('❌ Container #recent-obituaries non trovato');
        return;
    }

    console.log('📋 Inizializzo ObituariesManager...');
    // Crea o usa l'istanza globale
    const obituariesManager = window.globalObituariesManager || new ObituariesManager();
    if (!window.globalObituariesManager) {
        window.globalObituariesManager = obituariesManager;
    }
    
    Utils.showLoading(container);
    
    // Carica i dati esplicitamente
    console.log('🔄 Caricando dati necrologi...');
    await obituariesManager.loadObituaries();
    
    // Aspetta che i dati siano caricati
    let attempts = 0;
    const maxAttempts = 30; // 3 secondi max
    
    const checkData = () => {
        attempts++;
        console.log(`🔍 Tentativo ${attempts}: Necrologi disponibili: ${obituariesManager.obituaries.length}`);
        
        if (obituariesManager.obituaries.length > 0 || attempts >= maxAttempts) {
            const recentObituaries = obituariesManager.getRecent(3);
            console.log(`🎯 Mostrando ${recentObituaries.length} necrologi recenti`);
            
            container.innerHTML = recentObituaries.map(obituary => `
            <div class="necrologio-card bg-white rounded-lg shadow p-6">
                <div class="flex items-start space-x-4">
                    <img src="${obituariesManager.getObituaryPhoto(obituary)}" 
                         alt="${obituary.nome}" 
                         class="w-16 h-20 object-cover rounded"
                         onerror="this.src='images/placeholder-small.svg'; console.warn('❌ Errore caricamento immagine homepage:', this.src);"
                         onload="console.log('✅ Immagine homepage caricata:', this.src);">
                    <div class="flex-1">
                        <h3 class="font-bold text-gray-800 text-lg mb-2">${obituary.nome}</h3>
                        <p class="text-sm text-gray-600 mb-1">
                            <i class="fas fa-calendar mr-1"></i>
                            ${Utils.formatDate(obituary.dataNascita)} - ${Utils.formatDate(obituary.dataMorte)}
                        </p>
                        <p class="text-sm text-gray-600 mb-3">
                            <i class="fas fa-map-marker-alt mr-1"></i>
                            ${obituary.comune}
                        </p>
                        ${obituary.testo ? `<p class="text-sm text-gray-700 line-clamp-2">${obituary.testo}</p>` : '<p class="text-sm text-gray-500 italic">Nessun testo commemorativo</p>'}
                        ${obituary.manifestoFile ? '<p class="text-sm text-blue-600 mt-2"><i class="fas fa-eye mr-1"></i>Manifesto visualizzabile</p>' : ''}
                        <a href="${new ObituariesManager().getObituaryLink(obituary)}" class="inline-block mt-3 text-gray-600 hover:text-gray-500 font-semibold text-sm">
                            Leggi tutto →
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
            
            if (recentObituaries.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <i class="fas fa-info-circle text-4xl text-gray-400 mb-4"></i>
                        <p class="text-gray-600">Nessun necrologio disponibile al momento.</p>
                    </div>
                `;
            }
        } else {
            // Riprova dopo 100ms
            setTimeout(checkData, 100);
        }
    };
    
    // Inizia il controllo
    checkData();
}