# 🌟 Sito Web Agenzia Funebre Santaniello - Design Moderno

Un sito web completo e **modernamente ridisegnato** per l'Agenzia Funebre Santaniello, ispirato alle funzionalità di necrologi-italia.it, sviluppato con HTML5, CSS3/Tailwind CSS e JavaScript puro.

## 🎨 **NUOVO: Design Moderno 2024**
- ✨ **Palette colori moderna** con nero, bianco e sfumature eleganti
- 🚀 **Effetti avanzati** con gradients, ombre profonde e animazioni smooth
- 📱 **Responsive perfetto** ottimizzato per tutti i dispositivi
- ⚡ **Prestazioni ottimizzate** con transizioni hardware-accelerated

## 🌟 Caratteristiche Principali

### 📋 Funzionalità Implementate

- **🕊️ Necrologi Online**: Elenco con filtri per comune e nome, pagine dedicate, sistema di condoglianze
- **💐 Fiori e Omaggi**: Catalogo prodotti con form di acquisto e sistema di ordini
- **🏛️ Chi Siamo**: Storia aziendale, team, valori e certificazioni
- **🏠 Casa Funeraria**: Galleria fotografica, tour virtuale, informazioni sulla struttura
- **📍 Contatti**: Form di contatto, mappa interattiva, informazioni di localizzazione
- **⚰️ Servizi**: Descrizione completa di tutti i servizi offerti

### 🎨 Design e UX - **MODERNIZZATO**

- **Design responsive** ottimizzato per mobile, tablet e desktop
- **🆕 Palette colori moderna** - Nero profondo, bianco puro, sfumature grigie eleganti
- **🆕 Effetti visivi avanzati** - Gradients, backdrop blur, ombre progressive
- **🆕 Animazioni smooth** - Transizioni cubic-bezier, transform effects, hover states
- **🆕 Card system moderno** - Elevazioni dinamiche, scaling effects, gradients
- **Font eleganti** (Crimson Text per i titoli, Inter per il testo)
- **Navigazione intuitiva** con breadcrumb e menu mobile migliorato
- **Accessibilità** con supporto screen reader e focus management

#### **Nuovi Effetti Visuali**
- ✨ **Hero Sections** con blur effects e onde decorative SVG
- ✨ **Pulsanti 3D** con gradients e transform hover
- ✨ **Cards animate** con shadow progressivo e scaling
- ✨ **Headers moderni** con gradients multi-layer

### 💻 Tecnologie Utilizzate

- **HTML5** semantico con microdati strutturati
- **Tailwind CSS** per lo styling rapido e consistente
- **JavaScript Vanilla** per tutte le interazioni
- **Font Awesome** per le icone
- **Google Fonts** per la tipografia

## 📁 Struttura del Progetto

```
sito_funebre/
├── index.html              # Homepage
├── necrologi.html          # Elenco necrologi
├── necrologio-1.html       # Dettaglio necrologio Mario Rossi
├── necrologio-2.html       # Dettaglio necrologio Anna Bianchi
├── necrologio-3.html       # Dettaglio necrologio Giuseppe Verdi
├── fiori-omaggi.html       # Catalogo fiori e omaggi
├── chi-siamo.html          # Storia e team aziendale
├── casa-funeraria.html     # Presentazione della struttura
├── servizi.html            # Servizi offerti
├── contatti.html           # Informazioni di contatto
├── css/
│   └── styles.css          # Stili personalizzati
├── js/
│   ├── main.js             # Funzionalità generali
│   ├── modern-theme.js     # 🆕 Sistema tema moderno automatico
│   ├── necrologi.js        # Logica per la pagina necrologi
│   ├── necrologio-detail.js # Logica per i dettagli necrologio
│   └── fiori-omaggi.js     # Logica per fiori e omaggi
└── README.md               # Questo file
```

## 🚀 Come Utilizzare il Sito

### Installazione

1. **Clona/Scarica** i file del progetto
2. **Apri** `index.html` in un browser web moderno
3. **Naviga** attraverso le varie sezioni del sito

### Funzionalità Principali

#### Necrologi
- **Visualizza** l'elenco completo nella pagina "Necrologi"
- **Filtra** per comune o cerca per nome
- **Clicca** su un necrologio per vedere i dettagli completi
- **Invia** condoglianze tramite il form dedicato

#### Fiori e Omaggi
- **Sfoglia** il catalogo per categoria
- **Visualizza** i dettagli di ogni prodotto
- **Ordina** direttamente tramite il form di acquisto

#### Casa Funeraria
- **Esplora** la galleria fotografica (click per ingrandire)
- **Guarda** il tour virtuale embedded
- **Consulta** la pianta della struttura

#### Contatti
- **Compila** il form per richieste di informazioni
- **Visualizza** la posizione sulla mappa interattiva
- **Trova** tutte le informazioni di contatto

## 🛠️ Personalizzazione

### 🎨 Colori - **AGGIORNATO AL DESIGN MODERNO**
I colori del tema moderno sono definiti in Tailwind CSS:
```javascript
colors: {
    'modern-dark': '#1a1a1a',    // Nero profondo principale
    'modern-gray': '#374151',    // Grigio elegante  
    'modern-light': '#6b7280',   // Grigio chiaro
    'modern-accent': '#2d3748'   // Grigio scuro accenti
}
```

#### **Gradients Utilizzati**
```css
/* Hero Sections */
background: linear-gradient(135deg, #111827 0%, #1f2937 100%);

/* Cards */
background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);

/* Buttons */
background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
```

#### **Sistema Automatico**
Il file `js/modern-theme.js` **converte automaticamente** i vecchi colori:
- ❌ `funeral-dark` → ✅ `modern-dark`
- ❌ `funeral-blue` → ✅ `modern-gray`  
- ❌ `funeral-gold` → ✅ Gradients moderni

### Contenuti
- **Necrologi**: Modifica i dati in `js/main.js` nella classe `ObituariesManager`
- **Prodotti**: Aggiorna il catalogo in `js/main.js` nella classe `ProductsManager`
- **Informazioni azienda**: Modifica i contenuti nelle rispettive pagine HTML

### Immagini
Sostituisci i placeholder con immagini reali:
- Foto necrologi: Aggiorna gli URL nelle pagine `necrologio-*.html`
- Prodotti: Modifica gli URL in `ProductsManager`
- Galleria: Sostituisci le immagini in `casa-funeraria.html`

## 📱 Responsive Design

Il sito è ottimizzato per:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

## ♿ Accessibilità

- **Focus management** per navigazione da tastiera
- **Alt text** su tutte le immagini
- **Headings semantici** (H1, H2, H3...)
- **ARIA labels** dove necessario
- **Contrasto colori** conforme alle linee guida

## 🔧 Funzionalità JavaScript

### Componenti Principali
- **MobileMenu**: Gestione menu responsive
- **ObituariesManager**: Dati e logica necrologi
- **ProductsManager**: Gestione catalogo prodotti  
- **FormHandler**: Validazione e invio form
- **Gallery**: Modalità visualizzazione immagini

### API Simulate
Tutte le funzionalità utilizzano dati mockup per la dimostrazione:
- Invio form (simulato con timeout)
- Caricamento dati (con loading states)
- Notifiche di successo/errore

## 🌐 SEO e Metadati

Ogni pagina include:
- **Title** ottimizzati per i motori di ricerca
- **Meta description** descrittive
- **Keywords** pertinenti
- **Open Graph** (da implementare se necessario)

## 📞 Supporto

Per domande o personalizzazioni contatta:
- **Email**: info@santaniello.it
- **Telefono**: +39 081 123 4567

## 📄 Licenza

Progetto sviluppato per scopi dimostrativi. I contenuti sono fittizi e utilizzati solo a scopo di esempio.

---

*Sviluppato con ❤️ per offrire un servizio digitale professionale alle famiglie in lutto.*