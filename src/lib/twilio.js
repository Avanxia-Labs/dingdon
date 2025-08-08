// app/lib/twilio.js
const twilio = require('twilio');


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// Solo incializamos el cliente si tenemos las credenciales
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

async function sendWhatsAppMessage(to, body) {
    
    if (!client) {
        console.error("Twilio client not initialized. Check env variables")
        return
    }

    if (!twilioWhatsAppNumber) {
        console.error("Twilio WhatsApp number is not configured.")
        return
    }

    try {
        await client.messages.create({
            from: twilioWhatsAppNumber,
            to: to,                            // El numero de whatsapp del usuario
            body: body
        })
        console.log(`Whatsapp message sent to ${to}`)
    } catch (error) {
        console.error(`Failed to send WhatsApp message to ${to}:`, error);
    }



}
 

module.exports = { sendWhatsAppMessage };