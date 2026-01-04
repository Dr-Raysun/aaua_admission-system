"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  FileCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { format } from "date-fns";
import { toast } from "sonner";

interface Application {
  id: string;
  userId: string;
  surname: string;
  otherNames: string;
  personalEmail: string;
  status:
    | "pending"
    | "verified"
    | "flagged"
    | "rejected"
    | "submitted"
    | "draft";
  submittedAt: string;
  courseOfStudy: string;
  createdAt: string;
  updatedAt: string;
  applicationData?: any;
  documents?: any[];
  fullName: string;
  email: string;
  course: string;
}

interface Stats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  flagged: number;
}

interface AdminDashboardProps {
  // You can pass props if needed, like user info
  userEmail?: string;
  userName?: string;
}

export default function AdminDashboard({ userEmail, userName }: AdminDashboardProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<
    Application[]
  >([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    flagged: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch all applications from Firestore
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const applicationsRef = collection(db, "applications");
      const q = query(applicationsRef, orderBy("submittedAt", "desc"));
      const querySnapshot = await getDocs(q);

      const apps: Application[] = [];
      const statsData: Stats = {
        total: 0,
        pending: 0,
        verified: 0,
        rejected: 0,
        flagged: 0,
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;

        // Construct full name from surname and otherNames
        const fullName = `${data.surname || ""} ${
          data.otherNames || ""
        }`.trim();

        const app: Application = {
          id: doc.id,
          userId: data.userId,
          surname: data.surname || "",
          otherNames: data.otherNames || "",
          personalEmail: data.personalEmail || "",
          status: data.status || "submitted",
          submittedAt: data.submittedAt || data.createdAt,
          courseOfStudy: data.courseOfStudy || "",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          applicationData: data,
          documents: data.documents || [],
          fullName,
          email: data.personalEmail,
          course: data.courseOfStudy,
        };

        apps.push(app);

        // Update stats
        statsData.total++;
        if (app.status === "pending" || app.status === "submitted") {
          statsData.pending++;
        } else if (app.status === "verified") {
          statsData.verified++;
        } else if (app.status === "rejected") {
          statsData.rejected++;
        } else if (app.status === "flagged") {
          statsData.flagged++;
        }
      });

      setApplications(apps);
      setStats(statsData);

      // Generate recent activities
      const activities = apps.slice(0, 4).map((app) => ({
        user: app.fullName,
        doc: "Application",
        action:
          app.status === "verified"
            ? "verified"
            : app.status === "rejected"
            ? "rejected"
            : "pending",
        time: format(new Date(app.submittedAt), "MMM d, yyyy"),
      }));
      setRecentActivities(activities);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  // Update application status
  const updateApplicationStatus = async (
    applicationId: string,
    newStatus: Application["status"]
  ) => {
    try {
      const applicationRef = doc(db, "applications", applicationId);
      await updateDoc(applicationRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      // Also update in user's collection if needed
      const application = applications.find((app) => app.id === applicationId);
      if (application?.userId) {
        const userApplicationRef = doc(
          db,
          "users",
          application.userId,
          "applications",
          applicationId
        );
        await updateDoc(userApplicationRef, {
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });
      }

      toast.success(`Application ${newStatus} successfully`);
      fetchApplications(); // Refresh data
    } catch (error) {
      console.error("Error updating application:", error);
      toast.error("Failed to update application");
    }
  };

  // Delete application
  const deleteApplication = async (applicationId: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;

    try {
      const application = applications.find((app) => app.id === applicationId);

      // Delete from admin collection
      const adminRef = doc(db, "applications", applicationId);
      await deleteDoc(adminRef);

      // Delete from user's collection if exists
      if (application?.userId) {
        const userRef = doc(
          db,
          "users",
          application.userId,
          "applications",
          applicationId
        );
        await deleteDoc(userRef);
      }

      toast.success("Application deleted successfully");
      fetchApplications(); // Refresh data
    } catch (error) {
      console.error("Error deleting application:", error);
      toast.error("Failed to delete application");
    }
  };

  // Filter applications based on search and status
  useEffect(() => {
    let filtered = applications;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.fullName?.toLowerCase().includes(searchLower) ||
          app.id.toLowerCase().includes(searchLower) ||
          app.personalEmail?.toLowerCase().includes(searchLower) ||
          app.courseOfStudy?.toLowerCase().includes(searchLower) ||
          app.surname?.toLowerCase().includes(searchLower) ||
          app.otherNames?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredApplications(filtered);
  }, [search, statusFilter, applications]);

  // Pagination
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApplications = filteredApplications.slice(
    startIndex,
    endIndex
  );
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  // Initial fetch
  useEffect(() => {
    fetchApplications();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: {
        className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        icon: <Clock className="w-3 h-3 mr-1" />,
      },
      submitted: {
        className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        icon: <Clock className="w-3 h-3 mr-1" />,
      },
      verified: {
        className: "bg-green-100 text-green-800 hover:bg-green-100",
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
      },
      flagged: {
        className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
        icon: <AlertTriangle className="w-3 h-3 mr-1" />,
      },
      rejected: {
        className: "bg-red-100 text-red-800 hover:bg-red-100",
        icon: <AlertTriangle className="w-3 h-3 mr-1" />,
      },
      draft: {
        className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
        icon: <FileCheck className="w-3 h-3 mr-1" />,
      },
    };

    const variant =
      variants[status as keyof typeof variants] || variants.pending;

    return (
      <Badge className={variant.className}>
        {variant.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvContent = [
      ["Application ID", "Name", "Email", "Course", "Status", "Submitted Date"],
      ...filteredApplications.map((app) => [
        app.id,
        app.fullName,
        app.personalEmail,
        app.courseOfStudy,
        app.status,
        format(new Date(app.submittedAt), "yyyy-MM-dd"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Exported successfully");
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome, {userName || "Admin"}. Manage admission applications and document verifications
            </p>
          </div>
          <div className="flex items-center gap-3">
            {userEmail && (
              <div className="text-right">
                <p className="text-sm font-medium">{userEmail}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            )}
            <Button
              variant="outline"
              onClick={fetchApplications}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Applications
                </p>
                <p className="text-3xl font-bold">
                  {stats.total.toLocaleString()}
                </p>
                <div className="flex items-center text-sm text-green-600 mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>All time</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Review
                </p>
                <p className="text-3xl font-bold">
                  {stats.pending.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Require attention
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Verified
                </p>
                <p className="text-3xl font-bold">
                  {stats.verified.toLocaleString()}
                </p>
                <div className="flex items-center text-sm text-green-600 mt-1">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  <span>
                    {stats.total > 0
                      ? Math.round((stats.verified / stats.total) * 100)
                      : 0}
                    % of total
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Flagged/Rejected
                </p>
                <p className="text-3xl font-bold">
                  {(stats.flagged + stats.rejected).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Need investigation
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by name, application ID, or email..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="draft">Drafts</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={exportToCSV}
                disabled={filteredApplications.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export ({filteredApplications.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Applications</CardTitle>
              <CardDescription>
                {loading
                  ? "Loading applications..."
                  : `Total: ${applications.length} applications`}
              </CardDescription>
            </div>
            <Button variant="outline" disabled={loading}>
              <FileCheck className="w-4 h-4 mr-2" />
              Bulk Verify
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedApplications.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No applications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedApplications.map((app) => (
                      <TableRow key={app.id} className="hover:bg-gray-50/50">
                        <TableCell className="font-mono font-medium">
                          {app.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {app.fullName || "N/A"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {app.personalEmail || "No email"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {app.courseOfStudy || "Not specified"}
                        </TableCell>
                        <TableCell>
                          {app.submittedAt
                            ? format(new Date(app.submittedAt), "MMM d, yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(
                                    `/admin/applications/${app.id}`,
                                    "_blank"
                                  )
                                }
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Application
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateApplicationStatus(app.id, "verified")
                                }
                              >
                                <FileCheck className="w-4 h-4 mr-2" />
                                Mark as Verified
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateApplicationStatus(app.id, "flagged")
                                }
                              >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Flag for Review
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateApplicationStatus(app.id, "rejected")
                                }
                              >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Reject Application
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => deleteApplication(app.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {filteredApplications.length > 0 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredApplications.length)} of{" "}
                    {filteredApplications.length} applications
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && <span className="px-2">...</span>}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity & Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest application activities</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No recent activities
                  </p>
                ) : (
                  recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            activity.action === "verified"
                              ? "bg-green-100"
                              : activity.action === "rejected"
                              ? "bg-red-100"
                              : "bg-yellow-100"
                          }`}
                        >
                          {activity.action === "verified" ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : activity.action === "rejected" ? (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{activity.user}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.doc}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {activity.time}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>Application status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : stats.total === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No data available
              </p>
            ) : (
              <div className="space-y-4">
                {[
                  {
                    label: "Verified",
                    value: stats.verified,
                    color: "bg-green-500",
                    percentage: ((stats.verified / stats.total) * 100).toFixed(
                      1
                    ),
                  },
                  {
                    label: "Pending",
                    value: stats.pending,
                    color: "bg-yellow-500",
                    percentage: ((stats.pending / stats.total) * 100).toFixed(
                      1
                    ),
                  },
                  {
                    label: "Flagged",
                    value: stats.flagged,
                    color: "bg-orange-500",
                    percentage: ((stats.flagged / stats.total) * 100).toFixed(
                      1
                    ),
                  },
                  {
                    label: "Rejected",
                    value: stats.rejected,
                    color: "bg-red-500",
                    percentage: ((stats.rejected / stats.total) * 100).toFixed(
                      1
                    ),
                  },
                ].map((stat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{stat.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {stat.value} ({stat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${stat.color}`}
                        style={{ width: `${stat.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}