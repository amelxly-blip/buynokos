import { ServiceItem, CountryItem } from '@/types';
import { calculateSellingPrice, convertRubToIdr } from './pricing';

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

export const POPULAR_SERVICES: ServiceItem[] = [
  { id: 'wa', code: 'wa', name: 'WhatsApp', category: 'Messenger', icon: '💬', badge: 'Terlaris', minPrice: 3500 },
  { id: 'tg', code: 'tg', name: 'Telegram', category: 'Messenger', icon: '✈️', badge: 'Populer', minPrice: 1500 },
  { id: 'tk', code: 'tk', name: 'TikTok', category: 'Social', icon: '🎵', badge: 'Hot', minPrice: 2000 },
  { id: 'ig', code: 'ig', name: 'Instagram', category: 'Social', icon: '📸', minPrice: 2500 },
  { id: 'go', code: 'go', name: 'Google / Gmail', category: 'Others', icon: '🔍', minPrice: 3000 },
  { id: 'fb', code: 'fb', name: 'Facebook', category: 'Social', icon: '👥', minPrice: 2000 },
  { id: 'ds', code: 'ds', name: 'Discord', category: 'Social', icon: '🎮', minPrice: 2000 },
  { id: 'tw', code: 'tw', name: 'Twitter / X', category: 'Social', icon: '🐦', minPrice: 2200 },
  { id: 'nf', code: 'nf', name: 'Netflix', category: 'Entertainment', icon: '🎬', minPrice: 4000 },
  { id: 'sp', code: 'sp', name: 'Shopee', category: 'Others', icon: '🛍️', minPrice: 3500 },
  { id: 'ot', code: 'ot', name: 'Aplikasi Lainnya (Any)', category: 'Others', icon: '📱', minPrice: 1800 },
];

export const POPULAR_COUNTRIES: CountryItem[] = [
  { id: '6', code: 'id', name: 'Indonesia', flag: '🇮🇩', prefix: '+62', costRub: 20, costIdr: 3600, finalPriceIdr: 5500, stock: 1240 },
  { id: '187', code: 'us', name: 'Amerika Serikat (USA)', flag: '🇺🇸', prefix: '+1', costRub: 15, costIdr: 2700, finalPriceIdr: 4500, stock: 3510 },
  { id: '0', code: 'ru', name: 'Rusia (Russia)', flag: '🇷🇺', prefix: '+7', costRub: 8, costIdr: 1440, finalPriceIdr: 2500, stock: 8900 },
  { id: '7', code: 'my', name: 'Malaysia', flag: '🇲🇾', prefix: '+60', costRub: 22, costIdr: 3960, finalPriceIdr: 6000, stock: 450 },
  { id: '4', code: 'ph', name: 'Filipina (Philippines)', flag: '🇵🇭', prefix: '+63', costRub: 12, costIdr: 2160, finalPriceIdr: 3500, stock: 920 },
  { id: '10', code: 'vn', name: 'Vietnam', flag: '🇻🇳', prefix: '+84', costRub: 10, costIdr: 1800, finalPriceIdr: 3000, stock: 1100 },
  { id: '22', code: 'in', name: 'India', flag: '🇮🇳', prefix: '+91', costRub: 9, costIdr: 1620, finalPriceIdr: 2700, stock: 2400 },
  { id: '16', code: 'gb', name: 'Inggris (United Kingdom)', flag: '🇬🇧', prefix: '+44', costRub: 25, costIdr: 4500, finalPriceIdr: 7000, stock: 380 },
  { id: '73', code: 'br', name: 'Brasil (Brazil)', flag: '🇧🇷', prefix: '+55', costRub: 14, costIdr: 2520, finalPriceIdr: 4000, stock: 830 },
];

export class SmsProviderClient {
  private apiKey: string;
  private baseUrl = 'https://api.sms-activate.org/stubs/handler_api.php';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SMS_ACTIVATE_API_KEY || '';
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey !== 'your_sms_activate_api_key_here');
  }

  /**
   * Fetches real prices from SMS-Activate or returns fallback pricing list
   */
  async getServicePrices(serviceCode: string): Promise<CountryItem[]> {
    if (!this.isConfigured) {
      return POPULAR_COUNTRIES;
    }

    try {
      const url = `${this.baseUrl}?api_key=${this.apiKey}&action=getPrices&service=${serviceCode}`;
      const res = await fetch(url, { next: { revalidate: 300 } });
      const data = await res.json() as Record<string, Record<string, { cost: number; count: number }>>;

      // Map back to our popular countries
      return POPULAR_COUNTRIES.map((c) => {
        const countryData = data[c.id]?.[serviceCode];
        if (countryData && countryData.cost) {
          const costIdr = convertRubToIdr(countryData.cost);
          const { finalPrice } = calculateSellingPrice(costIdr);
          return {
            ...c,
            costRub: countryData.cost,
            costIdr,
            finalPriceIdr: finalPrice,
            stock: countryData.count || 0,
          };
        }
        return c;
      });
    } catch {
      return POPULAR_COUNTRIES;
    }
  }

  /**
   * Purchases a virtual number for a given service and country
   */
  async orderNumber(serviceCode: string, countryId: string): Promise<BuyNumberResult> {
    const selectedCountry = POPULAR_COUNTRIES.find((c) => c.id === countryId) || POPULAR_COUNTRIES[0];
    const { finalPrice } = calculateSellingPrice(selectedCountry.costIdr);

    if (!this.isConfigured) {
      // Sandbox Simulated Number
      const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
      const mockNumber = `${selectedCountry.prefix.replace('+', '')}${randomDigits}`;
      const mockOrderId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return {
        orderId: mockOrderId,
        phoneNumber: mockNumber,
        costIdr: selectedCountry.costIdr,
        finalPriceIdr: finalPrice,
      };
    }

    const url = `${this.baseUrl}?api_key=${this.apiKey}&action=getNumber&service=${serviceCode}&country=${countryId}`;
    const res = await fetch(url);
    const text = await res.text();

    // Response format: ACCESS_NUMBER:$id:$number
    if (text.startsWith('ACCESS_NUMBER')) {
      const parts = text.split(':');
      const orderId = parts[1];
      const phoneNumber = parts[2];
      return {
        orderId,
        phoneNumber,
        costIdr: selectedCountry.costIdr,
        finalPriceIdr: finalPrice,
      };
    }

    if (text === 'NO_NUMBERS') {
      throw new Error('Nomor untuk negara/layanan ini sedang habis dari provider. Silakan coba negara lain.');
    }
    if (text === 'NO_BALANCE') {
      throw new Error('Saldo modal provider habis. Mohon hubungi admin.');
    }
    if (text === 'BAD_KEY') {
      throw new Error('API Key provider tidak valid.');
    }

    throw new Error(`Gagal memesan nomor dari provider: ${text}`);
  }

  /**
   * Checks status of an active number (wait code, SMS received, or cancelled)
   */
  async checkStatus(orderId: string, createdAtMs: number): Promise<SmsStatusResult> {
    if (orderId.startsWith('sim_')) {
      // Sandbox auto-receive SMS simulation after 8 seconds
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

    const url = `${this.baseUrl}?api_key=${this.apiKey}&action=getStatus&id=${orderId}`;
    const res = await fetch(url);
    const text = await res.text();

    if (text === 'STATUS_WAIT_CODE') {
      return { status: 'WAITING' };
    }

    // Response: STATUS_OK:$code
    if (text.startsWith('STATUS_OK')) {
      const code = text.split(':')[1] || '';
      return {
        status: 'RECEIVED',
        code,
        smsText: `Kode verifikasi: ${code}`,
      };
    }

    if (text === 'STATUS_CANCEL') {
      return { status: 'CANCELLED' };
    }

    return { status: 'WAITING' };
  }

  /**
   * Cancels order on provider side (triggers zero cost / full refund)
   * Status 8 = cancel activation
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    if (orderId.startsWith('sim_') || !this.isConfigured) {
      return true;
    }

    try {
      const url = `${this.baseUrl}?api_key=${this.apiKey}&action=setStatus&id=${orderId}&status=8`;
      const res = await fetch(url);
      const text = await res.text();
      return text.includes('ACCESS_CANCEL');
    } catch {
      return false;
    }
  }

  /**
   * Marks order as completed on provider side
   * Status 6 = finish activation
   */
  async finishOrder(orderId: string): Promise<boolean> {
    if (orderId.startsWith('sim_') || !this.isConfigured) {
      return true;
    }

    try {
      const url = `${this.baseUrl}?api_key=${this.apiKey}&action=setStatus&id=${orderId}&status=6`;
      const res = await fetch(url);
      const text = await res.text();
      return text.includes('ACCESS_ACTIVATION');
    } catch {
      return false;
    }
  }
}

export const smsClient = new SmsProviderClient();
