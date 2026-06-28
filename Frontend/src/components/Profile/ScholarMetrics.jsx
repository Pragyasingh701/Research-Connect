import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";

const C = {
  primaryBlue: "#2563EB",
  indigo:      "#4F46E5",
  green:       "#22C55E",
  orange:      "#F59E0B",
  cardBg:      "#FFFFFF",
  textPrimary: "#0F172A",
  textSecond:  "#475569",
  border:      "#E2E8F0",
  lightBlue:   "#DBEAFE",
  lightGreen:  "#DCFCE7",
  lightPurple: "#EDE9FE",
  lightOrange: "#FEF3C7",
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

function MetricRow({ label, allTime, since2021 }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      padding: "8px 0",
      borderBottom: `1px solid ${C.border}`,
      alignItems: "center",
    }}>
      <span style={{ fontSize: 13, color: C.textPrimary }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, textAlign: "center" }}>
        {allTime}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: C.primaryBlue, textAlign: "right" }}>
        {since2021}
      </span>
    </div>
  );
}

// Mock yearly citation data matching the screenshot
const YEARLY_DATA = [
  { year: "2019", citations: 14500 },
  { year: "2020", citations: 13800 },
  { year: "2021", citations: 14200 },
  { year: "2022", citations: 14000 },
  { year: "2023", citations: 18200 },
  { year: "2024", citations: 14800 },
  { year: "2025", citations: 13500 },
  { year: "2026", citations: 5200  },
];

export default function ScholarMetrics({ scholarId: propScholarId }) {
  const [scholarId, setScholarId] = useState(propScholarId || "");
  const [metrics,   setMetrics]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [fetched,   setFetched]   = useState(false);

  const handleFetch = async () => {
    if (!scholarId.trim()) {
      setError("Please enter your Google Scholar ID.");
      return;
    }
    setLoading(true);
    setError("");
    setMetrics(null);

    try {
      /*
       * ── BACKEND INTEGRATION ─────────────────────────────────────────
       * const res  = await fetch(`/api/scholar/metrics?id=${scholarId}`);
       * const data = await res.json();
       * if (!res.ok) throw new Error(data.message || "Failed to fetch");
       * setMetrics(data);
       *
       * Expected response shape:
       * {
       *   citations:  { all: 202167, since2021: 81222 },
       *   hIndex:     { all: 216,    since2021: 139   },
       *   i10Index:   { all: 1184,   since2021: 772   },
       *   yearlyData: [ { year: "2019", citations: 14500 }, ... ],
       *   profileUrl: "https://scholar.google.com/citations?user=ID"
       * }
       * ────────────────────────────────────────────────────────────────
       */

      // MOCK — remove once backend is ready
      await new Promise((r) => setTimeout(r, 1500));
      setMetrics({
        citations:  { all: 202167, since2021: 81222 },
        hIndex:     { all: 216,    since2021: 139   },
        i10Index:   { all: 1184,   since2021: 772   },
        yearlyData: YEARLY_DATA,
        profileUrl: `https://scholar.google.com/citations?user=${scholarId}`,
      });
      setFetched(true);
    } catch (err) {
      setError("Could not fetch data. Check your Scholar ID and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMetrics(null);
    setFetched(false);
    setError("");
  };

  return (
    <Card>
      <SectionTitle>Cited By (Google Scholar)</SectionTitle>

      {/* Info banner */}
      <div style={{
        background: C.lightBlue,
        border: "1px solid #BFDBFE",
        borderRadius: 8,
        padding: "10px 14px",
        marginBottom: 16,
        fontSize: 12,
        color: C.primaryBlue,
        lineHeight: 1.6,
      }}>
        📖 Enter your <strong>Google Scholar ID</strong> to auto-fill citation metrics.
        Find it in your Scholar profile URL:
        <br />
        <code style={{ background: "#EFF6FF", padding: "1px 6px", borderRadius: 4 }}>
          scholar.google.com/citations?user=<strong>YOUR_ID</strong>
        </code>
      </div>

      {/* Input row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="e.g. qj74uXYAAAAJ"
          value={scholarId}
          onChange={(e) => setScholarId(e.target.value)}
          disabled={fetched}
          style={{
            flex: 1,
            padding: "9px 14px",
            border: `1px solid ${error ? "#EF4444" : C.border}`,
            borderRadius: 8,
            fontSize: 13,
            color: C.textPrimary,
            outline: "none",
            background: fetched ? "#F8FAFC" : "#fff",
          }}
        />
        {!fetched ? (
          <button
            onClick={handleFetch}
            disabled={loading}
            style={{
              background: loading
                ? C.border
                : `linear-gradient(135deg, ${C.primaryBlue}, ${C.indigo})`,
              color: loading ? C.textSecond : "#fff",
              border: "none",
              borderRadius: 8,
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              minWidth: 100,
            }}
          >
            {loading ? "Fetching…" : "Fetch Data"}
          </button>
        ) : (
          <button
            onClick={handleReset}
            style={{
              background: "#FEE2E2",
              color: "#EF4444",
              border: "none",
              borderRadius: 8,
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: "#EF4444", fontSize: 12, margin: "0 0 12px" }}>
          ⚠ {error}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "20px 0", color: C.textSecond, fontSize: 13 }}>
          ⏳ Fetching your Scholar metrics…
        </div>
      )}

      {/* Results */}
      {metrics && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Success + View Profile link */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
              Cited by
            </span>
            <a
              href={metrics.profileUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12, color: C.primaryBlue, textDecoration: "none", fontWeight: 600 }}
            >
              VIEW ALL ↗
            </a>
          </div>

          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            paddingBottom: 6,
            borderBottom: `2px solid ${C.border}`,
          }}>
            <span style={{ fontSize: 12, color: C.textSecond }}></span>
            <span style={{ fontSize: 12, color: C.textSecond, textAlign: "center", fontWeight: 600 }}>All</span>
            <span style={{ fontSize: 12, color: C.textSecond, textAlign: "right", fontWeight: 600 }}>Since 2021</span>
          </div>

          {/* Metric rows */}
          <MetricRow
            label="Citations"
            allTime={metrics.citations.all.toLocaleString()}
            since2021={metrics.citations.since2021.toLocaleString()}
          />
          <MetricRow
            label="h-index"
            allTime={metrics.hIndex.all}
            since2021={metrics.hIndex.since2021}
          />
          <MetricRow
            label="i10-index"
            allTime={metrics.i10Index.all}
            since2021={metrics.i10Index.since2021}
          />

          {/* Bar Chart — yearly citations */}
          <div style={{ marginTop: 8 }}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={metrics.yearlyData} barSize={22}>
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: C.textSecond }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: C.textSecond }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : v}
                />
                <Tooltip
                  formatter={(value) => [value.toLocaleString(), "Citations"]}
                  contentStyle={{
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="citations" radius={[3, 3, 0, 0]}>
                  {metrics.yearlyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.year === "2026" ? C.lightBlue : "#94A3B8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Use This Data button */}
          <button
            onClick={() => alert("Data saved! (wire to your form state)")}
            style={{
              background: `linear-gradient(135deg, ${C.green}, #10B981)`,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
            }}
          >
            ✓ Use This Data
          </button>
        </div>
      )}
    </Card>
  );
}
