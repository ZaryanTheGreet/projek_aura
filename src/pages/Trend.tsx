import React, { useState, useEffect, useRef } from 'react';
import { JournalEntry, TriggerSummaryResponse } from '../types';
import { Card, Chip, Skeleton, Button } from '../components/UI';
import { api, getZoneFromIndex, getZoneLabel } from '../api';
import { useTheme } from '../context/ThemeContext';

interface TrendProps {
  onOpenCounselorReport: () => void;
}

export const Trend: React.FC<TrendProps> = ({ onOpenCounselorReport }) => {
  const { effectiveTheme } = useTheme();
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [triggerSummary, setTriggerSummary] = useState<TriggerSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Tooltip & Snapping states (Issue 1)
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTrendData();
  }, [range]);

  const loadTrendData = async () => {
    setLoading(true);
    setActiveIndex(null);
    setIsPinned(false);
    setHasInteracted(false);
    try {
      const all = await api.getEntries();
      const days = range === '7d' ? 7 : 30;
      const cutoff = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
      const filtered = all.filter((e) => e.date >= cutoff && !e.crisis_flag);
      setEntries(filtered);

      const summary = await api.getTriggerSummary(range);
      setTriggerSummary(summary);

      // Auto-select last point on load (Issue 1)
      if (filtered.length > 0) {
        setActiveIndex(filtered.length - 1);
        setIsPinned(true);
      }
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  };

  // High load count (score >= 7)
  const highLoadDays = entries.filter((e) => e.daily_stress_score >= 7).length;

  // Find highest and lowest indices for 30-day range (Issue 2)
  const getHighestLowestIndices = () => {
    if (entries.length === 0) return { highest: null, lowest: null };
    const validEntries = entries.filter((e) => e.burnout_index !== null);
    if (validEntries.length === 0) return { highest: null, lowest: null };

    let highest = validEntries[0];
    let lowest = validEntries[0];

    validEntries.forEach((e) => {
      if (e.burnout_index! > highest.burnout_index!) highest = e;
      if (e.burnout_index! < lowest.burnout_index!) lowest = e;
    });

    return { highest, lowest };
  };

  const { highest: highestIdx, lowest: lowestIdx } = getHighestLowestIndices();

  // Calculate summary text (Issue 3)
  const getSummaryText = () => {
    const lastEntry = entries[entries.length - 1];
    if (!lastEntry || lastEntry.burnout_index === null) {
      return 'Belum cukup data untuk membandingkan.';
    }

    const currentIndex = lastEntry.burnout_index;
    const zone = getZoneLabel(getZoneFromIndex(currentIndex));

    // Find entry from 7 days ago
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const entry7DaysAgo = entries.find((e) => e.date === sevenDaysAgo && e.burnout_index !== null);

    if (!entry7DaysAgo) {
      return `Indeks sekarang ${currentIndex} (${zone}).`;
    }

    const diff = currentIndex - entry7DaysAgo.burnout_index!;
    const direction = Math.abs(diff) < 5 ? 'stabil' : diff > 0 ? 'naik' : 'turun';

    return `Indeks sekarang ${currentIndex} (${zone}). ${direction.charAt(0).toUpperCase() + direction.slice(1)} ${Math.abs(diff)} poin dibanding 7 hari lalu.`;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPinned && e.pointerType === 'mouse') return;
    handleSnapPointer(e.clientX);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    handleSnapPointer(e.clientX);
    setIsPinned(true);
    setHasInteracted(true);
  };

  const handlePointerUp = () => {
    // Keep pinned on touch release
  };

  const handleChartClickOutside = (e: React.MouseEvent) => {
    if (isPinned && !svgContainerRef.current?.contains(e.target as Node)) {
      setActiveIndex(entries.length - 1); // Return to last point
      setIsPinned(true);
    }
  };

  // Keyboard navigation for accessible graph (Issue 1)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (entries.length === 0) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveIndex((prev) => (prev === null ? 0 : Math.min(entries.length - 1, prev + 1)));
      setIsPinned(true);
      setHasInteracted(true);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveIndex((prev) => (prev === null ? entries.length - 1 : Math.max(0, prev - 1)));
      setIsPinned(true);
      setHasInteracted(true);
    } else if (e.key === 'Escape') {
      setActiveIndex(entries.length - 1); // Return to last point
      setIsPinned(true);
    }
  };

  // Coordinate calculations for active point
  const activeEntry = activeIndex !== null && entries[activeIndex] ? entries[activeIndex] : null;
  const activeX = activeIndex !== null && entries.length > 1
    ? (activeIndex / (entries.length - 1)) * 340 + 10
    : 180;
  const activeScoreY = activeEntry ? 126 - ((activeEntry.daily_stress_score - 1) / 9) * 112 : 0;
  const activeBurnoutY = activeEntry && activeEntry.burnout_index !== null
    ? 126 - ((activeEntry.burnout_index / 100) * 112)
    : null;

  // Update snapping logic for new chart width (Issue 2)
  const handleSnapPointer = (clientX: number) => {
    if (!svgContainerRef.current || entries.length === 0) return;
    const rect = svgContainerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const paddingX = (10 / 360) * rect.width;
    const plotWidth = (340 / 360) * rect.width;

    const clampedRelX = Math.max(0, Math.min(plotWidth, relX - paddingX));
    const ratio = plotWidth > 0 ? clampedRelX / plotWidth : 0;
    const nearestIdx = Math.round(ratio * (entries.length - 1));
    const safeIdx = Math.max(0, Math.min(entries.length - 1, nearestIdx));
    setActiveIndex(safeIdx);
  };

  return (
    <div className="app-container" style={{ padding: '24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 className="text-h1" style={{ fontSize: 24 }}>Tren Beban Kerja</h1>
          <p className="text-caption">Pantau dinamika beban dari catatan harianmu</p>
        </div>

        {/* Range Segmented Control */}
        <div style={{ display: 'flex', gap: 4 }}>
          <Chip active={range === '7d'} onClick={() => setRange('7d')} style={{ minHeight: 34, padding: '0 12px', fontSize: 13 }}>
            7 hari
          </Chip>
          <Chip active={range === '30d'} onClick={() => setRange('30d')} style={{ minHeight: 34, padding: '0 12px', fontSize: 13 }}>
            30 hari
          </Chip>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton height={220} radius={12} />
          <Skeleton height={80} radius={12} />
          <Skeleton height={140} radius={12} />
        </div>
      ) : entries.length < 3 ? (
        <Card style={{ padding: 28, textAlign: 'center' }}>
          <p className="text-body" style={{ fontWeight: 600, marginBottom: 6 }}>
            Belum cukup data untuk grafik tren
          </p>
          <p className="text-caption">
            Catatanmu saat ini baru {entries.length} hari. Setelah minimal 3 catatan, grafik garis tren dan zona indeks akan mulai terlihat.
          </p>
        </Card>
      ) : (
        <>
          {/* Main SVG Trend Chart */}
          <Card style={{ marginBottom: 16 }}>
            {/* Summary text above chart (Issue 3) */}
            <p className="text-body" style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, color: 'var(--ink)' }}>
              {getSummaryText()}
            </p>

            {/* Fixed Readout Panel (Issue 1) */}
            <div
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 12px',
                marginBottom: 12,
                minHeight: 52,
              }}
            >
              {activeEntry ? (
                <>
                  <p className="text-caption" style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                    {new Date(activeEntry.date).toLocaleDateString('id-ID', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  <p className="text-body" style={{ fontSize: 13, lineHeight: 1.4, margin: 0 }}>
                    Indeks burnout:{' '}
                    <strong>
                      {activeEntry.burnout_index !== null
                        ? `${activeEntry.burnout_index}, ${getZoneLabel(getZoneFromIndex(activeEntry.burnout_index))}`
                        : 'Belum tersedia (butuh 3 hari catatan)'}
                    </strong>
                  </p>
                  <p className="text-body" style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.3, margin: '2px 0 0 0' }}>
                    Beban hari ini: <strong>{activeEntry.daily_stress_score}/10</strong>
                  </p>
                </>
              ) : (
                <p className="text-caption" style={{ color: 'var(--ink-muted)', fontSize: 12 }}>
                  Memuat data...
                </p>
              )}
            </div>

            {/* Hint text until first interaction (Issue 1) */}
            {!hasInteracted && (
              <p className="text-caption" style={{ fontSize: 11, marginBottom: 8, fontStyle: 'italic' }}>
                Arahkan kursor atau ketuk grafik untuk melihat detail tiap hari.
              </p>
            )}

            {/* Legend (Issue 2) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span className="text-caption" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 14, height: 2.5, backgroundColor: 'var(--ink)' }} />
                  Indeks burnout (0-100)
                </span>
                <span className="text-caption" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 14, height: 8, backgroundColor: 'var(--ink)', opacity: 0.35 }} />
                  Beban harian (1-10)
                </span>
              </div>
            </div>

            {/* Chart title with units (Issue 3) */}
            <h3 className="text-h2" style={{ fontSize: 16, marginBottom: 8 }}>
              Indeks burnout (0-100)
            </h3>

            {/* SVG Chart with Single Index Line (Issue 2) */}
            <div
              ref={svgContainerRef}
              tabIndex={0}
              role="region"
              aria-label="Grafik interaktif tren beban kerja. Gunakan panah kiri dan kanan untuk menjelajahi titik data."
              onKeyDown={handleKeyDown}
              onPointerMove={handlePointerMove}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={() => {
                if (!isPinned && !hasInteracted) {
                  setActiveIndex(entries.length - 1);
                  setIsPinned(true);
                }
              }}
              style={{
                width: '100%',
                height: 190,
                position: 'relative',
                cursor: 'crosshair',
                touchAction: 'none',
                outline: 'none',
              }}
            >
              <svg
                viewBox="0 0 432 140"
                style={{ width: '100%', height: '100%', overflow: 'visible' }}
                aria-hidden="true"
              >
                {/* X-axis labels (Issue 3) */}
                {(() => {
                  if (range === '7d') {
                    // Show each day
                    return entries.map((e, idx) => {
                      const x = entries.length > 1 ? (idx / (entries.length - 1)) * 340 + 10 : 180;
                      const date = new Date(e.date);
                      const label = `${date.getDate()} ${date.toLocaleDateString('id-ID', { month: 'short' })}`;
                      return (
                        <text key={e.id} x={x} y="136" fill="var(--ink-muted)" fontSize="9" textAnchor="middle">
                          {label}
                        </text>
                      );
                    });
                  } else {
                    // Show tick every 7 days for 30-day range
                    const ticks: JSX.Element[] = [];
                    entries.forEach((e, idx) => {
                      if (idx % 7 === 0 || idx === entries.length - 1) {
                        const x = entries.length > 1 ? (idx / (entries.length - 1)) * 340 + 10 : 180;
                        const date = new Date(e.date);
                        const label = `${date.getDate()} ${date.toLocaleDateString('id-ID', { month: 'short' })}`;
                        ticks.push(
                          <text key={e.id} x={x} y="136" fill="var(--ink-muted)" fontSize="9" textAnchor="middle">
                            {label}
                          </text>
                        );
                      }
                    });
                    return <>{ticks}</>;
                  }
                })()}
                {/* Zone tint bands: Heavy (top 30%), Watch (middle 30%), Calm (bottom 40%) */}
                <rect x="0" y="0" width="360" height="42" fill="var(--zone-heavy-tint)" opacity={effectiveTheme === 'dark' ? 0.35 : 0.65} />
                <rect x="0" y="42" width="360" height="42" fill="var(--zone-watch-tint)" opacity={effectiveTheme === 'dark' ? 0.35 : 0.65} />
                <rect x="0" y="84" width="360" height="56" fill="var(--zone-calm-tint)" opacity={effectiveTheme === 'dark' ? 0.35 : 0.65} />

                {/* Horizontal reference lines with Y-axis labels (Issue 3) */}
                <line x1="0" y1="14" x2="360" y2="14" stroke="var(--border)" strokeWidth="0.8" />
                <text x="-4" y="18" fill="var(--ink-muted)" fontSize="9" textAnchor="end">100</text>

                <line x1="0" y1="42" x2="360" y2="42" stroke="var(--border)" strokeWidth="0.8" />
                <text x="-4" y="46" fill="var(--ink-muted)" fontSize="9" textAnchor="end">70</text>

                <line x1="0" y1="84" x2="360" y2="84" stroke="var(--border)" strokeWidth="0.8" />
                <text x="-4" y="88" fill="var(--ink-muted)" fontSize="9" textAnchor="end">40</text>

                <line x1="0" y1="126" x2="360" y2="126" stroke="var(--border)" strokeWidth="0.8" />
                <text x="-4" y="130" fill="var(--ink-muted)" fontSize="9" textAnchor="end">0</text>

                {/* Zone labels on right margin (Issue 2) */}
                <text x="368" y="24" fill="var(--ink-muted)" fontSize="9" fontWeight="500">Butuh istirahat</text>
                <text x="368" y="66" fill="var(--ink-muted)" fontSize="9" fontWeight="500">Waspada</text>
                <text x="368" y="112" fill="var(--ink-muted)" fontSize="9" fontWeight="500">Tenang</text>

                {/* Single Burnout Index Line (Issue 2) */}
                {(() => {
                  const validEntries = entries.filter((e) => e.burnout_index !== null);
                  if (validEntries.length < 2) return null;

                  // Create line segments with gaps for missing data (Issue 2)
                  const segments: JSX.Element[] = [];
                  let currentSegment: string[] = [];

                  validEntries.forEach((e, idx) => {
                    const originalIdx = entries.findIndex((item) => item.id === e.id);
                    const x = entries.length > 1 ? (originalIdx / (entries.length - 1)) * 340 + 10 : 180;
                    const y = 126 - ((e.burnout_index! / 100) * 112);

                    // Check if there's a gap (consecutive indices missing)
                    if (idx > 0) {
                      const prevOriginalIdx = entries.findIndex((item) => item.id === validEntries[idx - 1].id);
                      if (originalIdx - prevOriginalIdx > 1) {
                        // Gap detected, finish current segment
                        if (currentSegment.length > 0) {
                          segments.push(
                            <polyline
                              key={`seg-${idx}`}
                              fill="none"
                              stroke="var(--ink)"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={currentSegment.join(' ')}
                            />
                          );
                          currentSegment = [];
                        }
                      }
                    }

                    currentSegment.push(`${x},${y}`);
                  });

                  // Add last segment
                  if (currentSegment.length > 0) {
                    segments.push(
                      <polyline
                        key="seg-last"
                        fill="none"
                        stroke="var(--ink)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={currentSegment.join(' ')}
                      />
                    );
                  }

                  return <>{segments}</>;
                })()}

                {/* Point markers (Issue 2) */}
                {(() => {
                  const validEntries = entries.filter((e) => e.burnout_index !== null);
                  const showAllPoints = validEntries.length <= 14;

                  return validEntries.map((e) => {
                    const originalIdx = entries.findIndex((item) => item.id === e.id);
                    const x = entries.length > 1 ? (originalIdx / (entries.length - 1)) * 340 + 10 : 180;
                    const y = 126 - ((e.burnout_index! / 100) * 112);

                    // Show point if: all points mode, or it's the last, highest, lowest, or active
                    const isLast = originalIdx === entries.length - 1;
                    const isHighest = highestIdx && e.id === highestIdx.id;
                    const isLowest = lowestIdx && e.id === lowestIdx.id;
                    const isActive = activeEntry && e.id === activeEntry.id;

                    if (!showAllPoints && !isLast && !isHighest && !isLowest && !isActive) return null;

                    return (
                      <circle
                        key={e.id}
                        cx={x}
                        cy={y}
                        r={isActive ? 6 : 4}
                        fill="var(--surface)"
                        stroke="var(--ink)"
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    );
                  });
                })()}

                {/* Callout labels for highest and lowest (Issue 3) */}
                {range === '30d' && highestIdx && (
                  (() => {
                    const originalIdx = entries.findIndex((item) => item.id === highestIdx.id);
                    const x = entries.length > 1 ? (originalIdx / (entries.length - 1)) * 340 + 10 : 180;
                    const y = 126 - ((highestIdx.burnout_index! / 100) * 112);
                    return (
                      <text x={x} y={y - 8} fill="var(--ink)" fontSize="9" fontWeight="600" textAnchor="middle">
                        {highestIdx.burnout_index}
                      </text>
                    );
                  })()
                )}
                {range === '30d' && lowestIdx && (
                  (() => {
                    const originalIdx = entries.findIndex((item) => item.id === lowestIdx.id);
                    const x = entries.length > 1 ? (originalIdx / (entries.length - 1)) * 340 + 10 : 180;
                    const y = 126 - ((lowestIdx.burnout_index! / 100) * 112);
                    return (
                      <text x={x} y={y - 8} fill="var(--ink)" fontSize="9" fontWeight="600" textAnchor="middle">
                        {lowestIdx.burnout_index}
                      </text>
                    );
                  })()
                )}

                {/* Snapping vertical guideline & active point (Issue 2) */}
                {activeEntry && activeBurnoutY !== null && (
                  <>
                    <line
                      x1={activeX}
                      y1="0"
                      x2={activeX}
                      y2="140"
                      stroke="var(--ink)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={activeX}
                      cy={activeBurnoutY}
                      r="6"
                      fill="var(--surface)"
                      stroke="var(--ink)"
                      strokeWidth="2.5"
                    />
                  </>
                )}
              </svg>
            </div>

            {/* Daily Load Strip (Issue 2) */}
            <div style={{ marginTop: 12, marginBottom: 8 }}>
              <p className="text-caption" style={{ fontSize: 11, marginBottom: 6 }}>
                Beban harian (1-10)
              </p>
              <div
                style={{
                  height: 56,
                  position: 'relative',
                  paddingLeft: 10,
                  paddingRight: 10,
                }}
              >
                <svg
                  viewBox="0 0 340 56"
                  style={{ width: '100%', height: '100%', overflow: 'visible' }}
                  aria-hidden="true"
                >
                  {/* Y-axis labels */}
                  <text x="-4" y="52" fill="var(--ink-muted)" fontSize="9" textAnchor="end">1</text>
                  <text x="-4" y="10" fill="var(--ink-muted)" fontSize="9" textAnchor="end">10</text>

                  {/* Daily load bars */}
                  {entries.map((e, idx) => {
                    const x = entries.length > 1 ? (idx / (entries.length - 1)) * 340 : 170;
                    const barHeight = ((e.daily_stress_score - 1) / 9) * 42;
                    const y = 52 - barHeight;
                    const isActive = activeEntry && e.id === activeEntry.id;

                    return (
                      <rect
                        key={e.id}
                        x={x - 2}
                        y={y}
                        width="4"
                        height={barHeight}
                        fill="var(--ink)"
                        opacity={isActive ? 1 : 0.35}
                        rx="1"
                      />
                    );
                  })}

                  {/* Active vertical guideline */}
                  {activeEntry && (
                    <line
                      x1={activeX - 10}
                      y1="0"
                      x2={activeX - 10}
                      y2="56"
                      stroke="var(--ink)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      opacity={0.5}
                    />
                  )}
                </svg>
              </div>
            </div>

            {/* How to read text (Issue 3) */}
            <p className="text-caption" style={{ marginTop: 12, fontSize: 11, lineHeight: 1.4 }}>
              Makin tinggi garis, makin berat bebanmu. Ini gambaran pola, bukan diagnosis.
            </p>

            {/* Screen reader announcement (Issue 1) */}
            <div className="sr-only" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
              {activeEntry && (
                `Titik terpilih: ${activeEntry.date}. Beban hari ini ${activeEntry.daily_stress_score} dari 10. ${activeEntry.burnout_index !== null ? `Indeks burnout ${activeEntry.burnout_index}` : 'Indeks belum tersedia'}.`
              )}
            </div>
          </Card>

          {/* Weekly Insight Paragraph */}
          <Card style={{ marginBottom: 16 }}>
            <h2 className="text-h2" style={{ fontSize: 16, marginBottom: 6 }}>
              Insight periode ini
            </h2>
            <p className="text-body" style={{ color: 'var(--ink)' }}>
              Dalam {range === '7d' ? '7 hari' : '30 hari'} terakhir kamu mencatat sebanyak {entries.length} kali, dengan {highLoadDays} hari di zona beban tinggi. Pola beban sering kali meningkat menjelang tenggat sprint dan rapat beruntun.
            </p>
          </Card>

          {/* Peta Pemicu (F4) */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <h2 className="text-h2" style={{ fontSize: 16 }}>Peta Pemicu</h2>
              <span className="text-caption">Persentase & jumlah (n)</span>
            </div>

            {triggerSummary && triggerSummary.total_entries >= 5 ? (
              <div>
                <p className="text-caption" style={{ marginBottom: 14 }}>
                  {triggerSummary.summary}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {triggerSummary.items.map((item) => (
                    <div key={item.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span className="text-body" style={{ fontSize: 14, fontWeight: 500 }}>
                          {item.label}
                        </span>
                        <span className="text-caption tabular-nums">
                          {item.percent}% ({item.count})
                        </span>
                      </div>
                      {/* Horizontal solid ink bar */}
                      <div
                        style={{
                          width: '100%',
                          height: 8,
                          backgroundColor: 'var(--border)',
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${item.percent}%`,
                            height: '100%',
                            backgroundColor: 'var(--ink)',
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-caption">
                Peta pemicu membutuhkan minimal 5 catatan untuk menampilkan pola yang akurat.
              </p>
            )}
          </Card>

          {/* Counselor Share Link (F8) */}
          <div style={{ marginBottom: 24 }}>
            <Button
              variant="secondary"
              style={{ width: '100%', minHeight: 44 }}
              onClick={onOpenCounselorReport}
              icon="fa-file-lines"
            >
              Bagikan ringkasan ke psikolog atau konselor (PDF)
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
