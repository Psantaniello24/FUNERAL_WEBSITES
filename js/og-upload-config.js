// Config per upload diretto delle pagine OG sul tuo hosting
// 1) Carica sul tuo server lo script server-side proposto (og-upload.php)
// 2) Imposta qui endpoint, token e publicBaseUrl, poi metti enabled: true

window.ogUploadConfig = window.ogUploadConfig || {
    enabled: false, // imposta a true dopo aver configurato endpoint/token
    endpoint: '', // es: 'https://www.tuodominio.it/og/og-upload.php'
    token: '',    // es: 'un-segreto-lungo-complesso'
    publicBaseUrl: '' // es: 'https://www.tuodominio.it/og/'
};

// Funzione helper globale: carica pagina OG su hosting e ritorna URL pubblico oppure null
window.uploadOgPageToHosting = async function uploadOgPageToHosting(htmlString, filename) {
    const cfg = window.ogUploadConfig || {};
    if (!cfg.enabled || !cfg.endpoint || !cfg.token || !cfg.publicBaseUrl) {
        return null;
    }

    try {
        const res = await fetch(cfg.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: cfg.token, filename, content: htmlString })
        });

        if (!res.ok) {
            console.warn('⚠️ Upload hosting non riuscito:', res.status);
            return null;
        }

        const data = await res.json().catch(() => ({}));
        if (data && data.success && data.url) {
            return data.url;
        }

        // Fallback: compone URL dal baseUrl se lato server salva con lo stesso filename
        return cfg.publicBaseUrl ? (cfg.publicBaseUrl.replace(/\/$/, '') + '/' + encodeURIComponent(filename)) : null;
    } catch (e) {
        console.warn('⚠️ Errore upload hosting:', e);
        return null;
    }
};


