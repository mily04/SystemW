export interface CourseInfo {
  courseName: string;
  term: string;
  targetStudents: string;
  teacher: string;
}

export interface Objective {
  id: string;
  name: string;
  description: string;
}

export interface Assessment {
  id: string;
  name: string;
}

export interface Mapping {
  objectiveId: string;
  assessmentId: string;
  weight: number;
  targetScore: number;
}

export interface Student {
  id: string;
  studentId: string;
  name: string;
  scores: Record<string, number>;
}

export interface GradReq {
  objectiveId: string;
  indicator: string;
  weight: number;
}

export interface SurveyItem {
  id: string;
  objectiveId: string;
  description: string;
  weight: number;
  percentages: {
    excellent: number; // 0.9~1.0
    good: number;      // 0.8~0.9
    medium: number;    // 0.7~0.8
    pass: number;      // 0.6~0.7
  };
}

export interface SubjectiveEval {
  objectiveId: string;
  qualitativeEval: string;
  analysis: string;
}

export interface ContinuousImprovement {
  previousFeedback: string;
  currentEffect: string;
  currentProblems: string;
  futureMeasures: string;
}

export interface IndirectEvalSettings {
  excellentWeight: number;
  goodWeight: number;
  mediumWeight: number;
  passWeight: number;
  subjectiveTitle: string;
  analysisTitle: string;
}
