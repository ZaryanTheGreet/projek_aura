import React, { useState, useEffect } from 'react';
import { BottomSheet, Button, Chip } from '../components/UI';
import { Companion } from '../components/Companion';
import { CheckinInput, TriggerCategory } from '../types';

interface QuickCheckinSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CheckinInput) => void;
  loading?: boolean;
}

export const QuickCheckinSheet: React.FC<QuickCheckinSheetProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [mentalStress, setMentalStress] = useState<number | null>(null);
  const [energyDrain, setEnergyDrain] = useState<number | null>(null);
  const [sleepBucket, setSleepBucket] = useState<'lt5' | '5_6' | '7_8' | 'gt8' | null>(null);
  const [triggerCategory, setTriggerCategory] = useState<TriggerCategory | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMentalStress(null);
      setEnergyDrain(null);
      setSleepBucket(null);
      setTriggerCategory(null);
    }
  }, [isOpen]);

  const isComplete =
    mentalStress !== null &&
    energyDrain !== null &&
    sleepBucket !== null &&
    triggerCategory !== null;

  const handleSubmit = () => {
    if (!isComplete) return;
    onSubmit({
      mental_stress: mentalStress!,
      energy_drain: energyDrain!,
      sleep_bucket: sleepBucket!,
      trigger_category: triggerCategory!,
    });
  };

  const handleClose = () => {
    setMentalStress(null);
    setEnergyDrain(null);
    setSleepBucket(null);
    setTriggerCategory(null);
    onClose();
  };

  const mentalOptions = [
    { val: 1, label: '1 Tenang' },
    { val: 2, label: '2 Cukup ringan' },
    { val: 3, label: '3 Lumayan tegang' },
    { val: 4, label: '4 Berat' },
    { val: 5, label: '5 Sangat berat' },
  ];

  const energyOptions = [
    { val: 1, label: '1 Segar' },
    { val: 2, label: '2 Cukup' },
    { val: 3, label: '3 Biasa saja' },
    { val: 4, label: '4 Lelah' },
    { val: 5, label: '5 Habis' },
  ];

  const sleepOptions: { val: 'lt5' | '5_6' | '7_8' | 'gt8'; label: string }[] = [
    { val: 'lt5', label: 'Kurang dari 5 jam' },
    { val: '5_6', label: '5-6 jam' },
    { val: '7_8', label: '7-8 jam' },
    { val: 'gt8', label: 'Lebih dari 8 jam' },
  ];

  const triggerOptions: { val: TriggerCategory; label: string; icon: string }[] = [
    { val: 'workload', label: 'Beban dan deadline kerja', icon: 'fa-list-check' },
    { val: 'relasi_kerja', label: 'Atasan atau rekan kerja', icon: 'fa-user-group' },
    { val: 'fisik_istirahat', label: 'Fisik dan istirahat', icon: 'fa-moon' },
    { val: 'lainnya', label: 'Di luar kerja atau lainnya', icon: 'fa-house' },
  ];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Companion state="neutral" size={48} />
          <span>Check-in cepat (30 detik)</span>
        </div>
      }
    >
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <Companion state="neutral" mode="thinking" size={120} />
          <p className="text-body" style={{ marginTop: 20, textAlign: 'center', fontWeight: 500 }}>
            Sebentar ya, lagi dibaca pelan-pelan.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Q1 */}
          <div>
            <p className="text-body" style={{ fontWeight: 600, marginBottom: 8 }}>
              1. Kondisi pikiran (stres mental)
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {mentalOptions.map((opt) => (
                <Chip
                  key={opt.val}
                  active={mentalStress === opt.val}
                  onClick={() => setMentalStress(opt.val)}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Q2 */}
          <div>
            <p className="text-body" style={{ fontWeight: 600, marginBottom: 8 }}>
              2. Kondisi badan (energi fisik)
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {energyOptions.map((opt) => (
                <Chip
                  key={opt.val}
                  active={energyDrain === opt.val}
                  onClick={() => setEnergyDrain(opt.val)}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Q3 */}
          <div>
            <p className="text-body" style={{ fontWeight: 600, marginBottom: 8 }}>
              3. Jam tidur semalam
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {sleepOptions.map((opt) => (
                <Chip
                  key={opt.val}
                  active={sleepBucket === opt.val}
                  onClick={() => setSleepBucket(opt.val)}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Q4 */}
          <div>
            <p className="text-body" style={{ fontWeight: 600, marginBottom: 8 }}>
              4. Pemicu utama hari ini
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {triggerOptions.map((opt) => (
                <Chip
                  key={opt.val}
                  active={triggerCategory === opt.val}
                  onClick={() => setTriggerCategory(opt.val)}
                  style={{ justifyContent: 'flex-start' }}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Action */}
          <div style={{ marginTop: 8 }}>
            <Button
              variant="primary"
              style={{ width: '100%' }}
              disabled={!isComplete || loading}
              onClick={handleSubmit}
            >
              {loading ? 'Menyimpan...' : 'Kirim check-in'}
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
};