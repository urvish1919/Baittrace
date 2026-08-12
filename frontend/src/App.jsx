import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  const [page, setPage] = useState("Dashboard");

  const [stats, setStats] = useState({
    total_events: 0,
    login_attempts: 0,
    successful_logins: 0,
    commands: 0,
    failed_commands: 0,
    unique_ips: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  const [attackers, setAttackers] = useState([]);
  const [events, setEvents] = useState([]);
  const [commands, setCommands] = useState([]);
  const [logins, setLogins] = useState([]);

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // =====================================================
  // FETCH BACKEND DATA
  // =====================================================

  async function fetchData() {
    try {
      const [
        statsRes,
        attackersRes,
        eventsRes,
        commandsRes,
        loginsRes,
      ] = await Promise.all([
        fetch(`${API}/api/stats`),
        fetch(`${API}/api/attackers`),
        fetch(`${API}/api/events`),
        fetch(`${API}/api/commands`),
        fetch(`${API}/api/logins`),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      if (attackersRes.ok) {
        setAttackers(await attackersRes.json());
      }

      if (eventsRes.ok) {
        setEvents(await eventsRes.json());
      }

      if (commandsRes.ok) {
        setCommands(await commandsRes.json());
      }

      if (loginsRes.ok) {
        setLogins(await loginsRes.json());
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("BaitTrace API error:", error);
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // AUTO REFRESH
  // =====================================================

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // =====================================================
  // SEVERITY TOTAL
  // =====================================================

  const severityTotal = useMemo(() => {
    return (
      (stats.critical || 0) +
      (stats.high || 0) +
      (stats.medium || 0) +
      (stats.low || 0)
    );
  }, [stats]);

  // =====================================================
  // SEVERITY PERCENT
  // =====================================================

  const severityPercent = (value) => {
    if (!severityTotal) {
      return 0;
    }

    return Math.round((value / severityTotal) * 100);
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (timestamp) => {
    if (!timestamp) {
      return "-";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // =====================================================
  // FORMAT DATE/TIME
  // =====================================================

  const formatDateTime = (timestamp) => {
    if (!timestamp) {
      return "-";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }

    return date.toLocaleString();
  };

  // =====================================================
  // BACKEND SEVERITY
  // =====================================================
  // IMPORTANT:
  // We DO NOT calculate severity in React.
  // The backend severity is displayed directly.

  const getSeverity = (event) => {
    return String(event?.severity || "LOW").toUpperCase();
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>

        <h2>BAITTRACE</h2>

        <p>
          Connecting to honeypot sensor...
        </p>
      </div>
    );
  }

  // =====================================================
  // APP
  // =====================================================

  return (
    <div className="app">
      <Sidebar
        page={page}
        setPage={setPage}
      />

      <main className="main">
        <Header
          page={page}
          lastUpdated={lastUpdated}
          onRefresh={fetchData}
        />

        {page === "Dashboard" && (
          <Dashboard
            stats={stats}
            attackers={attackers}
            events={events}
            severityPercent={severityPercent}
            severityTotal={severityTotal}
            formatTime={formatTime}
            getSeverity={getSeverity}
            setPage={setPage}
          />
        )}

        {page === "Attackers" && (
          <AttackersPage
            attackers={attackers}
            events={events}
            formatDateTime={formatDateTime}
            formatTime={formatTime}
          />
        )}

        {page === "Commands" && (
          <CommandsPage
            commands={commands}
            formatDateTime={formatDateTime}
          />
        )}

        {page === "Login Activity" && (
          <LoginsPage
            logins={logins}
            formatDateTime={formatDateTime}
          />
        )}

        {page === "Event Stream" && (
          <EventsPage
            events={events}
            formatTime={formatTime}
            getSeverity={getSeverity}
          />
        )}

        <footer>
          <span>BAITTRACE SECURITY SENSOR</span>

          <span>
            HONEYPOT INTELLIGENCE PLATFORM
          </span>
        </footer>
      </main>
    </div>
  );
}

// =====================================================
// SIDEBAR
// =====================================================

function Sidebar({
  page,
  setPage,
}) {
  const navigation = [
    {
      name: "Dashboard",
      icon: "◉",
    },
    {
      name: "Attackers",
      icon: "◎",
    },
    {
      name: "Commands",
      icon: "⌁",
    },
    {
      name: "Login Activity",
      icon: "▣",
    },
    {
      name: "Event Stream",
      icon: "▥",
    },
  ];

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">
          BT
        </div>

        <div>
          <h1>BAITTRACE</h1>

          <span>
            HONEYPOT INTELLIGENCE
          </span>
        </div>
      </div>

      <nav>
        {navigation.map((item) => (
          <button
            key={item.name}
            className={`nav-button ${
              page === item.name
                ? "active"
                : ""
            }`}
            onClick={() =>
              setPage(item.name)
            }
          >
            <span>{item.icon}</span>

            {item.name}
          </button>
        ))}
      </nav>

      <div className="system-status">
        <div className="status-dot"></div>

        <div>
          <strong>
            HONEYPOT ONLINE
          </strong>

          <small>
            Cowrie sensor active
          </small>
        </div>
      </div>
    </aside>
  );
}

// =====================================================
// HEADER
// =====================================================

function Header({
  page,
  onRefresh,
}) {
  const descriptions = {
    Dashboard:
      "Real-time monitoring of activity captured by the BaitTrace SSH honeypot.",

    Attackers:
      "Investigate unique sources and attack behavior captured by the sensor.",

    Commands:
      "Monitor commands executed by attackers inside the honeypot.",

    "Login Activity":
      "Review authentication attempts captured by the BaitTrace sensor.",

    "Event Stream":
      "Monitor raw telemetry captured from the BaitTrace honeypot sensor.",
  };

  return (
    <header className="header">
      <div>
        <div className="eyebrow">
          SECURITY OPERATIONS CENTER
        </div>

        <h2>
          {page === "Dashboard"
            ? "Attack Intelligence"
            : page}
        </h2>

        <p className="subtitle">
          {descriptions[page]}
        </p>
      </div>

      <button
        className="live"
        onClick={onRefresh}
      >
        <span className="live-dot"></span>

        LIVE

        <span className="refresh">
          Auto refresh: 5s
        </span>
      </button>
    </header>
  );
}

// =====================================================
// DASHBOARD
// =====================================================

function Dashboard({
  stats,
  attackers,
  events,
  severityPercent,
  severityTotal,
  formatTime,
  getSeverity,
  setPage,
}) {
  return (
    <>
      <div className="stats-grid">
        <StatCard
          icon="✓"
          label="Successful Logins"
          value={stats.successful_logins}
        />

        <StatCard
          icon=">"
          label="Commands"
          value={stats.commands}
        />

        <StatCard
          icon="!"
          label="Failed Commands"
          value={stats.failed_commands}
          danger
        />

        <StatCard
          icon="◎"
          label="Unique IPs"
          value={stats.unique_ips}
        />

        <StatCard
          icon="◇"
          label="Total Events"
          value={stats.total_events}
        />
      </div>

      <div className="content-grid">
        <SeverityPanel
          stats={stats}
          severityPercent={severityPercent}
          severityTotal={severityTotal}
        />

        <SensorPanel
          stats={stats}
        />
      </div>

      <div className="panel large-panel">
        <div className="panel-header">
          <div>
            <div className="panel-label">
              NETWORK INTELLIGENCE
            </div>

            <h3>
              Detected Attackers
            </h3>
          </div>

          <span className="event-count">
            {attackers.length} sources
          </span>
        </div>

        <AttackerTable
          attackers={attackers}
          compact
          onSelect={() =>
            setPage("Attackers")
          }
        />
      </div>

      <div className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-label">
                RECENT ACTIVITY
              </div>

              <h3>
                Latest Events
              </h3>
            </div>

            <button
              className="view-button"
              onClick={() =>
                setPage("Event Stream")
              }
            >
              VIEW ALL
            </button>
          </div>

          <div className="activity-list">
            {events
              .slice(0, 5)
              .map((event, index) => {
                const severity =
                  getSeverity(event);

                return (
                  <div
                    className="activity"
                    key={index}
                  >
                    <div className="activity-icon">
                      {event.eventid?.includes(
                        "login"
                      )
                        ? "↪"
                        : event.eventid?.includes(
                            "command"
                          )
                        ? ">"
                        : "◇"}
                    </div>

                    <div className="activity-content">
                      <strong>
                        {event.eventid ||
                          "Unknown Event"}
                      </strong>

                      <span>
                        {event.src_ip ||
                          "-"}
                        {" • "}
                        {formatTime(
                          event.timestamp
                        )}
                      </span>
                    </div>

                    <span
                      className={`severity-badge ${severity.toLowerCase()}`}
                    >
                      {severity}
                    </span>
                  </div>
                );
              })}

            {events.length === 0 && (
              <div className="empty">
                No events captured yet.
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-label">
                COMMAND INTELLIGENCE
              </div>

              <h3>
                Recent Commands
              </h3>
            </div>

            <button
              className="view-button"
              onClick={() =>
                setPage("Commands")
              }
            >
              VIEW ALL
            </button>
          </div>

          <div className="command-list">
            {events
              .filter((event) =>
                event.eventid?.includes(
                  "command.input"
                )
              )
              .slice(0, 5)
              .map((event, index) => (
                <div
                  className="command"
                  key={index}
                >
                  <div className="terminal-symbol">
                    $
                  </div>

                  <div className="command-body">
                    <code>
                      {event.input ||
                        event.message ||
                        "-"}
                    </code>

                    <small>
                      {event.src_ip ||
                        "-"}
                      {" • "}
                      {formatTime(
                        event.timestamp
                      )}
                    </small>
                  </div>
                </div>
              ))}

            {events.filter((event) =>
              event.eventid?.includes(
                "command.input"
              )
            ).length === 0 && (
              <div className="empty">
                No commands captured yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="panel large-panel">
        <div className="panel-header">
          <div>
            <div className="panel-label">
              TELEMETRY
            </div>

            <h3>
              Live Event Stream
            </h3>
          </div>

          <span className="live-event">
            ● LIVE
          </span>
        </div>

        <EventRows
          events={events.slice(0, 10)}
          formatTime={formatTime}
        />
      </div>
    </>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  icon,
  label,
  value,
  danger,
}) {
  return (
    <div
      className={`stat-card ${
        danger
          ? "danger-card"
          : ""
      }`}
    >
      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>

        <strong>
          {value ?? 0}
        </strong>
      </div>
    </div>
  );
}

// =====================================================
// SEVERITY PANEL
// =====================================================

function SeverityPanel({
  stats,
  severityPercent,
  severityTotal,
}) {
  const rows = [
    {
      name: "Critical",
      value: stats.critical || 0,
      className: "critical",
    },
    {
      name: "High",
      value: stats.high || 0,
      className: "high",
    },
    {
      name: "Medium",
      value: stats.medium || 0,
      className: "medium",
    },
    {
      name: "Low",
      value: stats.low || 0,
      className: "low",
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-label">
            THREAT ANALYSIS
          </div>

          <h3>
            Severity Distribution
          </h3>
        </div>

        <span className="event-count">
          {severityTotal} classified
        </span>
      </div>

      <div className="severity-list">
        {rows.map((row) => (
          <div
            className="severity"
            key={row.name}
          >
            <div className="severity-top">
              <span>{row.name}</span>

              <strong>
                {row.value}
              </strong>
            </div>

            <div className="bar">
              <div
                className={`bar-fill ${row.className}`}
                style={{
                  width: `${severityPercent(
                    row.value
                  )}%`,
                }}
              />
            </div>

            <small>
              {severityPercent(
                row.value
              )}
              %
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// SENSOR PANEL
// =====================================================

function SensorPanel({
  stats,
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-label">
            SENSOR STATUS
          </div>

          <h3>
            BaitTrace Sensor
          </h3>
        </div>

        <span className="online-badge">
          ONLINE
        </span>
      </div>

      <div className="sensor-info">
        <div className="info-row">
          <span>Sensor</span>
          <strong>
            Cowrie SSH
          </strong>
        </div>

        <div className="info-row">
          <span>Protocol</span>
          <strong>SSH</strong>
        </div>

        <div className="info-row">
          <span>Port</span>
          <strong>2222</strong>
        </div>

        <div className="info-row">
          <span>Events</span>
          <strong>
            {stats.total_events || 0}
          </strong>
        </div>

        <div className="info-row">
          <span>Unique Attackers</span>
          <strong>
            {stats.unique_ips || 0}
          </strong>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// ATTACKERS PAGE
// =====================================================

function AttackersPage({
  attackers,
  events,
  formatDateTime,
  formatTime,
}) {
  const [
    selected,
    setSelected,
  ] = useState(null);

  return (
    <>
      <div className="panel large-panel">
        <div className="panel-header">
          <div>
            <div className="panel-label">
              NETWORK INTELLIGENCE
            </div>

            <h3>
              Detected Attackers
            </h3>
          </div>

          <span className="event-count">
            {attackers.length} unique IPs
          </span>
        </div>

        <AttackerTable
          attackers={attackers}
          onSelect={setSelected}
        />
      </div>

      {selected && (
        <div className="panel large-panel">
          <div className="panel-header">
            <div>
              <div className="panel-label">
                ATTACKER PROFILE
              </div>

              <h3>
                Security Investigation Details
              </h3>
            </div>

            <button
              className="view-button"
              onClick={() =>
                setSelected(null)
              }
            >
              CLOSE
            </button>
          </div>

          <div className="attacker-profile">
            <div>
              <div className="profile-ip">
                {selected.ip}
              </div>

              {/* BACKEND RISK LEVEL */}
              <RiskBadge
                level={
                  selected.risk_level
                }
              />
            </div>

            <div className="stats-grid profile-stats">
              {/* BACKEND RISK SCORE */}
              <StatCard
                label="Risk Score"
                value={
                  selected.risk_score ?? 0
                }
                icon="◈"
                danger={
                  selected.risk_level ===
                    "HIGH" ||
                  selected.risk_level ===
                    "CRITICAL"
                }
              />

              <StatCard
                label="Total Events"
                value={
                  selected.events
                }
                icon="◇"
              />

              <StatCard
                label="Login Attempts"
                value={
                  selected.logins
                }
                icon="⌁"
              />

              <StatCard
                label="Successful Logins"
                value={
                  selected.successful_logins
                }
                icon="✓"
              />

              <StatCard
                label="Commands"
                value={
                  selected.commands
                }
                icon=">"
              />
            </div>

            <div className="content-grid">
              <div className="panel">
                <div className="info-row">
                  <span>
                    Risk Level
                  </span>

                  <strong>
                    {selected.risk_level ||
                      "LOW"}
                  </strong>
                </div>

                <div className="info-row">
                  <span>
                    Risk Score
                  </span>

                  <strong>
                    {selected.risk_score ?? 0}
                  </strong>
                </div>
              </div>

              <div className="panel">
                <div className="info-row">
                  <span>
                    Failed Commands
                  </span>

                  <strong>
                    {selected.failed_commands}
                  </strong>
                </div>

                <div className="info-row">
                  <span>
                    Total Events
                  </span>

                  <strong>
                    {selected.events}
                  </strong>
                </div>
              </div>
            </div>

            <div className="content-grid">
              <div className="panel">
                <div className="info-row">
                  <span>
                    First Seen
                  </span>

                  <strong>
                    {formatDateTime(
                      selected.first_seen
                    )}
                  </strong>
                </div>
              </div>

              <div className="panel">
                <div className="info-row">
                  <span>
                    Last Seen
                  </span>

                  <strong>
                    {formatDateTime(
                      selected.last_seen
                    )}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="panel large-panel">
        <div className="panel-header">
          <div>
            <div className="panel-label">
              ATTACK TELEMETRY
            </div>

            <h3>
              Events From Attackers
            </h3>
          </div>

          <span className="event-count">
            {events.length} events
          </span>
        </div>

        <EventRows
          events={events.slice(0, 20)}
          formatTime={formatTime}
        />
      </div>
    </>
  );
}

// =====================================================
// RISK BADGE
// =====================================================

function RiskBadge({
  level,
}) {
  const normalized =
    String(level || "LOW").toUpperCase();

  return (
    <span
      className={`risk-badge ${normalized.toLowerCase()}`}
    >
      {normalized} RISK
    </span>
  );
}

// =====================================================
// ATTACKER TABLE
// =====================================================

function AttackerTable({
  attackers,
  compact = false,
  onSelect,
}) {
  if (!attackers.length) {
    return (
      <div className="empty">
        No attackers detected yet.
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>IP ADDRESS</th>
            <th>EVENTS</th>
            <th>LOGINS</th>
            <th>SUCCESS</th>
            <th>COMMANDS</th>
            <th>FAILED</th>

            {!compact && (
              <th>FIRST SEEN</th>
            )}

            {!compact && (
              <th>LAST SEEN</th>
            )}

            <th>RISK SCORE</th>
            <th>RISK</th>
          </tr>
        </thead>

        <tbody>
          {attackers.map(
            (attacker) => {
              // Backend-provided values
              const riskScore =
                attacker.risk_score ?? 0;

              const riskLevel =
                String(
                  attacker.risk_level ||
                    "LOW"
                ).toUpperCase();

              return (
                <tr
                  key={attacker.ip}
                  onClick={() =>
                    onSelect?.(
                      attacker
                    )
                  }
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <td className="ip">
                    {attacker.ip}
                  </td>

                  <td>
                    {attacker.events}
                  </td>

                  <td>
                    {attacker.logins}
                  </td>

                  <td>
                    {
                      attacker.successful_logins
                    }
                  </td>

                  <td>
                    {attacker.commands}
                  </td>

                  <td>
                    {
                      attacker.failed_commands
                    }
                  </td>

                  {!compact && (
                    <td>
                      {attacker.first_seen ||
                        "-"}
                    </td>
                  )}

                  {!compact && (
                    <td>
                      {attacker.last_seen ||
                        "-"}
                    </td>
                  )}

                  {/* REAL BACKEND SCORE */}
                  <td>
                    <strong className="risk-score">
                      {riskScore}
                    </strong>
                  </td>

                  {/* REAL BACKEND LEVEL */}
                  <td>
                    <RiskBadge
                      level={riskLevel}
                    />
                  </td>
                </tr>
              );
            }
          )}
        </tbody>
      </table>
    </div>
  );
}

// =====================================================
// COMMANDS PAGE
// =====================================================

function CommandsPage({
  commands,
  formatDateTime,
}) {
  return (
    <div className="panel large-panel">
      <div className="panel-header">
        <div>
          <div className="panel-label">
            COMMAND INTELLIGENCE
          </div>

          <h3>
            Captured Commands
          </h3>
        </div>

        <span className="event-count">
          {commands.length} commands
        </span>
      </div>

      <div className="command-list">
        {commands.map(
          (command, index) => (
            <div
              className="command"
              key={index}
            >
              <div className="terminal-symbol">
                $
              </div>

              <div className="command-body">
                <code>
                  {command.command}
                </code>

                <small>
                  {command.ip}
                  {" • "}
                  {formatDateTime(
                    command.timestamp
                  )}
                </small>
              </div>
            </div>
          )
        )}

        {!commands.length && (
          <div className="empty">
            No commands captured yet.
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// LOGIN PAGE
// =====================================================

function LoginsPage({
  logins,
  formatDateTime,
}) {
  return (
    <div className="panel large-panel">
      <div className="panel-header">
        <div>
          <div className="panel-label">
            AUTHENTICATION TELEMETRY
          </div>

          <h3>
            Login Activity
          </h3>
        </div>

        <span className="event-count">
          {logins.length} attempts
        </span>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>TIMESTAMP</th>
              <th>IP ADDRESS</th>
              <th>USERNAME</th>
              <th>PASSWORD</th>
              <th>SEVERITY</th>
              <th>STATUS</th>
            </tr>
          </thead>

          <tbody>
            {logins.map(
              (login, index) => {
                const severity =
                  String(
                    login.severity ||
                      "LOW"
                  ).toUpperCase();

                return (
                  <tr key={index}>
                    <td>
                      {formatDateTime(
                        login.timestamp
                      )}
                    </td>

                    <td className="ip">
                      {login.ip}
                    </td>

                    <td>
                      {login.username}
                    </td>

                    <td>
                      {login.password}
                    </td>

                    <td>
                      <span
                        className={`severity-badge ${severity.toLowerCase()}`}
                      >
                        {severity}
                      </span>
                    </td>

                    <td>
                      {login.success ? (
                        <span className="safe-badge">
                          SUCCESS
                        </span>
                      ) : (
                        <span className="danger-badge">
                          FAILED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>

        {!logins.length && (
          <div className="empty">
            No login activity captured yet.
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// EVENT STREAM PAGE
// =====================================================

function EventsPage({
  events,
  formatTime,
  getSeverity,
}) {
  const [filter, setFilter] =
    useState("ALL");

  const [search, setSearch] =
    useState("");

  const filteredEvents =
    events.filter((event) => {
      const eventId =
        event.eventid || "";

      let matchesFilter = true;

      if (filter === "LOGIN") {
        matchesFilter =
          eventId.includes("login");
      }

      if (filter === "COMMAND") {
        matchesFilter =
          eventId.includes("command");
      }

      if (filter === "SESSION") {
        matchesFilter =
          eventId.includes("session");
      }

      if (filter === "CLIENT") {
        matchesFilter =
          eventId.includes("client");
      }

      const searchText = `
        ${event.eventid || ""}
        ${event.src_ip || ""}
        ${event.message || ""}
        ${event.input || ""}
        ${event.session || ""}
      `.toLowerCase();

      return (
        matchesFilter &&
        searchText.includes(
          search.toLowerCase()
        )
      );
    });

  return (
    <div className="panel large-panel">
      <div className="panel-header">
        <div>
          <div className="panel-label">
            TELEMETRY STREAM
          </div>

          <h3>
            Captured Events
          </h3>
        </div>

        <div className="event-stream-status">
          <span className="live-dot"></span>

          <span>
            {filteredEvents.length}
            {" EVENTS"}
          </span>
        </div>
      </div>

      <div className="event-controls">
        <div className="event-search">
          <span>⌕</span>

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search IP, event, command..."
          />
        </div>

        <div className="event-filters">
          {[
            "ALL",
            "LOGIN",
            "COMMAND",
            "SESSION",
            "CLIENT",
          ].map((item) => (
            <button
              key={item}
              onClick={() =>
                setFilter(item)
              }
              className={
                filter === item
                  ? "event-filter active"
                  : "event-filter"
              }
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="event-summary">
        <div>
          <span>
            VISIBLE EVENTS
          </span>

          <strong>
            {filteredEvents.length}
          </strong>
        </div>

        <div>
          <span>SENSOR</span>

          <strong>
            COWRIE SSH
          </strong>
        </div>

        <div>
          <span>STATUS</span>

          <strong className="summary-online">
            ONLINE
          </strong>
        </div>
      </div>

      <div className="event-table">
        <div className="event-table-header">
          <span>TIME</span>
          <span>EVENT</span>
          <span>SOURCE IP</span>
          <span>SEVERITY</span>
          <span>MESSAGE</span>
        </div>

        {filteredEvents.map(
          (event, index) => {
            // Backend severity
            const severity =
              getSeverity(event);

            return (
              <div
                className="event-table-row"
                key={index}
              >
                <span className="event-time">
                  {formatTime(
                    event.timestamp
                  )}
                </span>

                <span className="event-type">
                  {event.eventid ||
                    "unknown"}
                </span>

                <span className="event-ip">
                  {event.src_ip ||
                    "-"}
                </span>

                <span>
                  <span
                    className={`severity-badge ${severity.toLowerCase()}`}
                  >
                    {severity}
                  </span>
                </span>

                <span className="event-message">
                  {event.message ||
                    event.input ||
                    "No message"}
                </span>
              </div>
            );
          }
        )}

        {!filteredEvents.length && (
          <div className="empty event-empty">
            No matching events found.
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// EVENT ROWS
// =====================================================

function EventRows({
  events,
  formatTime,
}) {
  if (!events.length) {
    return (
      <div className="empty">
        No events captured yet.
      </div>
    );
  }

  return (
    <div className="event-stream">
      {events.map(
        (event, index) => (
          <div
            className="event-row"
            key={index}
          >
            <span className="event-time">
              {formatTime(
                event.timestamp
              )}
            </span>

            <span className="event-type">
              {event.eventid ||
                "unknown"}
            </span>

            <span className="event-ip">
              {event.src_ip ||
                "-"}
            </span>

            <span className="event-message">
              {event.message ||
                event.input ||
                "No message"}
            </span>
          </div>
        )
      )}
    </div>
  );
}

// =====================================================
// EXPORT
// =====================================================

export default App;