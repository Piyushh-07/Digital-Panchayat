export type UserRole = 'citizen' | 'sachiv' | 'dm';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  panchayat?: Panchayat;
}

export interface Panchayat {
  _id: string;
  name: string;
  district: string;
  state: string;
}

export type ComplaintStatus = 'Submitted' | 'Verified' | 'Rejected' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
export type PriorityLevel = 'Low' | 'Medium' | 'High';

export interface Complaint {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: ComplaintStatus;
  priority: PriorityLevel;
  location: {
    address: string;
    coordinates: [number, number];
  };
  mediaUrls: string[];
  citizenId: string | { _id: string; name: string };
  assignedTo?: string; // Worker ID or Name
  slaDeadline?: string;
  resolutionProof?: {
    imageUrl: string;
    comment: string;
    completedAt: string;
  };
  feedback?: {
    rating: number;
    comment: string;
  };
  resolutionVotes?: {
    resolved: string[]; // User IDs who agree it's resolved
    unresolved: string[]; // User IDs who disagree
  };
  isDirectToDM?: boolean;
  isFlagged?: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'status' | 'alert' | 'assignment';
  isRead: boolean;
  createdAt: string;
}
