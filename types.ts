
export interface Tribute {
  id: string;
  name: string;
  relationship: string;
  message: string;
  date: string;
}

export interface CommitteeMember {
  name: string;
  role: string;
  subtext?: string;
  phone?: string;
}
