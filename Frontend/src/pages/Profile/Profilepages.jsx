import { useState } from "react";
import ProfileHeader from "../../components/Profile/ProfileHeader";
import ContactInfo from "../../components/Profile/ContactInfo";
import AcademicInfo from "../../components/Profile/AcademicInfo";
import EducationExperience from "../../components/Profile/EducationExperience";
import ResearchIdentity from "../../components/Profile/ResearchIdentity";
import ResearchMetrics from "../../components/Profile/ResearchMetrics";
import ProfileCompletion from "../../components/Profile/ProfileCompletion";

// ─────────────────────────────────────────────────
// COLOR TOKENS
// ─────────────────────────────────────────────────
const C = {
  primaryBlue: "#2563EB",
  blueHover:   "#1D4ED8",
  indigo:      "#4F46E5",
  green:       "#22C55E",
  orange:      "#F59E0B",
  red:         "#EF4444",
  pageBg:      "#F8FAFC",
  cardBg:      "#FFFFFF",
  textPrimary: "#0F172A",
  textSecond:  "#475569",
  border:      "#E2E8F0",
  lightBlue:   "#DBEAFE",
  lightGreen:  "#DCFCE7",
  lightOrange: "#FEF3C7",
  lightPurple: "#EDE9FE",
};

// ─────────────────────────────────────────────────
// SAMPLE DATA  ← moved above the component
// ─────────────────────────────────────────────────
const SAMPLE = {
  profile: {
    name:        "Dr. Arjun Sharma",
    title:       "Associate Professor",
    department:  "Department of Computer Science & Engineering",
    institution: "Indian Institute of Technology, Delhi",
    location:    "New Delhi, India",
    avatar:      null,
  },
  contact: {
    email:    "arjun.sharma@iitd.ac.in",
    phone:    "+91 98765 43210",
    website:  "https://arjunsharma.in",
    location: "New Delhi, India",
  },
  info: {
    fullName:        "Dr. Arjun Sharma",
    dob:             "15 March 1985",
    nationality:     "Indian",
    designation:     "Associate Professor",
    department:      "Computer Science & Engineering",
    institution:     "Indian Institute of Technology, Delhi",
    joined:          "July 2016",
    email:           "arjun.sharma@iitd.ac.in",
    orcidId:         "0000-0002-1234-5678",
    scholarUrl:      "https://scholar.google.com",
    scopusId:        "57219908847",
    researchGateUrl: "https://researchgate.net",
    linkedInUrl:     "https://linkedin.com",
    researcherId:    "A-1234-2016",
    website:         "https://arjunsharma.in",
    github:          "github.com/arjunsharma",
  },
  education: [
    { degree: "Ph.D. in Computer Science",   institution: "IIT Delhi",                     year: "2011 – 2016" },
    { degree: "M.Tech. in Computer Science", institution: "IIT Delhi",                     year: "2009 – 2011" },
    { degree: "B.Tech. in Computer Science", institution: "Delhi Technological University", year: "2005 – 2009" },
  ],
  experience: [
    { role: "Associate Professor", org: "IIT Delhi",              year: "2016 – Present" },
    { role: "Assistant Professor", org: "IIT Delhi",              year: "2013 – 2016"    },
    { role: "Research Scientist",  org: "TCS Research, Bangalore", year: "2011 – 2013"   },
  ],
  bio: `I am an Associate Professor specializing in Machine Learning, Deep Learning, and Natural Language Processing. My research focuses on developing intelligent systems that solve real-world problems. I have published extensively in top-tier journals and conferences and actively collaborate on interdisciplinary research projects.`,
  researchAreas: ["Machine Learning", "Deep Learning", "Natural Language Processing", "Computer Vision", "Data Mining", "AI Ethics", "Healthcare AI", "Text Classification"],
  keywords:      ["Machine Learning", "Deep Learning", "NLP", "Computer Vision", "Data Mining", "AI", "Text Classification", "Neural Networks"],
  metrics: {
    publications: 128,
    citations:    2458,
    hIndex:       28,
    i10Index:     35,
    experience:   10,
    areas:        7,
    keywords:     24,
  },
  completion: {
    percent: 92,
    items: [
      { label: "Basic Information",  done: true },
      { label: "Education",          done: true },
      { label: "Experience",         done: true },
      { label: "Research Interests", done: true },
      { label: "Publications",       done: true },
      { label: "Profile Photo",      done: true },
      { label: "Social Links",       done: true },
    ],
  },
};

// ─────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────
export default function ProfilePage() {
  const { profile, contact, info, education, experience,
          bio, researchAreas, keywords, metrics, completion } = SAMPLE;

  return (
    <div style={{ background: C.pageBg, minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <ProfileHeader profile={profile} />
            <ContactInfo contact={contact} />
            <AcademicInfo info={info} />
            <EducationExperience education={education} experience={experience} />
            <ResearchIdentity bio={bio} researchAreas={researchAreas} keywords={keywords} />
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 24 }}>
            <ResearchMetrics metrics={metrics} />
            <ProfileCompletion percent={completion.percent} items={completion.items} />
          </div>

        </div>
      </div>
    </div>
  );
}