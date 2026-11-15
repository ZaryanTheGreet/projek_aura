import React, { useState, useEffect } from 'react';
import { JournalEntry, FollowupPending, BreakPlan } from '../types';
import { Button, Card, ZonePill, Skeleton, Banner } from '../components/UI';
import { Companion } from '../components/Companion';
import { api, getZoneFromIndex } from '../api';
import { useTheme } from '../context/ThemeContext';

interface HomeProps {
  onWriteClick: () => void;
  onCheckinClick: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenCareMode: () => void;
  onOpenBreakPlanner: () => void;
  onLogout: () => void;
  onOpenThemePicker: () => void;
}

export const Home: React.FC<HomeProps> = ({
  onWriteClick,
  onCheckinClick,
  onOpenHistory,
  onOpenSettings,
  onOpenCareMode,
  onOpenBreakPlanner,
  onLogout,
  onOpenThemePicker,
}) => {
  const { effectiveTheme } = useTheme();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingFollowup, setPendingFollowup] = useState<FollowupPending | null>(null);
  const [breakPlan, setBreakPlan] = useState<BreakPlan | null>(null);
  const [dismissBreakBanner, setDismissBreakBanner] = useState(false);
  const [followupAnswered, setFollowupAnswered] = useState(false);

  // Chart interaction state for mini chart
  const [activeChartIndex, setActiveChartIndex] = useState<number | null>(null);
  const [hasChartInteracted, setHasChartInteracted] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allEntries = await api.getEntries();
      setEntries(allEntries);
      const followup = await api.getPendingFollowup();
      setPendingFollowup(followup);
      const bp = await api.getBreakPlan();
      setBreakPlan(bp);
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  };

  const handleFollowupRate = async (rating: number) => {
    if (!pendingFollowup) return;
    await api.submitExerciseFeedback(pendingFollowup.session_id, rating);
    setFollowupAnswered(true);
    setTimeout(() => {
      setPendingFollowup(null);
      setFollowupAnswered(false);
    }, 1500);
  };

  // Greeting based on current local hour
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 11
      ? 'Selamat pagi'
      : hour < 15
      ? 'Selamat siang'
      : hour < 18
      ? 'Selamat sore'
      : 'Selamat malam';

  const dateFormatted = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Latest entry & 7-day index
  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null;
  const burnoutIndex = latestEntry?.burnout_index ?? null;
  const dailyScore = latestEntry?.daily_stress_score ?? null;
  const effectiveZone = getZoneFromIndex(burnoutIndex, dailyScore ?? undefined);

  // 7-day trend sentence
  const recent7 = entries.slice(-7);
  let trendSentence = 'Belum cukup catatan untuk melihat tren.';
  if (recent7.length >= 3) {
    const firstScore = recent7[0].daily_stress_score;
    const lastScore = recent7[recent7.length - 1].daily_stress_score;
    if (lastScore > firstScore + 1) {
      trendSentence = 'Bebanmu cenderung naik dalam beberapa hari terakhir.';
    } else if (lastScore < firstScore - 1) {
      trendSentence = 'Bebanmu mulai menurun dibandingkan awal minggu.';
    } else {
      trendSentence = 'Pola beban kerjamu relatif stabil minggu ini.';
    }
  }

  // Mini 7-day chart calculation
  const chartEntries = entries.slice(-7);

  // Handle chart interaction
  const handleChartClick = (idx: number) => {
    setActiveChartIndex(idx);
    setHasChartInteracted(true);
  };

  const activeChartEntry = activeChartIndex !== null && chartEntries[activeChartIndex] ? chartEntries[activeChartIndex] : null;

  return (
    <div className="app-container" style={{ padding: '20px 20px 24px' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <span className="text-caption">{dateFormatted}</span>
          <h1 className="text-h2" style={{ fontSize: 20 }}>{greeting}</h1>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={onOpenHistory}
            aria-label="Riwayat catatan"
            className="aura-btn-text"
            style={{ padding: 8, minHeight: 36 }}
          >
            <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: 18 }} />
          </button>
          <button
            type="button"
            onClick={onOpenThemePicker}
            aria-label="Pilih tema tampilan"
            className="aura-btn-text"
            style={{ padding: 8, minHeight: 36 }}
          >
            <i className="fa-solid fa-circle-half-stroke" style={{ fontSize: 18 }} />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Pengaturan"
            className="aura-btn-text"
            style={{ padding: 8, minHeight: 36 }}
          >
            <i className="fa-solid fa-gear" style={{ fontSize: 18 }} />
          </button>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Keluar"
            className="aura-btn-text"
            style={{ padding: 8, minHeight: 36 }}
          >
            <i className="fa-solid fa-right-from-bracket" style={{ fontSize: 18 }} />
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton height={140} radius={12} />
          <Skeleton height={50} radius={999} />
          <Skeleton height={50} radius={999} />
          <Skeleton height={100} radius={12} />
        </div>
      ) : (
        <>
          {/* Break reminder banner (F6 / L1) */}
          {breakPlan?.reminder_enabled && !dismissBreakBanner && (
            <div style={{ marginBottom: 16 }}>
              <Banner onClose={() => setDismissBreakBanner(true)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-moon" style={{ color: 'var(--ink)' }} />
                  <div>
                    <p className="text-body" style={{ fontWeight: 600, fontSize: 14 }}>
                      Sudah mendekati jam {breakPlan.end_time}.
                    </p>
                    <p className="text-caption">
                      Waktunya mulai ritual menutup hari kerja?{' '}
                      <button
                        type="button"
                        onClick={onOpenBreakPlanner}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--ink)',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          fontWeight: 600,
                          padding: 0,
                        }}
                      >
                        Lihat ritual
                      </button>
                    </p>
                  </div>
                </div>
              </Banner>
            </div>
          )}

          {/* Pending Follow-up Card (F2) */}
          {pendingFollowup && (
            <div style={{ marginBottom: 16 }}>
              <Card style={{ border: '1px solid var(--border-control)' }}>
                {followupAnswered ? (
                  <p className="text-body" style={{ fontWeight: 600 }}>
                    Terima kasih atas umpan balikmu.
                  </p>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <i className="fa-solid fa-comment-dots" style={{ color: 'var(--ink)' }} />
                      <p className="text-body" style={{ fontWeight: 600 }}>
                        Kemarin kamu mencoba {pendingFollowup.exercise_title}.
                      </p>
                    </div>
                    <p className="text-caption" style={{ marginBottom: 12 }}>
                      Terasa membantu untukmu?
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {[
                        { val: 1, label: '1 Belum terasa' },
                        { val: 3, label: '3 Lumayan' },
                        { val: 5, label: '5 Sangat terbantu' },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          className="aura-chip"
                          onClick={() => handleFollowupRate(item.val)}
                          style={{ minHeight: 36, fontSize: 13, padding: '0 12px' }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="aura-btn-text"
                      onClick={() => setPendingFollowup(null)}
                      style={{ padding: 0, minHeight: 28, fontSize: 13 }}
                    >
                      Lewati
                    </button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Hero Condition Card: Companion + Big Score */}
          <Card style={{ marginBottom: 20, padding: '24px 20px' }}>
            {entries.length < 3 ? (
              // Empty / early user state
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Companion state="neutral" size={80} pose="sit" />
                <div>
                  <h2 className="text-h2" style={{ fontSize: 18, marginBottom: 4 }}>
                    Belum ada catatan cukup
                  </h2>
                  <p className="text-caption">
                    Catat kondisimu minimal 3 hari untuk melihat gambaran indeks burnout. Mulai dengan satu kalimat atau check-in cepat.
                  </p>
                </div>
              </div>
            ) : (
              // Normal condition state
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span className="text-caption" style={{ display: 'block', marginBottom: 4 }}>
                      Indeks burnout (7 hari)
                    </span>
                    <div className="text-display">
                      {burnoutIndex !== null ? burnoutIndex : '-'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <ZonePill zone={effectiveZone} />
                    <Companion state={effectiveZone} size={76} pose={effectiveZone === 'calm' ? 'sit' : effectiveZone === 'watch' ? 'stand' : 'neck_left'} />
                  </div>
                </div>

                <p className="text-body" style={{ fontWeight: 500, marginBottom: 4 }}>
                  {trendSentence}
                </p>
                <p className="text-caption" style={{ fontSize: 12 }}>
                  Gambaran pola dari catatanmu, bukan diagnosis klinis.
                </p>
              </div>
            )}
          </Card>

          {/* Primary & Secondary Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            <Button
              variant="primary"
              onClick={onWriteClick}
              icon="fa-pen-to-square"
              style={{ width: '100%' }}
            >
              Tulis jurnal hari ini
            </Button>
            <Button
              variant="secondary"
              onClick={onCheckinClick}
              icon="fa-bolt"
              style={{ width: '100%' }}
            >
              Check-in cepat (30 detik)
            </Button>
          </div>

          {/* Mini 7-Day Line Chart */}
          {chartEntries.length > 0 && (
            <Card style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <h2 className="text-h2" style={{ fontSize: 16 }}>Beban 7 hari terakhir</h2>
                <span className="text-caption">Skor 1 - 10</span>
              </div>

              {/* Fixed readout panel for chart */}
              <div
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 12,
                  minHeight: 44,
                }}
              >
                {activeChartEntry ? (
                  <>
                    <p className="text-caption" style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
                      {new Date(activeChartEntry.date).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                    <p className="text-body" style={{ fontSize: 13, lineHeight: 1.4, margin: 0 }}>
                      Beban hari ini: <strong>{activeChartEntry.daily_stress_score}/10</strong>
                      {activeChartEntry.burnout_index !== null && (
                        <span style={{ marginLeft: 8, color: 'var(--ink-muted)' }}>
                          Indeks: {activeChartEntry.burnout_index}
                        </span>
                      )}
                    </p>
                  </>
                ) : (
                  <p className="text-caption" style={{ fontSize: 12, margin: 0 }}>
                    Ketuk titik grafik untuk melihat detail hari tersebut.
                  </p>
                )}
              </div>

              {/* Inline SVG Solid Line Chart with click interaction */}
              <div style={{ width: '100%', height: 110, position: 'relative', cursor: 'pointer' }}>
                <svg
                  viewBox="0 0 300 100"
                  style={{ width: '100%', height: '100%', overflow: 'visible' }}
                  aria-label="Grafik garis solid skor beban 7 hari terakhir"
                >
                  {/* Solid zone tint bands */}
                  <rect x="0" y="0" width="300" height="30" fill="var(--zone-heavy-tint)" opacity={effectiveTheme === 'dark' ? 0.35 : 0.65} />
                  <rect x="0" y="30" width="300" height="35" fill="var(--zone-watch-tint)" opacity={effectiveTheme === 'dark' ? 0.35 : 0.65} />
                  <rect x="0" y="65" width="300" height="35" fill="var(--zone-calm-tint)" opacity={effectiveTheme === 'dark' ? 0.35 : 0.65} />

                  {/* Horizontal dividing lines */}
                  <line x1="0" y1="30" x2="300" y2="30" stroke="var(--border)" strokeWidth="0.8" />
                  <line x1="0" y1="65" x2="300" y2="65" stroke="var(--border)" strokeWidth="0.8" />

                  {/* Polyline for daily scores: mapped x from 0 to 300, y from 10 (top=10) to 1 (bottom=90) */}
                  {(() => {
                    const points = chartEntries.map((e, idx) => {
                      const x = chartEntries.length > 1 ? (idx / (chartEntries.length - 1)) * 280 + 10 : 150;
                      // y: score 10 -> y=8, score 1 -> y=92
                      const y = 92 - ((e.daily_stress_score - 1) / 9) * 84;
                      return `${x},${y}`;
                    }).join(' ');

                    return (
                      <>
                        <polyline
                          fill="none"
                          stroke="var(--ink)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={points}
                        />
                        {chartEntries.map((e, idx) => {
                          const x = chartEntries.length > 1 ? (idx / (chartEntries.length - 1)) * 280 + 10 : 150;
                          const y = 92 - ((e.daily_stress_score - 1) / 9) * 84;
                          const isActive = activeChartIndex === idx;

                          return (
                            <circle
                              key={e.id}
                              cx={x}
                              cy={y}
                              r={isActive ? 5 : 3.5}
                              fill="var(--surface)"
                              stroke="var(--ink)"
                              strokeWidth={isActive ? 2.5 : 2}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleChartClick(idx)}
                            />
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                {chartEntries.map((e, idx) => (
                  <span
                    key={e.id}
                    className="text-caption"
                    style={{
                      fontSize: 11,
                      fontWeight: activeChartIndex === idx ? 700 : 400,
                      color: activeChartIndex === idx ? 'var(--ink)' : 'var(--ink-muted)',
                    }}
                  >
                    {e.date.slice(8, 10)}/{e.date.slice(5, 7)}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Need to talk to someone link */}
          <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 16 }}>
            <button
              type="button"
              className="aura-btn-text"
              onClick={onOpenCareMode}
              style={{ color: 'var(--ink)', textDecoration: 'underline' }}
            >
              Butuh bicara dengan seseorang?
            </button>
          </div>
        </>
      )}
    </div>
  );
};
