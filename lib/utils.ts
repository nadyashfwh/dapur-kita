export function rupiah(value: number | string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value));
}

export type CartLine = { id: string; name: string; price: number; quantity: number };
export function calculateCart(lines: CartLine[]) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const discount = itemCount >= 3 ? Math.round(subtotal * 0.05) : 0;
  return { subtotal, itemCount, discount, total: subtotal - discount };
}
