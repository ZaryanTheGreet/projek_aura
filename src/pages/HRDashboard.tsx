import React, { useState, useEffect, useRef } from 'react';
import { Division, HRDashboardData } from '../types';
import { Card, Skeleton, Button } from '../components/UI';
import { Companion } from '../components/Companion';
import { api, getZoneFromIndex, getZoneLabel } from '../api';
import { useTheme } from '../context/ThemeContext';

interface HRDashboardProps {
  onLogout: () => void;
  onOpenThemePicker: () => void;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({ onLogout, onOpenThemePicker }) => {
  const { effectiveTheme } = useTheme();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [data, setData] = useState<HRDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Tooltip states (Issue 1)
  const [activeMonthIdx, setActiveMonthIdx] = useState<number | null>(null);
  const [isTrendPinned, setIsTrendPinned] = useState(false);
  const [hasTrendInteracted, setHasTrendInteracted] = useState(false);
  const trendContainerRef = useRef<HTMLDivElement>(null);

  const [activeHeatmapIdx, setActiveHeatmapIdx] = useState<number | null>(null);
  const [activeDriverIdx, setActiveDriverIdx] = useState<number | null>(null);

  useEffect(() => {
    api.getHRDivisions().then(setDivisions);
  }, []);

  useEffect(() => {
    loadDashboard(selectedDivision);
  }, [selectedDivision]);

  const loadDashboard = async (divId: string) => {
    setLoading(true);
    setErrorMsg('');
    setActiveMonthIdx(null);
    setIsTrendPinned(false);
    setHasTrendInteracted(false);
    try {
      const res = await api.getHRDashboard(divId);
      setData(res);

      // Auto-select last month on load (Issue 1)
      if (res.monthly_index.length > 0) {
        setActiveMonthIdx(res.monthly_index.length - 1);
        setIsTrendPinned(true);
      }
    } catch {
      setErrorMsg('Ada kendala saat memuat data agregat HRD. Coba lagi ya.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for heatmap discrete neutral ink levels
  // 4 discrete levels: 0-15%, 16-30%, 31-45%, >45%
  const getHeatmapColor = (pct: number | null) => {
    if (pct === null) return 'var(--surface)';
    if (pct > 40) return effectiveTheme === 'dark' ? '#888888' : '#2A2A2A';
    if (pct > 25) return effectiveTheme === 'dark' ? '#5E5E5E' : '#6A6A6A';
    if (pct > 15) return effectiveTheme === 'dark' ? '#3E3E3E' : '#B0B0B0';
    return effectiveTheme === 'dark' ? '#262626' : '#E2E2E2';
  };

  const getHeatmapTextColor = (pct: number | null) => {
    if (pct === null) return 'var(--ink-muted)';
    if (pct > 25) return '#FFFFFF';
    return effectiveTheme === 'dark' ? '#FFFFFF' : '#1A1A1A';
  };

  return (
    <div className="hr-container">
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          paddingBottom: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Aura</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 999,
              border: '1px solid var(--ink)',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            HRD
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={onOpenThemePicker}
            aria-label="Pilih tema tampilan"
            className="aura-btn-text"
            style={{ padding: 8, minHeight: 36 }}
          >
            <i className="fa-solid fa-circle-half-stroke" style={{ fontSize: 18 }} />
          </button>
          <Button variant="secondary" onClick={onLogout} style={{ minHeight: 38, fontSize: 13, padding: '0 14px' }}>
            <i className="fa-solid fa-right-from-bracket" style={{ marginRight: 6 }} />
            Keluar
          </Button>
        </div>
      </header>

      {/* Mandatory Privacy Banner (Always visible, non-dismissible) */}
      <div
        className="aura-card"
        style={{
          padding: '14px 18px',
          marginBottom: 20,
          border: '1px solid var(--border-control)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <i className="fa-solid fa-hand-holding-heart" style={{ color: 'var(--ink)', marginTop: 2, fontSize: 18 }} />
        <p className="text-body" style={{ fontSize: 14 }}>
          Seluruh data yang ditampilkan bersifat agregat dan tanpa nama. Dasbor ini tidak menampilkan identitas atau catatan individu, dan angka hanya muncul jika berasal dari minimal 5 orang.
        </p>
      </div>

      {/* Division Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <label htmlFor="division-select" className="text-caption" style={{ fontWeight: 600 }}>
          Pilih Divisi:
        </label>
        <select
          id="division-select"
          className="aura-input"
          style={{ width: 'auto', minWidth: 240, padding: '8px 12px', fontSize: 14 }}
          value={selectedDivision}
          onChange={(e) => setSelectedDivision(e.target.value)}
        >
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <span className="text-caption" style={{ fontStyle: 'italic' }}>
          (Pilih &quot;Tim Khusus (&lt; 5 orang)&quot; untuk menguji skenario ambang privasi)
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Skeleton height={200} radius={12} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            <Skeleton height={240} radius={12} />
            <Skeleton height={240} radius={12} />
          </div>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <Card style={{ padding: 24, textAlign: 'center', marginBottom: 24 }}>
          <p className="text-body" style={{ color: 'var(--ink)', marginBottom: 12 }}>
            {errorMsg}
          </p>
          <Button variant="primary" onClick={() => loadDashboard(selectedDivision)}>
            Coba lagi
          </Button>
        </Card>
      )}

      {/* Suppressed state (< 5 people) */}
      {!loading && data?.suppressed && (
        <Card style={{ padding: 36, textAlign: 'center', marginBottom: 24 }}>
          <Companion state="neutral" size={60} pose="sit" />
          <h2 className="text-h2" style={{ marginTop: 16, marginBottom: 8 }}>
            Data Belum Cukup untuk Ditampilkan
          </h2>
          <p className="text-body" style={{ color: 'var(--ink-muted)', maxWidth: 500, margin: '0 auto' }}>
            {data.suppression_reason || 'Demi menjaga kerahasiaan karyawan, data hanya ditampilkan jika berasal dari minimal 5 orang kontributor berbeda.'}
          </p>
        </Card>
      )}

      {/* Normal Dashboard Content */}
      {!loading && data && !data.suppressed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Section 1: 12-Month Burnout Index Trend with Snapping Tooltip (Issue 3) */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h2 className="text-h2" style={{ fontSize: 18 }}>Tren Indeks Burnout (12 Bulan Terakhir)</h2>
                <p className="text-caption">Rata-rata indeks gabungan bulanan karyawan</p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span className="text-caption" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="aura-zone-dot calm" /> Tenang (0-39)
                </span>
                <span className="text-caption" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="aura-zone-dot watch" /> Waspada (40-69)
                </span>
                <span className="text-caption" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="aura-zone-dot heavy" /> Butuh istirahat (70-100)
                </span>
              </div>
            </div>

            {/* Interactive Trend Chart Container */}
            {(() => {
              const mData = data.monthly_index;
              const handleTrendPointer = (clientX: number) => {
                if (!trendContainerRef.current || mData.length === 0) return;
                const rect = trendContainerRef.current.getBoundingClientRect();
                const relX = clientX - rect.left;
                const paddingX = (20 / 600) * rect.width;
                const plotWidth = (560 / 600) * rect.width;
                const clamped = Math.max(0, Math.min(plotWidth, relX - paddingX));
                const ratio = plotWidth > 0 ? clamped / plotWidth : 0;
                const nearestIdx = Math.round(ratio * (mData.length - 1));
                setActiveMonthIdx(Math.max(0, Math.min(mData.length - 1, nearestIdx)));
              };

              const activeMonth = activeMonthIdx !== null ? mData[activeMonthIdx] : null;
              const activeMonthX = activeMonthIdx !== null && mData.length > 1
                ? (activeMonthIdx / (mData.length - 1)) * 560 + 20
                : 300;
              const activeMonthY = activeMonth ? 144 - ((activeMonth.index / 100) * 128) : 0;

              // Find highest month (Issue 3)
              const highestMonth = mData.reduce((max, m) => m.index > max.index ? m : max, mData[0]);

              return (
                <>
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
                    {activeMonth ? (
                      <>
                        <p className="text-caption" style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                          Bulan: {activeMonth.month}
                        </p>
                        <p className="text-body" style={{ fontSize: 13, lineHeight: 1.4, margin: 0 }}>
                          Indeks burnout gabungan:{' '}
                          <strong>
                            {activeMonth.index} ({getZoneLabel(getZoneFromIndex(activeMonth.index))})
                          </strong>
                        </p>
                      </>
                    ) : (
                      <p className="text-caption" style={{ color: 'var(--ink-muted)', fontSize: 12 }}>
                        Memuat data...
                      </p>
                    )}
                  </div>

                  {/* Hint text until first interaction (Issue 1) */}
                  {!hasTrendInteracted && (
                    <p className="text-caption" style={{ fontSize: 11, marginBottom: 8, fontStyle: 'italic' }}>
                      Arahkan kursor atau ketuk grafik untuk melihat detail tiap bulan.
                    </p>
                  )}

                  <div
                    ref={trendContainerRef}
                    tabIndex={0}
                    role="region"
                    aria-label="Grafik interaktif tren bulanan HRD. Gunakan panah kiri dan kanan untuk memilih bulan."
                    onPointerMove={(e) => {
                      if (!isTrendPinned || e.pointerType !== 'mouse') handleTrendPointer(e.clientX);
                    }}
                    onPointerDown={(e) => {
                      handleTrendPointer(e.clientX);
                      setIsTrendPinned(true);
                      setHasTrendInteracted(true);
                    }}
                    onPointerUp={() => {
                      // Keep pinned on touch release
                    }}
                    onPointerLeave={() => {
                      if (!isTrendPinned && !hasTrendInteracted) {
                        setActiveMonthIdx(mData.length - 1);
                        setIsTrendPinned(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        setActiveMonthIdx((p) => (p === null ? 0 : Math.min(mData.length - 1, p + 1)));
                        setIsTrendPinned(true);
                        setHasTrendInteracted(true);
                      } else if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        setActiveMonthIdx((p) => (p === null ? mData.length - 1 : Math.max(0, p - 1)));
                        setIsTrendPinned(true);
                        setHasTrendInteracted(true);
                      } else if (e.key === 'Escape') {
                        setActiveMonthIdx(mData.length - 1);
                        setIsTrendPinned(true);
                      }
                    }}
                    style={{ width: '100%', height: 210, position: 'relative', cursor: 'crosshair', touchAction: 'none', outline: 'none' }}
                  >
                  <svg
                    viewBox="0 0 600 160"
                    style={{ width: '100%', height: '100%', overflow: 'visible' }}
                    aria-hidden="true"
                  >
                    {/* Zone tint background bands */}
                    <rect x="0" y="0" width="600" height="48" fill="var(--zone-heavy-tint)" opacity={effectiveTheme === 'dark' ? 0.35 : 0.65} />
                    <rect x="0" y="48" width="600" height="48" fill="var(--zone-watch-tint)" opacity={effectiveTheme === 'dark' ? 0.35 : 0.65} />
                    <rect x="0" y="96" width="600" height="64" fill="var(--zone-calm-tint)" opacity={effectiveTheme === 'dark' ? 0.35 : 0.65} />

                    {/* Reference lines */}
                    <line x1="0" y1="48" x2="600" y2="48" stroke="var(--border)" strokeWidth="0.8" />
                    <line x1="0" y1="96" x2="600" y2="96" stroke="var(--border)" strokeWidth="0.8" />

                    {/* Polyline 12 months */}
                    {(() => {
                      const points = mData.map((m, idx) => {
                        const x = (idx / (mData.length - 1)) * 560 + 20;
                        const y = 144 - ((m.index / 100) * 128);
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke="var(--ink)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={points}
                          />
                          {mData.map((m, idx) => {
                            const x = (idx / (mData.length - 1)) * 560 + 20;
                            const y = 144 - ((m.index / 100) * 128);
                            return (
                              <circle
                                key={m.month}
                                cx={x}
                                cy={y}
                                r="4"
                                fill="var(--surface)"
                                stroke="var(--ink)"
                                strokeWidth="2"
                              />
                            );
                          })}
                        </>
                      );
                    })()}

                    {/* Active Snapping Guideline & Marker */}
                    {activeMonth && (
                      <>
                        <line x1={activeMonthX} y1="0" x2={activeMonthX} y2="160" stroke="var(--ink)" strokeWidth="1" strokeDasharray="3 3" />
                        <circle cx={activeMonthX} cy={activeMonthY} r="6" fill="var(--surface)" stroke="var(--ink)" strokeWidth="3" />
                      </>
                    )}
                  </svg>
                  </div>
                </>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, overflowX: 'auto' }}>
              {data.monthly_index.map((m) => (
                <span key={m.month} className="text-caption" style={{ fontSize: 11 }}>
                  {m.month.slice(5)}/{m.month.slice(2, 4)}
                </span>
              ))}
            </div>

            <p className="text-caption" style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
              Arahkan kursor atau seret jari pada grafik untuk rincian data bulanan. Indeks tercatat tertinggi pada bulan Oktober dan Desember.
            </p>
          </Card>

          {/* Section 2 & 3: Two Columns on desktop, stacked on mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {/* Heatmap Hari yang Paling Sering Berat with Interactive Tooltips */}
            <Card>
              <div style={{ marginBottom: 12 }}>
                <h2 className="text-h2" style={{ fontSize: 18 }}>Hari yang Paling Sering Berat</h2>
                <p className="text-caption">Persentase catatan dengan skor tinggi (≥ 7) dalam 4 minggu terakhir</p>
              </div>

              {/* Dynamic Heatmap Info / Fixed Readout Panel (Issue 1) */}
              <div
                style={{
                  minHeight: 32,
                  marginBottom: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {activeHeatmapIdx !== null && data.heatmap.cells[activeHeatmapIdx] ? (
                  <p className="text-body" style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
                    {(() => {
                      const cell = data.heatmap.cells[activeHeatmapIdx];
                      const d = new Date(cell.date);
                      const dayName = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
                      return cell.high_load_percent !== null
                        ? `${dayName}: ${cell.high_load_percent}% catatan beban tinggi`
                        : `${dayName}: Data belum cukup (minimal 5 orang)`;
                    })()}
                  </p>
                ) : (
                  <p className="text-caption" style={{ fontSize: 12, margin: 0 }}>
                    Arahkan kursor atau sentuh sel untuk rincian hari dan persentase.
                  </p>
                )}
              </div>

              {/* Heatmap Grid */}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6, textAlign: 'center' }}>
                  {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
                    <span key={day} className="text-caption" style={{ fontSize: 11, fontWeight: 600 }}>
                      {day}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                  {data.heatmap.cells.map((cell, idx) => (
                    <div
                      key={idx}
                      tabIndex={0}
                      role="button"
                      aria-label={`${cell.date}: ${cell.high_load_percent !== null ? `${cell.high_load_percent}% beban tinggi` : 'Belum cukup data'}`}
                      onPointerEnter={() => setActiveHeatmapIdx(idx)}
                      onPointerLeave={() => setActiveHeatmapIdx(null)}
                      onFocus={() => setActiveHeatmapIdx(idx)}
                      onBlur={() => setActiveHeatmapIdx(null)}
                      style={{
                        height: 38,
                        borderRadius: 6,
                        backgroundColor: getHeatmapColor(cell.high_load_percent),
                        color: getHeatmapTextColor(cell.high_load_percent),
                        border: activeHeatmapIdx === idx ? '2px solid var(--ink)' : '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transform: activeHeatmapIdx === idx ? 'scale(1.08)' : 'scale(1)',
                        transition: 'transform 120ms ease',
                      }}
                    >
                      {cell.high_load_percent !== null ? `${cell.high_load_percent}%` : '-'}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                  <span className="text-caption" style={{ fontSize: 11 }}>Intensitas: Rendah</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[10, 20, 35, 50].map((v, i) => (
                      <div
                        key={i}
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 3,
                          backgroundColor: getHeatmapColor(v),
                          border: '1px solid var(--border)',
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-caption" style={{ fontSize: 11 }}>Tinggi</span>
                </div>
              </div>
            </Card>

            {/* Pemicu Utama (Donut Chart with Interactive Highlights & Slices) */}
            <Card>
              <div style={{ marginBottom: 12 }}>
                <h2 className="text-h2" style={{ fontSize: 18 }}>Pemicu Utama Tim</h2>
                <p className="text-caption">Kategori yang paling sering muncul bersamaan dengan beban tinggi</p>
              </div>

              {/* Fixed Readout Panel for Donut (Issue 1) */}
              <div
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 12,
                  minHeight: 40,
                }}
              >
                {activeDriverIdx !== null && data.drivers[activeDriverIdx] ? (
                  <p className="text-body" style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
                    {data.drivers[activeDriverIdx].label}: {data.drivers[activeDriverIdx].percent}% ({data.drivers[activeDriverIdx].count} laporan)
                  </p>
                ) : (
                  <p className="text-caption" style={{ fontSize: 12, margin: 0 }}>
                    Arahkan kursor atau sentuh irisan untuk melihat detail kategori.
                  </p>
                )}
              </div>

              {/* SVG Donut Chart */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '10px 0', flexWrap: 'wrap' }}>
                <svg width="140" height="140" viewBox="0 0 100 100" aria-label="Diagram donut kategori pemicu beban kerja">
                  {(() => {
                    const total = data.drivers.reduce((acc, d) => acc + d.count, 0);
                    let currentAngle = 0;
                    const shades = [
                      effectiveTheme === 'dark' ? '#F2F2F2' : '#1A1A1A',
                      effectiveTheme === 'dark' ? '#A3A3A3' : '#5E5E5E',
                      effectiveTheme === 'dark' ? '#707070' : '#8E8E8E',
                      effectiveTheme === 'dark' ? '#404040' : '#C4C4C4',
                    ];

                    return data.drivers.map((driver, idx) => {
                      const sliceAngle = (driver.count / total) * 360;
                      const startRad = (currentAngle - 90) * (Math.PI / 180);
                      const endRad = (currentAngle + sliceAngle - 90) * (Math.PI / 180);
                      currentAngle += sliceAngle;

                      const x1 = 50 + 38 * Math.cos(startRad);
                      const y1 = 50 + 38 * Math.sin(startRad);
                      const x2 = 50 + 38 * Math.cos(endRad);
                      const y2 = 50 + 38 * Math.sin(endRad);

                      const largeArc = sliceAngle > 180 ? 1 : 0;
                      const pathData = `M 50 50 L ${x1} ${y1} A 38 38 0 ${largeArc} 1 ${x2} ${y2} Z`;

                      const isSelected = activeDriverIdx === idx;
                      const isDimmed = activeDriverIdx !== null && !isSelected;

                      return (
                        <path
                          key={driver.category}
                          d={pathData}
                          fill={shades[idx % shades.length]}
                          stroke="var(--surface)"
                          strokeWidth="1.5"
                          tabIndex={0}
                          role="button"
                          aria-label={`${driver.label}: ${driver.percent}% (${driver.count} laporan)`}
                          onPointerEnter={() => setActiveDriverIdx(idx)}
                          onPointerLeave={() => setActiveDriverIdx(null)}
                          onFocus={() => setActiveDriverIdx(idx)}
                          onBlur={() => setActiveDriverIdx(null)}
                          style={{
                            cursor: 'pointer',
                            opacity: isDimmed ? 0.35 : 1,
                            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                            transformOrigin: '50px 50px',
                            transition: 'opacity 150ms ease, transform 150ms ease',
                            outline: 'none',
                          }}
                        />
                      );
                    });
                  })()}
                  {/* Center cutout for donut hole */}
                  <circle cx="50" cy="50" r="22" fill="var(--surface)" />
                </svg>

                {/* Legend with Interactive Hover Link to Donut */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.drivers.map((driver, idx) => {
                    const shades = [
                      effectiveTheme === 'dark' ? '#F2F2F2' : '#1A1A1A',
                      effectiveTheme === 'dark' ? '#A3A3A3' : '#5E5E5E',
                      effectiveTheme === 'dark' ? '#707070' : '#8E8E8E',
                      effectiveTheme === 'dark' ? '#404040' : '#C4C4C4',
                    ];
                    const isSelected = activeDriverIdx === idx;
                    return (
                      <div
                        key={driver.category}
                        tabIndex={0}
                        role="button"
                        onPointerEnter={() => setActiveDriverIdx(idx)}
                        onPointerLeave={() => setActiveDriverIdx(null)}
                        onFocus={() => setActiveDriverIdx(idx)}
                        onBlur={() => setActiveDriverIdx(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '2px 4px',
                          borderRadius: 4,
                          backgroundColor: isSelected ? 'var(--bg)' : 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: shades[idx % shades.length],
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <p className="text-body" style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, lineHeight: 1.2 }}>
                            {driver.label}
                          </p>
                          <span className="text-caption" style={{ fontSize: 11 }}>
                            {driver.percent}% ({driver.count} laporan)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Section 4: Saran untuk HRD */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <i className="fa-solid fa-lightbulb" style={{ color: 'var(--ink)', fontSize: 18 }} />
              <div>
                <h2 className="text-h2" style={{ fontSize: 18 }}>Saran Pertimbangan untuk HRD</h2>
                <p className="text-caption">Langkah preventif berbasis pola agregat tanpa menghakimi performa</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.suggestions.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                  }}
                >
                  <span className="text-caption" style={{ fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 4 }}>
                    Fokus Divisi: {s.division}
                  </span>
                  <p className="text-body" style={{ fontSize: 14 }}>
                    {s.text}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
