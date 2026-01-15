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

// Map document types from your application to verification categories
const DOCUMENT_CATEGORIES = {
  WAEC_RESULT: ["WAEC", "NECO", "GCE", "OLEVEL", "RESULT"],
  JAMB_RESULT: ["JAMB", "UTME", "DIRECT_ENTRY", "DE"],
  BIRTH_CERTIFICATE: ["BIRTH", "BIRTH_CERTIFICATE", "AGE_DECLARATION"],
  LOCAL_GOVERNMENT_CERTIFICATE: ["LGA", "LOCAL_GOVERNMENT", "INDIGENE"],
  PASSPORT_PHOTO: ["PASSPORT", "PHOTO", "PHOTOGRAPH"],
  ACADEMIC_TRANSCRIPT: ["TRANSCRIPT", "ACADEMIC"],
  LETTER_OF_REFERENCE: ["REFERENCE", "REFEREE"],
  MEDICAL_REPORT: ["MEDICAL", "HEALTH"],
};

// SIMPLIFIED: Check if application status is verified
const isApplicationVerified = (status: string): boolean => {
  if (!status) return false;

  const statusLower = status.toLowerCase();

  // Direct check for verified status
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

  // Check verificationStatus field
  if (doc.verificationStatus) {
    return doc.verificationStatus.toLowerCase() === "verified";
  }

  // Check status field
  if (doc.status) {
    return doc.status.toLowerCase() === "verified";
  }

  // Check adminVerified field if it exists
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
    console.log("No documents found");
    return false;
  }

  console.log("Checking", documents.length, "documents for verification");

  // Count verified documents by category
  const verifiedCategories = new Set<string>();

  documents.forEach((doc) => {
    const docType = doc.type?.toUpperCase() || "";
    const isVerified = isDocumentVerified(doc);

    console.log(
      `Document: ${docType}, Verified: ${isVerified}, Status: ${
        doc.verificationStatus || doc.status
      }`
    );

    // Find which category this document belongs to
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
    if (docType.includes("PASSPORT") || docType.includes("PHOTO")) {
      if (isVerified) verifiedCategories.add("PASSPORT_PHOTO");
    }
  });

  console.log("Verified categories found:", Array.from(verifiedCategories));

  // Required document categories for admission
  const requiredCategories = [
    "WAEC_RESULT",
    "JAMB_RESULT",
    "BIRTH_CERTIFICATE",
    "LOCAL_GOVERNMENT_CERTIFICATE",
  ];

  // Check if all required categories have at least one verified document
  const allRequiredVerified = requiredCategories.every((category) =>
    verifiedCategories.has(category)
  );

  console.log("All required documents verified?", allRequiredVerified);
  console.log("Required:", requiredCategories);
  console.log("Verified:", Array.from(verifiedCategories));

  return allRequiredVerified;
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

    // Categorize the document
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

// Extract JAMB score from application - FIXED VERSION
const getJambScore = (application: Application): number => {
  // Try multiple possible fields for JAMB/UTME score
  let score = 0;

  // 1. Check direct utmeScore field (from your data)
  if (application.utmeScore) {
    score = Number(application.utmeScore);
    console.log("Found JAMB score in utmeScore:", score);
  }

  // 2. Check academicRecords.utmeScore
  else if (application.academicRecords?.utmeScore) {
    score = Number(application.academicRecords.utmeScore);
    console.log("Found JAMB score in academicRecords.utmeScore:", score);
  }

  // 3. Check direct jambScore field
  else if (application.jambScore) {
    score = Number(application.jambScore);
    console.log("Found JAMB score in jambScore:", score);
  }

  // 4. Check academicRecords.jambScore
  else if (application.academicRecords?.jambScore) {
    score = Number(application.academicRecords.jambScore);
    console.log("Found JAMB score in academicRecords.jambScore:", score);
  }

  console.log("Final extracted JAMB score:", score);
  return score;
};

// Check if meets faculty of computing cutoff - FIXED VERSION
const meetsFacultyCutoff = (application: Application) => {
  const { faculty } = application;

  // Only check if faculty is computing
  const facultyUpper = faculty?.toUpperCase() || "";
  if (!facultyUpper.includes("COMPUTING")) {
    return true; // If not computing faculty, skip this check
  }

  const jambScore = getJambScore(application);
  const departmentCode = application.departmentCode || "CSC"; // Default to Computer Science

  if (!jambScore || jambScore === 0) {
    console.log("Missing JAMB score:", jambScore);
    return false;
  }

  const departmentCodeUpper = departmentCode.toUpperCase();
  const cutoff =
    FACULTY_OF_COMPUTING_CUTOFFS[
      departmentCodeUpper as keyof typeof FACULTY_OF_COMPUTING_CUTOFFS
    ];

  if (!cutoff) {
    console.warn(
      `No cutoff found for department code: ${departmentCode}, using default (CSC: 200)`
    );
    return jambScore >= 200; // Default cutoff for Computer Science
  }

  const meetsCutoff = jambScore >= cutoff;
  console.log(
    `Cutoff check for ${departmentCode}: ${jambScore} >= ${cutoff} = ${meetsCutoff}`
  );
  return meetsCutoff;
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

  return "CSC"; // Default to Computer Science
};

// Main eligibility check function - FIXED VERSION
const isEligibleForAdmissionLetter = (application: Application | null) => {
  if (!application) {
    console.log("❌ No application found");
    return false;
  }

  console.log("=== Checking Eligibility ===");
  console.log("Application ID:", application.id);
  console.log("Application Status:", application.status);
  console.log("Faculty:", application.faculty);
  console.log("Course:", application.courseOfStudy);
  console.log("Documents count:", application.documents?.length);
  console.log("UTME Score field:", application.utmeScore);
  console.log(
    "Academic Records UTME Score:",
    application.academicRecords?.utmeScore
  );

  // 1. Check if application status is verified - DIRECT CHECK
  const appVerified = isApplicationVerified(application.status);
  console.log(
    "✅ Application verified check:",
    appVerified,
    "Status:",
    application.status
  );

  if (!appVerified) {
    console.log("❌ Application status not verified");
    return false;
  }

  // 2. Check if all required documents are verified
  const documentsVerified = areAllRequiredDocumentsVerified(
    application.documents
  );
  console.log("✅ Documents verified check:", documentsVerified);

  if (!documentsVerified) {
    console.log("❌ Documents not all verified");
    return false;
  }

  // 3. Check if meets faculty cutoff (specifically for computing)
  const meetsCutoff = meetsFacultyCutoff(application);
  console.log("✅ Faculty cutoff check:", meetsCutoff);

  if (!meetsCutoff) {
    console.log("❌ Does not meet faculty cutoff");
    return false;
  }

  console.log("🎉 All checks passed - eligible for admission");
  return true;
};

const processApplicationData = (raw: any): Application => {
  console.log("Processing raw application data:", raw);

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

  // Process uploadedDocuments (object format)
  if (raw.uploadedDocuments) {
    console.log("Processing uploadedDocuments:", raw.uploadedDocuments);
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

  // Process documents array
  if (raw.documents && Array.isArray(raw.documents)) {
    console.log("Processing documents array:", raw.documents);
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

  // Extract JAMB score from multiple possible fields
  let utmeScore: string | number = 0;
  if (raw.utmeScore) {
    utmeScore = raw.utmeScore;
  } else if (raw.academicRecords?.utmeScore) {
    utmeScore = raw.academicRecords.utmeScore;
  }

  // Extract department code
  const departmentCode = getDepartmentCode(raw.courseOfStudy);

  console.log("Extracted UTME score:", utmeScore);
  console.log("Extracted department code:", departmentCode);

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

export default function AdmissionLetterPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [admissionData, setAdmissionData] = useState<AdmissionData | null>(
    null
  );
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [documentDetails, setDocumentDetails] = useState<any>(null);

  // Fetch application data
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
        setEligible(false);
        return;
      }

      const apps = data.applications;
      const submittedApp = apps.find((app: any) => app.status === "submitted");
      const raw = submittedApp || apps[apps.length - 1];

      const app = processApplicationData(raw);
      setApplication(app);

      // Get document verification details
      const docDetails = getDocumentVerificationDetails(app.documents);
      setDocumentDetails(docDetails);

      // Check eligibility
      const isEligible = isEligibleForAdmissionLetter(app);
      setEligible(isEligible);

      // Only generate admission data if eligible
      if (isEligible && app) {
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
      setEligible(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchApplication();
    }
  }, [isLoaded, isSignedIn, user?.id]);

  // Handle loading and authentication states
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

  // Show admission letter only if eligible
  if (eligible && application && admissionData) {
    const jambScore = getJambScore(application);

    return (
      <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 flex justify-center py-10 px-4">
        <div className="w-full max-w-3xl space-y-6">
          {/* Back button and header */}
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

          {/* Success Message */}
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

          {/* Admission Letter Card */}
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
              {/* Header Info */}
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

              {/* Registrar Information */}
              <p className="font-medium text-gray-900 dark:text-gray-300">
                REGISTRAR: {admissionData.registrarName}
                <span className="text-muted-foreground ml-2">
                  {admissionData.registrarQualifications.join(", ")}
                </span>
              </p>

              {/* Salutation */}
              <p>
                Dear{" "}
                <strong className="text-gray-900 dark:text-white">
                  {admissionData.studentName}
                </strong>
                ,
              </p>

              {/* Admission Offer */}
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

              {/* Conditions */}
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

              {/* Congratulations */}
              <p className="font-medium text-green-700 dark:text-green-400">
                On behalf of the Registrar, please accept my congratulations on
                your admission.
              </p>

              {/* Signatory */}
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

          {/* Application Status Info */}
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

  // Show "not admitted yet" message if not eligible
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 flex items-center justify-center py-10 px-4">
      <Card className="w-full max-w-2xl mx-4">
        <CardContent className="py-12 text-center space-y-6">
          <div className="space-y-2">
            <XCircle className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto" />
            <h2 className="text-2xl font-bold">Admission Not Yet Granted</h2>
            <p className="text-muted-foreground">
              Sorry, you have not been given admission yet. Please keep checking
              for updates.
            </p>
          </div>

          {/* Debug Information */}
          {application && (
            <Card className="bg-gray-50 dark:bg-zinc-900 border border-dashed">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 text-lg">
                  Application Details
                </h3>
                <div className="space-y-2 text-left text-sm">
                  <div className="flex justify-between">
                    <span>Application Status:</span>
                    <Badge
                      variant={
                        isApplicationVerified(application.status)
                          ? "default"
                          : "destructive"
                      }
                    >
                      {application.status} (
                      {isApplicationVerified(application.status)
                        ? "Verified"
                        : "Not Verified"}
                      )
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Faculty:</span>
                    <span>{application.faculty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Course:</span>
                    <span>{application.courseOfStudy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Department Code:</span>
                    <span>
                      {application.departmentCode || "Not determined"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>UTME Score Field:</span>
                    <span className="font-mono">
                      {application.utmeScore || "Not found"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Academic Records UTME:</span>
                    <span className="font-mono">
                      {application.academicRecords?.utmeScore || "Not found"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Extracted JAMB Score:</span>
                    <span className="font-semibold">
                      {getJambScore(application)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Documents:</span>
                    <span>{application.documents?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Eligibility Checklist */}
          {application && (
            <div className="space-y-4">
              <Card className="bg-gray-50 dark:bg-zinc-900">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 text-lg">
                    Admission Requirements Status
                  </h3>
                  <div className="space-y-4 text-left">
                    {/* Application Status */}
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
                          : "❌ Not Verified"}
                      </Badge>
                    </div>

                    {/* Faculty Cutoff Status */}
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
                              {FACULTY_OF_COMPUTING_CUTOFFS[
                                application.departmentCode.toUpperCase() as keyof typeof FACULTY_OF_COMPUTING_CUTOFFS
                              ] || "200"}
                              )
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Document Verification Details */}
                    <div className="pt-2">
                      <h4 className="font-medium mb-2">
                        Document Verification:
                      </h4>
                      <div className="space-y-2 pl-2">
                        {documentDetails && (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {documentDetails.WAEC_RESULT.verified ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <FileX className="w-4 h-4 text-red-500" />
                                )}
                                <span>O'Level Results</span>
                                <span className="text-xs text-muted-foreground">
                                  ({documentDetails.WAEC_RESULT.count} doc
                                  {documentDetails.WAEC_RESULT.count !== 1
                                    ? "s"
                                    : ""}
                                  )
                                </span>
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
                                <span className="text-xs text-muted-foreground">
                                  ({documentDetails.JAMB_RESULT.count} doc
                                  {documentDetails.JAMB_RESULT.count !== 1
                                    ? "s"
                                    : ""}
                                  )
                                </span>
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

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {documentDetails.BIRTH_CERTIFICATE.verified ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <FileX className="w-4 h-4 text-red-500" />
                                )}
                                <span>Birth Certificate</span>
                                <span className="text-xs text-muted-foreground">
                                  ({documentDetails.BIRTH_CERTIFICATE.count} doc
                                  {documentDetails.BIRTH_CERTIFICATE.count !== 1
                                    ? "s"
                                    : ""}
                                  )
                                </span>
                              </div>
                              <Badge
                                variant={
                                  documentDetails.BIRTH_CERTIFICATE.verified
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {documentDetails.BIRTH_CERTIFICATE.verified
                                  ? "✅ Verified"
                                  : "❌ Pending"}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {documentDetails.LOCAL_GOVERNMENT_CERTIFICATE
                                  .verified ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <FileX className="w-4 h-4 text-red-500" />
                                )}
                                <span>LGA Certificate</span>
                                <span className="text-xs text-muted-foreground">
                                  (
                                  {
                                    documentDetails.LOCAL_GOVERNMENT_CERTIFICATE
                                      .count
                                  }{" "}
                                  doc
                                  {documentDetails.LOCAL_GOVERNMENT_CERTIFICATE
                                    .count !== 1
                                    ? "s"
                                    : ""}
                                  )
                                </span>
                              </div>
                              <Badge
                                variant={
                                  documentDetails.LOCAL_GOVERNMENT_CERTIFICATE
                                    .verified
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {documentDetails.LOCAL_GOVERNMENT_CERTIFICATE
                                  .verified
                                  ? "✅ Verified"
                                  : "❌ Pending"}
                              </Badge>
                            </div>

                            <div className="text-xs text-muted-foreground pt-2">
                              Found {application.documents?.length || 0}{" "}
                              document(s) total
                            </div>
                          </>
                        )}
                      </div>
                    </div>
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
