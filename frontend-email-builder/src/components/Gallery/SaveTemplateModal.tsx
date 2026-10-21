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
  title?: string;
  onSave: (name: string, category: string) => void;
  onClose: () => void;
  isSaving: boolean;
}

export function SaveTemplateModal({ title = 'Save Template', onSave, onClose, isSaving }: Props) {
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
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em' }}>
          {title}
        </h3>
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
            <button type="button" className="btn" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!name.trim() || isSaving}
            >
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
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 14, 13, 0.55)',
    backdropFilter: 'blur(2px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
  },
  modal: {
    background: 'var(--chrome-surface)',
    color: 'var(--chrome-text-primary)',
    border: '1px solid var(--chrome-border)',
    borderRadius: 16,
    padding: 24,
    width: '90vw',
    maxWidth: 420,
    boxShadow: 'var(--shadow-lg)',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--chrome-text-muted)',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    fontSize: 14,
    background: 'var(--chrome-input-bg)',
    color: 'var(--chrome-input-text)',
    border: '1px solid var(--chrome-border)',
    borderRadius: 8,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  tag: {
    padding: '5px 14px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    background: 'var(--chrome-surface-elevated)',
    border: '1px solid var(--chrome-border)',
    borderRadius: 999,
    color: 'var(--chrome-text-muted)',
    transition: 'all 0.15s',
  },
  tagActive: {
    background: 'var(--chrome-text-primary)',
    borderColor: 'var(--chrome-text-primary)',
    color: 'var(--chrome-surface)',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 20,
  },
};
