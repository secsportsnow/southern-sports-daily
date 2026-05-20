import { useState, useEffect } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────
const ADMIN_PASSWORD = "Yuqhrk3z3!!!"; // Change this to your own password!

const SPORT_COLORS = {
  Football: "#e8681a",
  Basketball: "#c0392b",
  Baseball: "#2980b9",
  Soccer: "#27ae60",
  Hockey: "#8e44ad",
  Other: "#7f8c8d",
};

const SPORTS_NAV = ["All", "Football", "Basketball", "Baseball", "Soccer", "Hockey"];

// ─── SEED ARTICLES ───────────────────────────────────────────────
const SEED_ARTICLES = [
  {
    id: "seed-1",
    headline: "Alabama Edges LSU in Overtime Thriller, 34–31",
    sport: "Football",
    body: "In a game that had fans on the edge of their seats from kickoff to the final whistle, the Alabama Crimson Tide survived a furious late rally from LSU to escape Tiger Stadium with a 34–31 overtime victory Saturday night.\n\nThe Tide trailed by seven entering the fourth quarter before quarterback Jalen Milroe orchestrated a stunning 12-play, 75-yard drive capped by a one-yard touchdown plunge with 47 seconds remaining. In overtime, kicker Will Reichard split the uprights from 42 yards out to seal the win.\n\n\"Our guys showed tremendous heart tonight,\" Alabama head coach Kalen DeBoer said. \"This is exactly the kind of game that defines a season.\"\n\nThe victory keeps Alabama firmly in the College Football Playoff picture with a 7-1 record, while LSU falls to 6-2 and faces an uphill battle in the SEC West.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    homeTeam: "LSU", awayTeam: "Alabama", homeScore: "31", awayScore: "34",
  },
  {
    id: "seed-2",
    headline: "Georgia Dominates Ole Miss 42–17 Behind Historic Rushing Performance",
    sport: "Football",
    body: "The Georgia Bulldogs put on a rushing clinic in Oxford on Saturday, piling up 312 yards on the ground in a dominant 42–17 victory over Ole Miss that reinforced their status as the SEC's most complete team.\n\nRunning back Trevor Etienne was the star of the show, carrying 24 times for 178 yards and three touchdowns. The Bulldogs' offensive line overwhelmed an Ole Miss front that came in ranked fifth in the conference in run defense.\n\n\"We wanted to establish the run early and never let them off the hook,\" said Georgia coach Kirby Smart. \"The offensive line was just dominant tonight.\"\n\nGeorgia improves to 8-0 and remains atop the SEC East standings.",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    homeTeam: "Ole Miss", awayTeam: "Georgia", homeScore: "17", awayScore: "42",
  },
  {
    id: "seed-3",
    headline: "Kentucky Upsets Tennessee in SEC Basketball Rivalry Renewed",
    sport: "Basketball",
    body: "In a performance that electrified Rupp Arena, the Kentucky Wildcats stunned No. 4 Tennessee 78–71 Saturday afternoon in a game that could reshape the SEC standings heading into February.\n\nSophomore guard Otega Oweh led all scorers with 26 points on 9-of-16 shooting, including a pair of clutch three-pointers in the final four minutes that effectively iced the game for the home team.\n\n\"This is what Kentucky basketball is about,\" Wildcats head coach Mark Pope said. \"The crowd was incredible, and our guys fed off that energy all night.\"",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    homeTeam: "Kentucky", awayTeam: "Tennessee", homeScore: "78", awayScore: "71",
  },
  {
    id: "seed-4",
    headline: "Florida Baseball Walks Off Arkansas in 10th to Claim Series",
    sport: "Baseball",
    body: "A bases-loaded single by designated hitter Cade Kurland in the bottom of the tenth inning gave Florida a dramatic 5–4 walk-off victory over Arkansas on Sunday, completing a come-from-behind series win at Condron Family Ballpark.\n\nThe Gators trailed 4–2 entering the eighth inning before rallying to tie the game on a two-run homer by outfielder Jac Caglianone, his team-leading 14th of the season. Florida's bullpen held firm through two scoreless extra innings to set the stage for Kurland's heroics.",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    homeTeam: "Florida", awayTeam: "Arkansas", homeScore: "5", awayScore: "4",
  },
  {
    id: "seed-5",
    headline: "Tennessee Soccer Claims SEC Tournament Title with Shutdown Defense",
    sport: "Soccer",
    body: "The Tennessee Volunteers claimed their first SEC Tournament championship in program history with a methodical 1–0 victory over Arkansas in Sunday's final, riding a stellar defensive performance and a second-half goal from forward Cece Kizer.\n\nTennessee's back line allowed just two shots on goal across the entire match, suffocating an Arkansas attack that had scored 11 goals in its previous three tournament games.",
    timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    homeTeam: "Tennessee", awayTeam: "Arkansas", homeScore: "1", awayScore: "0",
  },
];

// ─── API HELPERS ─────────────────────────────────────────────────
async function fetchLiveScores(sport) {
  const sportMap = {
    Football: "football/college-football",
    Basketball: "basketball/mens-college-basketball",
    Baseball: "baseball/college-baseball",
    Soccer: "soccer/usa.ncaa.w",
  };
  const endpoint = sportMap[sport] || "football/college-football";
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${endpoint}/scoreboard`);
    const data = await res.json();
    return (data.events || []).filter(e => e.status?.type?.completed === true).slice(0, 5);
  } catch { return []; }
}

async function generateArticle(gameData, sport) {
  const { homeTeam, awayTeam, homeScore, awayScore } = gameData;
  const winner = parseInt(homeScore) > parseInt(awayScore) ? homeTeam : awayTeam;
  const loser = winner === homeTeam ? awayTeam : homeTeam;
  const winScore = Math.max(parseInt(homeScore), parseInt(awayScore));
  const lossScore = Math.min(parseInt(homeScore), parseInt(awayScore));
  const isClose = Math.abs(parseInt(homeScore) - parseInt(awayScore)) <= 3;

  const prompt = `You are a college sports journalist for Southern Sports Daily. Write a compelling news article about this game.

Game: ${sport} — ${homeTeam} ${homeScore}, ${awayTeam} ${awayScore}
Winner: ${winner} (${winScore}–${lossScore}). Close game: ${isClose ? "yes, very close" : "no, decisive"}.

Write:
1. A punchy headline (prefix "HEADLINE: ")
2. 4 paragraphs: dramatic lede, game flow, key moment, closing quote (invent a plausible one)

~350 words. Vivid, energetic sports journalism voice.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  const text = data.content?.map(b => b.text || "").join("") || "";
  const headlineMatch = text.match(/HEADLINE:\s*(.+)/);
  const headline = headlineMatch ? headlineMatch[1].trim() : `${winner} Defeats ${loser} ${winScore}–${lossScore}`;
  const body = text.replace(/HEADLINE:\s*.+\n?/, "").trim();
  return { headline, body };
}

// ─── HELPERS ─────────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function SportTag({ sport }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, letterSpacing: 2,
      textTransform: "uppercase", padding: "3px 8px",
      background: SPORT_COLORS[sport] || "#555",
      color: "#fff", borderRadius: 2,
    }}>{sport}</span>
  );
}

// ─── ADMIN LOGIN PAGE ─────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem("ssd_admin", "true");
      onLogin();
    } else {
      setError("Incorrect password.");
      setPw("");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#080c12",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Georgia', serif",
    }}>
      <div style={{
        background: "#0d1117", border: "1px solid #1f2937",
        borderRadius: 8, padding: "48px 40px", width: "100%", maxWidth: 400,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#e8681a", textTransform: "uppercase", marginBottom: 12 }}>
          Admin Access
        </div>
        <h1 style={{
          fontSize: "1.8rem", fontWeight: 900, color: "#f9fafb",
          margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "-0.02em",
        }}>Southern Sports<br /><span style={{ color: "#e8681a" }}>Daily</span></h1>
        <p style={{ color: "#4b5563", fontSize: 13, marginBottom: 32 }}>
          Staff login — not for public access
        </p>
        <input
          type="password"
          placeholder="Enter password"
          value={pw}
          onChange={e => { setPw(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{
            width: "100%", padding: "12px 16px",
            background: "#080c12", border: "1px solid #2a2f3e",
            borderRadius: 4, color: "#f3f4f6", fontSize: "1rem",
            fontFamily: "'Georgia', serif", marginBottom: 12, outline: "none",
          }}
        />
        {error && <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button
          onClick={handleLogin}
          style={{
            width: "100%", padding: "13px",
            background: "#e8681a", color: "#fff", border: "none",
            borderRadius: 4, fontSize: 13, fontWeight: 800,
            letterSpacing: 2, textTransform: "uppercase",
            cursor: "pointer", fontFamily: "'Georgia', serif",
          }}
        >Login →</button>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL (overlaid on homepage) ──────────────────────────
function AdminBar({ onGenerate, generating, statusMsg, lastFetched, onLogout }) {
  return (
    <div style={{
      background: "#1a0a00", borderBottom: "2px solid #e8681a",
      padding: "10px 24px", display: "flex",
      alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 11, color: "#e8681a", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>
          🔒 Admin Mode
        </span>
        {statusMsg && (
          <span style={{ fontSize: 12, color: "#f59e0b" }}>{statusMsg}</span>
        )}
        {lastFetched && !statusMsg && (
          <span style={{ fontSize: 11, color: "#4b5563" }}>
            Last updated: {lastFetched.toLocaleTimeString()}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onGenerate}
          disabled={generating}
          style={{
            background: generating ? "#1f2937" : "#e8681a",
            color: generating ? "#6b7280" : "#fff",
            border: "none", borderRadius: 4, padding: "9px 18px",
            fontSize: 12, fontWeight: 800, letterSpacing: 2,
            textTransform: "uppercase", cursor: generating ? "not-allowed" : "pointer",
          }}
        >
          {generating ? "⟳ Generating..." : "⚡ Fetch Live Games"}
        </button>
        <button
          onClick={onLogout}
          style={{
            background: "none", border: "1px solid #374151", color: "#6b7280",
            borderRadius: 4, padding: "9px 14px", fontSize: 12,
            cursor: "pointer", letterSpacing: 1,
          }}
        >Logout</button>
      </div>
    </div>
  );
}

// ─── ARTICLE COMPONENTS ──────────────────────────────────────────
function HeroCard({ article, onClick }) {
  return (
    <div
      onClick={() => onClick(article)}
      style={{
        background: "linear-gradient(160deg, #1a1f2e 0%, #0d1117 100%)",
        border: "1px solid #2a2f3e", borderRadius: 8, padding: "40px 44px",
        cursor: "pointer", transition: "border-color 0.2s, transform 0.15s",
        position: "relative", overflow: "hidden",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = SPORT_COLORS[article.sport] || "#555"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2f3e"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: SPORT_COLORS[article.sport] || "#555" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <SportTag sport={article.sport} />
        <span style={{ fontSize: 12, color: "#6b7280" }}>{timeAgo(article.timestamp)}</span>
        <span style={{ fontSize: 11, color: "#374151", background: "#1f2937", padding: "2px 8px", borderRadius: 2, letterSpacing: 1 }}>FEATURED</span>
      </div>
      <h2 style={{
        fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)", fontWeight: 900,
        lineHeight: 1.2, margin: "0 0 16px", color: "#f3f4f6",
        fontFamily: "'Georgia', serif",
      }}>{article.headline}</h2>
      <p style={{ color: "#9ca3af", lineHeight: 1.7, fontSize: "1rem", margin: "0 0 20px" }}>
        {article.body.split("\n\n")[0].slice(0, 220)}…
      </p>
      <span style={{ fontSize: 13, color: SPORT_COLORS[article.sport] || "#6b7280", fontWeight: 700 }}>Read full story →</span>
    </div>
  );
}

function ArticleCard({ article, onClick }) {
  return (
    <div
      onClick={() => onClick(article)}
      style={{
        background: "#0d1117", border: "1px solid #1f2937", borderRadius: 6,
        padding: "22px", cursor: "pointer",
        transition: "border-color 0.2s, transform 0.15s",
        display: "flex", flexDirection: "column", gap: 10,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = SPORT_COLORS[article.sport] || "#555"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#1f2937"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <SportTag sport={article.sport} />
        <span style={{ fontSize: 11, color: "#4b5563" }}>{timeAgo(article.timestamp)}</span>
      </div>
      <h3 style={{ fontSize: "1rem", fontWeight: 800, lineHeight: 1.35, margin: 0, color: "#e5e7eb", fontFamily: "'Georgia', serif" }}>
        {article.headline}
      </h3>
      <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
        {article.body.split("\n\n")[0].slice(0, 120)}…
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <span style={{ fontSize: 12, color: "#374151" }}>{article.homeTeam} {article.homeScore} · {article.awayTeam} {article.awayScore}</span>
        <span style={{ fontSize: 12, color: SPORT_COLORS[article.sport] || "#6b7280", fontWeight: 700 }}>Read →</span>
      </div>
    </div>
  );
}

function ArticleModal({ article, onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "40px 20px", overflowY: "auto",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#0d1117", border: "1px solid #2a2f3e",
        borderRadius: 10, maxWidth: 720, width: "100%",
        overflow: "hidden", animation: "slideUp 0.25s ease",
      }}>
        <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }`}</style>
        <div style={{ height: 4, background: SPORT_COLORS[article.sport] || "#555" }} />
        <div style={{ padding: "32px 40px" }}>
          <button onClick={onClose} style={{
            background: "none", border: "1px solid #2a2f3e", color: "#6b7280",
            borderRadius: 4, padding: "6px 14px", cursor: "pointer",
            fontSize: 12, marginBottom: 24, letterSpacing: 1,
          }}>← Back</button>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
            <SportTag sport={article.sport} />
            <span style={{ fontSize: 12, color: "#4b5563" }}>{timeAgo(article.timestamp)}</span>
          </div>
          <h1 style={{
            fontSize: "clamp(1.4rem, 4vw, 2rem)", fontWeight: 900,
            lineHeight: 1.25, margin: "0 0 12px", color: "#f3f4f6",
            fontFamily: "'Georgia', serif",
          }}>{article.headline}</h1>
          <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #1f2937" }}>
            Southern Sports Daily Staff · AI-Generated · {article.homeTeam} {article.homeScore}, {article.awayTeam} {article.awayScore}
          </div>
          <div style={{
            background: "#111827", border: "1px dashed #1f2937", borderRadius: 4,
            height: 60, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#1f2937", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 28,
          }}>[ Advertisement ]</div>
          {article.body.split("\n\n").filter(p => p.trim()).map((para, i) => (
            <p key={i} style={{
              lineHeight: 1.85, fontSize: "1.05rem", margin: "0 0 20px",
              color: i === 0 ? "#d1d5db" : "#9ca3af",
              fontWeight: i === 0 ? 500 : 400,
            }}>{para}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────
export default function App() {
  const isAdminRoute = window.location.pathname === "/admin";
  const [isAdmin, setIsAdmin] = useState(
    isAdminRoute && sessionStorage.getItem("ssd_admin") === "true"
  );
  const [showLogin, setShowLogin] = useState(isAdminRoute && !isAdmin);

  const [articles, setArticles] = useState(SEED_ARTICLES);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [lastFetched, setLastFetched] = useState(null);

  // Handle /admin route
  useEffect(() => {
    if (isAdminRoute && !sessionStorage.getItem("ssd_admin")) {
      setShowLogin(true);
    }
  }, []);

  const filtered = activeFilter === "All" ? articles : articles.filter(a => a.sport === activeFilter);
  const hero = filtered[0];
  const rest = filtered.slice(1);

  async function autoGenerate() {
    if (generating) return;
    setGenerating(true);
    setStatusMsg("Fetching live scores...");
    const sportsToCheck = ["Football", "Basketball", "Baseball"];
    let newArticles = [];

    for (const sport of sportsToCheck) {
      const events = await fetchLiveScores(sport);
      for (const event of events.slice(0, 2)) {
        const comp = event.competitions?.[0];
        const home = comp?.competitors?.find(c => c.homeAway === "home");
        const away = comp?.competitors?.find(c => c.homeAway === "away");
        if (!home || !away) continue;
        const gameData = {
          homeTeam: home.team?.shortDisplayName || home.team?.name,
          awayTeam: away.team?.shortDisplayName || away.team?.name,
          homeScore: home.score,
          awayScore: away.score,
        };
        const exists = articles.some(a => a.homeTeam === gameData.homeTeam && a.awayTeam === gameData.awayTeam);
        if (exists) continue;
        setStatusMsg(`Writing: ${gameData.awayTeam} @ ${gameData.homeTeam}...`);
        try {
          const { headline, body } = await generateArticle(gameData, sport);
          newArticles.push({
            id: `auto-${Date.now()}-${Math.random()}`,
            headline, body, sport,
            timestamp: new Date().toISOString(),
            ...gameData,
          });
        } catch (e) { console.error(e); }
      }
    }

    if (newArticles.length > 0) {
      setArticles(prev => [...newArticles, ...prev]);
      setStatusMsg(`✓ ${newArticles.length} new article${newArticles.length > 1 ? "s" : ""} published!`);
    } else {
      setStatusMsg("No new completed games found. Try again later.");
    }
    setLastFetched(new Date());
    setGenerating(false);
    setTimeout(() => setStatusMsg(""), 5000);
  }

  function handleLogout() {
    sessionStorage.removeItem("ssd_admin");
    setIsAdmin(false);
    setShowLogin(false);
    window.history.pushState({}, "", "/");
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (showLogin && !isAdmin) {
    return <AdminLogin onLogin={() => { setIsAdmin(true); setShowLogin(false); }} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080c12", color: "#e5e7eb", fontFamily: "'Georgia', serif" }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      {/* Admin bar — only visible when logged in */}
      {isAdmin && (
        <AdminBar
          onGenerate={autoGenerate}
          generating={generating}
          statusMsg={statusMsg}
          lastFetched={lastFetched}
          onLogout={handleLogout}
        />
      )}

      {/* Top ticker */}
      <div style={{ background: "#e8681a", padding: "6px 0", textAlign: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", color: "#fff" }}>
          🏈 Live Coverage · AI-Powered College Sports Journalism
        </span>
      </div>

      {/* Header */}
      <header style={{ background: "#0d1117", borderBottom: "1px solid #1f2937", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ padding: "20px 0 16px" }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: "#e8681a", textTransform: "uppercase", marginBottom: 6 }}>
              {today}
            </div>
            <h1 style={{
              margin: 0, fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
              fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1,
              color: "#f9fafb", textTransform: "uppercase",
            }}>
              Southern Sports <span style={{ color: "#e8681a" }}>Daily</span>
            </h1>
          </div>
          <nav style={{ display: "flex", gap: 0, borderTop: "1px solid #1f2937" }}>
            {SPORTS_NAV.map(sport => (
              <button key={sport} onClick={() => setActiveFilter(sport)} style={{
                background: "none", border: "none", padding: "12px 18px",
                fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase",
                cursor: "pointer",
                color: activeFilter === sport ? "#e8681a" : "#6b7280",
                borderBottom: activeFilter === sport ? "2px solid #e8681a" : "2px solid transparent",
                transition: "all 0.15s",
              }}>{sport}</button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{
          background: "#0d1117", border: "1px dashed #1f2937", borderRadius: 4,
          height: 90, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#1f2937", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 32,
        }}>[ Advertisement — 728×90 ]</div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#4b5563" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📰</div>
            <p>No articles yet for this sport.</p>
          </div>
        ) : (
          <>
            {hero && <div style={{ marginBottom: 32 }}><HeroCard article={hero} onClick={setSelectedArticle} /></div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 32, alignItems: "start" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {rest.map(article => <ArticleCard key={article.id} article={article} onClick={setSelectedArticle} />)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{
                  background: "#0d1117", border: "1px dashed #1f2937", borderRadius: 4,
                  height: 300, display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#1f2937", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", textAlign: "center", padding: 16,
                }}>[ Sidebar Ad<br />300×250 ]</div>
                <div style={{ background: "#0d1117", border: "1px solid #1f2937", borderRadius: 6, padding: 20 }}>
                  <h4 style={{ margin: "0 0 14px", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#e8681a" }}>Latest Scores</h4>
                  {articles.slice(0, 6).map(a => (
                    <div key={a.id} style={{ padding: "10px 0", borderBottom: "1px solid #1f2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#e5e7eb" }}>{a.homeTeam} {a.homeScore}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{a.awayTeam} {a.awayScore}</div>
                      </div>
                      <SportTag sport={a.sport} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        <div style={{
          background: "#0d1117", border: "1px dashed #1f2937", borderRadius: 4,
          height: 90, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#1f2937", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginTop: 40,
        }}>[ Advertisement — 728×90 ]</div>
      </main>

      <footer style={{
        background: "#0d1117", borderTop: "1px solid #1f2937",
        padding: "32px 24px", textAlign: "center",
        color: "#374151", fontSize: 12, letterSpacing: 2, textTransform: "uppercase",
      }}>
        Southern Sports Daily · AI-Powered College Sports Coverage · {new Date().getFullYear()}
      </footer>

      {selectedArticle && <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />}
    </div>
  );
}
