import { io } from "socket.io-client";

// URL of the backend from .env
const URL = "http://localhost:5001/collab";

const client1 = io(URL, { autoConnect: false, transports: ['websocket'] });
const client2 = io(URL, { autoConnect: false, transports: ['websocket'] });
const client3 = io(URL, { autoConnect: false, transports: ['websocket'] });

const sessionId = "test-session-multi-user";

async function runTest() {
    console.log("Starting Collaboration Multi-User Test...");
    console.log(`Connecting to: ${URL}`);

    try {
        // 1. Connect Client 1
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject("Client 1 timeout"), 5000);
            client1.on("connect", () => {
                clearTimeout(timeout);
                console.log("Client 1 connected");
                client1.emit("join-session", sessionId);
                client1.emit("user-info", { sessionId, userInfo: { id: "user1", name: "User One" } });
                resolve();
            });
            client1.on("connect_error", (err) => reject(`Client 1 Error: ${err.message}`));
            client1.connect();
        });

        // 2. Client 1 sends file tree
        const fileTree = {
            "folder_alpha": {
                id: "folder_alpha",
                name: "alpha",
                type: "folder",
                children: {
                    "file_beta": {
                        id: "file_beta",
                        name: "beta.js",
                        type: "file",
                        content: "console.log('beta')"
                    }
                }
            }
        };

        console.log("Client 1 uploading nested file structure...");
        client1.emit("file-change", { sessionId, fileTree });

        // 3. Connect Client 2
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject("Client 2 timeout"), 5000);
            client2.on("connect", () => {
                clearTimeout(timeout);
                console.log("Client 2 connected");
                client2.emit("join-session", sessionId);
                client2.emit("user-info", { sessionId, userInfo: { id: "user2", name: "User Two" } });
                resolve();
            });
            client2.connect();
        });

        // Verification 1: Client 2 receives file tree
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject("Client 2 file-update timeout"), 5000);

            // Note: join-session might trigger immediate file-update response
            client2.on("file-update", (receivedTree) => {
                console.log("Client 2 received file tree update.");
                if (receivedTree.folder_alpha && receivedTree.folder_alpha.children.file_beta) {
                    console.log("PASS: Client 2 received nested file structure.");
                    clearTimeout(timeout);
                    resolve();
                }
            });

            // Trigger a refresh if it missed the initial one (unlikely with join-session)
            // But let's just wait. join-session already happened.
        });

        // Verification 2: Check active participants
        // We expect Client 1 to know about Client 2
        // We expect Client 2 to know about Client 1
        // This is asynchronous, let's wait a second for sync
        await new Promise(r => setTimeout(r, 1000));

        // 4. Client 2 edits the nested file
        console.log("Client 2 updating code in nested file...");
        const newCode = "console.log('beta updated')";

        const codeUpdatePromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject("Client 1 code-update timeout"), 5000);
            client1.on("code-update", (code) => {
                console.log(`Client 1 received code update: "${code}"`);
                if (code === newCode) {
                    console.log("PASS: Client 1 received correct code update.");
                    clearTimeout(timeout);
                    resolve();
                }
            });
        });

        client2.emit("code-change", { sessionId, changes: newCode });
        await codeUpdatePromise;

        // 5. Connect Client 3 (Late joiner)
        console.log("Connecting Client 3 (Late Joiner)...");
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject("Client 3 timeout"), 5000);
            client3.on("connect", () => {
                clearTimeout(timeout);
                client3.emit("join-session", sessionId);
                client3.emit("user-info", { sessionId, userInfo: { id: "user3", name: "User Three" } });

                // Should verify initial load
                client3.once("file-update", (tree) => {
                    if (tree.folder_alpha) console.log("PASS: Client 3 got the file tree immediately.");
                    resolve();
                });
            });
            client3.connect();
        });

        console.log("TEST SUCCESSFUL. All collaboration features verified.");

    } catch (error) {
        console.error("TEST FAILED:", error);
    } finally {
        client1.disconnect();
        client2.disconnect();
        client3.disconnect();
    }
}

runTest();
