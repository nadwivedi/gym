// Loads backend/.env into process.env, however the server is started (npm scripts, nodemon, `node server.js`)
// and from whichever folder. Import it first: other modules read their settings as soon as they load.
// A variable already set in the real environment is kept.
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const file = fileURLToPath(new URL('../../.env', import.meta.url))
if (fs.existsSync(file)) process.loadEnvFile(file)
