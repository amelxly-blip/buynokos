import { NextResponse } from 'next/server';
import { POPULAR_SERVICES, smsClient } from '@/lib/sms-provider';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceCode = searchParams.get('service') || 'wa';

    const countries = await smsClient.getServicePrices(serviceCode);

    return NextResponse.json({
      success: true,
      services: POPULAR_SERVICES,
      countries,
      activeService: serviceCode,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Gagal memuat daftar harga layanan' },
      { status: 500 }
    );
  }
}
