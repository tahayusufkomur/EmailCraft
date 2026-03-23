import { useState } from 'react';

const CATEGORIES = [
  { value: '', label: 'No tag' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'transactional', label: 'Transactional' },
  { value: 'event', label: 'Event' },
];

interface Props {
  onSave: (name: string, category: string) => void;
  onClose: () => void;
  isSaving: boolean;
}

export function SaveTemplateModal({ onSave, onClose, isSaving }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, category);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Save Template</h3>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Name</label>
            <input
              style={styles.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My email template"
              autoFocus
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Tag</label>
            <div style={styles.tags}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  style={category === cat.value ? { ...styles.tag, ...styles.tagActive } : styles.tag}
                  onClick={() => setCategory(cat.value)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" style={styles.saveBtn} disabled={!name.trim() || isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
  },
  modal: {
    background: '#fff', borderRadius: 12, padding: 24,
    width: '90vw', maxWidth: 420, boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6,
  },
  input: {
    width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #e2e8f0',
    borderRadius: 8, outline: 'none', boxSizing: 'border-box' as const,
  },
  tags: {
    display: 'flex', flexWrap: 'wrap' as const, gap: 6,
  },
  tag: {
    padding: '5px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20,
    color: '#64748b', transition: 'all 0.15s',
  },
  tagActive: {
    background: '#6366f1', borderColor: '#6366f1', color: '#ffffff',
  },
  actions: {
    display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20,
  },
  cancelBtn: {
    padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, color: '#64748b',
  },
  saveBtn: {
    padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    background: '#6366f1', border: 'none', borderRadius: 8, color: '#ffffff',
  },
};
