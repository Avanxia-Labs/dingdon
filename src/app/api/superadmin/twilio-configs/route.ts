// app/api/superadmin/twilio-configs/route.ts

/**
 * Esta API se encargará de la tabla twilio_configs. 
 * El frontend la usará para llenar el <select> y para añadir nuevas configuraciones a la lista.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { error } from "console";

// Funcion GET: Obtener la lista de todas las configuraciones de TWILIO
export async function GET(req: NextRequest) {
    
    const session = await getServerSession(authOptions)
    
    if (session?.user.role !== 'superadmin') {
        return NextResponse.json({error: 'Unauthorized'}, { status: 403 });
    }

    try {
        const {data, error} = await supabaseAdmin
            .from('twilio_configs')
            .select('id, config_name, descrpition');
        
        if (error) throw error;
        
        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch Twilio configurations' }, { status: 500 });
    }
}

// --- FUNCIÓN POST: Crear una nueva configuración de Twilio ---
export async function POST(req: NextRequest) {
    
    const session = await getServerSession(authOptions);
    
    if (session?.user?.role !== 'superadmin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { config_name, account_sid, whatsapp_number, description } = await req.json();

        if (!config_name || !account_sid || !whatsapp_number) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('twilio_configs')
            .insert({ config_name, account_sid, whatsapp_number, description })
            .select()
            .single();

        if (error) throw error;
        
        return NextResponse.json(data);
    } catch (error: any) {
        // Manejar error de nombre duplicado
        if (error.code === '23505') { // Código de violación de unicidad de PostgreSQL
             return NextResponse.json({ error: 'A configuration with this name already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create Twilio configuration' }, { status: 500 });
    }
}