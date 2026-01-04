"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface FamilyInfoFormProps {
  data: {
    nextOfKin: {
      name: string;
      phoneNumber: string;
      relationship: string;
      address: string;
    };
    father: {
      name: string;
      phoneNumber: string;
      occupation: string;
      address: string;
    };
    mother: {
      name: string;
      phoneNumber: string;
      occupation: string;
      address: string;
    };
  };
  onSubmit: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function FamilyInfoForm({
  data,
  onSubmit,
  onNext,
  onBack,
}: FamilyInfoFormProps) {
  const [formData, setFormData] = useState(data);

  const handleChange = (section: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
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
          <CardTitle>Family Information</CardTitle>
          <CardDescription>
            Provide information about your next of kin and parents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Next of Kin */}
          <div className="space-y-4">
            <h3 className="font-medium">Next of Kin</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nextOfKinName">Full Name *</Label>
                <Input
                  id="nextOfKinName"
                  value={formData.nextOfKin.name}
                  onChange={(e) =>
                    handleChange("nextOfKin", "name", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextOfKinPhone">Phone Number *</Label>
                <Input
                  id="nextOfKinPhone"
                  type="tel"
                  value={formData.nextOfKin.phoneNumber}
                  onChange={(e) =>
                    handleChange("nextOfKin", "phoneNumber", e.target.value)
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nextOfKinRelationship">Relationship *</Label>
                <Input
                  id="nextOfKinRelationship"
                  value={formData.nextOfKin.relationship}
                  onChange={(e) =>
                    handleChange("nextOfKin", "relationship", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextOfKinAddress">Address *</Label>
                <Textarea
                  id="nextOfKinAddress"
                  value={formData.nextOfKin.address}
                  onChange={(e) =>
                    handleChange("nextOfKin", "address", e.target.value)
                  }
                  rows={2}
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Parents Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Parents Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Father</h4>
                <div className="space-y-2">
                  <Label htmlFor="fatherName">Full Name *</Label>
                  <Input
                    id="fatherName"
                    value={formData.father.name}
                    onChange={(e) =>
                      handleChange("father", "name", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fatherPhone">Phone Number</Label>
                  <Input
                    id="fatherPhone"
                    type="tel"
                    value={formData.father.phoneNumber}
                    onChange={(e) =>
                      handleChange("father", "phoneNumber", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fatherOccupation">Occupation</Label>
                  <Input
                    id="fatherOccupation"
                    value={formData.father.occupation}
                    onChange={(e) =>
                      handleChange("father", "occupation", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fatherAddress">Address</Label>
                  <Textarea
                    id="fatherAddress"
                    value={formData.father.address}
                    onChange={(e) =>
                      handleChange("father", "address", e.target.value)
                    }
                    rows={2}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Mother</h4>
                <div className="space-y-2">
                  <Label htmlFor="motherName">Full Name *</Label>
                  <Input
                    id="motherName"
                    value={formData.mother.name}
                    onChange={(e) =>
                      handleChange("mother", "name", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherPhone">Phone Number</Label>
                  <Input
                    id="motherPhone"
                    type="tel"
                    value={formData.mother.phoneNumber}
                    onChange={(e) =>
                      handleChange("mother", "phoneNumber", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherOccupation">Occupation</Label>
                  <Input
                    id="motherOccupation"
                    value={formData.mother.occupation}
                    onChange={(e) =>
                      handleChange("mother", "occupation", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherAddress">Address</Label>
                  <Textarea
                    id="motherAddress"
                    value={formData.mother.address}
                    onChange={(e) =>
                      handleChange("mother", "address", e.target.value)
                    }
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

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
              <Button type="button" onClick={onNext}>
                Next: Documents
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
