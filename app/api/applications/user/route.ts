import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserApplications } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getUserApplications(userId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        applications: result.applications,
      });
    } else {
      return NextResponse.json(
        { error: "Failed to fetch applications" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
