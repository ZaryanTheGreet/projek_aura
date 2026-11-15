import React, { useState, useEffect } from 'react';
import { JournalEntry } from '../types';
import { Card, ZonePill, Button, BottomSheet } from '../components/UI';
import { api, getZoneFromIndex } from '../api';

interface HistoryProps {
  onBack: () => void;
}

export const History: React.FC<HistoryProps> = ({ onBack }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    api.getEntries().then((res) => {
      // Show newest first
      setEntries([...res].reverse());
      setLoading(false);
    });
  }, []);

  return (
    <div className="app-container-no-nav" style={{ padding: '20px 20px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="text-h1" style={{ fontSize: 22 }}>Riwayat Catatan</h1>
          <p className="text-caption">Kumpulan refleksi dan check-in harianmu</p>
        </div>
        <Button variant="text" onClick={onBack} aria-label="Kembali ke Beranda">
          <i className="fa-solid fa-xmark" style={{ fontSize: 18 }} />
        </Button>
      </div>

      {loading ? (
        <p className="text-caption">Memuat riwayat...</p>
      ) : entries.length === 0 ? (
        <Card style={{ padding: 24, textAlign: 'center' }}>
          <p className="text-body" style={{ fontWeight: 600, marginBottom: 4 }}>
            Belum ada catatan
          </p>
          <p className="text-caption">
            Catatan harianmu akan tersimpan di sini agar kamu bisa melihat kembali pola beban kerjamu.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.map((item) => {
            const zone = getZoneFromIndex(item.burnout_index, item.daily_stress_score);
            const dateObj = new Date(item.date);
            const formattedDate = dateObj.toLocaleDateString('id-ID', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            });

            return (
              <div
                key={item.id}
                onClick={() => setSelectedEntry(item)}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedEntry(item);
                }}
              >
                <Card style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span className="text-caption" style={{ fontWeight: 600, color: 'var(--ink)' }}>
                      {formattedDate}
                    </span>
                    <ZonePill zone={zone} />
                  </div>

                  <p className="text-body" style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                    Beban hari ini: {item.daily_stress_score}/10
                    {item.burnout_index !== null && ` · Indeks: ${item.burnout_index}`}
                  </p>

                  <p
                    className="text-caption"
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--ink-muted)',
                    }}
                  >
                    {item.journal_text || item.remediation_tips}
                  </p>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Entry Detail Sheet */}
      <BottomSheet
        isOpen={selectedEntry !== null}
        onClose={() => setSelectedEntry(null)}
        title={selectedEntry ? `Catatan ${selectedEntry.date}` : ''}
      >
        {selectedEntry && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="text-caption">Beban hari ini</span>
                <p className="text-display" style={{ fontSize: 36 }}>
                  {selectedEntry.daily_stress_score}/10
                </p>
              </div>
              <ZonePill zone={getZoneFromIndex(selectedEntry.burnout_index, selectedEntry.daily_stress_score)} />
            </div>

            <div>
              <p className="text-caption" style={{ fontWeight: 600, marginBottom: 4 }}>Pemicu</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedEntry.triggers.map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: '1px solid var(--border)',
                      fontSize: 12,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {selectedEntry.journal_text && (
              <div>
                <p className="text-caption" style={{ fontWeight: 600, marginBottom: 4 }}>Cerita Jurnal</p>
                <p className="text-body" style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>
                  {selectedEntry.journal_text}
                </p>
              </div>
            )}

            <div>
              <p className="text-caption" style={{ fontWeight: 600, marginBottom: 4 }}>Langkah Rekomendasi</p>
              <p className="text-body" style={{ fontSize: 14, color: 'var(--ink)' }}>
                {selectedEntry.remediation_tips}
              </p>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
