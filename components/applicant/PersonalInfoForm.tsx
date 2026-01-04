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
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save, ChevronRight } from "lucide-react";

interface PersonalInfoFormProps {
  data: any;
  onSubmit: (data: any) => void;
  onNext: () => void;
}

export default function PersonalInfoForm({
  data,
  onSubmit,
  onNext,
}: PersonalInfoFormProps) {
  const [formData, setFormData] = useState(data);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Please provide accurate personal details as they appear on your
            official documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="surname">Surname *</Label>
              <Input
                id="surname"
                value={formData.surname}
                onChange={(e) => handleChange("surname", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otherNames">Other Names *</Label>
              <Input
                id="otherNames"
                value={formData.otherNames}
                onChange={(e) => handleChange("otherNames", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="personalPhone">Phone Number *</Label>
              <Input
                id="personalPhone"
                type="tel"
                value={formData.personalPhone}
                onChange={(e) => handleChange("personalPhone", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personalEmail">Email Address *</Label>
              <Input
                id="personalEmail"
                type="email"
                value={formData.personalEmail}
                onChange={(e) => handleChange("personalEmail", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleChange("gender", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maritalStatus">Marital Status *</Label>
              <Select
                value={formData.maritalStatus}
                onValueChange={(value) => handleChange("maritalStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Divorced">Divorced</SelectItem>
                  <SelectItem value="Widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Admission Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Admission Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modeOfAdmission">Mode of Admission *</Label>
                <Select
                  value={formData.modeOfAdmission}
                  onValueChange={(value) =>
                    handleChange("modeOfAdmission", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTME">UTME</SelectItem>
                    <SelectItem value="Direct Entry">Direct Entry</SelectItem>
                    <SelectItem value="Transfer">Transfer</SelectItem>
                    <SelectItem value="Remedial">Remedial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="faculty">Faculty *</Label>
                <Input
                  id="faculty"
                  value={formData.faculty}
                  onChange={(e) => handleChange("faculty", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseOfStudy">Course of Study *</Label>
                <Input
                  id="courseOfStudy"
                  value={formData.courseOfStudy}
                  onChange={(e) =>
                    handleChange("courseOfStudy", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="degreeSought">Degree Sought *</Label>
                <Select
                  value={formData.degreeSought}
                  onValueChange={(value) => handleChange("degreeSought", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select degree" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B.Sc">
                      Bachelor of Science (B.Sc)
                    </SelectItem>
                    <SelectItem value="B.A">Bachelor of Arts (B.A)</SelectItem>
                    <SelectItem value="B.Eng">
                      Bachelor of Engineering (B.Eng)
                    </SelectItem>
                    <SelectItem value="LLB">Bachelor of Laws (LLB)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stateOfOrigin">State of Origin *</Label>
                <Input
                  id="stateOfOrigin"
                  value={formData.stateOfOrigin}
                  onChange={(e) =>
                    handleChange("stateOfOrigin", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="localGovernment">Local Government Area *</Label>
                <Input
                  id="localGovernment"
                  value={formData.localGovernment}
                  onChange={(e) =>
                    handleChange("localGovernment", e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="permanentAddress">Permanent Home Address *</Label>
              <Textarea
                id="permanentAddress"
                value={formData.permanentAddress}
                onChange={(e) =>
                  handleChange("permanentAddress", e.target.value)
                }
                required
                rows={3}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between pt-6 border-t">
            <Button type="button" variant="outline">
              Save as Draft
            </Button>
            <div className="flex space-x-4">
              <Button type="submit" variant="outline">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button type="button" onClick={onNext}>
                Next: Academic Records
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
