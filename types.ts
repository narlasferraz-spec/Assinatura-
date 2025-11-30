

export type Role = 'client' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  plan?: 'monthly' | 'quarterly' | 'annual' | null;
  signature?: string; // Base64 or font style signature
  isVerified: boolean;
}

export interface Signer {
  id: string;
  name: string;
  email: string;
  role: 'sender' | 'signer' | 'witness';
  status: 'pending' | 'signed' | 'rejected';
  signedAt?: Date;
  signatureHash?: string;
  signatureImage?: string; // Base64 image of the drawn signature
}

export interface ContractField {
  id: string;
  type: 'date' | 'text' | 'signature' | 'signer_name';
  label: string;
  x: number; // Percentage X
  y: number; // Percentage Y
}

export interface Contract {
  id: string;
  title: string;
  content: string; // HTML or Text content
  fileUrl?: string; // For PDF uploads
  type: 'text' | 'pdf';
  status: 'draft' | 'pending' | 'completed' | 'archived';
  createdBy: string;
  createdAt: Date;
  location?: string;
  signers: Signer[];
  hash: string; // Document Integrity Hash
  fields?: ContractField[]; // Fields for auto-filling
}

export interface Plan {
  id: 'monthly' | 'quarterly' | 'annual';
  name: string;
  price: number;
  period: string;
  features: string[];
  recommended?: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: Date;
  read: boolean;
}