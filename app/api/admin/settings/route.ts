import { NextResponse } from 'next/server';
import { DEFAULT_PRICING_RULE } from '@/lib/pricing';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';


export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('settings').select('*').eq('key', 'pricing_rule').single();
      if (data?.value) {
        return NextResponse.json({ success: true, settings: data.value });
      }
    }

    return NextResponse.json({
      success: true,
      settings: DEFAULT_PRICING_RULE,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { markupPercent, fixedMarkupIdr, minPriceIdr } = body;

    const newRules = {
      markupPercent: Number(markupPercent) || 35,
      fixedMarkupIdr: Number(fixedMarkupIdr) || 500,
      minPriceIdr: Number(minPriceIdr) || 1500,
    };

    const supabase = getSupabaseAdmin();
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('settings')
        .upsert({ key: 'pricing_rule', value: newRules, updated_at: new Date().toISOString() });
    }

    return NextResponse.json({
      success: true,
      message: 'Aturan markup harga berhasil disimpan!',
      settings: newRules,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
