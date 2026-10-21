import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api } from '../../lib/api';
import { exportToHtml } from '../../lib/htmlExporter';
import { CATEGORY_LABELS, withFreshIds } from '../../lib/templates';
import { useEditorStore } from '../../store/editorStore';
import type { EmailTemplate } from '../../types/blocks';
import type { TemplateListItem } from '../../types/api';

type Tab = 'yours' | 'library';

interface Props {
  onClose: () => void;
  onTemplateLoaded?: (templateId: string | null) => void;
}

export function TemplateGallery({ onClose, onTemplateLoaded }: Props) {
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const [activeTab, setActiveTab] = useState<Tab>('library');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [premiumNotice, setPremiumNotice] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    void (async () => {
      try {
        const list = await api.listTemplates();
        if (!isMounted) return;
        setTemplates(list.results || []);
      } catch (error) {
        if (!isMounted) return;
        setLoadError(error instanceof Error ? error.message : 'Unable to load templates.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const userTemplates = useMemo(
    () => templates.filter((t) => t.template_type !== 'provided'),
    [templates],
  );

  const libraryTemplates = useMemo(
    () => templates.filter((t) => t.template_type === 'provided'),
    [templates],
  );

  const categories = useMemo(() => {
    const cats = new Set(libraryTemplates.map((t) => t.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [libraryTemplates]);

  const filteredLibrary = useMemo(
    () =>
      activeCategory
        ? libraryTemplates.filter((t) => t.category === activeCategory)
        : libraryTemplates,
    [libraryTemplates, activeCategory],
  );

  const groupedLibrary = useMemo(() => {
    const groups: Record<string, TemplateListItem[]> = {};
    for (const t of filteredLibrary) {
      const cat = t.category || 'other';
      (groups[cat] ??= []).push(t);
    }
    return groups;
  }, [filteredLibrary]);

  const handleSelect = useCallback(
    (template: EmailTemplate) => {
      loadTemplate(withFreshIds(template));
      onClose();
    },
    [loadTemplate, onClose],
  );

  const handleSelectSaved = useCallback(
    async (item: TemplateListItem) => {
      if (item.is_locked) {
        setPremiumNotice('Upgrade your plan to use this template');
        setTimeout(() => setPremiumNotice(null), 3000);
        return;
      }
      try {
        const detail = await api.getTemplate(item.id);
        if (!detail.json_data || typeof detail.json_data !== 'object') {
          throw new Error('Template payload is invalid.');
        }
        handleSelect(detail.json_data as EmailTemplate);
        onTemplateLoaded?.(item.id);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Unable to load template.');
      }
    },
    [handleSelect, onTemplateLoaded],
  );

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em' }}>
            Templates
          </h2>
          <button
            className="btn"
            onClick={onClose}
            style={{ fontSize: 18, lineHeight: 1, padding: '4px 10px' }}
          >
            &times;
          </button>
        </div>

        <div style={styles.tabs}>
          <button
            style={activeTab === 'yours' ? { ...styles.tab, ...styles.tabActive } : styles.tab}
            onClick={() => setActiveTab('yours')}
          >
            Your Templates
            {!isLoading && <span style={styles.badge}>{userTemplates.length}</span>}
          </button>
          <button
            style={activeTab === 'library' ? { ...styles.tab, ...styles.tabActive } : styles.tab}
            onClick={() => setActiveTab('library')}
          >
            Library
            {!isLoading && <span style={styles.badge}>{libraryTemplates.length}</span>}
          </button>
        </div>

        {loadError && <div style={styles.error}>{loadError}</div>}
        {premiumNotice && <div style={styles.premiumNotice}>{premiumNotice}</div>}

        <div style={styles.content}>
          {isLoading ? (
            <p
              style={{
                margin: 0,
                color: 'var(--chrome-text-muted)',
                padding: 24,
                textAlign: 'center',
              }}
            >
              Loading templates...
            </p>
          ) : activeTab === 'yours' ? (
            <YourTemplatesTab templates={userTemplates} onSelect={handleSelectSaved} />
          ) : (
            <LibraryTab
              groups={groupedLibrary}
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              onSelect={handleSelectSaved}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function YourTemplatesTab({
  templates,
  onSelect,
}: {
  templates: TemplateListItem[];
  onSelect: (item: TemplateListItem) => void;
}) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tags = useMemo(() => {
    const t = new Set(templates.map((item) => item.category).filter(Boolean));
    return Array.from(t).sort();
  }, [templates]);

  const filtered = useMemo(
    () => (activeTag ? templates.filter((t) => t.category === activeTag) : templates),
    [templates, activeTag],
  );

  if (templates.length === 0) {
    return (
      <div style={styles.empty}>
        <p style={{ margin: '8px 0 0', color: 'var(--chrome-text-primary)', fontSize: 14, fontWeight: 500 }}>
          No saved templates yet.
        </p>
        <p style={{ margin: '4px 0 0', color: 'var(--chrome-text-muted)', fontSize: 13 }}>
          Templates you save will appear here.
        </p>
      </div>
    );
  }
  return (
    <div>
      {tags.length > 0 && (
        <div style={styles.filters}>
          <button
            style={
              activeTag === null
                ? { ...styles.filterChip, ...styles.filterChipActive }
                : styles.filterChip
            }
            onClick={() => setActiveTag(null)}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              style={
                activeTag === tag
                  ? { ...styles.filterChip, ...styles.filterChipActive }
                  : styles.filterChip
              }
              onClick={() => setActiveTag(tag)}
            >
              {CATEGORY_LABELS[tag] || tag}
            </button>
          ))}
        </div>
      )}
      <div style={styles.grid}>
        {filtered.map((item) => (
          <TemplateCard key={item.id} item={item} onSelect={() => onSelect(item)} />
        ))}
      </div>
    </div>
  );
}

function LibraryTab({
  groups,
  categories,
  activeCategory,
  onCategoryChange,
  onSelect,
}: {
  groups: Record<string, TemplateListItem[]>;
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  onSelect: (item: TemplateListItem) => void;
}) {
  return (
    <div>
      {categories.length > 1 && (
        <div style={styles.filters}>
          <button
            style={
              activeCategory === null
                ? { ...styles.filterChip, ...styles.filterChipActive }
                : styles.filterChip
            }
            onClick={() => onCategoryChange(null)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              style={
                activeCategory === cat
                  ? { ...styles.filterChip, ...styles.filterChipActive }
                  : styles.filterChip
              }
              onClick={() => onCategoryChange(cat)}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      )}

      {Object.keys(groups).length === 0 ? (
        <div style={styles.empty}>
          <p style={{ margin: '8px 0 0', color: 'var(--chrome-text-muted)', fontSize: 14 }}>
            No library templates available.
          </p>
        </div>
      ) : (
        Object.entries(groups).map(([category, items]) => (
          <div key={category} style={{ marginBottom: 24 }}>
            <h3 style={styles.groupTitle}>{CATEGORY_LABELS[category] || category}</h3>
            <div style={styles.grid}>
              {items.map((item) => (
                <TemplateCard key={item.id} item={item} onSelect={() => onSelect(item)} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function TemplateCard({ item, onSelect }: { item: TemplateListItem; onSelect: () => void }) {
  const [thumbnailHtml, setThumbnailHtml] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const detail = await api.getTemplate(item.id);
        if (cancelled || !detail.json_data) return;
        const html = exportToHtml(detail.json_data as EmailTemplate);
        setThumbnailHtml(html);
      } catch {
        // Silently fail
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item.id]);

  return (
    <div
      style={{
        ...styles.card,
        borderColor: hovered ? 'var(--accent-color)' : 'var(--chrome-border)',
        opacity: item.is_locked ? 0.55 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      <div style={styles.thumbnailWrap}>
        {thumbnailHtml ? (
          <iframe
            ref={iframeRef}
            srcDoc={thumbnailHtml}
            title={item.name}
            sandbox="allow-same-origin allow-scripts"
            style={styles.thumbnailIframe}
            tabIndex={-1}
          />
        ) : (
          <div style={styles.thumbnailFallback}>
            <span style={{ fontSize: 24, color: 'var(--chrome-text-muted)' }}>&#x2709;</span>
          </div>
        )}
        {item.is_premium && <span style={styles.premiumBadge}>Premium</span>}
        {item.is_locked && <span style={styles.lockedBadge}>Locked</span>}
      </div>
      <div style={styles.cardBody}>
        <div style={styles.cardName}>{item.name}</div>
        <div style={styles.cardCategory}>
          {CATEGORY_LABELS[item.category] || item.category || 'Template'}
        </div>
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
    zIndex: 1000,
  },
  modal: {
    background: 'var(--chrome-surface)',
    color: 'var(--chrome-text-primary)',
    border: '1px solid var(--chrome-border)',
    borderRadius: 16,
    width: '92vw',
    maxWidth: 880,
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-lg)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--chrome-border)',
    flexShrink: 0,
  },
  tabs: {
    display: 'flex',
    gap: 0,
    borderBottom: '1px solid var(--chrome-border)',
    padding: '0 20px',
    flexShrink: 0,
  },
  tab: {
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--chrome-text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.15s',
  },
  tabActive: {
    color: 'var(--chrome-text-primary)',
    borderBottomColor: 'var(--accent-color)',
    fontWeight: 600,
  },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    background: 'var(--chrome-surface-elevated)',
    color: 'var(--chrome-text-muted)',
    border: '1px solid var(--chrome-border)',
    borderRadius: 999,
    padding: '1px 7px',
  },
  error: {
    margin: '12px 20px 0',
    border: '1px solid rgba(220, 38, 38, 0.3)',
    background: 'rgba(220, 38, 38, 0.08)',
    color: '#dc2626',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 20,
  },
  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 20,
  },
  filterChip: {
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
  filterChipActive: {
    background: 'var(--chrome-text-primary)',
    borderColor: 'var(--chrome-text-primary)',
    color: 'var(--chrome-surface)',
  },
  groupTitle: {
    margin: '0 0 12px',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--chrome-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
    gap: 14,
  },
  card: {
    border: '1px solid var(--chrome-border)',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 0.15s',
    overflow: 'hidden',
    background: 'var(--chrome-surface)',
  },
  thumbnailWrap: {
    height: 180,
    overflow: 'hidden',
    background: 'var(--chrome-surface-elevated)',
    position: 'relative' as const,
    borderBottom: '1px solid var(--chrome-border)',
  },
  thumbnailIframe: {
    width: 600,
    height: 800,
    border: 'none',
    pointerEvents: 'none' as const,
    transform: 'scale(0.32)',
    transformOrigin: 'top left',
    position: 'absolute' as const,
    top: 0,
    left: 0,
  },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: '10px 12px',
  },
  cardName: {
    fontWeight: 600,
    fontSize: 13,
    color: 'var(--chrome-text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  cardCategory: {
    fontSize: 11,
    color: 'var(--chrome-text-muted)',
    marginTop: 2,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 20px',
    textAlign: 'center' as const,
  },
  premiumBadge: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    background: '#1a1917',
    color: '#d4a359',
    border: '1px solid rgba(212, 163, 89, 0.4)',
    fontSize: 10,
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: 999,
    letterSpacing: '0.04em',
  },
  lockedBadge: {
    position: 'absolute' as const,
    top: 8,
    left: 8,
    background: 'rgba(26, 25, 23, 0.85)',
    color: '#f4f3f1',
    fontSize: 10,
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: 999,
    letterSpacing: '0.04em',
  },
  premiumNotice: {
    margin: '12px 20px 0',
    border: '1px solid var(--accent-border)',
    background: 'var(--accent-soft)',
    color: 'var(--accent-color)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    flexShrink: 0,
  },
};
