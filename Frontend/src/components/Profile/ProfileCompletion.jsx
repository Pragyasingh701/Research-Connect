const C = {
  green:       "#22C55E",
  cardBg:      "#FFFFFF",
  textPrimary: "#0F172A",
  textSecond:  "#475569",
  border:      "#E2E8F0",
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

export default function ProfileCompletion({ percent, items }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const filled = circ - (circ * percent) / 100;

  return (
    <Card>
      <SectionTitle>Profile Completeness</SectionTitle>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <svg width={96} height={96} viewBox="0 0 96 96" style={{ flexShrink: 0 }}>
          <circle cx={48} cy={48} r={r} fill="none" stroke={C.border} strokeWidth={7} />
          <circle
            cx={48} cy={48} r={r}
            fill="none"
            stroke={`url(#grad-${percent})`}
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={filled}
            transform="rotate(-90 48 48)"
          />
          <defs>
            <linearGradient id={`grad-${percent}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor={C.green} />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          <text x={48} y={52} textAnchor="middle" fontSize={16} fontWeight={700} fill={C.textPrimary}>
            {percent}%
          </text>
        </svg>
        <p style={{ fontSize: 13, color: C.textSecond, margin: 0 }}>
          Excellent! Your profile is almost complete.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 18, height: 18, borderRadius: "50%",
              background: item.done ? C.green : C.border,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, color: "#fff", fontWeight: 700, flexShrink: 0,
            }}>
              {item.done ? "✓" : ""}
            </span>
            <span style={{ fontSize: 13, color: item.done ? C.textPrimary : C.textSecond }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}