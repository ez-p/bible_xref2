export type Passage = {
  canonical: string;
  text: string;
};

export type CrossReference = {
  reference: string;
  reason: string;
  text: string | null;
};

export type StudyData = {
  passage: Passage;
  references: CrossReference[];
  question?: string;
};

export type StudySession = StudyData & { token: string };
