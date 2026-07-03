'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Trash2, Plus, RefreshCw, Sparkles, Filter } from 'lucide-react';

export const MemoryView = () => {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Category filter
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Memory creation state
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/memories');
      const data = await res.json();
      if (data.success) {
        setMemories(data.memories || []);
      }
    } catch (e) {
      console.error('Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    try {
      const tagArray = tags ? tags.split(',').map(t => t.trim()) : [];
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          category,
          tags: tagArray,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setContent('');
        setTags('');
        setCategory('GENERAL');
        fetchMemories(); // Refresh list
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want the assistant to forget this information?')) return;
    try {
      const res = await fetch(`/api/memories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (e) {
      alert('Delete failed');
    }
  };

  const filteredMemories = filterCategory === 'ALL'
    ? memories
    : memories.filter(m => m.category === filterCategory);

  const categoriesList = ['ALL', 'PEOPLE', 'PROJECT', 'DEADLINE', 'PREFERENCE', 'GENERAL'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Brain size={24} style={{ color: 'var(--accent-cyan)' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-cyber)' }}>LONG-TERM MEMORY</h2>
        </div>
        <button
          onClick={fetchMemories}
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
          Sync Memory
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px' }}>
        
        {/* Create Memory Panel */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1.5px', fontFamily: 'var(--font-cyber)', color: 'var(--accent-cyan)' }}>
            COMMIT TO MEMORY
          </h3>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Memory Detail</label>
              <textarea
                placeholder='e.g., "Rahul is the chief product designer at Vercel. His email is rahul@vercel.com."'
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                style={{ width: '100%', resize: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="GENERAL">General Facts</option>
                <option value="PEOPLE">People & Contacts</option>
                <option value="PROJECT">Projects & Tasks</option>
                <option value="DEADLINE">Deadlines & Milestones</option>
                <option value="PREFERENCE">User Preferences</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. rahul, vercel, design"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: 'var(--primary-glow)',
                border: '1px solid var(--primary)',
                padding: '10px',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Plus size={16} />
              {saving ? 'Registering...' : 'Remember This'}
            </button>
          </form>
        </div>

        {/* Memories Explorer */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>MEMORIES FEED</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={12} style={{ color: 'var(--text-muted)' }} />
              <div style={{ display: 'flex', gap: '4px' }}>
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    style={{
                      background: filterCategory === cat ? 'rgba(0,210,255,0.08)' : 'transparent',
                      border: filterCategory === cat ? '1px solid rgba(0,210,255,0.15)' : '1px solid transparent',
                      color: filterCategory === cat ? 'var(--primary)' : 'var(--text-muted)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 600,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
            {loading ? (
              <div className="skeleton" style={{ height: '100px', width: '100%' }} />
            ) : filteredMemories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No registered memories found. Commit details on the left.
              </div>
            ) : (
              filteredMemories.map((mem) => (
                <div
                  key={mem.id}
                  style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-glass)',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '85%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          background: 'rgba(0, 245, 212, 0.08)',
                          border: '1px solid rgba(0, 245, 212, 0.15)',
                          color: 'var(--accent-cyan)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {mem.category}
                      </span>
                      {mem.tags && mem.tags.split(',').map((tag: string) => (
                        <span key={tag} style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                      {mem.content}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(mem.id)}
                    style={{ background: 'transparent', padding: '4px', color: '#f87171' }}
                    title="Delete Memory"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
export default MemoryView;
