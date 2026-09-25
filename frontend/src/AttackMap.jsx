import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Matches your existing severity-badge colors from App.css
const RISK_COLORS = {
  CRITICAL: "#ff4757",
  HIGH: "#ff7b54",
  MEDIUM: "#e8b84b",
  LOW: "#36d69a",
};

function riskColor(level) {
  return RISK_COLORS[String(level || "LOW").toUpperCase()] || RISK_COLORS.LOW;
}

function AttackMap() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchMapData() {
    try {
      const res = await fetch(`${API}/api/attack-map`);
      if (res.ok) {
        setPoints(await res.json());
      }
    } catch (error) {
      console.error("Attack map fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMapData();
    const interval = setInterval(fetchMapData, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="panel large-panel">
      <div className="panel-header">
        <div>
          <div className="panel-label">GEOGRAPHIC INTELLIGENCE</div>
          <h3>Live Attacker Map</h3>
        </div>
        <span className="event-count">{points.length} sources located</span>
      </div>

      <div style={{ padding: "0 0 4px 0", fontSize: "12px", color: "#7d93a6" }}>
        Locations are approximate (city/country-level, via IP geolocation).
        Attackers using VPNs/Tor will show the proxy's location, not their true origin.
      </div>

      <div
        className="dark-map-wrapper"
        style={{
          height: "480px",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #172530",
        }}
      >
        {!loading && (
          <MapContainer
            center={[20, 10]}
            zoom={2}
            minZoom={2}
            style={{ height: "100%", width: "100%", background: "#071018" }}
            worldCopyJump
          >
            {/* Standard OpenStreetMap tiles - always free, no API key, ever.
                We fake a dark theme with CSS filters below (see <style> tag),
                since free no-key dark tile providers keep changing their policies. */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {points.map((point) => (
              <CircleMarker
                key={point.ip}
                center={[point.lat, point.lon]}
                radius={6 + Math.min(point.risk_score / 10, 8)}
                pathOptions={{
                  color: riskColor(point.risk_level),
                  fillColor: riskColor(point.risk_level),
                  fillOpacity: 0.6,
                  weight: 1.5,
                }}
              >
                <Popup>
                  <strong>{point.ip}</strong>
                  <br />
                  {point.city ? `${point.city}, ` : ""}
                  {point.country || "Unknown location"}
                  <br />
                  ISP: {point.isp || "Unknown"}
                  <br />
                  Risk: {point.risk_level} ({point.risk_score})
                  <br />
                  Events: {point.events}
                  <br />
                  Last seen: {point.last_seen || "-"}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Dark-mode trick: invert the map tiles' colors, then invert the
          markers/popups back to normal so their real colors still show
          correctly. This avoids relying on any paid/key-gated dark tile
          provider, which can change their free-tier policy anytime. */}
      <style>{`
        .dark-map-wrapper .leaflet-tile-pane {
          filter: invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.9);
        }
        .dark-map-wrapper .leaflet-overlay-pane,
        .dark-map-wrapper .leaflet-marker-pane,
        .dark-map-wrapper .leaflet-popup {
          filter: invert(1) hue-rotate(180deg);
        }
        .dark-map-wrapper .leaflet-control-zoom a {
          background-color: #0e1a24;
          color: #e8f0f7;
          border-color: #172530;
        }
      `}</style>

      {points.length === 0 && !loading && (
        <div className="empty" style={{ marginTop: "12px" }}>
          No located attackers yet — real attacker IPs will appear here as your honeypot captures them.
        </div>
      )}
    </div>
  );
}

export default AttackMap;