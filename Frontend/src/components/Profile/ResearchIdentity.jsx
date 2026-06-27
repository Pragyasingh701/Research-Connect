import { useState } from "react";

const C = {
  primaryBlue: "#2563EB",
  indigo:      "#4F46E5",
  cardBg:      "#FFFFFF",
  textPrimary: "#0F172A",
  textSecond:  "#475569",
  border:      "#E2E8F0",
  lightBlue:   "#DBEAFE",
  lightPurple: "#EDE9FE",
};

function Card({ children }) {
  return (
    <div style={{
      background: C.cardBg,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: "24px",
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontSize: 16,
      fontWeight: 700,
      color: C.textPrimary,
      marginBottom: 16,
      paddingBottom: 10,
      borderBottom: `1px solid ${C.border}`,
    }}>
      {children}
    </h2>
  );
}

function Chip({ label, color, textColor }) {
  return (
    <span style={{
      background: color,
      color: textColor,
      fontSize: 12,
      fontWeight: 500,
      padding: "3px 10px",
      borderRadius: 20,
      display: "inline-block",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

export default function ResearchIdentity({ bio, researchAreas, keywords }) {
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [showAllKw,    setShowAllKw]    = useState(false);

  const visibleAreas = showAllAreas ? researchAreas : researchAreas.slice(0, 8);
  const visibleKw    = showAllKw    ? keywords       : keywords.slice(0, 8);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* About Me */}
      <Card>
        <SectionTitle>About Me</SectionTitle>
        <p style={{ fontSize: 13, color: C.textSecond, lineHeight: 1.7, margin: 0 }}>{bio}</p>
      </Card>

      {/* Research Areas */}
      <Card>
        <SectionTitle>Research Areas</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {visibleAreas.map(a => (
            <Chip key={a} label={a} color={C.lightPurple} textColor={C.indigo} />
          ))}
        </div>
        <button
          onClick={() => setShowAllAreas(v => !v)}
          style={{ marginTop: 12, background: "none", border: "none", color: C.primaryBlue, fontSize: 13, cursor: "pointer", fontWeight: 600, padding: 0 }}
        >
          {showAllAreas ? "Show less" : `View all (${researchAreas.length})`}
        </button>
      </Card>

      {/* Top Keywords */}
      <Card>
        <SectionTitle>Top Keywords</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {visibleKw.map(k => (
            <Chip key={k} label={k} color={C.lightBlue} textColor={C.primaryBlue} />
          ))}
        </div>
        <button
          onClick={() => setShowAllKw(v => !v)}
          style={{ marginTop: 12, background: "none", border: "none", color: C.primaryBlue, fontSize: 13, cursor: "pointer", fontWeight: 600, padding: 0 }}
        >
          {showAllKw ? "Show less" : `View all (${keywords.length})`}
        </button>
      </Card>
    </div>
  );
}