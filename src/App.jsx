import { useState } from "react";

const SPORTS = ["Football", "Basketball", "Baseball", "Soccer", "Hockey", "Volleyball", "Wrestling", "Lacrosse"];
const TONES = ["Breaking news", "Analytical recap", "Hype & excitement", "Human interest angle"];

async function generateArticle({ homeTeam, awayTeam, homeScore, awayScore, sport, tone, keyMoments }) {
  const winner = parseInt(homeScore) > parseInt(awayScore) ? homeTeam : awayTeam;
  const loser = winner === homeTeam ? awayTeam : homeTeam;
  const winScore = Math.max(parseInt(homeScore), parseInt(awayScore));
  const lossScore = Math.min(parseInt(homeScore), parseInt(awayScore));
  const isClose = Math.abs(parseInt(homeScore) - parseInt(awayScore)) <= 3;

  const prompt = `You are a college sports journalist. Write a compelling, publication-ready article about this game result.

Game Details:
- Sport: ${sport}
- Home team: ${homeTeam} (${homeScore})
- Away team: ${awayTeam} (${awayScore})
- Winner: ${winner} (${winScore}-${lossScore})
- Close game: ${isClose ? "Yes, very close finish" : "No, fairly decisive"}
- Key moments/notes: ${keyMoments || "None provided"}
- Tone: ${tone}

Write a full article with:
1. A punchy headline (prefix with "HEADLINE: ")
2. A compelling lede paragraph
3. 3-4 body paragraphs covering the game flow, key moments, and implications
4. A closing quote (you can invent a plausible coach/player quote)

Keep it around 350-450 words. Write it like a real sports journalist would — vivid, energetic, and informative.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  const text = data.content.map(b => b.text || "").join("");
  const headlineMatch = text.match(/HEADLINE:\s*(.+)/);
  const headline = headlineMatch ? headlineMatch[1].trim() : `${winner} Defeats ${loser} ${winScore}-${lossScore}`;
  const body = text.replace(/HEADLINE:\s*.+\n?/, "").trim();
  return { headline, body };
}

export default function App() {
  const [form, setForm] = useState({
    homeTeam: "", awayTeam: "", homeScore: "", awayScore: "",
    sport: "Football", tone: "Breaking news", keyMoments: ""
  });
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleGenerate = async () => {
    if (!form.homeTeam || !form.awayTeam || !form.homeScore || !form.awayScore) {
      setError("Please fill in both team names and scores.");
      return;
    }
    setError("");
    setLoading(true);
    setArticle(null);
    try {
      const result = await generateArticle(form);
      setArticle(result);
    } catch (e) {
      setError("Something went wrong generating the article. Please try again.");
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (!article) return;
    navigator.clipboard.writeText(`${article.headline}\n\n${article.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      fontFamily: "'Georgia', serif",
      color: "#e8e0d0",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, #1a2a1a 0%, #0a0a0f 60%)",
        pointerEvents: "none"
      }} />
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, opacity: 0.03,
        backgroundImage: "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)",
        pointerEvents: "none"
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" }}>

        <header style={{ textAlign: "center", padding: "48px 0 32px", borderBottom: "1px solid #2a2a2a" }}>
          <div style={{ fontSize: 11, letterSpacing: 6, color: "#6a9955", textTransform: "uppercase", marginBottom: 12 }}>
            AI-Powered Sports Journalism
          </div>
          <h1 style={{
            fontSize: "clamp(2.4rem, 7vw, 4.2rem)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            margin: 0,
            lineHeight: 1,
            color: "#f0e8d8",
            textShadow: "0 0 60px rgba(106,153,85,0.15)"
          }}>
            SOUTHERN SPORTS<br />
            <span style={{ color: "#6a9955" }}>DAILY</span>
          </h1>
          <div style={{ marginTop: 14, fontSize: 12, color: "#555", letterSpacing: 3, textTransform: "uppercase" }}>
            {today}
          </div>
        </header>

        <div style={{
          margin: "24px 0",
          background: "#111",
          border: "1px dashed #2a2a2a",
          borderRadius: 4,
          height: 90,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#333", fontSize: 12, letterSpacing: 2, textTransform: "uppercase"
        }}>
          [ Advertisement — 728×90 Leaderboard ]
        </div>

        <div style={{
          background: "#111318",
          border: "1px solid #1e2128",
          borderRadius: 8,
          padding: "32px",
          marginBottom: 32
        }}>
          <h2 style={{ margin: "0 0 24px", fontSize: 13, letterSpacing: 4, textTransform: "uppercase", color: "#6a9955" }}>
            Enter Game Result
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "end", marginBottom: 20 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>Home Team</span>
              <input style={inputStyle} placeholder="e.g. Ohio State" value={form.homeTeam} onChange={e => set("homeTeam", e.target.value)} />
            </label>
            <div style={{ paddingBottom: 12, color: "#555", fontWeight: 900, fontSize: 18 }}>VS</div>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>Away Team</span>
              <input style={inputStyle} placeholder="e.g. Michigan" value={form.awayTeam} onChange={e => set("awayTeam", e.target.value)} />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>Home Score</span>
              <input style={inputStyle} type="number" placeholder="24" value={form.homeScore} onChange={e => set("homeScore", e.target.value)} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>Away Score</span>
              <input style={inputStyle} type="number" placeholder="17" value={form.awayScore} onChange={e => set("awayScore", e.target.value)} />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>Sport</span>
              <select style={inputStyle} value={form.sport} onChange={e => set("sport", e.target.value)}>
                {SPORTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>Article Tone</span>
              <select style={inputStyle} value={form.tone} onChange={e => set("tone", e.target.value)}>
                {TONES.map(t => <option key={t}>{t}</option>)}
              </select>
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
            <span style={labelStyle}>Key Moments / Notes <span style={{ color: "#444", fontWeight: 400 }}>(optional)</span></span>
            <textarea
              style={{ ...inputStyle, minHeight: 72, resize: "vertical", lineHeight: 1.5 }}
              placeholder="e.g. QB threw 3 TDs, game-winning field goal with 2 seconds left..."
              value={form.keyMoments}
              onChange={e => set("keyMoments", e.target.value)}
            />
          </label>

          {error && <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              background: loading ? "#1e2a1e" : "#6a9955",
              color: loading ? "#3a5a3a" : "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              fontFamily: "Georgia, serif"
            }}
          >
            {loading ? "✦ Generating Article..." : "✦ Generate Article"}
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#6a9955" }}>
            <div style={{ fontSize: 13, letterSpacing: 4, textTransform: "uppercase", animation: "pulse 1.5s ease-in-out infinite" }}>
              Writing your article...
            </div>
            <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }`}</style>
          </div>
        )}

        {article && !loading && (
          <article style={{
            background: "#0e1012",
            border: "1px solid #1e2128",
            borderRadius: 8,
            overflow: "hidden",
            animation: "fadeIn 0.5s ease",
          }}>
            <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }`}</style>

            <div style={{ background: "#111318", padding: "32px 36px 24px", borderBottom: "1px solid #1e2128" }}>
              <div style={{ fontSize: 10, letterSpacing: 5, color: "#6a9955", textTransform: "uppercase", marginBottom: 14 }}>
                {form.sport} · College Athletics
              </div>
              <h2 style={{ margin: "0 0 16px", fontSize: "clamp(1.4rem, 4vw, 2rem)", lineHeight: 1.25, color: "#f0e8d8", fontWeight: 900 }}>
                {article.headline}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "#555" }}>
                <span>Staff Reporter, Southern Sports Daily</span>
                <span>·</span>
                <span>{today}</span>
                <span>·</span>
                <span>AI-Generated</span>
              </div>
            </div>

            <div style={{ padding: "28px 36px 36px" }}>
              {article.body.split("\n\n").filter(p => p.trim()).map((para, i) => (
                <p key={i} style={{
                  margin: "0 0 20px",
                  lineHeight: 1.85,
                  fontSize: "1.05rem",
                  color: i === 0 ? "#d8d0c0" : "#9a9080",
                  fontWeight: i === 0 ? 500 : 400
                }}>
                  {para}
                </p>
              ))}
            </div>

            <div style={{
              padding: "20px 36px",
              borderTop: "1px solid #1e2128",
              display: "flex", gap: 12, flexWrap: "wrap"
            }}>
              <button onClick={handleCopy} style={actionBtn}>
                {copied ? "✓ Copied!" : "Copy Article"}
              </button>
              <button onClick={handleGenerate} style={{ ...actionBtn, background: "transparent", color: "#555", border: "1px solid #2a2a2a" }}>
                Regenerate
              </button>
            </div>
          </article>
        )}

        <footer style={{ marginTop: 48, textAlign: "center", color: "#333", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>
          Southern Sports Daily · AI-Powered Sports Journalism · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: 10,
  letterSpacing: 3,
  textTransform: "uppercase",
  color: "#666",
  fontFamily: "Georgia, serif"
};

const inputStyle = {
  background: "#0a0a0f",
  border: "1px solid #2a2a2a",
  borderRadius: 4,
  padding: "10px 14px",
  color: "#e8e0d0",
  fontSize: "0.95rem",
  fontFamily: "Georgia, serif",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color 0.2s"
};

const actionBtn = {
  padding: "10px 20px",
  background: "#6a9955",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 2,
  textTransform: "uppercase",
  cursor: "pointer",
  fontFamily: "Georgia, serif"
};
