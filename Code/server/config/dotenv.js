import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Resolve .env from this file's location (server/.env) instead of process.cwd(),
// so it loads the same no matter which directory the process was started from.
const configDir = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.join(configDir, '..', '.env') })
