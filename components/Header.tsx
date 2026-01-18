import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { GraduationCap } from "lucide-react";

export default function Header() {
  return (
    <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="max-sm:hidden">
              <h1 className="text-xl font-bold text-blue-900">
                AAUA Admission
              </h1>
              <p className="text-xs text-blue-700">
                Adekunle Ajasin University
              </p>
            </div>
          </Link>
        </div>

        <div className="space-x-4">
          {/* Show when user is signed out */}
          <SignedOut>
            <Link href="/sign-in">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Apply Now</Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline">Admin</Button>
            </Link>
          </SignedOut>

          {/* Show when user is signed in */}
          <SignedIn>
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="outline">Admin</Button>
              </Link>
              <UserButton />
            </div>
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
