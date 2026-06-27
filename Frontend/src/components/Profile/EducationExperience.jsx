const C = {
  primaryBlue: "#2563EB",
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

export default function EducationExperience({ education, experience = [] }) {
  const hasExperience = experience.length > 0;

  const TimelineItem = ({ title, subtitle, year, isLast }) => (
    <div style={{ display: "flex", gap: 14, marginBottom: isLast ? 0 : 16 }}>
      {/* Dot + line */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: C.primaryBlue,
          flexShrink: 0,
          marginTop: 4,
        }} />
        {!isLast && (
          <div style={{ width: 2, flex: 1, background: C.border, marginTop: 4 }} />
        )}
      </div>
      {/* Content */}
      <div style={{ paddingBottom: isLast ? 0 : 6 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{title}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textSecond }}>{subtitle}</p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94A3B8" }}>{year}</p>
      </div>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: hasExperience ? "1fr 1fr" : "1fr", gap: 20 }}>
      {/* Education — always shown */}
      <Card>
        <SectionTitle>Education</SectionTitle>
        {education.map((e, i) => (
          <TimelineItem
            key={i}
            title={e.degree}
            subtitle={e.institution}
            year={e.year}
            isLast={i === education.length - 1}
          />
        ))}
      </Card>

      {/* Experience — only shown when data is provided */}
      {hasExperience && (
        <Card>
          <SectionTitle>Experience</SectionTitle>
          {experience.map((e, i) => (
            <TimelineItem
              key={i}
              title={e.role}
              subtitle={e.org}
              year={e.year}
              isLast={i === experience.length - 1}
            />
          ))}
        </Card>
      )}
    </div>
  );
}