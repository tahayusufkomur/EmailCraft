import { useEditorStore } from '../../store/editorStore';
import { GlobalSettings } from './GlobalSettings';
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
      <div className="panel-header">
        {selectedBlock ? `${selectedBlock.type.charAt(0).toUpperCase() + selectedBlock.type.slice(1)} Settings` : 'Template Settings'}
      </div>
      {!selectedBlock ? (
        <GlobalSettings />
      ) : (
        <>
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
      )}
    </div>
  );
}
