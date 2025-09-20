import { useMemo, useState } from "react";

import { LauncherButton } from "@shared/screen";

import "./index.css";

type Product = {
  id: string;
  name: string;
  price: number;
  category: "Beverages" | "Food" | "Snacks";
  badge: string;
};

type OrderLine = {
  productId: string;
  quantity: number;
};

const products: Product[] = [
  { id: "kopi-susu", name: "Kopi Susu", price: 25000, category: "Beverages", badge: "KS" },
  { id: "es-teh", name: "Es Teh Manis", price: 12000, category: "Beverages", badge: "ET" },
  { id: "nasi-goreng", name: "Nasi Goreng", price: 32000, category: "Food", badge: "NG" },
  { id: "mi-ayam", name: "Mi Ayam", price: 28000, category: "Food", badge: "MA" },
  { id: "risoles", name: "Risoles Mayo", price: 10000, category: "Snacks", badge: "RM" },
  { id: "pisang-goreng", name: "Pisang Goreng", price: 8000, category: "Snacks", badge: "PG" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

const TAX_RATE = 0.1;

export function App() {
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);

  const addToOrder = (productId: string) => {
    setOrderLines((prev) => {
      const existing = prev.find((line) => line.productId === productId);
      if (existing) {
        return prev.map((line) =>
          line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }

      return [...prev, { productId, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, nextQuantity: number) => {
    setOrderLines((prev) => {
      if (nextQuantity <= 0) {
        return prev.filter((line) => line.productId !== productId);
      }

      return prev.map((line) =>
        line.productId === productId ? { ...line, quantity: nextQuantity } : line,
      );
    });
  };

  const totals = useMemo(() => {
    const subtotal = orderLines.reduce((sum, line) => {
      const product = products.find((item) => item.id === line.productId);
      if (!product) return sum;
      return sum + product.price * line.quantity;
    }, 0);

    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [orderLines]);

  const clearOrder = () => setOrderLines([]);

  return (
    <main className="meng-pos">
      <section className="meng-pos__catalog">
        <header className="meng-pos__section-heading">
          <h1>Kasir Meng POS</h1>
          <p>Pilih menu untuk ditambahkan ke pesanan aktif.</p>
        </header>

        <div className="meng-pos__product-grid">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              className="meng-pos__product-card"
              onClick={() => addToOrder(product.id)}
            >
              <span className="meng-pos__product-emoji" aria-hidden="true">
                {product.badge}
              </span>
              <span className="meng-pos__product-name">{product.name}</span>
              <span className="meng-pos__product-price">{formatCurrency(product.price)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="meng-pos__ticket">
        <header className="meng-pos__section-heading">
          <h2>Pesanan Aktif</h2>
          <p>
            {orderLines.length ? "Sesuaikan jumlah dan selesaikan pembayaran." : "Belum ada item."}
          </p>
        </header>

        <div className="meng-pos__ticket-lines" role="list">
          {orderLines.length === 0 ? (
            <div className="meng-pos__empty">Tambah pesanan dari menu di sebelah kiri.</div>
          ) : (
            orderLines.map((line) => {
              const product = products.find((item) => item.id === line.productId);
              if (!product) return null;

              return (
                <div key={line.productId} className="meng-pos__line" role="listitem">
                  <div className="meng-pos__line-info">
                    <span className="meng-pos__line-name">{product.name}</span>
                    <span className="meng-pos__line-price">{formatCurrency(product.price)}</span>
                  </div>
                  <div className="meng-pos__line-actions">
                    <button
                      type="button"
                      className="meng-pos__quantity-btn"
                      onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                      aria-label={`Kurangi ${product.name}`}
                    >
                      -
                    </button>
                    <span className="meng-pos__quantity-value" aria-live="polite">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className="meng-pos__quantity-btn"
                      onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                      aria-label={`Tambah ${product.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <footer className="meng-pos__totals">
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatCurrency(totals.subtotal)}</dd>
            </div>
            <div>
              <dt>PPN (10%)</dt>
              <dd>{formatCurrency(totals.tax)}</dd>
            </div>
            <div className="meng-pos__grand-total">
              <dt>Total</dt>
              <dd>{formatCurrency(totals.total)}</dd>
            </div>
          </dl>

          <div className="meng-pos__actions">
            <LauncherButton
              title="Bayar Pesanan"
              description="Terima pembayaran non-tunai atau tunai."
              icon="[pay]"
              disabled={!orderLines.length}
              onClick={() => {
                if (!orderLines.length) return;
                alert(`Pesanan berhasil: total ${formatCurrency(totals.total)}`);
                clearOrder();
              }}
            />
            <LauncherButton
              title="Batalkan"
              description="Reset keranjang dan mulai ulang."
              icon="[reset]"
              disabled={!orderLines.length}
              onClick={clearOrder}
            />
          </div>
        </footer>
      </section>
    </main>
  );
}
