import React, { useEffect, useState } from 'react';
import { Card, Button } from '../components/UI';
import { Companion } from '../components/Companion';
import { CARE_CONTACTS } from '../careContacts';
import { api } from '../api';
import { TrustedContact } from '../types';

interface CareModeProps {
  onBack: () => void;
  onOpenSettings: () => void;
}

export const CareMode: React.FC<CareModeProps> = ({ onBack, onOpenSettings }) => {
  const [trusted, setTrusted] = useState<TrustedContact | null>(null);

  useEffect(() => {
    api.getTrustedContact().then(setTrusted);
  }, []);

  const handleMessageTrusted = () => {
    if (!trusted || !trusted.phone) {
      onOpenSettings();
      return;
    }
    const cleanPhone = trusted.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent('Hai, aku lagi merasa berat hari ini. Boleh ngobrol sebentar?');
    const waUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="app-container-no-nav" style={{ padding: '24px 20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Companion state="neutral" mode="care" size={40} />
          <h1 className="text-h2">Ruang Bantuan & Dukungan</h1>
        </div>
        <Button variant="text" onClick={onBack} aria-label="Kembali">
          <i className="fa-solid fa-xmark" style={{ fontSize: 18 }} />
        </Button>
      </div>

      {/* Warm Empathetic Notice */}
      <Card style={{ marginBottom: 20 }}>
        <p className="text-body" style={{ fontWeight: 600, marginBottom: 8 }}>
          Kamu tidak harus menanggung semuanya sendirian.
        </p>
        <p className="text-body" style={{ color: 'var(--ink)' }}>
          Ketika beban kerja atau pikiran terasa terlalu penuh, berbicara dengan orang yang kamu percaya atau tenaga profesional bisa membantu memberi ruang bernapas.
        </p>
      </Card>

      {/* Trusted Contact (F5) */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <i className="fa-solid fa-hand-holding-heart" style={{ fontSize: 20, color: 'var(--ink)' }} />
          <h2 className="text-h2" style={{ fontSize: 18 }}>Orang Terdekatmu</h2>
        </div>
        {trusted ? (
          <div>
            <p className="text-body" style={{ marginBottom: 12 }}>
              {trusted.name} ({trusted.relation})
            </p>
            <Button
              variant="primary"
              style={{ width: '100%' }}
              onClick={handleMessageTrusted}
              icon="fa-comment-dots"
            >
              Kirim pesan ke {trusted.name}
            </Button>
            <p className="text-caption" style={{ marginTop: 8 }}>
              Teks pesan siap kirim: &quot;Hai, aku lagi merasa berat hari ini. Boleh ngobrol sebentar?&quot;
            </p>
          </div>
        ) : (
          <div>
            <p className="text-caption" style={{ marginBottom: 12 }}>
              Kamu belum mendaftarkan nomor orang tepercaya. Daftarkan di Pengaturan agar mudah dihubungi saat butuh teman bicara.
            </p>
            <Button variant="secondary" style={{ width: '100%' }} onClick={onOpenSettings}>
              Atur kontak tepercaya di Pengaturan
            </Button>
          </div>
        )}
      </Card>

      {/* Professional Care Contacts */}
      <div style={{ marginBottom: 24 }}>
        <h2 className="text-h2" style={{ fontSize: 18, marginBottom: 12 }}>
          Layanan Dukungan Profesional
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CARE_CONTACTS.map((c) => (
            <Card key={c.id} style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <p className="text-body" style={{ fontWeight: 600 }}>{c.name}</p>
                <span className="text-caption" style={{ fontSize: 11 }}>{c.category}</span>
              </div>
              <p className="text-caption" style={{ marginBottom: 8 }}>{c.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-caption" style={{ color: 'var(--ink)' }}>{c.availability}</span>
                {c.contact ? (
                  <a
                    href={c.contact}
                    target="_blank"
                    rel="noreferrer"
                    className="aura-btn aura-btn-secondary"
                    style={{ minHeight: 36, padding: '0 12px', fontSize: 13 }}
                  >
                    {c.displayContact}
                  </a>
                ) : (
                  <span className="text-caption">{c.displayContact}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Back button */}
      <div>
        <Button variant="secondary" style={{ width: '100%' }} onClick={onBack}>
          Kembali ke Beranda
        </Button>
        <p className="text-caption" style={{ textAlign: 'center', marginTop: 12 }}>
          Aura bukan diagnosis medis. Jika situasi terasa mendesak atau membahayakan, segera hubungi layanan darurat terdekat.
        </p>
      </div>
    </div>
  );
};
