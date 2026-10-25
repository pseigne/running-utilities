// The two kinds of button: a filled pill for the screen's action (ink on the page, paper on the hero),
// and an underlined text button for the quieter one.
export function Button({ children, onClick, quiet = false, disabled = false, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      className={`${quiet ? 'more' : 'btn'} press${className ? ` ${className}` : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
