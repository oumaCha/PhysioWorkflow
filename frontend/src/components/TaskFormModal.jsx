import { useMemo, useState } from "react";
import "../styles/TaskFormModal.css";

function normalizeFields(task) {
    const schema = task?.formSchema || task?.form || task?.data?.formSchema || null;
    const fields = schema?.fields;
    return Array.isArray(fields) ? fields : [];
}

function defaultValueForField(f) {
    const type = String(f?.type || "text").toLowerCase();
    if (type === "boolean") return false;
    if (type === "number") return "";
    if (type === "select") return (f?.options && f.options[0]) ?? "";
    return "";
}

export default function TaskFormModal({ open, task, loading, error, onClose, onSubmit, prefillValues }) {
    const fields = useMemo(() => normalizeFields(task), [task]);

    const title = task?.name || task?.title || "Task";
    const schemaTitle = task?.formSchema?.title || task?.form?.title || task?.data?.formSchema?.title || "";

    const modalKey = task?.id || "empty";

    const initialValues = useMemo(() => {
        const init = {};
        for (const f of fields) init[f.key] = defaultValueForField(f);

        // Prefill values from parent (e.g. sessionNumber)
        if (prefillValues && typeof prefillValues === "object") {
            for (const [k, v] of Object.entries(prefillValues)) {
                if (v !== undefined && v !== null) init[k] = v;
            }
        }
        return init;
    }, [fields, prefillValues]);

    if (!open) return null;

    return (
        <div className="task-modal-overlay" onMouseDown={onClose}>
            <div className="task-modal" onMouseDown={(e) => e.stopPropagation()}>
                <div className="task-modal-header">
                    <div>
                        <div className="task-modal-title">{title}</div>
                        {schemaTitle && <div className="task-modal-subtitle">{schemaTitle}</div>}
                    </div>
                    <button className="task-modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="task-modal-body">
                    {loading && <div style={{ opacity: 0.7 }}>Loading…</div>}
                    {error && <div className="task-error">{error}</div>}

                    {!loading && !error && (
                        <ModalFormBody
                            key={modalKey}
                            fields={fields}
                            initialValues={initialValues}
                            onSubmit={onSubmit}
                            onClose={onClose}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

function ModalFormBody({ fields, initialValues, onSubmit, onClose }) {
    const [values, setValues] = useState(initialValues);

    const canSubmit = useMemo(() => {
        if (!fields.length) return true;
        return fields.every((f) => {
            if (!f.required) return true;
            const v = values[f.key];
            const t = String(f.type || "text").toLowerCase();
            if (t === "boolean") return v === true;
            return v !== null && v !== undefined && String(v).trim() !== "";
        });
    }, [fields, values]);

    return (
        <>
            {fields.length > 0 && (
                <div style={{ display: "grid", gap: 12 }}>
                    {fields.map((f) => (
                        <FieldRow
                            key={f.key}
                            field={f}
                            value={values[f.key]}
                            onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
                        />
                    ))}
                </div>
            )}

            <div className="task-modal-footer">
                <button className="task-btn-secondary" onClick={onClose}>Cancel</button>
                <button
                    className="task-btn-primary"
                    disabled={!canSubmit}
                    style={{ opacity: canSubmit ? 1 : 0.55 }}
                    onClick={() => onSubmit(values)}
                >
                    Complete & Continue
                </button>
            </div>
        </>
    );
}

function FieldRow({ field, value, onChange }) {
    const type = String(field?.type || "text").toLowerCase();
    const label = field?.label || field?.key;
    const required = field?.required === true;
    const readOnly = field?.readOnly === true || field?.key === "sessionNumber";

    return (
        <div className="task-field-row">
            <div className="task-field-label">
                {label} {required && <span style={{ color: "#b91c1c" }}>*</span>}
            </div>

            {type === "text" && (
                <input className="task-input" disabled={readOnly} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
            )}

            {type === "number" && (
                <input
                    className="task-input"
                    type="number"
                    disabled={readOnly}
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
                />
            )}

            {type === "boolean" && (
                <label className="task-switch-row">
                    <input type="checkbox" disabled={readOnly} checked={value === true} onChange={(e) => onChange(e.target.checked)} />
                    <span>{value === true ? "Yes" : "No"}</span>
                </label>
            )}

            {type === "select" && (
                <select className="task-input" disabled={readOnly} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
                    {(field?.options || []).map((opt) => (
                        <option key={String(opt)} value={String(opt)}>
                            {String(opt)}
                        </option>
                    ))}
                </select>
            )}

            {!["text", "number", "boolean", "select"].includes(type) && (
                <input className="task-input" disabled={readOnly} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
            )}
        </div>
    );
}
