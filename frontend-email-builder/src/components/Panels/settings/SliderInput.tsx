interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function SliderInput({ label, value, min, max, step = 1, unit = 'px', onChange }: Props) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="slider-input">
      <div className="slider-input-header">
        <label>{label}</label>
        <div className="slider-input-value">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          {unit && <span className="slider-input-unit">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-input-range"
        style={{ '--slider-pct': `${pct}%` } as React.CSSProperties}
      />
    </div>
  );
}
