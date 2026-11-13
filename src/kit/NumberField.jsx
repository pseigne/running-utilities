import { useId } from 'react'

// A numeric input with a visible label. The value stays a string, so half-typed numbers like "5." or ""
// survive; the tool decides what counts as a number. hideLabel is only for when the same words are
// already visible beside the field, such as the day in a table row.
export function NumberField({
  label, value, onChange, unit, hint, invalid = false, big = false, hideLabel = false,
  placeholder, inputMode = 'decimal', name, size, className = '',
}) {
  const id = useId()
  const hintId = `${id}-hint`
  return (
    <div className={`field${big ? ' big' : ''}${className ? ` ${className}` : ''}`} data-invalid={invalid ? '' : undefined}>
      <label className={hideLabel ? 'vh' : 'field-l'} htmlFor={id}>{label}</label>
      <span className="field-box">
        <input
          id={id}
          name={name}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          spellCheck={false}
          value={value}
          size={size ?? (big ? 3 : undefined)}
          placeholder={placeholder}
          aria-invalid={invalid ? 'true' : undefined}
          aria-describedby={hint ? hintId : undefined}
          onChange={change => onChange(change.target.value)}
        />
        {unit && <span className="field-u" aria-hidden="true">{unit}</span>}
      </span>
      {hint && <span className="field-hint" id={hintId}>{hint}</span>}
    </div>
  )
}
