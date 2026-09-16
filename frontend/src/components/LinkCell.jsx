import { useEffect, useRef, useState } from 'react';

export default function LinkCell({ jobLink, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(jobLink || '');
  const ref = useRef(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  function startEdit() {
    setDraft(jobLink || '');
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    if ((draft || '') !== (jobLink || '')) onSave(draft);
  }

  function cancel() {
    setDraft(jobLink || '');
    setEditing(false);
  }

  if (editing) {
    return (
      <td className="editing-cell">
        <input
          ref={ref}
          type="url"
          className="cell-edit-input"
          placeholder="https://…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            } else if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
          }}
        />
      </td>
    );
  }

  return (
    <td>
      <div className="link-cell">
        {jobLink ? (
          <a href={jobLink} target="_blank" rel="noreferrer" title={jobLink} aria-label="Open job posting">
            Open ↗
          </a>
        ) : (
          <span className="cell-placeholder">—</span>
        )}
        <button className="cell-edit-btn" onClick={startEdit} aria-label="Edit link" title="Edit link">
          ✎
        </button>
      </div>
    </td>
  );
}
