import Modal from './Modal.jsx';

export default function ApplyPopup({ onAnswer, onClose }) {
  return (
    <Modal onClose={onClose}>
      <h3>Have you applied to this job yet?</h3>
      <p className="modal-subtext">This sets the Applied status and starting result for this entry.</p>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={() => onAnswer(false)}>
          No, not yet
        </button>
        <button className="btn btn-primary" onClick={() => onAnswer(true)}>
          Yes, I applied
        </button>
      </div>
    </Modal>
  );
}
