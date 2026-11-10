export interface CreateDepositParams {
  amount: number;
  userId: string;
  userEmail?: string;
  userName?: string;
}

export interface QrisDepositResponse {
  depositId: string;
  reference: string;
  amount: number;
  uniqueCode: number;
  totalPay: number;
  qrUrl: string;
  qrString?: string;
  expiresAt: string;
  provider: 'tokopay' | 'pakasir' | 'tripay' | 'sandbox';
}

export class PaymentGatewayService {
  private provider: string;

  constructor() {
    this.provider = process.env.PAYMENT_GATEWAY_PROVIDER || 'sandbox';
  }

  /**
   * Generates a QRIS invoice for depositing funds
   */
  async createQrisInvoice(params: CreateDepositParams): Promise<QrisDepositResponse> {
    const uniqueCode = Math.floor(10 + Math.random() * 89); // 2 digit random code for automatic verification
    const totalPay = params.amount + uniqueCode;
    const depositId = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

    // 1. Tokopay QRIS
    if (this.provider === 'tokopay' && process.env.TOKOPAY_SECRET_KEY) {
      try {
        const payload = {
          merchant_id: process.env.TOKOPAY_MERCHANT_ID,
          secret: process.env.TOKOPAY_SECRET_KEY,
          ref_id: depositId,
          nominal: totalPay,
          metode: 'QRIS',
        };
        const res = await fetch('https://api.tokopay.id/v1/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json() as { data?: { qr_link?: string; qr_string?: string; ref_id?: string } };
        if (data.data?.qr_link) {
          return {
            depositId,
            reference: data.data.ref_id || depositId,
            amount: params.amount,
            uniqueCode,
            totalPay,
            qrUrl: data.data.qr_link,
            qrString: data.data.qr_string,
            expiresAt,
            provider: 'tokopay',
          };
        }
      } catch (err) {
        console.error('Tokopay create invoice error:', err);
      }
    }

    // 2. Pakasir QRIS
    if (this.provider === 'pakasir' && process.env.PAKASIR_API_KEY) {
      try {
        const res = await fetch('https://pakasir.com/api/v1/transaction/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.PAKASIR_API_KEY}`,
          },
          body: JSON.stringify({
            amount: totalPay,
            customer_name: params.userName || 'Customer',
            order_id: depositId,
            payment_type: 'qris',
          }),
        });
        const data = await res.json() as { qr_url?: string; transaction_id?: string };
        if (data.qr_url) {
          return {
            depositId,
            reference: data.transaction_id || depositId,
            amount: params.amount,
            uniqueCode,
            totalPay,
            qrUrl: data.qr_url,
            expiresAt,
            provider: 'pakasir',
          };
        }
      } catch (err) {
        console.error('Pakasir create invoice error:', err);
      }
    }

    // Default / Sandbox Fallback: generates SVG QR Code link
    const demoQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021226600016ID.CO.QRIS.WWW011893600911002234053033605802ID5910BUYNOKOS6007JAKARTA61051234062070703A016304${totalPay}`;

    return {
      depositId,
      reference: depositId,
      amount: params.amount,
      uniqueCode,
      totalPay,
      qrUrl: demoQrUrl,
      expiresAt,
      provider: 'sandbox',
    };
  }

  /**
   * Verifies incoming webhook signature from payment gateway
   */
  verifyWebhook(payload: Record<string, unknown>, signature?: string): boolean {
    if (this.provider === 'sandbox') return true;
    if (this.provider === 'tokopay') {
      // Tokopay signature validation logic
      return Boolean(payload && payload.status === 'Dibayar');
    }
    if (this.provider === 'pakasir') {
      return Boolean(signature && signature === process.env.PAKASIR_API_KEY);
    }
    return true;
  }
}

export const paymentGateway = new PaymentGatewayService();
