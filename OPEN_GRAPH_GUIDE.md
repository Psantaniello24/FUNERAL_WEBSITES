# 📱 Guida Meta Tag Open Graph per Facebook

## Come Funziona

Quando crei un nuovo necrologio tramite il pannello admin, il sistema genererà automaticamente una pagina HTML statica con i meta tag Open Graph ottimizzati per Facebook.

## Cosa Viene Generato

### Meta Tag Open Graph
- **og:title**: Nome del defunto + "Necrologio | Agenzia Funebre Santaniello"
- **og:description**: "Ci ha lasciati [Nome], i funerali si terranno [Data] presso [Chiesa]"
- **og:image**: Foto del defunto (o placeholder se non presente)
- **og:url**: URL completo della pagina del necrologio
- **og:type**: "website"
- **og:site_name**: "Onoranze Funebri Santaniello"
- **og:locale**: "it_IT"

### Esempio di Anteprima Facebook
Quando condividi il link su Facebook, apparirà così:
```
[FOTO DEL DEFUNTO]
Mario Rossi - Necrologio | Agenzia Funebre Santaniello
Ci ha lasciati Mario Rossi, i funerali si terranno 15 gennaio 2024 presso Chiesa San Giuseppe
santaniello.com
```

## Come Utilizzare

### 1. Creazione Necrologio
1. Vai nel pannello admin
2. Compila il form del necrologio con tutti i dati
3. **IMPORTANTE**: Assicurati di inserire:
   - Nome completo del defunto
   - Data del funerale
   - Luogo del funerale (chiesa)
   - Foto del defunto (opzionale ma consigliato)

### 2. Generazione Automatica
Quando salvi il necrologio:
1. Il sistema salva i dati nel database
2. Genera automaticamente una pagina HTML statica
3. Mostra una notifica con opzione di download

### 3. Utilizzo della Pagina Generata
1. Scarica il file HTML generato
2. Carica il file sul tuo server web
3. Usa l'URL di questa pagina per la condivisione sui social

## Struttura File Generati

I file vengono generati con il nome: `necrologio-[ID].html`

Esempio: `necrologio-123456789.html`

## Test della Condivisione

### Facebook Debugger
Per verificare che i meta tag funzionino correttamente:
1. Vai su https://developers.facebook.com/tools/debug/
2. Inserisci l'URL della pagina generata
3. Clicca "Debug" per vedere l'anteprima

### Condivisione Diretta
1. Copia l'URL della pagina generata
2. Incolla su Facebook
3. L'anteprima dovrebbe mostrare automaticamente foto e descrizione

## Note Tecniche

- I meta tag sono **statici** - vengono popolati al momento della creazione
- Funziona solo per **nuovi necrologi** creati dopo l'implementazione
- I necrologi esistenti continueranno a usare la pagina dinamica standard
- Le immagini devono essere accessibili pubblicamente per apparire su Facebook

## Troubleshooting

### L'anteprima non appare su Facebook
1. Verifica che l'URL sia accessibile pubblicamente
2. Controlla che l'immagine sia disponibile online
3. Usa il Facebook Debugger per diagnosticare problemi

### La descrizione è incompleta
Assicurati di aver compilato tutti i campi:
- Data del funerale
- Luogo del funerale

### L'immagine non appare
1. Verifica che la foto sia stata caricata correttamente
2. L'immagine deve essere accessibile da URL pubblico
3. Formati supportati: JPG, PNG, GIF
