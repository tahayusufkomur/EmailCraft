import type { ProfileBlock } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { SliderInput } from './SliderInput';
import { AlignmentPicker } from './AlignmentPicker';
import { SpacingControl } from './SpacingControl';
import { FONT_OPTIONS } from '../../../lib/fonts';
import { ImageUrlPicker } from './ImageUrlPicker';

interface Props {
  block: ProfileBlock;
}

export function ProfileSettings({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const { data, style } = block;

  const updateData = (updates: Partial<ProfileBlock['data']>) => {
    updateBlock(block.id, { data: { ...data, ...updates } } as Partial<ProfileBlock>);
  };
  const updateStyle = (updates: Partial<ProfileBlock['style']>) => {
    updateBlock(block.id, { style: { ...style, ...updates } } as Partial<ProfileBlock>);
  };

  return (
    <div>
      {/* Image */}
      <div className="panel-section">
        <div className="panel-section-title">Image</div>
        <ImageUrlPicker value={data.imageSrc} onChange={(url) => updateData({ imageSrc: url })} label="Image URL" previewRounded />
        <div className="form-group">
          <label>Alt Text</label>
          <input type="text" value={data.imageAlt} onChange={(e) => updateData({ imageAlt: e.target.value })} />
        </div>
        <SliderInput label="Size" value={style.imageSize} min={32} max={200} onChange={(v) => updateStyle({ imageSize: v })} />
        <SliderInput label="Border Radius %" value={style.imageBorderRadius} min={0} max={50} onChange={(v) => updateStyle({ imageBorderRadius: v })} />
        <div className="form-group">
          <label>Position</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['left', 'top', 'right'] as const).map((pos) => (
              <button key={pos} type="button" className={`btn btn-sm ${style.imagePosition === pos ? 'btn-primary' : ''}`} onClick={() => updateStyle({ imagePosition: pos })}>
                {pos.charAt(0).toUpperCase() + pos.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="panel-section">
        <div className="panel-section-title">Content</div>
        <div className="form-group">
          <label>Name</label>
          <input type="text" value={data.name} onChange={(e) => updateData({ name: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Role</label>
          <input type="text" value={data.role} onChange={(e) => updateData({ role: e.target.value })} placeholder="Optional" />
        </div>
        <div className="form-group">
          <label>Bio</label>
          <textarea value={data.bio} onChange={(e) => updateData({ bio: e.target.value })} rows={3} placeholder="Optional" />
        </div>
        <div className="form-group">
          <label>
            <input type="checkbox" checked={data.showBadge} onChange={(e) => updateData({ showBadge: e.target.checked })} />{' '}
            Show Badge
          </label>
        </div>
        {data.showBadge && (
          <>
            <div className="form-group">
              <label>Badge Text</label>
              <input type="text" value={data.badgeText} onChange={(e) => updateData({ badgeText: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Badge Background</label>
              <div className="color-input-row">
                <input type="color" value={style.badgeBackgroundColor || '#eef2ff'} onChange={(e) => updateStyle({ badgeBackgroundColor: e.target.value })} />
                <input type="text" value={style.badgeBackgroundColor || '#eef2ff'} onChange={(e) => updateStyle({ badgeBackgroundColor: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Badge Text Color</label>
              <div className="color-input-row">
                <input type="color" value={style.badgeTextColor || '#4338ca'} onChange={(e) => updateStyle({ badgeTextColor: e.target.value })} />
                <input type="text" value={style.badgeTextColor || '#4338ca'} onChange={(e) => updateStyle({ badgeTextColor: e.target.value })} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Typography */}
      <div className="panel-section">
        <div className="panel-section-title">Typography</div>
        <div className="form-group">
          <label>Name Color</label>
          <div className="color-input-row">
            <input type="color" value={style.nameColor || '#0f172a'} onChange={(e) => updateStyle({ nameColor: e.target.value })} />
            <input type="text" value={style.nameColor || '#0f172a'} onChange={(e) => updateStyle({ nameColor: e.target.value })} />
          </div>
        </div>
        <SliderInput label="Name Size" value={style.nameFontSize} min={12} max={32} onChange={(v) => updateStyle({ nameFontSize: v })} />
        <div className="form-group">
          <label>Name Font</label>
          <select value={style.nameFontFamily} onChange={(e) => updateStyle({ nameFontFamily: e.target.value })}>
            {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <SliderInput label="Name Weight" value={style.nameFontWeight} min={300} max={900} step={100} onChange={(v) => updateStyle({ nameFontWeight: v })} />
        <div className="form-group">
          <label>Role Color</label>
          <div className="color-input-row">
            <input type="color" value={style.roleColor || '#6366f1'} onChange={(e) => updateStyle({ roleColor: e.target.value })} />
            <input type="text" value={style.roleColor || '#6366f1'} onChange={(e) => updateStyle({ roleColor: e.target.value })} />
          </div>
        </div>
        <SliderInput label="Role Size" value={style.roleFontSize} min={10} max={20} onChange={(v) => updateStyle({ roleFontSize: v })} />
        <div className="form-group">
          <label>Bio Color</label>
          <div className="color-input-row">
            <input type="color" value={style.bioColor || '#64748b'} onChange={(e) => updateStyle({ bioColor: e.target.value })} />
            <input type="text" value={style.bioColor || '#64748b'} onChange={(e) => updateStyle({ bioColor: e.target.value })} />
          </div>
        </div>
        <SliderInput label="Bio Size" value={style.bioFontSize} min={10} max={20} onChange={(v) => updateStyle({ bioFontSize: v })} />
        <div className="form-group">
          <label>Bio Font</label>
          <select value={style.bioFontFamily} onChange={(e) => updateStyle({ bioFontFamily: e.target.value })}>
            {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>

      {/* Container */}
      <div className="panel-section">
        <div className="panel-section-title">Container</div>
        <div className="form-group">
          <label>Background</label>
          <div className="color-input-row">
            <input type="color" value={style.backgroundColor || '#ffffff'} onChange={(e) => updateStyle({ backgroundColor: e.target.value })} />
            <input type="text" value={style.backgroundColor || '#ffffff'} onChange={(e) => updateStyle({ backgroundColor: e.target.value })} />
          </div>
        </div>
        <SliderInput label="Border Radius" value={style.borderRadius} min={0} max={32} onChange={(v) => updateStyle({ borderRadius: v })} />
        <SliderInput label="Border Width" value={style.borderWidth} min={0} max={4} onChange={(v) => updateStyle({ borderWidth: v })} />
        {style.borderWidth > 0 && (
          <div className="form-group">
            <label>Border Color</label>
            <div className="color-input-row">
              <input type="color" value={style.borderColor || '#e2e8f0'} onChange={(e) => updateStyle({ borderColor: e.target.value })} />
              <input type="text" value={style.borderColor || '#e2e8f0'} onChange={(e) => updateStyle({ borderColor: e.target.value })} />
            </div>
          </div>
        )}
        <AlignmentPicker value={style.contentAlignment || 'left'} onChange={(v) => updateStyle({ contentAlignment: v })} />
        <SpacingControl value={style.padding || { top: 20, right: 20, bottom: 20, left: 20 }} onChange={(v) => updateStyle({ padding: v })} />
      </div>
    </div>
  );
}
