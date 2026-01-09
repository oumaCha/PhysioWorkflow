export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div>
        <strong>PhysioFlow</strong> — Master Thesis Prototype
      </div>
      <div style={styles.meta}>
        © {new Date().getFullYear()} • Workflow Modeling & Execution Systems
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    marginTop: 18,
    padding: "12px 16px",
    borderRadius: 16,
    background: "white",
    border: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    fontSize: 14,
  },
  meta: {
    opacity: 0.7,
  },
};
