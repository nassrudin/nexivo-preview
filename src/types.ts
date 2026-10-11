export type Category =
  | "Lingkungan"
  | "Engineering"
  | "HSE & K3"
  | "Bisnis"
  | "Teknologi"
  | "Pendidikan";
export type User = {
  id: string;
  name: string;
  email: string;
  role: "participant" | "admin";
  organization: string;
};
export type Webinar = {
  id: string;
  title: string;
  category: Category;
  summary: string;
  description: string;
  outcomes: string[];
  status: "planned" | "published" | "completed";
  startsAt: string | null;
  endsAt: string | null;
  speaker: string | null;
  capacity: number;
  registered: number;
  certificate: "free" | "paid" | "none";
  certificateFee: number;
  minimumAttendance: number;
};
export type Registration = {
  id: string;
  eventId: string;
  title: string;
  category: Category;
  startsAt: string | null;
  endsAt: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  evaluated: boolean;
  evaluationRating: number | null;
  evaluationLearning: string | null;
  wantsCertificate: boolean;
  attendanceStatus: string;
  certificateToken: string | null;
  certificateStatus: string | null;
};
export type Certificate = {
  token: string;
  number: string;
  recipient: string;
  event: string;
  date: string;
  issuedAt: string;
  status: "valid" | "revoked";
  type: string;
};
