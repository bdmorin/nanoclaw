#!/usr/bin/env python3
"""
Posteo Email Checker for oilcloth
Connects to IMAP, fetches unseen messages, outputs summary.
State persisted to email_state.json between runs.

Usage:
    python3 check_email.py              # Check for new unread emails
    python3 check_email.py --all        # List all recent emails (last 7 days)
    python3 check_email.py --count      # Just count unread
    python3 check_email.py --read UID   # Read a specific email by UID
"""
import os, sys, json, datetime
from imap_tools import MailBox, AND, OR, MailMessageFlags

IMAP_HOST = os.environ.get("POSTEO_IMAP_HOST", "posteo.de")
USER = os.environ.get("POSTEO_USER", "oilcloth@posteo.us")
PASSWORD = os.environ["POSTEO_PASSWORD"]
STATE_FILE = "/workspace/group/email/email_state.json"

def load_state():
    try:
        with open(STATE_FILE) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"processed_uids": [], "uidvalidity": None, "last_check": None}

def save_state(state):
    state["last_check"] = datetime.datetime.utcnow().isoformat() + "Z"
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)

def check_new():
    """Check for new unseen emails. Returns list of message summaries."""
    state = load_state()
    results = []

    with MailBox(IMAP_HOST).login(USER, PASSWORD, "INBOX") as mailbox:
        status = mailbox.folder.status("INBOX")
        current_validity = status.get("UIDVALIDITY")

        if state["uidvalidity"] and current_validity != state["uidvalidity"]:
            print("[!] UIDVALIDITY changed — resetting state")
            state["processed_uids"] = []

        state["uidvalidity"] = current_validity

        for msg in mailbox.fetch(AND(seen=False), mark_seen=False, bulk=True):
            results.append({
                "uid": msg.uid,
                "from": msg.from_,
                "from_name": msg.from_values.name if msg.from_values else "",
                "to": msg.to,
                "subject": msg.subject,
                "date": str(msg.date),
                "text_preview": (msg.text or "")[:500],
                "has_html": bool(msg.html),
                "attachments": [
                    {"filename": a.filename, "size": a.size, "type": a.content_type}
                    for a in msg.attachments
                ],
            })

        save_state(state)

    return results

def count_unread():
    """Count unread emails without fetching."""
    with MailBox(IMAP_HOST).login(USER, PASSWORD, "INBOX") as mailbox:
        count = 0
        for _ in mailbox.fetch(AND(seen=False), headers_only=True, bulk=True):
            count += 1
        return count

def list_recent(days=7):
    """List all emails from the last N days."""
    since = datetime.date.today() - datetime.timedelta(days=days)
    results = []

    with MailBox(IMAP_HOST).login(USER, PASSWORD, "INBOX") as mailbox:
        for msg in mailbox.fetch(AND(date_gte=since), mark_seen=False, bulk=True):
            results.append({
                "uid": msg.uid,
                "from": msg.from_,
                "subject": msg.subject,
                "date": str(msg.date),
                "seen": msg.flags and "\\Seen" in msg.flags,
                "text_preview": (msg.text or "")[:200],
            })

    return results

def read_email(uid):
    """Read a specific email by UID. Returns full content."""
    with MailBox(IMAP_HOST).login(USER, PASSWORD, "INBOX") as mailbox:
        for msg in mailbox.fetch(AND(uid=uid), mark_seen=True, bulk=True):
            return {
                "uid": msg.uid,
                "from": msg.from_,
                "from_name": msg.from_values.name if msg.from_values else "",
                "to": msg.to,
                "cc": msg.cc,
                "subject": msg.subject,
                "date": str(msg.date),
                "text": msg.text or "",
                "html": msg.html or "",
                "headers": {
                    "message_id": msg.headers.get("message-id", [None])[0],
                    "in_reply_to": msg.headers.get("in-reply-to", [None])[0],
                    "references": msg.headers.get("references", [None])[0],
                },
                "attachments": [
                    {"filename": a.filename, "size": a.size, "type": a.content_type}
                    for a in msg.attachments
                ],
            }
    return None

def mark_processed(uids):
    """Mark specific UIDs as seen/processed."""
    state = load_state()

    with MailBox(IMAP_HOST).login(USER, PASSWORD, "INBOX") as mailbox:
        mailbox.flag(uids, MailMessageFlags.SEEN, True)
        for uid in uids:
            if uid not in state["processed_uids"]:
                state["processed_uids"].append(uid)

    # Keep only last 1000 UIDs
    state["processed_uids"] = state["processed_uids"][-1000:]
    save_state(state)

if __name__ == "__main__":
    args = sys.argv[1:]

    if "--count" in args:
        n = count_unread()
        print(f"Unread: {n}")

    elif "--all" in args:
        days = 7
        for i, a in enumerate(args):
            if a == "--days" and i + 1 < len(args):
                days = int(args[i + 1])
        msgs = list_recent(days)
        print(f"Last {days} days: {len(msgs)} emails")
        for m in msgs:
            flag = "  " if m["seen"] else "* "
            print(f"  {flag}[{m['uid']}] {m['date'][:16]} | {m['from'][:30]:30s} | {m['subject'][:50]}")

    elif "--read" in args:
        idx = args.index("--read")
        if idx + 1 < len(args):
            uid = args[idx + 1]
            msg = read_email(uid)
            if msg:
                print(f"From: {msg['from_name']} <{msg['from']}>")
                print(f"To: {', '.join(msg['to'])}")
                if msg['cc']:
                    print(f"CC: {', '.join(msg['cc'])}")
                print(f"Date: {msg['date']}")
                print(f"Subject: {msg['subject']}")
                print(f"Message-ID: {msg['headers']['message_id']}")
                print(f"Attachments: {len(msg['attachments'])}")
                print("---")
                print(msg['text'] or "[HTML only - no plain text body]")
            else:
                print(f"No email found with UID {uid}")
        else:
            print("Usage: --read UID")

    else:
        msgs = check_new()
        if msgs:
            print(f"New emails: {len(msgs)}")
            for m in msgs:
                att_info = f" [{len(m['attachments'])} attachments]" if m['attachments'] else ""
                print(f"  * [{m['uid']}] {m['date'][:16]} | {m['from'][:30]:30s} | {m['subject'][:50]}{att_info}")
                if m['text_preview']:
                    preview = m['text_preview'].replace('\n', ' ')[:100]
                    print(f"    Preview: {preview}...")
        else:
            print("No new emails.")
