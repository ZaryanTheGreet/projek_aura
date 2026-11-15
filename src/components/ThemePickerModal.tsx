import React from 'react';
import { BottomSheet, Chip } from './UI';
import { useTheme, ThemeOption } from '../context/ThemeContext';

interface ThemePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemePickerModal: React.FC<ThemePickerModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();

  const handleSelect = (t: ThemeOption) => {
    setTheme(t);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Pilih Tema Tampilan">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p className="text-caption">
          Perubahan tema berlangsung instan tanpa kedipan warna.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Chip
            active={theme === 'light'}
            onClick={() => handleSelect('light')}
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
          >
            Terang (Latar hangat alami)
          </Chip>
          <Chip
            active={theme === 'dark'}
            onClick={() => handleSelect('dark')}
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
          >
            Gelap (Nyaman untuk mata lelah di malam hari)
          </Chip>
          <Chip
            active={theme === 'system'}
            onClick={() => handleSelect('system')}
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
          >
            Otomatis (Mengikuti preferensi sistem perangkat)
          </Chip>
        </div>
      </div>
    </BottomSheet>
  );
};
