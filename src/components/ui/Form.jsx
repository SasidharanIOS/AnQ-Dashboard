import React from "react";

export function Field({ label, children }) {
  return <label className="form-field"><span>{label}</span>{children}</label>;
}

export function TextInput({ label, value, onChange, type = "text", placeholder, required }) {
  return <Field label={label}><input required={required} type={type} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></Field>;
}

export function SelectInput({ label, value, onChange, options = [] }) {
  return <Field label={label}><select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>{options.map((x) => <option key={x.value ?? x} value={x.value ?? x}>{x.label ?? x}</option>)}</select></Field>;
}

export function TextArea({ label, value, onChange, placeholder }) {
  return <Field label={label}><textarea rows={4} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></Field>;
}

export function FormGrid({ children }) { return <div className="form-grid">{children}</div>; }
