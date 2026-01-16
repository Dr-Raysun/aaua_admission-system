"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileCheck,
  FileX,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";

interface Application {
  id: string;
  userId: string;
  surname: string;
  otherNames: string;
  personalEmail: string;
  status: string;
  submittedAt: string;
  courseOfStudy: string;
  createdAt: string;
  updatedAt: string;

  // Additional fields
  localGovernment: string;
  degreeSought: string;
  dateOfBirth: string;
  gender: string;
  modeOfAdmission: string;
  faculty: string;
  personalPhone: string;
  permanentAddress: string;
  stateOfOrigin: string;
  hometown: string;
  nationality: string;
  religion: string;
  maritalStatus: string;
  isOnScholarship: boolean;

  // JAMB/UTME score fields
  utmeScore?: string | number;
  jambScore?: number;
  departmentCode?: string;
  jambRegNumber?: string;

  // Application progress
  personalInfoComplete: boolean;
  academicInfoComplete: boolean;
  documentsComplete: boolean;

  // Documents array
  documents: Array<{
    id: string;
    type: string;
    status: string;
    uploadedAt: string;
    uploadDate?: string;
    verificationStatus?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }>;

  // Academic records
  academicRecords?: {
    utmeScore?: string | number;
    jambScore?: string | number;
    olevelResults?: any[];
    utmeSubjects?: string;
  };
}

interface AdmissionData {
  studentName: string;
  admissionDate: string;
  registrarName: string;
  registrarQualifications: string[];
  programme: string;
  faculty: string;
  duration: string;
  academicYear: string;
  signatoryName: string;
  signatoryTitle: string;
}

// Faculty of Computing departments with their codes and cutoff marks
const FACULTY_OF_COMPUTING_CUTOFFS = {
  CSC: 200, // Computer Science
  CYS: 190, // Cybersecurity
  SWE: 195, // Software Engineering
  IFT: 185, // Information Technology
  DSC: 180, // Data Science
  NTS: 175, // Network and Security
};

// SIMPLIFIED: Check if application status is verified
const isApplicationVerified = (status: string): boolean => {
  if (!status) return false;

  const statusLower = status.toLowerCase();

  return (
    statusLower === "verified" ||
    statusLower === "approved" ||
    statusLower === "accepted" ||
    statusLower.includes("verify") ||
    statusLower.includes("approve")
  );
};

// Check if a document is verified based on your structure
const isDocumentVerified = (doc: any): boolean => {
  if (!doc) return false;

  if (doc.verificationStatus) {
    return doc.verificationStatus.toLowerCase() === "verified";
  }

  if (doc.status) {
    return doc.status.toLowerCase() === "verified";
  }

  if (doc.adminVerified !== undefined) {
    return doc.adminVerified === true || doc.adminVerified === "true";
  }

  return false;
};

// Check if all required documents are verified
const areAllRequiredDocumentsVerified = (
  documents: Application["documents"]
) => {
  if (!documents || documents.length === 0) {
    return false;
  }

  const verifiedCategories = new Set<string>();

  documents.forEach((doc) => {
    const docType = doc.type?.toUpperCase() || "";
    const isVerified = isDocumentVerified(doc);

    if (
      docType.includes("WAEC") ||
      docType.includes("NECO") ||
      docType.includes("O'LEVEL") ||
      docType.includes("RESULT")
    ) {
      if (isVerified) verifiedCategories.add("WAEC_RESULT");
    }
    if (
      docType.includes("JAMB") ||
      docType.includes("UTME") ||
      docType.includes("JAMB-LETTER")
    ) {
      if (isVerified) verifiedCategories.add("JAMB_RESULT");
    }
    if (
      docType.includes("BIRTH") ||
      docType.includes("AGE") ||
      docType.includes("CERTIFICATE")
    ) {
      if (isVerified) verifiedCategories.add("BIRTH_CERTIFICATE");
    }
    if (
      docType.includes("LGA") ||
      docType.includes("LOCAL_GOVERNMENT") ||
      docType.includes("INDIGENE") ||
      docType.includes("LGA-LETTER")
    ) {
      if (isVerified) verifiedCategories.add("LOCAL_GOVERNMENT_CERTIFICATE");
    }
  });

  const requiredCategories = [
    "WAEC_RESULT",
    "JAMB_RESULT",
    "BIRTH_CERTIFICATE",
    "LOCAL_GOVERNMENT_CERTIFICATE",
  ];

  return requiredCategories.every((category) =>
    verifiedCategories.has(category)
  );
};

// Check document verification status with detailed info
const getDocumentVerificationDetails = (
  documents: Application["documents"]
) => {
  const details = {
    WAEC_RESULT: { verified: false, count: 0, docs: [] as any[] },
    JAMB_RESULT: { verified: false, count: 0, docs: [] as any[] },
    BIRTH_CERTIFICATE: { verified: false, count: 0, docs: [] as any[] },
    LOCAL_GOVERNMENT_CERTIFICATE: {
      verified: false,
      count: 0,
      docs: [] as any[],
    },
    PASSPORT_PHOTO: { verified: false, count: 0, docs: [] as any[] },
    OTHER: { verified: false, count: 0, docs: [] as any[] },
  };

  if (!documents || documents.length === 0) return details;

  documents.forEach((doc) => {
    const docType = doc.type?.toUpperCase() || "";
    const isVerified = isDocumentVerified(doc);

    if (
      docType.includes("WAEC") ||
      docType.includes("NECO") ||
      docType.includes("O'LEVEL") ||
      docType.includes("RESULT")
    ) {
      details.WAEC_RESULT.count++;
      if (isVerified) {
        details.WAEC_RESULT.verified = true;
        details.WAEC_RESULT.docs.push(doc);
      }
    } else if (
      docType.includes("JAMB") ||
      docType.includes("UTME") ||
      docType.includes("JAMB-LETTER")
    ) {
      details.JAMB_RESULT.count++;
      if (isVerified) {
        details.JAMB_RESULT.verified = true;
        details.JAMB_RESULT.docs.push(doc);
      }
    } else if (
      docType.includes("BIRTH") ||
      docType.includes("AGE") ||
      docType.includes("CERTIFICATE")
    ) {
      details.BIRTH_CERTIFICATE.count++;
      if (isVerified) {
        details.BIRTH_CERTIFICATE.verified = true;
        details.BIRTH_CERTIFICATE.docs.push(doc);
      }
    } else if (
      docType.includes("LGA") ||
      docType.includes("LOCAL_GOVERNMENT") ||
      docType.includes("INDIGENE") ||
      docType.includes("LGA-LETTER")
    ) {
      details.LOCAL_GOVERNMENT_CERTIFICATE.count++;
      if (isVerified) {
        details.LOCAL_GOVERNMENT_CERTIFICATE.verified = true;
        details.LOCAL_GOVERNMENT_CERTIFICATE.docs.push(doc);
      }
    } else if (docType.includes("PASSPORT") || docType.includes("PHOTO")) {
      details.PASSPORT_PHOTO.count++;
      if (isVerified) {
        details.PASSPORT_PHOTO.verified = true;
        details.PASSPORT_PHOTO.docs.push(doc);
      }
    } else {
      details.OTHER.count++;
      if (isVerified) {
        details.OTHER.verified = true;
        details.OTHER.docs.push(doc);
      }
    }
  });

  return details;
};

// Extract JAMB score from application
const getJambScore = (application: Application): number => {
  let score = 0;

  if (application.utmeScore) {
    score = Number(application.utmeScore);
  } else if (application.academicRecords?.utmeScore) {
    score = Number(application.academicRecords.utmeScore);
  } else if (application.jambScore) {
    score = Number(application.jambScore);
  } else if (application.academicRecords?.jambScore) {
    score = Number(application.academicRecords.jambScore);
  }

  return score;
};

// Get department code from course of study
const getDepartmentCode = (courseOfStudy: string = ""): string => {
  const course = courseOfStudy.toUpperCase();

  if (course.includes("COMPUTER SCIENCE")) return "CSC";
  else if (course.includes("CYBER")) return "CYS";
  else if (course.includes("SOFTWARE")) return "SWE";
  else if (course.includes("INFORMATION TECH")) return "IFT";
  else if (course.includes("DATA SCIENCE")) return "DSC";
  else if (course.includes("NETWORK")) return "NTS";

  return "CSC";
};

// Get cutoff for department
const getCutoffForDepartment = (departmentCode: string): number => {
  const departmentCodeUpper = departmentCode.toUpperCase();
  const cutoff =
    FACULTY_OF_COMPUTING_CUTOFFS[
      departmentCodeUpper as keyof typeof FACULTY_OF_COMPUTING_CUTOFFS
    ];

  return cutoff || 200; // Default cutoff for Computer Science
};

// Check if meets faculty of computing cutoff
const meetsFacultyCutoff = (application: Application) => {
  const { faculty } = application;

  const facultyUpper = faculty?.toUpperCase() || "";
  if (!facultyUpper.includes("COMPUTING")) {
    return true;
  }

  const jambScore = getJambScore(application);
  const departmentCode = application.departmentCode || "CSC";

  if (!jambScore || jambScore === 0) {
    return false;
  }

  const cutoff = getCutoffForDepartment(departmentCode);
  return jambScore >= cutoff;
};

// Determine eligibility status
const getEligibilityStatus = (application: Application | null) => {
  if (!application) {
    return { eligible: false, reason: "No application found" };
  }

  // 1. Check if application status is verified
  const appVerified = isApplicationVerified(application.status);
  if (!appVerified) {
    return { eligible: false, reason: "Application not verified by admin" };
  }

  // 2. Check if all required documents are verified
  const documentsVerified = areAllRequiredDocumentsVerified(
    application.documents
  );
  if (!documentsVerified) {
    return { eligible: false, reason: "Documents not fully verified" };
  }

  // 3. Check if meets faculty cutoff
  const meetsCutoff = meetsFacultyCutoff(application);
  if (!meetsCutoff) {
    return { eligible: false, reason: "JAMB score below cutoff" };
  }

  return { eligible: true, reason: "All requirements met" };
};

const processApplicationData = (raw: any): Application => {
  const personalInfoComplete = !!(
    raw.surname &&
    raw.otherNames &&
    raw.dateOfBirth &&
    raw.gender &&
    raw.permanentAddress
  );

  const academicInfoComplete = !!(
    raw.courseOfStudy &&
    raw.faculty &&
    raw.olevelResults?.[0]?.examBody
  );

  const hasDocuments =
    raw.uploadedDocuments && Object.keys(raw.uploadedDocuments).length > 0;
  const hasDocArray = raw.documents && raw.documents.length > 0;
  const documentsComplete = hasDocuments || hasDocArray;

  const documents: Array<{
    id: string;
    type: string;
    status: string;
    uploadedAt: string;
    uploadDate?: string;
    verificationStatus?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }> = [];

  if (raw.uploadedDocuments) {
    Object.entries(raw.uploadedDocuments).forEach(
      ([docType, docArray]: [string, any]) => {
        if (Array.isArray(docArray)) {
          docArray.forEach((doc: any) => {
            documents.push({
              id: doc.id || `${docType}-${Date.now()}`,
              type: doc.type || docType,
              status: doc.status || "pending",
              uploadedAt: doc.uploadDate
                ? new Date(doc.uploadDate).toLocaleDateString()
                : new Date().toLocaleDateString(),
              uploadDate: doc.uploadDate,
              verificationStatus: doc.verificationStatus || doc.status,
              fileUrl: doc.fileUrl,
              fileName: doc.fileName,
              fileSize: doc.fileSize,
            });
          });
        }
      }
    );
  }

  if (raw.documents && Array.isArray(raw.documents)) {
    raw.documents.forEach((doc: any) => {
      documents.push({
        id: doc.id || doc.type || `doc-${Date.now()}`,
        type: doc.type,
        status: doc.status || "pending",
        uploadedAt: doc.uploadDate
          ? new Date(doc.uploadDate).toLocaleDateString()
          : new Date().toLocaleDateString(),
        uploadDate: doc.uploadDate,
        verificationStatus: doc.verificationStatus || doc.status,
        fileUrl: doc.fileUrl,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
      });
    });
  }

  let utmeScore: string | number = 0;
  if (raw.utmeScore) {
    utmeScore = raw.utmeScore;
  } else if (raw.academicRecords?.utmeScore) {
    utmeScore = raw.academicRecords.utmeScore;
  }

  const departmentCode = getDepartmentCode(raw.courseOfStudy);

  return {
    id: raw.id,
    userId: raw.userId,
    status: raw.status || "draft",
    submittedAt: raw.submittedAt || raw.createdAt || new Date().toISOString(),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    personalInfoComplete,
    academicInfoComplete,
    documentsComplete,
    documents,
    surname: raw.surname || "",
    otherNames: raw.otherNames || "",
    personalEmail: raw.personalEmail || "",
    courseOfStudy: raw.courseOfStudy || "",
    faculty: raw.faculty || "",
    localGovernment: raw.localGovernment || "",
    degreeSought: raw.degreeSought || "",
    dateOfBirth: raw.dateOfBirth || "",
    gender: raw.gender || "",
    modeOfAdmission: raw.modeOfAdmission || "",
    personalPhone: raw.personalPhone || "",
    permanentAddress: raw.permanentAddress || "",
    stateOfOrigin: raw.stateOfOrigin || "",
    hometown: raw.hometown || "",
    nationality: raw.nationality || "",
    religion: raw.religion || "",
    maritalStatus: raw.maritalStatus || "",
    isOnScholarship: raw.isOnScholarship || false,
    utmeScore: utmeScore,
    departmentCode: departmentCode,
    jambRegNumber: raw.jambRegNumber || "",
    academicRecords: raw.academicRecords,
  };
};

// Component for cutoff not met message
const CutoffNotMetMessage = ({
  application,
  jambScore,
  departmentCode,
}: {
  application: Application;
  jambScore: number;
  departmentCode: string;
}) => {
  const cutoff = getCutoffForDepartment(departmentCode);

  return (
    <div className="space-y-6">
      <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300">
                Admission Not Granted - JAMB Score Below Cutoff
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400">
                Your application has been verified but your JAMB score does not
                meet the minimum cutoff requirement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-300">
              Admission Decision Details
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Your JAMB Score:</span>
                <span className="font-bold text-lg">{jambScore}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Department Cutoff:
                </span>
                <span className="font-bold text-lg">{cutoff}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Score Difference:</span>
                <Badge
                  variant={jambScore >= cutoff ? "default" : "destructive"}
                >
                  {jambScore >= cutoff ? "+" : "-"}
                  {Math.abs(jambScore - cutoff)} points
                </Badge>
              </div>

              <Separator />

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h5 className="font-medium mb-2">
                  Why you didn't get admission:
                </h5>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>
                      Your JAMB score of <strong>{jambScore}</strong> is below
                      the minimum cutoff of <strong>{cutoff}</strong> for{" "}
                      {application.courseOfStudy}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      Your application has been verified by the admissions
                      office
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      All your documents have been verified and are in order
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h4 className="font-medium">What You Can Do Next:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h5 className="font-medium text-sm">
                  Option 1: Improve Your Score
                </h5>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Retake JAMB and aim for a higher score</li>
                  <li>• Consider JAMB Direct Entry options</li>
                  <li>• Apply for supplementary admission if available</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="font-medium text-sm">
                  Option 2: Consider Other Options
                </h5>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Apply to other universities with lower cutoffs</li>
                  <li>• Consider other courses within AAUA</li>
                  <li>• Explore polytechnic or college alternatives</li>
                </ul>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Admission decisions are based on
                competitive cutoff marks. Meeting the cutoff does not guarantee
                admission, but falling below it means you're not eligible for
                consideration this admission cycle.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild variant="outline" className="flex-1">
          <Link href="/applicant/status">Check Application Status</Link>
        </Button>
        <Button asChild className="flex-1">
          <Link href="/applicant">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default function AdmissionLetterPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [admissionData, setAdmissionData] = useState<AdmissionData | null>(
    null
  );
  const [eligibilityStatus, setEligibilityStatus] = useState<{
    eligible: boolean;
    reason: string;
  } | null>(null);
  const [documentDetails, setDocumentDetails] = useState<any>(null);

  const fetchApplication = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const res = await fetch("/api/applications/user");

      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch application");
      }

      if (!data.applications || data.applications.length === 0) {
        setApplication(null);
        setEligibilityStatus({
          eligible: false,
          reason: "No application found",
        });
        return;
      }

      const apps = data.applications;
      const submittedApp = apps.find((app: any) => app.status === "submitted");
      const raw = submittedApp || apps[apps.length - 1];

      const app = processApplicationData(raw);
      setApplication(app);

      const docDetails = getDocumentVerificationDetails(app.documents);
      setDocumentDetails(docDetails);

      const status = getEligibilityStatus(app);
      setEligibilityStatus(status);

      if (status.eligible && app) {
        const admissionYear = app.submittedAt
          ? new Date(app.submittedAt).getFullYear()
          : new Date().getFullYear();

        setAdmissionData({
          studentName: `${app.surname} ${app.otherNames}`,
          admissionDate: app.submittedAt
            ? new Date(app.submittedAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
            : "Date not available",
          registrarName: "Olugbenga ARAJULU",
          registrarQualifications: [
            "B.Sc (Hons), Ibadan",
            "MBA (Owerri)",
            "M.Sc (Akungba)",
            "MANUPA",
            "FCIA",
            "JP",
          ],
          programme: app.courseOfStudy || "Not specified",
          faculty: app.faculty || "Not specified",
          duration: "four (4) years",
          academicYear: `${admissionYear}/${admissionYear + 1}`,
          signatoryName: "Olusola Moses BODOLA",
          signatoryTitle: "SAR (Admissions) — For Registrar",
        });
      } else {
        setAdmissionData(null);
      }
    } catch (error) {
      console.error("Error fetching application:", error);
      toast.error("Failed to load admission information");
      setApplication(null);
      setEligibilityStatus({
        eligible: false,
        reason: "Error loading application",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchApplication();
    }
  }, [isLoaded, isSignedIn, user?.id]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Please Sign In</h2>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to view your admission status
            </p>
            <Link href="/sign-in">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking admission status...</p>
          <p className="text-sm text-muted-foreground">
            Verifying your documents and eligibility
          </p>
        </div>
      </div>
    );
  }

  // Show admission letter if eligible
  if (eligibilityStatus?.eligible && application && admissionData) {
    const jambScore = getJambScore(application);

    return (
      <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 flex justify-center py-10 px-4">
        <div className="w-full max-w-3xl space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/applicant">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">Admission Letter</h1>
              <p className="text-sm text-muted-foreground">
                For: {admissionData.studentName}
              </p>
            </div>
          </div>

          <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-300">
                    Congratulations! Admission Granted
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    You have successfully met all requirements for admission.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admission Letter Card (same as before) */}
          <Card className="bg-white dark:bg-zinc-900 shadow-xl rounded-xl">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-xl font-bold">
                ADEKUNLE AJASIN UNIVERSITY
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Akungba Akoko, Ondo State
              </p>
              <Separator />
              <Badge variant="secondary" className="mx-auto">
                Interim Admission Notification — {admissionData.academicYear}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-5 text-sm leading-relaxed">
              {/* Admission letter content remains the same */}
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>
                  Candidate Name:{" "}
                  <strong className="text-gray-900 dark:text-white">
                    {admissionData.studentName}
                  </strong>
                </span>
                <span>Date: {admissionData.admissionDate}</span>
              </div>

              <Separator />

              <p className="font-medium text-gray-900 dark:text-gray-300">
                REGISTRAR: {admissionData.registrarName}
                <span className="text-muted-foreground ml-2">
                  {admissionData.registrarQualifications.join(", ")}
                </span>
              </p>

              <p>
                Dear{" "}
                <strong className="text-gray-900 dark:text-white">
                  {admissionData.studentName}
                </strong>
                ,
              </p>

              <p>
                I write to inform you that you have been offered provisional
                admission to the Adekunle Ajasin University, Akungba-Akoko to
                pursue a first degree in{" "}
                <strong className="text-blue-700 dark:text-blue-400">
                  {admissionData.programme}
                </strong>{" "}
                in the Faculty of{" "}
                <strong className="text-blue-700 dark:text-blue-400">
                  {admissionData.faculty}
                </strong>
                . The programme is for a duration of{" "}
                <strong>{admissionData.duration}</strong> based on programme and
                mode of entry.
              </p>

              <p>
                The confirmation of this offer is subject to your obtaining the
                minimum entry qualification required for the course to which you
                have been offered admission.
              </p>

              <p>
                You are to note that if it is discovered at any time that you do
                not possess any of the qualifications which you have claimed to
                have obtained, you will be required to withdraw from the
                University.
              </p>

              <p>
                Please note that only candidates with the provisional admission
                letters issued by the Joint Admission and Matriculation Board
                (JAMB) will be allowed to complete screening and registration
                exercises.
              </p>

              <p>
                Meanwhile, only candidates that accept the above terms should
                proceed further with registration formalities.
              </p>

              <Separator />

              <p className="font-medium text-green-700 dark:text-green-400">
                On behalf of the Registrar, please accept my congratulations on
                your admission.
              </p>

              <div className="pt-6">
                <div className="w-48 ml-auto text-right">
                  <div className="mb-2">
                    <div className="h-px w-full bg-gray-300 dark:bg-gray-700 mb-2"></div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {admissionData.signatoryName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {admissionData.signatoryTitle}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Application ID:</span>
                  <span className="font-mono">{application.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Application Status:
                  </span>
                  <Badge
                    variant={
                      isApplicationVerified(application.status)
                        ? "default"
                        : "secondary"
                    }
                    className="capitalize"
                  >
                    {application.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">JAMB Score:</span>
                  <span className="font-semibold">{jambScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span>
                    {application.departmentCode} ({application.courseOfStudy})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Submission Date:
                  </span>
                  <span>{admissionData.admissionDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show specific cutoff not met message if all verified but cutoff not met
  if (application && eligibilityStatus?.reason === "JAMB score below cutoff") {
    const jambScore = getJambScore(application);
    const departmentCode = application.departmentCode || "CSC";

    return (
      <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 flex justify-center py-10 px-4">
        <div className="w-full max-w-3xl space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/applicant">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">Admission Status</h1>
              <p className="text-sm text-muted-foreground">
                For: {application.surname} {application.otherNames}
              </p>
            </div>
          </div>

          <CutoffNotMetMessage
            application={application}
            jambScore={jambScore}
            departmentCode={departmentCode}
          />
        </div>
      </div>
    );
  }

  // Show general not admitted message for other cases
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 flex items-center justify-center py-10 px-4">
      <Card className="w-full max-w-2xl mx-4">
        <CardContent className="py-12 text-center space-y-6">
          <div className="space-y-2">
            <XCircle className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto" />
            <h2 className="text-2xl font-bold">Admission Not Yet Granted</h2>
            <p className="text-muted-foreground">
              {eligibilityStatus?.reason === "Application not verified by admin"
                ? "Your application is still pending verification by the admissions office."
                : eligibilityStatus?.reason === "Documents not fully verified"
                ? "Some of your documents are still pending verification."
                : "Sorry, you have not been given admission yet. Please keep checking for updates."}
            </p>
          </div>

          {application && (
            <div className="space-y-4">
              <Card className="bg-gray-50 dark:bg-zinc-900">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 text-lg">
                    Application Status Details
                  </h3>
                  <div className="space-y-4 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>Application Verified:</span>
                      </div>
                      <Badge
                        variant={
                          isApplicationVerified(application.status)
                            ? "default"
                            : "destructive"
                        }
                      >
                        {isApplicationVerified(application.status)
                          ? "✅ Verified"
                          : "❌ Pending"}
                      </Badge>
                    </div>

                    {application.faculty
                      ?.toUpperCase()
                      .includes("COMPUTING") && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>JAMB Cutoff Met:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              meetsFacultyCutoff(application)
                                ? "default"
                                : "destructive"
                            }
                          >
                            {meetsFacultyCutoff(application)
                              ? "✅ Met"
                              : "❌ Not Met"}
                          </Badge>
                          {application.departmentCode && (
                            <span className="text-xs text-muted-foreground">
                              ({application.departmentCode}:{" "}
                              {getJambScore(application)}/
                              {getCutoffForDepartment(
                                application.departmentCode
                              )}
                              )
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {documentDetails && (
                      <div className="pt-2">
                        <h4 className="font-medium mb-2">
                          Document Verification:
                        </h4>
                        <div className="space-y-2 pl-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {documentDetails.WAEC_RESULT.verified ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <FileX className="w-4 h-4 text-red-500" />
                              )}
                              <span>O'Level Results</span>
                            </div>
                            <Badge
                              variant={
                                documentDetails.WAEC_RESULT.verified
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {documentDetails.WAEC_RESULT.verified
                                ? "✅ Verified"
                                : "❌ Pending"}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {documentDetails.JAMB_RESULT.verified ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <FileX className="w-4 h-4 text-red-500" />
                              )}
                              <span>JAMB Result</span>
                            </div>
                            <Badge
                              variant={
                                documentDetails.JAMB_RESULT.verified
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {documentDetails.JAMB_RESULT.verified
                                ? "✅ Verified"
                                : "❌ Pending"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline">
                <Link href="/applicant/status">Check Application Status</Link>
              </Button>
              <Button asChild>
                <Link href="/applicant">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
