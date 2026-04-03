export default function Footer() {
  return (
      <footer
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 16,
            border: "1px solid rgba(15,23,42,0.10)",
            background: "rgba(255,255,255,0.85)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            opacity: 0.75,
          }}
      >
        <div>Physio Workflow — Master Thesis Prototype</div>
        <div>© 2026 • Workflow Modeling & Execution Systems</div>
      </footer>
  );
}

