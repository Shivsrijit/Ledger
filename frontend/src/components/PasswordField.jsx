import { useId, useState } from "react";

//Password input with an accessible show/hide toggle (does not using real "visibility" APIs on the value — just switching input type).

export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete = "current-password",
  required = false,
  id: idProp,
  placeholder,
  disabled
}) {
  const genId = useId();
  const id = idProp || genId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "stretch" }}>
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={{ flex: 1, minWidth: 0 }}
        />
        <button
          type="button"
          className="btn btn-ghost"
          style={{ flexShrink: 0, whiteSpace: "nowrap", padding: "0 0.75rem", fontSize: "0.8125rem" }}
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
