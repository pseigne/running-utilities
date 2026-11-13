import { NumberField } from '../../kit/NumberField'

// The target time: hours, minutes and seconds in three big fields side by side, each named by the label
// under it, as in the original.
export function TimeField({ hours, minutes, seconds, onChange, invalid }) {
  const part = (key, label, size, placeholder, inputMode) => (
    <NumberField
      big
      label={label}
      value={{ hours, minutes, seconds }[key]}
      onChange={text => onChange(key, text)}
      size={size}
      placeholder={placeholder}
      inputMode={inputMode}
      invalid={invalid[key]}
    />
  )
  return (
    <div className="timefield" role="group" aria-label="Target time">
      {part('hours', 'Hours', 2, '0', 'numeric')}
      {part('minutes', 'Minutes', 2, '00', 'numeric')}
      {part('seconds', 'Seconds', 5, '00.00', 'decimal')}
    </div>
  )
}
