export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  tag: string;
};

export type Category = {
  icon: string;
  name: string;
};

export const products: Product[] = [
  {
    id: '1',
    name: 'Sayur Lodeh',
    category: 'Makanan berat',
    price: 16000,
    image: '/images/makanan/sayur-lodeh.jpeg',
    tag: 'Segar',
  },
  {
    id: '2',
    name: 'Ayam Geprek',
    category: 'Makanan berat',
    price: 18000,
    image: '/images/makanan/ayam-geprek.jpeg',
    tag: 'Pedas',
  },
  {
    id: '3',
    name: 'Nasi Padang',
    category: 'Makanan berat',
    price: 20000,
    image: '/images/makanan/nasi-padang.jpeg',
    tag: 'Favorit',
  },
  {
    id: '4',
    name: 'Sayur Asem',
    category: 'Makanan berat',
    price: 10000,
    image: '/images/makanan/asayur-asem.jpeg',
    tag: 'Rumahan',
  },
  {
    id: '5',
    name: 'Matcha Ube Latte',
    category: 'Dessert',
    price: 25000,
    image: '/images/minuman/matcha-ube-late.jpeg',
    tag: 'Favorit',
  },
  {
    id: '6',
    name: 'Wedang Jahe',
    category: 'Minuman',
    price: 10000,
    image: '/images/minuman/wedang-jahe.jpeg',
    tag: 'Favorit',
  },
  {
    id: '7',
    name: 'Es Dawet',
    category: 'Minuman',
    price: 10000,
    image: '/images/minuman/es-dawet.jpeg',
    tag: 'Favorit',
  },
];

export const categories: Category[] = [
  { icon: '🍛', name: 'Makanan berat' },
  { icon: '🥤', name: 'Minuman' },
  { icon: '🍟', name: 'Camilan' },
  { icon: '🍰', name: 'Dessert' },
];
