import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Student } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, ChevronDown, ChevronUp, Download, Upload, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { courses } from "@/data/courses";

const statusColors = {
  active: "bg-green-500",
  inactive: "bg-gray-500",
  enrolled: "bg-teal-500",
  pending: "bg-amber-500",
  graduated: "bg-indigo-500",
};

type SortColumn = "name" | "email" | "phone" | "courseInterested" | "location" | "status" | "registrationDate";
type SortDirection = "asc" | "desc" | null;

export default function StudentList() {
  const { toast } = useToast();
  const [searchName, setSearchName] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [offset, setOffset] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [limit, setLimit] = useState(300);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (searchName) params.append("name", searchName);
    if (filterCourse) params.append("courseInterested", filterCourse);
    if (filterLocation) params.append("location", filterLocation);
    if (filterStatus) params.append("status", filterStatus);
    if (dateFrom) params.append("registrationDateFrom", dateFrom);
    if (dateTo) params.append("registrationDateTo", dateTo);
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());
    return params.toString();
  };

  const { data, isLoading } = useQuery<{ students: Student[]; total: number }>({
    queryKey: ["/api/students", searchName, filterCourse, filterLocation, filterStatus, dateFrom, dateTo, offset, limit],
    queryFn: async () => {
      const res = await fetch(`/api/students?${buildQueryString()}`);
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });

  const students = data?.students || [];
  const total = data?.total || 0;

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedStudents = React.useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return students;
    }

    return [...students].sort((a, b) => {
      const aValue = a[sortColumn] || "";
      const bValue = b[sortColumn] || "";

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [students, sortColumn, sortDirection]);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 inline" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4 inline" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4 inline" />;
  };

  const handleClearFilters = () => {
    setSearchName("");
    setFilterCourse("");
    setFilterLocation("");
    setFilterStatus("");
    setDateFrom("");
    setDateTo("");
    setOffset(0);
  };

  const hasFilters = searchName || filterCourse || filterLocation || filterStatus || dateFrom || dateTo;

  const handleExportCSV = async () => {
    try {
      const res = await fetch(`/api/students?${buildQueryString()}&limit=10000`);
      const data = await res.json();
      const studentsToExport = data.students;

      const headers = ["Name", "Email", "Phone", "Course Interested", "Location", "Status", "Citizenship Status", "Current Situation", "Registration Date"];
      const csv = [
        headers.join(","),
        ...studentsToExport.map((s: Student) => [
          s.name,
          s.email,
          s.phone,
          s.courseInterested || "",
          s.location || "",
          s.status,
          s.citizenshipStatus || "",
          s.currentSituation || "",
          s.registrationDate,
        ].join(","))
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `students-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({ title: "Export successful", description: `Exported ${studentsToExport.length} students` });
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="w-[90%] mx-auto px-4 md:px-6 py-6 flex-1">
        <Card className="mb-6">

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchName}
                    onChange={(e) => {
                      setSearchName(e.target.value);
                      setOffset(0);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Course</label>
                <Select value={filterCourse} onValueChange={(v) => { setFilterCourse(v); setOffset(0); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.abbr}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Select value={filterLocation} onValueChange={(v) => { setFilterLocation(v); setOffset(0); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All locations</SelectItem>
                    <SelectItem value="Toronto">Toronto</SelectItem>
                    <SelectItem value="Mississauga">Mississauga</SelectItem>
                    <SelectItem value="Brampton">Brampton</SelectItem>
                    <SelectItem value="Ottawa">Ottawa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setOffset(0); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Registration From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setOffset(0);
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Registration To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setOffset(0);
                  }}
                />
              </div>
            </div>

            {hasFilters && (
              <Button variant="outline" onClick={handleClearFilters} className="w-full md:w-auto">
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                
                <CardDescription>
                  Showing {sortedStudents.length} of {total} students
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button onClick={() => window.location.href = '/students/new'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : sortedStudents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No students found</p>
                {hasFilters && (
                  <Button variant="ghost" onClick={handleClearFilters} className="mt-2">
                    Clear filters to see all students
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <div className="w-full overflow-x-auto">
                    <table className="w-full caption-bottom text-sm table-fixed">
                      <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead
                            className="cursor-pointer select-none hover:bg-muted/50"
                            onClick={() => handleSort("name")}
                          >
                            Name{getSortIcon("name")}
                          </TableHead>
                          <TableHead
                            className="hidden md:table-cell cursor-pointer select-none hover:bg-muted/50"
                            onClick={() => handleSort("email")}
                          >
                            Email{getSortIcon("email")}
                          </TableHead>
                          <TableHead
                            className="hidden lg:table-cell cursor-pointer select-none hover:bg-muted/50"
                            onClick={() => handleSort("phone")}
                          >
                            Phone{getSortIcon("phone")}
                          </TableHead>
                          <TableHead
                            className="hidden lg:table-cell cursor-pointer select-none hover:bg-muted/50"
                            onClick={() => handleSort("courseInterested")}
                          >
                            Course{getSortIcon("courseInterested")}
                          </TableHead>
                          <TableHead
                            className="hidden xl:table-cell cursor-pointer select-none hover:bg-muted/50"
                            onClick={() => handleSort("location")}
                          >
                            Location{getSortIcon("location")}
                          </TableHead>
                          <TableHead
                            className="cursor-pointer select-none hover:bg-muted/50"
                            onClick={() => handleSort("status")}
                          >
                            Status{getSortIcon("status")}
                          </TableHead>
                          <TableHead
                            className="hidden md:table-cell cursor-pointer select-none hover:bg-muted/50"
                            onClick={() => handleSort("registrationDate")}
                          >
                            Registration Date{getSortIcon("registrationDate")}
                          </TableHead>
                        </tr>
                      </thead>
                    </table>
                  </div>
                  <div className="w-full overflow-auto max-h-[500px]">
                    <table className="w-full caption-bottom text-sm table-fixed">
                    <tbody className="[&_tr:last-child]:border-0">
                      {sortedStudents.map((student) => (
                        <React.Fragment key={student.id}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleRow(student.id)}
                          >
                            <TableCell>
                              {expandedRows.has(student.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </TableCell>
                            <TableCell className="font-bold">
                              <Link href={`/students/${student.id}`}>
                                <span
                                  className="hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {student.name}
                                </span>
                              </Link>
                            </TableCell>
                            <TableCell className="hidden md:table-cell font-bold">{student.email}</TableCell>
                            <TableCell className="hidden lg:table-cell">{student.phone}</TableCell>
                            <TableCell className="hidden lg:table-cell">{student.courseInterested || "N/A"}</TableCell>
                            <TableCell className="hidden xl:table-cell">{student.location || "N/A"}</TableCell>
                            <TableCell>
                              <Badge className={statusColors[student.status as keyof typeof statusColors]}>
                                {student.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{student.registrationDate}</TableCell>
                          </TableRow>
                          {expandedRows.has(student.id) && (
                            <TableRow>
                              <TableCell colSpan={8} className="bg-muted/20">
                                <div className="py-4 space-y-2">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm font-medium">Email</p>
                                      <p className="text-sm text-muted-foreground">{student.email}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Phone</p>
                                      <p className="text-sm text-muted-foreground">{student.phone}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Course Interested</p>
                                      <p className="text-sm text-muted-foreground">{student.courseInterested || "N/A"}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Location</p>
                                      <p className="text-sm text-muted-foreground">{student.location || "N/A"}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Citizenship Status</p>
                                      <p className="text-sm text-muted-foreground">{student.citizenshipStatus || "N/A"}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Current Situation</p>
                                      <p className="text-sm text-muted-foreground">{student.currentSituation || "N/A"}</p>
                                    </div>
                                  </div>
                                  <div className="pt-2">
                                    <Link href={`/students/${student.id}`}>
                                      <Button size="sm">View Full Details</Button>
                                    </Link>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select
                      value={limit.toString()}
                      onValueChange={(v) => {
                        setLimit(Number(v));
                        setOffset(0);
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="300">300</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                      disabled={offset === 0}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setOffset(offset + limit)}
                      disabled={offset + limit >= total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
