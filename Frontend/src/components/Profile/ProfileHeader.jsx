import { useState } from "react";

const C = {
  primaryBlue: "#2563EB",
  indigo:      "#4F46E5",
  cardBg:      "#FFFFFF",
  textPrimary: "#0F172A",
  textSecond:  "#475569",
  border:      "#E2E8F0",
  lightBlue:   "#DBEAFE",
};

function Icon({ name, size = 16, color = C.textSecond }) {
  const icons = { building: "🏛", location: "📍" };
  return <span style={{ fontSize: size, color, lineHeight: 1 }} aria-hidden>{icons[name] ?? "•"}</span>;
}

function Card({ children, style }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, ...style }}>
      {children}
    </div>
  );
}

function ProfileTabs() {
  const [active, setActive] = useState("About");
  const tabs = ["About", "Education", "Experience", "Research Interests", "Publications", "Projects", "Achievements"];
  return (
    <div style={{ borderTop: `1px solid ${C.border}`, display: "flex", overflowX: "auto", padding: "0 24px" }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          style={{
            background: "none",
            border: "none",
            borderBottom: active === tab ? `2px solid ${C.primaryBlue}` : "2px solid transparent",
            color: active === tab ? C.primaryBlue : C.textSecond,
            fontWeight: active === tab ? 600 : 400,
            fontSize: 13,
            padding: "12px 14px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "all .15s",
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export default function ProfileHeader({ profile }) {
  const socials = [
    { key: "orcid",    label: "ORCID",         bg: "#A6CE39", color: "#fff" },
    { key: "scholar",  label: "Google Scholar", bg: C.lightBlue, color: C.primaryBlue },
    { key: "scopus",   label: "Scopus",         bg: "#EF9A30", color: "#fff" },
    { key: "resgate",  label: "ResearchGate",   bg: "#00CCBB", color: "#fff" },
    { key: "linkedin", label: "LinkedIn",       bg: "#0A66C2", color: "#fff" },
  ];

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      {/* Cover Photo */}
      <div style={{
        height: 160,
        background: `linear-gradient(135deg, ${C.primaryBlue} 0%, ${C.indigo} 100%)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }} />

      {/* Avatar + Actions */}
      <div style={{ padding: "0 24px 20px", position: "relative" }}>
        {/* Avatar */}
        <div style={{
          position: "absolute", top: -52, left: 24,
          width: 104, height: 104, borderRadius: "50%",
          border: `4px solid ${C.cardBg}`, overflow: "hidden",
          background: C.lightBlue, display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 36, color: C.primaryBlue, fontWeight: 700,
        }}>
          {profile.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
          <div style={{
            position: "absolute", bottom: 0, width: "100%",
            background: "rgba(0,0,0,0.45)", textAlign: "center",
            fontSize: 14, cursor: "pointer", padding: "4px 0",
          }}>📷</div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 12 }}>
          <button style={{
            background: `linear-gradient(135deg, ${C.primaryBlue}, ${C.indigo})`,
            color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>✏ Edit Profile</button>
          <button style={{
            background: C.cardBg, color: C.textPrimary,
            border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>↗ Share Profile</button>
        </div>

        {/* Name + Verified */}
        <div style={{ marginTop: 44, display: "flex", alignItems: "center", gap: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: 0 }}>
            {profile.name}
          </h1>
          <span style={{
            background: C.primaryBlue, color: "#fff", borderRadius: "50%",
            width: 20, height: 20, display: "inline-flex",
            alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
          }}>✓</span>
        </div>

        {/* Title */}
        <p style={{ color: C.primaryBlue, fontWeight: 600, fontSize: 14, margin: "2px 0 10px" }}>
          {profile.title}
        </p>

        {/* Department / Institution / Location */}
        {[
          { icon: "building", text: profile.department },
          { icon: "building", text: profile.institution },
          { icon: "location", text: profile.location },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.textSecond, marginBottom: 2 }}>
            <Icon name={icon} size={13} />
            {text}
          </div>
        ))}

        {/* Social Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {socials.map(s => (
            <a key={s.key} href="#" style={{
              background: s.bg, color: s.color, borderRadius: 20,
              padding: "4px 12px", fontSize: 12, fontWeight: 600,
              textDecoration: "none",
              border: s.bg === C.lightBlue ? `1px solid ${C.border}` : "none",
            }}>{s.label}</a>
          ))}
        </div>
      </div>

      <ProfileTabs />
    </Card>
  );
}