import { useMemo, useState } from 'react';

import { LauncherButton, LauncherGesture } from '@shared/screen';

type ModuleDescriptor = {
  id: string;
  name: string;
  description: string;
  icon: string;
  highlights: string[];
  command: string;
  port: number;
  productionPath: string;
};

const modules: ModuleDescriptor[] = [
  {
    id: 'meng-pos',
    name: 'Meng POS Cashier',
    description:
      'Front-of-house cashier built for quick-service operators with keyboard-first controls.',
    icon: '[POS]',
    highlights: ['Fast tap ordering', 'Keyboard & touch friendly', 'Simple tax handling'],
    command: 'npm run dev --workspace apps/meng',
    port: 5001,
    productionPath: '/meng',
  },
];

function buildModuleUrl(module: ModuleDescriptor) {
  if (import.meta.env.DEV) {
    // In Replit environment, use the dev domain instead of localhost
    const replitDomain = import.meta.env.VITE_REPLIT_DEV_DOMAIN;
    if (replitDomain) {
      return `https://${replitDomain.replace(':5000', `:${module.port}`)}`;
    }
    return `http://localhost:${module.port}`;
  }

  return module.productionPath;
}

function MengPreview() {
  const previewItems = useMemo(
    () => [
      { name: 'Kopi Susu', price: 'Rp25.000', badge: 'KS' },
      { name: 'Nasi Goreng', price: 'Rp32.000', badge: 'NG' },
      { name: 'Risoles Mayo', price: 'Rp10.000', badge: 'RM' },
      { name: 'Es Teh Manis', price: 'Rp12.000', badge: 'ET' },
    ],
    [],
  );

  return (
    <div className="main-screen__preview">
      <div className="main-screen__preview-pane">
        <h3>Menu Cepat</h3>
        <div className="main-screen__preview-products">
          {previewItems.map((item) => (
            <div key={item.name} className="main-screen__preview-card">
              <span aria-hidden="true">{item.badge}</span>
              <strong>{item.name}</strong>
              <span>{item.price}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="main-screen__preview-pane">
        <h3>Tiket Pesanan</h3>
        <div className="main-screen__preview-ticket">
          <dl>
            <div>
              <dt>Kopi Susu x 2</dt>
              <dd>Rp50.000</dd>
            </div>
            <div>
              <dt>Nasi Goreng</dt>
              <dd>Rp32.000</dd>
            </div>
            <div>
              <dt>PPN 10%</dt>
              <dd>Rp8.200</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>Rp90.200</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

export function MainScreen() {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const activeModule = activeModuleId
    ? modules.find((module) => module.id === activeModuleId)
    : null;

  return (
    <div className="main-screen">
      <header className="main-screen__header">
        <div className="main-screen__headline">
          <div>
            <h1 className="main-screen__title">Yuzha Yo Launcher</h1>
            <p className="main-screen__subtitle">
              Pilih modul untuk dijalankan, optimalkan pengalaman kasir, dan kelola staging dari satu layar.
            </p>
          </div>
          <LauncherGesture
            label="Navigasi"
            keys={['Ctrl', 'K']}
            hint="Buka palet aksi"
          />
        </div>
      </header>

      {activeModule ? (
        <section className="main-screen__detail-card">
          <header className="main-screen__detail-header">
            <button
              className="main-screen__back"
              type="button"
              onClick={() => setActiveModuleId(null)}
            >
              &larr; Kembali
            </button>
            <h2>
              {activeModule.icon} {activeModule.name}
            </h2>
            <p>{activeModule.description}</p>
            <ul className="main-screen__feature-list">
              {activeModule.highlights.map((item) => (
                <li key={item} className="main-screen__feature">
                  {item}
                </li>
              ))}
            </ul>
          </header>

          <MengPreview />

          <div className="main-screen__detail-actions">
            <LauncherButton
              title="Buka Modul"
              description="Luncurkan aplikasi dalam tab baru."
              icon="[go]"
              meta="->"
              href={buildModuleUrl(activeModule)}
            />
            <LauncherButton
              title="Salin Perintah Dev"
              description="Jalankan modul secara lokal melalui CLI."
              icon="[cli]"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  void navigator.clipboard.writeText(activeModule.command);
                  return;
                }

                if (typeof window !== 'undefined') {
                  window.prompt('Salin perintah berikut', activeModule.command);
                }
              }}
            />
            <div className="main-screen__command">{activeModule.command}</div>
          </div>
        </section>
      ) : (
        <section className="main-screen__grid">
          {modules.map((module) => (
            <LauncherButton
              key={module.id}
              title={`${module.icon} ${module.name}`}
              description={module.description}
              meta="Detail"
              onClick={() => setActiveModuleId(module.id)}
            />
          ))}
        </section>
      )}
    </div>
  );
}

