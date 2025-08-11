// JavaScript for obituaries page

class ObituariesPage {
    constructor() {
        this.obituariesManager = new ObituariesManager();
        this.currentPage = 1;
        this.itemsPerPage = 6;
        this.currentResults = [];
        this.init();
    }

    init() {
        this.loadObituaries();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('search-input');
        const comuneSelect = document.getElementById('comune-select');

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.currentPage = 1;
                this.performSearch();
            });
        }

        if (comuneSelect) {
            comuneSelect.addEventListener('change', () => {
                this.currentPage = 1;
                this.performSearch();
            });
        }
    }

    loadObituaries() {
        this.showLoading();
        
        setTimeout(() => {
            this.currentResults = this.obituariesManager.getAll();
            this.displayResults();
        }, 1000);
    }

    performSearch() {
        const searchTerm = document.getElementById('search-input')?.value || '';
        const comune = document.getElementById('comune-select')?.value || '';

        this.showLoading();

        setTimeout(() => {
            this.currentResults = this.obituariesManager.search(comune, searchTerm);
            this.displayResults();
        }, 500);
    }

    showLoading() {
        document.getElementById('loading-state').classList.remove('hidden');
        document.getElementById('obituaries-list').classList.add('hidden');
        document.getElementById('no-results').classList.add('hidden');
    }

    displayResults() {
        document.getElementById('loading-state').classList.add('hidden');

        if (this.currentResults.length === 0) {
            document.getElementById('no-results').classList.remove('hidden');
            document.getElementById('obituaries-list').classList.add('hidden');
            return;
        }

        document.getElementById('no-results').classList.add('hidden');
        document.getElementById('obituaries-list').classList.remove('hidden');

        // Update count
        document.getElementById('obituaries-count').textContent = this.currentResults.length;

        // Calculate pagination
        const totalPages = Math.ceil(this.currentResults.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedResults = this.currentResults.slice(startIndex, endIndex);

        // Display obituaries
        this.displayObituaries(paginatedResults);

        // Display pagination
        this.displayPagination(totalPages);
    }

    displayObituaries(obituaries) {
        const grid = document.getElementById('obituaries-grid');
        
        grid.innerHTML = obituaries.map(obituary => `
            <article class="necrologio-card bg-white rounded-lg shadow-lg overflow-hidden">
                <div class="p-6">
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0">
                            <img src="${this.getObituaryPhoto(obituary)}" alt="${obituary.nome}" class="w-20 h-24 object-cover rounded-lg">
                        </div>
                        
                        <div class="flex-1 min-w-0">
                            <h2 class="text-xl font-bold text-funeral-dark mb-2">${obituary.nome}</h2>
                            
                            <div class="space-y-1 text-sm text-gray-600 mb-3">
                                <p>
                                    <i class="fas fa-calendar text-funeral-gold mr-2"></i>
                                    <span class="font-medium">Nato:</span> ${this.formatDate(obituary.dataNascita)}
                                </p>
                                <p>
                                    <i class="fas fa-heart text-funeral-gold mr-2"></i>
                                    <span class="font-medium">Morto:</span> ${this.formatDate(obituary.dataMorte)}
                                </p>
                                <p>
                                    <i class="fas fa-map-marker-alt text-funeral-gold mr-2"></i>
                                    <span class="font-medium">Comune:</span> ${obituary.comune}
                                </p>
                            </div>
                            
                            ${obituary.testo ? `<p class="text-gray-700 text-sm line-clamp-3 mb-4">${obituary.testo}</p>` : '<p class="text-sm text-gray-500 italic mb-4">Nessun testo commemorativo</p>'}
                            ${obituary.manifestoFile ? '<p class="text-sm text-blue-600 mb-2"><i class="fas fa-eye mr-1"></i>Manifesto visualizzabile</p>' : ''}
                        </div>
                    </div>
                    
                    <div class="border-t pt-4 mt-4">
                        <div class="flex items-center justify-between">
                            <div class="text-sm text-gray-600">
                                <p>
                                    <i class="fas fa-church text-funeral-gold mr-1"></i>
                                    Esequie: ${this.formatDate(obituary.dataEsequie)} ore ${obituary.oraEsequie}
                                </p>
                                <p class="mt-1 text-xs text-gray-500">${obituary.luogoEsequie}</p>
                            </div>
                            
                            <div class="flex space-x-2">
                                <a 
                                    href="${this.getObituaryLink(obituary)}" 
                                    class="bg-funeral-gold text-funeral-dark px-4 py-2 rounded text-sm font-semibold hover:bg-yellow-400 transition-colors"
                                >
                                    <i class="fas fa-eye mr-1"></i>
                                    Dettagli
                                </a>
                                <button 
                                    onclick="openCondolenceForm('${this.getCleanId(obituary.id)}')" 
                                    class="bg-funeral-blue text-white px-4 py-2 rounded text-sm font-semibold hover:bg-funeral-gold hover:text-funeral-dark transition-colors"
                                >
                                    <i class="fas fa-heart mr-1"></i>
                                    Condoglianze
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        `).join('');
    }

    displayPagination(totalPages) {
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <button 
                ${this.currentPage <= 1 ? 'disabled' : ''} 
                onclick="obituariesPage.changePage(${this.currentPage - 1})"
                class="pagination-btn"
            >
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            paginationHTML += `<button onclick="obituariesPage.changePage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="px-2">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button 
                    onclick="obituariesPage.changePage(${i})"
                    ${i === this.currentPage ? 'class="active"' : ''}
                >
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="px-2">...</span>`;
            }
            paginationHTML += `<button onclick="obituariesPage.changePage(${totalPages})">${totalPages}</button>`;
        }

        // Next button
        paginationHTML += `
            <button 
                ${this.currentPage >= totalPages ? 'disabled' : ''} 
                onclick="obituariesPage.changePage(${this.currentPage + 1})"
                class="pagination-btn"
            >
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        pagination.innerHTML = paginationHTML;
    }

    changePage(page) {
        const totalPages = Math.ceil(this.currentResults.length / this.itemsPerPage);
        
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.displayResults();
        
        // Scroll to top of results
        document.getElementById('obituaries-container').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    // Get clean ID for file links (removes prefixes like json_, admin_)
    getCleanId(id) {
        if (typeof id === 'string') {
            // Remove prefixes like 'json_', 'admin_', etc.
            return id.replace(/^(json_|admin_|firebase_)/, '');
        }
        return id;
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
}

// Condolence form modal
function openCondolenceForm(obituaryId) {
    const obituariesManager = new ObituariesManager();
    // Clean the ID to handle prefixed IDs
    const cleanId = typeof obituaryId === 'string' ? obituaryId.replace(/^(json_|admin_|firebase_)/, '') : obituaryId;
    const obituary = obituariesManager.getById(cleanId);
    
    if (!obituary) return;

    const modal = document.createElement('div');
    modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'condolence-modal';
    
    modal.innerHTML = `
        <div class="modal-content bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-funeral-dark">Condoglianze per ${obituary.nome}</h3>
                <button onclick="closeCondolenceModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="mb-6">
                <div class="flex items-center space-x-3">
                                            <img src="${this.getObituaryPhoto(obituary)}" alt="${obituary.nome}" class="w-12 h-15 object-cover rounded">
                    <div>
                        <p class="font-semibold text-funeral-dark">${obituary.nome}</p>
                        <p class="text-sm text-gray-600">${Utils.formatDate(obituary.dataNascita)} - ${Utils.formatDate(obituary.dataMorte)}</p>
                    </div>
                </div>
            </div>
            
            <form id="condolence-form">
                <input type="hidden" name="obituary_id" value="${obituary.id}">
                
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-funeral-dark mb-2">Nome Completo *</label>
                    <input type="text" name="nome" required class="form-input w-full p-3 border border-gray-300 rounded-lg">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-funeral-dark mb-2">Email *</label>
                    <input type="email" name="email" required class="form-input w-full p-3 border border-gray-300 rounded-lg">
                </div>
                
                <div class="mb-6">
                    <label class="block text-sm font-semibold text-funeral-dark mb-2">Messaggio di Condoglianze *</label>
                    <textarea name="messaggio" required rows="4" class="form-input w-full p-3 border border-gray-300 rounded-lg" placeholder="Scrivi qui il tuo messaggio di cordoglio..."></textarea>
                </div>
                
                <div class="flex space-x-3">
                    <button type="button" onclick="closeCondolenceModal()" class="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors">
                        Annulla
                    </button>
                    <button type="submit" class="flex-1 bg-funeral-gold text-funeral-dark py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors">
                        Invia Condoglianze
                    </button>
                </div>
                
                <p class="text-xs text-gray-500 mt-3 text-center">
                    <i class="fas fa-lock mr-1"></i>
                    Le tue informazioni sono trattate con la massima riservatezza
                </p>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function closeCondolenceModal() {
    const modal = document.getElementById('condolence-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Clear filters function
function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('comune-select').value = '';
    obituariesPage.currentPage = 1;
    obituariesPage.loadObituaries();
}

// Initialize obituaries page
let obituariesPage;

document.addEventListener('DOMContentLoaded', function() {
    obituariesPage = new ObituariesPage();
});