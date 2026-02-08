import { useEffect, useMemo, useState } from 'react';

import { api } from '../../lib/api';
import { useEditorStore } from '../../store/editorStore';
import type { EmailTemplate } from '../../types/blocks';
import type { TemplateListItem } from '../../types/api';

// Pre-built templates
const GALLERY_TEMPLATES: { name: string; category: string; template: EmailTemplate }[] = [
  {
    name: 'Welcome Email',
    category: 'welcome',
    template: {
      version: 1,
      settings: {
        backgroundColor: '#f0f0f0',
        contentWidth: 600,
        defaultFont: 'Arial, Helvetica, sans-serif',
        defaultFontSize: 14,
        defaultColor: '#333333',
      },
      header: { blocks: [] },
      body: {
        blocks: [
          {
            id: 'g1-1',
            type: 'text',
            data: {
              html: '<h1 style="margin:0;font-size:24px;">Welcome to {{company_name}}!</h1>',
              variables: ['company_name'],
            },
            style: { padding: { top: 30, right: 20, bottom: 10, left: 20 }, alignment: 'center' },
          },
          {
            id: 'g1-2',
            type: 'text',
            data: {
              html: '<p>Hi {{first_name}}, we\'re thrilled to have you on board. Here\'s what you can do next:</p>',
              variables: ['first_name'],
            },
            style: { padding: { top: 10, right: 20, bottom: 10, left: 20 } },
          },
          {
            id: 'g1-3',
            type: 'button',
            data: { text: 'Get Started', url: 'https://' },
            style: {
              padding: { top: 10, right: 20, bottom: 20, left: 20 },
              alignment: 'center',
              backgroundColor: '#007bff',
              color: '#ffffff',
              borderRadius: 4,
              fullWidth: false,
              fontSize: 16,
              fontFamily: 'Arial, Helvetica, sans-serif',
            },
          },
          {
            id: 'g1-4',
            type: 'divider',
            data: {},
            style: {
              padding: { top: 0, right: 0, bottom: 0, left: 0 },
              lineStyle: 'solid',
              lineColor: '#e0e0e0',
              lineThickness: 1,
              spacing: 20,
            },
          },
          {
            id: 'g1-5',
            type: 'social',
            data: {
              platforms: [
                { type: 'facebook', url: 'https://facebook.com/' },
                { type: 'twitter', url: 'https://x.com/' },
                { type: 'instagram', url: 'https://instagram.com/' },
              ],
            },
            style: {
              padding: { top: 10, right: 20, bottom: 20, left: 20 },
              alignment: 'center',
              iconSize: 24,
              iconStyle: 'colored',
              layout: 'horizontal',
              spacing: 10,
            },
          },
        ],
      },
      footer: { blocks: [] },
    },
  },
  {
    name: 'Newsletter',
    category: 'newsletter',
    template: {
      version: 1,
      settings: {
        backgroundColor: '#f4f4f4',
        contentWidth: 600,
        defaultFont: 'Georgia, "Times New Roman", Times, serif',
        defaultFontSize: 15,
        defaultColor: '#222222',
      },
      header: { blocks: [] },
      body: {
        blocks: [
          {
            id: 'g2-1',
            type: 'text',
            data: {
              html: '<h1 style="margin:0;font-size:28px;text-align:center;">Weekly Newsletter</h1><p style="text-align:center;color:#666;">Your weekly dose of insights</p>',
              variables: [],
            },
            style: { padding: { top: 30, right: 20, bottom: 20, left: 20 }, alignment: 'center' },
          },
          {
            id: 'g2-2',
            type: 'divider',
            data: {},
            style: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, lineStyle: 'solid', lineColor: '#dddddd', lineThickness: 1, spacing: 10 },
          },
          {
            id: 'g2-3',
            type: 'text',
            data: {
              html: '<h2 style="margin:0 0 8px 0;font-size:20px;">Featured Article</h2><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>',
              variables: [],
            },
            style: { padding: { top: 20, right: 20, bottom: 10, left: 20 } },
          },
          {
            id: 'g2-4',
            type: 'button',
            data: { text: 'Read More', url: 'https://' },
            style: {
              padding: { top: 10, right: 20, bottom: 20, left: 20 },
              alignment: 'left',
              backgroundColor: '#222222',
              color: '#ffffff',
              borderRadius: 0,
              fullWidth: false,
              fontSize: 14,
              fontFamily: 'Georgia, "Times New Roman", Times, serif',
            },
          },
        ],
      },
      footer: { blocks: [] },
    },
  },
  {
    name: 'Promotional',
    category: 'promotional',
    template: {
      version: 1,
      settings: {
        backgroundColor: '#ffffff',
        contentWidth: 600,
        defaultFont: 'Arial, Helvetica, sans-serif',
        defaultFontSize: 14,
        defaultColor: '#333333',
      },
      header: { blocks: [] },
      body: {
        blocks: [
          {
            id: 'g3-1',
            type: 'text',
            data: {
              html: '<h1 style="margin:0;font-size:32px;color:#e53e3e;text-align:center;">SALE 50% OFF</h1><p style="text-align:center;font-size:16px;">Limited time offer — don\'t miss out!</p>',
              variables: [],
            },
            style: { padding: { top: 40, right: 20, bottom: 20, left: 20 }, alignment: 'center', backgroundColor: '#fff5f5' },
          },
          {
            id: 'g3-2',
            type: 'button',
            data: { text: 'Shop Now', url: 'https://' },
            style: {
              padding: { top: 10, right: 20, bottom: 30, left: 20 },
              alignment: 'center',
              backgroundColor: '#e53e3e',
              color: '#ffffff',
              borderRadius: 50,
              fullWidth: false,
              fontSize: 18,
              fontFamily: 'Arial, Helvetica, sans-serif',
            },
          },
        ],
      },
      footer: { blocks: [] },
    },
  },
];

interface Props {
  onClose: () => void;
}

export function TemplateGallery({ onClose }: Props) {
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadTemplates = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const list = await api.listTemplates();
        if (!isMounted) return;
        setTemplates(list.results || []);
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'Unable to load templates.';
        setLoadError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadTemplates();
    return () => {
      isMounted = false;
    };
  }, []);

  const userTemplates = useMemo(
    () => templates.filter((item) => item.template_type !== 'provided'),
    [templates],
  );
  const providedTemplates = useMemo(
    () => templates.filter((item) => item.template_type === 'provided'),
    [templates],
  );

  const handleSelect = (template: EmailTemplate) => {
    // Deep clone to avoid reference sharing
    const cloned = JSON.parse(JSON.stringify(template));
    // Generate new IDs
    const reId = (blocks: EmailTemplate['body']['blocks']): EmailTemplate['body']['blocks'] =>
      blocks.map((b) => ({
        ...b,
        id: crypto.randomUUID(),
        ...(b.type === 'columns' ? {
          data: {
            ...b.data,
            columns: (b.data as { columns: { id: string; blocks: EmailTemplate['body']['blocks'] }[] }).columns.map((col: { id: string; blocks: EmailTemplate['body']['blocks'] }) => ({
              ...col,
              id: crypto.randomUUID(),
              blocks: reId(col.blocks),
            })),
          },
        } : {}),
      })) as EmailTemplate['body']['blocks'];
    cloned.header.blocks = reId(cloned.header.blocks);
    cloned.body.blocks = reId(cloned.body.blocks);
    cloned.footer.blocks = reId(cloned.footer.blocks);

    loadTemplate(cloned);
    onClose();
  };

  const handleSelectSavedTemplate = async (item: TemplateListItem) => {
    try {
      const detail = await api.getTemplate(item.id);
      if (!detail.json_data || typeof detail.json_data !== 'object') {
        throw new Error('Template payload is invalid.');
      }
      handleSelect(detail.json_data as EmailTemplate);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load template.';
      setLoadError(message);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white', borderRadius: 8, width: '90vw', maxWidth: 700,
          maxHeight: '80vh', overflow: 'auto', padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Templates</h2>
          <button className="btn" onClick={onClose}>&times;</button>
        </div>
        {loadError && (
          <div
            style={{
              marginBottom: 12,
              border: '1px solid #fed7d7',
              background: '#fff5f5',
              color: '#c53030',
              borderRadius: 6,
              padding: '10px 12px',
              fontSize: 13,
            }}
          >
            {loadError}
          </div>
        )}
        {isLoading ? (
          <p style={{ margin: 0, color: '#4a5568' }}>Loading templates...</p>
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            <section>
              <h3 style={{ margin: '0 0 10px 0', fontSize: 14 }}>Your templates</h3>
              {userTemplates.length === 0 ? (
                <p style={{ margin: 0, color: '#718096', fontSize: 13 }}>
                  No user-owned templates yet.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                  {userTemplates.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: '1px solid #e2e8f0', borderRadius: 8, padding: 16,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#3182ce'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; }}
                      onClick={() => void handleSelectSavedTemplate(item)}
                    >
                      <div style={{
                        height: 100, background: '#f7fafc', borderRadius: 4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 12, fontSize: 32, color: '#a0aec0',
                      }}>
                        &#x1F4C4;
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>
                        {item.category || 'custom'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 style={{ margin: '0 0 10px 0', fontSize: 14 }}>Provided templates</h3>
              {providedTemplates.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                  {providedTemplates.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: '1px solid #e2e8f0', borderRadius: 8, padding: 16,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#3182ce'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; }}
                      onClick={() => void handleSelectSavedTemplate(item)}
                    >
                      <div style={{
                        height: 100, background: '#f7fafc', borderRadius: 4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 12, fontSize: 32, color: '#a0aec0',
                      }}>
                        &#x2709;
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>
                        {item.category || 'provided'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                  {GALLERY_TEMPLATES.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        border: '1px solid #e2e8f0', borderRadius: 8, padding: 16,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#3182ce'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; }}
                      onClick={() => handleSelect(item.template)}
                    >
                      <div style={{
                        height: 100, background: '#f7fafc', borderRadius: 4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 12, fontSize: 32, color: '#a0aec0',
                      }}>
                        &#x2709;
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>{item.category}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
        {templates.length > 0 && (
          <div style={{ marginTop: 14, color: '#718096', fontSize: 12 }}>
            Provided templates are shared across all organizations and are read-only.
          </div>
        )}
      </div>
    </div>
  );
}
