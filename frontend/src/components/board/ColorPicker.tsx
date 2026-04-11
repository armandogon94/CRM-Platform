const GROUP_COLORS = [
  '#579BFC', '#FF5AC4', '#FF642E', '#FDAB3D',
  '#00C875', '#9CD326', '#CAB641', '#784BD1',
  '#66CCFF', '#BB3354', '#E2445C', '#A25DDC',
];

interface ColorPickerProps {
  selectedColor: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ selectedColor, onChange }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-1.5 p-2" data-testid="color-picker">
      {GROUP_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
          style={{
            backgroundColor: color,
            borderColor: selectedColor === color ? '#1f2937' : 'transparent',
          }}
          title={color}
          data-testid={`color-${color}`}
        />
      ))}
    </div>
  );
}
