// The four-phase developmental roadmap (PRD §11) and the growth-tree stage it
// drives (PRD §13). Pure — no database — so it can be unit-tested and used on
// client or server. Completion is derived from `Signals` gathered elsewhere
// (lib/progress.ts), so there is no separate progress table to keep in sync.

export type Signals = {
  assessmentDone: boolean;
  hasPurposeStatement: boolean;
  hasLifeVision: boolean;
  hasMentor: boolean;
  journalCount: number;
  completedTasks: number;
  safetyDone: boolean;
  eventsAttended: number;
  meetingsVerified: number;
};

export type RoadmapStep = {
  key: string;
  label: string;
  done: (s: Signals) => boolean;
};

export type RoadmapPhase = {
  key: "finding" | "building" | "discovering" | "creating";
  name: string;
  blurb: string;
  focus: string[];
  stage: number; // 1-4, maps to the growth-tree stage
  stageName: "Seed" | "Sprout" | "Tree" | "Bloom";
  steps: RoadmapStep[];
};

export const ROADMAP: RoadmapPhase[] = [
  {
    key: "finding",
    name: "Finding Yourself",
    blurb: "Identity, values, confidence and self-awareness.",
    focus: ["Identity", "Values", "Confidence", "Self-Awareness"],
    stage: 1,
    stageName: "Seed",
    steps: [
      {
        key: "assessment",
        label: "Complete your discovery assessment",
        done: (s) => s.assessmentDone,
      },
      {
        key: "purpose-statement",
        label: "Generate your purpose statement",
        done: (s) => s.hasPurposeStatement,
      },
      {
        key: "first-journal",
        label: "Write your first journal entry",
        done: (s) => s.journalCount >= 1,
      },
    ],
  },
  {
    key: "building",
    name: "Building Yourself",
    blurb: "Communication, leadership, emotional intelligence, productivity.",
    focus: [
      "Communication",
      "Leadership",
      "Emotional Intelligence",
      "Productivity",
    ],
    stage: 2,
    stageName: "Sprout",
    steps: [
      {
        key: "connect-mentor",
        label: "Connect with a mentor",
        done: (s) => s.hasMentor,
      },
      {
        key: "tasks-3",
        label: "Complete 3 mentor tasks",
        done: (s) => s.completedTasks >= 3,
      },
      {
        key: "journal-habit",
        label: "Write 5 journal entries",
        done: (s) => s.journalCount >= 5,
      },
    ],
  },
  {
    key: "discovering",
    name: "Discovering Purpose",
    blurb: "Career exploration, goal setting and vision planning.",
    focus: ["Career Exploration", "Goal Setting", "Vision Planning"],
    stage: 3,
    stageName: "Tree",
    steps: [
      {
        key: "life-vision",
        label: "Write your life vision",
        done: (s) => s.hasLifeVision,
      },
      {
        key: "tasks-6",
        label: "Complete 6 mentor tasks",
        done: (s) => s.completedTasks >= 6,
      },
      {
        key: "attend-activity",
        label: "Attend an activity",
        done: (s) => s.eventsAttended >= 1,
      },
    ],
  },
  {
    key: "creating",
    name: "Creating Impact",
    blurb: "Community service, advocacy and social innovation.",
    focus: ["Community Service", "Advocacy", "Social Innovation"],
    stage: 4,
    stageName: "Bloom",
    steps: [
      {
        key: "safety-module",
        label: "Complete the safety module",
        done: (s) => s.safetyDone,
      },
      {
        key: "meet-in-person",
        label: "Verify an in-person meeting",
        done: (s) => s.meetingsVerified >= 1,
      },
      {
        key: "tasks-10",
        label: "Complete 10 mentor tasks",
        done: (s) => s.completedTasks >= 10,
      },
    ],
  },
];

export type EvaluatedStep = RoadmapStep & { complete: boolean };
export type EvaluatedPhase = Omit<RoadmapPhase, "steps"> & {
  steps: EvaluatedStep[];
  completeCount: number;
  total: number;
  complete: boolean;
};

export type RoadmapResult = {
  phases: EvaluatedPhase[];
  completedSteps: number;
  totalSteps: number;
  percent: number;
  currentPhase: EvaluatedPhase;
  stage: number;
  stageName: string;
};

export function evaluateRoadmap(signals: Signals): RoadmapResult {
  const phases: EvaluatedPhase[] = ROADMAP.map((phase) => {
    const steps = phase.steps.map((step) => ({
      ...step,
      complete: step.done(signals),
    }));
    const completeCount = steps.filter((s) => s.complete).length;
    return {
      ...phase,
      steps,
      completeCount,
      total: steps.length,
      complete: completeCount === steps.length,
    };
  });

  const totalSteps = phases.reduce((n, p) => n + p.total, 0);
  const completedSteps = phases.reduce((n, p) => n + p.completeCount, 0);
  const percent =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Current phase = the first not-yet-complete phase, or the last if all done.
  const currentPhase =
    phases.find((p) => !p.complete) ?? phases[phases.length - 1];

  return {
    phases,
    completedSteps,
    totalSteps,
    percent,
    currentPhase,
    stage: currentPhase.stage,
    stageName: currentPhase.stageName,
  };
}
