import { NextResponse } from 'next/server';
import { smsClient } from '@/lib/sms-provider';
import { getSupabaseAdmin, isSupabaseConfigured, memoryStore } from '@/lib/supabase';

export const runtime = 'edge';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const providerOrderId = body.providerOrderId;

    let order = memoryStore.orders.get(id);
    const supabase = getSupabaseAdmin();

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('orders').select('*').eq('id', id).single();
      if (data) order = data;
    }

    if (order && order.status === 'SMS_RECEIVED') {
      return NextResponse.json(
        { success: false, message: 'Nomor tidak dapat dibatalkan karena kode OTP sudah terkirim.' },
        { status: 400 }
      );
    }

    const cancelOrderId = providerOrderId || order?.providerOrderId || id;

    // 1. Cancel on SMS provider side
    await smsClient.cancelOrder(cancelOrderId);

    // 2. Refund balance
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('cancel_and_refund_order', {
        target_order_id: id,
      });
      if (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        message: 'Nomor berhasil dibatalkan dan saldo Anda telah dikembalikan 100%.',
        refund: data,
      });
    }

    // Memory fallback
    if (order) {
      order.status = 'CANCELLED';
      memoryStore.addBalance(order.price);
    }

    return NextResponse.json({
      success: true,
      message: 'Nomor berhasil dibatalkan dan saldo Anda telah dikembalikan 100%.',
      newBalance: memoryStore.getUserBalance(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Gagal membatalkan nomor' },
      { status: 500 }
    );
  }
}
