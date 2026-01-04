import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { applicationData, applicationId: providedApplicationId } = body;

    if (!applicationData) {
      return NextResponse.json(
        { error: "Application data is required" },
        { status: 400 }
      );
    }

    let applicationId = providedApplicationId;
    let isUpdate = false;
    let message = "Draft saved successfully";

    // 1. Check if applicationId was provided (frontend knows about existing draft)
    if (applicationId) {
      // This is an update to existing application
      isUpdate = true;
      message = "Draft updated successfully";
    } else {
      // 2. Check if user already has a draft application
      const applicationsRef = collection(db, "users", userId, "applications");
      const draftQuery = query(applicationsRef, where("status", "==", "draft"));
      const querySnapshot = await getDocs(draftQuery);

      if (!querySnapshot.empty) {
        // User already has a draft - use the existing one
        const existingApp = querySnapshot.docs[0];
        applicationId = existingApp.id;
        isUpdate = true;
        message = "Existing draft updated successfully";
      } else {
        // 3. No existing draft - create a new one
        applicationId = `APP-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
      }
    }

    // Prepare the document data
    const applicationDoc = {
      id: applicationId,
      userId,
      ...applicationData,
      status: "draft",
      lastUpdated: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Only set createdAt for new documents, keep existing for updates
      ...(isUpdate ? {} : { createdAt: new Date().toISOString() }),
    };

    // Save/Update to Firestore
    const applicationRef = doc(
      db,
      "users",
      userId,
      "applications",
      applicationId
    );

    if (isUpdate) {
      // Update existing document
      await updateDoc(applicationRef, applicationDoc);
    } else {
      // Create new document
      await setDoc(applicationRef, applicationDoc);
    }

    return NextResponse.json({
      success: true,
      message,
      applicationId,
      isUpdate,
    });
  } catch (error) {
    console.error("Error saving draft:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
