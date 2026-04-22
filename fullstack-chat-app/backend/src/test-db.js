import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const testConnection = async () => {
    try {
        console.log("Testing MongoDB connection...");
        console.log("URI:", process.env.MONGODB_URI ? "Present (not showing for security)" : "Missing");
        
        if (!process.env.MONGODB_URI) {
            console.error("No MONGODB_URI found in .env");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("SUCCESS: MongoDB connected!");
        process.exit(0);
    } catch (error) {
        console.error("FAILURE: MongoDB connection error:");
        console.error(error);
        process.exit(1);
    }
};

testConnection();
