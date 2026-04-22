import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function AppToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    ({ type = "info", title = "Information", message = "" }) => {
      const id = uid();
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => remove(id), 4200);
    },
    [remove]
  );

  const value = useMemo(
    () => ({
      pushInfo: (message, title = "Information") => push({ type: "info", title, message }),
      pushSuccess: (message, title = "Succès") => push({ type: "success", title, message }),
      pushError: (message, title = "Erreur") => push({ type: "danger", title, message }),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
        {toasts.map((t) => (
          <div key={t.id} className={`toast show sehily-toast border-${t.type}`}>
            <div className="toast-header">
              <strong className="me-auto">{t.title}</strong>
              <button className="btn-close" onClick={() => remove(t.id)} />
            </div>
            <div className="toast-body">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useAppToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useAppToast doit être utilisé dans AppToastProvider.");
  }
  return ctx;
}

