interface Props {
  value: 'left' | 'center' | 'right';
  onChange: (value: 'left' | 'center' | 'right') => void;
}

export function AlignmentPicker({ value, onChange }: Props) {
  return (
    <div className="alignment-picker">
      <button className={value === 'left' ? 'active' : ''} onClick={() => onChange('left')}>
        Left
      </button>
      <button className={value === 'center' ? 'active' : ''} onClick={() => onChange('center')}>
        Center
      </button>
      <button className={value === 'right' ? 'active' : ''} onClick={() => onChange('right')}>
        Right
      </button>
    </div>
  );
}
