import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured, memoryStore } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET() {
  try {
    let totalOrders = 0;
    let completedOrders = 0;
    let totalRevenue = 0;
    let totalProfit = 0;

    const supabase = getSupabaseAdmin();
    if (isSupabaseConfigured && supabase) {
      const { data: orders } = await supabase.from('orders').select('*');
      if (orders) {
        totalOrders = orders.length;
        orders.forEach((o) => {
          if (o.status === 'SMS_RECEIVED' || o.status === 'COMPLETED') {
            completedOrders++;
            totalRevenue += Number(o.price || 0);
            totalProfit += Number(o.profit || 0);
          }
        });
      }
    } else {
      totalOrders = memoryStore.orders.size;
      Array.from(memoryStore.orders.values()).forEach((o: any) => {
        if (o.status === 'SMS_RECEIVED' || o.status === 'COMPLETED') {
          completedOrders++;
          totalRevenue += o.price;
          totalProfit += o.profit;
        }
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders,
        completedOrders,
        totalRevenue,
        totalProfit,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
