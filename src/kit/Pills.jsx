// A pill group of links, one of them the current page: switching views that each have their own URL.
export function PillLinks({ label, items, current, className = '' }) {
  return (
    <nav className={className || undefined} aria-label={label}>
      <span className="pills">
        {items.map(item => (
          <a key={item.key} className="press" href={item.href} aria-current={item.key === current ? 'page' : undefined}>
            {item.label}
          </a>
        ))}
      </span>
    </nav>
  )
}

// A pill group of radios: one choice in a form, with the keyboard behaviour radios already have. The
// fieldset groups and names them; the trough inside it is styled like PillLinks'.
export function PillChoice({ legend, name, options, value, onChange, className = '' }) {
  return (
    <fieldset className="pillset">
      <legend className="vh">{legend}</legend>
      <div className={`pills${className ? ` ${className}` : ''}`}>
        {options.map(option => (
          <label key={option.value} className="press">
            <input
              className="vh"
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
