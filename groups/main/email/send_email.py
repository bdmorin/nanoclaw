#!/usr/bin/env python3
"""
Posteo Email Sender for oilcloth
Sends plain text, HTML, or reply emails via SMTP.

Usage:
    python3 send_email.py --to "addr" --subject "subj" --body "text"
    python3 send_email.py --to "addr" --subject "subj" --body "text" --html "<p>html</p>"
    python3 send_email.py --to "addr" --subject "subj" --body "text" --attach /path/to/file
    python3 send_email.py --reply-to "MSG-ID" --references "REFS" --to "addr" --subject "Re: subj" --body "text"
"""
import os, sys, argparse, smtplib, email.utils
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

SMTP_HOST = os.environ.get("POSTEO_SMTP_HOST", "posteo.de")
USER = os.environ.get("POSTEO_USER", "oilcloth@posteo.us")
PASSWORD = os.environ["POSTEO_PASSWORD"]

def send(to, subject, body, html=None, cc=None, bcc=None,
         attachments=None, reply_to_msgid=None, references=None):
    """
    Send an email via Posteo SMTP.

    Args:
        to: recipient address or list of addresses
        subject: email subject
        body: plain text body (required)
        html: optional HTML body
        cc: CC addresses (str or list)
        bcc: BCC addresses (str or list)
        attachments: list of file paths to attach
        reply_to_msgid: Message-ID being replied to (for threading)
        references: References header from original (for threading)

    Returns:
        dict with message_id and status
    """
    if isinstance(to, str):
        to = [to]
    if isinstance(cc, str):
        cc = [cc]
    if isinstance(bcc, str):
        bcc = [bcc]

    has_attachments = attachments and len(attachments) > 0
    has_html = html is not None

    # Build message structure
    if has_attachments:
        msg = MIMEMultipart("mixed")
        if has_html:
            body_part = MIMEMultipart("alternative")
            body_part.attach(MIMEText(body, "plain", "utf-8"))
            body_part.attach(MIMEText(html, "html", "utf-8"))
            msg.attach(body_part)
        else:
            msg.attach(MIMEText(body, "plain", "utf-8"))

        for filepath in attachments:
            with open(filepath, "rb") as f:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(f.read())
            encoders.encode_base64(part)
            filename = os.path.basename(filepath)
            part.add_header("Content-Disposition", f"attachment; filename=\"{filename}\"")
            msg.attach(part)

    elif has_html:
        msg = MIMEMultipart("alternative")
        msg.attach(MIMEText(body, "plain", "utf-8"))
        msg.attach(MIMEText(html, "html", "utf-8"))
    else:
        msg = MIMEText(body, "plain", "utf-8")

    # Headers
    msg_id = email.utils.make_msgid(domain="posteo.us")
    msg["Message-ID"] = msg_id
    msg["From"] = f"oilcloth <{USER}>"
    msg["To"] = ", ".join(to)
    msg["Subject"] = subject
    msg["Date"] = email.utils.formatdate(localtime=True)

    if cc:
        msg["Cc"] = ", ".join(cc)
    if reply_to_msgid:
        msg["In-Reply-To"] = reply_to_msgid
    if references:
        msg["References"] = f"{references} {reply_to_msgid}".strip() if reply_to_msgid else references

    # All recipients for envelope
    all_recipients = list(to)
    if cc:
        all_recipients.extend(cc)
    if bcc:
        all_recipients.extend(bcc)

    # Send
    with smtplib.SMTP(SMTP_HOST, 587) as server:
        server.starttls()
        server.login(USER, PASSWORD)
        server.send_message(msg, to_addrs=all_recipients)

    return {"message_id": msg_id, "status": "sent", "to": to, "subject": subject}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Send email via Posteo")
    parser.add_argument("--to", required=True, help="Recipient address(es), comma-separated")
    parser.add_argument("--subject", required=True, help="Email subject")
    parser.add_argument("--body", required=True, help="Plain text body")
    parser.add_argument("--html", help="HTML body (optional)")
    parser.add_argument("--cc", help="CC addresses, comma-separated")
    parser.add_argument("--bcc", help="BCC addresses, comma-separated")
    parser.add_argument("--attach", nargs="*", help="File paths to attach")
    parser.add_argument("--reply-to", dest="reply_to", help="Message-ID to reply to")
    parser.add_argument("--references", help="References header for threading")

    args = parser.parse_args()

    to_list = [a.strip() for a in args.to.split(",")]
    cc_list = [a.strip() for a in args.cc.split(",")] if args.cc else None
    bcc_list = [a.strip() for a in args.bcc.split(",")] if args.bcc else None

    result = send(
        to=to_list,
        subject=args.subject,
        body=args.body,
        html=args.html,
        cc=cc_list,
        bcc=bcc_list,
        attachments=args.attach,
        reply_to_msgid=args.reply_to,
        references=args.references,
    )

    print(f"Sent: {result['message_id']}")
    print(f"To: {', '.join(result['to'])}")
    print(f"Subject: {result['subject']}")
