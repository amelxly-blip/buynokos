import { NextResponse } from 'next/server';
import { smsClient, POPULAR_SERVICES, POPULAR_COUNTRIES } from '@/lib/sms-provider';
import { getSupabaseAdmin, isSupabaseConfigured, memoryStore } from '@/lib/supabase';
import { NokosOrder } from '@/types';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serviceCode, countryId, userId = 'guest_user' } = body;

    if (!serviceCode || !countryId) {
      return NextResponse.json(
        { success: false, message: 'Layanan dan negara wajib dipilih' },
        { status: 400 }
      );
    }

    const service = POPULAR_SERVICES.find((s) => s.code === serviceCode) || {
      name: serviceCode.toUpperCase(),
      code: serviceCode,
    };
    const country = POPULAR_COUNTRIES.find((c) => c.id === countryId) || POPULAR_COUNTRIES[0];

    // Check user balance
    let userBalance = memoryStore.getUserBalance();
    const supabase = getSupabaseAdmin();

    if (isSupabaseConfigured && supabase && userId !== 'guest_user') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();
      if (profile) userBalance = profile.balance;
    }

    // Call SMS provider to order the number
    const result = await smsClient.orderNumber(serviceCode, countryId);

    if (userBalance < result.finalPriceIdr) {
      // Release number back if insufficient balance
      await smsClient.cancelOrder(result.orderId);
      return NextResponse.json(
        {
          success: false,
          message: `Saldo tidak mencukupi. Harga: Rp ${result.finalPriceIdr.toLocaleString('id-ID')}, Saldo Anda: Rp ${userBalance.toLocaleString('id-ID')}. Silakan isi saldo via QRIS.`,
        },
        { status: 402 }
      );
    }

    const profit = Math.max(0, result.finalPriceIdr - result.costIdr);
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();

    const newOrder: NokosOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      serviceCode,
      serviceName: service.name,
      countryCode: country.code,
      countryName: country.name,
      phoneNumber: result.phoneNumber,
      providerOrderId: result.orderId,
      price: result.finalPriceIdr,
      cost: result.costIdr,
      profit,
      status: 'PENDING_SMS',
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    // Save order & deduct balance
    if (isSupabaseConfigured && supabase && userId !== 'guest_user') {
      await supabase.from('orders').insert({
        id: newOrder.id,
        user_id: userId,
        service_code: newOrder.serviceCode,
        service_name: newOrder.serviceName,
        country_code: newOrder.countryCode,
        country_name: newOrder.countryName,
        phone_number: newOrder.phoneNumber,
        provider_order_id: newOrder.providerOrderId,
        price: newOrder.price,
        cost: newOrder.cost,
        profit: newOrder.profit,
        status: newOrder.status,
        expires_at: newOrder.expiresAt,
      });

      // Deduct balance
      await supabase.rpc('decrement_balance', { user_id: userId, amount: newOrder.price });
    } else {
      memoryStore.deductBalance(newOrder.price);
      memoryStore.orders.set(newOrder.id, newOrder);
    }

    return NextResponse.json({
      success: true,
      message: 'Nomor virtual berhasil didapatkan! Silakan masukkan nomor ke aplikasi tujuan.',
      order: newOrder,
      remainingBalance: memoryStore.getUserBalance(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Gagal memproses pesanan nomor' },
      { status: 500 }
    );
  }
}
