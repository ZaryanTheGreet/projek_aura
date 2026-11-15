import React, { useState, useEffect } from 'react';
import { Card, Button, Chip } from '../components/UI';
import { BreakPlan } from '../types';
import { api } from '../api';

interface BreakPlannerProps {
  onBack: () => void;
}

const RITUAL_OPTIONS = [
  { id: 'close_laptop', label: 'Tutup laptop & rapikan meja', icon: 'fa-laptop' },
  { id: 'note_tomorrow', label: 'Catat sisa tugas untuk besok pagi', icon: 'fa-list-check' },
  { id: 'mute_chat', label: 'Matikan notifikasi chat kantor', icon: 'fa-bell-slash' },
  { id: 'walk_10m', label: 'Jalan kaki 10 menit di sekitar rumah/kantor', icon: 'fa-person-walking' },
  { id: 'wash_face', label: 'Mandi atau cuci muka dengan air sejuk', icon: 'fa-water' },
  { id: 'listen_music', label: 'Dengar musik favorit tanpa memikirkan kerja', icon: 'fa-music' },
  { id: 'chat_friend', label: 'Ngobrol santai dengan keluarga atau teman', icon: 'fa-user-group' },
];

export const BreakPlanner: React.FC<BreakPlannerProps> = ({ onBack }) => {
  const [endTime, setEndTime] = useState('18:00');
  const [selectedRituals, setSelectedRituals] = useState<string[]>(['close_laptop', 'note_tomorrow']);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    api.getBreakPlan().then((plan) => {
      setEndTime(plan.end_time || '18:00');
      setSelectedRituals(plan.ritual_ids || ['close_laptop', 'note_tomorrow']);
      setReminderEnabled(plan.reminder_enabled || false);
    });
  }, []);

  const handleToggleRitual = (id: string) => {
    if (selectedRituals.includes(id)) {
      setSelectedRituals(selectedRituals.filter((r) => r !== id));
    } else {
      if (selectedRituals.length < 3) {
        setSelectedRituals([...selectedRituals, id]);
      }
    }
  };

  const handleSave = async () => {
    const plan: BreakPlan = {
      end_time: endTime,
      ritual_ids: selectedRituals,
      reminder_enabled: reminderEnabled,
    };
    await api.saveBreakPlan(plan);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="app-container-no-nav" style={{ padding: '20px 20px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="text-h1" style={{ fontSize: 22 }}>Jeda & Batas Kerja</h1>
          <p className="text-caption">Ritual penutup agar pikiran lepas dari pekerjaan</p>
        </div>
        <Button variant="text" onClick={onBack} aria-label="Kembali">
          <i className="fa-solid fa-xmark" style={{ fontSize: 18 }} />
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <label htmlFor="end-time-input" className="text-body" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
          Jam Selesai Kerja
        </label>
        <p className="text-caption" style={{ marginBottom: 12 }}>
          Tentukan jam kapan kamu ingin berhenti bekerja setiap harinya.
        </p>
        <input
          id="end-time-input"
          type="time"
          className="aura-input"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          style={{ width: 140, fontSize: 18, fontWeight: 600 }}
        />
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <p className="text-body" style={{ fontWeight: 600, marginBottom: 4 }}>
          Ritual Menutup Hari (Pilih 1 - 3)
        </p>
        <p className="text-caption" style={{ marginBottom: 14 }}>
          Tindakan fisik atau mental kecil yang menandakan bahwa hari kerja sudah selesai.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {RITUAL_OPTIONS.map((r) => {
            const isChecked = selectedRituals.includes(r.id);
            return (
              <Chip
                key={r.id}
                icon={r.icon}
                active={isChecked}
                onClick={() => handleToggleRitual(r.id)}
                style={{ justifyContent: 'flex-start' }}
              >
                {r.label}
              </Chip>
            );
          })}
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="text-body" style={{ fontWeight: 600 }}>Nyalakan Pengingat Tutup Hari</p>
            <p className="text-caption">
              Tampilkan pesan pengingat lembut di Beranda pada jam {endTime}.
            </p>
          </div>
          <input
            type="checkbox"
            checked={reminderEnabled}
            onChange={(e) => setReminderEnabled(e.target.checked)}
            style={{ width: 22, height: 22, cursor: 'pointer' }}
            aria-label="Nyalakan Pengingat Tutup Hari"
          />
        </div>
      </Card>

      {savedSuccess && (
        <p className="text-caption" style={{ color: 'var(--zone-calm)', marginBottom: 12, fontWeight: 600 }}>
          Pengaturan jeda dan batas kerja berhasil disimpan.
        </p>
      )}

      <Button variant="primary" style={{ width: '100%', marginBottom: 12 }} onClick={handleSave}>
        Simpan pengaturan jeda
      </Button>
    </div>
  );
};
