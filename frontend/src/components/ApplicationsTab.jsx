import { useMemo, useState } from 'react';
import { deleteApplication, restoreApplication, updateApplication } from '../api.js';
import { RESULT_OPTIONS } from '../constants.js';
import Toast from './Toast.jsx';
import Modal from './Modal.jsx';
import EditableCell from './EditableCell.jsx';
import LocationCell from './LocationCell.jsx';
import LinkCell from './LinkCell.jsx';

const SALARY_NUMBER = /[\d,.]+/g;

function salarySortValue(range) {
  if (!range) return -Infinity;
  const numbers = (range.match(SALARY_NUMBER) || []).map((n) => Number(n.replace(/,/g, '')));
  if (numbers.length === 0) return -Infinity;
  return Math.max(...numbers);
}

export default function ApplicationsTab({ applications, onRefresh }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('date_applied');
  const [sortDir, setSortDir] = useState('desc');
  const [toast, setToast] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = applications;
    if (q) {
      rows = rows.filter((app) =>
        [app.company, app.job_title, app.location, app.notes, app.result]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(q))
      );
    }

    const sorted = [...rows].sort((a, b) => {
      let av;
      let bv;
      if (sortKey === 'salary_range') {
        av = salarySortValue(a.salary_range);
        bv = salarySortValue(b.salary_range);
      } else if (sortKey === 'result') {
        av = (a.result || '').toLowerCase();
        bv = (b.result || '').toLowerCase();
      } else {
        av = a.date_applied || '';
        bv = b.date_applied || '';
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [applications, search, sortKey, sortDir]);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  async function handleFieldChange(app, patch) {
    await updateApplication(app.id, patch);
    onRefresh();
  }

  function handleDeleteClick(app) {
    setConfirmTarget(app);
  }

  async function handleConfirmDelete() {
    const app = confirmTarget;
    setConfirmTarget(null);
    if (!app) return;
    await deleteApplication(app.id);
    onRefresh();
    setToast({ id: app.id, message: `Deleted ${app.company} — ${app.job_title}` });
  }

  async function handleUndo() {
    if (!toast) return;
    await restoreApplication(toast.id);
    setToast(null);
    onRefresh();
  }

  function sortIndicator(key) {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  }

  return (
    <div className="tab-panel">
      <h2>Applications</h2>

      <div className="table-toolbar">
        <input
          type="search"
          placeholder="Search company, title, notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <span className="row-count">{filtered.length} of {applications.length}</span>
      </div>

      <div className="table-wrapper">
        <table className="applications-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('date_applied')}>
                Date Applied{sortIndicator('date_applied')}
              </th>
              <th>Company</th>
              <th>Job Title</th>
              <th>Location</th>
              <th className="sortable" onClick={() => handleSort('salary_range')}>
                Salary{sortIndicator('salary_range')}
              </th>
              <th>Link</th>
              <th>Applied</th>
              <th className="sortable" onClick={() => handleSort('result')}>
                Result{sortIndicator('result')}
              </th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((app) => (
              <tr key={app.id}>
                <td>
                  <input
                    type="date"
                    className="cell-date-input"
                    value={app.date_applied || ''}
                    onChange={(e) => handleFieldChange(app, { date_applied: e.target.value })}
                  />
                </td>
                <EditableCell
                  value={app.company}
                  onSave={(v) => handleFieldChange(app, { company: v })}
                />
                <EditableCell
                  value={app.job_title}
                  onSave={(v) => handleFieldChange(app, { job_title: v })}
                />
                <LocationCell
                  location={app.location}
                  workMode={app.work_mode}
                  onSave={(patch) => handleFieldChange(app, patch)}
                />
                <EditableCell
                  value={app.salary_range}
                  placeholder="Add salary"
                  onSave={(v) => handleFieldChange(app, { salary_range: v })}
                />
                <LinkCell jobLink={app.job_link} onSave={(v) => handleFieldChange(app, { job_link: v })} />
                <td>
                  <button
                    className={`applied-toggle ${app.applied ? 'applied-yes' : 'applied-no'}`}
                    onClick={() => handleFieldChange(app, { applied: !app.applied })}
                    title="Click to toggle"
                  >
                    {app.applied ? 'Yes' : 'No'}
                  </button>
                </td>
                <td>
                  <select
                    value={app.result || ''}
                    onChange={(e) => handleFieldChange(app, { result: e.target.value })}
                  >
                    {RESULT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </td>
                <EditableCell
                  value={app.notes}
                  multiline
                  placeholder="Add notes"
                  onSave={(v) => handleFieldChange(app, { notes: v })}
                />
                <td>
                  <button className="btn btn-danger-text" onClick={() => handleDeleteClick(app)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="empty-state">
                  {applications.length === 0 ? 'No applications yet — add one on the Add Application tab.' : 'No rows match your search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          actionLabel="Undo"
          onAction={handleUndo}
          onDismiss={() => setToast(null)}
        />
      )}

      {confirmTarget && (
        <Modal onClose={() => setConfirmTarget(null)}>
          <h3>Delete this application?</h3>
          <p className="modal-subtext">
            {confirmTarget.company} — {confirmTarget.job_title}. You can undo this right after deleting.
          </p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setConfirmTarget(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleConfirmDelete}>
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
