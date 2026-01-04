export type AdmissionMode = 'UTME' | 'Direct Entry' | 'Transfer' | 'Remedial';
export type Gender = 'Male' | 'Female' | 'Other';
export type MaritalStatus = 'Single' | 'Married' | 'Divorced' | 'Widowed';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'flagged';

export interface PersonalInformation {
  surname: string;
  otherNames: string;
  matricNumber?: string;
  personalPhone: string;
  personalEmail: string;
  dateOfBirth: string;
  modeOfAdmission: AdmissionMode;
  faculty: string;
  courseOfStudy: string;
  presentLevel: string;
  degreeSought: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  religion: string;
  nationality: string;
  stateOfOrigin: string;
  localGovernment: string;
  hometown: string;
  permanentAddress: string;
  postalAddress?: string;
  isOnScholarship: boolean;
  scholarshipDetails?: string;
  offCampusAddress?: string;
}

export interface OLevelResult {
  examBody: string; // WAEC, NECO, etc.
  examNumber: string;
  examYear: string;
  subjects: {
    subject: string;
    gradeFirstSitting: string;
    gradeSecondSitting?: string;
  }[];
}

export interface PreviousInstitution {
  name: string;
  matricNumber: string;
  courseOfStudy: string;
  reasonForLeaving: string;
}

export interface NextOfKin {
  name: string;
  phoneNumber: string;
  relationship: string;
  address: string;
}

export interface ParentInfo {
  name: string;
  phoneNumber: string;
  occupation: string;
  address: string;
}

export interface Document {
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadDate: Date;
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export interface Application {
  id: string;
  userId: string;
  personalInformation: PersonalInformation;
  olevelResults: OLevelResult[];
  utmeSubjects: string;
  previousInstitution?: PreviousInstitution;
  nextOfKin: NextOfKin;
  father: ParentInfo;
  mother: ParentInfo;
  sponsor?: {
    name: string;
    phoneNumber: string;
    occupation: string;
    address: string;
  };
  foreignStudentInfo?: {
    passportNumber: string;
    dateIssued: string;
    placeIssued: string;
    passportValidUntil: string;
    visaExpiryDate: string;
  };
  counsellingInfo?: {
    familyType: string;
    numberOfChildren: number;
    positionInFamily: number;
    parentsLivingTogether: boolean;
    separationReason?: string;
    feeResponsiblePerson: string;
    otherSponsorship?: string;
  };
  medicalInfo?: {
    treatmentDescription?: string;
    treatmentLocation?: string;
    lifeAmbition?: string;
    personalEfforts?: string;
    otherInfo?: string;
  };
  serviceActivities?: {
    clubName: string;
    postHeld: string;
    remark?: string;
  }[];
  previousAcademicInfo: {
    primarySchool: {
      name: string;
      fromYear: string;
      toYear: string;
    }[];
    secondarySchool: {
      name: string;
      fromYear: string;
      toYear: string;
    }[];
    tertiaryInstitution?: {
      name: string;
      fromYear: string;
      toYear: string;
    }[];
  };
  documents: Document[];
  applicationStatus: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  admissionLetterUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}