import { useEditorStore } from '../../store/editorStore';
import { TextSettings } from './settings/TextSettings';
import { ImageSettings } from './settings/ImageSettings';
import { ButtonSettings } from './settings/ButtonSettings';
import { DividerSettings } from './settings/DividerSettings';
import { ColumnsSettings } from './settings/ColumnsSettings';
import { SocialSettings } from './settings/SocialSettings';
import { HeadingSettings } from './settings/HeadingSettings';
import { SpacerSettings } from './settings/SpacerSettings';
import { HtmlSettings } from './settings/HtmlSettings';
import { HeroSettings } from './settings/HeroSettings';

export function StylePanel() {
  const selectedBlock = useEditorStore((s) => s.getSelectedBlock());

  return (
    <div className="style-panel">
      {selectedBlock ? (
        <>
          <div className="panel-header">
            {selectedBlock.type.charAt(0).toUpperCase() + selectedBlock.type.slice(1)} Settings
          </div>
          {selectedBlock.type === 'text' && <TextSettings block={selectedBlock} />}
          {selectedBlock.type === 'image' && <ImageSettings block={selectedBlock} />}
          {selectedBlock.type === 'button' && <ButtonSettings block={selectedBlock} />}
          {selectedBlock.type === 'divider' && <DividerSettings block={selectedBlock} />}
          {selectedBlock.type === 'columns' && <ColumnsSettings block={selectedBlock} />}
          {selectedBlock.type === 'social' && <SocialSettings block={selectedBlock} />}
          {selectedBlock.type === 'heading' && <HeadingSettings block={selectedBlock} />}
          {selectedBlock.type === 'spacer' && <SpacerSettings block={selectedBlock} />}
          {selectedBlock.type === 'html' && <HtmlSettings block={selectedBlock} />}
          {selectedBlock.type === 'hero' && <HeroSettings block={selectedBlock} />}
        </>
      ) : (
        <div className="style-panel-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
            <path d="M15 15h.01" /><path d="M11 19l-7-7 8.5-8.5a2.12 2.12 0 0 1 3 3L7 15" />
            <path d="m18 13 3.36-3.36a2.12 2.12 0 0 0-3-3L15 10" />
          </svg>
          <span>Select an element to edit its style</span>
        </div>
      )}
    </div>
  );
}
