import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import {
  CheckCircle,
  ShieldCheck,
  Clock,
  Users,
  FileText,
  Upload,
  AlertCircle,
  GraduationCap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-900">
                AAUA Admission
              </h1>
              <p className="text-xs text-blue-700">
                Adekunle Ajasin University
              </p>
            </div>
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
            </SignedOut>

            {/* Show when user is signed in */}
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to AAUA Digital Admission Portal
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10">
            Streamline your admission process with our secure, transparent, and
            efficient online system. No more queues, no more delays.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="px-8">
                Start New Application
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="px-8">
                Check Application Status
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose Our System?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Fast Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Reduce admission processing time from weeks to days with
                automated workflows.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Document Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Advanced verification system to detect and prevent document
                forgery.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Real-time Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track your application status in real-time without visiting the
                campus.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>24/7 Access</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Access the portal anytime, anywhere. No physical queues or
                office hours.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Simple Application Process
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Create Account",
                desc: "Sign up with your email",
                icon: Users,
              },
              {
                step: "02",
                title: "Fill Application",
                desc: "Complete online forms",
                icon: FileText,
              },
              {
                step: "03",
                title: "Upload Documents",
                desc: "Submit required documents",
                icon: Upload,
              },
              {
                step: "04",
                title: "Track Status",
                desc: "Monitor progress in real-time",
                icon: AlertCircle,
              },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="text-center relative">
                <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 relative z-10">
                  {step}
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-gray-600">{desc}</p>
                {step !== "04" && (
                  <div className="hidden md:block absolute top-10 left-3/4 w-full h-0.5 bg-blue-200"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-blue-900" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    Adekunle Ajasin University
                  </h3>
                  <p className="text-blue-200">Digital Admission System</p>
                </div>
              </div>
              <p className="text-blue-200">
                Transforming admission processes through digital innovation and
                automation.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">
                Contact Information
              </h4>
              <ul className="space-y-2 text-blue-200">
                <li>Email: admissions@aaua.edu.ng</li>
                <li>Phone: +234 812 345 6789</li>
                <li>Address: PMB 001, Akungba-Akoko, Ondo State</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-blue-200 hover:text-white">
                    How to Apply
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-blue-200 hover:text-white">
                    Requirements
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-blue-200 hover:text-white">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-blue-200 hover:text-white">
                    Contact Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-blue-800 mt-8 pt-8 text-center text-blue-200">
            <p>
              © {new Date().getFullYear()} AAUA Admission System. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
