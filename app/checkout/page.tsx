'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  UtensilsCrossed,
  User,
  Phone,
  FileText,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  Receipt,
  MapPin,
  Send,
  AlertCircle,
} from 'lucide-react';
import { products, type Product } from '@/lib/products';
import { rupiah } from '@/lib/utils';

type ReceiptData = {
  orderId: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerNotes: string;
  deliveryOption: string;
  paymentMethod: string;
  address: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  total: number;
};

export default function CheckoutPage() {
  const router = useRouter();

  // Cart state
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup'>('delivery');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'cod' | 'transfer'>('qris');

  // UI state
  const [errorMessage, setErrorMessage] = useState('');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('dapur_kita_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (parsed && typeof parsed === 'object') {
          setCart(parsed);
        }
      }
    } catch (e) {
      console.error('Gagal membaca keranjang dari penyimpanan:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('dapur_kita_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Gagal menyimpan keranjang:', e);
    }
  }, [cart, isLoaded]);

  // Derived cart calculations
  const cartItems = products.filter((p) => (cart[p.id] ?? 0) > 0);
  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const subtotal = cartItems.reduce(
    (sum, product) => sum + product.price * (cart[product.id] ?? 0),
    0
  );
  const discount = totalItems >= 3 ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal - discount;

  function updateQuantity(id: string, delta: number) {
    setCart((current) => {
      const next = { ...current };
      const currentQty = next[id] ?? 0;
      const newQty = currentQty + delta;
      if (newQty <= 0) {
        delete next[id];
      } else {
        next[id] = newQty;
      }
      return next;
    });
  }

  function removeItem(id: string) {
    setCart((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage('');

    if (cartItems.length === 0) {
      setErrorMessage('Keranjang pesanan masih kosong. Silakan tambahkan menu terlebih dahulu.');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Mohon isi nama lengkap Anda.');
      return;
    }

    if (!whatsapp.trim()) {
      setErrorMessage('Mohon isi nomor WhatsApp Anda.');
      return;
    }

    // Format items
    const orderItems = cartItems.map((p) => ({
      name: p.name,
      quantity: cart[p.id] ?? 0,
      price: p.price,
    }));

    const orderId = `DK-${Date.now().toString().slice(-6)}`;
    const orderDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const receiptData: ReceiptData = {
      orderId,
      date: orderDate,
      customerName: name.trim(),
      customerPhone: whatsapp.trim(),
      customerNotes: notes.trim(),
      deliveryOption: deliveryOption === 'delivery' ? 'Antar ke Alamat (Delivery)' : 'Ambil di Tempat (Takeaway / Dine In)',
      paymentMethod:
        paymentMethod === 'qris'
          ? 'QRIS / E-Wallet'
          : paymentMethod === 'cod'
          ? 'Bayar di Tempat (COD)'
          : 'Transfer Bank',
      address: address.trim(),
      items: orderItems,
      subtotal,
      discount,
      total,
    };

    setReceipt(receiptData);

    // Clear cart from storage and state
    setCart({});
    try {
      localStorage.removeItem('dapur_kita_cart');
    } catch (err) {
      console.error(err);
    }
  }

  function getWhatsAppUrl(data: ReceiptData) {
    // Nomor tujuan admin (bisa disesuaikan atau nomor default resto)
    const adminNumber = '6281234567890';

    const itemsText = data.items
      .map((item) => `• ${item.name} (${item.quantity}x) = ${rupiah(item.price * item.quantity)}`)
      .join('\n');

    const message = `Halo Dapur Kita, saya ingin melakukan pemesanan makanan/minuman:

📋 *DETAIL PESANAN*
No. Pesanan: *${data.orderId}*
Waktu: ${data.date}

👤 *DATA PEMESAN*
Nama: *${data.customerName}*
Nomor WhatsApp: *${data.customerPhone}*
Opsi Pemesanan: ${data.deliveryOption}${data.address ? `\nAlamat Pengiriman: ${data.address}` : ''}
${data.customerNotes ? `Catatan Khusus: _${data.customerNotes}_\n` : ''}
Metode Pembayaran: ${data.paymentMethod}

🛒 *MENU PESANAN*
${itemsText}

💰 *RINCIAN HARGA*
Subtotal: ${rupiah(data.subtotal)}
${data.discount > 0 ? `Diskon Promo (5%): -${rupiah(data.discount)}\n` : ''}*TOTAL PEMBAYARAN: ${rupiah(data.total)}*

Mohon segera diproses ya, terima kasih!`;

    return `https://api.whatsapp.com/send?phone=${adminNumber}&text=${encodeURIComponent(message)}`;
  }

  return (
    <main className="min-h-screen bg-[#fffaf2] text-[#292b25]">
      {/* Top Banner */}
      <div className="bg-[#236b4b] px-4 py-2 text-center text-sm font-medium text-white">
        Diskon 5% untuk pembelian minimal 3 item — lengkapi data pemesanan di bawah ini!
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-black/5 bg-[#fffaf2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-black tracking-tight"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#236b4b] text-white">
              <UtensilsCrossed size={21} />
            </span>
            <span>
              Dapur<span className="text-[#236b4b]">Kita.</span>
            </span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold text-[#5b5b51] transition hover:border-[#236b4b] hover:text-[#236b4b]"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Menu</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#f4a261]/20 px-3.5 py-1.5 text-xs font-bold text-[#8c4a18]">
            ✦ Tahap Akhir Pemesanan
          </span>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            Checkout & Konfirmasi Pesanan
          </h1>
          <p className="mt-2 text-sm text-[#69695f]">
            Lengkapi nama, nomor WhatsApp, dan catatan pesanan Anda agar pesanan dapat segera kami proses.
          </p>
        </div>

        {/* Empty state if no items */}
        {isLoaded && cartItems.length === 0 && !receipt ? (
          <div className="mx-auto max-w-lg rounded-3xl border border-black/10 bg-white p-10 text-center shadow-lg">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-50 text-[#236b4b]">
              <ShoppingBag size={32} />
            </div>
            <h2 className="mt-4 text-2xl font-black">Keranjang Anda Kosong</h2>
            <p className="mt-2 text-sm text-[#69695f]">
              Belum ada makanan atau minuman di keranjang belanja Anda. Silakan pilih menu lezat kami terlebih dahulu!
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#236b4b] px-6 py-3.5 font-bold text-white shadow-md transition hover:bg-[#194f37]"
            >
              <ArrowLeft size={18} />
              Pilih Menu Sekarang
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            {/* Form Kolom Kiri: Nama, Nomor WA, Catatan */}
            <div className="lg:col-span-7">
              <form
                onSubmit={handleSubmitOrder}
                className="space-y-6 rounded-3xl border border-black/5 bg-white p-6 shadow-xl shadow-black/5 sm:p-8"
              >
                <div>
                  <h2 className="text-xl font-black text-[#292b25]">
                    Informasi Pemesan
                  </h2>
                  <p className="mt-1 text-xs text-[#69695f]">
                    Pastikan nama dan nomor WhatsApp benar agar konfirmasi dapat terkirim.
                  </p>
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* 1. Nama Lengkap */}
                <div>
                  <label
                    htmlFor="name"
                    className="flex items-center gap-2 text-sm font-bold text-[#292b25]"
                  >
                    <User size={16} className="text-[#236b4b]" />
                    <span>Nama Lengkap <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fffaf2]/50 px-4 py-3 text-sm font-medium text-[#292b25] outline-none transition focus:border-[#236b4b] focus:bg-white focus:ring-2 focus:ring-[#236b4b]/20"
                  />
                </div>

                {/* 2. Nomor WhatsApp */}
                <div>
                  <label
                    htmlFor="whatsapp"
                    className="flex items-center gap-2 text-sm font-bold text-[#292b25]"
                  >
                    <Phone size={16} className="text-[#236b4b]" />
                    <span>Nomor WhatsApp <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    id="whatsapp"
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fffaf2]/50 px-4 py-3 text-sm font-medium text-[#292b25] outline-none transition focus:border-[#236b4b] focus:bg-white focus:ring-2 focus:ring-[#236b4b]/20"
                  />
                  <p className="mt-1 text-xs text-[#77776c]">
                    Nomor WhatsApp aktif untuk konfirmasi pesanan dan update pengiriman.
                  </p>
                </div>

                {/* 3. Catatan Pesanan */}
                <div>
                  <label
                    htmlFor="notes"
                    className="flex items-center gap-2 text-sm font-bold text-[#292b25]"
                  >
                    <FileText size={16} className="text-[#236b4b]" />
                    <span>Catatan Pesanan</span>
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Sambal dipisah, sayur lodeh jangan terlalu pedas, tambah sendok plastik..."
                    className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fffaf2]/50 px-4 py-3 text-sm font-medium text-[#292b25] outline-none transition focus:border-[#236b4b] focus:bg-white focus:ring-2 focus:ring-[#236b4b]/20"
                  />
                  <p className="mt-1 text-xs text-[#77776c]">
                    Permintaan khusus untuk porsi, rasa, atau instruksi pengantaran.
                  </p>
                </div>

                {/* Opsi Pengambilan / Pengiriman */}
                <div className="border-t border-black/5 pt-5">
                  <label className="text-sm font-bold text-[#292b25]">
                    Pilihan Pengiriman
                  </label>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryOption('delivery')}
                      className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition ${
                        deliveryOption === 'delivery'
                          ? 'border-[#236b4b] bg-green-50/70 font-bold text-[#236b4b]'
                          : 'border-black/10 hover:border-black/20'
                      }`}
                    >
                      <MapPin size={20} className="mb-1" />
                      <span className="text-sm">Antar ke Alamat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryOption('pickup')}
                      className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition ${
                        deliveryOption === 'pickup'
                          ? 'border-[#236b4b] bg-green-50/70 font-bold text-[#236b4b]'
                          : 'border-black/10 hover:border-black/20'
                      }`}
                    >
                      <ShoppingBag size={20} className="mb-1" />
                      <span className="text-sm">Ambil Sendiri (Takeaway)</span>
                    </button>
                  </div>

                  {deliveryOption === 'delivery' && (
                    <div className="mt-3">
                      <label htmlFor="address" className="text-xs font-bold text-[#5b5b51]">
                        Alamat Pengantaran
                      </label>
                      <input
                        id="address"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Contoh: Jl. Mawar No. 12, RT 02/RW 03, Blok C"
                        className="mt-1 w-full rounded-2xl border border-black/10 bg-[#fffaf2]/50 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-[#236b4b] focus:bg-white"
                      />
                    </div>
                  )}
                </div>

                {/* Metode Pembayaran */}
                <div className="border-t border-black/5 pt-5">
                  <label className="text-sm font-bold text-[#292b25]">
                    Metode Pembayaran
                  </label>
                  <div className="mt-3 grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'qris', label: 'QRIS / E-Wallet' },
                      { id: 'cod', label: 'Bayar di Tempat (COD)' },
                      { id: 'transfer', label: 'Transfer Bank' },
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`rounded-2xl border p-3 text-center text-xs font-bold transition ${
                          paymentMethod === method.id
                            ? 'border-[#236b4b] bg-green-50 text-[#236b4b]'
                            : 'border-black/10 hover:border-black/20 text-[#5b5b51]'
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tombol Submit */}
                <button
                  type="submit"
                  disabled={cartItems.length === 0}
                  className="w-full rounded-full bg-[#236b4b] px-6 py-4 text-base font-extrabold text-white shadow-lg transition hover:bg-[#194f37] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Konfirmasi & Selesaikan Pesanan
                </button>
              </form>
            </div>

            {/* Kolom Kanan: Ringkasan Pesanan */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 rounded-3xl border border-black/5 bg-white p-6 shadow-xl shadow-black/5 sm:p-7">
                <div className="flex items-center justify-between border-b border-black/5 pb-4">
                  <h2 className="text-lg font-black text-[#292b25]">
                    Ringkasan Pesanan
                  </h2>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-[#236b4b]">
                    {totalItems} item
                  </span>
                </div>

                {/* List Item Keranjang */}
                <div className="my-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                  {cartItems.map((product) => {
                    const quantity = cart[product.id] ?? 0;
                    return (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 rounded-2xl border border-black/5 bg-[#fffaf2]/50 p-2.5 transition hover:bg-white"
                      >
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={60}
                          height={60}
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-extrabold text-[#292b25]">
                            {product.name}
                          </h3>
                          <p className="text-xs text-[#77776c]">
                            {rupiah(product.price)}
                          </p>
                          <div className="mt-1 font-bold text-[#236b4b] text-xs">
                            Total: {rupiah(product.price * quantity)}
                          </div>
                        </div>

                        {/* Adjust qty */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, -1)}
                            className="grid h-7 w-7 place-items-center rounded-full border border-black/10 bg-white text-xs hover:bg-black/5"
                            aria-label="Kurangi"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="min-w-4 text-center text-xs font-black">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, 1)}
                            className="grid h-7 w-7 place-items-center rounded-full bg-[#236b4b] text-white text-xs hover:bg-[#194f37]"
                            aria-label="Tambah"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(product.id)}
                            className="ml-1 text-red-500 hover:text-red-700"
                            aria-label="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Promo notice */}
                {totalItems >= 3 ? (
                  <div className="mb-4 rounded-2xl bg-green-50 p-3 text-xs font-bold text-[#236b4b]">
                    ✓ Diskon promo 5% telah diterapkan!
                  </div>
                ) : (
                  <div className="mb-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800">
                    Beli {3 - totalItems} item lagi untuk mendapatkan diskon promo 5%!
                  </div>
                )}

                {/* Kalkulasi Biaya */}
                <div className="space-y-2.5 border-t border-black/5 pt-4 text-sm">
                  <div className="flex justify-between text-[#69695f]">
                    <span>Subtotal</span>
                    <span>{rupiah(subtotal)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between font-semibold text-[#236b4b]">
                      <span>Diskon Promo (5%)</span>
                      <span>-{rupiah(discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-black/10 pt-3 text-lg font-black text-[#292b25]">
                    <span>Total Pembayaran</span>
                    <span className="text-[#236b4b]">{rupiah(total)}</span>
                  </div>
                </div>

                <div className="mt-5 text-center">
                  <Link
                    href="/"
                    className="text-xs font-bold text-[#236b4b] hover:underline"
                  >
                    + Tambah menu makanan / minuman lainnya
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Struk & Konfirmasi Pesanan Berhasil */}
      {receipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setReceipt(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl transition-all"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header Struk */}
            <div className="bg-[#236b4b] p-6 text-center text-white">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                <Receipt size={26} />
              </div>
              <h3 className="text-xl font-black tracking-tight">PESANAN BERHASIL DIBUAT</h3>
              <p className="text-xs text-white/80">Dapur Kita — Makanan Enak, Bahagia Setiap Hari</p>
              <div className="mt-3 inline-block rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold text-white">
                ✓ Siap Diproses & Dikonfirmasi
              </div>
            </div>

            {/* Isi Struk */}
            <div className="max-h-[70vh] overflow-y-auto p-6">
              {/* Info Order & Pemesan */}
              <div className="rounded-2xl bg-[#fffaf2] p-4 text-xs space-y-1.5 border border-black/5">
                <div className="flex justify-between text-[#69695f]">
                  <span>No. Pesanan:</span>
                  <strong className="text-[#292b25]">{receipt.orderId}</strong>
                </div>
                <div className="flex justify-between text-[#69695f]">
                  <span>Tanggal:</span>
                  <span>{receipt.date}</span>
                </div>
                <div className="flex justify-between text-[#69695f]">
                  <span>Nama Pemesan:</span>
                  <strong className="text-[#292b25]">{receipt.customerName}</strong>
                </div>
                <div className="flex justify-between text-[#69695f]">
                  <span>WhatsApp:</span>
                  <strong className="text-[#292b25]">{receipt.customerPhone}</strong>
                </div>
                {receipt.address && (
                  <div className="flex justify-between text-[#69695f]">
                    <span>Alamat:</span>
                    <span className="max-w-[200px] text-right text-[#292b25]">{receipt.address}</span>
                  </div>
                )}
                {receipt.customerNotes && (
                  <div className="flex justify-between text-[#69695f]">
                    <span>Catatan:</span>
                    <span className="max-w-[200px] text-right italic text-[#292b25]">"{receipt.customerNotes}"</span>
                  </div>
                )}
                <div className="flex justify-between text-[#69695f]">
                  <span>Pengiriman:</span>
                  <span>{receipt.deliveryOption}</span>
                </div>
                <div className="flex justify-between text-[#69695f]">
                  <span>Pembayaran:</span>
                  <span>{receipt.paymentMethod}</span>
                </div>
              </div>

              <div className="my-4 border-b border-dashed border-black/20" />

              {/* Daftar Menu */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#77776c]">Daftar Menu:</h4>
                {receipt.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-[#292b25]">{item.name}</p>
                      <p className="text-xs text-[#69695f]">
                        {item.quantity} × {rupiah(item.price)}
                      </p>
                    </div>
                    <span className="font-extrabold text-[#292b25]">
                      {rupiah(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="my-4 border-b border-dashed border-black/20" />

              {/* Rincian Harga */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#69695f]">
                  <span>Subtotal</span>
                  <span>{rupiah(receipt.subtotal)}</span>
                </div>
                {receipt.discount > 0 && (
                  <div className="flex justify-between font-semibold text-[#236b4b]">
                    <span>Diskon Promo (5%)</span>
                    <span>-{rupiah(receipt.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-black/10 pt-2 text-base font-black text-[#292b25]">
                  <span>Total Pembayaran</span>
                  <span className="text-[#236b4b]">{rupiah(receipt.total)}</span>
                </div>
              </div>

              {/* Kirim ke WhatsApp Admin Button */}
              <div className="mt-5">
                <a
                  href={getWhatsAppUrl(receipt)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-[#1ebc5a]"
                >
                  <Send size={18} />
                  <span>Kirim Pesanan ke WhatsApp Admin</span>
                </a>
                <p className="mt-1.5 text-center text-[11px] text-[#77776c]">
                  Klik untuk membuka chat WhatsApp dengan format pesanan otomatis.
                </p>
              </div>

              {/* Tombol Cetak & Selesai */}
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-black/15 py-3 text-sm font-bold text-[#292b25] transition hover:bg-black/5"
                >
                  <Printer size={16} />
                  <span>Cetak Struk</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReceipt(null);
                    router.push('/');
                  }}
                  className="flex-1 rounded-full bg-[#236b4b] py-3 text-sm font-bold text-white transition hover:bg-[#194f37]"
                >
                  Selesai & Ke Beranda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
