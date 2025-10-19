import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AIContext {
  constructor() {
    this.context = new Map();
    this.loadContext();
  }

  loadContext() {
    const contextFile = path.join(__dirname, 'context.json');
    if (fs.existsSync(contextFile)) {
      this.context = new Map(Object.entries(JSON.parse(fs.readFileSync(contextFile, 'utf-8'))));
    }
  }

  saveContext() {
    const contextFile = path.join(__dirname, 'context.json');
    fs.writeFileSync(contextFile, JSON.stringify(Object.fromEntries(this.context), null, 2));
  }

  addResponse(query, response) {
    this.context.set(query.toLowerCase(), response);
    this.saveContext();
  }

  getResponse(query) {
    return this.context.get(query.toLowerCase()) || null;
  }
}

export default new AIContext();