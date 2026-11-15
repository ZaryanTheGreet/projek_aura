import React, { useState, useRef } from 'react';
import { Button, Card } from '../components/UI';
import { Companion } from '../components/Companion';
import { api } from '../api';
import { JournalEntry } from '../types';

interface WriteJournalProps {
  onSubmitSuccess: (entry: JournalEntry) => void;
  onOpenQuickCheckin: () => void;
}

export const WriteJournal: React.FC<WriteJournalProps> = ({
  onSubmitSuccess,
  onOpenQuickCheckin,
}) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = text.length;
  const maxChars = 2000;
  const isOverLimit = charCount > maxChars;
  const isEmpty = text.trim().length === 0;

  // Auto-grow textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 400)}px`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmpty || isOverLimit || loading) return;

    setErrorMsg('');
    setLoading(true);

    try {
      const entry = await api.postJournal(text);
      setLoading(false);
      setText(''); // Reset text on success (Issue 5)
      onSubmitSuccess(entry);
    } catch (err: unknown) {
      setLoading(false);
      // Keep text on error (Issue 5)
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Ada kendala sebentar, coba lagi ya.');
      }
    }
  };

  // Thinking loading screen
  if (loading) {
    return (
      <div
        className="app-container-no-nav"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '32px 20px',
        }}
      >
        <Companion state="neutral" mode="thinking" size={90} />
        <h2 className="text-h2" style={{ marginTop: 24, marginBottom: 8, fontSize: 18 }}>
          Memahami ceritamu sebentar...
        </h2>
        <p className="text-caption">
          Menata catatan dan mencari satu langkah yang masuk akal.
        </p>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ padding: '24px 20px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="text-h1" style={{ fontSize: 24, marginBottom: 6 }}>
          Hari kerjamu rasanya gimana?
        </h1>
        <p className="text-caption">
          Ceritakan apa saja yang terjadi hari ini: deadline, rapat, beban, atau hal yang bikin lelah.
        </p>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            className="aura-textarea"
            style={{
              width: '100%',
              minHeight: 180,
              border: 'none',
              padding: 0,
              backgroundColor: 'transparent',
              fontSize: 16,
              resize: 'none',
              outline: 'none',
            }}
            placeholder="Tulis bebas tanpa takut dinilai... (contoh: Banyak revisi mendadak dan meeting seharian, lelah tapi masih ada sisa tugas)"
            value={text}
            onChange={handleInput}
            aria-label="Isi cerita hari kerja"
            disabled={loading}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border)',
              paddingTop: 12,
              marginTop: 12,
            }}
          >
            <span
              className="text-caption tabular-nums"
              style={{ color: isOverLimit ? 'var(--zone-heavy)' : 'var(--ink-muted)' }}
            >
              {charCount} / {maxChars}
            </span>

            {isOverLimit && (
              <span className="text-caption" style={{ color: 'var(--zone-heavy)' }}>
                Ceritanya agak panjang. Coba ringkas sedikit ya (maksimal 2000 karakter).
              </span>
            )}
          </div>
        </form>
      </Card>

      {errorMsg && (
        <div className="aura-card" style={{ marginBottom: 16, borderColor: 'var(--border-control)' }}>
          <p className="text-body" style={{ color: 'var(--ink)', marginBottom: 8 }}>
            {errorMsg}
          </p>
          <Button variant="secondary" onClick={handleSubmit} style={{ minHeight: 38, fontSize: 13 }}>
            Coba lagi
          </Button>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <Button
          type="button"
          variant="primary"
          style={{ width: '100%', marginBottom: 12 }}
          onClick={handleSubmit}
          disabled={isEmpty || isOverLimit || loading}
        >
          Check My Condition
        </Button>

        <button
          type="button"
          className="aura-btn-text"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={onOpenQuickCheckin}
        >
          Terlalu capek menulis? Coba check-in cepat (30 detik)
        </button>
      </div>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 16 }}>
        <p className="text-caption">
          Catatanmu hanya untukmu. Perusahaan hanya bisa melihat ringkasan gabungan tanpa nama, dan hanya jika kamu memilih ikut.
        </p>
      </div>
    </div>
  );
};
