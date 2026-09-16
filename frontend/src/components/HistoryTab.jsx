import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchHistory, restoreApplication } from '../api.js';

const EVENT_LABELS = {
  added: 'Added',
  deleted: 'Deleted',
  undo: 'Restored (undo)',
};

function RowMenu({ onRestore }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="row-menu" ref={ref}>
      <button className="row-menu-trigger" onClick={() => setOpen((o) => !o)} aria-label="Row actions">
        ⋮
      </button>
      {open && (
        <div className="row-menu-dropdown">
          <button
            className="row-menu-item"
            onClick={() => {
              setOpen(false);
              onRestore();
            }}
          >
            Bring it back
          </button>
        </div>
      )}
    </div>
  );
}

export default function HistoryTab({ active, profileId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState('desc');

  function refresh() {
    setLoading(true);
    fetchHistory()
      .then(setHistory)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!active) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, profileId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = history;
    if (q) {
      rows = rows.filter((entry) =>
        [entry.company, entry.job_title, EVENT_LABELS[entry.event_type] || entry.event_type]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(q))
      );
    }
    const sorted = [...rows].sort((a, b) => {
      if (a.timestamp < b.timestamp) return sortDir === 'asc' ? -1 : 1;
      if (a.timestamp > b.timestamp) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [history, search, sortDir]);

  async function handleRestore(entry) {
    await restoreApplication(entry.application_id);
    refresh();
  }

  return (
    <div className="tab-panel">
      <h2>History</h2>
      <p className="modal-subtext">A full audit trail of every application added, deleted, or restored.</p>

      <div className="table-toolbar">
        <input
          type="search"
          placeholder="Search company, title, event…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <span className="row-count">{filtered.length} of {history.length}</span>
      </div>

      <div className="table-wrapper history-table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="sortable" onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}>
                Timestamp{sortDir === 'asc' ? ' ▲' : ' ▼'}
              </th>
              <th>Event</th>
              <th>Company</th>
              <th>Job Title</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id}>
                <td>{new Date(entry.timestamp).toLocaleString()}</td>
                <td>
                  <span className={`event-badge event-${entry.event_type}`}>
                    {EVENT_LABELS[entry.event_type] || entry.event_type}
                  </span>
                </td>
                <td>{entry.company}</td>
                <td>{entry.job_title}</td>
                <td className="row-menu-cell">
                  {entry.event_type === 'deleted' && entry.currently_deleted && (
                    <RowMenu onRestore={() => handleRestore(entry)} />
                  )}
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  {history.length === 0 ? 'No history yet.' : 'No entries match your search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
