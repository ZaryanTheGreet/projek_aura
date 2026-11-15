import React, { useState, useEffect } from 'react';
import { JournalEntry, TriggerSummaryResponse } from '../types';
import { Card, Button } from '../components/UI';
import { api, getZoneFromIndex, getZoneLabel } from '../api';

interface PrintableDocumentProps {
  mode: 'konselor' | 'data_saya';
  onBack: () => void;
}

export const PrintableDocument: React.FC<PrintableDocumentProps> = ({ mode, onBack }) => {
  const [range, setRange] = useState<'30d' | '90d' | 'all'>('30d');
  const [includeTrend, setIncludeTrend] = useState(true);
  const [includeTriggers, setIncludeTriggers] = useState(true);
  const [includeWeekdayPattern, setIncludeWeekdayPattern] = useState(true);
  const [includeJournalText, setIncludeJournalText] = useState(false);
  const [personalNote, setPersonalNote] = useState('');

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [triggerSummary, setTriggerSummary] = useState<TriggerSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [range]);

  const loadData = async () => {
    setLoading(true);
    const all = await api.getEntries();
    // Exclude crisis entries from PDF export per privacy rules
    const nonCrisis = all.filter((e) => !e.crisis_flag);

    let filtered = nonCrisis;
    if (range !== 'all') {
      const days = range === '30d' ? 30 : 90;
      const cutoff = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
      filtered = nonCrisis.filter((e) => e.date >= cutoff);
    }

    setEntries(filtered);
    const summary = await api.getTriggerSummary(range === 'all' ? '30d' : range === '90d' ? '30d' : '30d');
    setTriggerSummary(summary);
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    // Portability JSON export (F9)
    const jsonStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-catatan-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const highLoadDays = entries.filter((e) => e.daily_stress_score >= 7).length;
  const currentDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate weekday breakdown
  const weekdayCounts: Record<string, number> = {
    Senin: 0,
    Selasa: 0,
    Rabu: 0,
    Kamis: 0,
    Jumat: 0,
    Sabtu: 0,
    Minggu: 0,
  };
  const weekdayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  let duringWorkHours = 0;
  let afterWorkHours = 0;

  entries.forEach((e) => {
    const d = new Date(e.created_at || e.date);
    const dayName = weekdayNames[d.getDay()];
    if (weekdayCounts[dayName] !== undefined) {
      weekdayCounts[dayName]++;
    }
    const hour = d.getHours();
    if (hour >= 9 && hour < 18) {
      duringWorkHours++;
    } else {
      afterWorkHours++;
    }
  });

  // Top high day
  const sortedDays = Object.entries(weekdayCounts).sort((a, b) => b[1] - a[1]);
  const mostFrequentDay = sortedDays[0]?.[0] || 'Senin';

  return (
    <div className="app-container-no-nav" style={{ padding: '20px 20px 32px' }}>
      {/* Configuration Controls (hidden during print) */}
      <div className="print-hide" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 className="text-h1" style={{ fontSize: 22 }}>
              {mode === 'konselor' ? 'Ringkasan untuk Psikolog / Konselor' : 'Unduh Catatanku (PDF)'}
            </h1>
            <p className="text-caption">
              {mode === 'konselor'
                ? 'Dokumen siap cetak untuk diskusi dengan psikolog atau layanan EAP'
                : 'Salinan catatan harian dalam format dokumen yang rapi dan mudah dibaca'}
            </p>
          </div>
          <Button variant="text" onClick={onBack} aria-label="Tutup pratinjau">
            <i className="fa-solid fa-xmark" style={{ fontSize: 18 }} />
          </Button>
        </div>

        {/* Options Card */}
        <Card style={{ marginBottom: 16 }}>
          <p className="text-body" style={{ fontWeight: 600, marginBottom: 10 }}>Pilihan Dokumen</p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {(['30d', '90d', 'all'] as const).map((r) => (
              <button
                key={r}
                type="button"
                className={`aura-chip ${range === r ? 'active' : ''}`}
                onClick={() => setRange(r)}
                style={{ minHeight: 34, fontSize: 13, padding: '0 12px' }}
              >
                {r === '30d' ? '30 hari' : r === '90d' ? '90 hari' : 'Semua'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeTrend}
                onChange={(e) => setIncludeTrend(e.target.checked)}
              />
              Grafik dan tren beban
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeTriggers}
                onChange={(e) => setIncludeTriggers(e.target.checked)}
              />
              Peta pemicu utama
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeWeekdayPattern}
                onChange={(e) => setIncludeWeekdayPattern(e.target.checked)}
              />
              Pola hari dan waktu pencatatan
            </label>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeJournalText}
                onChange={(e) => setIncludeJournalText(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>
                Sertakan teks cerita jurnal asli
                <span className="text-caption" style={{ display: 'block', color: 'var(--zone-watch)' }}>
                  Peringatan: Berisi cerita pribadimu. Simpan dokumen di tempat yang aman.
                </span>
              </span>
            </label>
          </div>

          {mode === 'konselor' && (
            <div style={{ marginTop: 14 }}>
              <label htmlFor="counselor-notes" className="text-caption" style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                Catatan pengantar darimu (opsional untuk konselor)
              </label>
              <textarea
                id="counselor-notes"
                className="aura-textarea"
                style={{ minHeight: 80, fontSize: 14 }}
                placeholder="Tulis hal spesifik yang ingin kamu diskusikan saat sesi konseling..."
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
              />
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button variant="primary" style={{ width: '100%' }} onClick={handlePrint} icon="fa-download">
            Simpan sebagai PDF
          </Button>
          <p className="text-caption" style={{ textAlign: 'center' }}>
            Di jendela dialog cetak browser, pilih tujuan <strong>&quot;Simpan sebagai PDF&quot;</strong>.
          </p>

          <button
            type="button"
            className="aura-btn-text"
            onClick={handleDownloadJSON}
            style={{ justifyContent: 'center', fontSize: 13 }}
          >
            Unduh data mentah (JSON, untuk cadangan atau dipindahkan ke aplikasi lain)
          </button>
        </div>
      </div>

      {/* Printable Document Sheet (rendered clean on screen & on print) */}
      <div
        className="printable-page aura-card"
        style={{
          backgroundColor: '#FFFFFF',
          color: '#1A1A1A',
          borderColor: '#E4E0D8',
          padding: 24,
          borderRadius: 8,
          boxShadow: 'none',
        }}
      >
        {/* Document Header */}
        <div style={{ borderBottom: '2px solid #1A1A1A', paddingBottom: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 18, fontWeight: 700 }}>Aura</span>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                {mode === 'konselor' ? 'Ringkasan Catatan Refleksi Kerja' : 'Salinan Catatan Refleksi Aura'}
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: '#666666' }}>Dibuat pada: {currentDateStr}</p>
              <p style={{ fontSize: 12, color: '#666666' }}>
                Periode: {range === '30d' ? '30 hari terakhir' : range === '90d' ? '90 hari terakhir' : 'Semua catatan'}
              </p>
            </div>
          </div>
        </div>

        {/* Section: Gambaran Singkat */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: '#1A1A1A' }}>
            Gambaran Singkat
          </h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#333333' }}>
            Dalam periode ini tercatat {entries.length} kali refleksi. Beban tinggi (skor 7 ke atas) muncul pada {highLoadDays} hari. Hari yang paling sering mencatat beban tinggi adalah {mostFrequentDay}.
          </p>
        </div>

        {/* Section: Personal Note if any */}
        {mode === 'konselor' && personalNote.trim() && (
          <div style={{ marginBottom: 20, padding: 12, backgroundColor: '#F8F8F8', border: '1px solid #E0E0E0', borderRadius: 6 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Catatan dari Pengguna:</h4>
            <p style={{ fontSize: 12, fontStyle: 'italic', lineHeight: 1.5 }}>{personalNote}</p>
          </div>
        )}

        {/* Section: Tren Beban (SVG Chart with Full Indicators - Issue 7) */}
        {includeTrend && entries.length > 0 && (() => {
          const validBurnoutEntries = entries.filter((e) => e.burnout_index !== null);
          const highestEntry = validBurnoutEntries.length > 0
            ? validBurnoutEntries.reduce((max, e) => (e.burnout_index! > max.burnout_index! ? e : max), validBurnoutEntries[0])
            : null;
          const lowestEntry = validBurnoutEntries.length > 0
            ? validBurnoutEntries.reduce((min, e) => (e.burnout_index! < min.burnout_index! ? e : min), validBurnoutEntries[0])
            : null;

          // Dimensions: viewBox 0 0 540 180
          // Plot area: X from 45 to 440, Y from 20 (index 100) to 140 (index 0)
          const plotLeft = 45;
          const plotRight = 440;
          const plotWidth = plotRight - plotLeft;
          const plotTop = 20;
          const plotBottom = 140;
          const plotHeight = plotBottom - plotTop;

          const getY = (val: number) => plotBottom - (val / 100) * plotHeight;
          const getX = (idx: number) => entries.length > 1 ? plotLeft + (idx / (entries.length - 1)) * plotWidth : (plotLeft + plotRight) / 2;

          return (
            <div style={{ marginBottom: 24, pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>
                    Indeks burnout (0-100)
                  </h3>
                  <span style={{ fontSize: 11, color: '#555555' }}>
                    Grafik pemantauan beban kerja harian dan indeks pola 7 hari
                  </span>
                </div>
                {/* Print Legend (Distinguishable without color) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 16, height: 3.5, backgroundColor: '#1A1A1A', display: 'inline-block' }} />
                    <strong>Indeks burnout</strong> (Garis tebal)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 16, height: 1.5, backgroundColor: '#777777', display: 'inline-block' }} />
                    Beban harian (0-100)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#777777' }}>
                    <span style={{ borderTop: '1px dashed #999', width: 14, display: 'inline-block' }} />
                    Jeda = tanpa catatan
                  </span>
                </div>
              </div>

              {/* Printable SVG with Complete Axes & Indicators */}
              <div style={{ width: '100%', height: 180, border: '1px solid #CCCCCC', borderRadius: 4, overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                <svg viewBox="0 0 540 180" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  {/* Fixed solid tint bands with exact print color */}
                  <rect x={plotLeft} y={getY(100)} width={plotWidth} height={getY(70) - getY(100)} fill="#F8E4E4" style={{ printColorAdjust: 'exact' }} />
                  <rect x={plotLeft} y={getY(70)} width={plotWidth} height={getY(40) - getY(70)} fill="#FBF1DC" style={{ printColorAdjust: 'exact' }} />
                  <rect x={plotLeft} y={getY(40)} width={plotWidth} height={getY(0) - getY(40)} fill="#E6F2EC" style={{ printColorAdjust: 'exact' }} />

                  {/* Y Axis Gridlines and Numbers */}
                  {[0, 40, 70, 100].map((yVal) => (
                    <g key={yVal}>
                      <line x1={plotLeft} y1={getY(yVal)} x2={plotRight} y2={getY(yVal)} stroke="#BBBBBB" strokeWidth="0.8" />
                      <text x={plotLeft - 6} y={getY(yVal) + 4} textAnchor="end" fontSize="10" fontWeight="600" fill="#333333">
                        {yVal}
                      </text>
                    </g>
                  ))}

                  {/* Right-side Zone Text Labels (Always legible without color) */}
                  <text x={plotRight + 8} y={getY(85) + 3} fontSize="10" fontWeight="700" fill="#992222">
                    Butuh istirahat (70-100)
                  </text>
                  <text x={plotRight + 8} y={getY(55) + 3} fontSize="10" fontWeight="700" fill="#886611">
                    Waspada (40-69)
                  </text>
                  <text x={plotRight + 8} y={getY(20) + 3} fontSize="10" fontWeight="700" fill="#226644">
                    Tenang (0-39)
                  </text>

                  {/* Segments for Daily Score (Thin line, dashed if date gap > 1 day) */}
                  {entries.map((e, idx) => {
                    if (idx === 0) return null;
                    const prev = entries[idx - 1];
                    const prevX = getX(idx - 1);
                    const prevY = getY(((prev.daily_stress_score - 1) / 9) * 100);
                    const currX = getX(idx);
                    const currY = getY(((e.daily_stress_score - 1) / 9) * 100);

                    // Check date gap
                    const gapDays = (new Date(e.date).getTime() - new Date(prev.date).getTime()) / 86400000;
                    const isGap = gapDays > 1.5;

                    return (
                      <line
                        key={`score-seg-${idx}`}
                        x1={prevX}
                        y1={prevY}
                        x2={currX}
                        y2={currY}
                        stroke="#777777"
                        strokeWidth="1.4"
                        strokeDasharray={isGap ? '3 3' : undefined}
                      />
                    );
                  })}

                  {/* Segments for Burnout Index (Thick solid line) */}
                  {validBurnoutEntries.map((e, idx) => {
                    if (idx === 0) return null;
                    const prev = validBurnoutEntries[idx - 1];
                    const prevIdx = entries.findIndex((item) => item.id === prev.id);
                    const currIdx = entries.findIndex((item) => item.id === e.id);
                    const prevX = getX(prevIdx);
                    const prevY = getY(prev.burnout_index!);
                    const currX = getX(currIdx);
                    const currY = getY(e.burnout_index!);

                    const gapDays = (new Date(e.date).getTime() - new Date(prev.date).getTime()) / 86400000;
                    const isGap = gapDays > 1.5;

                    return (
                      <line
                        key={`burnout-seg-${idx}`}
                        x1={prevX}
                        y1={prevY}
                        x2={currX}
                        y2={currY}
                        stroke="#1A1A1A"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeDasharray={isGap ? '4 3' : undefined}
                      />
                    );
                  })}

                  {/* Highest Callout Marker & Label */}
                  {highestEntry && (() => {
                    const hIdx = entries.findIndex((item) => item.id === highestEntry.id);
                    const hX = getX(hIdx);
                    const hY = getY(highestEntry.burnout_index!);
                    const flipLeft = hX > 320;
                    return (
                      <g>
                        <circle cx={hX} cy={hY} r="4.5" fill="#1A1A1A" stroke="#FFFFFF" strokeWidth="1.5" />
                        <rect
                          x={flipLeft ? hX - 110 : hX + 6}
                          y={hY - 18}
                          width="104"
                          height="16"
                          fill="#FFFFFF"
                          stroke="#1A1A1A"
                          strokeWidth="0.8"
                          rx="3"
                        />
                        <text
                          x={flipLeft ? hX - 58 : hX + 58}
                          y={hY - 6}
                          fontSize="9"
                          fontWeight="700"
                          textAnchor="middle"
                          fill="#1A1A1A"
                        >
                          Tertinggi: {highestEntry.burnout_index} ({highestEntry.date.slice(5)})
                        </text>
                      </g>
                    );
                  })()}

                  {/* Lowest Callout Marker & Label */}
                  {lowestEntry && lowestEntry.id !== highestEntry?.id && (() => {
                    const lIdx = entries.findIndex((item) => item.id === lowestEntry.id);
                    const lX = getX(lIdx);
                    const lY = getY(lowestEntry.burnout_index!);
                    const flipLeft = lX > 320;
                    return (
                      <g>
                        <circle cx={lX} cy={lY} r="4.5" fill="#1A1A1A" stroke="#FFFFFF" strokeWidth="1.5" />
                        <rect
                          x={flipLeft ? lX - 105 : lX + 6}
                          y={lY + 4}
                          width="100"
                          height="16"
                          fill="#FFFFFF"
                          stroke="#1A1A1A"
                          strokeWidth="0.8"
                          rx="3"
                        />
                        <text
                          x={flipLeft ? lX - 55 : lX + 56}
                          y={lY + 16}
                          fontSize="9"
                          fontWeight="700"
                          textAnchor="middle"
                          fill="#1A1A1A"
                        >
                          Terendah: {lowestEntry.burnout_index} ({lowestEntry.date.slice(5)})
                        </text>
                      </g>
                    );
                  })()}

                  {/* X Axis Date Ticks (every 7 days or all if <= 7 entries) */}
                  {entries.map((e, idx) => {
                    const isTick = entries.length <= 7 || idx === 0 || idx === entries.length - 1 || idx % 7 === 0;
                    if (!isTick) return null;
                    const x = getX(idx);
                    const dateFormatted = `${e.date.slice(8, 10)} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][parseInt(e.date.slice(5, 7), 10) - 1]}`;

                    return (
                      <g key={`xtick-${idx}`}>
                        <line x1={x} y1={plotBottom} x2={x} y2={plotBottom + 4} stroke="#333333" strokeWidth="1" />
                        <text x={x} y={plotBottom + 16} textAnchor="middle" fontSize="9" fontWeight="500" fill="#333333">
                          {dateFormatted}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Explanatory Caption below graph (Issue 7) */}
              <p style={{ fontSize: 11, color: '#444444', marginTop: 6, lineHeight: 1.4 }}>
                Makin tinggi garis, makin berat bebanmu. Indeks adalah gambaran pola dari catatan harianmu sendiri, bukan diagnosis klinis. Dihitung dari total {entries.length} catatan dalam rentang waktu ini.
              </p>
            </div>
          );
        })()}

        {/* Section: Yang Sering Muncul (Pemicu) */}
        {includeTriggers && triggerSummary && (
          <div style={{ marginBottom: 24, pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#1A1A1A' }}>
              Pemicu yang Sering Muncul Bersamaan Beban Tinggi
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1A1A1A', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>Kategori Pemicu</th>
                  <th style={{ padding: '6px 8px' }}>Jumlah Muncul (n)</th>
                  <th style={{ padding: '6px 8px' }}>Persentase</th>
                </tr>
              </thead>
              <tbody>
                {triggerSummary.items.map((item) => (
                  <tr key={item.key} style={{ borderBottom: '1px solid #EEEEEE' }}>
                    <td style={{ padding: '6px 8px' }}>{item.label}</td>
                    <td style={{ padding: '6px 8px' }}>{item.count} kali</td>
                    <td style={{ padding: '6px 8px' }}>{item.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Section: Pola Hari & Waktu */}
        {includeWeekdayPattern && (
          <div style={{ marginBottom: 24, pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#1A1A1A' }}>
              Pola Hari dan Waktu Pencatatan
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, textAlign: 'center', marginBottom: 12 }}>
              {Object.entries(weekdayCounts).map(([day, count]) => (
                <div key={day} style={{ border: '1px solid #E0E0E0', borderRadius: 4, padding: '6px 2px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, display: 'block' }}>{day}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{count}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#444444' }}>
              Waktu pencatatan: {duringWorkHours} catatan saat jam kerja (09.00 - 18.00), {afterWorkHours} catatan setelah jam kerja.
            </p>
          </div>
        )}

        {/* Section: Daftar Catatan (mode data_saya) */}
        {mode === 'data_saya' && (
          <div style={{ marginBottom: 24, pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#1A1A1A' }}>
              Daftar Catatan Per Tanggal
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1A1A1A', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>Tanggal</th>
                  <th style={{ padding: '6px 8px' }}>Beban Hari Ini</th>
                  <th style={{ padding: '6px 8px' }}>Status Zona</th>
                  <th style={{ padding: '6px 8px' }}>Pemicu</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #EEEEEE' }}>
                    <td style={{ padding: '6px 8px' }}>{e.date}</td>
                    <td style={{ padding: '6px 8px' }}>{e.daily_stress_score}/10</td>
                    <td style={{ padding: '6px 8px' }}>
                      {getZoneLabel(getZoneFromIndex(e.burnout_index, e.daily_stress_score))}
                    </td>
                    <td style={{ padding: '6px 8px' }}>{e.triggers.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Section: Teks Jurnal (only if explicit opt-in) */}
        {includeJournalText && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#1A1A1A' }}>
              Teks Cerita Jurnal Lengkap
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {entries.filter((e) => e.journal_text).map((e) => (
                <div key={e.id} style={{ borderLeft: '2px solid #666666', paddingLeft: 10, pageBreakInside: 'avoid' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#666666' }}>{e.date}</span>
                  <p style={{ fontSize: 12, lineHeight: 1.5, marginTop: 2, whiteSpace: 'pre-wrap' }}>
                    {e.journal_text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #CCCCCC', paddingTop: 12, marginTop: 32, fontSize: 11, color: '#666666' }}>
          <p>Ringkasan ini bukan diagnosis. Hanya gambaran pola dari catatanmu sendiri.</p>
          <p>Dibuat oleh Aura pada {currentDateStr}. Dokumen ini bersifat pribadi dan Aura tidak mengirim dokumen ini ke siapa pun.</p>
        </div>
      </div>
    </div>
  );
};
