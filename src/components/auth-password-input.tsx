"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";

type AuthPasswordInputProps = { id: string; value: string; onChange: (value: string) => void; autoComplete: string };

export function AuthPasswordInput({ id, value, onChange, autoComplete }: AuthPasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return <div className="auth-field"><LockKeyhole className="auth-field__icon" aria-hidden="true" /><input id={id} type={visible ? "text" : "password"} required minLength={8} placeholder="Senha" value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} /><button type="button" className="auth-password-toggle" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"}>{visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></div>;
}
