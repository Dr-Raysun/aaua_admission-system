"use client";

import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AdminDashboard from "@/components/AdminDashboard";

// List of authorized email addresses
const AUTHORIZED_EMAILS = [
  "raysynergygroup@gmail.com",
  "adedotunabigael21@gmail.com",
  // Add the other two email addresses here
  // "second-email@example.com",
  // "third-email@example.com",
];

export default function AdminPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();

  const isLoaded = authLoaded && userLoaded;

  // Check if user is authorized
  const isAuthorized = () => {
    if (!isSignedIn || !user) return false;

    const userEmail = user.primaryEmailAddress?.emailAddress;
    if (!userEmail) return false;

    return AUTHORIZED_EMAILS.includes(userEmail.toLowerCase());
  };

  // Redirect unauthorized users
  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        // User is not signed in, redirect to sign-in page
        router.push("/sign-in");
      } else if (!isAuthorized()) {
        // User is signed in but not authorized
        toast.error("Access Denied: You are not authorized to view this page.");
        router.push("/"); // Redirect to home page
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Show loading while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show access denied if user is not authorized
  if (isSignedIn && !isAuthorized()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You are not authorized to access this page.
        </p>
        <Button onClick={() => router.push("/")}>Go to Homepage</Button>
      </div>
    );
  }

  // Show the admin dashboard for authorized users
  return (
    <AdminDashboard
      userEmail={user?.primaryEmailAddress?.emailAddress ?? undefined}
      userName={user?.firstName || user?.fullName || undefined}
    />
  );
}
