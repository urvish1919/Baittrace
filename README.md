# BaitTrace — Honeypot Threat Intelligence Dashboard

BaitTrace is a live security monitoring platform built around an SSH/Telnet honeypot. It captures real attacker behavior — login attempts, credentials tried, and commands executed — and turns raw honeypot logs into a real-time threat intelligence dashboard.

A honeypot is a decoy system with no legitimate purpose, so any connection to it is inherently suspicious. This makes it a clean, high-signal way to observe how real attackers on the internet actually behave: what credentials they try first, what tools they attempt to download, and how they move once "inside."

## Why this project

Most fresher security projects stop at running an existing tool and reading its output. BaitTrace goes further — it's a full pipeline from raw sensor data to a usable SOC-style dashboard:

**Honeypot (Cowrie)** → **Log parsing & severity scoring** → **FastAPI backend** → **React dashboard**

## Features

- **Live Dashboard** — real-time overview of login attempts, successful logins, commands run, failed commands, unique attacker IPs, and total events
- **Threat Analysis** — automatic severity classification (Critical / High / Medium / Low) based on command patterns and login behavior
- **Attacker Intelligence** — per-IP breakdown with risk scoring, first/last seen timestamps, and full activity history
- **Command Monitoring** — every command an attacker executed inside the fake shell
- **Login Activity** — every username/password combination attempted, with success/failure status
- **Event Stream** — full searchable, filterable raw telemetry feed
- **Risk Scoring Engine** — weighted scoring system that flags brute-force patterns, dangerous command usage (e.g. `wget`, `curl`, `rm -rf`), and privilege escalation attempts

## Architecture

```
Internet Attacker
      │
      ▼
Cowrie Honeypot (fake SSH/Telnet server)
      │  writes JSON event logs
      ▼
Python Log Parser  (severity + risk scoring)
      │
      ▼
FastAPI Backend   (REST API)
      │
      ▼
React Dashboard   (live, auto-refreshing UI)
```

## Tech Stack

- **Honeypot:** [Cowrie](https://github.com/cowrie/cowrie) (SSH/Telnet)
- **Backend:** Python, FastAPI
- **Frontend:** React, Vite
- **Data:** Structured JSON event logs, parsed and scored server-side

## Severity & Risk Scoring

Events are classified using pattern-based rules:

| Severity | Examples |
|---|---|
| **Critical** | `rm -rf`, `mkfs`, `shutdown`, fork bombs |
| **High** | `wget`, `curl`, `chmod +x`, reverse shells, successful logins |
| **Medium** | `whoami`, `cat /etc/passwd`, failed logins, failed commands |
| **Low** | Session connect/disconnect, benign telemetry |

A weighted risk score (0–100) is also calculated per attacker, factoring in brute-force patterns (repeated failed logins), successful login after multiple failures, and volume of commands executed.

## Running Locally

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Honeypot (Cowrie):**
Follow the [official Cowrie installation guide](https://docs.cowrie.org/en/latest/INSTALL.html). Point the backend's `LOG_FILE` path in `backend/parser.py` to your local Cowrie JSON log.

## Demo Data

`generate_demo_data.py` generates realistic, fully synthetic attacker activity (fake IPs, common attacker credential patterns, common post-exploitation commands) in Cowrie's log format — useful for demoing the dashboard without waiting for live traffic:

```bash
python3 generate_demo_data.py
```

> Note: This is clearly-labeled synthetic data for demonstration purposes only. In production, this dashboard displays genuine attacker activity captured by a publicly-deployed Cowrie honeypot.

## Roadmap

- [ ] Deploy honeypot to a public cloud VM to capture real internet attack traffic
- [ ] AI-powered attack classification and plain-English session summaries
- [ ] Real-time alerting (Discord/Telegram webhook) on high-risk events
- [ ] Full-text searchable attack history
- [ ] Geo-mapping of attacker origins

## Disclaimer

This project is for educational and portfolio purposes. The honeypot is designed to be isolated from any production or personal systems, and only ever runs on dedicated, disposable infrastructure.
