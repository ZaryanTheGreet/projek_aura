import React, { useState, useEffect } from 'react';
import { Card, Button, Chip } from '../components/UI';
import { api } from '../api';
import { ReminderConfig, TrustedContact } from '../types';
import { useTheme, ThemeOption } from '../context/ThemeContext';

interface SettingsProps {
  onBack: () => void;
  onOpenBreakPlanner: () => void;
  onOpenExportData: () => void;
  onLogout: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  onBack,
  onOpenBreakPlanner,
  onOpenExportData,
  onLogout,
}) => {
  const { theme, setTheme } = useTheme();

  // Trusted contact (F5)
  const [trustedName, setTrustedName] = useState('');
  const [trustedRelation, setTrustedRelation] = useState<'Teman' | 'Keluarga' | 'Pasangan' | 'Rekan kerja tepercaya' | 'Mentor' | 'Lainnya'>('Teman');
  const [trustedPhone, setTrustedPhone] = useState('');
  const [trustedSaved, setTrustedSaved] = useState(false);

  // Reminders (F10)
  const [reminders, setReminders] = useState<ReminderConfig | null>(null);
  const [testNotificationResult, setTestNotificationResult] = useState('');

  // HR Opt-in
  const [hrOptIn, setHrOptIn] = useState(false);

  // Delete all data modal (2-step)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    api.getTrustedContact().then((c) => {
      if (c) {
        setTrustedName(c.name);
        setTrustedRelation(c.relation);
        setTrustedPhone(c.phone);
      }
    });

    api.getReminders().then(setReminders);
    setHrOptIn(api.getHROptIn());
  }, []);

  const handleSaveTrustedContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trustedName.trim()) return;

    const contact: TrustedContact = {
      name: trustedName.trim(),
      relation: trustedRelation,
      phone: trustedPhone.trim(),
    };
    await api.saveTrustedContact(contact);
    setTrustedSaved(true);
    setTimeout(() => setTrustedSaved(false), 2000);
  };

  const handleToggleReminder = async (type: 'close_day' | 'daily_note') => {
    if (!reminders) return;
    const updated = {
      ...reminders,
      [type]: {
        ...reminders[type],
        enabled: !reminders[type].enabled,
      },
    };
    setReminders(updated);
    await api.saveReminders(updated);

    // If enabling, request permission politely
    if (updated[type].enabled && 'Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch {}
    }
  };

  const handleToggleDay = async (type: 'close_day' | 'daily_note', dayNum: number) => {
    if (!reminders) return;
    const currentDays = reminders[type].days;
    const newDays = currentDays.includes(dayNum)
      ? currentDays.filter((d) => d !== dayNum)
      : [...currentDays, dayNum].sort();

    const updated = {
      ...reminders,
      [type]: {
        ...reminders[type],
        days: newDays,
      },
    };
    setReminders(updated);
    await api.saveReminders(updated);
  };

  const handleTimeChange = async (type: 'close_day' | 'daily_note', timeVal: string) => {
    if (!reminders) return;
    const updated = {
      ...reminders,
      [type]: {
        ...reminders[type],
        time: timeVal,
      },
    };
    setReminders(updated);
    await api.saveReminders(updated);
  };

  // Test local notification (F10)
  const handleTestNotification = async () => {
    if (!('Notification' in window)) {
      setTestNotificationResult('Browser ini belum mendukung fitur notifikasi web.');
      return;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification('Aura', {
            body: 'Sudah jamnya menutup hari kerja. Waktunya memberi jeda untuk dirimu?',
            icon: '/icon.svg',
          });
        } else {
          new Notification('Aura', {
            body: 'Sudah jamnya menutup hari kerja. Waktunya memberi jeda untuk dirimu?',
            icon: '/icon.svg',
          });
        }
        setTestNotificationResult('Notifikasi contoh terkirim.');
      } catch {
        setTestNotificationResult('Gagal menampilkan notifikasi.');
      }
    } else {
      setTestNotificationResult('Izin notifikasi belum diaktifkan di pengaturan browsermu.');
    }
    setTimeout(() => setTestNotificationResult(''), 3000);
  };

  // Generate .ics file client-side (F10 L3)
  const handleGenerateICS = () => {
    const calendarTitle = reminders?.calendar_title || 'Waktunya menutup hari kerja';
    const closeTime = reminders?.close_day.time || '18:00';
    const [hh, mm] = closeTime.split(':');

    // RRULE for Mon-Fri
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Aura Reflection//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `SUMMARY:${calendarTitle}`,
      'DESCRIPTION:Pengingat lembut dari Aura untuk mulai menutup hari kerja dan melepas beban pikiran.',
      `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR`,
      `DTSTART;TZID=Asia/Jakarta:20261102T${hh}${mm}00`,
      `DTEND;TZID=Asia/Jakarta:20261102T${hh}${mm}00`,
      'BEGIN:VALARM',
      'TRIGGER:-PT0M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${calendarTitle}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aura-pengingat-menutup-hari.ics';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleHROptIn = (val: boolean) => {
    setHrOptIn(val);
    api.setHROptIn(val);
  };

  const handleDeleteAllConfirm = async () => {
    await api.clearAllData();
    setShowDeleteModal(false);
    setDeleteSuccess(true);
    setTimeout(() => {
      onLogout();
    }, 1200);
  };

  const dayLabels = [
    { num: 1, label: 'Sen' },
    { num: 2, label: 'Sel' },
    { num: 3, label: 'Rab' },
    { num: 4, label: 'Kam' },
    { num: 5, label: 'Jum' },
    { num: 6, label: 'Sab' },
    { num: 7, label: 'Min' },
  ];

  return (
    <div className="app-container-no-nav" style={{ padding: '20px 20px 36px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="text-h1" style={{ fontSize: 22 }}>Pengaturan</h1>
          <p className="text-caption">Preferensi, privasi, dan kendali datamu</p>
        </div>
        <Button variant="text" onClick={onBack} aria-label="Kembali ke Beranda">
          <i className="fa-solid fa-xmark" style={{ fontSize: 18 }} />
        </Button>
      </div>

      {/* Section 1: Tampilan (Theme) */}
      <Card style={{ marginBottom: 16 }}>
        <h2 className="text-h2" style={{ fontSize: 16, marginBottom: 8 }}>Tampilan</h2>
        <p className="text-caption" style={{ marginBottom: 12 }}>
          Pilih tema yang paling nyaman untuk matamu saat membaca catatan.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['light', 'dark', 'system'] as ThemeOption[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`aura-chip ${theme === t ? 'active' : ''}`}
              onClick={() => setTheme(t)}
              style={{ flex: 1 }}
            >
              {t === 'light' ? 'Terang' : t === 'dark' ? 'Gelap' : 'Otomatis'}
            </button>
          ))}
        </div>
      </Card>

      {/* Section 2: Pengingat Lembut (F10) */}
      <Card style={{ marginBottom: 16 }}>
        <h2 className="text-h2" style={{ fontSize: 16, marginBottom: 6 }}>Pengingat Lembut</h2>
        <p className="text-caption" style={{ marginBottom: 14 }}>
          Mengingatkanmu di jam yang kamu tentukan tanpa menekan.
        </p>

        {reminders && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Reminder 1: Menutup hari kerja */}
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <p className="text-body" style={{ fontWeight: 600, fontSize: 14 }}>Menutup hari kerja</p>
                  <p className="text-caption">Ajakan mulai istirahat saat jam kerja selesai</p>
                </div>
                <input
                  type="checkbox"
                  checked={reminders.close_day.enabled}
                  onChange={() => handleToggleReminder('close_day')}
                  style={{ width: 20, height: 20, cursor: 'pointer' }}
                  aria-label="Toggle pengingat menutup hari kerja"
                />
              </div>

              {reminders.close_day.enabled && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <label htmlFor="close-time" className="text-caption" style={{ fontWeight: 600 }}>Jam:</label>
                    <input
                      id="close-time"
                      type="time"
                      className="aura-input"
                      value={reminders.close_day.time}
                      onChange={(e) => handleTimeChange('close_day', e.target.value)}
                      style={{ width: 110, padding: '4px 8px', fontSize: 14 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {dayLabels.map((d) => (
                      <Chip
                        key={d.num}
                        active={reminders.close_day.days.includes(d.num)}
                        onClick={() => handleToggleDay('close_day', d.num)}
                        style={{ minHeight: 30, padding: '0 8px', fontSize: 12 }}
                      >
                        {d.label}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reminder 2: Catatan harian */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <p className="text-body" style={{ fontWeight: 600, fontSize: 14 }}>Catatan harian</p>
                  <p className="text-caption">Waktu luang singkat untuk check-in refleksi</p>
                </div>
                <input
                  type="checkbox"
                  checked={reminders.daily_note.enabled}
                  onChange={() => handleToggleReminder('daily_note')}
                  style={{ width: 20, height: 20, cursor: 'pointer' }}
                  aria-label="Toggle pengingat catatan harian"
                />
              </div>

              {reminders.daily_note.enabled && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <label htmlFor="daily-time" className="text-caption" style={{ fontWeight: 600 }}>Jam:</label>
                    <input
                      id="daily-time"
                      type="time"
                      className="aura-input"
                      value={reminders.daily_note.time}
                      onChange={(e) => handleTimeChange('daily_note', e.target.value)}
                      style={{ width: 110, padding: '4px 8px', fontSize: 14 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {dayLabels.map((d) => (
                      <Chip
                        key={d.num}
                        active={reminders.daily_note.days.includes(d.num)}
                        onClick={() => handleToggleDay('daily_note', d.num)}
                        style={{ minHeight: 30, padding: '0 8px', fontSize: 12 }}
                      >
                        {d.label}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons: Test Notification & Calendar .ics */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <Button variant="secondary" onClick={handleTestNotification} style={{ minHeight: 36, fontSize: 13, padding: '0 12px' }}>
                <i className="fa-solid fa-bolt" style={{ marginRight: 6 }} />
                Tes pengingat sekarang
              </Button>
              <Button variant="secondary" onClick={handleGenerateICS} style={{ minHeight: 36, fontSize: 13, padding: '0 12px' }}>
                <i className="fa-solid fa-download" style={{ marginRight: 6 }} />
                Tambahkan ke kalender (.ics)
              </Button>
            </div>

            {testNotificationResult && (
              <p className="text-caption" style={{ color: 'var(--ink)' }}>
                {testNotificationResult}
              </p>
            )}

            <p className="text-caption" style={{ fontStyle: 'italic', fontSize: 12 }}>
              Pengingat browser muncul saat Aura terbuka atau terpasang di layar utama. Untuk pengingat yang selalu aktif saat aplikasi tertutup, unduh dan tambahkan ke kalender kerjamu.
            </p>
          </div>
        )}
      </Card>

      {/* Section 3: Orang Tepercaya (F5) */}
      <Card style={{ marginBottom: 16 }}>
        <h2 className="text-h2" style={{ fontSize: 16, marginBottom: 6 }}>Orang Tepercaya (Jalan Pintas Bantuan)</h2>
        <p className="text-caption" style={{ marginBottom: 12 }}>
          Simpan kontak orang terdekat agar mudah dihubungi saat situasi terasa berat. Hanya kamu yang bisa melihat kontak ini.
        </p>

        <form onSubmit={handleSaveTrustedContact}>
          <div style={{ marginBottom: 10 }}>
            <label htmlFor="contact-name" className="text-caption" style={{ display: 'block', marginBottom: 4 }}>
              Nama orang tepercaya
            </label>
            <input
              id="contact-name"
              type="text"
              className="aura-input"
              value={trustedName}
              onChange={(e) => setTrustedName(e.target.value)}
              placeholder="Contoh: Rani / Dimas"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label htmlFor="contact-relation" className="text-caption" style={{ display: 'block', marginBottom: 4 }}>
                Hubungan
              </label>
              <select
                id="contact-relation"
                className="aura-input"
                value={trustedRelation}
                onChange={(e) => setTrustedRelation(e.target.value as any)}
                style={{ fontSize: 14 }}
              >
                <option value="Teman">Teman</option>
                <option value="Keluarga">Keluarga</option>
                <option value="Pasangan">Pasangan</option>
                <option value="Rekan kerja tepercaya">Rekan kerja tepercaya</option>
                <option value="Mentor">Mentor</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label htmlFor="contact-phone" className="text-caption" style={{ display: 'block', marginBottom: 4 }}>
                Nomor WhatsApp
              </label>
              <input
                id="contact-phone"
                type="tel"
                className="aura-input"
                value={trustedPhone}
                onChange={(e) => setTrustedPhone(e.target.value)}
                placeholder="0812xxxxxxx"
              />
            </div>
          </div>

          {trustedSaved && (
            <p className="text-caption" style={{ color: 'var(--zone-calm)', marginBottom: 8, fontWeight: 600 }}>
              Kontak tepercaya berhasil disimpan.
            </p>
          )}

          <Button type="submit" variant="secondary" style={{ width: '100%', minHeight: 40, fontSize: 14 }}>
            Simpan kontak tepercaya
          </Button>
        </form>
      </Card>

      {/* Section 4: Jeda dan Batas Kerja (F6) */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="text-h2" style={{ fontSize: 16 }}>Jeda & Batas Kerja</h2>
            <p className="text-caption">Atur jam selesai kerja dan ritual penutup harian</p>
          </div>
          <Button variant="secondary" onClick={onOpenBreakPlanner} style={{ minHeight: 38, fontSize: 13, padding: '0 12px' }}>
            Atur ritual
          </Button>
        </div>
      </Card>

      {/* Section 5: Unduh Catatan & Portabilitas (F9) */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="text-h2" style={{ fontSize: 16 }}>Unduh Catatanku</h2>
            <p className="text-caption">Simpan salinan catatanmu sebagai dokumen PDF atau JSON</p>
          </div>
          <Button variant="secondary" onClick={onOpenExportData} style={{ minHeight: 38, fontSize: 13, padding: '0 12px' }}>
            Lihat salinan
          </Button>
        </div>
      </Card>

      {/* Section 6: Privasi & Ringkasan Perusahaan */}
      <Card style={{ marginBottom: 16 }}>
        <h2 className="text-h2" style={{ fontSize: 16, marginBottom: 6 }}>Privasi & Data Perusahaan</h2>
        <p className="text-caption" style={{ marginBottom: 12 }}>
          Catatanmu hanya untukmu. Perusahaan hanya bisa melihat ringkasan gabungan tanpa nama, dan hanya jika kamu memilih ikut.
        </p>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderTop: '1px solid var(--border)' }}>
          <input
            id="hr-opt-in-check"
            type="checkbox"
            checked={hrOptIn}
            onChange={(e) => handleToggleHROptIn(e.target.checked)}
            style={{ width: 20, height: 20, cursor: 'pointer', marginTop: 2 }}
          />
          <label htmlFor="hr-opt-in-check" style={{ fontSize: 13, color: 'var(--ink)', cursor: 'pointer' }}>
            Ikut ringkasan gabungan perusahaan
            <span className="text-caption" style={{ display: 'block', marginTop: 2 }}>
              Hanya angka gabungan tanpa nama yang dihitung dari minimal 5 orang. Isi jurnalmu tidak pernah ikut.
            </span>
          </label>
        </div>

        <p className="text-caption" style={{ marginTop: 10, fontStyle: 'italic', fontSize: 12 }}>
          Teks jurnalmu diproses oleh layanan AI pihak ketiga untuk menghasilkan analisis.
        </p>
      </Card>

      {/* Section 7: Hapus Data Saya (Two-step confirmation modal) */}
      <Card style={{ marginBottom: 24, border: '1px solid var(--border-control)' }}>
        <h2 className="text-h2" style={{ fontSize: 16, marginBottom: 4 }}>Hapus Semua Data</h2>
        <p className="text-caption" style={{ marginBottom: 12 }}>
          Menghapus seluruh catatan refleksi, riwayat sesi latihan, dan pengaturan dari perangkat ini.
        </p>
        <Button variant="secondary" onClick={() => setShowDeleteModal(true)} style={{ width: '100%', minHeight: 40, fontSize: 14 }}>
          Hapus semua data saya
        </Button>
      </Card>

      {/* Logout */}
      <Button variant="secondary" style={{ width: '100%' }} onClick={onLogout}>
        <i className="fa-solid fa-right-from-bracket" style={{ marginRight: 8 }} />
        Keluar dari akun
      </Button>

      {/* Delete Confirmation Modal (2-step) */}
      {showDeleteModal && (
        <div className="aura-overlay" role="dialog" aria-modal="true">
          <div className="aura-sheet" style={{ padding: 24 }}>
            <h2 className="text-h2" style={{ marginBottom: 8 }}>
              Hapus semua data catatanmu?
            </h2>
            <p className="text-body" style={{ color: 'var(--ink-muted)', marginBottom: 20 }}>
              Tindakan ini tidak bisa dibatalkan. Seluruh riwayat jurnal, check-in, dan kontak tepercaya akan dihapus permanen dari perangkat ini.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button variant="primary" onClick={handleDeleteAllConfirm}>
                Ya, hapus permanen
              </Button>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteSuccess && (
        <div className="aura-overlay" role="dialog">
          <div className="aura-sheet" style={{ padding: 24, textAlign: 'center' }}>
            <p className="text-body" style={{ fontWeight: 600 }}>Semua data telah dihapus.</p>
          </div>
        </div>
      )}
    </div>
  );
};
