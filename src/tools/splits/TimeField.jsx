import { NumberField } from '../../kit/NumberField'

// The goal time as the hero's number: hours, minutes and seconds in three big fields that read as one
// mark. Each has its own label, so it's clear which part goes where.
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
    <div className="timefield" role="group" aria-label="Goal time">
      {part('hours', 'Hours', 1, '0', 'numeric')}
      <span className="colon" aria-hidden="true">:</span>
      {part('minutes', 'Minutes', 2, '00', 'numeric')}
      <span className="colon" aria-hidden="true">:</span>
      {part('seconds', 'Seconds', 5, '00.00', 'decimal')}
    </div>
  )
}
