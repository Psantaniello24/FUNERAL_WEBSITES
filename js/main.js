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

// Obituaries data and functionality  
class ObituariesManager {
    constructor() {
        this.obituaries = [];
        this.loadObituaries();
    }

    // 🔥 Carica necrologi con priorità: Firebase > JSON > localStorage > fallback
    async loadObituaries() {
        let firebaseObituaries = [];
        let jsonObituaries = [];
        let adminObituaries = [];

        try {
            // 🔥 PRIORITÀ 1: Carica da Firebase (produzione)
            if (window.firebaseManager && window.firebaseManager.isInitialized) {
                console.log('🔥 Caricamento da Firebase...');
                const firebaseData = await window.firebaseManager.loadObituaries();
                
                firebaseObituaries = firebaseData.map(obit => ({
                    id: obit.id,
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
                    source: 'firebase'
                }));
            }

            // 📄 PRIORITÀ 2: Carica da file JSON (backup/sviluppo)
            try {
                const response = await fetch('data/necrologi.json');
                const data = await response.json();
                
                jsonObituaries = (data.obituaries || []).map(obit => ({
                    id: `json_${obit.id}`, // Prefisso per evitare conflitti
                    nome: obit.name,
                    dataNascita: obit.birthDate,
                    dataMorte: obit.deathDate,
                    eta: obit.age,
                    foto: obit.photo,
                    photoFile: null, // JSON non ha photoFile
                    manifestoFile: null, // JSON non ha manifestoFile
                    luogoEsequie: obit.funeralLocation,
                    oraEsequie: obit.funeralDate ? new Date(obit.funeralDate).toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'}) : "10:00",
                    dataEsequie: obit.funeralDate ? obit.funeralDate.split('T')[0] : obit.deathDate,
                    testo: obit.description,
                    comune: obit.city,
                    condoglianze: [],
                    source: 'json'
                }));
            } catch (jsonError) {
                console.warn('⚠️ File JSON non disponibile:', jsonError.message);
            }
            
            // 💾 PRIORITÀ 3: Carica da localStorage admin (temporaneo)
            const adminData = JSON.parse(localStorage.getItem('adminObituaries') || '[]');
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

            // 🔄 Combina tutte le fonti (Firebase ha priorità)
            this.obituaries = [
                ...firebaseObituaries,
                ...jsonObituaries,
                ...adminObituaries
            ];

            // 📊 Log risultati
            const sources = {
                firebase: firebaseObituaries.length,
                json: jsonObituaries.length,
                admin: adminObituaries.length
            };
            
            console.log(`✅ Caricati ${this.obituaries.length} necrologi:`, sources);
            
            // Se non ci sono necrologi, usa fallback
            if (this.obituaries.length === 0) {
                console.log('📋 Nessun necrologio trovato, uso dati predefiniti');
                this.loadDefaultObituaries();
            }

            // Aggiorna le visualizzazioni
            this.updateDisplays();
            
        } catch (error) {
            console.error('❌ Errore caricamento necrologi:', error);
            this.loadDefaultObituaries();
        }
    }

    // 🔥 Salva necrologio su Firebase
    async saveToFirebase(obituaryData) {
        if (!window.firebaseManager || !window.firebaseManager.isInitialized) {
            throw new Error('Firebase non disponibile');
        }

        try {
            const result = await window.firebaseManager.saveObituary(obituaryData);
            
            // Ricarica i dati per sincronizzare
            await this.loadObituaries();
            
            return result;
        } catch (error) {
            console.error('❌ Errore salvataggio Firebase:', error);
            throw error;
        }
    }

    // Dati predefiniti come fallback
    loadDefaultObituaries() {
        this.obituaries = [
            {
                id: 1,
                nome: "Mario Rossi",
                dataNascita: "1945-03-15",
                dataMorte: "2024-01-15",
                foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=face",
                luogoEsequie: "Chiesa San Giuseppe, Via Roma 45, Nola",
                oraEsequie: "10:00",
                dataEsequie: "2024-01-18",
                testo: "Ci ha lasciati serenamente circondato dall'affetto dei suoi cari. Marito devoto, padre amorevole e nonno premuroso, sarà sempre nei nostri cuori.",
                comune: "Nola",
                condoglianze: []
            },
            {
                id: 2,
                nome: "Anna Bianchi",
                dataNascita: "1952-07-22",
                dataMorte: "2024-01-14",
                foto: "https://images.unsplash.com/photo-1544725121-be3bf52e2dc8?w=300&h=400&fit=crop&crop=face",
                luogoEsequie: "Chiesa Santa Maria, Piazza del Duomo 12, Nola",
                oraEsequie: "15:30",
                dataEsequie: "2024-01-17",
                testo: "Una donna di grande fede e generosità, ha dedicato la sua vita alla famiglia e al prossimo. Il suo sorriso e la sua bontà rimarranno per sempre con noi.",
                comune: "Nola",
                condoglianze: []
            },
            {
                id: 3,
                nome: "Giuseppe Verdi",
                dataNascita: "1940-11-08",
                dataMorte: "2024-01-13",
                foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=400&fit=crop&crop=face",
                luogoEsequie: "Chiesa San Francesco, Via Nazionale 78, Caserta",
                oraEsequie: "11:00",
                dataEsequie: "2024-01-16",
                testo: "Maestro di vita e di lavoro, ha lasciato un segno indelebile in tutti coloro che hanno avuto la fortuna di conoscerlo. Riposa in pace.",
                comune: "Caserta",
                condoglianze: []
            }
        ];
        this.updateDisplays();
    }

    // Aggiorna le visualizzazioni quando i dati cambiano
    updateDisplays() {
        // Se siamo nella homepage, aggiorna necrologi recenti
        if (document.getElementById('recent-obituaries')) {
            this.displayRecentObituaries(3);
        }
        
        // Se siamo nella pagina necrologi, aggiorna la lista
        if (window.necrologiManager && typeof window.necrologiManager.displayObituaries === 'function') {
            window.necrologiManager.displayObituaries();
        }
    }

    // Display recent obituaries on homepage
    displayRecentObituaries(limit = 3) {
        const container = document.getElementById('recent-obituaries');
        if (!container) return;

        const recentObituaries = this.getRecent(limit);
        
        Utils.showLoading(container);
        
        setTimeout(() => {
            container.innerHTML = recentObituaries.map(obituary => `
                <div class="necrologio-card bg-white rounded-lg shadow p-6">
                    <div class="flex items-start space-x-4">
                        <img src="${this.getObituaryPhoto(obituary)}" alt="${obituary.nome}" class="w-16 h-20 object-cover rounded">
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
                            <a href="${this.getObituaryLink(obituary)}" class="inline-block mt-3 text-gray-600 hover:text-gray-500 font-semibold text-sm">
                                Leggi tutto →
                            </a>
                        </div>
                    </div>
                </div>
            `).join('');
        }, 800);
    }

    // Get clean ID for file links (removes prefixes like json_, admin_)
    getCleanId(id) {
        if (typeof id === 'string') {
            // Remove prefixes like 'json_', 'admin_', etc.
            return id.replace(/^(json_|admin_|firebase_)/, '');
        }
        return id;
    }

    // Generate the correct link for an obituary
    getObituaryLink(obituary) {
        const cleanId = this.getCleanId(obituary.id);
        
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

    getAll() {
        return this.obituaries;
    }

    getById(id) {
        // Handle both string and numeric IDs
        const numericId = parseInt(id);
        const stringId = id.toString();
        
        return this.obituaries.find(obit => {
            const obituaryId = obit.id.toString();
            const cleanObituaryId = this.getCleanId(obit.id).toString();
            
            return obituaryId === stringId || 
                   cleanObituaryId === stringId || 
                   obit.id === numericId ||
                   parseInt(cleanObituaryId) === numericId;
        });
    }

    getRecent(limit = 3) {
        return this.obituaries
            .sort((a, b) => new Date(b.dataMorte) - new Date(a.dataMorte))
            .slice(0, limit);
    }

    // 📸 Ottiene la foto corretta per un necrologio (photoFile -> foto -> placeholder)
    getObituaryPhoto(obituary) {
        // Priorità: photoFile -> foto/photo -> placeholder
        if (obituary.photoFile && obituary.photoFile.data) {
            return obituary.photoFile.data; // Base64 data
        } else if (obituary.foto || obituary.photo) {
            return obituary.foto || obituary.photo; // URL
        } else {
            return 'images/placeholder-small.svg'; // Placeholder
        }
    }

    filterByComune(comune) {
        if (!comune) return this.obituaries;
        return this.obituaries.filter(obit => 
            obit.comune.toLowerCase().includes(comune.toLowerCase())
        );
    }

    filterByName(name) {
        if (!name) return this.obituaries;
        return this.obituaries.filter(obit => 
            obit.nome.toLowerCase().includes(name.toLowerCase())
        );
    }

    search(comune, name) {
        let results = this.obituaries;
        
        if (comune) {
            results = results.filter(obit => 
                obit.comune.toLowerCase().includes(comune.toLowerCase())
            );
        }
        
        if (name) {
            results = results.filter(obit => 
                obit.nome.toLowerCase().includes(name.toLowerCase())
            );
        }
        
        return results;
    }

    addCondolence(obituaryId, condolence) {
        const obituary = this.getById(obituaryId);
        if (obituary) {
            obituary.condoglianze.push({
                ...condolence,
                data: new Date().toISOString(),
                id: Date.now()
            });
            return true;
        }
        return false;
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
document.addEventListener('DOMContentLoaded', function() {
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
function loadRecentObituaries() {
    const container = document.getElementById('recent-obituaries');
    if (!container) return;

    const obituariesManager = new ObituariesManager();
    const recentObituaries = obituariesManager.getRecent(3);
    
    Utils.showLoading(container);
    
    setTimeout(() => {
        container.innerHTML = recentObituaries.map(obituary => `
            <div class="necrologio-card bg-white rounded-lg shadow p-6">
                <div class="flex items-start space-x-4">
                    <img src="${obituariesManager.getObituaryPhoto(obituary)}" alt="${obituary.nome}" class="w-16 h-20 object-cover rounded">
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
    }, 800);
}