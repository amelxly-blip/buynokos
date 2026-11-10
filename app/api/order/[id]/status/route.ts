import { NextResponse } from 'next/server';
import { smsClient } from '@/lib/sms-provider';
import { getSupabaseAdmin, isSupabaseConfigured, memoryStore } from '@/lib/supabase';


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const providerOrderId = searchParams.get('providerOrderId') || '';
    const createdAtStr = searchParams.get('createdAt') || '';
    const createdAtMs = createdAtStr ? new Date(createdAtStr).getTime() : Date.now() - 5000;

    let order = memoryStore.orders.get(id);
    const supabase = getSupabaseAdmin();

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('orders').select('*').eq('id', id).single();
      if (data) order = data;
    }

    const checkOrderId = providerOrderId || order?.providerOrderId || id;

    // Check with SMS provider
    const checkResult = await smsClient.checkStatus(checkOrderId, createdAtMs);

    if (checkResult.status === 'RECEIVED' && checkResult.code) {
      // Update order with OTP code
      if (order) {
        order.status = 'SMS_RECEIVED';
        order.otpCode = checkResult.code;
        order.fullSms = checkResult.smsText;
      }

      if (isSupabaseConfigured && supabase) {
        await supabase
          .from('orders')
          .update({
            status: 'SMS_RECEIVED',
            otp_code: checkResult.code,
            full_sms: checkResult.smsText,
          })
          .eq('id', id);
      }
    }

    return NextResponse.json({
      success: true,
      status: checkResult.status,
      code: checkResult.code || null,
      smsText: checkResult.smsText || null,
      order,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Gagal mengecek status SMS' },
      { status: 500 }
    );
  }
}
