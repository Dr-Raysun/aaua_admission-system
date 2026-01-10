"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
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

// Utility function to process application data (same as in status page)
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
              id: doc.id || docType,
              type: doc.type || docType,
              status: "pending",
              uploadedAt: doc.uploadDate
                ? new Date(doc.uploadDate).toLocaleDateString()
                : new Date().toLocaleDateString(),
              uploadDate: doc.uploadDate,
              verificationStatus: doc.verificationStatus,
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
        id: doc.id || doc.type,
        type: doc.type,
        status: doc.verificationStatus || "pending",
        uploadedAt: doc.uploadDate
          ? new Date(doc.uploadDate).toLocaleDateString()
          : new Date().toLocaleDateString(),
        uploadDate: doc.uploadDate,
        verificationStatus: doc.verificationStatus,
        fileUrl: doc.fileUrl,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
      });
    });
  }

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
        return;
      }

      const apps = data.applications;
      const submittedApp = apps.find((app: any) => app.status === "submitted");
      const raw = submittedApp || apps[apps.length - 1];

      const app = processApplicationData(raw);
      setApplication(app);

      // Generate admission data from application
      if (app) {
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
          duration: "four (4) years", // You can make this dynamic based on course
          academicYear: `${admissionYear}/${admissionYear + 1}`,
          signatoryName: "Olusola Moses BODOLA",
          signatoryTitle: "SAR (Admissions) — For Registrar",
        });
      }
    } catch (error) {
      console.error("Error fetching application:", error);
      toast.error("Failed to load admission letter");
      setApplication(null);
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
          <p className="text-muted-foreground">Loading authentication......</p>
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
              You needed to be signed in to view your admission letter
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
          <p className="text-muted-foreground">Loading admission letter...</p>
        </div>
      </div>
    );
  }

  if (!application || !admissionData) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Application Found</h2>
            <p className="text-muted-foreground mb-6">
              You need to submit an application first to view the admission
              letter.
            </p>
            <Button asChild className="mb-2">
              <Link href="/applicant/application">Start New Application</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/applicant">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <span className="font-medium capitalize">
                  {application.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submission Date:</span>
                <span>{admissionData.admissionDate}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
