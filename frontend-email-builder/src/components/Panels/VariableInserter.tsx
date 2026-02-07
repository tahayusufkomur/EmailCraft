import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { useConfigStore } from '../../store/configStore';

interface Props {
  onInsert: (variable: string) => void;
}

export function VariableInserter({ onInsert }: Props) {
  const variables = useConfigStore((s) => s.variables);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  if (variables.length === 0) return null;

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
      >
        {'{{ }}'} Variables
      </Button>
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, background: 'white',
          border: '1px solid #e2e8f0', borderRadius: 4, boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 100, minWidth: 200, marginTop: 4,
        }}>
          {variables.map((v) => (
            <div
              key={v.key}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                borderBottom: '1px solid #f0f0f0',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f7fafc'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
              onClick={() => {
                onInsert(`{{${v.key}}}`);
                setIsOpen(false);
              }}
            >
              <div style={{ fontWeight: 500 }}>{v.label}</div>
              <div style={{ fontSize: 11, color: '#718096', display: 'flex', justifyContent: 'space-between' }}>
                <span>{`{{${v.key}}}`}</span>
                {v.defaultValue && (
                  <span style={{ fontStyle: 'italic' }}>default: {v.defaultValue}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
