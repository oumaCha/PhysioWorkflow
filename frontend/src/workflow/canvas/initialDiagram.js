import { MarkerType } from "@xyflow/react";

const thickRed = {
  stroke: "#c81e1e",
  strokeWidth: 5,
};

export const initialNodes = [
  // Lanes / phases (locked background)
  {
    id: "lane-1",
    type: "lane",
    position: { x: 40, y: 60 },
    data: { label: "Intake & Planning" },
    draggable: false,
    selectable: false,
    style: { width: 1060, height: 170 },
  },
  {
    id: "lane-2",
    type: "lane",
    position: { x: 40, y: 260 },
    data: { label: "Treatment Phase (1–9 months)" },
    draggable: false,
    selectable: false,
    style: { width: 1060, height: 210 },
  },
  {
    id: "lane-3",
    type: "lane",
    position: { x: 40, y: 500 },
    data: { label: "Outcome / Discharge" },
    draggable: false,
    selectable: false,
    style: { width: 1060, height: 200 },
  },

  // Main stages
  {
    id: "referral",
    type: "stage",
    position: { x: 70, y: 110 },
    data: { title: "Referral", subtitle: "GP / medical specialist" },
  },
  {
    id: "consult1",
    type: "stage",
    position: { x: 320, y: 110 },
    data: { title: "1st consult", bullets: ["Goal setting", "Treatment plan"] },
  },
  {
    id: "treatment",
    type: "stage",
    position: { x: 600, y: 300 },
    data: {
      title: "Treatment",
      subtitle: "1–9 months",
      bullets: [
        "Individual exercises prescribed",
        "Group physio-fitness (optional)",
        "Fall prevention training (optional)",
      ],
    },
  },
  {
    id: "consultLast",
    type: "stage",
    position: { x: 900, y: 110 },
    data: { title: "Last consult" },
  },

  // Note
  {
    id: "exitNote",
    type: "note",
    position: { x: 740, y: 40 },
    data: {
      title: "Exit criteria",
      items: [
        "Patient not motivated",
        "Treatment not reimbursed",
        "Patient has too much pain",
      ],
    },
  },

  // Outcomes
  { id: "outcomeA", type: "badge", position: { x: 760, y: 560 }, data: { text: "A: goals reached" } },
  { id: "outcomeB", type: "badge", position: { x: 760, y: 610 }, data: { text: "B: goals not reached, recovery possible" } },
  { id: "outcomeC", type: "badge", position: { x: 760, y: 660 }, data: { text: "C: goals not reached, recovery not possible" } },

  // Optional modules
  { id: "moduleInfo", type: "badge", position: { x: 260, y: 560 }, data: { text: "Information module (client)" } },
  { id: "moduleExercise", type: "badge", position: { x: 520, y: 560 }, data: { text: "Exercise module (home)" } },
  { id: "moduleSensors", type: "badge", position: { x: 520, y: 610 }, data: { text: "Sensors (optional)" } },
];

export const initialEdges = [
  {
    id: "e1",
    source: "referral",
    target: "consult1",
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#c81e1e" },
    style: thickRed,
  },
  {
    id: "e2",
    source: "consult1",
    target: "treatment",
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#c81e1e" },
    style: thickRed,
  },
  {
    id: "e3",
    source: "treatment",
    target: "consultLast",
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#c81e1e" },
    style: thickRed,
  },

  // Dotted connections to modules
  {
    id: "e4",
    source: "consult1",
    target: "moduleInfo",
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#111827" },
    style: { stroke: "#111827", strokeWidth: 2, strokeDasharray: "6 6" },
  },
  {
    id: "e5",
    source: "treatment",
    target: "moduleExercise",
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#111827" },
    style: { stroke: "#111827", strokeWidth: 2, strokeDasharray: "6 6" },
  },
];
