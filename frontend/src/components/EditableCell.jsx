import { useEffect, useRef, useState } from 'react';

export default function EditableCell({ value, onSave, multiline = false, placeholder = '—', type = 'text' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const ref = useRef(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      if (ref.current.select) ref.current.select();
    }
  }, [editing]);

  function startEdit() {
    setDraft(value || '');
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    if ((draft || '') !== (value || '')) onSave(draft);
  }

  function cancel() {
    setDraft(value || '');
    setEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    } else if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      commit();
    }
  }

  if (editing) {
    if (multiline) {
      return (
        <td className="editing-cell">
          <textarea
            ref={ref}
            className="cell-edit-input"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
          />
        </td>
      );
    }
    return (
      <td className="editing-cell">
        <input
          ref={ref}
          type={type}
          className="cell-edit-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
      </td>
    );
  }

  return (
    <td className="expandable-cell clickable" onClick={startEdit} title="Click to edit">
      {value || <span className="cell-placeholder">{placeholder}</span>}
    </td>
  );
}
