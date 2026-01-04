"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  User,
  GraduationCap,
  Home,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileCheck,
  AlertTriangle,
  Shield,
  Loader2,
  RefreshCw,
  Printer,
  Copy,
  Upload, // Make sure this is spelled exactly like this
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

// Type definitions
interface Document {
  id: string;
  type: string;
  status: string;
  uploadedAt: string;
  uploadDate?: string;
  verificationStatus?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

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

  utmeScore?: string; // JAMB score - might not exist in older applications

  // Additional fields from your data
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
  documents: Document[];

  // Academic records
  olevelResults: Array<{
    examBody: string;
    examNumber: string;
    examYear: string;
    subjects: Array<{
      subject: string;
      gradeFirstSitting: string;
      gradeSecondSitting: string;
    }>;
  }>;

  utmeSubjects: string;

  // Family information
  father: {
    name: string;
    occupation: string;
    phoneNumber: string;
    address: string;
  };

  mother: {
    name: string;
    occupation: string;
    phoneNumber: string;
    address: string;
  };

  nextOfKin: {
    name: string;
    relationship: string;
    phoneNumber: string;
    address: string;
  };
}

// Utility function to process application data (same as in dashboard)
const processApplicationData = (raw: any): Application => {
  // Determine completion status based on actual data
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

  // Extract JAMB score from multiple possible locations
  const utmeScore = raw.utmeScore || raw.academicRecords?.utmeScore || "";

  // Check if documents are uploaded
  const hasDocuments =
    raw.uploadedDocuments && Object.keys(raw.uploadedDocuments).length > 0;
  const hasDocArray = raw.documents && raw.documents.length > 0;
  const documentsComplete = hasDocuments || hasDocArray;

  // Map documents to UI structure
  const documents: Document[] = [];

  // Check in uploadedDocuments (from earlier applications)
  if (raw.uploadedDocuments) {
    Object.entries(raw.uploadedDocuments).forEach(
      ([docType, docArray]: [string, any]) => {
        if (Array.isArray(docArray)) {
          docArray.forEach((doc: any) => {
            documents.push({
              id: doc.id || docType,
              type: doc.type || docType,
              status: "pending", // Default status
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

  // Check in documents array (from submitted application)
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
    utmeScore: utmeScore, // Add JAMB score to processed data
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
    olevelResults: raw.olevelResults || [],
    utmeSubjects: raw.utmeSubjects || "",
    father: raw.father || {
      name: "",
      occupation: "",
      phoneNumber: "",
      address: "",
    },
    mother: raw.mother || {
      name: "",
      occupation: "",
      phoneNumber: "",
      address: "",
    },
    nextOfKin: raw.nextOfKin || {
      name: "",
      relationship: "",
      phoneNumber: "",
      address: "",
    },
  };
};

export default function ApplicationStatusPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch application data
  const fetchApplication = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      console.log("Fetching application for user:", user.id);
      const res = await fetch("/api/applications/user");

      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log("API Response:", data);

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch application");
      }

      if (!data.applications || data.applications.length === 0) {
        console.log("No applications found for user");
        setApplication(null);
        return;
      }

      // Find the most recent or submitted application
      const apps = data.applications;
      const submittedApp = apps.find((app: any) => app.status === "submitted");
      const raw = submittedApp || apps[apps.length - 1];

      console.log("Processing application data:", raw);
      const app = processApplicationData(raw);
      setApplication(app);
    } catch (error) {
      console.error("Error fetching application:", error);
      toast.error("Failed to load application details");
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; text: string }> = {
      submitted: {
        className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
        text: "Submitted",
      },
      draft: {
        className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
        text: "Draft",
      },
      under_review: {
        className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        text: "Under Review",
      },
      verified: {
        className: "bg-green-100 text-green-800 hover:bg-green-100",
        text: "Verified",
      },
      rejected: {
        className: "bg-red-100 text-red-800 hover:bg-red-100",
        text: "Rejected",
      },
      pending: {
        className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        text: "Pending Review",
      },
      flagged: {
        className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
        text: "Flagged",
      },
    };

    const variant = variants[status] || variants.draft;

    return <Badge className={variant.className}>{variant.text}</Badge>;
  };

  // Get document status badge
  const getDocumentStatusBadge = (status: string) => {
    const variants = {
      verified: (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      ),
      pending: (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Verified
        </Badge>
      ),
      rejected: (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <XCircle className="w-3 h-3 mr-1" />
          Needs Review
        </Badge>
      ),
    };

    return (
      variants[status as keyof typeof variants] || (
        <Badge variant="outline">{status}</Badge>
      )
    );
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get document type display name
  const getDocumentTypeName = (type: string) => {
    const types: Record<string, string> = {
      waec: "WAEC Result",
      jamb: "JAMB Result",
      "jamb-letter": "JAMB Admission Letter",
      "birth-certificate": "Birth Certificate",
      "lga-letter": "Local Government Letter",
      "olevel-result": "O'Level Result",
      "utme-result": "UTME Result",
      "first-degree": "First Degree Certificate",
      transcript: "Academic Transcript",
      "other-document": "Other Document",
    };
    return types[type] || type.replace(/-/g, " ").toUpperCase();
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 0;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Print application details
  const handlePrint = () => {
    window.print();
  };

  // Copy application ID
  const copyApplicationId = () => {
    if (application) {
      navigator.clipboard.writeText(application.id);
      toast.success("Application ID copied to clipboard");
    }
  };

  // Initial fetch
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchApplication();
    }
  }, [isLoaded, isSignedIn, user?.id]);

  // Handle loading and authentication states
  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Please Sign In</h1>
            <p className="text-muted-foreground">
              You need to be signed in to view your application status
            </p>
          </div>
          <Link href="/sign-in">
            <Button className="w-full">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            Loading application details...
          </p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Application Found</h2>
            <p className="text-muted-foreground mb-6">
              You haven't submitted an application yet.
            </p>
            <Button asChild>
              <Link href="/applicant/application">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Start New Application
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/applicant">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Application Status
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">ID: {application.id}</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={copyApplicationId}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchApplication}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <div>{getStatusBadge(application.status)}</div>
        </div>
      </div>

      {/* Application Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Application Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`p-4 border rounded-lg ${
                application.personalInfoComplete
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    application.personalInfoComplete
                      ? "bg-green-100"
                      : "bg-gray-100"
                  }`}
                >
                  <User
                    className={`w-5 h-5 ${
                      application.personalInfoComplete
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                </div>
                <div>
                  <p className="font-medium">Personal Information</p>
                  <p className="text-sm text-muted-foreground">
                    {application.personalInfoComplete
                      ? "Completed"
                      : "Incomplete"}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border rounded-lg ${
                application.academicInfoComplete
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    application.academicInfoComplete
                      ? "bg-green-100"
                      : "bg-gray-100"
                  }`}
                >
                  <GraduationCap
                    className={`w-5 h-5 ${
                      application.academicInfoComplete
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                </div>
                <div>
                  <p className="font-medium">Academic Records</p>
                  <p className="text-sm text-muted-foreground">
                    {application.academicInfoComplete
                      ? "Completed"
                      : "Incomplete"}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border rounded-lg ${
                application.documentsComplete
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    application.documentsComplete
                      ? "bg-green-100"
                      : "bg-gray-100"
                  }`}
                >
                  <Shield
                    className={`w-5 h-5 ${
                      application.documentsComplete
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                </div>
                <div>
                  <p className="font-medium">Documents</p>
                  <p className="text-sm text-muted-foreground">
                    {application.documentsComplete ? "Completed" : "Incomplete"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="overview">
            <Eye className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="academic">
            <GraduationCap className="w-4 h-4 mr-2" />
            Academic
          </TabsTrigger>
          <TabsTrigger value="personal">
            <User className="w-4 h-4 mr-2" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="family">
            <Home className="w-4 h-4 mr-2" />
            Family
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Applicant Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Applicant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Full Name
                    </p>
                    <p className="font-medium">
                      {application.surname} {application.otherNames}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Application ID
                    </p>
                    <p className="font-mono font-medium">{application.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <p>{application.personalEmail}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Phone
                    </p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <p>{application.personalPhone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Date of Birth
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <p>
                        {application.dateOfBirth ? (
                          <>
                            {format(new Date(application.dateOfBirth), "PPP")}
                            <span className="text-sm text-muted-foreground ml-2">
                              ({calculateAge(application.dateOfBirth)} years)
                            </span>
                          </>
                        ) : (
                          "Not provided"
                        )}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Gender
                    </p>
                    <p>{application.gender || "Not provided"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Course Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Course of Study
                    </p>
                    <p className="font-medium">
                      {application.courseOfStudy || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Degree Sought
                    </p>
                    <p>{application.degreeSought || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Faculty
                    </p>
                    <p>{application.faculty || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Mode of Admission
                    </p>
                    <p>{application.modeOfAdmission || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      On Scholarship?
                    </p>
                    <p>{application.isOnScholarship ? "Yes" : "No"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Application Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Submitted
                    </p>
                    <p className="font-medium">
                      {application.submittedAt
                        ? format(
                            new Date(application.submittedAt),
                            "PPP 'at' p"
                          )
                        : "Not submitted yet"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Created
                    </p>
                    <p className="font-medium">
                      {format(new Date(application.createdAt), "PPP 'at' p")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Last Updated
                    </p>
                    <p className="font-medium">
                      {format(new Date(application.updatedAt), "PPP 'at' p")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription>
                View your uploaded documents and their verification status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!application.documents || application.documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No documents uploaded</p>
                  <Button asChild className="mt-4">
                    <Link href="/applicant/documents">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {application.documents.map((doc, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-medium">
                              {getDocumentTypeName(doc.type)}
                            </p>
                            {doc.fileName && (
                              <p className="text-sm text-muted-foreground truncate">
                                {doc.fileName}
                              </p>
                            )}
                            {doc.fileSize && (
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(doc.fileSize)}
                              </p>
                            )}
                          </div>
                          <div>
                            {getDocumentStatusBadge(
                              doc.verificationStatus || "pending"
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="text-sm">
                            <p className="text-muted-foreground">Uploaded:</p>
                            <p>
                              {doc.uploadDate
                                ? format(new Date(doc.uploadDate), "PPp")
                                : "Date not available"}
                            </p>
                          </div>

                          {doc.fileUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => window.open(doc.fileUrl, "_blank")}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Document
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* O'Level Results */}
            <Card>
              <CardHeader>
                <CardTitle>O&apos;Level Results</CardTitle>
              </CardHeader>
              <CardContent>
                {application.olevelResults &&
                application.olevelResults.length > 0 ? (
                  <div className="space-y-4">
                    {application.olevelResults.map((result, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Exam Body
                            </p>
                            <p className="font-medium">{result.examBody}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Exam Year
                            </p>
                            <p>{result.examYear}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Exam Number
                            </p>
                            <p className="font-mono">{result.examNumber}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Subjects
                          </p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2">Subject</th>
                                  <th className="text-left py-2">
                                    First Sitting
                                  </th>
                                  <th className="text-left py-2">
                                    Second Sitting
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {result.subjects.map((subject, subIndex) => (
                                  <tr key={subIndex} className="border-b">
                                    <td className="py-2 capitalize">
                                      {subject.subject}
                                    </td>
                                    <td className="py-2">
                                      {subject.gradeFirstSitting || "-"}
                                    </td>
                                    <td className="py-2">
                                      {subject.gradeSecondSitting || "-"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No O&apos;Level results provided
                  </p>
                )}
              </CardContent>
            </Card>

            {/* UTME Subjects */}
            {/* UTME Information */}
            <Card>
              <CardHeader>
                <CardTitle>UTME Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* JAMB Score Display */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      JAMB Score
                    </p>
                    <div className="mt-2">
                      {application.utmeScore ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <div className="text-2xl font-bold">
                              {application.utmeScore}
                              <span className="text-sm font-normal text-muted-foreground ml-1">
                                /400
                              </span>
                            </div>
                            {(() => {
                              const score = parseInt(application.utmeScore);
                              if (isNaN(score)) return null;

                              let badgeVariant:
                                | "default"
                                | "outline"
                                | "destructive" = "outline";
                              let badgeText = "";

                              if (score >= 200) {
                                badgeVariant = "default";
                                badgeText = "Excellent";
                              } else if (score >= 160) {
                                badgeVariant = "outline";
                                badgeText = "Average";
                              } else {
                                badgeVariant = "destructive";
                                badgeText = "Low";
                              }

                              return (
                                <Badge
                                  variant={badgeVariant}
                                  className="text-sm"
                                >
                                  {badgeText}
                                </Badge>
                              );
                            })()}
                          </div>

                          {/* Visual indicator (optional) */}
                          {(() => {
                            const score = parseInt(application.utmeScore);
                            if (isNaN(score)) return null;

                            return (
                              <div className="space-y-1">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full"
                                    style={{
                                      width: `${Math.min(
                                        (score / 400) * 100,
                                        100
                                      )}%`,
                                      backgroundColor:
                                        score >= 200
                                          ? "#10b981" // green
                                          : score >= 160
                                          ? "#f59e0b" // yellow
                                          : "#ef4444", // red
                                    }}
                                  ></div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {score >= 200
                                    ? "✓ Meets most departmental cut-off requirements"
                                    : score >= 160
                                    ? "⚠ Check specific departmental requirements"
                                    : "✗ Below average score - review recommended"}
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <AlertTriangle className="w-4 h-4" />
                          <span>JAMB score not provided</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* UTME Subjects Display */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      UTME Subjects
                    </p>
                    <div className="mt-2">
                      {application.utmeSubjects ? (
                        <div className="flex flex-wrap gap-2">
                          {application.utmeSubjects
                            .split(",")
                            .map((subject, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="capitalize"
                              >
                                {subject.trim()}
                              </Badge>
                            ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          No UTME subjects specified
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Personal Tab */}
        <TabsContent value="personal" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Details */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Marital Status
                    </p>
                    <p>{application.maritalStatus || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Religion
                    </p>
                    <p>{application.religion || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Nationality
                    </p>
                    <p>{application.nationality || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      On Scholarship
                    </p>
                    <p>{application.isOnScholarship ? "Yes" : "No"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Permanent Address
                  </p>
                  <p>{application.permanentAddress || "Not provided"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      State of Origin
                    </p>
                    <p>{application.stateOfOrigin || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Local Government
                    </p>
                    <p>{application.localGovernment || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Hometown
                    </p>
                    <p>{application.hometown || "Not specified"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Family Tab */}
        <TabsContent value="family" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Father's Information */}
            <Card>
              <CardHeader>
                <CardTitle>Father&apos;s Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="font-medium">
                    {application.father?.name || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Occupation
                  </p>
                  <p>{application.father?.occupation || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone Number
                  </p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p>{application.father?.phoneNumber || "Not provided"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Address
                  </p>
                  <p>{application.father?.address || "Not provided"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Mother's Information */}
            <Card>
              <CardHeader>
                <CardTitle>Mother&apos;s Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="font-medium">
                    {application.mother?.name || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Occupation
                  </p>
                  <p>{application.mother?.occupation || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone Number
                  </p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p>{application.mother?.phoneNumber || "Not provided"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Address
                  </p>
                  <p>{application.mother?.address || "Not provided"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Next of Kin */}
            <Card>
              <CardHeader>
                <CardTitle>Next of Kin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="font-medium">
                    {application.nextOfKin?.name || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Relationship
                  </p>
                  <p>{application.nextOfKin?.relationship || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone Number
                  </p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p>
                      {application.nextOfKin?.phoneNumber || "Not provided"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Address
                  </p>
                  <p>{application.nextOfKin?.address || "Not provided"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center mt-8">
        {application.status === "draft" && (
          <Button asChild size="lg">
            <Link href="/applicant/application">Continue Application</Link>
          </Button>
        )}

        {!application.documentsComplete && (
          <Button variant="outline" asChild size="lg">
            <Link href="/applicant/documents">Upload Documents</Link>
          </Button>
        )}

        <Button variant="secondary" onClick={handlePrint} size="lg">
          <Printer className="w-4 h-4 mr-2" />
          Print Application
        </Button>
      </div>
    </div>
  );
}
