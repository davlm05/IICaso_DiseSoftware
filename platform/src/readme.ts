/**
 * Loads the binding grounding sections from README.md.
 *
 * Per the user's directive, the frontend agent MUST follow "§1 Frontend Design"
 * and every other agent MUST follow "§2 Backend Design". Rather than hard-code
 * line numbers (which drift as the README is edited), we slice by the top-level
 * headers, so the injected grounding always tracks the current README.
 */
import * as fs from 'fs';

export type ReadmeSection = 'frontend' | 'backend' | 'none';

const START_HEADERS: Record<Exclude<ReadmeSection, 'none'>, RegExp> = {
  frontend: /^#\s+Frontend Design\s*$/,
  backend: /^#\s+2\.\s+Backend Design\s*$/,
};

export function loadReadmeSection(readmePath: string, section: ReadmeSection): string {
  if (section === 'none') return '';
  if (!fs.existsSync(readmePath)) return '';

  const lines = fs.readFileSync(readmePath, 'utf8').split(/\r?\n/);
  const startRe = START_HEADERS[section];
  const startIdx = lines.findIndex((l) => startRe.test(l));
  if (startIdx === -1) return '';

  // End at the next top-level (`# `) header, or EOF.
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^#\s+\S/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }
  return lines.slice(startIdx, endIdx).join('\n').trim();
}
