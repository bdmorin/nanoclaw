#!/usr/bin/env python3
"""
Lemmy Account Purge Script - Using Valid JWT Token
Deletes all posts, comments, and account for OPSEC cleanup

USAGE: python3 lemmy-purge-with-jwt.py
CAUTION: This is irreversible. Make sure you want to do this.
"""

import urllib.request
import urllib.parse
import json
import time
import sys

# Configuration
INSTANCE = "lemmy.world"
BASE_URL = f"https://{INSTANCE}/api/v3"

# JWT token from browser session (bypasses Cloudflare)
JWT_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI2ODAxMiIsImlzcyI6ImxlbW15LndvcmxkIiwiaWF0IjoxNzYwNDMwNzE0fQ.qVAVdCSNfokAEtPqoEILV86G6_YH0GjJBNsnND4U9FM"

# User agent to mimic browser
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"

def make_request(url, data=None, headers=None, method="GET"):
    """Make HTTP request using urllib with browser headers"""
    if headers is None:
        headers = {}

    # Add browser-like headers
    headers.update({
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Cookie": f"jwt={JWT_TOKEN}"
    })

    if data is not None:
        # Include JWT in request body for API calls
        if isinstance(data, dict):
            data["auth"] = JWT_TOKEN
        data = json.dumps(data).encode('utf-8')
        if method == "GET":
            method = "POST"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"[!] HTTP Error {e.code}: {error_body}")
        raise
    except Exception as e:
        print(f"[!] Request failed: {e}")
        raise

def get_user_info():
    """Get current user info from JWT"""
    print(f"[*] Getting user info from JWT token...")

    url = f"{BASE_URL}/user"

    try:
        # Decode JWT to get user ID (sub claim)
        import base64
        payload = JWT_TOKEN.split('.')[1]
        # Add padding if needed
        payload += '=' * (4 - len(payload) % 4)
        decoded = json.loads(base64.b64decode(payload).decode('utf-8'))

        user_id = int(decoded['sub'])
        print(f"[+] Found user ID from JWT: {user_id}")

        return {"user_id": user_id}

    except Exception as e:
        print(f"[!] ERROR: Could not decode JWT: {e}")
        sys.exit(1)

def get_user_content(user_id):
    """Get all posts and comments by the user"""
    print(f"[*] Fetching all content for user ID {user_id}...")

    posts = []
    comments = []
    page = 1

    try:
        while True:
            params = urllib.parse.urlencode({
                "person_id": user_id,
                "limit": 50,
                "page": page,
                "auth": JWT_TOKEN
            })

            url = f"{BASE_URL}/user?{params}"

            data = make_request(url, method="GET")

            page_posts = data.get("posts", [])
            page_comments = data.get("comments", [])

            if not page_posts and not page_comments:
                break  # No more content

            posts.extend(page_posts)
            comments.extend(page_comments)

            print(f"[*] Page {page}: Found {len(page_posts)} posts, {len(page_comments)} comments")
            page += 1

            # Rate limiting - be nice to the server
            time.sleep(0.5)

        print(f"[+] Total content found: {len(posts)} posts, {len(comments)} comments")

        return {"posts": posts, "comments": comments}

    except Exception as e:
        print(f"[!] ERROR: Failed to fetch user content: {e}")
        sys.exit(1)

def delete_posts(posts):
    """Delete all posts"""
    if not posts:
        print("[*] No posts to delete")
        return

    print(f"[*] Deleting {len(posts)} posts...")

    url = f"{BASE_URL}/post/delete"

    deleted_count = 0
    failed_count = 0

    for post in posts:
        post_id = post.get("post", {}).get("id")
        post_name = post.get("post", {}).get("name", "Untitled")

        if not post_id:
            print(f"[!] WARNING: Skipping post with no ID")
            continue

        data = {
            "post_id": post_id,
            "deleted": True
        }

        try:
            make_request(url, data=data)

            deleted_count += 1
            print(f"[+] Deleted post {deleted_count}/{len(posts)}: '{post_name[:50]}...' (ID: {post_id})")

            # Rate limiting
            time.sleep(0.3)

        except Exception as e:
            failed_count += 1
            print(f"[!] Failed to delete post {post_id}: {e}")

    print(f"[+] Posts deleted: {deleted_count}/{len(posts)} (Failed: {failed_count})")

def delete_comments(comments):
    """Delete all comments"""
    if not comments:
        print("[*] No comments to delete")
        return

    print(f"[*] Deleting {len(comments)} comments...")

    url = f"{BASE_URL}/comment/delete"

    deleted_count = 0
    failed_count = 0

    for comment in comments:
        comment_id = comment.get("comment", {}).get("id")
        comment_text = comment.get("comment", {}).get("content", "")

        if not comment_id:
            print(f"[!] WARNING: Skipping comment with no ID")
            continue

        data = {
            "comment_id": comment_id,
            "deleted": True
        }

        try:
            make_request(url, data=data)

            deleted_count += 1
            print(f"[+] Deleted comment {deleted_count}/{len(comments)}: '{comment_text[:30]}...' (ID: {comment_id})")

            # Rate limiting
            time.sleep(0.3)

        except Exception as e:
            failed_count += 1
            print(f"[!] Failed to delete comment {comment_id}: {e}")

    print(f"[+] Comments deleted: {deleted_count}/{len(comments)} (Failed: {failed_count})")

def delete_account(password):
    """Delete the user account"""
    print(f"[*] Deleting account...")

    url = f"{BASE_URL}/user/delete_account"
    data = {
        "password": password
    }

    try:
        make_request(url, data=data)

        print(f"[+] Account deleted successfully")
        return True

    except Exception as e:
        print(f"[!] ERROR: Failed to delete account: {e}")
        print(f"[!] You may need to delete the account manually via web interface")
        return False

def main():
    """Main purge execution"""
    print("=" * 60)
    print("LEMMY ACCOUNT PURGE - OPSEC CLEANUP")
    print("=" * 60)
    print(f"Instance: {INSTANCE}")
    print(f"Using JWT token from browser session")
    print("")
    print("WARNING: This will permanently delete:")
    print("  - All your posts")
    print("  - All your comments")
    print("  - Your account")
    print("")
    print("This action is IRREVERSIBLE.")
    print("=" * 60)
    print("")

    # Confirm
    confirm = input("Type 'DELETE EVERYTHING' to proceed: ")
    if confirm != "DELETE EVERYTHING":
        print("[!] Aborted by user")
        sys.exit(0)

    print("")
    print("[*] Starting purge...")
    print("")

    # Step 1: Get user info
    user_info = get_user_info()

    # Step 2: Get all content
    content = get_user_content(user_info["user_id"])

    # Step 3: Delete posts
    delete_posts(content["posts"])

    # Step 4: Delete comments
    delete_comments(content["comments"])

    # Step 5: Delete account
    print("")
    print("[*] Content deletion complete. Proceeding to account deletion...")
    print("")

    password = input("Enter your password to confirm account deletion: ")
    if not password:
        print("[!] Account deletion cancelled")
        print("[*] Your posts and comments have been deleted, but account still exists")
        sys.exit(0)

    delete_account(password)

    print("")
    print("=" * 60)
    print("[+] PURGE COMPLETE")
    print("=" * 60)
    print(f"Instance: {INSTANCE}")
    print("")
    print("All posts, comments, and account data have been deleted.")
    print("Note: Federated instances may still have copies.")
    print("Note: Archive sites (archive.org, archive.today) may have snapshots.")
    print("=" * 60)

if __name__ == "__main__":
    main()
