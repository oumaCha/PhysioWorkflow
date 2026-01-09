export default function LaneNode({ data }) {
  return (
    <div style={styles.laneNode}>
      <div style={styles.laneLabel}>{data.label}</div>
    </div>
  );
}

const styles = {
  laneNode: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    border: "2px solid rgba(17,24,39,0.12)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.85), rgba(248,250,252,0.85))",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
    position: "relative",
  },
  laneLabel: {
    position: "absolute",
    left: 16,
    top: 12,
    fontWeight: 900,
    fontSize: 14,
    color: "#111827",
    opacity: 0.7,
    letterSpacing: 0.3,
  },
};
