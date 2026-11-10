import { ServiceItem, CountryItem } from '@/types';
import { calculateSellingPrice } from './pricing';

export interface BuyNumberResult {
  orderId: string;
  phoneNumber: string;
  costIdr: number;
  finalPriceIdr: number;
}

export interface SmsStatusResult {
  status: 'WAITING' | 'RECEIVED' | 'CANCELLED' | 'EXPIRED';
  code?: string;
  smsText?: string;
}

// Mapping popular service to buynokos.com platform_id
export const POPULAR_SERVICES: (ServiceItem & { platformId: number })[] = [
  { id: 'wa', code: 'wa', platformId: 1, name: 'WhatsApp', category: 'Messenger', icon: '💬', badge: 'Terlaris', minPrice: 3500 },
  { id: 'tg', code: 'tg', platformId: 2, name: 'Telegram', category: 'Messenger', icon: '✈️', badge: 'Populer', minPrice: 1500 },
  { id: 'tk', code: 'tk', platformId: 7, name: 'TikTok', category: 'Social', icon: '🎵', badge: 'Hot', minPrice: 2000 },
  { id: 'ig', code: 'ig', platformId: 3, name: 'Instagram', category: 'Social', icon: '📸', minPrice: 2500 },
  { id: 'go', code: 'go', platformId: 5, name: 'Google / Gmail', category: 'Others', icon: '🔍', minPrice: 2500 },
  { id: 'fb', code: 'fb', platformId: 4, name: 'Facebook', category: 'Social', icon: '👥', minPrice: 2000 },
  { id: 'ds', code: 'ds', platformId: 8, name: 'Discord', category: 'Social', icon: '🎮', minPrice: 2000 },
  { id: 'tw', code: 'tw', platformId: 6, name: 'Twitter / X', category: 'Social', icon: '🐦', minPrice: 2000 },
  { id: 'nf', code: 'nf', platformId: 16, name: 'Netflix', category: 'Entertainment', icon: '🎬', minPrice: 3500 },
  { id: 'sp', code: 'sp', platformId: 21, name: 'Shopee', category: 'Others', icon: '🛍️', minPrice: 2000 },
];

export const POPULAR_COUNTRIES: CountryItem[] = [
  { id: '7', code: 'id', name: 'Indonesia', flag: '🇮🇩', prefix: '+62', costRub: 0, costIdr: 2289, finalPriceIdr: 3600, stock: 1250 },
  { id: '188', code: 'us', name: 'Amerika Serikat (USA)', flag: '🇺🇸', prefix: '+1', costRub: 0, costIdr: 2500, finalPriceIdr: 3900, stock: 3500 },
  { id: '8', code: 'my', name: 'Malaysia', flag: '🇲🇾', prefix: '+60', costRub: 0, costIdr: 3200, finalPriceIdr: 4900, stock: 450 },
  { id: '5', code: 'ph', name: 'Filipina (Philippines)', flag: '🇵🇭', prefix: '+63', costRub: 0, costIdr: 2100, finalPriceIdr: 3400, stock: 920 },
  { id: '11', code: 'vn', name: 'Vietnam', flag: '🇻🇳', prefix: '+84', costRub: 0, costIdr: 1800, finalPriceIdr: 3000, stock: 1100 },
  { id: '23', code: 'in', name: 'India', flag: '🇮🇳', prefix: '+91', costRub: 0, costIdr: 1600, finalPriceIdr: 2700, stock: 2400 },
  { id: '17', code: 'gb', name: 'Inggris (United Kingdom)', flag: '🇬🇧', prefix: '+44', costRub: 0, costIdr: 4500, finalPriceIdr: 6600, stock: 380 },
  { id: '74', code: 'br', name: 'Brasil (Brazil)', flag: '🇧🇷', prefix: '+55', costRub: 0, costIdr: 2500, finalPriceIdr: 3900, stock: 830 },
  { id: '53', code: 'th', name: 'Thailand', flag: '🇹🇭', prefix: '+66', costRub: 0, costIdr: 2800, finalPriceIdr: 4300, stock: 610 },
  { id: '4', code: 'cn', name: 'China', flag: '🇨🇳', prefix: '+86', costRub: 0, costIdr: 3500, finalPriceIdr: 5300, stock: 420 },
];

export class BuyNokosApiClient {
  private apiKey: string;
  private baseUrl = 'https://buynokos.com/api/v1/s2';

  constructor(apiKey?: string) {
    this.apiKey =
      apiKey ||
      process.env.BUYNOKOS_API_KEY ||
      process.env.SMS_ACTIVATE_API_KEY ||
      'bnk_5094bf56a1c9c7219a1f186b0b9aee4a475ce0ec';
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.startsWith('bnk_'));
  }

  private get headers(): HeadersInit {
    return {
      'X-API-Key': this.apiKey,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Cek saldo akun di buynokos.com
   */
  async getBalance(): Promise<{ balance: number; formatted: string }> {
    if (!this.isConfigured) return { balance: 0, formatted: 'Rp 0' };

    try {
      const res = await fetch(`${this.baseUrl}/balance`, {
        headers: this.headers,
        next: { revalidate: 60 },
      });
      const data = await res.json() as any;
      if (data.success) {
        return { balance: data.balance || 0, formatted: data.balance_formatted || 'Rp 0' };
      }
    } catch (err) {
      console.error('Failed to get balance from buynokos.com:', err);
    }
    return { balance: 0, formatted: 'Rp 0' };
  }

  /**
   * Mengambil daftar harga real-time untuk suatu layanan di berbagai negara
   */
  async getServicePrices(serviceCode: string): Promise<CountryItem[]> {
    const service = POPULAR_SERVICES.find((s) => s.code === serviceCode) || POPULAR_SERVICES[0];

    if (!this.isConfigured) {
      return POPULAR_COUNTRIES;
    }

    try {
      // Fetch prices concurrently for our popular countries
      const updatedCountries = await Promise.all(
        POPULAR_COUNTRIES.map(async (c) => {
          try {
            const url = `${this.baseUrl}/services?country_id=${c.id}&platform_id=${service.platformId}`;
            const res = await fetch(url, {
              headers: this.headers,
              next: { revalidate: 120 }, // Cache 2 menit
            });
            const data = await res.json() as any;

            if (data.success && Array.isArray(data.data) && data.data.length > 0) {
              // Filter products with stock > 0 and pick the cheapest
              const available = data.data.filter((p: any) => p.stock > 0);
              const bestProduct = available.length > 0 ? available[0] : data.data[0];

              const costIdr = Number(bestProduct.price);
              const totalStock = data.data.reduce((acc: number, p: any) => acc + (p.stock || 0), 0);
              const { finalPrice } = calculateSellingPrice(costIdr);

              return {
                ...c,
                costIdr,
                finalPriceIdr: finalPrice,
                stock: totalStock,
              };
            }
          } catch {}
          return c;
        })
      );

      return updatedCountries;
    } catch {
      return POPULAR_COUNTRIES;
    }
  }

  /**
   * Memesan nomor virtual di buynokos.com
   */
  async orderNumber(serviceCode: string, countryId: string): Promise<BuyNumberResult> {
    const service = POPULAR_SERVICES.find((s) => s.code === serviceCode) || POPULAR_SERVICES[0];
    const country = POPULAR_COUNTRIES.find((c) => c.id === countryId) || POPULAR_COUNTRIES[0];

    if (!this.isConfigured) {
      // Sandbox fallback
      const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
      const mockNumber = `${country.prefix.replace('+', '')}${randomDigits}`;
      const mockOrderId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const { finalPrice } = calculateSellingPrice(country.costIdr);
      return {
        orderId: mockOrderId,
        phoneNumber: mockNumber,
        costIdr: country.costIdr,
        finalPriceIdr: finalPrice,
      };
    }

    // 1. Ambil produk termurah yang punya stok
    const servicesUrl = `${this.baseUrl}/services?country_id=${country.id}&platform_id=${service.platformId}`;
    const sRes = await fetch(servicesUrl, { headers: this.headers });
    const sData = await sRes.json() as any;

    if (!sData.success || !Array.isArray(sData.data) || sData.data.length === 0) {
      throw new Error(`Stok nomor ${service.name} untuk negara ${country.name} sedang habis.`);
    }

    const available = sData.data.filter((p: any) => p.stock > 0);
    if (available.length === 0) {
      throw new Error(`Stok nomor ${service.name} untuk negara ${country.name} sedang habis.`);
    }

    const targetProduct = available[0];
    const costIdr = Number(targetProduct.price);
    const { finalPrice } = calculateSellingPrice(costIdr);

    // 2. Eksekusi Order
    const orderPayload = {
      product_id: targetProduct.id,
      service_name: service.name,
      country_name: country.name,
    };

    const oRes = await fetch(`${this.baseUrl}/order`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(orderPayload),
    });

    const oData = await oRes.json() as any;

    if (!oData.success) {
      throw new Error(oData.message || 'Gagal memesan nomor dari buynokos.com');
    }

    return {
      orderId: String(oData.order_id),
      phoneNumber: String(oData.phone).replace('+', ''),
      costIdr,
      finalPriceIdr: finalPrice,
    };
  }

  /**
   * Cek status SMS / OTP dari buynokos.com
   */
  async checkStatus(orderId: string, createdAtMs: number): Promise<SmsStatusResult> {
    if (orderId.startsWith('sim_')) {
      const elapsed = Date.now() - createdAtMs;
      if (elapsed > 8000) {
        const fakeOtp = Math.floor(100000 + Math.random() * 900000).toString();
        return {
          status: 'RECEIVED',
          code: fakeOtp,
          smsText: `Kode verifikasi Anda adalah ${fakeOtp}. Jangan bagikan kode ini kepada siapa pun.`,
        };
      }
      return { status: 'WAITING' };
    }

    if (!this.isConfigured) {
      return { status: 'WAITING' };
    }

    try {
      const res = await fetch(`${this.baseUrl}/check?order_id=${orderId}`, {
        headers: this.headers,
      });
      const data = await res.json() as any;

      const status = String(data.status || '').toLowerCase();

      if (status === 'received' && data.otp) {
        return {
          status: 'RECEIVED',
          code: String(data.otp),
          smsText: data.sms || `Kode verifikasi: ${data.otp}`,
        };
      }

      if (status === 'cancelled') {
        return { status: 'CANCELLED' };
      }

      if (status === 'expired') {
        return { status: 'EXPIRED' };
      }

      return { status: 'WAITING' };
    } catch {
      return { status: 'WAITING' };
    }
  }

  /**
   * Batalkan nomor dan refund ke saldo buynokos.com
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    if (orderId.startsWith('sim_') || !this.isConfigured) {
      return true;
    }

    try {
      const res = await fetch(`${this.baseUrl}/cancel`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ order_id: Number(orderId) || orderId }),
      });
      const data = await res.json() as any;
      return Boolean(data.success);
    } catch {
      return false;
    }
  }

  /**
   * Tandai pesanan selesai
   */
  async finishOrder(orderId: string): Promise<boolean> {
    if (orderId.startsWith('sim_') || !this.isConfigured) {
      return true;
    }

    try {
      const res = await fetch(`${this.baseUrl}/finish`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ order_id: Number(orderId) || orderId }),
      });
      const data = await res.json() as any;
      return Boolean(data.success);
    } catch {
      return false;
    }
  }
}

export const smsClient = new BuyNokosApiClient();
