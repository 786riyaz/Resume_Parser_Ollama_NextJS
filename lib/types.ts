export type Candidate = {
  id: string;
  fileName: string;
  name: string | null;
  mobile: string | null;
  email: string | null;
  tenth: string | null;
  twelfth: string | null;
  diploma: string | null;
  graduation: string | null;
  postGraduation: string | null;
  btechScore: string | null;
  cgpa: string | null;
  percentage: string | null;
  jeeRank: string | null;
  jeePercentile: string | null;
  college: string | null;
  branch: string | null;
  graduationYear: string | null;
  comment: string;
};

export type UploadResult = {
  candidates: Candidate[];
  errors: Array<{
    fileName: string;
    message: string;
  }>;
};

export const emptyCandidate = (fileName = ""): Candidate => ({
  id: crypto.randomUUID(),
  fileName,
  name: null,
  mobile: null,
  email: null,
  tenth: null,
  twelfth: null,
  diploma: null,
  graduation: null,
  postGraduation: null,
  btechScore: null,
  cgpa: null,
  percentage: null,
  jeeRank: null,
  jeePercentile: null,
  college: null,
  branch: null,
  graduationYear: null,
  comment: "Review required."
});

