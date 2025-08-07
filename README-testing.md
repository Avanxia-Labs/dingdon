# 🧪 Guía de Pruebas - Sistema de Historial de Chat

Esta guía te ayudará a probar localmente la funcionalidad de guardado de historial antes de resetear el Store.

## 📋 Scripts de Prueba Disponibles

### 1. **Prueba Completa con Base de Datos** (`test-chat-history.js`)
**Propósito**: Prueba real contra Supabase para verificar que todo funciona en producción.

```bash
node test-chat-history.js
```

**Funciones**:
- ✅ Guarda historial de prueba en Supabase real
- ✅ Verifica que se marcó como "BOT" 
- ✅ Simula timeout de 24 horas
- ✅ Muestra sesiones existentes del BOT
- ✅ Limpia datos de prueba automáticamente

### 2. **Prueba de API Local** (`test-api-endpoint.js`)
**Propósito**: Simula el endpoint `/api/save-history` localmente sin tocar la base de datos.

```bash
node test-api-endpoint.js
```

**Funciones**:
- 🚀 Servidor mock en puerto 3002
- 📡 Prueba el endpoint POST `/api/save-history`
- ⏰ Simula lógica de timeout de 24 horas
- 📊 Muestra qué datos se enviarían al API

## 🔧 Cómo Usar las Pruebas

### Opción 1: Prueba Rápida (Sin Base de Datos)
```bash
# Ejecuta el servidor mock y pruebas básicas
node test-api-endpoint.js
# Selecciona opción 4 para ejecutar todas las pruebas
```

### Opción 2: Prueba Completa (Con Supabase)
```bash
# Ejecuta pruebas reales contra la base de datos
node test-chat-history.js
# Selecciona opción 4 para ejecutar todas las pruebas
```

## 📊 Qué Verifican las Pruebas

### ✅ Funcionalidad Básica
- [x] Validación de datos de entrada
- [x] Filtrado de mensajes significativos (excluye `init-1`)
- [x] Marcado correcto como conversación del "BOT"
- [x] Formato correcto de datos guardados

### ✅ Lógica de Timeout
- [x] Cálculo correcto de 24 horas (86,400,000 ms)
- [x] Detección de inactividad
- [x] Decisión de guardar o no guardar

### ✅ Integración con Supabase
- [x] Conexión a la base de datos
- [x] Operación `upsert` correcta
- [x] Verificación de datos guardados
- [x] Consulta de sesiones existentes

## 🎯 Casos de Prueba Cubiertos

| Escenario | Descripción | Resultado Esperado |
|-----------|-------------|-------------------|
| **Conversación vacía** | Solo mensaje inicial | ❌ No se guarda |
| **Conversación real** | Mensajes del usuario + BOT | ✅ Se guarda como BOT |
| **30 min inactivo** | Última actividad hace 30 min | ❌ No resetea |
| **25 horas inactivo** | Última actividad hace 25 horas | ✅ Resetea y guarda |
| **Datos incompletos** | Falta sessionId o workspaceId | ❌ Error 400 |

## 🚨 Resultados Esperados

### Al ejecutar `test-chat-history.js`:
```
✅ Historial guardado exitosamente
✅ Verificación exitosa
📊 Datos guardados:
   - Agente asignado: BOT (BOT ✓)
   - Status: closed
   - Mensajes guardados: 5
```

### Al ejecutar `test-api-endpoint.js`:
```
✅ Endpoint funcionando correctamente
📋 Respuesta del servidor:
   Status: 200
   Success: true
   Message: Historial guardado exitosamente (simulado)
```

## 🔍 Debugging

### Si las pruebas fallan:

1. **Error de conexión a Supabase**:
   ```
   ❌ Error: Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY
   ```
   **Solución**: Verifica que tu `.env.local` tenga las variables correctas.

2. **Error 400 en API**:
   ```
   ❌ Error: Datos insuficientes
   ```
   **Solución**: El sessionId, workspaceId o history están vacíos.

3. **No se guarda el historial**:
   ```
   ℹ️ Solo mensaje inicial, no se guarda
   ```
   **Solución**: Es normal, significa que no hay conversación real.

## 🎮 Ejemplo de Uso Interactivo

```bash
$ node test-chat-history.js

╔════════════════════════════════════════════╗
║     PRUEBA DE SISTEMA DE HISTORIAL CHAT    ║
╚════════════════════════════════════════════╝

Opciones de prueba:
1. Probar guardado de historial (crear sesión de prueba)
2. Simular timeout de 24 horas  
3. Ver sesiones existentes del BOT
4. Ejecutar todas las pruebas
5. Salir

Selecciona una opción (1-5): 4
```

## 🧹 Limpieza

Los scripts limpian automáticamente los datos de prueba, pero si necesitas limpiar manualmente:

```sql
-- Eliminar sesiones de prueba
DELETE FROM chat_sessions 
WHERE assigned_agent_id = 'BOT' 
AND id LIKE 'test-%';
```

## ✨ Tips

1. **Usa la opción 4** para ejecutar todas las pruebas de una vez
2. **Presiona Ctrl+C** durante la limpieza si quieres mantener los datos de prueba
3. **Revisa la consola** para ver logs detallados de cada paso
4. **Cambia el `testWorkspaceId`** en el script por un workspace real si lo tienes