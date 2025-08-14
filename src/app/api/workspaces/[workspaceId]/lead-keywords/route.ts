// src/app/api/workspaces/[workspaceId]/lead-keywords/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';


/**
 * GET: Obtener keywords de clasificación por categoría o todas
 * Query params:
 * - category: 'hot' | 'warm' | 'cold' (opcional, si no se especifica devuelve todas)
 * - language: 'es' | 'en' (opcional, filtra por idioma detectado)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { workspaceId } = params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const language = searchParams.get('language') as 'es' | 'en' | null;

    console.log(`[KEYWORDS] GET - Workspace: ${workspaceId}, Category: ${category || 'all'}, Language: ${language || 'all'}`);

    // Construir query base
    let query = supabaseAdmin
      .from('lead_keywords')
      .select('id, keyword, category, language, created_at, created_by')
      .eq('workspace_id', workspaceId)
      .order('category', { ascending: true })
      .order('created_at', { ascending: true });

    // Filtrar por categoría si se especifica
    if (category && ['hot', 'warm', 'cold'].includes(category)) {
      query = query.eq('category', category);
    }

    // Filtrar por idioma si se especifica usando la columna language
    if (language && ['es', 'en'].includes(language)) {
      query = query.eq('language', language);
    }

    const { data: keywords, error } = await query;

    if (error) {
      console.error('Error obteniendo keywords:', error);
      return NextResponse.json(
        { error: 'Error obteniendo keywords' },
        { status: 500 }
      );
    }

    // Organizar por categoría para facilitar uso en frontend
    const keywordsByCategory = {
      hot: keywords.filter(k => k.category === 'hot').map(k => k.keyword),
      warm: keywords.filter(k => k.category === 'warm').map(k => k.keyword),
      cold: keywords.filter(k => k.category === 'cold').map(k => k.keyword)
    };

    console.log(`[KEYWORDS] Found - Hot: ${keywordsByCategory.hot.length}, Warm: ${keywordsByCategory.warm.length}, Cold: ${keywordsByCategory.cold.length}`);

    return NextResponse.json({
      success: true,
      keywords: category ? keywords.map(k => k.keyword) : keywordsByCategory,
      raw: keywords
    });

  } catch (error) {
    console.error('Error en endpoint keywords GET:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST: Agregar nueva keyword
 * Body: { keyword: string, category: 'hot' | 'warm' | 'cold', language: 'es' | 'en' }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { workspaceId } = params;
    const { keyword, category, language = 'es' } = await request.json();

    if (!keyword || !category) {
      return NextResponse.json(
        { error: 'keyword y category son requeridos' },
        { status: 400 }
      );
    }

    if (!['hot', 'warm', 'cold'].includes(category)) {
      return NextResponse.json(
        { error: 'category debe ser hot, warm o cold' },
        { status: 400 }
      );
    }

    if (!['es', 'en'].includes(language)) {
      return NextResponse.json(
        { error: 'language debe ser es o en' },
        { status: 400 }
      );
    }

    console.log(`[KEYWORDS] POST - Adding "${keyword}" as ${category} (${language}) to workspace ${workspaceId}`);

    // Normalizar keyword (trim y lowercase para comparación)
    const normalizedKeyword = keyword.trim().toLowerCase();

    const { data: newKeyword, error } = await supabaseAdmin
      .from('lead_keywords')
      .insert({
        workspace_id: workspaceId,
        keyword: normalizedKeyword,
        category: category,
        language: language,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Esta keyword ya existe en esta categoría' },
          { status: 409 }
        );
      }
      console.error('Error insertando keyword:', error);
      return NextResponse.json(
        { error: 'Error agregando keyword' },
        { status: 500 }
      );
    }

    console.log(`[KEYWORDS] Added successfully:`, newKeyword);

    return NextResponse.json({
      success: true,
      keyword: newKeyword,
      message: 'Keyword agregada exitosamente'
    });

  } catch (error) {
    console.error('Error en endpoint keywords POST:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Eliminar keyword
 * Body: { keyword: string, category: 'hot' | 'warm' | 'cold' }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { workspaceId } = params;
    const { keyword, category } = await request.json();

    if (!keyword || !category) {
      return NextResponse.json(
        { error: 'keyword y category son requeridos' },
        { status: 400 }
      );
    }

    console.log(`[KEYWORDS] DELETE - Removing "${keyword}" (${category}) from workspace ${workspaceId}`);

    const { error } = await supabaseAdmin
      .from('lead_keywords')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('keyword', keyword.trim().toLowerCase())
      .eq('category', category);

    if (error) {
      console.error('Error eliminando keyword:', error);
      return NextResponse.json(
        { error: 'Error eliminando keyword' },
        { status: 500 }
      );
    }

    console.log(`[KEYWORDS] Deleted successfully: ${keyword} (${category})`);

    return NextResponse.json({
      success: true,
      message: 'Keyword eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error en endpoint keywords DELETE:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}