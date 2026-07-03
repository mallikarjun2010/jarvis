'use client';

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Search, PlusCircle, Sparkles, RefreshCw, AlertCircle, BarChart3 } from 'lucide-react';

export const SheetsView = () => {
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheetId, setSheetId] = useState('');
  const [range, setRange] = useState('Sheet1!A1:D10');
  const [sheetData, setSheetData] = useState<any[][] | null>(null);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState('');

  // Row appending states
  const [appendRange, setAppendRange] = useState('Sheet1');
  const [rowValues, setRowValues] = useState('');
  const [appending, setAppending] = useState(false);

  // AI insights
  const [aiInsights, setAiInsights] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchSpreadsheets();
  }, []);

  const fetchSpreadsheets = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/drive?q=${encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet'")}`);
      const data = await res.json();
      if (data.success) {
        setSpreadsheets(data.files || []);
        if (data.files?.length > 0 && !sheetId) {
          setSheetId(data.files[0].id); // Default to first sheet
        }
      } else {
        setError('Failed to fetch spreadsheets list');
      }
    } catch (e) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchData = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sheetId) return;

    setFetchingData(true);
    setError('');
    setSheetData(null);
    try {
      // We will leverage a Gemini tool search or direct sheet details.
      // Wait, we can fetch via sheets API: GET `/api/sheets?spreadsheetId=...&range=...`
      // Wait! Let's write the sheet fetch API directly inside `/api/sheets` as a helper.
      // Let's create `src/app/api/sheets/route.ts` next to make this work!
      const res = await fetch(`/api/sheets?spreadsheetId=${sheetId}&range=${encodeURIComponent(range)}`);
      const data = await res.json();
      if (data.success) {
        setSheetData(data.values || []);
      } else {
        setError(data.error || 'Failed to read sheet cells');
      }
    } catch (err) {
      setError('Communication error fetching sheet data');
    } finally {
      setFetchingData(false);
    }
  };

  const handleAppendRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetId || !rowValues.trim()) return;

    setAppending(true);
    try {
      const parsedValues = rowValues.split(',').map((val) => val.trim());
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: sheetId,
          range: appendRange,
          values: parsedValues,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRowValues('');
        alert('Row appended successfully.');
        handleFetchData(); // Refresh data
      } else {
        alert(`Append failed: ${data.error}`);
      }
    } catch (e) {
      alert('Append failed: Server timeout.');
    } finally {
      setAppending(false);
    }
  };

  const handleAnalyzeData = async () => {
    if (!sheetId || !sheetData) {
      alert('Please select a sheet and fetch its cell data first.');
      return;
    }

    setAnalyzing(true);
    setAiInsights('');
    try {
      const serializedData = JSON.stringify(sheetData);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Analyze this spreadsheet grid data and generate AI recommendations, trends, and a quick summary: ${serializedData}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiInsights(data.content);
      } else {
        setAiInsights(`Failed to compile insights: ${data.error}`);
      }
    } catch (e) {
      setAiInsights('Failed to connect to agent node.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
      
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileSpreadsheet size={24} style={{ color: 'var(--accent-cyan)' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-cyber)' }}>GOOGLE SHEETS</h2>
        </div>
        <button
          onClick={fetchSpreadsheets}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.05)',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin-slow' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '10px', color: '#f87171', fontSize: '13px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Selector and Data Range fetcher */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', fontFamily: 'var(--font-cyber)', color: 'var(--accent-cyan)' }}>
          CELL RANGE EXPLORER
        </h3>
        
        <form onSubmit={handleFetchData} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 120px', gap: '12px' }}>
          <select
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
            disabled={loading}
          >
            {spreadsheets.length === 0 ? (
              <option value="">No spreadsheets found in Drive</option>
            ) : (
              spreadsheets.map((sheet) => (
                <option key={sheet.id} value={sheet.id}>
                  {sheet.name}
                </option>
              ))
            )}
          </select>
          <input
            type="text"
            placeholder="Range (e.g. Sheet1!A1:D10)"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          />
          <button
            type="submit"
            disabled={fetchingData || !sheetId}
            style={{
              background: 'var(--primary-glow)',
              border: '1px solid var(--primary)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontWeight: 500,
            }}
          >
            {fetchingData ? 'Loading...' : 'Fetch Cells'}
          </button>
        </form>
      </div>

      {/* Grid Display & AI Insights */}
      {sheetData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          
          {/* Sheet Table */}
          <div className="glass-panel" style={{ padding: '16px', overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>DATA TABLE PREVIEW</h4>
            {sheetData.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                Sheet range is empty.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    {sheetData[0].map((cell, idx) => (
                      <th key={idx} style={{ padding: '8px', color: 'var(--primary)' }}>{cell}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sheetData.slice(1).map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} style={{ padding: '8px', color: 'var(--text-secondary)' }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* AI Analytics */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-purple)' }}>AI ANALYTICAL PREVIEW</h4>
              <button
                onClick={handleAnalyzeData}
                disabled={analyzing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(157, 78, 221, 0.15)',
                  border: '1px solid var(--accent-purple)',
                  color: 'var(--text-primary)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                }}
              >
                <BarChart3 size={12} />
                {analyzing ? 'Analyzing...' : 'Run Analytics'}
              </button>
            </div>

            <div
              style={{
                flexGrow: 1,
                fontSize: '12px',
                lineHeight: '1.5',
                color: 'var(--text-primary)',
                background: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '8px',
                maxHeight: '220px',
                overflowY: 'auto',
                border: '1px solid var(--border-glass)',
              }}
            >
              {analyzing ? (
                <div className="skeleton" style={{ height: '100px', width: '100%' }} />
              ) : (
                aiInsights || 'Fetch cells and trigger AI Analysis to generate structured recommendations.'
              )}
            </div>
          </div>
        </div>
      )}

      {/* Row appending form */}
      {sheetId && (
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', fontFamily: 'var(--font-cyber)', color: 'var(--primary)' }}>
            APPEND NEW ROW DATA
          </h3>
          <form onSubmit={handleAppendRow} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 120px', gap: '12px' }}>
            <input
              type="text"
              placeholder="Sheet Range Name (e.g. Sheet1)"
              value={appendRange}
              onChange={(e) => setAppendRange(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Values (comma separated, e.g. 2026-07-02, Sales, Mallikarjun, 4500)"
              value={rowValues}
              onChange={(e) => setRowValues(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={appending}
              style={{
                background: 'rgba(0, 210, 255, 0.08)',
                border: '1px solid rgba(0, 210, 255, 0.2)',
                color: 'var(--primary)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontWeight: 500,
              }}
            >
              <PlusCircle size={14} />
              {appending ? 'Saving...' : 'Add Row'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
export default SheetsView;
