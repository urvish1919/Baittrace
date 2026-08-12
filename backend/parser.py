import json
from pathlib import Path


LOG_FILE = Path("var/log/cowrie/cowrie.json")


# =========================================================
# READ COWRIE EVENTS
# =========================================================

def read_events():
    events = []

    if not LOG_FILE.exists():
        return events

    with LOG_FILE.open("r", encoding="utf-8") as file:
        for line in file:
            try:
                event = json.loads(line)
                events.append(event)
            except json.JSONDecodeError:
                continue

    return events


# =========================================================
# THREAT INTELLIGENCE
# =========================================================

CRITICAL_COMMANDS = [
    "rm -rf",
    "mkfs",
    "dd if=",
    "shutdown",
    "reboot",
    "poweroff",
    ":(){ :|:& };:",
]

HIGH_COMMANDS = [
    "wget",
    "curl",
    "chmod +x",
    "nc ",
    "netcat",
    "bash -i",
    "python -c",
    "python3 -c",
    "perl -e",
    "php -r",
    "ftp",
    "tftp",
]

MEDIUM_COMMANDS = [
    "whoami",
    "id",
    "uname",
    "hostname",
    "ifconfig",
    "ip addr",
    "ip route",
    "ps",
    "top",
    "env",
    "pwd",
    "ls",
    "cat /etc/passwd",
]


def calculate_severity(event):
    event_id = event.get("eventid", "")
    command = (event.get("input") or "").lower()

    # -----------------------------------------------------
    # CRITICAL
    # -----------------------------------------------------

    for dangerous_command in CRITICAL_COMMANDS:
        if dangerous_command in command:
            return "CRITICAL"

    # -----------------------------------------------------
    # HIGH
    # -----------------------------------------------------

    for dangerous_command in HIGH_COMMANDS:
        if dangerous_command in command:
            return "HIGH"

    if event_id == "cowrie.login.success":
        return "HIGH"

    # -----------------------------------------------------
    # MEDIUM
    # -----------------------------------------------------

    for command_pattern in MEDIUM_COMMANDS:
        if command_pattern in command:
            return "MEDIUM"

    if event_id == "cowrie.login.failed":
        return "MEDIUM"

    if event_id == "cowrie.command.failed":
        return "MEDIUM"

    if event_id == "cowrie.command.input":
        return "MEDIUM"

    # -----------------------------------------------------
    # LOW
    # -----------------------------------------------------

    return "LOW"


# =========================================================
# RISK SCORE
# =========================================================

def calculate_risk_score(events):
    score = 0

    failed_logins = 0
    successful_logins = 0
    commands = 0

    for event in events:

        event_id = event.get("eventid", "")
        command = (event.get("input") or "").lower()

        # -------------------------------------------------
        # LOGIN BEHAVIOR
        # -------------------------------------------------

        if event_id == "cowrie.login.failed":
            failed_logins += 1
            score += 5

        elif event_id == "cowrie.login.success":
            successful_logins += 1
            score += 25

        # -------------------------------------------------
        # COMMAND BEHAVIOR
        # -------------------------------------------------

        elif event_id == "cowrie.command.input":

            commands += 1

            # Every command gets a small base score
            score += 5

            # Dangerous command detection
            if any(
                pattern in command
                for pattern in CRITICAL_COMMANDS
            ):
                score += 40

            elif any(
                pattern in command
                for pattern in HIGH_COMMANDS
            ):
                score += 25

            elif any(
                pattern in command
                for pattern in MEDIUM_COMMANDS
            ):
                score += 10

        elif event_id == "cowrie.command.failed":
            score += 3

        elif event_id == "cowrie.session.connect":
            score += 1

    # -----------------------------------------------------
    # BRUTE FORCE DETECTION
    # -----------------------------------------------------

    if failed_logins >= 5:
        score += 15

    if failed_logins >= 10:
        score += 20

    # -----------------------------------------------------
    # SUCCESS AFTER FAILED LOGINS
    # -----------------------------------------------------

    if failed_logins >= 3 and successful_logins > 0:
        score += 20

    # -----------------------------------------------------
    # MANY COMMANDS
    # -----------------------------------------------------

    if commands >= 10:
        score += 10

    if commands >= 20:
        score += 15

    # -----------------------------------------------------
    # LIMIT SCORE
    # -----------------------------------------------------

    score = min(score, 100)

    return score


def calculate_risk_level(score):

    if score >= 80:
        return "CRITICAL"

    if score >= 60:
        return "HIGH"

    if score >= 30:
        return "MEDIUM"

    return "LOW"


# =========================================================
# EVENT SUMMARY
# =========================================================

def summarize_events(events):

    summary = {
        "total_events": len(events),
        "login_attempts": 0,
        "successful_logins": 0,
        "commands": 0,
        "failed_commands": 0,
        "unique_ips": set(),
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
    }

    for event in events:

        event_id = event.get("eventid")
        source_ip = event.get("src_ip")

        if source_ip:
            summary["unique_ips"].add(source_ip)

        # Login attempts
        if event_id in [
            "cowrie.login.failed",
            "cowrie.login.success",
        ]:
            summary["login_attempts"] += 1

        # Successful login
        if event_id == "cowrie.login.success":
            summary["successful_logins"] += 1

        # Commands
        elif event_id == "cowrie.command.input":
            summary["commands"] += 1

        # Failed commands
        elif event_id == "cowrie.command.failed":
            summary["failed_commands"] += 1

        # Severity
        severity = calculate_severity(event)

        summary[severity.lower()] += 1

    summary["unique_ips"] = len(summary["unique_ips"])

    return summary


# =========================================================
# TEST
# =========================================================

if __name__ == "__main__":

    events = read_events()

    summary = summarize_events(events)

    print("\n===== BAITTRACE ATTACK SUMMARY =====")

    print(f"Total events       : {summary['total_events']}")
    print(f"Login attempts     : {summary['login_attempts']}")
    print(f"Successful logins  : {summary['successful_logins']}")
    print(f"Commands executed  : {summary['commands']}")
    print(f"Failed commands    : {summary['failed_commands']}")
    print(f"Unique IPs         : {summary['unique_ips']}")

    print("\n----- SEVERITY -----")

    print(f"CRITICAL           : {summary['critical']}")
    print(f"HIGH               : {summary['high']}")
    print(f"MEDIUM             : {summary['medium']}")
    print(f"LOW                : {summary['low']}")

    print("====================================\n")