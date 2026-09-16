import { useEffect } from 'react';

export default function Toast({ message, actionLabel, onAction, onDismiss, duration = 6000 }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  return (
    <div className="toast">
      <span>{message}</span>
      {actionLabel && (
        <button className="toast-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
