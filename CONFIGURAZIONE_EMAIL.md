# 📧 Configurazione Invio Email - Santaniello Servizi Funebri

## 🎯 Panoramica

Il form di contatto del sito è ora configurato per inviare email reali a `santanielloservizifunebri@gmail.com`. Il sistema utilizza due metodi:

1. **EmailJS** (Raccomandato) - Invio automatico tramite servizio cloud
2. **Fallback** - Apertura client email con dati precompilati

## 🚀 Metodo 1: EmailJS (Raccomandato)

### Vantaggi
- ✅ Invio automatico senza aprire client email
- ✅ Funziona su tutti i dispositivi
- ✅ Template email personalizzabili
- ✅ Gratuito fino a 200 email/mese

### Setup EmailJS

1. **Registrati su EmailJS**
   - Vai su [https://www.emailjs.com/](https://www.emailjs.com/)
   - Crea un account gratuito

2. **Configura il Servizio Email**
   - Vai su "Email Services"
   - Aggiungi Gmail o altro provider
   - Connetti l'account `santanielloservizifunebri@gmail.com`

3. **Crea Template Email**
   - Vai su "Email Templates"
   - Crea nuovo template con ID: `template_contatti`
   - Usa queste variabili nel template:
     ```
     Oggetto: Nuova richiesta di contatto - {{subject}}
     
     Corpo:
     NUOVA RICHIESTA DI CONTATTO
     {{#is_urgent}}🔴 RICHIESTA URGENTE{{/is_urgent}}
     
     Nome: {{from_name}}
     Email: {{from_email}}
     Telefono: {{phone}}
     Motivo: {{subject}}
     
     Messaggio:
     {{message}}
     
     ---
     Inviato dal sito web il {{send_date}}
     ```

4. **Ottieni le Credenziali**
   - Service ID (es: `service_santaniello`)
   - Template ID (es: `template_contatti`)
   - Public Key (es: `your_public_key`)

5. **Configura il Sito**
   - Apri `contatti.html`
   - Riga 647: Decommentare e inserire la public key:
     ```javascript
     emailjs.init("your_public_key_here");
     ```
   - Apri `js/main.js`
   - Righe 931-933: Inserire i tuoi ID:
     ```javascript
     const serviceID = 'service_santaniello';
     const templateID = 'template_contatti';
     const userID = 'your_emailjs_user_id';
     ```

## 🔄 Metodo 2: Fallback (Sempre Attivo)

Se EmailJS non è configurato o non funziona, il sistema:

1. **Apre automaticamente** il client email predefinito
2. **Precompila** tutti i dati del form
3. **L'utente deve solo** cliccare "Invia" nel client email

### Come Funziona
- Utilizza il protocollo `mailto:`
- Funziona con Gmail, Outlook, Apple Mail, ecc.
- Email formattata professionalmente

## 🧪 Test del Sistema

### Test EmailJS
1. Compila il form di contatto
2. Se configurato correttamente: "✅ Messaggio inviato con successo!"
3. Controlla la casella email `santanielloservizifunebri@gmail.com`

### Test Fallback
1. Disattiva EmailJS (commenta l'init)
2. Compila il form
3. Si dovrebbe aprire il client email con dati precompilati

## 🔧 Risoluzione Problemi

### EmailJS non funziona
- ✅ Verifica credenziali in `contatti.html` e `js/main.js`
- ✅ Controlla quota mensile su EmailJS
- ✅ Verifica template ID e variabili

### Client email non si apre
- ✅ Verifica che ci sia un client email configurato
- ✅ Su mobile, potrebbe aprire Gmail/Outlook app

### Email non arriva
- ✅ Controlla cartella spam
- ✅ Verifica indirizzo destinatario in EmailJS
- ✅ Testa con template EmailJS

## 📊 Monitoraggio

### Log Console
Il sistema registra tutti i passaggi:
- `📧 Invio email con dati:` - Dati inviati
- `✅ Messaggio inviato` - Successo EmailJS
- `❌ Errore invio email:` - Errore EmailJS

### Statistiche EmailJS
- Dashboard EmailJS mostra email inviate
- Monitoraggio quota mensile
- Log errori dettagliati

## 💡 Raccomandazioni

1. **Configura EmailJS** per la migliore esperienza utente
2. **Testa regolarmente** entrambi i metodi
3. **Monitora quota** EmailJS per evitare interruzioni
4. **Backup periodico** delle configurazioni

---

**Il sistema è già funzionante con il fallback. EmailJS è un upgrade opzionale ma raccomandato.**
