export default function BadgeNode({ data }) {
  return (
    <div style={styles.badgeNode}>
      <div style={styles.badgeText}>{data.text}</div>
    </div>
  );
}

const styles = {
  badgeNode: {
    width: 260,
    padding: "10px 12px",
    borderRadius: 14,
    background: "#b91c1c",
    color: "white",
    boxShadow: "0 14px 40px rgba(0,0,0,0.12)",
    border: "1px solid rgba(255,255,255,0.35)",
  },
  badgeText: {
    fontWeight: 800,
    fontSize: 13,
  },
};
