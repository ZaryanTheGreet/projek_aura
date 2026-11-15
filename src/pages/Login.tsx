import React, { useState } from 'react';
import { Button, Card } from '../components/UI';
import { Companion } from '../components/Companion';

interface LoginProps {
  onLoginSuccess: (email: string) => void;
  onLoadSample: () => void;
  onLoadEmpty: () => void;
  onNavigateToHR: () => void;
}

export const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onLoadSample,
  onLoadEmpty,
  onNavigateToHR,
}) => {
  const [email, setEmail] = useState('pekerja@perusahaan.co.id');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Masukkan alamat email kerja yang valid ya.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(email);
    }, 600);
  };

  return (
    <div className="app-container-no-nav" style={{ justifyContent: 'center', padding: '32px 20px' }}>
      <div style={{ textAlign: 'left', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Companion state="neutral" size={44} />
          <h1 className="text-h1" style={{ fontSize: 26 }}>Aura</h1>
        </div>
        <p className="text-body" style={{ color: 'var(--ink)' }}>
          Pendamping refleksi harian untuk pekerja perusahaan.
        </p>
        <p className="text-caption" style={{ marginTop: 4 }}>
          Catat hari kerjamu, pantau beban dari hari ke hari, dan dapatkan satu langkah kecil yang masuk akal.
        </p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="login-email" className="text-caption" style={{ display: 'block', marginBottom: 6 }}>
              Email kerja
            </label>
            <input
              id="login-email"
              type="email"
              className="aura-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@kantor.com"
              required
            />
            {errorMsg && (
              <p className="text-caption" style={{ color: 'var(--zone-heavy)', marginTop: 6 }}>
                {errorMsg}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            style={{ width: '100%', marginBottom: 12 }}
            disabled={loading}
          >
            {loading ? 'Menyiapkan ruangmu...' : 'Masuk'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            style={{ width: '100%' }}
            onClick={() => onLoginSuccess('google.user@perusahaan.co.id')}
          >
            Lanjut dengan Google
          </Button>
        </form>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        <button
          type="button"
          className="aura-btn-text"
          style={{ justifyContent: 'flex-start', padding: 0 }}
          onClick={onLoadSample}
        >
          <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: 8 }} />
          Muat data contoh 30 hari pekerja
        </button>
        <button
          type="button"
          className="aura-btn-text"
          style={{ justifyContent: 'flex-start', padding: 0 }}
          onClick={onLoadEmpty}
        >
          <i className="fa-solid fa-leaf" style={{ marginRight: 8 }} />
          Coba sebagai pengguna baru (data kosong)
        </button>
        <button
          type="button"
          className="aura-btn-text"
          style={{ justifyContent: 'flex-start', padding: 0, color: 'var(--ink)' }}
          onClick={onNavigateToHR}
        >
          <i className="fa-solid fa-user-group" style={{ marginRight: 8 }} />
          Masuk sebagai HRD (Dasbor Agregat)
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <p className="text-caption">
          Aplikasi ini dirancang berdasarkan prinsip jeda singkat dan pemulihan dari kerja; bukan diagnosis dan bukan pengganti bantuan profesional.
        </p>
      </div>
    </div>
  );
};
