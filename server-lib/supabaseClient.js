const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL or Service Key is missing in your .env.local file");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;