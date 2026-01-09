export default function Header({ title, subtitle, right }) {
  return (
    <header style={styles.header}>
      <div>
        <div style={styles.title}>{title}</div>
        {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
      </div>

      {right && <div style={styles.right}>{right}</div>}
    </header>
  );
}

const styles = {
  header: {
    borderRadius: 18,
    padding: 16,
    color: "white",
    background: "linear-gradient(90deg,#0f766e,#0284c7)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 20,
    fontWeight: 900,
    lineHeight: 1.2,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    opacity: 0.9,
  },
  right: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
};
