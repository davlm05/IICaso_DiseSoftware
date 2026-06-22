/**
 * Shared types for the SmartCart AI development platform.
 *
 * The orchestrator drives every feature through a small, explicit state machine.
 * All artifacts (specs, build manifest, validation report) are persisted as JSON
 * under platform/specs/<feature-id>/feature.json so a run is fully traceable and
 * resumable.
 */

export type AgentName =
  | 'orchestrator'
  | 'frontend'
  | 'backend'
  | 'data'
  | 'infra'
  | 'validation'
  | 'qa';

/** The six spec-driven domains required by Caso #2 §4. */
export type SpecDomain =
  | 'frontend'
  | 'backend'
  | 'data'
  | 'observability'
  | 'testing'
  | 'cicd';

export const SPEC_DOMAINS: SpecDomain[] = [
  'frontend',
  'backend',
  'data',
  'observability',
  'testing',
  'cicd',
];

/**
 * Feature lifecycle. Happy path: SPECIFIED -> BUILT -> VALIDATED -> RELEASED.
 * Any failure parks the feature in a *_FAILED state with feedback attached, so
 * the responsible agent can be re-run (Caso #2 §7 feedback loop).
 */
export type FeatureStatus =
  | 'SPECIFIED'
  | 'BUILT'
  | 'VALIDATED'
  | 'RELEASED'
  | 'SPEC_FAILED'
  | 'BUILD_FAILED'
  | 'VALIDATION_FAILED'
  | 'RELEASE_FAILED';

export interface HistoryEntry {
  at: string;
  event: string;
  detail?: string;
}

export interface BuildRecord {
  agents: AgentName[];
  touchedPaths: string[];
  summary: string;
}

export interface ValidationCheck {
  name: string;
  /** Which README section / standard this check enforces. */
  dimension:
    | 'functional'
    | 'architectural'
    | 'specification'
    | 'security'
    | 'standards';
  pass: boolean;
  severity: 'info' | 'warning' | 'error';
  detail: string;
}

export interface ValidationFeedback {
  agent: AgentName;
  issues: string[];
}

export interface ValidationReport {
  pass: boolean;
  summary: string;
  checks: ValidationCheck[];
  /** Routed back to the responsible agent(s) when pass === false. */
  feedback: ValidationFeedback[];
}

export interface TestsRecord {
  paths: string[];
  summary: string;
}

export interface ReleaseRecord {
  branch: string;
  prUrl?: string;
  releaseNotesPath?: string;
  testsPassed: boolean;
  qualityGatesPassed: boolean;
  notes: string;
}

export interface FeatureManifest {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
  createdAt: string;
  updatedAt: string;
  /** domain -> spec markdown path (relative to repo root). */
  specs: Partial<Record<SpecDomain, string>>;
  build?: BuildRecord;
  validation?: ValidationReport;
  tests?: TestsRecord;
  release?: ReleaseRecord;
  history: HistoryEntry[];
}

/** A file an agent wants written, relative to repo root. */
export interface FileEdit {
  path: string;
  content: string;
}
