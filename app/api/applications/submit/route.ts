import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { applicationData, documents } = body;

    if (!applicationData) {
      return NextResponse.json(
        { error: "Application data is required" },
        { status: 400 }
      );
    }

    // Generate application ID
    const applicationId = `APP-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const submittedAt = new Date().toISOString();

    // Prepare the complete application data
    const completeApplicationData = {
      id: applicationId,
      userId,
      ...applicationData,
      documents: documents || [],
      status: "submitted",
      submittedAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to Firestore
    const applicationRef = doc(
      db,
      "users",
      userId,
      "applications",
      applicationId
    );
    await setDoc(applicationRef, completeApplicationData);

    // Also save to the main applications collection for admin access
    const adminApplicationRef = doc(db, "applications", applicationId);
    await setDoc(adminApplicationRef, {
      ...completeApplicationData,
      userId, // Include userId for admin reference
    });

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      applicationId,
      submittedAt,
    });
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
