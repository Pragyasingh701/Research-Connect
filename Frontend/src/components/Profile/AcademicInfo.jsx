const C = {
  primaryBlue: "#2563EB",
  cardBg:      "#FFFFFF",
  textPrimary: "#0F172A",
  textSecond:  "#475569",
  border:      "#E2E8F0",
};

function Icon({ name, size = 16, color = C.textSecond }) {
  const icons = {
    mail:       "✉",
    globe:      "🌐",
    building:   "🏛",
    user:       "👤",
    calendar:   "📅",
    id:         "🪪",
    scholar:    "🎓",
    orcid:      "🔬",
    scopus:     "📊",
    resgate:    "🔗",
    linkedin:   "💼",
    github:     "🐙",
    researcher: "🔭",
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

export default function AcademicInfo({ info }) {
  const leftFields = [
    { icon: "user",     label: "Full Name",    value: info.fullName },
    { icon: "calendar", label: "Date of Birth",value: info.dob },
    { icon: "id",       label: "Nationality",  value: info.nationality },
    { icon: "id",       label: "Designation",  value: info.designation },
    { icon: "building", label: "Department",   value: info.department },
    { icon: "building", label: "Institution",  value: info.institution },
    { icon: "calendar", label: "Joined",       value: info.joined },
    { icon: "mail",     label: "Email",        value: info.email, link: `mailto:${info.email}` },
  ];

  const rightFields = [
    { icon: "orcid",      label: "ORCID ID",        value: info.orcidId },
    { icon: "scholar",    label: "Google Scholar",   value: "View Profile", link: info.scholarUrl },
    { icon: "scopus",     label: "Scopus Author ID", value: info.scopusId },
    { icon: "resgate",    label: "ResearchGate",     value: "View Profile", link: info.researchGateUrl },
    { icon: "linkedin",   label: "LinkedIn",         value: "View Profile", link: info.linkedInUrl },
    { icon: "researcher", label: "ResearcherID",     value: info.researcherId },
    { icon: "globe",      label: "Website",          value: info.website,   link: info.website },
    { icon: "github",     label: "GitHub",           value: info.github,    link: `https://${info.github}` },
  ];

  const InfoRow = ({ icon, label, value, link }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
      <Icon name={icon} size={14} color={C.primaryBlue} />
      <span style={{ minWidth: 110, fontSize: 13, color: C.textSecond, flexShrink: 0 }}>{label}</span>
      {link
        ? <a href={link} style={{ fontSize: 13, color: C.primaryBlue, fontWeight: 500, textDecoration: "none" }}>{value} ↗</a>
        : <span style={{ fontSize: 13, color: C.textPrimary, fontWeight: 500 }}>{value}</span>
      }
    </div>
  );

  return (
    <Card>
      <SectionTitle>Academic & Professional Information</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>{leftFields.map(f => <InfoRow key={f.label} {...f} />)}</div>
        <div>{rightFields.map(f => <InfoRow key={f.label} {...f} />)}</div>
      </div>
    </Card>
  );
}