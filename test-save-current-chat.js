// Script para simular el guardado del chat actual
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

async function testSaveCurrentChat() {
    console.log('🧪 Probando el guardado manual del historial actual...\n');
    
    // Simular datos de la conversación que acabas de tener
    const testData = {
        sessionId: uuidv4(), // UUID válido
        workspaceId: 'e524d0ba-1cb9-45bd-bc8c-726485474bcb',
        history: [
            {
                id: 'init-1',
                content: '¡Hola! Soy TEST SAmuel. ¿Cómo puedo ayudarte hoy?\n\nPor favor, rellena el formulario de abajo para comenzar.',
                role: 'assistant',
                timestamp: new Date(Date.now() - 300000) // 5 minutos atrás
            },
            {
                id: 'user-1',
                content: 'hola que vendes?',
                role: 'user',
                timestamp: new Date(Date.now() - 240000) // 4 minutos atrás
            },
            {
                id: 'assistant-1',
                content: 'Lo siento, estoy teniendo algunas dificultades técnicas. Por favor, inténtalo de nuevo más tarde.',
                role: 'assistant',
                timestamp: new Date(Date.now() - 230000)
            },
            {
                id: 'user-2',
                content: 'que vendes??',
                role: 'user',
                timestamp: new Date(Date.now() - 120000) // 2 minutos atrás
            },
            {
                id: 'assistant-2',
                content: '¡Hola! En TSC Seguridad Privada, vendemos tranquilidad y protección. Ofrecemos una amplia gama de servicios de seguridad privada...',
                role: 'assistant',
                timestamp: new Date(Date.now() - 60000) // 1 minuto atrás
            },
            {
                id: 'user-3',
                content: 'puedes decirme de nuevo que vendes?',
                role: 'user',
                timestamp: new Date(Date.now() - 30000)
            },
            {
                id: 'assistant-3',
                content: 'Hola! Soy TEST SAmuel. En Innovaciones de Samuel (Datos de Prueba), nos dedicamos a la transformación digital y creativa...',
                role: 'assistant',
                timestamp: new Date()
            }
        ]
    };

    try {
        console.log('📤 Enviando datos al API de guardado...');
        const response = await fetch('http://localhost:3000/api/save-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        const result = await response.json();
        
        console.log(`📋 Respuesta del servidor:`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Success: ${result.success}`);
        console.log(`   Message: ${result.message}`);
        
        if (result.success) {
            console.log('\n✅ Historial guardado exitosamente');
            console.log(`📧 Session ID: ${testData.sessionId}`);
            console.log(`🏢 Workspace ID: ${testData.workspaceId}`);
            console.log(`💬 Total mensajes: ${testData.history.length}`);
            console.log(`👤 Asignado a: BOT (assigned_agent_id = NULL)`);
            console.log(`📊 Status: closed`);
        } else {
            console.log(`\n❌ Error al guardar: ${result.error}`);
        }

    } catch (error) {
        console.error('❌ Error en la petición:', error.message);
    }
}

// Ejecutar la prueba
testSaveCurrentChat().then(() => {
    console.log('\n🔍 Ahora verifica en la base de datos con: node test-check-history.js');
    process.exit(0);
});