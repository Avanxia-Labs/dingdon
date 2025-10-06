// app/api/me/profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

// Funcion para obtener los datos del perfil
export async function GET(request: Request) {
    try {
        // Obtenemos la sesión para saber quién está haciendo la petición
        const session = await getServerSession(authOptions);

        // Si no hay sesión o no hay ID de usuario, no está autorizado
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Buscamos el perfil en nuestra tabla 'profiles' usando el ID de la sesión
        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('id, name, email, avatar_url') // Pedimos los datos que necesitamos
            .eq('id', session.user.id)
            .single();

        if (error || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json(profile);

    } catch (e) {
        console.error("Error fetching user profile:", e);
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }
}


// Funcion para actualizar los cambios en el perfil
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {name, avatar_url} = await request.json()

        const dataToUpdate: { 
            name?: string; 
            avatar_url?: string 
        } = {};
        
        if (name) dataToUpdate.name = name;
        
        if (typeof avatar_url !== 'undefined') dataToUpdate.avatar_url = avatar_url;

        // Si no hay nada que actualizar, devolvemos un éxito temprano
        if (Object.keys(dataToUpdate).length === 0) {
            return NextResponse.json({ success: true, message: 'No changes to update.' });
        }

        // Actualizamos la fila en la tabla 'profiles'
        const { error } = await supabaseAdmin
            .from('profiles')
            .update(dataToUpdate)
            .eq('id', session.user.id);

        if (error) {
            throw error; // El catch se encargará de esto
        }

        return NextResponse.json({ success: true, message: 'Profile updated successfully.' });

    } catch (error) {
        console.error("Error updating user profile:", error);
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }
}