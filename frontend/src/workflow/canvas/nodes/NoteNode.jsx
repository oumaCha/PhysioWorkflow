export default function NoteNode({ data }) {
  return (
    <div style={styles.noteNode}>
      <div style={styles.noteTitle}>{data.title}</div>
      <ul style={styles.noteList}>
        {data.items?.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  noteNode: {
    width: 280,
    padding: 12,
    borderRadius: 14,
    border: "2px solid rgba(200,30,30,0.35)",
    background: "rgba(254,226,226,0.75)",
    boxShadow: "0 10px 26px rgba(0,0,0,0.10)",
  },
  noteTitle: {
    fontWeight: 900,
    marginBottom: 6,
    color: "#991b1b",
  },
  noteList: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 13,
    lineHeight: 1.35,
    color: "#7f1d1d",
  },
};
