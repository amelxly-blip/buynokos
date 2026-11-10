import { NextResponse } from 'next/server';
import { paymentGateway } from '@/lib/payment-gateway';
import { getSupabaseAdmin, isSupabaseConfigured, memoryStore } from '@/lib/supabase';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const signature = request.headers.get('x-callback-signature') || '';

    // Verify webhook authenticity
    const isValid = paymentGateway.verifyWebhook(payload, signature);
    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 403 });
    }

    // Extract reference / deposit ID
    const depositId =
      payload.order_id ||
      payload.ref_id ||
      payload.merchant_ref ||
      payload.depositId ||
      payload.reference;

    if (!depositId) {
      return NextResponse.json({ success: false, message: 'Missing deposit ID' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('mark_deposit_paid', {
        target_deposit_id: depositId,
      });
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, result: data });
    }

    // Memory simulation fallback
    const deposit = memoryStore.deposits.get(depositId);
    if (deposit) {
      deposit.status = 'PAID';
      deposit.paidAt = new Date().toISOString();
      memoryStore.addBalance(deposit.amount);
    }

    return NextResponse.json({
      success: true,
      message: 'Deposit berhasil diproses dan saldo telah bertambah.',
      newBalance: memoryStore.getUserBalance(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Gagal memproses webhook deposit' },
      { status: 500 }
    );
  }
}
