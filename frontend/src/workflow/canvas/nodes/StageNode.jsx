export default function StageNode({ data }) {
  return (
    <div style={styles.stageNode}>
      <div style={styles.stageTitle}>{data.title}</div>
      {data.subtitle && <div style={styles.stageSubtitle}>{data.subtitle}</div>}
      {data.bullets?.length ? (
        <ol style={styles.bullets}>
          {data.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

const styles = {
  stageNode: {
    width: 230,
    padding: 14,
    borderRadius: 16,
    border: "3px solid #c81e1e",
    background: "white",
    boxShadow: "0 14px 40px rgba(0,0,0,0.10)",
  },
  stageTitle: {
    fontWeight: 900,
    fontSize: 16,
    marginBottom: 4,
  },
  stageSubtitle: {
    fontSize: 13,
    opacity: 0.75,
    marginBottom: 10,
  },
  bullets: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 13,
    lineHeight: 1.35,
    opacity: 0.9,
  },
};
