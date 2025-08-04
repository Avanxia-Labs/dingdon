// public/loader.js
(function () {
    if (window.ChatbotLoaded) return;
    window.ChatbotLoaded = true;

    const scriptTag = document.currentScript;
    if (!scriptTag) {
        console.error("Chatbot: Loader script tag not found.");
        return;
    }

    const workspaceId = scriptTag.getAttribute('data-workspace-id');
    const chatbotAppUrl = new URL(scriptTag.src).origin;
    let botColor = scriptTag.getAttribute('data-bot-color') || '#1d4ed8';  // Color por defecto

    if (!workspaceId) {
        console.error("Chatbot: 'data-workspace-id' attribute is missing.");
        return;
    }

    // --- 1. Crear el Iframe (inicialmente oculto) ---
    const iframe = document.createElement('iframe');
    iframe.id = 'chatbot-iframe';
    iframe.src = `${chatbotAppUrl}/chatbot-widget?workspaceId=${workspaceId}`;
    iframe.style.position = 'fixed';
    iframe.style.bottom = '80px'; // Deja espacio para el botón de abajo (20px + 60px de alto aprox)
    iframe.style.right = '20px';
    iframe.style.width = 'calc(100% - 40px)';
    iframe.style.height = '70vh'; // Usamos vh para que se adapte a la altura de la pantalla
    iframe.style.maxWidth = '384px'; // Equivalente a max-w-sm de Tailwind
    iframe.style.maxHeight = '500px'; // Un límite máximo fijo
    iframe.style.border = 'none';
    iframe.style.zIndex = '2147483646'; // Un poco menos que el botón para que el botón esté encima si se solapan
    iframe.style.borderRadius = '15px';
    iframe.style.boxShadow = '0 5px 40px rgba(0,0,0,.16)';
    iframe.style.overflow = 'hidden';
    iframe.style.display = 'none'; // Clave: Empieza oculto
    iframe.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
    iframe.style.opacity = '0';
    iframe.style.transform = 'translateY(10px)';
    iframe.style.marginBottom = '15px'

    document.body.appendChild(iframe);

    // --- 2. Crear el Botón de Acción Flotante (FAB) ---
    const toggleButton = document.createElement('button');
    toggleButton.id = 'chatbot-toggle-button';
    toggleButton.setAttribute('aria-label', 'Open Chat');
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '20px';
    toggleButton.style.right = '20px';
    toggleButton.style.width = '60px';
    toggleButton.style.height = '60px';
    toggleButton.style.backgroundColor = botColor;
    toggleButton.style.color = 'white';
    toggleButton.style.borderRadius = '50%';
    toggleButton.style.border = 'none';
    toggleButton.style.boxShadow = '0 4px 8px rgba(0,0,0,.2)';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.display = 'flex';
    toggleButton.style.alignItems = 'center';
    toggleButton.style.justifyContent = 'center';
    toggleButton.style.zIndex = '2147483647';
    toggleButton.style.transition = 'transform 0.2s ease';

    // Iconos SVG para abrir/cerrar
    const openIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot-icon lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>';
    const closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
    toggleButton.innerHTML = openIcon;

    document.body.appendChild(toggleButton);

    // --- 3. Lógica para mostrar/ocultar ---
    let isOpen = false;
    toggleButton.onclick = function () {
        isOpen = !isOpen;
        if (isOpen) {
            iframe.style.display = 'block';
            setTimeout(() => { // Pequeño delay para que la transición funcione
                iframe.style.opacity = '1';
                iframe.style.transform = 'translateY(0)';
            }, 10);
            toggleButton.innerHTML = closeIcon;
            toggleButton.setAttribute('aria-label', 'Close Chat');
        } else {
            iframe.style.opacity = '0';
            iframe.style.transform = 'translateY(10px)';
            setTimeout(() => {
                iframe.style.display = 'none';
            }, 300); // Espera a que termine la transición
            toggleButton.innerHTML = openIcon;
            toggleButton.setAttribute('aria-label', 'Open Chat');
        }
    };

    window.addEventListener('message', function (event) {
        // Medida de seguridad: solo aceptar mensajes del origen de nuestro chatbot
        if (event.origin !== chatbotAppUrl) {
            return;
        }

        // Asegurarnos de que es el mensaje que esperamos
        if (event.data && event.data.type === 'CHATBOT_COLOR_UPDATE' && event.data.color) {
            const newColor = event.data.color;
            console.log('Chatbot Loader: Color updated to', newColor);

            // Actualizar el color de fondo del botón
            toggleButton.style.backgroundColor = newColor;

            // (Opcional) Actualizar nuestra variable local de color
            botColor = newColor;
        }
    });

    toggleButton.onmouseover = () => { toggleButton.style.transform = 'scale(1.1)'; }
    toggleButton.onmouseout = () => { toggleButton.style.transform = 'scale(1)'; }

})();