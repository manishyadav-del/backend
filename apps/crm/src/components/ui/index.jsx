export function Button({ children, variant = 'primary', ...props }) {
  return (
    <button className={`btn-${variant}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ label, ...props }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <input {...props} />
    </div>
  );
}

export function Card({ children }) {
  return <div className="card">{children}</div>;
}

export function Badge({ children, type = 'draft' }) {
  return <span className={`badge ${type}`}>{children}</span>;
}

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content card">
        <div className="header-actions">
          <h3>{title}</h3>
          <button onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}
