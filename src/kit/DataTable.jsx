import { FinishLine } from './FinishLine'

// A heat-sheet table. Columns say how they read:
//   key, label     the row field and its column head
//   align: 'r'     right-aligned (figures)
//   kind           'em' (names: condensed and bold), 'n' (marks: tabular, larger), 'q' (quiet)
//   phone          where the cell goes when rows become a grid on phones: 'lead' (left column), 'main',
//                  'sub' (under main), 'end' (right), 'endsub' (under end) or 'hide'
//   render(row)    the cell's contents, when the field alone isn't enough
// A row with a `line` ({ label, value, off }) draws the line across the table at that point.
export function DataTable({ caption, captionHidden = true, columns, rows, className = '' }) {
  return (
    <table className={`dt${className ? ` ${className}` : ''}`}>
      {caption && <caption className={captionHidden ? 'vh' : 'dt-cap'}>{caption}</caption>}
      <thead>
        <tr>
          {columns.map(column => (
            <th key={column.key} scope="col" className={column.align === 'r' ? 'r' : undefined}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (row.line ? (
          <tr key={row.key} className="line">
            <td colSpan={columns.length}><FinishLine {...row.line} /></td>
          </tr>
        ) : (
          <tr key={row.key} data-row="" className={row.className}>
            {columns.map(column => (
              <td key={column.key} className={cellClass(column)} data-phone={column.phone}>
                {column.render ? column.render(row) : row[column.key]}
              </td>
            ))}
          </tr>
        )))}
      </tbody>
    </table>
  )
}

function cellClass(column) {
  return [column.kind, column.align === 'r' && 'r'].filter(Boolean).join(' ') || undefined
}
