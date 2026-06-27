const C = {
  primaryBlue: "#2563EB",
  cardBg:      "#FFFFFF",
  textPrimary: "#0F172A",
  textSecond:  "#475569",
  border:      "#E2E8F0",
};

function Icon({ name, size = 16, color = C.textSecond }) {
  const icons = { mail: "✉", phone: "📞", globe: "🌐", location: "📍" };
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

export default function ContactInfo({ contact }) {
  return (
    <Card>
      <SectionTitle>Contact Information</SectionTitle>
      {[
        { icon: "mail",     text: contact.email,    link: `mailto:${contact.email}` },
        { icon: "phone",    text: contact.phone },
        { icon: "globe",    text: contact.website,  link: contact.website },
        { icon: "location", text: contact.location },
      ].map(({ icon, text, link }) => (
        <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Icon name={icon} size={14} color={C.primaryBlue} />
          {link
            ? <a href={link} style={{ fontSize: 13, color: C.primaryBlue, textDecoration: "none" }}>{text}</a>
            : <span style={{ fontSize: 13, color: C.textSecond }}>{text}</span>
          }
        </div>
      ))}
    </Card>
  );
}