import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api } from '../../lib/api';
import { exportToHtml } from '../../lib/htmlExporter';
import { useEditorStore } from '../../store/editorStore';
import type { EmailTemplate } from '../../types/blocks';
import type { TemplateListItem } from '../../types/api';

type Tab = 'yours' | 'library';

const CATEGORY_LABELS: Record<string, string> = {
  welcome: 'Welcome',
  newsletter: 'Newsletter',
  promotional: 'Promotional',
  transactional: 'Transactional',
  event: 'Event',
};

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

    return () => { isMounted = false; };
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
    () => activeCategory ? libraryTemplates.filter((t) => t.category === activeCategory) : libraryTemplates,
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

  const handleSelect = useCallback((template: EmailTemplate) => {
    const cloned: EmailTemplate = JSON.parse(JSON.stringify(template));
    const reId = (blocks: EmailTemplate['body']['blocks']): EmailTemplate['body']['blocks'] =>
      blocks.map((b) => ({
        ...b,
        id: crypto.randomUUID(),
        ...(b.type === 'columns' ? {
          data: {
            ...b.data,
            columns: (b.data as { columns: { id: string; blocks: EmailTemplate['body']['blocks'] }[] }).columns.map(
              (col: { id: string; blocks: EmailTemplate['body']['blocks'] }) => ({
                ...col,
                id: crypto.randomUUID(),
                blocks: reId(col.blocks),
              }),
            ),
          },
        } : {}),
      })) as EmailTemplate['body']['blocks'];
    cloned.header.blocks = reId(cloned.header.blocks);
    cloned.body.blocks = reId(cloned.body.blocks);
    cloned.footer.blocks = reId(cloned.footer.blocks);
    loadTemplate(cloned);
    onClose();
  }, [loadTemplate, onClose]);

  const handleSelectSaved = useCallback(async (item: TemplateListItem) => {
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
  }, [handleSelect, onTemplateLoaded]);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Templates</h2>
          <button className="btn" onClick={onClose} style={{ fontSize: 18, lineHeight: 1 }}>&times;</button>
        </div>

        {/* Tabs */}
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

        {/* Error */}
        {loadError && <div style={styles.error}>{loadError}</div>}
        {premiumNotice && <div style={styles.premiumNotice}>{premiumNotice}</div>}

        {/* Content */}
        <div style={styles.content}>
          {isLoading ? (
            <p style={{ margin: 0, color: '#64748b', padding: 20, textAlign: 'center' }}>Loading templates...</p>
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

/* ---- Your Templates Tab ---- */

function YourTemplatesTab({ templates, onSelect }: {
  templates: TemplateListItem[];
  onSelect: (item: TemplateListItem) => void;
}) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tags = useMemo(() => {
    const t = new Set(templates.map((item) => item.category).filter(Boolean));
    return Array.from(t).sort();
  }, [templates]);

  const filtered = useMemo(
    () => activeTag ? templates.filter((t) => t.category === activeTag) : templates,
    [templates, activeTag],
  );

  if (templates.length === 0) {
    return (
      <div style={styles.empty}>
        <span style={{ fontSize: 32 }}>&#x1F4C4;</span>
        <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14 }}>No saved templates yet.</p>
        <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 13 }}>Templates you save will appear here.</p>
      </div>
    );
  }
  return (
    <div>
      {tags.length > 0 && (
        <div style={styles.filters}>
          <button
            style={activeTag === null ? { ...styles.filterChip, ...styles.filterChipActive } : styles.filterChip}
            onClick={() => setActiveTag(null)}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              style={activeTag === tag ? { ...styles.filterChip, ...styles.filterChipActive } : styles.filterChip}
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

/* ---- Library Tab ---- */

function LibraryTab({ groups, categories, activeCategory, onCategoryChange, onSelect }: {
  groups: Record<string, TemplateListItem[]>;
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  onSelect: (item: TemplateListItem) => void;
}) {
  return (
    <div>
      {/* Category Filters */}
      {categories.length > 1 && (
        <div style={styles.filters}>
          <button
            style={activeCategory === null ? { ...styles.filterChip, ...styles.filterChipActive } : styles.filterChip}
            onClick={() => onCategoryChange(null)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              style={activeCategory === cat ? { ...styles.filterChip, ...styles.filterChipActive } : styles.filterChip}
              onClick={() => onCategoryChange(cat)}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      )}

      {/* Grouped templates */}
      {Object.keys(groups).length === 0 ? (
        <div style={styles.empty}>
          <span style={{ fontSize: 32 }}>&#x1F4DA;</span>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14 }}>No library templates available.</p>
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

/* ---- Template Card with Thumbnail Preview ---- */

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
        // Silently fail — show fallback
      }
    })();
    return () => { cancelled = true; };
  }, [item.id]);

  return (
    <div
      style={{
        ...styles.card,
        borderColor: hovered ? '#6366f1' : '#e2e8f0',
        boxShadow: hovered ? '0 2px 8px rgba(99,102,241,0.15)' : 'none',
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
            <span style={{ fontSize: 28, color: '#cbd5e1' }}>&#x2709;</span>
          </div>
        )}
        {item.is_premium && <span style={styles.premiumBadge}>Premium</span>}
        {item.is_locked && <span style={styles.lockedBadge}>Locked</span>}
      </div>
      <div style={styles.cardBody}>
        <div style={styles.cardName}>{item.name}</div>
        <div style={styles.cardCategory}>{CATEGORY_LABELS[item.category] || item.category || 'Template'}</div>
      </div>
    </div>
  );
}

/* ---- Styles ---- */

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#ffffff', borderRadius: 12, width: '92vw', maxWidth: 860,
    maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0,
  },
  tabs: {
    display: 'flex', gap: 0, borderBottom: '1px solid #e2e8f0',
    padding: '0 20px', flexShrink: 0,
  },
  tab: {
    padding: '10px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    background: 'none', border: 'none', borderBottom: '2px solid transparent',
    color: '#64748b', display: 'flex', alignItems: 'center', gap: 6,
    transition: 'all 0.15s',
  },
  tabActive: {
    color: '#0f172a', borderBottomColor: '#6366f1', fontWeight: 600,
  },
  badge: {
    fontSize: 11, fontWeight: 600, background: '#f1f5f9', color: '#64748b',
    borderRadius: 10, padding: '1px 7px',
  },
  error: {
    margin: '12px 20px 0', border: '1px solid #fed7d7', background: '#fff5f5',
    color: '#c53030', borderRadius: 6, padding: '8px 12px', fontSize: 13, flexShrink: 0,
  },
  content: {
    flex: 1, overflow: 'auto', padding: 20,
  },
  filters: {
    display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20,
  },
  filterChip: {
    padding: '5px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20,
    color: '#64748b', transition: 'all 0.15s',
  },
  filterChipActive: {
    background: '#6366f1', borderColor: '#6366f1', color: '#ffffff',
  },
  groupTitle: {
    margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase' as const, letterSpacing: 1,
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14,
  },
  card: {
    border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer',
    transition: 'all 0.15s', overflow: 'hidden', background: '#ffffff',
  },
  thumbnailWrap: {
    height: 180, overflow: 'hidden', background: '#f8fafc', position: 'relative' as const,
    borderBottom: '1px solid #f1f5f9',
  },
  thumbnailIframe: {
    width: 600, height: 800, border: 'none', pointerEvents: 'none' as const,
    transform: 'scale(0.32)', transformOrigin: 'top left',
    position: 'absolute' as const, top: 0, left: 0,
  },
  thumbnailFallback: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  cardBody: {
    padding: '10px 12px',
  },
  cardName: {
    fontWeight: 600, fontSize: 13, color: '#0f172a',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  cardCategory: {
    fontSize: 11, color: '#94a3b8', marginTop: 2,
  },
  empty: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    justifyContent: 'center', padding: '48px 20px', textAlign: 'center' as const,
  },
  premiumBadge: {
    position: 'absolute' as const, top: 8, right: 8,
    background: 'rgba(15, 23, 42, 0.75)', color: '#ffffff',
    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 10,
    letterSpacing: 0.5,
  },
  lockedBadge: {
    position: 'absolute' as const, top: 8, left: 8,
    background: 'rgba(100, 116, 139, 0.85)', color: '#ffffff',
    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 10,
    letterSpacing: 0.5,
  },
  premiumNotice: {
    margin: '12px 20px 0', border: '1px solid #fbbf24', background: '#fffbeb',
    color: '#92400e', borderRadius: 6, padding: '8px 12px', fontSize: 13, flexShrink: 0,
  },
};
