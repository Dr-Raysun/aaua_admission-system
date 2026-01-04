"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import DocumentUpload from "@/components/documents/DocumentUpload";
import PersonalInfoForm from "@/components/applicant/PersonalInfoForm";
import AcademicInfoForm from "@/components/applicant/AcademicInfoForm";
import FamilyInfoForm from "@/components/applicant/FamilyInfoForm";

interface UploadedFile {
  id: string;
  type: string;
  file: File;
  progress: number;
  url?: string;
  error?: string;
}

export default function ApplicationPage() {
  const router = useRouter();
  const { userId } = useAuth();

  // State for form data and UI
  const [activeTab, setActiveTab] = useState("personal");
  const [uploadedDocuments, setUploadedDocuments] = useState<
    Record<string, UploadedFile[]>
  >({});
  const [formData, setFormData] = useState({
    // Personal Information
    surname: "",
    otherNames: "",
    personalPhone: "",
    personalEmail: "",
    dateOfBirth: "",
    modeOfAdmission: "",
    faculty: "",
    courseOfStudy: "",
    degreeSought: "",
    gender: "",
    maritalStatus: "",
    religion: "",
    nationality: "",
    stateOfOrigin: "",
    localGovernment: "",
    hometown: "",
    permanentAddress: "",
    isOnScholarship: false,

    // Academic Information
    utmeSubjects: "",
    utmeScore: "", // JAMB score field
    olevelResults: [
      {
        examBody: "",
        examNumber: "",
        examYear: "",
        subjects: [
          { subject: "", gradeFirstSitting: "", gradeSecondSitting: "" },
        ],
      },
    ],

    // Family Information
    nextOfKin: {
      name: "",
      phoneNumber: "",
      relationship: "",
      address: "",
    },
    father: {
      name: "",
      phoneNumber: "",
      occupation: "",
      address: "",
    },
    mother: {
      name: "",
      phoneNumber: "",
      occupation: "",
      address: "",
    },
  });

  // NEW: State for preventing multiple submissions and loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingApplicationId, setExistingApplicationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing draft on page load
  useEffect(() => {
    const loadExistingDraft = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/applications/draft");
        const result = await response.json();

        if (result.success && result.application) {
          // Set the existing application ID
          setExistingApplicationId(result.applicationId);

          // Load the form data from the draft
          const draftData = result.application;
          setFormData({
            surname: draftData.surname || "",
            otherNames: draftData.otherNames || "",
            personalPhone: draftData.personalPhone || "",
            personalEmail: draftData.personalEmail || "",
            dateOfBirth: draftData.dateOfBirth || "",
            modeOfAdmission: draftData.modeOfAdmission || "",
            faculty: draftData.faculty || "",
            courseOfStudy: draftData.courseOfStudy || "",
            degreeSought: draftData.degreeSought || "",
            gender: draftData.gender || "",
            maritalStatus: draftData.maritalStatus || "",
            religion: draftData.religion || "",
            nationality: draftData.nationality || "",
            stateOfOrigin: draftData.stateOfOrigin || "",
            localGovernment: draftData.localGovernment || "",
            hometown: draftData.hometown || "",
            permanentAddress: draftData.permanentAddress || "",
            isOnScholarship: draftData.isOnScholarship || false,
            utmeSubjects: draftData.utmeSubjects || "",
            utmeScore: draftData.utmeScore || "",
            olevelResults: draftData.olevelResults || [
              {
                examBody: "",
                examNumber: "",
                examYear: "",
                subjects: [
                  {
                    subject: "",
                    gradeFirstSitting: "",
                    gradeSecondSitting: "",
                  },
                ],
              },
            ],
            nextOfKin: draftData.nextOfKin || {
              name: "",
              phoneNumber: "",
              relationship: "",
              address: "",
            },
            father: draftData.father || {
              name: "",
              phoneNumber: "",
              occupation: "",
              address: "",
            },
            mother: draftData.mother || {
              name: "",
              phoneNumber: "",
              occupation: "",
              address: "",
            },
          });

          // Load uploaded documents if any
          if (draftData.uploadedDocuments) {
            setUploadedDocuments(draftData.uploadedDocuments);
          }

          toast.info("Loaded existing draft", {
            description: "Your previously saved application has been loaded.",
          });
        }
      } catch (error) {
        console.error("Error loading draft:", error);
        // No draft exists, that's okay
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingDraft();
  }, [userId]);

  // Update form data when user fills forms
  const handleFormUpdate = (section: string, data: any) => {
    if (section === "personal") {
      setFormData((prev) => ({ ...prev, ...data }));
    } else if (section === "academic") {
      setFormData((prev) => ({
        ...prev,
        utmeSubjects: data.utmeSubjects,
        utmeScore: data.utmeScore,
        olevelResults: data.olevelResults,
      }));
    } else if (section === "family") {
      setFormData((prev) => ({
        ...prev,
        nextOfKin: data.nextOfKin,
        father: data.father,
        mother: data.mother,
      }));
    }
  };

  // Handle document uploads
  const handleDocumentUpload = (files: UploadedFile[]) => {
    // Group uploaded files by type
    const groupedFiles: Record<string, UploadedFile[]> = {};

    files.forEach((file) => {
      if (!groupedFiles[file.type]) {
        groupedFiles[file.type] = [];
      }
      groupedFiles[file.type].push(file);
    });

    setUploadedDocuments((prev) => ({
      ...prev,
      ...groupedFiles,
    }));

    toast.success("Documents uploaded successfully", {
      description: `${files.length} document(s) uploaded`,
    });
  };

  // Save draft to database (updates existing or creates new)
  const saveDraftToDatabase = async () => {
    try {
      const response = await fetch("/api/applications/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationData: {
            ...formData,
            uploadedDocuments: uploadedDocuments,
            status: "draft",
            lastUpdated: new Date().toISOString(),
          },
          // Pass the existing ID if we have one
          applicationId: existingApplicationId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Store the application ID if this is the first save
        if (!existingApplicationId && result.applicationId) {
          setExistingApplicationId(result.applicationId);
        }

        toast.success("Draft Saved", {
          description: result.isUpdate
            ? "Your application has been updated successfully."
            : "Your application has been saved successfully.",
        });
      } else {
        throw new Error(result.error || "Failed to save draft");
      }
    } catch (error) {
      toast.error("Save Failed", {
        description: "Failed to save your application. Please try again.",
      });
      console.error("Error saving draft:", error);
    }
  };

  // Submit application to database (final submission)
  const submitApplicationToDatabase = async () => {
    try {
      // Prepare documents array
      const documents = Object.entries(uploadedDocuments).flatMap(
        ([type, files]) =>
          files.map((file) => ({
            type,
            fileName: file.file.name,
            fileUrl: file.url || "",
            fileSize: file.file.size,
            uploadDate: new Date().toISOString(),
            verificationStatus: "pending" as const,
          }))
      );

      const response = await fetch("/api/applications/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationData: {
            ...formData,
            personalInformation: {
              surname: formData.surname,
              otherNames: formData.otherNames,
              personalPhone: formData.personalPhone,
              personalEmail: formData.personalEmail,
              dateOfBirth: formData.dateOfBirth,
              modeOfAdmission: formData.modeOfAdmission,
              faculty: formData.faculty,
              courseOfStudy: formData.courseOfStudy,
              degreeSought: formData.degreeSought,
              gender: formData.gender,
              maritalStatus: formData.maritalStatus,
              religion: formData.religion,
              nationality: formData.nationality,
              stateOfOrigin: formData.stateOfOrigin,
              localGovernment: formData.localGovernment,
              hometown: formData.hometown,
              permanentAddress: formData.permanentAddress,
              isOnScholarship: formData.isOnScholarship,
            },
            academicRecords: {
              utmeSubjects: formData.utmeSubjects,
              utmeScore: formData.utmeScore,
              olevelResults: formData.olevelResults,
            },
            familyInformation: {
              nextOfKin: formData.nextOfKin,
              father: formData.father,
              mother: formData.mother,
            },
            status: "submitted",
            submittedAt: new Date().toISOString(),
          },
          documents,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Application Submitted", {
          description: "Your application has been submitted for review.",
        });

        // Redirect after successful submission
        setTimeout(() => {
          router.push("/applicant");
        }, 2000);
      } else {
        throw new Error(result.error || "Failed to submit application");
      }
    } catch (error) {
      toast.error("Submission Failed", {
        description: "Failed to submit your application. Please try again.",
      });
      console.error("Error submitting application:", error);
      // Reset submitting state on error
      setIsSubmitting(false);
    }
  };

  // Handle save draft button click
  const handleSave = async () => {
    // Validate required fields before saving
    if (activeTab === "documents") {
      const requiredDocs = ["waec", "birth-certificate", "lga-letter"];
      const missingDocs = requiredDocs.filter(
        (docType) =>
          !uploadedDocuments[docType] || uploadedDocuments[docType].length === 0
      );

      if (missingDocs.length > 0) {
        toast.error("Missing Required Documents", {
          description: `Please upload: ${missingDocs
            .map((doc) => {
              if (doc === "waec") return "WAEC/NECO Result";
              if (doc === "birth-certificate") return "Birth Certificate";
              return "Certificate of Origin";
            })
            .join(", ")}`,
        });
        return;
      }
    }

    // Validate required personal info
    const requiredFields = [
      "surname",
      "otherNames",
      "personalPhone",
      "personalEmail",
      "dateOfBirth",
      "gender",
      "permanentAddress",
    ];
    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData]
    );

    if (missingFields.length > 0) {
      toast.error("Incomplete Application", {
        description: "Please complete all required personal information fields",
      });
      return;
    }

    // Validate JAMB score if entered
    if (formData.utmeScore) {
      const jambScore = parseInt(formData.utmeScore);
      if (isNaN(jambScore) || jambScore < 0 || jambScore > 400) {
        toast.error("Invalid JAMB Score", {
          description: "JAMB score must be between 0 and 400",
        });
        return;
      }
    }

    // Save to database
    await saveDraftToDatabase();
  };

  // Handle final submission button click
  const handleSubmit = async () => {
    // PREVENT MULTIPLE SUBMISSIONS: Check if already submitting
    if (isSubmitting) {
      toast.info("Submission in Progress", {
        description:
          "Your application is already being submitted. Please wait.",
      });
      return;
    }

    // Set submitting state immediately
    setIsSubmitting(true);

    // Validate all required documents are uploaded
    const requiredDocs = ["waec", "birth-certificate", "lga-letter"];
    const missingDocs = requiredDocs.filter(
      (docType) =>
        !uploadedDocuments[docType] || uploadedDocuments[docType].length === 0
    );

    if (missingDocs.length > 0) {
      toast.error("Cannot Submit Application", {
        description: `Please upload all required documents: ${missingDocs
          .map((doc) => {
            if (doc === "waec") return "WAEC/NECO Result";
            if (doc === "birth-certificate") return "Birth Certificate";
            return "Certificate of Origin";
          })
          .join(", ")}`,
      });
      setIsSubmitting(false);
      return;
    }

    // Validate required personal info
    const requiredFields = [
      "surname",
      "otherNames",
      "personalPhone",
      "personalEmail",
      "dateOfBirth",
      "gender",
      "permanentAddress",
    ];
    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData]
    );

    if (missingFields.length > 0) {
      toast.error("Incomplete Application", {
        description: "Please complete all required personal information fields",
      });
      setIsSubmitting(false);
      return;
    }

    // Validate JAMB score is provided
    if (!formData.utmeScore || formData.utmeScore.trim() === "") {
      toast.error("Missing JAMB Score", {
        description: "Please provide your JAMB score",
      });
      setIsSubmitting(false);
      return;
    }

    // Validate JAMB score range
    const jambScore = parseInt(formData.utmeScore);
    if (isNaN(jambScore) || jambScore < 0 || jambScore > 400) {
      toast.error("Invalid JAMB Score", {
        description: "JAMB score must be between 0 and 400",
      });
      setIsSubmitting(false);
      return;
    }

    // Validate UTME subjects are provided
    if (!formData.utmeSubjects || formData.utmeSubjects.trim() === "") {
      toast.error("Missing UTME Subjects", {
        description: "Please provide your UTME subjects",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Submit to database
      await submitApplicationToDatabase();
    } catch (error) {
      // Handle any errors
      setIsSubmitting(false);
    }
  };

  // Tab configuration
  const tabs = [
    { id: "personal", label: "Personal Info" },
    { id: "academic", label: "Academic Records" },
    { id: "family", label: "Family Info" },
    { id: "documents", label: "Documents" },
    { id: "review", label: "Review & Submit" },
  ];

  // Calculate document completion status
  const uploadedDocTypes = Object.keys(uploadedDocuments);
  const totalRequiredDocs = 3; // WAEC, Birth Certificate, LGA Letter
  const uploadedRequiredDocs = uploadedDocTypes.filter((type) =>
    ["waec", "birth-certificate", "lga-letter"].includes(type)
  ).length;
  const documentCompletionPercentage = Math.round(
    (uploadedRequiredDocs / totalRequiredDocs) * 100
  );

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {userId ? "Loading your application..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Progress Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Application Form {existingApplicationId ? "(Editing Draft)" : ""}
          </h1>
          <p className="text-muted-foreground">
            Complete all sections to submit your admission application
          </p>
          {existingApplicationId && (
            <p className="text-sm text-blue-600">
              <strong>Draft ID:</strong> {existingApplicationId}
            </p>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {tabs.map((tab, index) => (
            <div key={tab.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  activeTab === tab.id ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {tab.label}
              </span>
              {index < tabs.length - 1 && (
                <div className="w-16 h-0.5 bg-gray-200 mx-4"></div>
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Document Progress Indicator */}
        {activeTab === "documents" && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Document Upload Progress
              </span>
              <span className="text-sm font-bold">
                {documentCompletionPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${documentCompletionPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-blue-700 mt-2">
              {uploadedRequiredDocs} of {totalRequiredDocs} required documents
              uploaded
            </p>
          </div>
        )}

        {/* Form Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <PersonalInfoForm
              data={formData}
              onSubmit={(data) => handleFormUpdate("personal", data)}
              onNext={() => setActiveTab("academic")}
            />
          </TabsContent>

          {/* Academic Records Tab */}
          <TabsContent value="academic" className="space-y-6">
            <AcademicInfoForm
              data={{
                utmeSubjects: formData.utmeSubjects,
                utmeScore: formData.utmeScore,
                olevelResults: formData.olevelResults,
              }}
              onSubmit={(data) => handleFormUpdate("academic", data)}
              onNext={() => setActiveTab("family")}
              onBack={() => setActiveTab("personal")}
            />
          </TabsContent>

          {/* Family Information Tab */}
          <TabsContent value="family" className="space-y-6">
            <FamilyInfoForm
              data={{
                nextOfKin: formData.nextOfKin,
                father: formData.father,
                mother: formData.mother,
              }}
              onSubmit={(data) => handleFormUpdate("family", data)}
              onNext={() => setActiveTab("documents")}
              onBack={() => setActiveTab("academic")}
            />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Upload</CardTitle>
                <CardDescription>
                  Upload scanned copies of your required documents. All
                  documents must be clear and legible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentUpload onUploadComplete={handleDocumentUpload} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Review & Submit Tab */}
          <TabsContent value="review" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review & Submit</CardTitle>
                <CardDescription>
                  Review your application before final submission
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Application Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium">
                        {formData.surname} {formData.otherNames}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Course</p>
                      <p className="font-medium">{formData.courseOfStudy}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">JAMB Score</p>
                      <p className="font-medium">
                        {formData.utmeScore
                          ? `${formData.utmeScore}/400`
                          : "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        Application Status
                      </p>
                      <Badge variant="outline">Ready to Submit</Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">UTME Subjects</p>
                      <p className="font-medium">
                        {formData.utmeSubjects || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Updated</p>
                      <p className="font-medium">Just now</p>
                    </div>
                  </div>
                </div>

                {/* Document Status Summary */}
                <div className="space-y-4">
                  <h3 className="font-medium">Document Upload Status</h3>
                  <div className="space-y-3">
                    {[
                      { id: "waec", label: "WAEC/NECO Result", required: true },
                      {
                        id: "birth-certificate",
                        label: "Birth Certificate",
                        required: true,
                      },
                      {
                        id: "lga-letter",
                        label: "Certificate of Origin",
                        required: true,
                      },
                      { id: "jamb", label: "JAMB Result", required: true },
                      {
                        id: "jamb-letter",
                        label: "JAMB Admission Letter",
                        required: true,
                      },
                    ].map((doc) => {
                      const isUploaded =
                        uploadedDocuments[doc.id] &&
                        uploadedDocuments[doc.id].length > 0;
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isUploaded ? "bg-green-100" : "bg-gray-100"
                              }`}
                            >
                              {isUploaded ? (
                                <svg
                                  className="w-4 h-4 text-green-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{doc.label}</p>
                              <p className="text-sm text-muted-foreground">
                                {isUploaded
                                  ? `${
                                      uploadedDocuments[doc.id].length
                                    } file(s) uploaded`
                                  : "Not uploaded"}
                              </p>
                            </div>
                          </div>
                          {doc.required && (
                            <Badge
                              variant={isUploaded ? "default" : "destructive"}
                            >
                              {isUploaded ? "Uploaded" : "Required"}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg ${
                    uploadedRequiredDocs === totalRequiredDocs
                      ? "bg-green-50 border border-green-200"
                      : "bg-yellow-50 border border-yellow-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className={`w-5 h-5 mt-0.5 ${
                        uploadedRequiredDocs === totalRequiredDocs
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    />
                    <div>
                      <p
                        className={`font-medium ${
                          uploadedRequiredDocs === totalRequiredDocs
                            ? "text-green-900"
                            : "text-yellow-900"
                        }`}
                      >
                        {uploadedRequiredDocs === totalRequiredDocs
                          ? "All Required Documents Uploaded ✓"
                          : "Missing Required Documents"}
                      </p>
                      <p
                        className={`text-sm mt-1 ${
                          uploadedRequiredDocs === totalRequiredDocs
                            ? "text-green-700"
                            : "text-yellow-700"
                        }`}
                      >
                        {uploadedRequiredDocs === totalRequiredDocs
                          ? "Your application is ready for submission."
                          : `Please upload ${
                              totalRequiredDocs - uploadedRequiredDocs
                            } more required document(s) before submitting.`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="terms" required />
                  <Label htmlFor="terms">
                    I certify that all information provided is accurate and
                    complete
                  </Label>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSubmit}
                  className="w-full"
                  disabled={
                    uploadedRequiredDocs < totalRequiredDocs || isSubmitting
                  }
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              const currentIndex = tabs.findIndex(
                (tab) => tab.id === activeTab
              );
              if (currentIndex > 0) {
                setActiveTab(tabs[currentIndex - 1].id);
              }
            }}
            disabled={activeTab === "personal"}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              {existingApplicationId ? "Update Draft" : "Save Draft"}
            </Button>

            <Button
              onClick={() => {
                const currentIndex = tabs.findIndex(
                  (tab) => tab.id === activeTab
                );
                if (currentIndex < tabs.length - 1) {
                  setActiveTab(tabs[currentIndex + 1].id);
                }
              }}
              disabled={activeTab === "review"}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
