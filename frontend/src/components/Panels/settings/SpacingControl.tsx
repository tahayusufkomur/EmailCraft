import type { Spacing } from '../../../types/blocks';

interface Props {
  value: Spacing;
  onChange: (value: Spacing) => void;
}

export function SpacingControl({ value, onChange }: Props) {
  const update = (side: keyof Spacing, val: number) => {
    onChange({ ...value, [side]: val });
  };

  return (
    <div className="spacing-control">
      <div>
        <label style={{ fontSize: 11 }}>Top</label>
        <input type="number" min={0} max={100} value={value.top} onChange={(e) => update('top', Number(e.target.value))} />
      </div>
      <div>
        <label style={{ fontSize: 11 }}>Right</label>
        <input type="number" min={0} max={100} value={value.right} onChange={(e) => update('right', Number(e.target.value))} />
      </div>
      <div>
        <label style={{ fontSize: 11 }}>Bottom</label>
        <input type="number" min={0} max={100} value={value.bottom} onChange={(e) => update('bottom', Number(e.target.value))} />
      </div>
      <div>
        <label style={{ fontSize: 11 }}>Left</label>
        <input type="number" min={0} max={100} value={value.left} onChange={(e) => update('left', Number(e.target.value))} />
      </div>
    </div>
  );
}
