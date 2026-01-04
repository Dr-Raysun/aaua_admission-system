"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  FileQuestion,
} from "lucide-react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

interface UploadedFile {
  id: string;
  type: string;
  file: File;
  progress: number;
  url?: string;
  error?: string;
}

interface DocumentUploadProps {
  onUploadComplete: (files: UploadedFile[]) => void;
}

const DOCUMENT_TYPES = [
  { id: "waec", label: "WAEC/NECO Result", required: true },
  { id: "jamb", label: "JAMB Result", required: true },
  { id: "jamb-letter", label: "JAMB Admission Letter", required: true },
  { id: "birth-certificate", label: "Birth Certificate", required: true },
  {
    id: "lga-letter",
    label: "Certificate of Origin/LGA Letter",
    required: true,
  },
  { id: "affidavit", label: "Court Affidavit", required: false },
  { id: "attestation", label: "Attestation Letter", required: false },
];

export default function DocumentUpload({
  onUploadComplete,
}: DocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedType, setSelectedType] = useState<string>("waec");

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        type: selectedType,
        file,
        progress: 0,
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // Upload files to Firebase Storage
      newFiles.forEach((file) => uploadFile(file));
    },
    [selectedType]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const uploadFile = async (uploadFileData: UploadedFile) => {
    const storageRef = ref(
      storage,
      `documents/${uploadFileData.type}/${uploadFileData.id}_${uploadFileData.file.name}`
    );
    const uploadTask = uploadBytesResumable(storageRef, uploadFileData.file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFileData.id
              ? { ...f, progress: Math.round(progress) }
              : f
          )
        );
      },
      (error) => {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFileData.id
              ? { ...f, error: error.message, progress: 0 }
              : f
          )
        );
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          setUploadedFiles((prev) => {
            const updatedFiles = prev.map((f) =>
              f.id === uploadFileData.id
                ? { ...f, url: downloadURL, progress: 100 }
                : f
            );

            // Get all completed files
            const completedFiles = updatedFiles.filter((f) => f.url);
            if (completedFiles.length > 0) {
              onUploadComplete(completedFiles);
            }

            return updatedFiles;
          });
        } catch (error) {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFileData.id
                ? { ...f, error: "Failed to get download URL", progress: 0 }
                : f
            )
          );
        }
      }
    );
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => {
      const filteredFiles = prev.filter((f) => f.id !== id);
      const completedFiles = filteredFiles.filter((f) => f.url);
      if (completedFiles.length > 0) {
        onUploadComplete(completedFiles);
      }
      return filteredFiles;
    });
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".pdf")) return <FileText className="w-5 h-5" />;
    if (fileName.match(/\.(jpg|jpeg|png|gif)$/i))
      return <ImageIcon className="w-5 h-5" />;
    return <FileQuestion className="w-5 h-5" />;
  };

  const getUploadedCountByType = (type: string) => {
    return uploadedFiles.filter((f) => f.type === type && f.url).length;
  };

  return (
    <div className="space-y-6">
      {/* Document Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Document Type</CardTitle>
          <CardDescription>
            Choose the type of document you want to upload
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {DOCUMENT_TYPES.map((doc) => {
              const uploadedCount = getUploadedCountByType(doc.id);
              return (
                <Button
                  key={doc.id}
                  type="button"
                  variant={selectedType === doc.id ? "default" : "outline"}
                  onClick={() => setSelectedType(doc.id)}
                  className="justify-start relative"
                >
                  <span>{doc.label}</span>
                  {doc.required && (
                    <Badge
                      variant="secondary"
                      className="ml-2 text-xs bg-blue-100 text-blue-800"
                    >
                      Required
                    </Badge>
                  )}
                  {uploadedCount > 0 && (
                    <Badge
                      variant="default"
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-green-500 text-white text-xs"
                    >
                      {uploadedCount}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            Upload scanned copies of your documents (PDF, JPG, PNG up to 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? "Drop the files here" : "Drag & drop files here"}
            </p>
            <p className="text-gray-500 mb-2">or click to browse files</p>
            <p className="text-sm text-gray-400">
              Selected:{" "}
              {DOCUMENT_TYPES.find((d) => d.id === selectedType)?.label}
            </p>
          </div>

          {/* Selected Type Info */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Currently uploading:</span>{" "}
              {DOCUMENT_TYPES.find((d) => d.id === selectedType)?.label}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {DOCUMENT_TYPES.find((d) => d.id === selectedType)?.required
                ? "This document is required for submission"
                : "This document is optional"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
            <CardDescription>
              Track the upload progress of your documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles.map((file) => {
                const documentType = DOCUMENT_TYPES.find(
                  (d) => d.id === file.type
                );
                return (
                  <div key={file.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.file.name)}
                        <div>
                          <p className="font-medium">{file.file.name}</p>
                          <p className="text-sm text-gray-500">
                            {documentType?.label || file.type}
                          </p>
                          <p className="text-xs text-gray-400">
                            Size: {(file.file.size / (1024 * 1024)).toFixed(2)}{" "}
                            MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {file.error ? (
                          <Badge
                            variant="destructive"
                            className="flex items-center space-x-1"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Error</span>
                          </Badge>
                        ) : file.progress === 100 ? (
                          <Badge
                            variant="secondary"
                            className="flex items-center space-x-1 bg-green-100 text-green-800"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Uploaded</span>
                          </Badge>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-medium">
                              {file.progress}%
                            </span>
                            <span className="text-xs text-gray-500">
                              Uploading...
                            </span>
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          disabled={file.progress > 0 && file.progress < 100}
                        >
                          {file.progress === 100 ? "Remove" : "Cancel"}
                        </Button>
                      </div>
                    </div>

                    {file.progress < 100 && !file.error && (
                      <div className="mt-2">
                        <Progress value={file.progress} className="h-2" />
                      </div>
                    )}

                    {file.error && (
                      <div className="mt-2 p-2 bg-red-50 rounded">
                        <p className="text-sm text-red-600">{file.error}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            // Retry upload
                            setUploadedFiles((prev) =>
                              prev.filter((f) => f.id !== file.id)
                            );
                            uploadFile({
                              ...file,
                              progress: 0,
                              error: undefined,
                            });
                          }}
                        >
                          Retry Upload
                        </Button>
                      </div>
                    )}

                    {file.url && (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="w-full"
                        >
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Uploaded Document
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Upload Summary */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Total Uploaded</p>
                  <p className="text-xs text-gray-500">
                    {uploadedFiles.filter((f) => f.url).length} of{" "}
                    {uploadedFiles.length} files completed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Required Documents</p>
                  <p className="text-xs text-gray-500">
                    {DOCUMENT_TYPES.filter((d) => d.required)
                      .map((doc) => getUploadedCountByType(doc.id))
                      .reduce((a, b) => a + b, 0)}{" "}
                    of {DOCUMENT_TYPES.filter((d) => d.required).length}{" "}
                    uploaded
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Summary */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Document Requirements</h3>
        <div className="space-y-3">
          {DOCUMENT_TYPES.map((doc) => {
            const uploadedCount = getUploadedCountByType(doc.id);
            return (
              <div key={doc.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  {uploadedCount > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-2"></div>
                  )}
                  <span className={doc.required ? "font-medium" : ""}>
                    {doc.label}
                    {doc.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {uploadedCount > 0
                    ? `${uploadedCount} uploaded`
                    : "Not uploaded"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Note:</span> Documents marked with *
            are required for submission. Make sure all uploaded documents are
            clear and legible.
          </p>
        </div>
      </div>
    </div>
  );
}
