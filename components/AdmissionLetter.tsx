// components/AdmissionLetter.tsx
import { FC } from "react";

interface StudentInfo {
  name: string;
  dob: string;
  address: string;
  regNumber: string;
  examNumber: string;
}

interface JAMBInfo {
  name: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  support: string;
  datePrinted: string;
}

interface Condition {
  text: string;
  subPoints?: string[];
}

interface AdmissionData {
  university: string;
  session: string;
  faculty: string;
  department: string;
  degree: string;
  duration: string;
  registrar: string;
  registrarTitle: string;
  student: StudentInfo;
  jamb: JAMBInfo;
  conditions: (string | Condition)[];
}

const AdmissionLetter: FC = () => {
  const admissionData: AdmissionData = {
    university: "ADEKUNLE AJASIN UNIVERSITY, AKUNGBA-AKOKO, ONDO STATE",
    session: "2025/2026 SESSION",
    faculty: "EDUCATION",
    department: "HEALTH EDUCATION",
    degree: "Bachelor of Education (B.ED.)",
    duration: "4 YEARS",
    registrar: "Ishaq O. Oloyede, OFR, FNAL",
    registrarTitle: "Registrar",

    student: {
      name: "Solomon Success Olorunda",
      dob: "February 2, 2008",
      address: "111, Ogo Oluwa Unity Estate Obada Ogun State",
      regNumber: "202550622068GA",
      examNumber: "C56507166",
    },

    jamb: {
      name: "JOINT ADMISSIONS AND MATRICULATION BOARD",
      address:
        "National Headquarters, Suleja-Bwari Road, Bwari, P. M. B. 189, Garki Abuja, Nigeria",
      phone: "08166335513, 08123658955",
      website: "www.jamb.gov.ng",
      email: "registrar@jamb.gov.ng",
      support: "support.jamb.gov.ng",
      datePrinted: "Monday, December 1, 2025",
    },

    conditions: [
      "At the point of registration in the Institution, you will be required to present the original(s) of the certificate(s) or any other acceptable evidence of the qualifications on which this offer of admission has been based. The Board reserves the right to withdraw this admission even after registration if it is discovered that you have been involved in any form of examination/admission irregularities.",
      "If it is discovered at any time that you do not possess any of the qualifications which you claim to have obtained, you will be required to withdraw from the Institution.",
      "Information relating to date of registration, schedule of charges, accommodation facilities, medical examination and any other institutional conditions should be obtained directly from the institution to which you have been admitted.",
      "In the absence of any response from you within a reasonable time, the institution to which you have been admitted will assume that you are not interested in the offer and may proceed to replace you.",
      "You are required to present to the institution at the time of registration a letter of reference from a person of reputable standing in the society that can vouch for your character.",
      {
        text: "At the point of registration, you are to submit:",
        subPoints: [
          "JAMB original Result Slip",
          "JAMB duplicate online Admission Letter (Second copy)",
          "Copies of your credentials",
        ],
      },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Page 1: Main Admission Letter */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-blue-800">
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">ADEKUNLE AJASIN UNIVERSITY</h2>
              <p className="text-blue-200">Akungba-Akoko, Ondo State</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">2025/2026 Session</p>
              <p className="text-blue-200 text-sm">Provisional Admission</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <div className="mb-6">
              <p className="text-gray-700 mb-1">To:</p>
              <p className="text-xl font-bold text-gray-900">
                {admissionData.student.name}
              </p>
              <p className="text-gray-600">{admissionData.student.address}</p>
            </div>

            <div className="border-l-4 border-blue-600 pl-4 py-2 bg-blue-50 my-6">
              <p className="text-lg italic">
                Dear {admissionData.student.name.split(" ")[0]},
              </p>
            </div>

            <p className="text-lg leading-relaxed mb-8">
              I am delighted to inform you that you have been offered
              provisional admission to{" "}
              <span className="font-semibold text-blue-700">
                {admissionData.university}
              </span>{" "}
              to study a{" "}
              <span className="font-semibold">
                FIRST DEGREE programme in HEALTH EDUCATION
              </span>{" "}
              with the following details:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-lg font-bold text-blue-800 mb-4">
                  Programme Details
                </h3>
                <InfoItem label="Faculty" value={admissionData.faculty} />
                <InfoItem label="Department" value={admissionData.department} />
                <InfoItem label="Degree Award" value={admissionData.degree} />
                <InfoItem label="Duration" value={admissionData.duration} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-lg font-bold text-blue-800 mb-4">
                  Student Information
                </h3>
                <InfoItem
                  label="Full Name"
                  value={admissionData.student.name}
                />
                <InfoItem
                  label="Date of Birth"
                  value={admissionData.student.dob}
                />
                <InfoItem
                  label="Registration No."
                  value={admissionData.student.regNumber}
                />
                <InfoItem
                  label="Examination No."
                  value={admissionData.student.examNumber}
                />
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-300">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800 mb-2">
                {admissionData.registrar}
              </p>
              <p className="text-xl text-gray-700">
                {admissionData.registrarTitle}
              </p>
              <p className="text-sm text-gray-500 mt-4">
                To be Printed with Colour Printer
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Page 2: Conditions and Requirements */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-green-800">
        <div className="bg-gradient-to-r from-green-800 to-green-600 p-6 text-white">
          <h2 className="text-2xl font-bold">
            Admission Conditions & Requirements
          </h2>
          <p className="text-green-200">
            Provisional Admission - Terms and Conditions
          </p>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <p className="text-lg leading-relaxed mb-8 bg-yellow-50 p-5 rounded-lg border-l-4 border-yellow-500">
              <span className="font-bold text-red-600">Important:</span> The
              confirmation of this provisional admission is subject to your
              possession of the minimum entry requirements for the programme to
              which you have been offered this admission with the following
              conditions:
            </p>
          </div>

          <div className="space-y-8">
            {admissionData.conditions.map((condition, index) => (
              <ConditionItem
                key={index}
                index={index + 1}
                condition={condition}
              />
            ))}
          </div>

          <div className="mt-16 pt-8 border-t border-gray-300">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {admissionData.jamb.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-left">
                  <p className="mb-2">
                    <span className="font-semibold">Address:</span>{" "}
                    {admissionData.jamb.address}
                  </p>
                  <p className="mb-2">
                    <span className="font-semibold">Tel:</span>{" "}
                    {admissionData.jamb.phone}
                  </p>
                  <p className="mb-2">
                    <span className="font-semibold">Date Printed:</span>{" "}
                    {admissionData.jamb.datePrinted}
                  </p>
                </div>
                <div className="text-left">
                  <p className="mb-2">
                    <span className="font-semibold">Website:</span>{" "}
                    {admissionData.jamb.website}
                  </p>
                  <p className="mb-2">
                    <span className="font-semibold">Email:</span>{" "}
                    {admissionData.jamb.email}
                  </p>
                  <p className="mb-2">
                    <span className="font-semibold">Support:</span>{" "}
                    {admissionData.jamb.support}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Information Footer */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 rounded-2xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-bold text-lg mb-2">Student</h4>
            <p className="text-blue-100">{admissionData.student.name}</p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-2">Programme</h4>
            <p className="text-blue-100">
              {admissionData.degree} in {admissionData.department}
            </p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-2">Address</h4>
            <p className="text-blue-100">{admissionData.student.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Component for Information Items
interface InfoItemProps {
  label: string;
  value: string;
}

const InfoItem: FC<InfoItemProps> = ({ label, value }) => {
  return (
    <div className="flex items-center py-2 border-b border-gray-200 last:border-b-0">
      <span className="font-semibold text-gray-700 w-40 flex-shrink-0">
        {label}:
      </span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
};

// Helper Component for Condition Items
interface ConditionItemProps {
  index: number;
  condition: string | Condition;
}

const ConditionItem: FC<ConditionItemProps> = ({ index, condition }) => {
  if (typeof condition === "object" && "subPoints" in condition) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-300">
        <p className="font-bold text-lg mb-4 flex items-start">
          <span className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
            {index}
          </span>
          <span>{condition.text}</span>
        </p>
        <ul className="ml-11 space-y-3">
          {condition.subPoints?.map((point, idx) => (
            <li key={idx} className="flex items-start">
              <span className="font-bold text-blue-700 mr-3">
                {String.fromCharCode(97 + idx)})
              </span>
              <span className="text-gray-700">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex items-start bg-gray-50 p-5 rounded-lg border border-gray-300">
      <div className="flex-shrink-0">
        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 font-bold">
          {index}
        </span>
      </div>
      <p className="text-gray-700 leading-relaxed">{condition as string}</p>
    </div>
  );
};

export default AdmissionLetter;
