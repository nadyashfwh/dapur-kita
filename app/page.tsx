'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Clock3,
  MapPin,
  Search,
  ShoppingBag,
  UtensilsCrossed,
  Plus,
  Minus,
  X,
  CheckCircle2,
} from 'lucide-react';
import { products, categories, type Product } from '@/lib/products';
import { rupiah } from '@/lib/utils';


export default function Home() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({
    message: '',
    show: false,
  });

  // Load keranjang dari localStorage saat halaman dimuat
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
      console.error('Gagal membaca keranjang:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Simpan keranjang ke localStorage setiap kali ada perubahan
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('dapur_kita_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Gagal menyimpan keranjang:', e);
    }
  }, [cart, isLoaded]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((current) => ({ ...current, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        activeCategory === 'Semua' ||
        product.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const cartItems = products.filter(
    (product) => (cart[product.id] ?? 0) > 0
  );

  const totalItems = Object.values(cart).reduce(
    (total, quantity) => total + quantity,
    0
  );

  const subtotal = cartItems.reduce(
    (total, product) =>
      total + product.price * cart[product.id],
    0
  );

  const discount = totalItems >= 3 ? subtotal * 0.05 : 0;
  const total = subtotal - discount;

  function addToCart(id: string) {
    const product = products.find((p) => p.id === id);
    setCart((current) => ({
      ...current,
      [id]: (current[id] ?? 0) + 1,
    }));
    if (product) {
      setToast({
        message: `${product.name} telah dimasukkan ke keranjang!`,
        show: true,
      });
    }
  }

  function handleCheckout() {
    if (totalItems === 0) return;
    try {
      localStorage.setItem('dapur_kita_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Gagal menyimpan keranjang:', e);
    }
    setShowCart(false);
    router.push('/checkout');
  }

  function decreaseQuantity(id: string) {
    setCart((current) => {
      const next = { ...current };
      const quantity = next[id] ?? 0;

      if (quantity <= 1) {
        delete next[id];
      } else {
        next[id] = quantity - 1;
      }

      return next;
    });
  }

  return (
    <main className="min-h-screen bg-[#fffaf2] text-[#292b25]">
      <div className="bg-[#236b4b] px-4 py-2 text-center text-sm font-medium text-white">
        Diskon 5% untuk pembelian minimal 3 item — pesan sekarang!
      </div>

      <header className="sticky top-0 z-20 border-b border-black/5 bg-[#fffaf2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
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

          <nav className="hidden items-center gap-6 text-sm font-semibold text-[#5b5b51] md:flex">
            <a href="#beranda" className="text-[#236b4b]">
              Beranda
            </a>
            <a href="#produk">Semua Produk</a>
            <a href="#kategori">Kategori</a>
            <a href="#promo">Promo</a>
            <a href="#tentang">Tentang Kami</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-bold hover:bg-black/5 sm:inline-flex"
            >
              Masuk
            </Link>

            <button
              type="button"
              onClick={() => setShowCart(true)}
              className="flex items-center gap-2 rounded-full bg-[#236b4b] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#194f37]"
            >
              <ShoppingBag size={17} />
              <span>Keranjang ({totalItems})</span>
            </button>
          </div>
        </div>
      </header>

      <section
        id="beranda"
        className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 md:grid-cols-2 md:py-20"
      >
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#f4a261]/20 px-4 py-2 text-sm font-bold text-[#8c4a18]">
            ✦ Hangat, segar, dibuat sepenuh hati
          </span>

          <h1 className="mt-6 max-w-xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Makan enak,{' '}
            <span className="text-[#236b4b]">bahagia</span> setiap hari.
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-8 text-[#69695f]">
            Temukan makanan dan minuman favoritmu. Dibuat dengan
            bahan pilihan, dikemas dengan cinta, diantar sampai tujuan.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#produk"
              className="inline-flex items-center gap-2 rounded-full bg-[#236b4b] px-6 py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-0.5"
            >
              Pesan Sekarang <ArrowRight size={18} />
            </a>

            <a
              href="#kategori"
              className="rounded-full border border-black/10 px-6 py-3.5 font-bold hover:bg-white"
            >
              Jelajahi Menu
            </a>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#69695f]">
            <span className="flex items-center gap-2">
              <Clock3 size={16} className="text-[#236b4b]" />
              Buka setiap hari
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={16} className="text-[#236b4b]" />
              Pengiriman praktis
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-3 rotate-3 rounded-[2.5rem] bg-[#f4a261]/25" />

          <div className="relative overflow-hidden rounded-[2.25rem] shadow-2xl">
            <Image
              src="/images/makanan/Nasi-Goreng-telor.jpg"
              alt="Menu makanan Dapur Kita"
              width={1200}
              height={900}
              priority
              className="h-[350px] w-full object-cover sm:h-[460px]"
            />

            <div className="absolute bottom-5 left-5 rounded-2xl bg-white/95 p-4 shadow-lg">
              <div className="text-xs font-semibold text-[#77776c]">
                Pilihan pelanggan
              </div>
              <div className="mt-1 font-extrabold">
                Dibuat segar setiap hari 🌿
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="kategori"
        className="border-y border-black/5 bg-white/70 py-12"
      >
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-[#236b4b]">
            Pilih sesuai selera
          </p>

          <h2 className="mt-2 text-3xl font-black">
            Mau makan apa hari ini?
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {categories.map((category) => (
              <button
                type="button"
                key={category.name}
                onClick={() => {
                  setActiveCategory(category.name);
                  document
                    .getElementById('produk')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition hover:-translate-y-1 hover:shadow-lg ${
                  activeCategory === category.name
                    ? 'border-[#236b4b] bg-green-50'
                    : 'border-black/5 bg-[#fffaf2]'
                }`}
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#f4a261]/20 text-3xl">
                  {category.icon}
                </span>

                <span className="font-extrabold">
                  {category.name}
                  <span className="mt-1 block text-xs font-medium text-[#77776c]">
                    Lihat menu <ArrowRight size={12} className="inline" />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section
        id="produk"
        className="mx-auto max-w-7xl px-5 py-16"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.18em] text-[#236b4b]">
              Favorit minggu ini
            </p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">
              Menu pilihan untukmu
            </h2>
            <p className="mt-2 text-[#69695f]">
              Enak, praktis, dan siap menemani harimu.
            </p>
          </div>

          <label className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 text-sm text-[#77776c]">
            <Search size={17} />
            <input
              aria-label="Cari produk"
              placeholder="Cari menu..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-32 bg-transparent text-[#292b25] outline-none sm:w-44"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {['Semua', ...categories.map((category) => category.name)].map(
            (category) => (
              <button
                type="button"
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  activeCategory === category
                    ? 'bg-[#236b4b] text-white'
                    : 'border border-black/10 bg-white hover:border-[#236b4b]'
                }`}
              >
                {category}
              </button>
            )
          )}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-3xl border border-black/5 bg-white transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={900}
                    height={700}
                    className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold text-[#236b4b]">
                    {product.tag}
                  </span>
                </div>

                <div className="p-5">
                  <div className="text-xs font-semibold text-[#77776c]">
                    {product.category}
                  </div>

                  <h3 className="mt-2 min-h-12 text-lg font-extrabold">
                    {product.name}
                  </h3>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="font-black text-[#236b4b]">
                      {rupiah(product.price)}
                    </span>

                    <button
                      type="button"
                      onClick={() => addToCart(product.id)}
                      aria-label={`Tambah ${product.name} ke keranjang`}
                      className="grid h-10 w-10 place-items-center rounded-full bg-[#236b4b] text-white transition hover:bg-[#194f37]"
                    >
                      <Plus size={21} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center">
            <Search size={32} className="mx-auto text-[#236b4b]" />
            <h3 className="mt-3 text-lg font-extrabold">
              Menu tidak ditemukan
            </h3>
            <p className="mt-1 text-sm text-[#69695f]">
              Coba kata kunci lain atau pilih kategori berbeda.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setActiveCategory('Semua');
              }}
              className="mt-4 rounded-full bg-[#236b4b] px-5 py-2 text-sm font-bold text-white"
            >
              Tampilkan semua menu
            </button>
          </div>
        )}

        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Catatan: keranjang saat ini masih sementara dan belum tersambung
          ke database atau sistem pembayaran. Beberapa foto produk masih
          menggunakan foto lokal sebagai contoh. Ganti dengan foto produk
          yang sesuai sebelum website dipublikasikan.
        </p>
      </section>

      <section id="promo" className="px-5 pb-16">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[2rem] bg-[#236b4b] p-8 text-white sm:flex-row sm:items-center sm:p-12">
          <div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
              PROMO DAPUR KITA
            </span>

            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
              Makin banyak, makin hemat!
            </h2>

            <p className="mt-3 max-w-xl text-white/80">
              Belanja minimal 3 item dalam satu pesanan dan dapatkan
              diskon 5% dari subtotal.
            </p>
          </div>

          <a
            href="#produk"
            className="shrink-0 rounded-full bg-[#f4a261] px-6 py-3.5 font-extrabold text-[#30251b] hover:bg-[#f7b77e]"
          >
            Lihat Menu <ArrowRight size={17} className="ml-2 inline" />
          </a>
        </div>
      </section>

      <footer
        id="tentang"
        className="border-t border-black/5 bg-white px-5 py-10"
      >
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row">
          <div>
            <div className="text-xl font-black">
              Dapur<span className="text-[#236b4b]">Kita.</span>
            </div>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#69695f]">
              Makanan lezat dan minuman segar untuk menemani setiap
              momenmu.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm text-[#69695f]">
            <a href="#produk" className="hover:text-[#236b4b]">
              Semua Produk
            </a>
            <Link href="/login" className="hover:text-[#236b4b]">
              Masuk / Daftar
            </Link>
            <a href="#promo" className="hover:text-[#236b4b]">
              Promo
            </a>
            <a
              href="mailto:halo@dapurkita.example"
              className="hover:text-[#236b4b]"
            >
              Hubungi Kami
            </a>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-black/5 pt-5 text-xs text-[#77776c]">
          © {new Date().getFullYear()} Dapur Kita. Dibuat dengan sepenuh hati.
        </div>
      </footer>

      {showCart && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40"
          onClick={() => setShowCart(false)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Keranjang belanja"
            className="flex h-full w-full max-w-md flex-col bg-[#fffaf2] p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div>
                <h2 className="text-2xl font-black">Keranjang</h2>
                <p className="text-sm text-[#69695f]">
                  {totalItems} item dipilih
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCart(false)}
                aria-label="Tutup keranjang"
                className="rounded-full p-2 hover:bg-black/5"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto py-5">
              {cartItems.length === 0 ? (
                <div className="py-12 text-center">
                  <ShoppingBag
                    size={40}
                    className="mx-auto text-[#236b4b]"
                  />
                  <p className="mt-3 font-bold">
                    Keranjang masih kosong
                  </p>
                  <p className="mt-1 text-sm text-[#69695f]">
                    Yuk, pilih menu favoritmu!
                  </p>
                </div>
              ) : (
                cartItems.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">{product.name}</h3>
                      <p className="mt-1 text-sm font-bold text-[#236b4b]">
                        {rupiah(product.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(product.id)}
                        aria-label={`Kurangi ${product.name}`}
                        className="grid h-8 w-8 place-items-center rounded-full border border-black/10"
                      >
                        <Minus size={14} />
                      </button>

                      <span className="min-w-5 text-center font-bold">
                        {cart[product.id]}
                      </span>

                      <button
                        type="button"
                        onClick={() => addToCart(product.id)}
                        aria-label={`Tambah ${product.name}`}
                        className="grid h-8 w-8 place-items-center rounded-full bg-[#236b4b] text-white"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 border-t border-black/10 pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{rupiah(subtotal)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Diskon 5% (minimal 3 item)</span>
                <span className="font-bold text-[#236b4b]">
                  -{rupiah(discount)}
                </span>
              </div>

              <div className="flex justify-between border-t border-black/10 pt-3 text-lg font-black">
                <span>Total</span>
                <span className="text-[#236b4b]">{rupiah(total)}</span>
              </div>

              <button
                type="button"
                disabled={totalItems === 0}
                onClick={handleCheckout}
                className="w-full rounded-full bg-[#236b4b] px-5 py-3.5 font-bold text-white transition hover:bg-[#194f37] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Lanjut ke Checkout
              </button>

              <p className="text-center text-xs text-[#77776c]">
                Lanjut untuk mengisi nama, nomor WhatsApp, dan catatan pesanan.
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* Toast Notifikasi Ditambahkan ke Keranjang */}
      {toast.show && (
        <div className="fixed top-20 right-5 z-50 flex items-center gap-3 rounded-2xl bg-[#236b4b] px-5 py-3.5 text-white shadow-2xl transition-all sm:right-8">
          <CheckCircle2 size={20} className="text-[#f4a261]" />
          <span className="text-sm font-bold">{toast.message}</span>
          <button
            type="button"
            onClick={() => {
              setToast((t) => ({ ...t, show: false }));
              setShowCart(true);
            }}
            className="ml-2 rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-wide hover:bg-white/30"
          >
            Lihat
          </button>
          <button
            type="button"
            onClick={() => setToast((t) => ({ ...t, show: false }))}
            className="ml-1 text-white/70 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </main>
  );
}
