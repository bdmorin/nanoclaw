#!/usr/bin/env python3
"""
Lemmy Account Purge Script
Deletes all posts, comments, and account for OPSEC cleanup

USAGE: python3 lemmy-purge.py
CAUTION: This is irreversible. Make sure you want to do this.
"""

import urllib.request
import urllib.parse
import json
import time
import sys

# Configuration
INSTANCE = "lemmy.world"
USERNAME = "cyberflunk"
PASSWORD = "smell INKHORN once prayer"
BASE_URL = f"https://{INSTANCE}/api/v3"

def make_request(url, data=None, headers=None, method="GET"):
    """Make HTTP request using urllib"""
    if headers is None:
        headers = {"Content-Type": "application/json"}

    if data is not None:
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

def login():
    """Authenticate and get JWT token"""
    print(f"[*] Logging into {INSTANCE} as {USERNAME}...")

    url = f"{BASE_URL}/user/login"
    data = {
        "username_or_email": USERNAME,
        "password": PASSWORD
    }

    try:
        result = make_request(url, data=data)
        jwt = result.get("jwt")

        if not jwt:
            print(f"[!] ERROR: Login failed. Response: {result}")
            sys.exit(1)

        print(f"[+] Login successful. JWT obtained.")
        return jwt

    except Exception as e:
        print(f"[!] ERROR: Login failed: {e}")
        sys.exit(1)

def get_user_content(jwt):
    """Get all posts and comments by the user"""
    print(f"[*] Fetching all content for user {USERNAME}...")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwt}"
    }

    # Start with page 1
    posts = []
    comments = []
    page = 1
    user_id = None

    try:
        while True:
            params = urllib.parse.urlencode({
                "username": USERNAME,
                "limit": 50,
                "page": page
            })

            url = f"{BASE_URL}/user?{params}"

            data = make_request(url, headers=headers, method="GET")

            # Get user ID from first page
            if page == 1:
                person_view = data.get("person_view", {})
                person = person_view.get("person", {})
                user_id = person.get("id")

                if not user_id:
                    print(f"[!] ERROR: Could not find user ID. Response: {data}")
                    sys.exit(1)

                print(f"[+] Found user ID: {user_id}")

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

        return {"posts": posts, "comments": comments, "user_id": user_id}

    except Exception as e:
        print(f"[!] ERROR: Failed to fetch user content: {e}")
        sys.exit(1)

def delete_posts(jwt, posts):
    """Delete all posts"""
    if not posts:
        print("[*] No posts to delete")
        return

    print(f"[*] Deleting {len(posts)} posts...")

    url = f"{BASE_URL}/post/delete"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwt}"
    }

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
            make_request(url, data=data, headers=headers)

            deleted_count += 1
            print(f"[+] Deleted post {deleted_count}/{len(posts)}: '{post_name[:50]}...' (ID: {post_id})")

            # Rate limiting
            time.sleep(0.3)

        except Exception as e:
            failed_count += 1
            print(f"[!] Failed to delete post {post_id}: {e}")

    print(f"[+] Posts deleted: {deleted_count}/{len(posts)} (Failed: {failed_count})")

def delete_comments(jwt, comments):
    """Delete all comments"""
    if not comments:
        print("[*] No comments to delete")
        return

    print(f"[*] Deleting {len(comments)} comments...")

    url = f"{BASE_URL}/comment/delete"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwt}"
    }

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
            make_request(url, data=data, headers=headers)

            deleted_count += 1
            print(f"[+] Deleted comment {deleted_count}/{len(comments)}: '{comment_text[:30]}...' (ID: {comment_id})")

            # Rate limiting
            time.sleep(0.3)

        except Exception as e:
            failed_count += 1
            print(f"[!] Failed to delete comment {comment_id}: {e}")

    print(f"[+] Comments deleted: {deleted_count}/{len(comments)} (Failed: {failed_count})")

def delete_account(jwt):
    """Delete the user account"""
    print(f"[*] Deleting account {USERNAME}...")

    url = f"{BASE_URL}/user/delete_account"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwt}"
    }
    data = {
        "password": PASSWORD
    }

    try:
        make_request(url, data=data, headers=headers)

        print(f"[+] Account {USERNAME} deleted successfully")
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
    print(f"Username: {USERNAME}")
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

    # Step 1: Login
    jwt = login()

    # Step 2: Get all content
    content = get_user_content(jwt)

    # Step 3: Delete posts
    delete_posts(jwt, content["posts"])

    # Step 4: Delete comments
    delete_comments(jwt, content["comments"])

    # Step 5: Delete account
    print("")
    print("[*] Content deletion complete. Proceeding to account deletion...")
    print("")

    final_confirm = input("Type 'DELETE ACCOUNT' to delete your account: ")
    if final_confirm != "DELETE ACCOUNT":
        print("[!] Account deletion skipped")
        print("[*] Your posts and comments have been deleted, but account still exists")
        sys.exit(0)

    delete_account(jwt)

    print("")
    print("=" * 60)
    print("[+] PURGE COMPLETE")
    print("=" * 60)
    print(f"Instance: {INSTANCE}")
    print(f"Username: {USERNAME}")
    print("")
    print("All posts, comments, and account data have been deleted.")
    print("Note: Federated instances may still have copies.")
    print("Note: Archive sites (archive.org, archive.today) may have snapshots.")
    print("=" * 60)

if __name__ == "__main__":
    main()
