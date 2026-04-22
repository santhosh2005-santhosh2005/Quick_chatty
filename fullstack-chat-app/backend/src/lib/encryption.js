import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Ensure ENCRYPTION_KEY is 32 bytes (256 bits)
// If not provided or invalid length, fallback to a deterministic key for development
const getEncryptionKey = () => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length !== 32) {
        console.warn("Using default development encryption key (unsafe for production)");
        return "12345678901234567890123456789012"; // 32 chars
    }
    return key;
};

const ENCRYPTION_KEY = getEncryptionKey();
const IV_LENGTH = 16; // For AES, this is always 16

export const encrypt = (text) => {
    if (!text) return text;

    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString("hex") + ":" + encrypted.toString("hex");
    } catch (error) {
        console.error("Encryption error:", error);
        return text; // Fallback to plain text on error (safer than crashing)
    }
};

export const decrypt = (text) => {
    if (!text) return text;

    // Backward compatibility: check if text is in "iv:encrypted" format
    const parts = text.split(":");
    if (parts.length !== 2) {
        // Treat as plain text (old messages)
        return text;
    }

    try {
        const iv = Buffer.from(parts[0], "hex");
        const encryptedText = Buffer.from(parts[1], "hex");
        const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        // If decryption fails (e.g. key changed), return original text
        console.error("Decryption error:", error.message);
        return text;
    }
};
