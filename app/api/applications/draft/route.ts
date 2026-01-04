import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for existing draft (most recent one)
    const applicationsRef = collection(db, "users", userId, "applications");
    const draftQuery = query(
      applicationsRef,
      where("status", "==", "draft"),
      orderBy("updatedAt", "desc"),
      limit(1)
    );

    const querySnapshot = await getDocs(draftQuery);

    if (querySnapshot.empty) {
      return NextResponse.json({
        success: true,
        application: null,
        message: "No draft found",
      });
    }

    // Get the most recent draft
    const draftDoc = querySnapshot.docs[0];
    const applicationData = draftDoc.data();

    return NextResponse.json({
      success: true,
      application: applicationData,
      applicationId: draftDoc.id,
    });
  } catch (error) {
    console.error("Error loading draft:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
