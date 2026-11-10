import { NextResponse } from 'next/server';
import { paymentGateway } from '@/lib/payment-gateway';
import { getSupabaseAdmin, isSupabaseConfigured, memoryStore } from '@/lib/supabase';
import { DepositRecord } from '@/types';


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, userId = 'guest_user', userEmail, userName } = body;

    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount < 5000) {
      return NextResponse.json(
        { success: false, message: 'Minimal deposit saldo adalah Rp 5.000' },
        { status: 400 }
      );
    }

    const qrisData = await paymentGateway.createQrisInvoice({
      amount: parsedAmount,
      userId,
      userEmail,
      userName,
    });

    const depositRecord: DepositRecord = {
      id: qrisData.depositId,
      userId,
      amount: qrisData.amount,
      uniqueCode: qrisData.uniqueCode,
      totalPay: qrisData.totalPay,
      status: 'PENDING',
      paymentMethod: 'QRIS',
      qrUrl: qrisData.qrUrl,
      reference: qrisData.reference,
      createdAt: new Date().toISOString(),
    };

    const supabase = getSupabaseAdmin();
    if (isSupabaseConfigured && supabase && userId !== 'guest_user') {
      await supabase.from('deposits').insert({
        id: depositRecord.id,
        user_id: userId,
        amount: depositRecord.amount,
        unique_code: depositRecord.uniqueCode,
        total_pay: depositRecord.totalPay,
        payment_method: depositRecord.paymentMethod,
        qr_url: depositRecord.qrUrl,
        reference: depositRecord.reference,
        status: depositRecord.status,
      });
    } else {
      memoryStore.deposits.set(depositRecord.id, depositRecord);
    }

    return NextResponse.json({
      success: true,
      data: qrisData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Gagal membuat tagihan QRIS' },
      { status: 500 }
    );
  }
}
