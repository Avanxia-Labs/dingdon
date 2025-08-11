// // app/lib/twilio.js
// const twilio = require('twilio');

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// // Solo incializamos el cliente si tenemos las credenciales
// const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

// async function sendWhatsAppMessage(to, body) {

//     if (!client) {
//         console.error("Twilio client not initialized. Check env variables")
//         return
//     }

//     if (!twilioWhatsAppNumber) {
//         console.error("Twilio WhatsApp number is not configured.")
//         return
//     }

//     try {
//         await client.messages.create({
//             from: twilioWhatsAppNumber,
//             to: to,                            // El numero de whatsapp del usuario
//             body: body
//         })
//         console.log(`Whatsapp message sent to ${to}`)
//     } catch (error) {
//         console.error(`Failed to send WhatsApp message to ${to}:`, error);
//     }



// }


// module.exports = { sendWhatsAppMessage };





// app/lib/twilio.js
const twilio = require('twilio');

/**
 * Esta función crea un cliente de Twilio bajo demanda.
 * Recibe el Account SID y el nombre de la config para buscar el Auth Token.
 * @param {*} accountSid 
 * @param {*} configName 
 */
function getTwilioClient(accountSid, configName) {

    // Construye el nombre de la variable de entorno para el Auth Token
    const authTokenEnvVar = `TWILIO_TOKEN_${configName}`;
    const authToken = process.env[authTokenEnvVar];

    if (!authToken) {
        console.error(`Error: La variable de entorno '${authTokenEnvVar}' no está definida.`);
        return null;
    }

    if (accountSid && authToken) {
        return twilio(accountSid, authToken);
    }

    console.error("Error: Faltan el Account SID o el Auth Token para crear el cliente de Twilio.");
    return null;

}


/**
 * La función principal ahora recibe un objeto de configuración completo.
 * @param {*} to 
 * @param {*} body 
 * @param {*} twilioConfig 
 */
async function sendWhatsAppMessage(to, body, twilioConfig) {

    // Si no se proporciona una configuración, no podemos hacer nada.
    if (!twilioConfig || !twilioConfig.account_sid || !twilioConfig.config_name || !twilioConfig.whatsapp_number) {
        console.error("El objeto de configuración de Twilio está incompleto o no se proporcionó. No se puede enviar el mensaje.");
        throw new Error("Invalid Twilio configuration.");
    }

    const client = getTwilioClient(twilioConfig.account_sid, twilioConfig.config_name);

    if (!client) {
        // getTwilioClient ya habrá mostrado un error detallado.
        throw new Error("Failed to initialize Twilio client.");
    }

    try {
        await client.messages.create({
            from: twilioConfig.whatsapp_number,
            to: to,
            body: body
        });
        console.log(`Mensaje de WhatsApp enviado a ${to} usando la configuración '${twilioConfig.config_name}'`);
    } catch (error) {
        console.error(`Fallo al enviar el mensaje de WhatsApp usando la configuración '${twilioConfig.config_name}':`, error);
        throw error; // Re-lanzamos el error para que el llamador sepa que falló.
    }

}

module.exports = { sendWhatsAppMessage };