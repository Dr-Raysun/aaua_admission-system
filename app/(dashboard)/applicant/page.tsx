"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  GraduationCap,
  Shield,
  AlertTriangle,
  Download,
  Eye,
} from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/date";

// Type definitions
interface Document {
  id: string;
  type: string;
  status: string;
  uploadedAt: string;
  uploadDate?: string;
  verificationStatus?: string;
}

interface Application {
  id: string;
  status: string;
  submittedAt: string;
  createdAt: string;
  personalInfoComplete: boolean;
  academicInfoComplete: boolean;
  documentsComplete: boolean;
  documents: Document[];
  nextStep: string;
  estimatedCompletion: string;
  surname?: string;
  otherNames?: string;
  dateOfBirth?: string;
  gender?: string;
  permanentAddress?: string;
  courseOfStudy?: string;
  faculty?: string;
  olevelResults?: Array<{ examBody?: string }>;
  uploadedDocuments?: Record<string, any[]>;
  [key: string]: any;
}

// Utility function to process application data
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
      });
    });
  }

  const nextStep = !personalInfoComplete
    ? "Complete personal information"
    : !academicInfoComplete
    ? "Complete academic records"
    : !documentsComplete
    ? "Upload required documents"
    : raw.status === "submitted"
    ? "Application under review"
    : "Submit your application";

  const estimatedCompletion =
    raw.status === "submitted" ? "2-3 weeks" : "Pending submission";

  return {
    id: raw.id,
    status: raw.status || "draft",
    submittedAt: raw.submittedAt || raw.createdAt || new Date().toISOString(),
    createdAt: raw.createdAt || new Date().toISOString(),
    personalInfoComplete,
    academicInfoComplete,
    documentsComplete,
    documents,
    nextStep,
    estimatedCompletion,
    ...raw,
  };
};

export default function ApplicantDashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [application, setApplication] = useState<Application | null>(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fix 1: Add detailed authentication logging
  useEffect(() => {
    console.log("Auth State:", {
      isLoaded,
      isSignedIn,
      userId: user?.id,
      user: user,
    });
  }, [isLoaded, isSignedIn, user]);

  // Fix 2: Optimized data fetching with proper dependencies
  useEffect(() => {
    const fetchApplication = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("Fetching application for user:", user?.id);
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
        const submittedApp = apps.find(
          (app: any) => app.status === "submitted"
        );
        const raw = submittedApp || apps[apps.length - 1];

        console.log("Processing application data:", raw);
        const app = processApplicationData(raw);

        setApplication(app);

        // Calculate progress
        let complete = 0;
        if (app.personalInfoComplete) complete += 33;
        if (app.academicInfoComplete) complete += 33;
        if (app.documentsComplete) complete += 34;
        setProgress(complete);
      } catch (error) {
        console.error("Error fetching application:", error);
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
        setApplication(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Fix 1 & 2: Only fetch if user is loaded and signed in
    if (!isLoaded) {
      console.log("Clerk not loaded yet");
      return;
    }

    if (!isSignedIn) {
      console.log("User not signed in");
      setIsLoading(false);
      return;
    }

    console.log("User is signed in, fetching application...");
    fetchApplication();
  }, [isLoaded, isSignedIn, user?.id]); // Proper dependencies

  // Fix 5: Memoize status badges for performance
  const statusBadges = useMemo(() => {
    const baseClass = "w-3 h-3 mr-1";
    return {
      verified: (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className={baseClass} />
          Verified
        </Badge>
      ),
      pending: (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <Clock className={baseClass} />
          Pending
        </Badge>
      ),
      rejected: (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <AlertTriangle className={baseClass} />
          Needs Review
        </Badge>
      ),
    };
  }, []);

  const getStatusBadge = (status: string) => {
    return (
      statusBadges[status as keyof typeof statusBadges] || (
        <Badge variant="outline">{status}</Badge>
      )
    );
  };

  const applicationStatusBadges = useMemo(() => {
    return {
      submitted: (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Submitted
        </Badge>
      ),
      draft: (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          Draft
        </Badge>
      ),
      under_review: (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Under Review
        </Badge>
      ),
      approved: (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Approved
        </Badge>
      ),
      rejected: (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          Rejected
        </Badge>
      ),
    };
  }, []);

  const getApplicationStatusBadge = (status: string) => {
    return (
      applicationStatusBadges[
        status as keyof typeof applicationStatusBadges
      ] || <Badge variant="outline">{status}</Badge>
    );
  };

  // Fix 3: Enhanced loading and authentication states
  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
              You need to be signed in to view your dashboard
            </p>
          </div>
          <Link href="/sign-in">
            <Button className="w-full">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-40 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">Error Loading Application</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, {user?.firstName}!
            </h1>
            <p className="text-muted-foreground">
              You haven't started an application yet.
            </p>
          </div>

          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">
                    Start Your Application
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Begin your admission application process
                  </p>
                </div>
                <Link href="/applicant/application">
                  <Button className="w-full">Start New Application</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground">
          Track your admission application progress and manage your documents
        </p>
      </div>

      {/* Application Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Application Status</CardTitle>
              <CardDescription>
                Application ID: {application.id}
              </CardDescription>
            </div>
            {getApplicationStatusBadge(application.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="font-bold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <div
                className={`p-3 rounded-full ${
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

            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <div
                className={`p-3 rounded-full ${
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

            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <div
                className={`p-3 rounded-full ${
                  application.documentsComplete ? "bg-green-100" : "bg-gray-100"
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

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">
                  Next Step: {application.nextStep}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Estimated completion: {application.estimatedCompletion}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/applicant/application">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold">Continue Application</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Complete your application form
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/applicant/documents">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold">Upload Documents</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Submit required documents
              </p>
            </CardContent>
          </Card>
        </Link>

        
        <Link href="/applicant/status">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold">View Status</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Check application admission status               </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/applicant/detail">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold">View Detail</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Check application etails
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Download className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold">Download</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Get admission letter
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Document Verification Status</CardTitle>
          <CardDescription>
            Track the verification status of your submitted documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {application.documents?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {application.documents.map((doc: Document) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      {doc.type.replace(/-/g, " ").toUpperCase()}
                    </TableCell>
                    <TableCell>{formatDate(doc.uploadDate)}</TableCell>
                    <TableCell>
                      {getStatusBadge(doc.verificationStatus ?? "pending")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-lg mb-2">
                No Documents Uploaded
              </h3>
              <p className="text-muted-foreground mb-4">
                Upload required documents to complete your application
              </p>
              <Link href="/applicant/documents">
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Documents
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Information - Remove in production */}
      {process.env.NODE_ENV === "development" && application && (
        <Card className="mt-8 border-dashed border-yellow-400">
          <CardHeader>
            <CardTitle className="text-yellow-700">Debug Information</CardTitle>
            <CardDescription>For development purposes only</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-sm">
                  Raw Application Data:
                </h4>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify(application, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-sm">Documents Array:</h4>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(application.documents, null, 2)}
                </pre>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-2 border rounded">
                  <div className="font-bold text-sm">Personal Info</div>
                  <div
                    className={`text-lg ${
                      application.personalInfoComplete
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {application.personalInfoComplete ? "✓" : "✗"}
                  </div>
                </div>
                <div className="text-center p-2 border rounded">
                  <div className="font-bold text-sm">Academic Info</div>
                  <div
                    className={`text-lg ${
                      application.academicInfoComplete
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {application.academicInfoComplete ? "✓" : "✗"}
                  </div>
                </div>
                <div className="text-center p-2 border rounded">
                  <div className="font-bold text-sm">Documents</div>
                  <div
                    className={`text-lg ${
                      application.documentsComplete
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {application.documentsComplete ? "✓" : "✗"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
