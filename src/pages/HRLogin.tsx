import React, { useState } from 'react';
import { Card, Button, PasswordField, AuraLogo } from '../components/UI';
import { api } from '../api';

interface HRLoginProps {
  onLoginSuccess: () => void;
  onBackToEmployee: () => void;
}

export const HRLogin: React.FC<HRLoginProps> = ({ onLoginSuccess, onBackToEmployee }) => {
  const [email, setEmail] = useState('hr.people@perusahaan.co.id');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@') || !password.trim()) {
      setErrorMsg('Email kerja dan kata sandi wajib diisi ya.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      await api.loginHRSimulation(email);
      setLoading(false);
      onLoginSuccess();
    } catch {
      setLoading(false);
      setErrorMsg('Email atau kata sandi belum sesuai. Coba lagi ya.');
    }
  };

  return (
    <div className="app-container-no-nav" style={{ justifyContent: 'center', padding: '32px 20px' }}>
      <div style={{ textAlign: 'left', marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <AuraLogo badge="HRD" size="lg" />
          <p className="text-caption" style={{ marginTop: 6, display: 'block' }}>
            Dasbor Agregat Kesejahteraan Tim
          </p>
        </div>
        <p className="text-body" style={{ color: 'var(--ink)' }}>
          Masuk untuk memantau ringkasan beban kerja perusahaan secara agregat dan tanpa nama.
        </p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="hr-email" className="text-caption" style={{ display: 'block', marginBottom: 6 }}>
              Email kerja HRD
            </label>
            <input
              id="hr-email"
              type="email"
              className="aura-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hrd@kantor.com"
              required
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="hr-pass" className="text-caption" style={{ display: 'block', marginBottom: 6 }}>
              Kata sandi
            </label>
            <PasswordField
              id="hr-pass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {errorMsg && (
            <p className="text-caption" style={{ color: 'var(--zone-heavy)', marginBottom: 16 }}>
              {errorMsg}
            </p>
          )}

          <Button type="submit" variant="primary" style={{ width: '100%', marginBottom: 12 }} disabled={loading}>
            {loading ? 'Memverifikasi...' : 'Masuk sebagai HRD'}
          </Button>

          <Button type="button" variant="secondary" style={{ width: '100%' }} onClick={onBackToEmployee}>
            Kembali ke login karyawan
          </Button>
        </form>
      </Card>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <p className="text-caption">
          Dasbor ini hanya menampilkan ringkasan gabungan tanpa nama dari minimal 5 orang karyawan yang telah menyetujui opsi berbagi agregat. Catatan dan teks pribadi tidak pernah ditampilkan.
        </p>
      </div>
    </div>
  );
};
