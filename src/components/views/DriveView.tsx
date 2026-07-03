'use client';

import React, { useState, useEffect } from 'react';
import { HardDrive, Search, FileText, Trash2, Sparkles, RefreshCw, AlertCircle, Eye } from 'lucide-react';

export const DriveView = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // AI Summarization
  const [summarizingFileId, setSummarizingFileId] = useState<string | null>(null);
  const [fileSummary, setFileSummary] = useState('');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async (q = '') => {
    setLoading(true);
    setError('');
    try {
      const queryParam = q ? `q=${encodeURIComponent(`name contains '${q}'`)}` : '';
      const res = await fetch(`/api/drive?${queryParam}`);
      const data = await res.json();
      if (data.success) {
        setFiles(data.files || []);
      } else {
        setError(data.error || 'Failed to list Drive files');
      }
    } catch (e) {
      setError('Connection to Drive endpoint failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiles(searchQuery);
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file from Google Drive?')) return;
    try {
      const res = await fetch(`/api/drive?fileId=${fileId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setFiles((prev) => prev.filter((file) => file.id !== fileId));
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Deletion failed.');
    }
  };

  const handleSummarize = async (fileId: string, name: string) => {
    setSummarizingFileId(fileId);
    setFileSummary('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Read Google Drive file with ID "${fileId}" and compile a concise structured summary including key highlights. Title of file is: "${name}"`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFileSummary(data.content);
      } else {
        setFileSummary(`Failed to summarize: ${data.error}`);
      }
    } catch (e) {
      setFileSummary('Failed to connect to agent service.');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('document')) return <FileText size={18} style={{ color: 'var(--primary)' }} />;
    if (mimeType.includes('spreadsheet')) return <FileText size={18} style={{ color: 'var(--accent-cyan)' }} />;
    return <FileText size={18} style={{ color: 'var(--text-secondary)' }} />;
  };

  const formatSize = (bytesStr?: string) => {
    if (!bytesStr) return 'N/A';
    const bytes = parseInt(bytesStr);
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HardDrive size={24} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-cyber)' }}>GOOGLE DRIVE</h2>
        </div>
        <button
          onClick={() => fetchFiles()}
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

      {/* Search form */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="Search files by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flexGrow: 1 }}
        />
        <button
          type="submit"
          style={{
            background: 'var(--primary-glow)',
            border: '1px solid var(--primary)',
            borderRadius: '8px',
            padding: '0 16px',
            color: 'var(--text-primary)',
          }}
        >
          <Search size={16} />
        </button>
      </form>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '10px', color: '#f87171', fontSize: '13px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: summarizingFileId ? '1.2fr 1fr' : '1fr', gap: '16px' }}>
        
        {/* Files list table */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>FILE INDEX</h3>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '54px', borderRadius: '8px', marginBottom: '8px' }} />
            ))
          ) : files.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No files found in Google Drive root.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {files.map((file) => (
                <div
                  key={file.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-glass)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '60%' }}>
                    {getFileIcon(file.mimeType)}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {file.name}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {formatSize(file.size)} • {new Date(file.createdTime).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      style={{ background: 'rgba(255,255,255,0.04)', padding: '6px', borderRadius: '6px', color: 'var(--text-secondary)', display: 'flex' }}
                      title="Open in Browser"
                    >
                      <Eye size={14} />
                    </a>
                    {file.mimeType === 'application/vnd.google-apps.document' && (
                      <button
                        onClick={() => handleSummarize(file.id, file.name)}
                        style={{
                          background: 'rgba(157, 78, 221, 0.1)',
                          border: '1px solid rgba(157, 78, 221, 0.2)',
                          color: 'var(--accent-purple)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Sparkles size={11} /> Summarize
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(file.id)}
                      style={{ background: 'transparent', padding: '6px', borderRadius: '6px', color: '#f87171' }}
                      title="Delete File"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summarizer Sidebar Panel */}
        {summarizingFileId && (
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '2px solid var(--accent-purple)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', fontFamily: 'var(--font-cyber)', color: 'var(--accent-purple)' }}>
                FILE SUMMARY TELEMETRY
              </h3>
              <button
                onClick={() => setSummarizingFileId(null)}
                style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '11px' }}
              >
                Close
              </button>
            </div>
            
            <div
              style={{
                flexGrow: 1,
                fontSize: '13px',
                lineHeight: '1.6',
                color: 'var(--text-primary)',
                background: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '8px',
                minHeight: '200px',
                overflowY: 'auto',
                border: '1px solid var(--border-glass)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {!fileSummary ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ color: 'var(--accent-purple)' }}>Generating structured digest...</span>
                  <div className="skeleton" style={{ height: '14px', width: '90%' }} />
                  <div className="skeleton" style={{ height: '14px', width: '80%' }} />
                  <div className="skeleton" style={{ height: '14px', width: '85%' }} />
                </div>
              ) : (
                fileSummary
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
export default DriveView;
