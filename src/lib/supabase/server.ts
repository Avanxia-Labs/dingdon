// app/lib/supabase/server.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

// Este cliente usa la clave de SERVICIO SECRETA y SOLO debe usarse en el backend.
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey)