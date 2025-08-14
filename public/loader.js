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
    // BLOQUEO TOTAL PARA DASHBOARD - SOLUCIÓN DEFINITIVA
    const currentPath = window.location.pathname;
    const currentHost = window.location.hostname;
    
    console.log('[Chatbot Widget] Checking path:', currentPath);
    console.log('[Chatbot Widget] Host:', currentHost);
    
    // Lista de páginas donde SÍ debe cargar el widget (MUY RESTRICTIVO)
    const allowedPages = [
        '/test-widget.html',
        '/demo.html',
        '/preview.html'
    ];
    
    // Lista de rutas donde NUNCA debe cargar (MUY AMPLIO)
    const blockedPaths = [
        '/dashboard',
        '/login',
        '/api',
        '/admin',
        '/settings',
        '/_next',
        '/static'
    ];
    
    // BLOQUEO 1: Si contiene "dashboard" en cualquier parte, SALIR INMEDIATAMENTE
    if (currentPath.includes('/dashboard')) {
        console.log('[Chatbot Widget] ❌ BLOCKED - Dashboard detected in path');
        // Eliminar cualquier elemento existente del widget
        setTimeout(() => {
            const elementsToRemove = [
                'chatbot-animated-container', 'chatbot-head', 'chatbot-body', 
                'chatbot-left-arm', 'chatbot-right-arm', 'chatbot-left-hand', 
                'chatbot-right-hand', 'chatbot-left-leg', 'chatbot-right-leg', 
                'chatbot-left-foot', 'chatbot-right-foot', 'chatbot-iframe', 
                'chatbot-toggle-button'
            ];
            elementsToRemove.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });
        }, 100);
        return;
    }
    
    // BLOQUEO 2: Verificar host y rutas específicas
    const isBlocked = blockedPaths.some(path => currentPath.includes(path));
    const isAllowed = allowedPages.some(page => currentPath.includes(page));
    
    // En localhost, SOLO cargar si está explícitamente permitido
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        if (!isAllowed) {
            console.log('[Chatbot Widget] ❌ BLOCKED on localhost - not in allowed pages list');
            console.log('[Chatbot Widget] Current path:', currentPath);
            console.log('[Chatbot Widget] Allowed pages:', allowedPages);
            
            // Limpiar cualquier widget existente
            const existing = document.getElementById('chatbot-animated-container');
            if (existing) existing.remove();
            
            return;
        }
    } else {
        // En producción, bloquear rutas específicas
        if (isBlocked) {
            console.log('[Chatbot Widget] ❌ BLOCKED - blocked route detected:', currentPath);
            return;
        }
    }
    
    console.log('[Chatbot Widget] ✅ LOADING - Page approved:', currentPath);
    
    if (window.ChatbotLoaded) return;
    window.ChatbotLoaded = true;

    const scriptTag = document.currentScript;
    if (!scriptTag) {
        console.error("Chatbot: Loader script tag not found.");
        return;
    }

    const workspaceId = scriptTag.getAttribute('data-workspace-id');
    const chatbotAppUrl = new URL(scriptTag.src).origin;
    let botColor = scriptTag.getAttribute('data-bot-color') || '#1d4ed8';

    if (!workspaceId) {
        console.error("Chatbot: 'data-workspace-id' attribute is missing.");
        return;
    }

    // --- 1. Crear el Iframe (inicialmente oculto) ---
    const iframe = document.createElement('iframe');
    iframe.id = 'chatbot-iframe';
    iframe.src = `${chatbotAppUrl}/chatbot-widget?workspaceId=${workspaceId}`;
    iframe.style.position = 'fixed';
    iframe.style.bottom = '80px';
    iframe.style.right = '20px';
    iframe.style.width = 'calc(100% - 40px)';
    iframe.style.height = '70vh';
    iframe.style.maxWidth = '384px';
    iframe.style.maxHeight = '500px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '2147483646';
    iframe.style.borderRadius = '15px';
    iframe.style.boxShadow = '0 5px 40px rgba(0,0,0,.16)';
    iframe.style.overflow = 'hidden';
    iframe.style.display = 'none'; 
    iframe.style.visibility = 'hidden';
    iframe.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
    iframe.style.opacity = '0';
    iframe.style.transform = 'translateY(10px)';
    iframe.style.marginBottom = '15px';

    document.body.appendChild(iframe);

    // --- 2. Crear el contenedor del chatbot animado ---
    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'chatbot-animated-container';
    chatbotContainer.style.position = 'fixed';
    chatbotContainer.style.bottom = '20px';
    chatbotContainer.style.right = '20px';
    chatbotContainer.style.zIndex = '2147483647';
    chatbotContainer.style.width = '100px';
    chatbotContainer.style.height = '120px';
    chatbotContainer.style.pointerEvents = 'auto'; // Permitir interacción desde el inicio
    
    // --- 3. Crear las partes del cuerpo ---
    
    // Cabeza (botón principal) - siempre visible
    const head = document.createElement('button');
    head.id = 'chatbot-head';
    head.setAttribute('aria-label', 'Open Chat');
    head.style.position = 'absolute';
    head.style.bottom = '60px'; // Posicionado arriba del cuerpo
    head.style.right = '20px'; // Centrado en el contenedor
    head.style.width = '60px';
    head.style.height = '60px';
    head.style.backgroundColor = botColor;
    head.style.color = 'white';
    head.style.borderRadius = '50%';
    head.style.border = 'none';
    head.style.boxShadow = '0 4px 8px rgba(0,0,0,.2)';
    head.style.cursor = 'pointer';
    head.style.display = 'flex';
    head.style.alignItems = 'center';
    head.style.justifyContent = 'center';
    head.style.transition = 'transform 0.2s ease';
    head.style.pointerEvents = 'auto';

    // Cuerpo (pecho)
    const body = document.createElement('div');
    body.id = 'chatbot-body';
    body.style.position = 'absolute';
    body.style.bottom = '20px'; // Debajo de la cabeza
    body.style.right = '35px'; // Centrado respecto a la cabeza
    body.style.width = '30px';
    body.style.height = '40px';
    body.style.backgroundColor = botColor;
    body.style.borderRadius = '15px 15px 5px 5px';
    body.style.opacity = '0';
    body.style.transform = 'scale(0)';
    body.style.transformOrigin = 'top center';

    // Brazo izquierdo
    const leftArm = document.createElement('div');
    leftArm.id = 'chatbot-left-arm';
    leftArm.style.position = 'absolute';
    leftArm.style.bottom = '45px';
    leftArm.style.right = '65px'; // Desde el extremo izquierdo del cuerpo
    leftArm.style.width = '20px';
    leftArm.style.height = '4px';
    leftArm.style.backgroundColor = botColor;
    leftArm.style.borderRadius = '2px';
    leftArm.style.transformOrigin = 'right center';
    leftArm.style.opacity = '0';
    leftArm.style.transform = 'scale(0) rotate(-45deg)';

    // Mano izquierda
    const leftHand = document.createElement('div');
    leftHand.id = 'chatbot-left-hand';
    leftHand.style.position = 'absolute';
    leftHand.style.bottom = '43px'; // Centrada verticalmente con el brazo
    leftHand.style.right = '85px'; // Al final del brazo izquierdo
    leftHand.style.width = '8px';
    leftHand.style.height = '8px';
    leftHand.style.backgroundColor = botColor;
    leftHand.style.borderRadius = '50%';
    leftHand.style.opacity = '0';
    leftHand.style.transform = 'scale(0)';

    // Brazo derecho
    const rightArm = document.createElement('div');
    rightArm.id = 'chatbot-right-arm';
    rightArm.style.position = 'absolute';
    rightArm.style.bottom = '45px';
    rightArm.style.right = '15px'; // Desde el extremo derecho del cuerpo
    rightArm.style.width = '20px';
    rightArm.style.height = '4px';
    rightArm.style.backgroundColor = botColor;
    rightArm.style.borderRadius = '2px';
    rightArm.style.transformOrigin = 'left center';
    rightArm.style.opacity = '0';
    rightArm.style.transform = 'scale(0) rotate(45deg)';

    // Mano derecha
    const rightHand = document.createElement('div');
    rightHand.id = 'chatbot-right-hand';
    rightHand.style.position = 'absolute';
    rightHand.style.bottom = '43px'; // Centrada verticalmente con el brazo (igual que la izquierda)
    rightHand.style.right = '7px'; // Simétrica: centro=50px, izq=85px (dist=35px), der=50-35=15px, pero ajustado por el ancho de la mano
    rightHand.style.width = '8px';
    rightHand.style.height = '8px';
    rightHand.style.backgroundColor = botColor;
    rightHand.style.borderRadius = '50%';
    rightHand.style.opacity = '0';
    rightHand.style.transform = 'scale(0)';

    // Pierna izquierda
    const leftLeg = document.createElement('div');
    leftLeg.id = 'chatbot-left-leg';
    leftLeg.style.position = 'absolute';
    leftLeg.style.bottom = '-5px';
    leftLeg.style.right = '63px'; // Extremo izquierdo del cuerpo (35px + 30px - 2px)
    leftLeg.style.width = '4px';
    leftLeg.style.height = '25px';
    leftLeg.style.backgroundColor = botColor;
    leftLeg.style.borderRadius = '2px';
    leftLeg.style.transformOrigin = 'top center';
    leftLeg.style.opacity = '0';
    leftLeg.style.transform = 'scale(0)';

    // Pie izquierdo (centrado respecto a la pierna)
    const leftFoot = document.createElement('div');
    leftFoot.id = 'chatbot-left-foot';
    leftFoot.style.position = 'absolute';
    leftFoot.style.bottom = '-12px';
    leftFoot.style.right = '61px'; // Centrado: pierna en 63px, pie 12px ancho, entonces 63px - (12px-4px)/2 = 61px
    leftFoot.style.width = '12px';
    leftFoot.style.height = '6px';
    leftFoot.style.backgroundColor = botColor;
    leftFoot.style.borderRadius = '3px';
    leftFoot.style.opacity = '0';
    leftFoot.style.transform = 'scale(0)';

    // Pierna derecha
    const rightLeg = document.createElement('div');
    rightLeg.id = 'chatbot-right-leg';
    rightLeg.style.position = 'absolute';
    rightLeg.style.bottom = '-5px';
    rightLeg.style.right = '33px'; // Extremo derecho del cuerpo (35px - 2px)
    rightLeg.style.width = '4px';
    rightLeg.style.height = '25px';
    rightLeg.style.backgroundColor = botColor;
    rightLeg.style.borderRadius = '2px';
    rightLeg.style.transformOrigin = 'top center';
    rightLeg.style.opacity = '0';
    rightLeg.style.transform = 'scale(0)';

    // Pie derecho (centrado respecto a la pierna)
    const rightFoot = document.createElement('div');
    rightFoot.id = 'chatbot-right-foot';
    rightFoot.style.position = 'absolute';
    rightFoot.style.bottom = '-12px';
    rightFoot.style.right = '31px'; // Centrado: pierna en 33px, pie 12px ancho, entonces 33px - (12px-4px)/2 = 31px
    rightFoot.style.width = '12px';
    rightFoot.style.height = '6px';
    rightFoot.style.backgroundColor = botColor;
    rightFoot.style.borderRadius = '3px';
    rightFoot.style.opacity = '0';
    rightFoot.style.transform = 'scale(0)';

    // Iconos SVG para abrir/cerrar
    const openIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot-icon lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>';
    const closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
    head.innerHTML = openIcon;

    // Agregar todas las partes al contenedor
    chatbotContainer.appendChild(body);
    chatbotContainer.appendChild(leftArm);
    chatbotContainer.appendChild(leftHand);
    chatbotContainer.appendChild(rightArm);
    chatbotContainer.appendChild(rightHand);
    chatbotContainer.appendChild(leftLeg);
    chatbotContainer.appendChild(leftFoot);
    chatbotContainer.appendChild(rightLeg);
    chatbotContainer.appendChild(rightFoot);
    chatbotContainer.appendChild(head);

    document.body.appendChild(chatbotContainer);

    // --- 4. Variables de control de animación ---
    let animationCompleted = false;
    let animationTimeouts = []; // Array para guardar todos los timeouts

    // --- 5. Función para limpiar la animación ---
    function stopAnimation() {
        // Limpiar todos los timeouts
        animationTimeouts.forEach(timeout => clearTimeout(timeout));
        animationTimeouts = [];
        
        // Ocultar inmediatamente todas las partes del cuerpo
        const bodyParts = [body, leftArm, leftHand, rightArm, rightHand, leftLeg, leftFoot, rightLeg, rightFoot];
        bodyParts.forEach(part => {
            part.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            part.style.opacity = '0';
            part.style.transform = 'scale(0)';
        });
        
        // Mover la cabeza a su posición final
        head.style.transition = 'bottom 0.5s ease, right 0.5s ease';
        head.style.bottom = '0px';
        head.style.right = '0px';
        
        animationCompleted = true;
    }

    // --- 6. Función de animación de entrada ---
    function playIntroAnimation() {
        if (animationCompleted) return; // No ejecutar si ya se completó
        
        // Fase 1: Aparición del cuerpo (0-2s)
        animationTimeouts.push(setTimeout(() => {
            if (animationCompleted) return;
            body.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            body.style.opacity = '1';
            body.style.transform = 'scale(1)';
        }, 100));

        // Fase 2: Aparición de piernas (0.5s después)
        animationTimeouts.push(setTimeout(() => {
            if (animationCompleted) return;
            leftLeg.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            rightLeg.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            leftLeg.style.opacity = '1';
            leftLeg.style.transform = 'scale(1)';
            rightLeg.style.opacity = '1';
            rightLeg.style.transform = 'scale(1)';
        }, 600));

        // Fase 3: Aparición de pies (0.3s después)
        animationTimeouts.push(setTimeout(() => {
            if (animationCompleted) return;
            leftFoot.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            rightFoot.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            leftFoot.style.opacity = '1';
            leftFoot.style.transform = 'scale(1)';
            rightFoot.style.opacity = '1';
            rightFoot.style.transform = 'scale(1)';
        }, 900));

        // Fase 4: Aparición de brazos (1.2s después del inicio)
        animationTimeouts.push(setTimeout(() => {
            if (animationCompleted) return;
            leftArm.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            rightArm.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            leftArm.style.opacity = '1';
            leftArm.style.transform = 'scale(1) rotate(-45deg)';
            rightArm.style.opacity = '1';
            rightArm.style.transform = 'scale(1) rotate(45deg)';
        }, 1200));

        // Fase 5: Aparición de manos (1.5s después del inicio)
        animationTimeouts.push(setTimeout(() => {
            if (animationCompleted) return;
            leftHand.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            rightHand.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            leftHand.style.opacity = '1';
            leftHand.style.transform = 'scale(1)';
            rightHand.style.opacity = '1';
            rightHand.style.transform = 'scale(1)';
        }, 1500));

        // Fase 6: Animación de saludo con las manos (2s-8s)
        animationTimeouts.push(setTimeout(() => {
            if (animationCompleted) return;
            // Saludo con movimiento de manos
            const waveAnimation = () => {
                if (animationCompleted) return;
                leftHand.style.transition = 'transform 0.4s ease-in-out';
                rightHand.style.transition = 'transform 0.4s ease-in-out';
                leftArm.style.transition = 'transform 0.4s ease-in-out';
                rightArm.style.transition = 'transform 0.4s ease-in-out';
                
                // Movimiento 1
                leftHand.style.transform = 'scale(1) translateY(-5px)';
                rightHand.style.transform = 'scale(1) translateY(-5px)';
                leftArm.style.transform = 'scale(1) rotate(-20deg)';
                rightArm.style.transform = 'scale(1) rotate(20deg)';
                
                animationTimeouts.push(setTimeout(() => {
                    if (animationCompleted) return;
                    // Movimiento 2
                    leftHand.style.transform = 'scale(1) translateY(0px)';
                    rightHand.style.transform = 'scale(1) translateY(0px)';
                    leftArm.style.transform = 'scale(1) rotate(-60deg)';
                    rightArm.style.transform = 'scale(1) rotate(60deg)';
                }, 400));
                
                animationTimeouts.push(setTimeout(() => {
                    if (animationCompleted) return;
                    // Movimiento 3
                    leftHand.style.transform = 'scale(1) translateY(-5px)';
                    rightHand.style.transform = 'scale(1) translateY(-5px)';
                    leftArm.style.transform = 'scale(1) rotate(-20deg)';
                    rightArm.style.transform = 'scale(1) rotate(20deg)';
                }, 800));
                
                animationTimeouts.push(setTimeout(() => {
                    if (animationCompleted) return;
                    // Volver a posición original
                    leftHand.style.transform = 'scale(1)';
                    rightHand.style.transform = 'scale(1)';
                    leftArm.style.transform = 'scale(1) rotate(-45deg)';
                    rightArm.style.transform = 'scale(1) rotate(45deg)';
                }, 1200));
            };

            // Repetir el saludo varias veces
            waveAnimation();
            animationTimeouts.push(setTimeout(waveAnimation, 1600));
            animationTimeouts.push(setTimeout(waveAnimation, 3200));
        }, 2000));

        // Fase 7: Desaparición gradual del cuerpo (8s-12s)
        animationTimeouts.push(setTimeout(() => {
            if (animationCompleted) return;
            // Primero las manos
            leftHand.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            rightHand.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            leftHand.style.opacity = '0';
            leftHand.style.transform = 'scale(0)';
            rightHand.style.opacity = '0';
            rightHand.style.transform = 'scale(0)';
        }, 8000));

        animationTimeouts.push(setTimeout(() => {
            if (animationCompleted) return;
            // Luego los brazos
            leftArm.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            rightArm.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            leftArm.style.opacity = '0';
            leftArm.style.transform = 'scale(0) rotate(-45deg)';
            rightArm.style.opacity = '0';
            rightArm.style.transform = 'scale(0) rotate(45deg)';
        }, 8500));

        animationTimeouts.push(setTimeout(() => {
            if (animationCompleted) return;
            // Luego los pies
            leftFoot.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            rightFoot.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            leftFoot.style.opacity = '0';
            leftFoot.style.transform = 'scale(0)';
            rightFoot.style.opacity = '0';
            rightFoot.style.transform = 'scale(0)';
        }, 9000));

        animationTimeouts.push(setTimeout(() => {
            if (animationCompleted) return;
            // Luego las piernas
            leftLeg.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            rightLeg.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            leftLeg.style.opacity = '0';
            leftLeg.style.transform = 'scale(0)';
            rightLeg.style.opacity = '0';
            rightLeg.style.transform = 'scale(0)';
        }, 9500));

        animationTimeouts.push(setTimeout(() => {
            if (animationCompleted) return;
            // Finalmente el cuerpo
            body.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            body.style.opacity = '0';
            body.style.transform = 'scale(0)';
        }, 10000));

        // Al final, mover la cabeza a su posición original
        animationTimeouts.push(setTimeout(() => {
            if (animationCompleted) return;
            head.style.transition = 'bottom 0.5s ease, right 0.5s ease';
            head.style.bottom = '0px';
            head.style.right = '0px';
            animationCompleted = true;
            console.log('Animación completada - Bot listo para usar');
        }, 11000));
    }

    // Iniciar la animación al cargar
    animationTimeouts.push(setTimeout(playIntroAnimation, 500));

    // --- 7. Lógica para mostrar/ocultar iframe ---
    let isOpen = false;
    head.onclick = function () {
        // Si la animación está en curso, interrumpirla
        if (!animationCompleted) {
            stopAnimation();
        }
        
        isOpen = !isOpen;
        if (isOpen) {
            iframe.style.display = 'block';
            iframe.style.visibility = 'visible'; 
            setTimeout(() => {
                iframe.style.opacity = '1';
                iframe.style.transform = 'translateY(0)';
            }, 10);
            head.innerHTML = closeIcon;
            head.setAttribute('aria-label', 'Close Chat');
        } else {
            iframe.style.opacity = '0';
            iframe.style.transform = 'translateY(10px)';
            setTimeout(() => {
                iframe.style.display = 'none';
            }, 300);
            head.innerHTML = openIcon;
            head.setAttribute('aria-label', 'Open Chat');
        }
    };

    // --- 8. Escuchar mensajes para cambio de color ---
    window.addEventListener('message', function (event) {
        if (event.origin !== chatbotAppUrl) {
            return;
        }

        if (event.data && event.data.type === 'CHATBOT_COLOR_UPDATE' && event.data.color) {
            const newColor = event.data.color;
            console.log('Chatbot Loader: Color updated to', newColor);

            // Actualizar el color de todas las partes
            head.style.backgroundColor = newColor;
            body.style.backgroundColor = newColor;
            leftArm.style.backgroundColor = newColor;
            leftHand.style.backgroundColor = newColor;
            rightArm.style.backgroundColor = newColor;
            rightHand.style.backgroundColor = newColor;
            leftLeg.style.backgroundColor = newColor;
            leftFoot.style.backgroundColor = newColor;
            rightLeg.style.backgroundColor = newColor;
            rightFoot.style.backgroundColor = newColor;

            botColor = newColor;
        }
    });

    // --- 9. Efectos hover en la cabeza ---
    head.onmouseover = () => { 
        head.style.transform = 'scale(1.1)'; 
    }
    head.onmouseout = () => { 
        head.style.transform = 'scale(1)'; 
    }

})();