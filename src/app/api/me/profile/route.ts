// app/api/me/profile/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase/server';

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
            .select('id, name, email') // Pedimos los datos que necesitamos
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