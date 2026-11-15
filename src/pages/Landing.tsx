import React from 'react';
import { Card, Button } from '../components/UI';
import { Companion } from '../components/Companion';

interface LandingProps {
  onStart: () => void;
  onLoginHR: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart, onLoginHR }) => {
  return (
    <div className="app-container-no-nav" style={{ padding: '32px 20px', minHeight: '100vh', justifyContent: 'space-between' }}>
      <div>
        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Companion state="neutral" size={38} />
            <span style={{ fontSize: 22, fontWeight: 700 }}>Aura</span>
          </div>
          <button
            type="button"
            className="aura-btn-text"
            onClick={onLoginHR}
            style={{ fontSize: 13, color: 'var(--ink)' }}
          >
            Masuk sebagai HRD
          </button>
        </div>

        {/* Hero Editorial Statement */}
        <div style={{ marginBottom: 28 }}>
          <h1 className="text-h1" style={{ fontSize: 26, lineHeight: 1.3, marginBottom: 12 }}>
            Hari kerjamu terasa berat? Dapatkan ruang tenang dan satu langkah kecil yang masuk akal.
          </h1>
          <p className="text-body" style={{ color: 'var(--ink-muted)' }}>
            Pendamping refleksi harian untuk pekerja. Tanpa streak, tanpa target poin, tanpa rasa bersalah.
          </p>
        </div>

        {/* 3 Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          <Card style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'var(--ink)',
                  color: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                1
              </div>
              <div>
                <h2 className="text-h2" style={{ fontSize: 16, marginBottom: 2 }}>Tulis atau Check-in</h2>
                <p className="text-caption">
                  Ceritakan harimu secara bebas, atau gunakan check-in cepat 30 detik tanpa mengetik saat terlalu lelah.
                </p>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'var(--ink)',
                  color: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <div>
                <h2 className="text-h2" style={{ fontSize: 16, marginBottom: 2 }}>Pahami Pola Beban</h2>
                <p className="text-caption">
                  Lihat indeks burnout 7 hari dan peta pemicu untuk menyadari kapan beban kerjamu mulai menumpuk.
                </p>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'var(--ink)',
                  color: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                3
              </div>
              <div>
                <h2 className="text-h2" style={{ fontSize: 16, marginBottom: 2 }}>Langkah Kecil Nyata</h2>
                <p className="text-caption">
                  Dapatkan satu latihan mikro 2-10 menit yang dipandu langkah demi langkah untuk membantu tubuh dan pikiran melambat.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer & CTA */}
      <div>
        <Button variant="primary" style={{ width: '100%', marginBottom: 16 }} onClick={onStart}>
          Mulai Refleksi Sekarang
        </Button>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <p className="text-caption" style={{ marginBottom: 6 }}>
            Catatanmu hanya untukmu. Perusahaan hanya bisa melihat ringkasan gabungan tanpa nama, dan hanya jika kamu memilih ikut.
          </p>
          <p className="text-caption" style={{ fontSize: 11 }}>
            Dirancang berdasarkan prinsip jeda singkat dan pemulihan kerja; bukan alat diagnosis klinis atau pengganti bantuan medis.
          </p>
        </div>
      </div>
    </div>
  );
};
