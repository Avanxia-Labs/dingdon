 // test-chat-history.js
// Script de prueba para verificar el guardado de historial de chat

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Error: Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

// Función para simular el guardado de historial
async function testSaveHistory() {
    console.log(`\n${colors.bright}${colors.blue}=== PRUEBA DE GUARDADO DE HISTORIAL DE CHAT ===${colors.reset}\n`);

    // 1. Crear datos de prueba (UUID válidos)
    const { v4: uuidv4 } = require('uuid');
    const testSessionId = uuidv4(); // UUID válido para session
    const testWorkspaceId = '2236394b-c005-4823-b25d-0c07a2c2a300'; // Usar workspace existente
    
    const testHistory = [
        {
            id: 'init-1',
            content: '¡Hola! Soy Asistente Virtual. ¿Cómo puedo ayudarte hoy?',
            role: 'assistant',
            timestamp: new Date(Date.now() - 3600000).toISOString() // Hace 1 hora
        },
        {
            id: 'user-1',
            content: 'Hola, necesito información sobre pagos',
            role: 'user',
            timestamp: new Date(Date.now() - 3500000).toISOString()
        },
        {
            id: 'assistant-2',
            content: 'Claro, te puedo ayudar con información sobre pagos. ¿Qué necesitas saber específicamente?',
            role: 'assistant',
            timestamp: new Date(Date.now() - 3400000).toISOString()
        },
        {
            id: 'user-2',
            content: '¿Cuáles son los métodos de pago disponibles?',
            role: 'user',
            timestamp: new Date(Date.now() - 3300000).toISOString()
        },
        {
            id: 'assistant-3',
            content: 'Aceptamos tarjetas de crédito/débito, transferencias ACH y varios métodos de pago digital.',
            role: 'assistant',
            timestamp: new Date(Date.now() - 3200000).toISOString()
        }
    ];

    console.log(`${colors.cyan}📝 Datos de prueba:${colors.reset}`);
    console.log(`   - Session ID: ${colors.yellow}${testSessionId}${colors.reset}`);
    console.log(`   - Workspace ID: ${colors.yellow}${testWorkspaceId}${colors.reset}`);
    console.log(`   - Mensajes en historial: ${colors.yellow}${testHistory.length}${colors.reset}`);
    console.log(`   - Mensajes significativos: ${colors.yellow}${testHistory.filter(m => m.id !== 'init-1').length}${colors.reset}\n`);

    // 2. Intentar guardar en la base de datos
    console.log(`${colors.cyan}💾 Guardando en la base de datos...${colors.reset}`);
    
    try {
        const { data, error } = await supabase
            .from('chat_sessions')
            .upsert({
                id: testSessionId,
                workspace_id: testWorkspaceId,
                status: 'closed',
                history: testHistory,
                assigned_agent_id: null, // NULL = conversación del BOT
                ended_at: new Date().toISOString(),
                created_at: new Date(Date.now() - 3600000).toISOString()
            }, {
                onConflict: 'id'
            });

        if (error) {
            console.error(`${colors.red}❌ Error al guardar:${colors.reset}`, error.message);
            return;
        }

        console.log(`${colors.green}✅ Historial guardado exitosamente${colors.reset}\n`);

        // 3. Verificar que se guardó correctamente
        console.log(`${colors.cyan}🔍 Verificando el guardado...${colors.reset}`);
        
        const { data: verifyData, error: verifyError } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('id', testSessionId)
            .single();

        if (verifyError) {
            console.error(`${colors.red}❌ Error al verificar:${colors.reset}`, verifyError.message);
            return;
        }

        console.log(`${colors.green}✅ Verificación exitosa${colors.reset}`);
        console.log(`\n${colors.bright}📊 Datos guardados:${colors.reset}`);
        console.log(`   - ID: ${colors.yellow}${verifyData.id}${colors.reset}`);
        console.log(`   - Status: ${colors.yellow}${verifyData.status}${colors.reset}`);
        console.log(`   - Agente asignado: ${colors.yellow}${verifyData.assigned_agent_id || 'NULL'}${colors.reset} ${colors.green}(BOT ✓)${colors.reset}`);
        console.log(`   - Mensajes guardados: ${colors.yellow}${verifyData.history?.length || 0}${colors.reset}`);
        console.log(`   - Creado: ${colors.yellow}${new Date(verifyData.created_at).toLocaleString()}${colors.reset}`);
        console.log(`   - Cerrado: ${colors.yellow}${new Date(verifyData.ended_at).toLocaleString()}${colors.reset}`);

        // 4. Mostrar el historial guardado
        console.log(`\n${colors.bright}💬 Historial de conversación:${colors.reset}`);
        verifyData.history.forEach((msg, index) => {
            const roleColor = msg.role === 'user' ? colors.blue : colors.green;
            const roleEmoji = msg.role === 'user' ? '👤' : '🤖';
            console.log(`   ${roleEmoji} ${roleColor}[${msg.role}]${colors.reset}: ${msg.content.substring(0, 60)}...`);
        });

        // 5. Opcional: Limpiar datos de prueba
        console.log(`\n${colors.cyan}🧹 ¿Deseas eliminar los datos de prueba? (Presiona Ctrl+C para mantenerlos)${colors.reset}`);
        console.log(`${colors.yellow}   Esperando 5 segundos antes de limpiar...${colors.reset}`);
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const { error: deleteError } = await supabase
            .from('chat_sessions')
            .delete()
            .eq('id', testSessionId);

        if (deleteError) {
            console.error(`${colors.red}❌ Error al limpiar:${colors.reset}`, deleteError.message);
        } else {
            console.log(`${colors.green}✅ Datos de prueba eliminados${colors.reset}`);
        }

    } catch (error) {
        console.error(`${colors.red}❌ Error inesperado:${colors.reset}`, error);
    }
}

// Función para simular timeout de 24 horas
async function testInactivityTimeout() {
    console.log(`\n${colors.bright}${colors.blue}=== PRUEBA DE TIMEOUT DE INACTIVIDAD (24 HORAS) ===${colors.reset}\n`);

    const now = Date.now();
    const lastActivity = now - (25 * 60 * 60 * 1000); // 25 horas atrás
    const twentyFourHours = 24 * 60 * 60 * 1000;

    console.log(`${colors.cyan}⏰ Simulando inactividad:${colors.reset}`);
    console.log(`   - Última actividad: ${colors.yellow}${new Date(lastActivity).toLocaleString()}${colors.reset}`);
    console.log(`   - Tiempo actual: ${colors.yellow}${new Date(now).toLocaleString()}${colors.reset}`);
    console.log(`   - Tiempo transcurrido: ${colors.yellow}${((now - lastActivity) / (60 * 60 * 1000)).toFixed(1)} horas${colors.reset}`);
    console.log(`   - Límite de inactividad: ${colors.yellow}24 horas${colors.reset}`);

    if (now - lastActivity > twentyFourHours) {
        console.log(`\n${colors.green}✅ Se detectó inactividad mayor a 24 horas${colors.reset}`);
        console.log(`${colors.yellow}→ El sistema debería guardar el historial y reiniciar el chat${colors.reset}`);
    } else {
        console.log(`\n${colors.blue}ℹ️ Aún no han pasado 24 horas de inactividad${colors.reset}`);
    }
}

// Función para verificar sesiones existentes del BOT
async function checkExistingBotSessions() {
    console.log(`\n${colors.bright}${colors.blue}=== VERIFICANDO SESIONES EXISTENTES DEL BOT ===${colors.reset}\n`);

    try {
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('id, workspace_id, status, assigned_agent_id, created_at, ended_at')
            .is('assigned_agent_id', null) // Buscar sesiones del BOT (assigned_agent_id = NULL)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error(`${colors.red}❌ Error al buscar sesiones:${colors.reset}`, error.message);
            return;
        }

        if (!data || data.length === 0) {
            console.log(`${colors.yellow}ℹ️ No se encontraron sesiones del BOT (assigned_agent_id = NULL)${colors.reset}`);
            return;
        }

        console.log(`${colors.green}✅ Se encontraron ${data.length} sesiones del BOT (assigned_agent_id = NULL):${colors.reset}\n`);
        
        data.forEach((session, index) => {
            console.log(`${colors.cyan}📋 Sesión ${index + 1}:${colors.reset}`);
            console.log(`   - ID: ${colors.yellow}${session.id}${colors.reset}`);
            console.log(`   - Workspace: ${colors.yellow}${session.workspace_id}${colors.reset}`);
            console.log(`   - Status: ${colors.yellow}${session.status}${colors.reset}`);
            console.log(`   - Creada: ${colors.yellow}${new Date(session.created_at).toLocaleString()}${colors.reset}`);
            if (session.ended_at) {
                console.log(`   - Cerrada: ${colors.yellow}${new Date(session.ended_at).toLocaleString()}${colors.reset}`);
            }
            console.log('');
        });

    } catch (error) {
        console.error(`${colors.red}❌ Error inesperado:${colors.reset}`, error);
    }
}

// Menú principal
async function main() {
    console.clear();
    console.log(`${colors.bright}${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}║     PRUEBA DE SISTEMA DE HISTORIAL CHAT    ║${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}`);

    console.log(`\n${colors.bright}Opciones de prueba:${colors.reset}`);
    console.log(`${colors.green}1.${colors.reset} Probar guardado de historial (crear sesión de prueba)`);
    console.log(`${colors.green}2.${colors.reset} Simular timeout de 24 horas`);
    console.log(`${colors.green}3.${colors.reset} Ver sesiones existentes del BOT`);
    console.log(`${colors.green}4.${colors.reset} Ejecutar todas las pruebas`);
    console.log(`${colors.red}5.${colors.reset} Salir`);

    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question(`\n${colors.cyan}Selecciona una opción (1-5): ${colors.reset}`, async (answer) => {
        console.log('');
        
        switch(answer) {
            case '1':
                await testSaveHistory();
                break;
            case '2':
                await testInactivityTimeout();
                break;
            case '3':
                await checkExistingBotSessions();
                break;
            case '4':
                await testSaveHistory();
                await testInactivityTimeout();
                await checkExistingBotSessions();
                break;
            case '5':
                console.log(`${colors.green}👋 ¡Hasta luego!${colors.reset}`);
                break;
            default:
                console.log(`${colors.red}❌ Opción no válida${colors.reset}`);
        }
        
        rl.close();
        process.exit(0);
    });
}

// Ejecutar
main().catch(console.error);