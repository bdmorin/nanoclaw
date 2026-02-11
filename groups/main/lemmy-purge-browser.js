/**
 * Lemmy Account Purge - Browser Console Script
 *
 * INSTRUCTIONS:
 * 1. Log into lemmy.world in your browser
 * 2. Open browser DevTools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter
 *
 * This will delete all your posts, comments, and account.
 * IRREVERSIBLE - Make sure you want this!
 */

(async function() {
    const INSTANCE = "lemmy.world";
    const BASE_URL = `https://${INSTANCE}/api/v3`;

    // Get auth token from localStorage (browser session)
    const auth = localStorage.getItem("jwt");

    if (!auth) {
        console.error("[!] ERROR: Not logged in. Please log into lemmy.world first.");
        return;
    }

    console.log("[+] Found auth token from browser session");
    console.log("");
    console.log("=" + "=".repeat(60));
    console.log("LEMMY ACCOUNT PURGE - OPSEC CLEANUP");
    console.log("=" + "=".repeat(60));
    console.log("");

    const confirmed = confirm(
        "WARNING: This will PERMANENTLY delete:\n" +
        "- All your posts\n" +
        "- All your comments\n" +
        "- Your account\n\n" +
        "This is IRREVERSIBLE.\n\n" +
        "Click OK to proceed, Cancel to abort."
    );

    if (!confirmed) {
        console.log("[!] Aborted by user");
        return;
    }

    console.log("[*] Starting purge...");
    console.log("");

    /**
     * Make API request using browser's fetch
     */
    async function apiRequest(endpoint, data = null, method = "GET") {
        const url = `${BASE_URL}${endpoint}`;

        const options = {
            method: data ? "POST" : method,
            headers: {
                "Content-Type": "application/json"
            }
        };

        if (data) {
            options.body = JSON.stringify({...data, auth});
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }

        return await response.json();
    }

    /**
     * Get all user content (posts and comments)
     */
    async function getUserContent() {
        console.log("[*] Fetching all content...");

        const posts = [];
        const comments = [];
        let page = 1;
        let personId = null;

        while (true) {
            const data = await apiRequest(
                `/user?username=${encodeURIComponent(localStorage.getItem("username") || "")}&page=${page}&limit=50`
            );

            if (page === 1) {
                personId = data.person_view?.person?.id;
                console.log(`[+] Found user ID: ${personId}`);
            }

            const pagePosts = data.posts || [];
            const pageComments = data.comments || [];

            if (pagePosts.length === 0 && pageComments.length === 0) {
                break;
            }

            posts.push(...pagePosts);
            comments.push(...pageComments);

            console.log(`[*] Page ${page}: Found ${pagePosts.length} posts, ${pageComments.length} comments`);
            page++;

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`[+] Total content found: ${posts.length} posts, ${comments.length} comments`);
        console.log("");

        return {posts, comments, personId};
    }

    /**
     * Delete all posts
     */
    async function deletePosts(posts) {
        if (posts.length === 0) {
            console.log("[*] No posts to delete");
            return;
        }

        console.log(`[*] Deleting ${posts.length} posts...`);

        let deleted = 0;
        let failed = 0;

        for (const post of posts) {
            const postId = post.post?.id;
            const postName = post.post?.name || "Untitled";

            if (!postId) {
                console.log("[!] WARNING: Skipping post with no ID");
                continue;
            }

            try {
                await apiRequest("/post/delete", {
                    post_id: postId,
                    deleted: true
                });

                deleted++;
                console.log(`[+] Deleted post ${deleted}/${posts.length}: '${postName.substring(0, 50)}...' (ID: ${postId})`);

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 300));

            } catch (error) {
                failed++;
                console.log(`[!] Failed to delete post ${postId}: ${error.message}`);
            }
        }

        console.log(`[+] Posts deleted: ${deleted}/${posts.length} (Failed: ${failed})`);
        console.log("");
    }

    /**
     * Delete all comments
     */
    async function deleteComments(comments) {
        if (comments.length === 0) {
            console.log("[*] No comments to delete");
            return;
        }

        console.log(`[*] Deleting ${comments.length} comments...`);

        let deleted = 0;
        let failed = 0;

        for (const comment of comments) {
            const commentId = comment.comment?.id;
            const commentText = comment.comment?.content || "";

            if (!commentId) {
                console.log("[!] WARNING: Skipping comment with no ID");
                continue;
            }

            try {
                await apiRequest("/comment/delete", {
                    comment_id: commentId,
                    deleted: true
                });

                deleted++;
                console.log(`[+] Deleted comment ${deleted}/${comments.length}: '${commentText.substring(0, 30)}...' (ID: ${commentId})`);

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 300));

            } catch (error) {
                failed++;
                console.log(`[!] Failed to delete comment ${commentId}: ${error.message}`);
            }
        }

        console.log(`[+] Comments deleted: ${deleted}/${comments.length} (Failed: ${failed})`);
        console.log("");
    }

    /**
     * Delete account
     */
    async function deleteAccount() {
        console.log("[*] Content deletion complete. Ready to delete account...");
        console.log("");

        const password = prompt("Enter your password to confirm account deletion:");

        if (!password) {
            console.log("[!] Account deletion cancelled");
            console.log("[*] Your posts and comments have been deleted, but account still exists");
            return false;
        }

        console.log("[*] Deleting account...");

        try {
            await apiRequest("/user/delete_account", {password});

            console.log("[+] Account deleted successfully");
            return true;

        } catch (error) {
            console.log(`[!] ERROR: Failed to delete account: ${error.message}`);
            console.log("[!] You may need to delete manually via Settings page");
            return false;
        }
    }

    /**
     * Main execution
     */
    try {
        // Step 1: Get all content
        const {posts, comments, personId} = await getUserContent();

        // Step 2: Delete posts
        await deletePosts(posts);

        // Step 3: Delete comments
        await deleteComments(comments);

        // Step 4: Delete account
        const accountDeleted = await deleteAccount();

        // Summary
        console.log("");
        console.log("=" + "=".repeat(60));
        console.log("[+] PURGE COMPLETE");
        console.log("=" + "=".repeat(60));
        console.log("");
        console.log("All posts and comments have been deleted.");
        if (accountDeleted) {
            console.log("Account has been deleted.");
            console.log("");
            console.log("You will be logged out shortly.");

            // Clear local storage
            localStorage.clear();
            sessionStorage.clear();

            // Redirect to home
            setTimeout(() => {
                window.location.href = "/";
            }, 2000);
        } else {
            console.log("Account still exists - delete manually if needed.");
        }
        console.log("");
        console.log("Note: Federated instances may still have copies.");
        console.log("Note: Archive sites may have snapshots.");
        console.log("=" + "=".repeat(60));

    } catch (error) {
        console.error("[!] FATAL ERROR:", error);
        console.error("[!] Purge incomplete. Some content may remain.");
    }

})();
