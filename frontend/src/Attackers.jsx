import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function Attackers() {
  const [attackers, setAttackers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAttackers = async () => {
    try {
      const response = await fetch(`${API}/api/attackers`);
      const data = await response.json();
      setAttackers(data);
    } catch (error) {
      console.error("Failed to fetch attackers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttackers();

    const interval = setInterval(fetchAttackers, 5000);

    return () => clearInterval(interval);
  }, []);

  const getRisk = (attacker) => {
    if (
      attacker.successful_logins >= 2 ||
      attacker.commands >= 5 ||
      attacker.failed_commands >= 5
    ) {
      return "CRITICAL";
    }

    if (
      attacker.successful_logins >= 1 ||
      attacker.commands >= 1 ||
      attacker.failed_commands >= 1
    ) {
      return "HIGH";
    }

    if (attacker.events >= 5) {
      return "MEDIUM";
    }

    return "LOW";
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="eyebrow">NETWORK INTELLIGENCE</div>

          <h2>Detected Attackers</h2>

          <p className="subtitle">
            IP addresses identified through activity captured by the BaitTrace
            honeypot.
          </p>
        </div>

        <div className="live">
          <span className="live-dot"></span>
          LIVE
          <span className="refresh">Auto refresh: 5s</span>
        </div>
      </div>

      <div className="page-stats">
        <div className="mini-card">
          <span>UNIQUE ATTACKERS</span>
          <strong>{attackers.length}</strong>
        </div>

        <div className="mini-card">
          <span>TOTAL EVENTS</span>
          <strong>
            {attackers.reduce(
              (total, attacker) => total + (attacker.events || 0),
              0
            )}
          </strong>
        </div>

        <div className="mini-card">
          <span>SUCCESSFUL LOGINS</span>
          <strong>
            {attackers.reduce(
              (total, attacker) =>
                total + (attacker.successful_logins || 0),
              0
            )}
          </strong>
        </div>

        <div className="mini-card danger-mini">
          <span>HIGH RISK</span>
          <strong>
            {
              attackers.filter(
                (attacker) =>
                  getRisk(attacker) === "HIGH" ||
                  getRisk(attacker) === "CRITICAL"
              ).length
            }
          </strong>
        </div>
      </div>

      <div className="panel large-panel">
        <div className="panel-header">
          <div>
            <div className="panel-label">THREAT SOURCES</div>
            <h3>Attacker Intelligence</h3>
          </div>

          <span className="event-count">
            {attackers.length} source{attackers.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="empty">
            Loading attacker intelligence...
          </div>
        ) : attackers.length === 0 ? (
          <div className="empty">
            No attackers detected yet.
          </div>
        ) : (
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
                  <th>FIRST SEEN</th>
                  <th>LAST SEEN</th>
                  <th>RISK</th>
                </tr>
              </thead>

              <tbody>
                {attackers.map((attacker, index) => {
                  const risk = getRisk(attacker);

                  return (
                    <tr key={`${attacker.ip}-${index}`}>
                      <td className="ip">{attacker.ip}</td>

                      <td>{attacker.events}</td>

                      <td>{attacker.logins}</td>

                      <td>{attacker.successful_logins}</td>

                      <td>{attacker.commands}</td>

                      <td>{attacker.failed_commands}</td>

                      <td>{formatDate(attacker.first_seen)}</td>

                      <td>{formatDate(attacker.last_seen)}</td>

                      <td>
                        <span
                          className={
                            risk === "CRITICAL" || risk === "HIGH"
                              ? "danger-badge"
                              : risk === "MEDIUM"
                              ? "medium-badge"
                              : "safe-badge"
                          }
                        >
                          {risk}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-label">INVESTIGATION</div>
            <h3>Security Assessment</h3>
          </div>
        </div>

        <div className="assessment-grid">
          <div>
            <span>Detection Source</span>
            <strong>Cowrie SSH Honeypot</strong>
          </div>

          <div>
            <span>Protocol</span>
            <strong>SSH</strong>
          </div>

          <div>
            <span>Honeypot Port</span>
            <strong>2222</strong>
          </div>

          <div>
            <span>Monitoring</span>
            <strong className="online-text">ACTIVE</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Attackers;