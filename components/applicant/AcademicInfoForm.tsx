"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AcademicInfoFormProps {
  data: {
    utmeSubjects: string;
    utmeScore: string; // NEW: Added JAMB score field
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
  };
  onSubmit: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function AcademicInfoForm({
  data,
  onSubmit,
  onNext,
  onBack,
}: AcademicInfoFormProps) {
  const [formData, setFormData] = useState({
    utmeSubjects: data.utmeSubjects || "",
    utmeScore: data.utmeScore || "", // NEW: Initialize JAMB score
    olevelResults: data.olevelResults || [
      {
        examBody: "",
        examNumber: "",
        examYear: "",
        subjects: [
          { subject: "", gradeFirstSitting: "", gradeSecondSitting: "" },
        ],
      },
    ],
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOLevelChange = (index: number, field: string, value: any) => {
    const newResults = [...formData.olevelResults];
    newResults[index] = { ...newResults[index], [field]: value };
    handleChange("olevelResults", newResults);
  };

  const handleSubjectChange = (
    olevelIndex: number,
    subjectIndex: number,
    field: string,
    value: any
  ) => {
    const newResults = [...formData.olevelResults];
    const newSubjects = [...newResults[olevelIndex].subjects];
    newSubjects[subjectIndex] = {
      ...newSubjects[subjectIndex],
      [field]: value,
    };
    newResults[olevelIndex] = {
      ...newResults[olevelIndex],
      subjects: newSubjects,
    };
    handleChange("olevelResults", newResults);
  };

  const addSubject = (olevelIndex: number) => {
    const newResults = [...formData.olevelResults];
    newResults[olevelIndex].subjects.push({
      subject: "",
      gradeFirstSitting: "",
      gradeSecondSitting: "",
    });
    handleChange("olevelResults", newResults);
  };

  const removeSubject = (olevelIndex: number, subjectIndex: number) => {
    const newResults = [...formData.olevelResults];
    newResults[olevelIndex].subjects.splice(subjectIndex, 1);
    handleChange("olevelResults", newResults);
  };

  const addOLevelResult = () => {
    const newResults = [
      ...formData.olevelResults,
      {
        examBody: "",
        examNumber: "",
        examYear: "",
        subjects: [
          { subject: "", gradeFirstSitting: "", gradeSecondSitting: "" },
        ],
      },
    ];
    handleChange("olevelResults", newResults);
  };

  const removeOLevelResult = (index: number) => {
    const newResults = formData.olevelResults.filter((_, i) => i !== index);
    handleChange("olevelResults", newResults);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate JAMB score
    const jambScore = parseInt(formData.utmeScore);
    if (
      formData.utmeScore &&
      (isNaN(jambScore) || jambScore < 0 || jambScore > 400)
    ) {
      alert("JAMB score must be a number between 0 and 400");
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Academic Records</CardTitle>
          <CardDescription>
            Provide your academic qualifications and examination results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* JAMB/UTME Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">JAMB/UTME Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* JAMB Score - NEW FIELD */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="utmeScore">JAMB Score *</Label>
                  <Input
                    id="utmeScore"
                    type="number"
                    min="0"
                    max="400"
                    step="1"
                    placeholder="e.g., 285"
                    value={formData.utmeScore}
                    onChange={(e) => handleChange("utmeScore", e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter your total JAMB score (0-400)
                  </p>
                </div>

                {/* Score Progress Indicator */}
                {formData.utmeScore && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Score Progress
                      </span>
                      <span className="font-medium">
                        {formData.utmeScore}/400
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          parseInt(formData.utmeScore) >= 200
                            ? "bg-green-600"
                            : parseInt(formData.utmeScore) >= 160
                            ? "bg-yellow-600"
                            : "bg-red-600"
                        }`}
                        style={{
                          width: `${Math.min(
                            (parseInt(formData.utmeScore) / 400) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {parseInt(formData.utmeScore) >= 200
                        ? "Good score! Meets most departmental cut-offs"
                        : parseInt(formData.utmeScore) >= 160
                        ? "Average score. Check specific departmental requirements"
                        : "Below average. Consider upgrading"}
                    </p>
                  </div>
                )}
              </div>

              {/* UTME Subjects */}
              <div className="space-y-2">
                <Label htmlFor="utmeSubjects">UTME Subjects *</Label>
                <Input
                  id="utmeSubjects"
                  placeholder="e.g., ENG, MAT, PHY, CHE"
                  value={formData.utmeSubjects}
                  onChange={(e) => handleChange("utmeSubjects", e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Enter subjects as 3-letter codes separated by commas
                </p>

                {/* Common Subject Combinations */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Common subject combinations:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "ENG, MAT, PHY, CHE",
                      "ENG, MAT, BIO, CHE",
                      "ENG, GOV, ECO, LIT",
                      "ENG, MAT, ECO, ACC",
                    ].map((combo) => (
                      <Button
                        key={combo}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleChange("utmeSubjects", combo)}
                        className="text-xs"
                      >
                        {combo}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* O'Level Results (Existing Code - Keep as is) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">O'Level Results</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOLevelResult}
              >
                Add Another O'Level Result
              </Button>
            </div>

            {formData.olevelResults.map((olevel, olevelIndex) => (
              <div
                key={olevelIndex}
                className="space-y-4 p-4 border rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    O'Level Result {olevelIndex + 1}
                  </h4>
                  {formData.olevelResults.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOLevelResult(olevelIndex)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`examBody-${olevelIndex}`}>
                      Exam Body *
                    </Label>
                    <Select
                      value={olevel.examBody}
                      onValueChange={(value) =>
                        handleOLevelChange(olevelIndex, "examBody", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select exam body" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WAEC">WAEC</SelectItem>
                        <SelectItem value="NECO">NECO</SelectItem>
                        <SelectItem value="NABTEB">NABTEB</SelectItem>
                        <SelectItem value="GCE">GCE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`examNumber-${olevelIndex}`}>
                      Exam Number *
                    </Label>
                    <Input
                      id={`examNumber-${olevelIndex}`}
                      value={olevel.examNumber}
                      onChange={(e) =>
                        handleOLevelChange(
                          olevelIndex,
                          "examNumber",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`examYear-${olevelIndex}`}>
                      Exam Year *
                    </Label>
                    <Input
                      id={`examYear-${olevelIndex}`}
                      type="number"
                      min="1990"
                      max={new Date().getFullYear()}
                      value={olevel.examYear}
                      onChange={(e) =>
                        handleOLevelChange(
                          olevelIndex,
                          "examYear",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                </div>

                {/* Subjects */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Subjects & Grades</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addSubject(olevelIndex)}
                    >
                      Add Subject
                    </Button>
                  </div>

                  {olevel.subjects.map((subject, subjectIndex) => (
                    <div
                      key={subjectIndex}
                      className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
                    >
                      <div className="space-y-2">
                        <Label
                          htmlFor={`subject-${olevelIndex}-${subjectIndex}`}
                        >
                          Subject *
                        </Label>
                        <Input
                          id={`subject-${olevelIndex}-${subjectIndex}`}
                          value={subject.subject}
                          onChange={(e) =>
                            handleSubjectChange(
                              olevelIndex,
                              subjectIndex,
                              "subject",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Mathematics"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor={`gradeFirst-${olevelIndex}-${subjectIndex}`}
                        >
                          1st Sitting Grade
                        </Label>
                        <Select
                          value={subject.gradeFirstSitting}
                          onValueChange={(value) =>
                            handleSubjectChange(
                              olevelIndex,
                              subjectIndex,
                              "gradeFirstSitting",
                              value
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A1">A1</SelectItem>
                            <SelectItem value="B2">B2</SelectItem>
                            <SelectItem value="B3">B3</SelectItem>
                            <SelectItem value="C4">C4</SelectItem>
                            <SelectItem value="C5">C5</SelectItem>
                            <SelectItem value="C6">C6</SelectItem>
                            <SelectItem value="D7">D7</SelectItem>
                            <SelectItem value="E8">E8</SelectItem>
                            <SelectItem value="F9">F9</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor={`gradeSecond-${olevelIndex}-${subjectIndex}`}
                        >
                          2nd Sitting Grade
                        </Label>
                        <Select
                          value={subject.gradeSecondSitting}
                          onValueChange={(value) =>
                            handleSubjectChange(
                              olevelIndex,
                              subjectIndex,
                              "gradeSecondSitting",
                              value
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A1">A1</SelectItem>
                            <SelectItem value="B2">B2</SelectItem>
                            <SelectItem value="B3">B3</SelectItem>
                            <SelectItem value="C4">C4</SelectItem>
                            <SelectItem value="C5">C5</SelectItem>
                            <SelectItem value="C6">C6</SelectItem>
                            <SelectItem value="D7">D7</SelectItem>
                            <SelectItem value="E8">E8</SelectItem>
                            <SelectItem value="F9">F9</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeSubject(olevelIndex, subjectIndex)
                          }
                          disabled={olevel.subjects.length <= 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Summary Section */}
          {formData.utmeScore && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">JAMB Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-700">JAMB Score</p>
                  <p className="text-lg font-bold text-blue-900">
                    {formData.utmeScore}/400
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">UTME Subjects</p>
                  <p className="text-lg font-medium text-blue-900">
                    {formData.utmeSubjects}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-between pt-6 border-t">
            <Button type="button" variant="outline" onClick={onBack}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex space-x-4">
              <Button type="submit" variant="outline">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                type="button"
                onClick={() => {
                  // Validate before moving to next
                  if (!formData.utmeScore || !formData.utmeSubjects) {
                    alert(
                      "Please fill in both JAMB score and subjects before proceeding"
                    );
                    return;
                  }
                  onSubmit(formData);
                  onNext();
                }}
              >
                Next: Family Information
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
