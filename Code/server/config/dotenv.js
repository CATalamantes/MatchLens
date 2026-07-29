import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// One shared .env at the project root (Code/.env), not server/.env — the
// client reads the same file via vite.config.js's envDir. __dirname here is
// server/config, so two levels up is the project root.
const envPath = path.resolve(__dirname, "../../.env");

dotenv.config({ path: envPath });
