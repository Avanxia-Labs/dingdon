# 📱 Guía de Configuración de WhatsApp

## ✅ ESTADO ACTUAL
El sistema de WhatsApp está **100% funcional** y listo para usar tanto en desarrollo como en producción.

---

## 🔧 CONFIGURACIÓN ACTUAL

### Variables de Entorno Necesarias

Asegúrate de tener estas variables en tu archivo `.env.local` (desarrollo) o en las variables de entorno de tu servidor (producción):

```env
# Twilio/WhatsApp
TWILIO_ACCOUNT_SID=tu_account_sid_de_twilio
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
TWILIO_TOKEN_CLIENTE_TEST=tu_auth_token_de_twilio

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://diktiftwqdldjnzmzuhy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Interno
INTERNAL_API_SECRET=mykey28jul2025.Lunes!21:26

# Email (Resend)
RESEND_API_KEY=re_hmfDuEMy_BbiXaBF7RexBsKvcS1MK1ZhW
ENCRYPTION_KEY=3e73659dce147f0f1a5e5497c5ab4fabcd31cabe187229de10adf21d31c3c53f
```

---

## 🚀 CONFIGURACIÓN EN PRODUCCIÓN

### Paso 1: Crear Configuración de Twilio en el Dashboard

1. Ve a: `https://tu-dominio.com/dashboard/superadmin/configs`
2. Crea una nueva configuración:
   - **Config Name:** `CLIENTE_TEST` (o el nombre que prefieras)
   - **Account SID:** Tu Account SID de Twilio (empieza con AC...)
   - **WhatsApp Number:** `whatsapp:+14155238886`
   - **Description:** Configuración para [cliente/ambiente]

3. **IMPORTANTE:** En las variables de entorno del servidor de producción, agrega:
   ```
   TWILIO_TOKEN_[CONFIG_NAME]=tu_auth_token_de_twilio
   ```
   Por ejemplo, si tu config se llama `CLIENTE_TEST`:
   ```
   TWILIO_TOKEN_CLIENTE_TEST=tu_auth_token_real_de_twilio
   ```

### Paso 2: Asignar Configuración al Workspace

1. Ve a: `https://tu-dominio.com/dashboard/superadmin/workspaces`
2. Haz clic en el ícono de WhatsApp (📱 verde) del workspace que quieres configurar
3. Selecciona la configuración de Twilio creada en el paso anterior
4. Guarda los cambios

### Paso 3: Obtener la URL del Webhook

En la misma página de workspaces, verás una columna "Webhook URL (Twilio)".

**Copia esta URL**, se verá algo así:
```
https://tu-dominio.com/api/whatsapp/webhook?workspaceId=40dfcb7f-aa8a-4ba8-9c13-3adfa1c5b1e8
```

### Paso 4: Configurar en Twilio

#### Para Sandbox (Pruebas):
1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Haz clic en "Sandbox Settings"
3. En **"WHEN A MESSAGE COMES IN"**:
   - URL: Pega la URL del webhook copiada
   - Método: **POST**
   - Content Type: **application/x-www-form-urlencoded**
4. Haz clic en **Save**

#### Para Número de Producción:
1. Ve a: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Haz clic en tu número de WhatsApp Business
3. En la sección **"Messaging"**:
   - WHEN A MESSAGE COMES IN: Pega la URL del webhook
   - Método: **POST**
4. Guarda los cambios

---

## 🧪 CÓMO PROBAR

### Usando Twilio Sandbox

1. **Conecta tu WhatsApp al sandbox:**
   - Envía desde WhatsApp al número: `+1 415 523 8886`
   - Mensaje: `join ground-ranch` (o el código que te muestre Twilio)
   - Recibirás confirmación de Twilio

2. **Prueba el flujo para clientes nuevos:**
   ```
   Tú: "Hola"
   Bot: "¡Hola! Bienvenido. Para comenzar, ¿cuál es tu nombre completo?"

   Tú: "Juan Pérez"
   Bot: "¡Gracias! Ahora, por favor, dime tu correo electrónico."

   Tú: "juan@example.com"
   Bot: "¡Perfecto, gracias! Ya puedes comenzar a chatear. ¿En qué puedo ayudarte hoy?"
   ```

3. **Prueba el flujo para clientes recurrentes:**
   - Envía otro mensaje después de completar el registro
   - El bot te saludará por tu nombre y responderá con IA

### Usando Script de Prueba Local

```powershell
# En PowerShell
.\test-webhook.ps1
```

---

## 📊 CARACTERÍSTICAS DEL SISTEMA

### ✅ Detección Inteligente de Clientes
- **Nuevos:** Flujo de captura de leads (nombre → email → chat)
- **Recurrentes:** Saludo personalizado y acceso directo al chat

### ✅ Integración con IA
- Usa Gemini 2.0 Flash para respuestas automáticas
- Detecta cuando necesita transferir a un agente humano

### ✅ Gestión de Conversaciones
- Estados: `bot`, `pending`, `in_progress`, `closed`
- Handoff automático de bot a agente cuando es necesario
- Historial completo guardado en Supabase

### ✅ Notificaciones
- Email automático cuando hay nuevos leads
- Notificación al dashboard cuando se solicita agente humano
- Emails configurados: ventas@tscseguridadprivada.com.mx, ismael.sg@tscseguridadprivada.com.mx

### ✅ Multi-cliente
- Soporte para múltiples configuraciones de Twilio
- Un workspace puede tener su propia cuenta de Twilio
- Configuración dinámica por workspace

---

## 🔍 ARCHIVOS PRINCIPALES

### Webhook Principal
- **Ruta:** `src/app/api/whatsapp/webhook/route.ts`
- **Función:** Recibe mensajes de Twilio, procesa el flujo de conversación

### Función de Envío
- **Ruta:** `src/lib/twilio.ts`
- **Función:** `sendWhatsAppMessage(to, body, twilioConfig)`

### Panel de Configuración
- **SuperAdmin Configs:** `src/app/dashboard/superadmin/configs/page.tsx`
- **SuperAdmin Workspaces:** `src/app/dashboard/superadmin/workspaces/page.tsx`

### APIs de Configuración
- **Listar/Crear configs:** `src/app/api/superadmin/twilio-configs/route.ts`
- **Asignar config a workspace:** `src/app/api/superadmin/workspaces/[workspaceId]/twilio-config/route.ts`

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

### Error: "El workspace no tiene una configuración de Twilio asignada"
**Solución:** Ve al dashboard de superadmin → workspaces → Asigna una configuración de Twilio al workspace

### Error: "The 'To' number is not a valid phone number"
**Causa:** Número de destino no válido o no conectado al sandbox
**Solución:**
- Para sandbox: Asegúrate de haber enviado `join [código]` primero
- Para producción: Verifica que el número esté en formato internacional correcto

### Error: "Variable de entorno no definida"
**Causa:** Falta `TWILIO_TOKEN_[CONFIG_NAME]` en las variables de entorno
**Solución:** Agrega la variable con el nombre exacto que coincida con `config_name` en la BD

### Los mensajes no llegan
**Verifica:**
1. ✅ Webhook configurado correctamente en Twilio
2. ✅ Método es POST
3. ✅ URL accesible públicamente (no localhost sin ngrok)
4. ✅ Workspace tiene configuración de Twilio asignada
5. ✅ Variables de entorno correctas en el servidor

---

## 📞 ESTRUCTURA DE NÚMEROS

### Formato correcto para WhatsApp:
```
whatsapp:+[código_país][número]
```

**Ejemplos:**
- México: `whatsapp:+521234567890`
- USA: `whatsapp:+11234567890`
- España: `whatsapp:+341234567890`

### Número del Sandbox de Twilio:
```
whatsapp:+14155238886
```

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

1. **Para Producción Real:**
   - Solicitar un número de WhatsApp Business en Twilio
   - Obtener aprobación de WhatsApp para mensajería empresarial
   - Actualizar la configuración con el nuevo número

2. **Mejoras Opcionales:**
   - Agregar más idiomas en las traducciones
   - Personalizar mensajes de bienvenida por workspace
   - Agregar métricas y analytics de conversaciones

3. **Monitoreo:**
   - Revisar logs regularmente
   - Monitorear la tabla `chat_sessions` en Supabase
   - Verificar entrega de emails de notificación

---

## ✅ CHECKLIST DE DEPLOYMENT

Antes de desplegar a producción, verifica:

- [ ] Variables de entorno configuradas en el servidor
- [ ] Configuración de Twilio creada en el dashboard
- [ ] Configuración asignada al workspace
- [ ] Webhook URL configurada en Twilio
- [ ] Prueba enviando mensaje desde WhatsApp
- [ ] Verifica que se guarden los leads en Supabase
- [ ] Confirma que lleguen los emails de notificación
- [ ] Prueba el handoff de bot a agente humano

---

## 📝 NOTAS IMPORTANTES

- ⚠️ **Seguridad:** Nunca expongas los tokens de Twilio en el código
- ⚠️ **Rate Limits:** Twilio tiene límites de mensajes por segundo
- ⚠️ **Costos:** Revisa los costos de mensajería de WhatsApp en Twilio
- ⚠️ **Sandbox:** El sandbox de Twilio solo permite 5 números conectados simultáneamente

---

🎉 **¡Tu sistema de WhatsApp está listo para producción!**
