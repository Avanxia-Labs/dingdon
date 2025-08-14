// COPIA Y PEGA ESTO EN LA CONSOLA DEL NAVEGADOR PARA REMOVER EL WIDGET:

// Remover el widget flotante
const widget = document.getElementById('chatbot-animated-container');
if (widget) {
    widget.remove();
    console.log('Widget flotante removido');
}

// Remover el iframe también
const iframe = document.getElementById('chatbot-iframe');
if (iframe) {
    iframe.remove();
    console.log('Iframe removido');
}

// Remover cualquier elemento con z-index máximo
document.querySelectorAll('[style*="z-index: 2147483647"]').forEach(el => {
    el.remove();
    console.log('Elemento con z-index máximo removido');
});

console.log('Limpieza completada. El botón de envío debería funcionar ahora.');