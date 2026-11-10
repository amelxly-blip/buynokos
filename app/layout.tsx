import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'BuyNokos - Jual Nomor Virtual OTP Otomatis 24 Jam',
  description:
    'Beli nomor virtual OTP WhatsApp, Telegram, TikTok, dan aplikasi lainnya dengan sistem autopilot 24 jam via QRIS dan garansi auto-refund saldo 100%.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen flex flex-col bg-background text-zinc-100 antialiased selection:bg-emerald-500 selection:text-black">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
