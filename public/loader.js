// // public/loader.js
// (function () {
//     if (window.ChatbotLoaded) return;
//     window.ChatbotLoaded = true;

//     const scriptTag = document.currentScript;
//     if (!scriptTag) {
//         console.error("Chatbot: Loader script tag not found.");
//         return;
//     }

//     const workspaceId = scriptTag.getAttribute('data-workspace-id');
//     const chatbotAppUrl = new URL(scriptTag.src).origin;
//     let botColor = scriptTag.getAttribute('data-bot-color') || '#1d4ed8';  // Color por defecto

//     if (!workspaceId) {
//         console.error("Chatbot: 'data-workspace-id' attribute is missing.");
//         return;
//     }

//     // --- 1. Crear el Iframe (inicialmente oculto) ---
//     const iframe = document.createElement('iframe');
//     iframe.id = 'chatbot-iframe';
//     iframe.src = `${chatbotAppUrl}/chatbot-widget?workspaceId=${workspaceId}`;
//     iframe.style.position = 'fixed';
//     iframe.style.bottom = '80px'; // Deja espacio para el botón de abajo (20px + 60px de alto aprox)
//     iframe.style.right = '20px';
//     iframe.style.width = 'calc(100% - 40px)';
//     iframe.style.height = '70vh'; // Usamos vh para que se adapte a la altura de la pantalla
//     iframe.style.maxWidth = '384px'; // Equivalente a max-w-sm de Tailwind
//     iframe.style.maxHeight = '500px'; // Un límite máximo fijo
//     iframe.style.border = 'none';
//     iframe.style.zIndex = '2147483646'; // Un poco menos que el botón para que el botón esté encima si se solapan
//     iframe.style.borderRadius = '15px';
//     iframe.style.boxShadow = '0 5px 40px rgba(0,0,0,.16)';
//     iframe.style.overflow = 'hidden';
//     iframe.style.display = 'none'; 
//     iframe.style.visibility = 'hidden';

//     iframe.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
//     iframe.style.opacity = '0';
//     iframe.style.transform = 'translateY(10px)';
//     iframe.style.marginBottom = '15px';

//     document.body.appendChild(iframe);

//     // --- 2. Crear el Botón de Acción Flotante (FAB) ---
//     const toggleButton = document.createElement('button');
//     toggleButton.id = 'chatbot-toggle-button';
//     toggleButton.setAttribute('aria-label', 'Open Chat');
//     toggleButton.style.position = 'fixed';
//     toggleButton.style.bottom = '20px';
//     toggleButton.style.right = '20px';
//     toggleButton.style.width = '60px';
//     toggleButton.style.height = '60px';
//     toggleButton.style.backgroundColor = botColor;
//     toggleButton.style.color = 'white';
//     toggleButton.style.borderRadius = '50%';
//     toggleButton.style.border = 'none';
//     toggleButton.style.boxShadow = '0 4px 8px rgba(0,0,0,.2)';
//     toggleButton.style.cursor = 'pointer';
//     toggleButton.style.display = 'flex';
//     toggleButton.style.alignItems = 'center';
//     toggleButton.style.justifyContent = 'center';
//     toggleButton.style.zIndex = '2147483647';
//     toggleButton.style.transition = 'transform 0.2s ease';

//     // Iconos SVG para abrir/cerrar
//     const openIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot-icon lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>';
//     const closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
//     toggleButton.innerHTML = openIcon;

//     document.body.appendChild(toggleButton);

//     // --- 3. Lógica para mostrar/ocultar ---
//     let isOpen = false;
//     toggleButton.onclick = function () {
//         isOpen = !isOpen;
//         if (isOpen) {
//             iframe.style.display = 'block';
//             iframe.style.visibility = 'visible'; 
//             setTimeout(() => { // Pequeño delay para que la transición funcione
//                 iframe.style.opacity = '1';
//                 iframe.style.transform = 'translateY(0)';
//             }, 10);
//             toggleButton.innerHTML = closeIcon;
//             toggleButton.setAttribute('aria-label', 'Close Chat');
//         } else {
//             iframe.style.opacity = '0';
//             iframe.style.transform = 'translateY(10px)';
//             setTimeout(() => {
//                 iframe.style.display = 'none';
//             }, 300); // Espera a que termine la transición
//             toggleButton.innerHTML = openIcon;
//             toggleButton.setAttribute('aria-label', 'Open Chat');
//         }
//     };

//     window.addEventListener('message', function (event) {
//         // Medida de seguridad: solo aceptar mensajes del origen de nuestro chatbot
//         if (event.origin !== chatbotAppUrl) {
//             return;
//         }

//         // Asegurarnos de que es el mensaje que esperamos
//         if (event.data && event.data.type === 'CHATBOT_COLOR_UPDATE' && event.data.color) {
//             const newColor = event.data.color;
//             console.log('Chatbot Loader: Color updated to', newColor);

//             // Actualizar el color de fondo del botón
//             toggleButton.style.backgroundColor = newColor;

//             // (Opcional) Actualizar nuestra variable local de color
//             botColor = newColor;
//         }
//     });

//     toggleButton.onmouseover = () => { toggleButton.style.transform = 'scale(1.1)'; }
//     toggleButton.onmouseout = () => { toggleButton.style.transform = 'scale(1)'; }

// })();





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

    if (!workspaceId) {
        console.error("Chatbot: 'data-workspace-id' attribute is missing.");
        return;
    }

    function createChatbotUI(config) {
        let botColor = config.bot_color || '#1d4ed8';
        const avatarUrl = config.bot_avatar_url || `${chatbotAppUrl}/default-bot-avatar.png`;
        const introText = config.bot_introduction || 'How can I help you today?'; 
        
         // --- IFRAME ---
        const iframe = document.createElement('iframe');
        iframe.id = 'chatbot-iframe';
        iframe.src = `${chatbotAppUrl}/chatbot-widget?workspaceId=${workspaceId}`;
        iframe.style.position = 'fixed';
        iframe.style.bottom = '90px';
        iframe.style.right = '20px';
        iframe.style.width = 'calc(100% - 40px)';
        iframe.style.maxWidth = '384px';
        iframe.style.height = '70vh';
        iframe.style.maxHeight = '500px';
        iframe.style.border = 'none';
        iframe.style.zIndex = '2147483646';
        iframe.style.borderRadius = '15px';
        iframe.style.boxShadow = '0 10px 25px rgba(0,0,0,.1)';
        iframe.style.overflow = 'hidden';
        iframe.style.display = 'none';
        iframe.style.opacity = '0';
        iframe.style.transform = 'translateY(10px)';
        iframe.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        document.body.appendChild(iframe);

         // --- ToogleButton ---
        const toggleButton = document.createElement('button');
        toggleButton.id = 'chatbot-toggle-button';
        toggleButton.setAttribute('aria-label', 'Open Chat');
        toggleButton.style.position = 'fixed';
        toggleButton.style.bottom = '20px';
        toggleButton.style.right = '20px';
        toggleButton.style.width = '60px';
        toggleButton.style.height = '60px';
        toggleButton.style.backgroundColor = botColor;
        toggleButton.style.borderRadius = '50%';
        toggleButton.style.border = 'none';
        toggleButton.style.boxShadow = '0 4px 12px rgba(0,0,0,.2)';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.zIndex = '2147483647';
        toggleButton.style.backgroundImage = `url('${avatarUrl}')`;
        toggleButton.style.backgroundSize = 'cover';
        toggleButton.style.backgroundPosition = 'center';
        const closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
        document.body.appendChild(toggleButton);

        // --- TOOLTIP ---
        const introTooltip = document.createElement('div');
        introTooltip.id = 'chatbot-intro-tooltip';
        introTooltip.textContent = introText;
        introTooltip.style.position = 'fixed';
        introTooltip.style.bottom = '95px'; 
        introTooltip.style.right = '20px';
        introTooltip.style.padding = '10px 16px';
        introTooltip.style.backgroundColor = botColor; 
        introTooltip.style.color = 'white';         
        introTooltip.style.borderRadius = '12px';
        introTooltip.style.boxShadow = '0 5px 15px rgba(0,0,0,.2)';
        introTooltip.style.fontSize = '15px';
        introTooltip.style.fontWeight = '500';
        introTooltip.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'; // Fuente moderna
        introTooltip.style.zIndex = '2147483646';
        introTooltip.style.maxWidth = '250px';
        introTooltip.style.textAlign = 'right';
        introTooltip.style.visibility = 'hidden';
        introTooltip.style.opacity = '0';
        introTooltip.style.transform = 'translateY(10px) scale(0.95)';
        introTooltip.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'; 
        introTooltip.style.pointerEvents = 'none';
        document.body.appendChild(introTooltip);
        // --- FIN DE LOS CAMBIOS DE ESTILO ---
        
        let tooltipTimeout;

        const showTooltip = () => {
            introTooltip.style.visibility = 'visible';
            introTooltip.style.opacity = '1';
            introTooltip.style.transform = 'translateY(0) scale(1)';
        };

        const hideTooltip = () => {
            introTooltip.style.opacity = '0';
            introTooltip.style.transform = 'translateY(10px) scale(0.95)';
            setTimeout(() => { introTooltip.style.visibility = 'hidden'; }, 300);
        };

        setTimeout(() => {
            if (!isOpen) {
                showTooltip();
                tooltipTimeout = setTimeout(hideTooltip, 10000);
            }
        }, 1000);

        let isOpen = false;
        toggleButton.onclick = function () {
            isOpen = !isOpen;
            clearTimeout(tooltipTimeout);
            hideTooltip();

            if (isOpen) {
                iframe.style.display = 'block';
                setTimeout(() => { iframe.style.opacity = '1'; iframe.style.transform = 'translateY(0)'; }, 20);
                toggleButton.style.backgroundImage = 'none';
                toggleButton.innerHTML = closeIcon;
            } else {
                iframe.style.opacity = '0';
                iframe.style.transform = 'translateY(10px)';
                setTimeout(() => { iframe.style.display = 'none'; }, 300);
                toggleButton.style.backgroundImage = `url('${avatarUrl}')`;
                toggleButton.innerHTML = '';
            }
        };

        window.addEventListener('message', function (event) {
            if (event.origin !== chatbotAppUrl) return;

            if (event.data && event.data.type === 'CHATBOT_COLOR_UPDATE' && event.data.color) {
                const newColor = event.data.color;
                toggleButton.style.backgroundColor = newColor;
                introTooltip.style.backgroundColor = newColor; 
                botColor = newColor;
            }
        });

        toggleButton.onmouseover = () => { if (!isOpen) toggleButton.style.transform = 'scale(1.1)'; };
        toggleButton.onmouseout = () => { if (!isOpen) toggleButton.style.transform = 'scale(1)'; };
    }

    fetch(`${chatbotAppUrl}/api/public/config/${workspaceId}`)
        .then(response => response.json())
        .then(config => {
            createChatbotUI(config || {});
        })
        .catch(error => {
            console.error("Chatbot: Failed to fetch config, using defaults.", error);
            createChatbotUI({}); 
        });

})();