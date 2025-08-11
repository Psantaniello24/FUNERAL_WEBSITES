// JavaScript for flowers and gifts page

class FlowersPage {
    constructor() {
        this.productsManager = new ProductsManager();
        this.currentCategory = '';
        this.currentProducts = [];
        this.sortBy = 'name';
        this.init();
    }

    init() {
        this.loadProducts();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.displayProducts();
            });
        }
    }

    loadProducts() {
        this.showLoading();
        
        setTimeout(() => {
            this.currentProducts = this.productsManager.getAll();
            this.hideLoading();
            this.displayProducts();
        }, 800);
    }

    filterByCategory(category) {
        this.currentCategory = category;
        this.showLoading();
        
        setTimeout(() => {
            this.currentProducts = this.productsManager.getByCategory(category);
            this.hideLoading();
            this.displayProducts();
            this.updateCategoryButtons();
        }, 500);
    }

    updateCategoryButtons() {
        const buttons = document.querySelectorAll('.category-btn');
        
        buttons.forEach(btn => {
            const btnCategory = btn.getAttribute('data-category');
            if (btnCategory === this.currentCategory) {
                btn.className = 'category-btn active bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-full font-semibold hover:from-gray-400 hover:to-gray-500 transition-colors';
            } else {
                btn.className = 'category-btn bg-white border-2 border-gray-600 text-gray-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-600 hover:text-white transition-colors';
            }
        });
    }

    showLoading() {
        document.getElementById('loading-state').classList.remove('hidden');
        document.getElementById('products-info').classList.add('hidden');
        document.getElementById('products-grid').classList.add('hidden');
        document.getElementById('no-results').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loading-state').classList.add('hidden');
    }

    displayProducts() {
        const grid = document.getElementById('products-grid');
        const productsInfo = document.getElementById('products-info');
        const noResults = document.getElementById('no-results');
        const productsCount = document.getElementById('products-count');

        if (this.currentProducts.length === 0) {
            productsInfo.classList.add('hidden');
            grid.classList.add('hidden');
            noResults.classList.remove('hidden');
            return;
        }

        // Sort products
        const sortedProducts = this.sortProducts([...this.currentProducts]);

        // Update count
        productsCount.textContent = sortedProducts.length;
        productsInfo.classList.remove('hidden');

        // Display products
        grid.innerHTML = sortedProducts.map(product => this.createProductCard(product)).join('');
        grid.classList.remove('hidden');
        noResults.classList.add('hidden');
    }

    sortProducts(products) {
        switch (this.sortBy) {
            case 'price-low':
                return products.sort((a, b) => a.prezzo - b.prezzo);
            case 'price-high':
                return products.sort((a, b) => b.prezzo - a.prezzo);
            case 'name':
            default:
                return products.sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
        }
    }

    createProductCard(product) {
        return `
            <div class="product-card bg-white rounded-lg shadow-lg overflow-hidden">
                <div class="relative">
                    <img src="${product.immagine}" alt="${product.nome}" class="w-full h-64 object-cover">
                    <div class="absolute top-4 right-4">
                        <span class="bg-funeral-gold text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                            ${this.getCategoryLabel(product.categoria)}
                        </span>
                    </div>
                </div>
                
                <div class="p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${product.nome}</h3>
                    <p class="text-gray-600 text-sm mb-4 line-clamp-3">${product.descrizione}</p>
                    
                    <div class="flex items-center justify-between mb-4">
                        <div class="text-2xl font-bold text-funeral-gold">
                            €${product.prezzo}
                        </div>
                        <div class="flex items-center text-sm text-gray-500">
                            <i class="fas fa-truck mr-1"></i>
                            Consegna inclusa
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <button 
                            onclick="openOrderModal(${product.id})" 
                            class="w-full bg-funeral-gold text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
                        >
                            <i class="fas fa-shopping-cart mr-2"></i>
                            Ordina Ora
                        </button>
                        
                        <button 
                            onclick="showProductDetails(${product.id})" 
                            class="w-full border-2 border-funeral-blue text-funeral-blue py-3 px-4 rounded-lg font-semibold hover:bg-funeral-blue hover:text-white transition-colors"
                        >
                            <i class="fas fa-info-circle mr-2"></i>
                            Dettagli
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getCategoryLabel(category) {
        const labels = {
            'corone': 'Corona',
            'bouquet': 'Bouquet',
            'cuscini': 'Cuscino',
            'croci': 'Croce',
            'oggetti': 'Oggetto'
        };
        return labels[category] || category;
    }
}

// Product details modal
function showProductDetails(productId) {
    const productsManager = new ProductsManager();
    const product = productsManager.getById(productId);
    
    if (!product) return;

    const modal = document.createElement('div');
    modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'product-modal';
    
    modal.innerHTML = `
        <div class="modal-content bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="relative">
                <img src="${product.immagine}" alt="${product.nome}" class="w-full h-64 object-cover">
                <button onclick="closeProductModal()" class="absolute top-4 right-4 bg-black bg-opacity-50 text-white w-10 h-10 rounded-full hover:bg-opacity-70 transition-all">
                    <i class="fas fa-times"></i>
                </button>
                <div class="absolute bottom-4 left-4">
                    <span class="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-full font-semibold">
                        ${flowersPage.getCategoryLabel(product.categoria)}
                    </span>
                </div>
            </div>
            
            <div class="p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">${product.nome}</h2>
                
                <div class="flex items-center justify-between mb-6">
                    <div class="text-3xl font-bold text-gray-700">
                        €${product.prezzo}
                    </div>
                    <div class="text-sm text-gray-500">
                        <i class="fas fa-truck mr-1"></i>
                        Consegna gratuita inclusa
                    </div>
                </div>
                
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">Descrizione</h3>
                    <p class="text-gray-700 leading-relaxed">${product.descrizione}</p>
                </div>
                
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">Caratteristiche</h3>
                    <ul class="space-y-2 text-sm text-gray-600">
                        <li class="flex items-center">
                            <i class="fas fa-check text-green-500 mr-2"></i>
                            Fiori freschi di prima qualità
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-green-500 mr-2"></i>
                            Allestimento professionale
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-green-500 mr-2"></i>
                            Consegna puntuale garantita
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-green-500 mr-2"></i>
                            Possibilità di personalizzazione
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-green-500 mr-2"></i>
                            Biglietto con messaggio incluso
                        </li>
                    </ul>
                </div>
                
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 class="font-semibold text-blue-800 mb-2">
                        <i class="fas fa-info-circle mr-2"></i>
                        Informazioni sulla Consegna
                    </h4>
                    <p class="text-sm text-blue-700">
                        Consegniamo in tutta la provincia di Napoli e zone limitrofe entro 24 ore dall'ordine. 
                        Per consegne urgenti, contattaci telefonicamente al +39 081 8234914.
                    </p>
                </div>
                
                <div class="flex space-x-3">
                    <button 
                        onclick="closeProductModal()" 
                        class="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                    >
                        Chiudi
                    </button>
                    <button 
                        onclick="closeProductModal(); openOrderModal(${product.id});" 
                        class="flex-1 bg-funeral-gold text-gray-800 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
                    >
                        <i class="fas fa-shopping-cart mr-2"></i>
                        Ordina Ora
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Add click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeProductModal();
        }
    });
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Category filter function (global)
function filterByCategory(category) {
    if (window.flowersPage) {
        flowersPage.filterByCategory(category);
    }
}

// Enhanced order modal for flowers page
function openOrderModal(productId) {
    const productsManager = new ProductsManager();
    const product = productsManager.getById(productId);
    
    if (!product) return;

    const modal = document.createElement('div');
    modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'order-modal';
    
    modal.innerHTML = `
        <div class="modal-content bg-white rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">Ordina: ${product.nome}</h3>
                        <p class="text-sm text-gray-600">Categoria: ${flowersPage.getCategoryLabel(product.categoria)}</p>
                    </div>
                    <button onclick="closeOrderModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="mb-6">
                    <img src="${product.immagine}" alt="${product.nome}" class="w-full h-40 object-cover rounded-lg">
                    <div class="mt-3 flex justify-between items-center">
                        <p class="text-sm text-gray-600">${product.descrizione}</p>
                        <p class="text-2xl font-bold text-gray-700">€${product.prezzo}</p>
                    </div>
                </div>
                
                <form id="order-form">
                    <input type="hidden" name="prodotto_id" value="${product.id}">
                    <input type="hidden" name="prodotto_nome" value="${product.nome}">
                    <input type="hidden" name="prezzo" value="${product.prezzo}">
                    
                    <div class="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-800 mb-2">
                                <i class="fas fa-user mr-1"></i> Nome *
                            </label>
                            <input type="text" name="nome" required class="form-input w-full p-3 border border-gray-300 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-800 mb-2">
                                <i class="fas fa-user mr-1"></i> Cognome *
                            </label>
                            <input type="text" name="cognome" required class="form-input w-full p-3 border border-gray-300 rounded-lg">
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-800 mb-2">
                                <i class="fas fa-envelope mr-1"></i> Email *
                            </label>
                            <input type="email" name="email" required class="form-input w-full p-3 border border-gray-300 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-800 mb-2">
                                <i class="fas fa-phone mr-1"></i> Telefono *
                            </label>
                            <input type="tel" name="telefono" required class="form-input w-full p-3 border border-gray-300 rounded-lg">
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-semibold text-gray-800 mb-2">
                            <i class="fas fa-map-marker-alt mr-1"></i> Indirizzo di Consegna *
                        </label>
                        <textarea name="indirizzo" required rows="2" class="form-input w-full p-3 border border-gray-300 rounded-lg" placeholder="Via, numero civico, città, CAP"></textarea>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-semibold text-gray-800 mb-2">
                            <i class="fas fa-calendar mr-1"></i> Data di Consegna Preferita
                        </label>
                        <input type="date" name="data_consegna" class="form-input w-full p-3 border border-gray-300 rounded-lg" min="${new Date().toISOString().split('T')[0]}">
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-semibold text-gray-800 mb-2">
                            <i class="fas fa-clock mr-1"></i> Ora Preferita
                        </label>
                        <select name="ora_consegna" class="form-input w-full p-3 border border-gray-300 rounded-lg">
                            <option value="">Seleziona ora</option>
                            <option value="mattina">Mattina (8:00-12:00)</option>
                            <option value="pomeriggio">Pomeriggio (14:00-18:00)</option>
                            <option value="sera">Sera (18:00-20:00)</option>
                        </select>
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-sm font-semibold text-gray-800 mb-2">
                            <i class="fas fa-comment mr-1"></i> Messaggio per il Biglietto
                        </label>
                        <textarea name="messaggio" rows="3" class="form-input w-full p-3 border border-gray-300 rounded-lg" placeholder="Messaggio da includere nel biglietto (opzionale)"></textarea>
                        <p class="text-xs text-gray-500 mt-1">Massimo 200 caratteri</p>
                    </div>
                    
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <h4 class="font-semibold text-yellow-800 mb-2">
                            <i class="fas fa-info-circle mr-2"></i>
                            Riepilogo Ordine
                        </h4>
                        <div class="text-sm text-yellow-700 space-y-1">
                            <p><span class="font-semibold">Prodotto:</span> ${product.nome}</p>
                            <p><span class="font-semibold">Prezzo:</span> €${product.prezzo}</p>
                            <p><span class="font-semibold">Consegna:</span> Gratuita</p>
                            <div class="border-t border-yellow-300 mt-2 pt-2">
                                <p class="font-bold"><span>Totale:</span> €${product.prezzo}</p>
                            </div>
                        </div>
                    </div>
                    
                    <button type="submit" class="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold py-4 rounded-lg hover:from-gray-500 hover:to-gray-600 transition-colors text-lg">
                        <i class="fas fa-shopping-cart mr-2"></i>
                        Conferma Ordine - €${product.prezzo}
                    </button>
                    
                    <p class="text-xs text-gray-500 mt-3 text-center">
                        <i class="fas fa-shield-alt mr-1"></i>
                        Ordine sicuro. Ti contatteremo per la conferma prima della consegna.
                    </p>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Add click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeOrderModal();
        }
    });

    // Focus on first input
    setTimeout(() => {
        const firstInput = modal.querySelector('input[name="nome"]');
        if (firstInput) firstInput.focus();
    }, 100);

    // Set minimum date to today
    const dateInput = modal.querySelector('input[name="data_consegna"]');
    if (dateInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.value = tomorrow.toISOString().split('T')[0];
    }
}

// Initialize flowers page
let flowersPage;

document.addEventListener('DOMContentLoaded', function() {
    flowersPage = new FlowersPage();
});