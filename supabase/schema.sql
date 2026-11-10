-- ====================================================================
-- BUYNOKOS SUPABASE DATABASE SCHEMA
-- Jalankan skrip ini langsung di SQL Editor Dashboard Supabase Anda
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Data User & Saldo Rupiah)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    balance BIGINT DEFAULT 0 CHECK (balance >= 0),
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders Table (Pemesanan Nomor Nokos & Kode OTP Live)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    service_code TEXT NOT NULL,
    service_name TEXT NOT NULL,
    country_code TEXT NOT NULL,
    country_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    provider_order_id TEXT NOT NULL,
    price BIGINT NOT NULL,
    cost BIGINT NOT NULL,
    profit BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING_SMS' CHECK (status IN ('PENDING_SMS', 'SMS_RECEIVED', 'COMPLETED', 'CANCELLED', 'EXPIRED')),
    otp_code TEXT,
    full_sms TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Deposits Table (Riwayat Isi Saldo & Tagihan QRIS)
CREATE TABLE IF NOT EXISTS public.deposits (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    unique_code INT DEFAULT 0,
    total_pay BIGINT NOT NULL,
    payment_method TEXT DEFAULT 'QRIS',
    qr_url TEXT,
    reference TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'EXPIRED', 'FAILED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- 5. Settings Table (Pengaturan Markup & Sistem Autopilot)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Settings
INSERT INTO public.settings (key, value)
VALUES 
    ('pricing_rule', '{"markupPercent": 35, "fixedMarkupIdr": 500, "minPriceIdr": 1500}'::jsonb),
    ('general_config', '{"siteName": "BuyNokos", "whatsappSupport": "6281234567890", "maintenance": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 6. Trigger untuk Otomatis Membuat Profil Baru saat User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, balance, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Customer'),
        0,
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Stored Procedure: Auto-Refund saat Nomor Dibatalkan (Atomic & Aman)
CREATE OR REPLACE FUNCTION public.cancel_and_refund_order(target_order_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_new_balance BIGINT;
BEGIN
    -- Ambil data order
    SELECT * INTO v_order FROM public.orders WHERE id = target_order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Order tidak ditemukan');
    END IF;

    -- Hanya order PENDING_SMS yang boleh dibatalkan
    IF v_order.status != 'PENDING_SMS' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Nomor sudah selesai atau sudah dibatalkan sebelumnya');
    END IF;

    -- Update status order jadi CANCELLED
    UPDATE public.orders 
    SET status = 'CANCELLED' 
    WHERE id = target_order_id;

    -- Kembalikan saldo ke profil user jika ada user_id
    IF v_order.user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET balance = balance + v_order.price,
            updated_at = NOW()
        WHERE id = v_order.user_id
        RETURNING balance INTO v_new_balance;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Nomor berhasil dibatalkan dan saldo telah dikembalikan 100%',
        'refunded_amount', v_order.price,
        'new_balance', v_new_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Stored Procedure: Verifikasi Pembayaran Deposit QRIS Berhasil
CREATE OR REPLACE FUNCTION public.mark_deposit_paid(target_deposit_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_deposit RECORD;
    v_new_balance BIGINT;
BEGIN
    SELECT * INTO v_deposit FROM public.deposits WHERE id = target_deposit_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Deposit tidak ditemukan');
    END IF;

    IF v_deposit.status = 'PAID' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Deposit sudah lunas sebelumnya');
    END IF;

    -- Update status deposit
    UPDATE public.deposits
    SET status = 'PAID',
        paid_at = NOW()
    WHERE id = target_deposit_id;

    -- Tambah saldo user
    UPDATE public.profiles
    SET balance = balance + v_deposit.amount,
        updated_at = NOW()
    WHERE id = v_deposit.user_id
    RETURNING balance INTO v_new_balance;

    RETURN jsonb_build_object(
        'success', true, 
        'amount_added', v_deposit.amount,
        'new_balance', v_new_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

-- Policies for Orders
CREATE POLICY "Users can view own orders" 
    ON public.orders FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" 
    ON public.orders FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policies for Deposits
CREATE POLICY "Users can view own deposits" 
    ON public.deposits FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deposits" 
    ON public.deposits FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policies for Settings
CREATE POLICY "Public read settings" 
    ON public.settings FOR SELECT 
    USING (true);

-- 10. Enable Supabase Realtime for Orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
