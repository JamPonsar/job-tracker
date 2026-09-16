import { useState } from 'react';
import { createApplication } from '../api.js';
import { WORK_MODES, EMPTY_FORM } from '../constants.js';
import ApplyPopup from './ApplyPopup.jsx';

function extractJsonObject(raw) {
  const trimmed = raw.trim();
  // Tolerate a ```json ... ``` fence in case it wasn't stripped before pasting.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced ? fenced[1] : trimmed;
}

export default function AddApplicationTab({ onAdded }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState(null);
  const [showApplyPopup, setShowApplyPopup] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedMessage, setSavedMessage] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleLoadJson() {
    setJsonError(null);
    if (!jsonText.trim()) {
      setJsonError('Paste the JSON output first.');
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(extractJsonObject(jsonText));
    } catch {
      setJsonError("That doesn't look like valid JSON — check for missing quotes, commas, or an extra ``` fence.");
      return;
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      setJsonError('Expected a single JSON object with the job fields, not an array or a plain value.');
      return;
    }

    const workMode = WORK_MODES.includes(parsed.work_mode) ? parsed.work_mode : '';

    setForm((f) => ({
      ...f,
      company: parsed.company ?? f.company,
      job_title: parsed.job_title ?? f.job_title,
      location: parsed.location ?? f.location,
      work_mode: workMode || f.work_mode,
      salary_range: parsed.salary_range ?? f.salary_range,
      job_link: parsed.job_link ?? f.job_link,
      notes: parsed.notes ?? f.notes,
    }));
  }

  function handleClearAll() {
    setForm(EMPTY_FORM);
    setJsonText('');
    setJsonError(null);
    setSaveError(null);
    setSavedMessage(null);
  }

  function handleAddToList() {
    setSaveError(null);
    if (!form.company.trim() || !form.job_title.trim()) {
      setSaveError('Company name and job title are required.');
      return;
    }
    setShowApplyPopup(true);
  }

  async function handleApplyAnswer(applied) {
    setShowApplyPopup(false);
    try {
      await createApplication({ ...form, applied });
      setForm(EMPTY_FORM);
      setJsonText('');
      setSavedMessage('Added to your applications list.');
      onAdded?.();
    } catch (err) {
      setSaveError(err.message || 'Failed to save this application.');
    }
  }

  return (
    <div className="tab-panel">
      <h2>Add Application</h2>

      <label className="field">
        <span>Paste Structured JSON</span>
        <textarea
          rows={6}
          placeholder='Paste the JSON object produced by your Claude prompt, e.g. {"company": "...", "job_title": "...", ...}'
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
        />
      </label>
      <div className="form-actions form-actions-left">
        <button className="btn btn-primary" onClick={handleLoadJson}>
          Load JSON
        </button>
      </div>
      {jsonError && <p className="error-text">{jsonError}</p>}

      <div className="field-row">
        <label className="field">
          <span>Date Applied</span>
          <input type="date" value={form.date_applied} onChange={(e) => update('date_applied', e.target.value)} />
        </label>
        <label className="field">
          <span>Company Name</span>
          <input type="text" value={form.company} onChange={(e) => update('company', e.target.value)} />
        </label>
        <label className="field">
          <span>Job Title</span>
          <input type="text" value={form.job_title} onChange={(e) => update('job_title', e.target.value)} />
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span>Location</span>
          <input
            type="text"
            placeholder="e.g. Austin, TX"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
          />
        </label>
        <label className="field">
          <span>Work Mode</span>
          <select value={form.work_mode} onChange={(e) => update('work_mode', e.target.value)}>
            <option value="">Select…</option>
            {WORK_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Salary Range</span>
          <input
            type="text"
            placeholder="e.g. $90k-$110k"
            value={form.salary_range}
            onChange={(e) => update('salary_range', e.target.value)}
          />
        </label>
      </div>

      <label className="field">
        <span>Job Link</span>
        <input
          type="url"
          placeholder="https://company.com/careers/job-id"
          value={form.job_link}
          onChange={(e) => update('job_link', e.target.value)}
        />
      </label>

      <label className="field">
        <span>Notes</span>
        <textarea rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
      </label>

      {saveError && <p className="error-text">{saveError}</p>}
      {savedMessage && <p className="success-text">{savedMessage}</p>}

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={handleClearAll}>
          Clear All
        </button>
        <button className="btn btn-primary" onClick={handleAddToList}>
          Add to List
        </button>
      </div>

      {showApplyPopup && (
        <ApplyPopup onAnswer={handleApplyAnswer} onClose={() => setShowApplyPopup(false)} />
      )}
    </div>
  );
}
