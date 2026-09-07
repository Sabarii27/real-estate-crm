import React from 'react';
import Loading from './Loading';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

/**
 * Generic data table.
 * columns: [{ key, header, render?: (row) => node, className? }]
 */
const Table = ({ columns, rows, loading, error, onRetry, emptyTitle = 'No records found', emptyDescription }) => {
  if (loading) return <Loading label="Loading..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!rows || rows.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row._id || row.id || idx}>
              {columns.map((col) => (
                <td key={col.key} className={col.className}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
