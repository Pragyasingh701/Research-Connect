const C = {
  primaryBlue: "#2563EB",
  indigo:      "#4F46E5",
  green:       "#22C55E",
  orange:      "#F59E0B",
  red:         "#EF4444",
  cardBg:      "#FFFFFF",
  textPrimary: "#0F172A",
  textSecond:  "#475569",
  border:      "#E2E8F0",
  lightBlue:   "#DBEAFE",
  lightGreen:  "#DCFCE7",
  lightOrange: "#FEF3C7",
  lightPurple: "#EDE9FE",
};

function Icon({ name, size = 16, color = C.textSecond }) {
  const icons = {
    pubs:     "📄",
    cite:     "💬",
    hindex:   "📈",
    i10:      "🔟",
    exp:      "⏱",
    areas:    "🔍",
    keywords: "🏷",
  };
  return (
    <span style={{ fontSize: size, color, lineHeight: 1 }} aria-hidden>
      {icons[name] ?? "•"}
    </span>
  );
}

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

export default function ResearchMetrics({ metrics }) {
  const cards = [
    { key: "publications", label: "Publications",        value: metrics.publications,      bg: C.lightBlue,   icon: "pubs",     color: C.primaryBlue },
    { key: "citations",    label: "Citations",           value: metrics.citations,         bg: C.lightGreen,  icon: "cite",     color: C.green       },
    { key: "hIndex",       label: "h-index",             value: metrics.hIndex,            bg: C.lightPurple, icon: "hindex",   color: C.indigo      },
    { key: "i10Index",     label: "i10-index",           value: metrics.i10Index,          bg: C.lightOrange, icon: "i10",      color: C.orange      },
    { key: "experience",   label: "Research Experience", value: `${metrics.experience}+`,  bg: C.lightBlue,   icon: "exp",      color: C.primaryBlue },
    { key: "areas",        label: "Research Areas",      value: metrics.areas,             bg: C.lightPurple, icon: "areas",    color: C.indigo      },
    { key: "keywords",     label: "Keywords",            value: metrics.keywords,          bg: "#FEE2E2",     icon: "keywords", color: C.red         },
  ];

  return (
    <Card>
      <SectionTitle>Research Metrics</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {cards.map(c => (
          <div
            key={c.key}
            style={{
              background: c.bg,
              borderRadius: 10,
              padding: "12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: c.color + "22",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon name={c.icon} size={15} color={c.color} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: c.color, lineHeight: 1.2 }}>
                {c.value}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: C.textSecond, lineHeight: 1.3 }}>
                {c.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}