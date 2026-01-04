"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { toast } from "sonner";
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
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { format } from "date-fns";
import Link from "next/link";

interface Document {
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  verificationStatus: "pending" | "verified" | "rejected";
}

interface Application {
  id: string;
  userId: string;
  surname: string;
  otherNames: string;
  personalEmail: string;
  status:
    | "pending"
    | "verified"
    | "flagged"
    | "rejected"
    | "submitted"
    | "draft";
  submittedAt: string;
  courseOfStudy: string;
  createdAt: string;
  updatedAt: string;

  utmeScore?: string; // JAMB score - already in your data!

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

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch application details
  const fetchApplication = async () => {
    try {
      setLoading(true);

      // Try to fetch from the admin applications collection
      const applicationRef = doc(db, "applications", applicationId);
      const applicationSnap = await getDoc(applicationRef);

      if (!applicationSnap.exists()) {
        // Try to find in users' applications if not found in admin collection
        const usersRef = collection(db, "users");
        const usersSnap = await getDocs(usersRef);

        for (const userDoc of usersSnap.docs) {
          const userAppRef = doc(
            db,
            "users",
            userDoc.id,
            "applications",
            applicationId
          );
          const userAppSnap = await getDoc(userAppRef);

          if (userAppSnap.exists()) {
            const data = userAppSnap.data();
            setApplication({
              id: applicationId,
              userId: userDoc.id,
              ...data,
            } as Application);
            setLoading(false);
            return;
          }
        }

        toast.error("Application not found");
        router.push("/admin");
        return;
      }

      const data = applicationSnap.data();
      setApplication({
        id: applicationId,
        ...data,
      } as Application);
    } catch (error) {
      console.error("Error fetching application:", error);
      toast.error("Failed to load application details");
    } finally {
      setLoading(false);
    }
  };

  // Update application status
  const updateApplicationStatus = async (newStatus: Application["status"]) => {
    if (!application) return;

    try {
      setUpdating(true);

      // Update in admin collection
      const applicationRef = doc(db, "applications", applicationId);
      await updateDoc(applicationRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      // Also update in user's collection if userId exists
      if (application.userId) {
        const userApplicationRef = doc(
          db,
          "users",
          application.userId,
          "applications",
          applicationId
        );
        await updateDoc(userApplicationRef, {
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });
      }

      // Update local state
      setApplication({
        ...application,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      toast.success(`Application status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating application status:", error);
      toast.error("Failed to update application status");
    } finally {
      setUpdating(false);
    }
  };

  // Update document verification status
  const updateDocumentStatus = async (
    documentIndex: number,
    newStatus: Document["verificationStatus"]
  ) => {
    if (!application || !application.documents) return;

    try {
      setUpdating(true);

      const updatedDocuments = [...application.documents];
      updatedDocuments[documentIndex] = {
        ...updatedDocuments[documentIndex],
        verificationStatus: newStatus,
      };

      // Update in admin collection
      const applicationRef = doc(db, "applications", applicationId);
      await updateDoc(applicationRef, {
        documents: updatedDocuments,
        updatedAt: new Date().toISOString(),
      });

      // Also update in user's collection if userId exists
      if (application.userId) {
        const userApplicationRef = doc(
          db,
          "users",
          application.userId,
          "applications",
          applicationId
        );
        await updateDoc(userApplicationRef, {
          documents: updatedDocuments,
          updatedAt: new Date().toISOString(),
        });
      }

      // Update local state
      setApplication({
        ...application,
        documents: updatedDocuments,
        updatedAt: new Date().toISOString(),
      });

      toast.success(`Document ${newStatus} successfully`);
    } catch (error) {
      console.error("Error updating document status:", error);
      toast.error("Failed to update document status");
    } finally {
      setUpdating(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants = {
      pending: {
        className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        text: "Pending Review",
      },
      submitted: {
        className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        text: "Submitted",
      },
      verified: {
        className: "bg-green-100 text-green-800 hover:bg-green-100",
        text: "Verified",
      },
      flagged: {
        className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
        text: "Flagged",
      },
      rejected: {
        className: "bg-red-100 text-red-800 hover:bg-red-100",
        text: "Rejected",
      },
      draft: {
        className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
        text: "Draft",
      },
    };

    const variant =
      variants[status as keyof typeof variants] || variants.pending;

    return <Badge className={variant.className}>{variant.text}</Badge>;
  };

  // Get document type display name
  const getDocumentTypeName = (type: string) => {
    const types: Record<string, string> = {
      waec: "WAEC Result",
      jamb: "JAMB Result",
      "jamb-letter": "JAMB Admission Letter",
      "birth-certificate": "Birth Certificate",
      "lga-letter": "Local Government Letter",
    };
    return types[type] || type;
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
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

  // Initial fetch
  useEffect(() => {
    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId]);

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
            <h2 className="text-2xl font-bold mb-2">Application Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The application you're looking for doesn't exist or has been
              deleted.
            </p>
            <Button asChild>
              <Link href="/admin">
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
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Application Details
            </h1>
            <p className="text-muted-foreground">ID: {application.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchApplication}
            disabled={updating}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <div>{getStatusBadge(application.status)}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => updateApplicationStatus("verified")}
              disabled={updating || application.status === "verified"}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Verified
            </Button>
            <Button
              onClick={() => updateApplicationStatus("flagged")}
              disabled={updating || application.status === "flagged"}
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-50"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Flag for Review
            </Button>
            <Button
              onClick={() => updateApplicationStatus("rejected")}
              disabled={updating || application.status === "rejected"}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Application
            </Button>
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
                        {format(new Date(application.dateOfBirth), "PPP")}
                        <span className="text-sm text-muted-foreground ml-2">
                          ({calculateAge(application.dateOfBirth)} years)
                        </span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Gender
                    </p>
                    <p>{application.gender}</p>
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
                    <p className="font-medium">{application.courseOfStudy}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Degree Sought
                    </p>
                    <p>{application.degreeSought}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Faculty
                    </p>
                    <p>{application.faculty}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Mode of Admission
                    </p>
                    <p>{application.modeOfAdmission}</p>
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
                      {format(
                        new Date(
                          application.submittedAt || application.createdAt
                        ),
                        "PPP 'at' p"
                      )}
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
                Review and verify applicant's documents. Click "View" to see the
                full document.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!application.documents || application.documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No documents uploaded</p>
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
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(doc.fileSize)}
                            </p>
                          </div>
                          <Badge
                            className={
                              doc.verificationStatus === "verified"
                                ? "bg-green-100 text-green-800"
                                : doc.verificationStatus === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {doc.verificationStatus.charAt(0).toUpperCase() +
                              doc.verificationStatus.slice(1)}
                          </Badge>
                        </div>

                        <div className="space-y-4">
                          <div className="text-sm">
                            <p className="text-muted-foreground">Uploaded:</p>
                            <p>{format(new Date(doc.uploadDate), "PPp")}</p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => window.open(doc.fileUrl, "_blank")}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Document
                            </Button>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() =>
                                  updateDocumentStatus(index, "verified")
                                }
                                disabled={
                                  updating ||
                                  doc.verificationStatus === "verified"
                                }
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                                onClick={() =>
                                  updateDocumentStatus(index, "rejected")
                                }
                                disabled={
                                  updating ||
                                  doc.verificationStatus === "rejected"
                                }
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>

                            {doc.verificationStatus === "pending" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full text-muted-foreground"
                                onClick={() =>
                                  updateDocumentStatus(index, "pending")
                                }
                                disabled={updating}
                              >
                                Keep as Pending
                              </Button>
                            )}
                          </div>
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
                  {/* JAMB Score Display - SIMPLE VERSION */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      JAMB Score
                    </p>
                    <div className="mt-2">
                      {application.utmeScore ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold">
                              {application.utmeScore}
                              <span className="text-sm font-normal text-muted-foreground ml-1">
                                /400
                              </span>
                            </div>
                          </div>
                          {/* Simple text assessment */}
                          <p className="text-sm text-muted-foreground">
                            {(() => {
                              const score = parseInt(application.utmeScore);
                              if (isNaN(score)) return "Invalid score format";
                              if (score >= 200)
                                return "✓ Meets cut-off requirements";
                              if (score >= 160)
                                return "⚠ Average score - review recommended";
                              return "✗ Below average - requires attention";
                            })()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          JAMB score not provided
                        </p>
                      )}
                    </div>
                  </div>

                  {/* UTME Subjects Display - EXISTING CODE */}
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
                  <p>{application.permanentAddress}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      State of Origin
                    </p>
                    <p>{application.stateOfOrigin}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Local Government
                    </p>
                    <p>{application.localGovernment}</p>
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
                  <p className="font-medium">{application.father?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Occupation
                  </p>
                  <p>{application.father?.occupation}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone Number
                  </p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p>{application.father?.phoneNumber}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Address
                  </p>
                  <p>{application.father?.address}</p>
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
                  <p className="font-medium">{application.mother?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Occupation
                  </p>
                  <p>{application.mother?.occupation}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone Number
                  </p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p>{application.mother?.phoneNumber}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Address
                  </p>
                  <p>{application.mother?.address}</p>
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
                  <p className="font-medium">{application.nextOfKin?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Relationship
                  </p>
                  <p>{application.nextOfKin?.relationship}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone Number
                  </p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p>{application.nextOfKin?.phoneNumber}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Address
                  </p>
                  <p>{application.nextOfKin?.address}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
