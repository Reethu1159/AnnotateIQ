import { X } from 'lucide-react';

const Modal = ({ children, title, open, onClose, size = 'md' }) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`modal-panel modal-${size}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close" title="Close">
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
};

export default Modal;
