// Script para verificar la configuración de Twilio para el workspace
// Ejecutar con: node check-twilio-config.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WORKSPACE_ID = '40dfcb7f-aa8a-4ba8-9c13-3adfa1c5b1e8';

async function checkConfiguration() {
    console.log('🔍 Verificando configuración de Twilio para el workspace...\n');

    // 1. Verificar workspace
    const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .select(`
            id,
            name,
            twilio_config_id,
            twilio_configs (
                id,
                config_name,
                account_sid,
                whatsapp_number,
                description
            )
        `)
        .eq('id', WORKSPACE_ID)
        .single();

    if (wsError) {
        console.error('❌ Error al buscar el workspace:', wsError.message);
        return;
    }

    if (!workspace) {
        console.error('❌ No se encontró el workspace con ID:', WORKSPACE_ID);
        return;
    }

    console.log('✅ Workspace encontrado:');
    console.log(`   - Nombre: ${workspace.name}`);
    console.log(`   - ID: ${workspace.id}`);
    console.log(`   - Twilio Config ID: ${workspace.twilio_config_id || 'NO ASIGNADO ⚠️'}\n`);

    // 2. Verificar configuración de Twilio
    if (!workspace.twilio_config_id) {
        console.error('❌ PROBLEMA: El workspace NO tiene una configuración de Twilio asignada');
        console.log('   Solución: Ve al dashboard de superadmin y asigna una configuración\n');
        return;
    }

    const twilioConfig = workspace.twilio_configs;
    if (!twilioConfig) {
        console.error('❌ PROBLEMA: La configuración de Twilio no existe en la BD');
        return;
    }

    console.log('✅ Configuración de Twilio encontrada:');
    console.log(`   - Config Name: ${twilioConfig.config_name}`);
    console.log(`   - Account SID: ${twilioConfig.account_sid}`);
    console.log(`   - WhatsApp Number: ${twilioConfig.whatsapp_number}`);
    console.log(`   - Description: ${twilioConfig.description || 'N/A'}\n`);

    // 3. Verificar variable de entorno del token
    const tokenEnvVar = `TWILIO_TOKEN_${twilioConfig.config_name}`;
    const tokenExists = !!process.env[tokenEnvVar];

    if (tokenExists) {
        console.log(`✅ Variable de entorno encontrada: ${tokenEnvVar}`);
        console.log(`   - Valor: ${process.env[tokenEnvVar].substring(0, 10)}...`);
    } else {
        console.error(`❌ PROBLEMA: No existe la variable de entorno '${tokenEnvVar}'`);
        console.log('   Solución: Agrega esta variable en tu servidor de producción\n');
    }

    // 4. URL del webhook
    console.log('\n📱 URL del Webhook para configurar en Twilio:');
    console.log(`   https://TU-DOMINIO/api/whatsapp/webhook?workspaceId=${WORKSPACE_ID}\n`);

    // 5. Verificar sesiones recientes
    const { data: sessions, error: sessError } = await supabase
        .from('chat_sessions')
        .select('id, created_at, status, channel, user_identifier, conversation_state')
        .eq('workspace_id', WORKSPACE_ID)
        .order('created_at', { ascending: false })
        .limit(5);

    if (!sessError && sessions && sessions.length > 0) {
        console.log('📋 Últimas 5 sesiones de chat:');
        sessions.forEach((s, i) => {
            console.log(`   ${i + 1}. ${s.created_at} - ${s.channel} - Status: ${s.status} - State: ${s.conversation_state || 'N/A'}`);
            console.log(`      User: ${s.user_identifier}`);
        });
    } else {
        console.log('⚠️  No se encontraron sesiones recientes para este workspace');
    }

    console.log('\n✅ Diagnóstico completado');
}

checkConfiguration().catch(console.error);
