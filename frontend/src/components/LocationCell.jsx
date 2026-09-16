import { useEffect, useRef, useState } from 'react';
import { WORK_MODES } from '../constants.js';

export default function LocationCell({ location, workMode, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draftLocation, setDraftLocation] = useState(location || '');
  const [draftWorkMode, setDraftWorkMode] = useState(workMode || '');
  const ref = useRef(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  function startEdit() {
    setDraftLocation(location || '');
    setDraftWorkMode(workMode || '');
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    if (draftLocation !== (location || '') || draftWorkMode !== (workMode || '')) {
      onSave({ location: draftLocation, work_mode: draftWorkMode });
    }
  }

  function cancel() {
    setDraftLocation(location || '');
    setDraftWorkMode(workMode || '');
    setEditing(false);
  }

  if (editing) {
    return (
      <td className="editing-cell">
        <div
          className="location-edit-group"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) commit();
          }}
        >
          <input
            ref={ref}
            type="text"
            className="cell-edit-input"
            placeholder="Location"
            value={draftLocation}
            onChange={(e) => setDraftLocation(e.target.value)}
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
          <select
            className="cell-edit-input"
            value={draftWorkMode}
            onChange={(e) => {
              const newWorkMode = e.target.value;
              setDraftWorkMode(newWorkMode);
              setEditing(false);
              if (draftLocation !== (location || '') || newWorkMode !== (workMode || '')) {
                onSave({ location: draftLocation, work_mode: newWorkMode });
              }
            }}
          >
            <option value="">No work mode</option>
            {WORK_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>
      </td>
    );
  }

  return (
    <td className="expandable-cell clickable" onClick={startEdit} title="Click to edit">
      {location || <span className="cell-placeholder">—</span>}
      {workMode && <span className="badge">{workMode}</span>}
    </td>
  );
}
