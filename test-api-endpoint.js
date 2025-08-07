// test-api-endpoint.js
// Script para probar el endpoint de guardado de historial localmente

const http = require('http');
const express = require('express');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Simular el endpoint de guardado
const mockSaveHistoryAPI = (req, res) => {
    console.log('\n🔵 === LLAMADA AL API DE GUARDADO ===');
    console.log('📝 Body recibido:', JSON.stringify(req.body, null, 2));
    
    const { sessionId, workspaceId, history } = req.body;
    
    // Validaciones como en el endpoint real
    if (!sessionId || !workspaceId || !history || history.length === 0) {
        console.log('❌ Error: Datos insuficientes');
        return res.status(400).json({
            success: false,
            error: 'Datos insuficientes'
        });
    }

    // Filtrar mensajes significativos
    const meaningfulMessages = history.filter(msg => msg.id !== 'init-1');
    if (meaningfulMessages.length === 0) {
        console.log('ℹ️ Solo hay mensaje inicial, no se guarda');
        return res.json({
            success: true,
            message: 'Solo mensaje inicial, no se guardó'
        });
    }

    console.log(`✅ Se guardaría en la base de datos:`);
    console.log(`   - Session ID: ${sessionId}`);
    console.log(`   - Workspace ID: ${workspaceId}`);
    console.log(`   - Total mensajes: ${history.length}`);
    console.log(`   - Mensajes significativos: ${meaningfulMessages.length}`);
    console.log(`   - Assigned Agent ID: NULL (BOT)`);
    console.log(`   - Status: closed`);

    res.json({
        success: true,
        message: 'Historial guardado exitosamente (simulado)'
    });
};

// Crear servidor mock
function createMockServer() {
    const app = express();
    app.use(express.json());
    
    // Middleware de logging
    app.use((req, res, next) => {
        console.log(`\n📡 ${req.method} ${req.url}`);
        next();
    });

    // Endpoint mock
    app.post('/api/save-history', mockSaveHistoryAPI);
    
    const server = app.listen(3002, () => {
        console.log('🚀 Servidor mock ejecutándose en http://localhost:3002');
        console.log('📍 Endpoint disponible: POST /api/save-history');
    });

    return server;
}

// Función para probar el endpoint
async function testEndpoint() {
    console.log('\n🧪 === PRUEBA DEL ENDPOINT ===\n');

    const testData = {
        sessionId: `test-api-${Date.now()}`,
        workspaceId: 'test-workspace-api',
        history: [
            {
                id: 'init-1',
                content: '¡Hola! Soy Asistente Virtual. ¿Cómo puedo ayudarte hoy?',
                role: 'assistant',
                timestamp: new Date()
            },
            {
                id: 'user-1',
                content: 'Hola, necesito ayuda con mi cuenta',
                role: 'user',
                timestamp: new Date()
            },
            {
                id: 'assistant-2',
                content: 'Claro, te puedo ayudar con tu cuenta. ¿Qué necesitas?',
                role: 'assistant',
                timestamp: new Date()
            }
        ]
    };

    try {
        const response = await fetch('http://localhost:3002/api/save-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        const result = await response.json();
        
        console.log('\n📋 Respuesta del servidor:');
        console.log(`   Status: ${response.status}`);
        console.log(`   Success: ${result.success}`);
        console.log(`   Message: ${result.message}`);
        
        if (result.success) {
            console.log('✅ Endpoint funcionando correctamente');
        } else {
            console.log('❌ Error en el endpoint:', result.error);
        }

    } catch (error) {
        console.error('❌ Error en la petición:', error.message);
    }
}

// Simular el timeout de 24 horas
function testTimeoutLogic() {
    console.log('\n⏰ === PRUEBA DE LÓGICA DE TIMEOUT ===\n');

    // Simular diferentes escenarios
    const scenarios = [
        { name: 'Usuario activo (hace 30 min)', lastActivity: Date.now() - (30 * 60 * 1000) },
        { name: 'Usuario algo inactivo (hace 12 horas)', lastActivity: Date.now() - (12 * 60 * 60 * 1000) },
        { name: 'Usuario muy inactivo (hace 25 horas)', lastActivity: Date.now() - (25 * 60 * 60 * 1000) },
        { name: 'Usuario extremadamente inactivo (hace 48 horas)', lastActivity: Date.now() - (48 * 60 * 60 * 1000) }
    ];

    const twentyFourHours = 24 * 60 * 60 * 1000;

    scenarios.forEach((scenario, index) => {
        const now = Date.now();
        const timeDiff = now - scenario.lastActivity;
        const hoursDiff = timeDiff / (60 * 60 * 1000);
        const shouldReset = timeDiff > twentyFourHours;

        console.log(`${index + 1}. ${scenario.name}`);
        console.log(`   ⏱️ Tiempo transcurrido: ${hoursDiff.toFixed(1)} horas`);
        console.log(`   🔄 ¿Debería resetear?: ${shouldReset ? '✅ SÍ' : '❌ NO'}`);
        console.log('');
    });
}

// Menú principal
async function main() {
    console.clear();
    console.log('╔════════════════════════════════════════════╗');
    console.log('║        PRUEBAS DE DESARROLLO LOCAL         ║');
    console.log('╚════════════════════════════════════════════╝');

    console.log('\nOpciones disponibles:');
    console.log('1. 🚀 Iniciar servidor mock y probar endpoint');
    console.log('2. ⏰ Probar lógica de timeout de 24 horas');
    console.log('3. 📋 Mostrar datos que se enviarían al API');
    console.log('4. 🔄 Ejecutar todas las pruebas');
    console.log('5. ❌ Salir');

    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('\nSelecciona una opción (1-5): ', async (answer) => {
        console.log('');

        switch(answer) {
            case '1':
                const server = createMockServer();
                console.log('\n⏳ Esperando 2 segundos para que el servidor inicie...');
                setTimeout(async () => {
                    await testEndpoint();
                    server.close();
                    console.log('\n🛑 Servidor mock cerrado');
                    process.exit(0);
                }, 2000);
                break;

            case '2':
                testTimeoutLogic();
                break;

            case '3':
                const sampleData = {
                    sessionId: 'session-123',
                    workspaceId: 'workspace-456',
                    history: [
                        { id: 'init-1', content: '¡Hola!', role: 'assistant' },
                        { id: 'user-1', content: 'Necesito ayuda', role: 'user' },
                        { id: 'asst-1', content: 'Te puedo ayudar', role: 'assistant' }
                    ]
                };
                console.log('📤 Datos que se enviarían al API:');
                console.log(JSON.stringify(sampleData, null, 2));
                break;

            case '4':
                testTimeoutLogic();
                const server2 = createMockServer();
                setTimeout(async () => {
                    await testEndpoint();
                    server2.close();
                    process.exit(0);
                }, 2000);
                break;

            case '5':
                console.log('👋 ¡Hasta luego!');
                break;

            default:
                console.log('❌ Opción no válida');
        }
        
        if (answer !== '1' && answer !== '4') {
            rl.close();
            process.exit(0);
        }
    });
}

// Ejecutar
main().catch(console.error);