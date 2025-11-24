# Variables de Entorno Requeridas en Render

Ve a tu servicio en Render: https://dashboard.render.com/

Navega a: **Tu Servicio → Environment → Environment Variables**

## ⚠️ Variables CRÍTICAS para WhatsApp:

```env
# Twilio - CRÍTICO
TWILIO_ACCOUNT_SID=tu_account_sid_de_twilio
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_TOKEN_CLIENTE_TEST=tu_auth_token_de_twilio

# Supabase - CRÍTICO
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# API Interna - CRÍTICO
INTERNAL_API_SECRET=tu_internal_api_secret

# Gemini (para IA)
GEMINI_API_KEY=tu_gemini_api_key

# Email
RESEND_API_KEY=tu_resend_api_key
ENCRYPTION_KEY=tu_encryption_key_32_bytes

# NextAuth
NEXTAUTH_SECRET=tu_nextauth_secret
NEXTAUTH_URL=https://dindon.onrender.com
```

## ⚠️ Variables Específicas para Render:

```env
# WebSocket (IMPORTANTE para Render)
NEXT_PUBLIC_WEBSOCKET_URL=https://dindon.onrender.com
CLIENT_ORIGIN_URL=https://dindon.onrender.com

# Puerto (Render lo asigna automáticamente)
PORT=3001
```

## 🔍 Cómo Verificar:

1. Ve a: https://dashboard.render.com/
2. Selecciona tu servicio "dindon"
3. En el menú izquierdo, haz clic en **"Environment"**
4. Compara con la lista de arriba
5. **Agrega las que falten** (especialmente `TWILIO_TOKEN_CLIENTE_TEST`)

## 🚨 Variable MÁS IMPORTANTE:

La variable **`TWILIO_TOKEN_CLIENTE_TEST`** es la que el código busca para enviar mensajes.
Si esta no existe, el webhook fallará con error 500.

**Nota:** Los valores reales de estas variables se encuentran en tu archivo `.env.local` local.
Copia los valores de ahí a las variables de entorno de Render.
