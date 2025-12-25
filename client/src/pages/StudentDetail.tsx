import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Student, insertStudentSchema } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Save, X, Trash2 } from "lucide-react";
import { courses } from "@/data/courses";

const statusColors = {
  active: "bg-green-500",
  inactive: "bg-gray-500",
  enrolled: "bg-teal-500",
  pending: "bg-amber-500",
  graduated: "bg-indigo-500",
};

export default function StudentDetail() {
  const [, params] = useRoute("/students/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>({});

  const studentId = params?.id;

  const { data: student, isLoading } = useQuery<Student>({
    queryKey: [`/api/students/${studentId}`],
    queryFn: async () => {
      const res = await fetch(`/api/students/${studentId}`);
      if (!res.ok) throw new Error("Failed to fetch student");
      return res.json();
    },
    enabled: !!studentId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Student>) => {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update student");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Student updated successfully" });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete student");
    },
    onSuccess: () => {
      toast({ title: "Student deleted successfully" });
      setLocation("/");
    },
    onError: () => {
      toast({ title: "Failed to delete student", variant: "destructive" });
    },
  });

  const handleEdit = () => {
    setFormData(student || {});
    setIsEditing(true);
  };

  const handleSave = () => {
    try {
      const validated = insertStudentSchema.partial().parse(formData);
      updateMutation.mutate(validated);
    } catch (error: any) {
      toast({ title: "Validation error", description: error.message, variant: "destructive" });
    }
  };

  const handleCancel = () => {
    setFormData({});
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="w-[90%] mx-auto px-4 md:px-6 py-6 flex-1">
          <Skeleton className="h-[600px] w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="w-[90%] mx-auto px-4 md:px-6 py-6 flex-1">
          <Button variant="ghost" onClick={() => setLocation("/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Students
          </Button>
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Student not found</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="w-[90%] mx-auto px-4 md:px-6 py-6 flex-1">
        <div className="w-full mb-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Students
            </Button>
            {!isEditing ? (
              <div className="flex gap-2">
                <Button onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{student.name}</CardTitle>
                <CardDescription>Student Details</CardDescription>
              </div>
              <Badge className={statusColors[student.status as keyof typeof statusColors]}>
                {student.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isEditing ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{student.email}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{student.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Course Interested</Label>
                    <p className="font-medium">{student.courseInterested || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Location</Label>
                    <p className="font-medium">{student.location || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Citizenship Status</Label>
                    <p className="font-medium">{student.citizenshipStatus || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Registration Date</Label>
                    <p className="font-medium">{student.registrationDate}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground">Current Situation</Label>
                  <p className="font-medium">{student.currentSituation || "N/A"}</p>
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Created:</span> {student.createdAt}
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span> {student.updatedAt}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status || ""}
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="enrolled">Enrolled</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="graduated">Graduated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course">Course Interested</Label>
                    <Select
                      value={formData.courseInterested || ""}
                      onValueChange={(v) => setFormData({ ...formData, courseInterested: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.abbr}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select
                      value={formData.location || ""}
                      onValueChange={(v) => setFormData({ ...formData, location: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Toronto">Toronto</SelectItem>
                        <SelectItem value="Mississauga">Mississauga</SelectItem>
                        <SelectItem value="Brampton">Brampton</SelectItem>
                        <SelectItem value="Ottawa">Ottawa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="citizenship">Citizenship Status</Label>
                    <Input
                      id="citizenship"
                      value={formData.citizenshipStatus || ""}
                      onChange={(e) => setFormData({ ...formData, citizenshipStatus: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationDate">Registration Date *</Label>
                    <Input
                      id="registrationDate"
                      type="date"
                      value={formData.registrationDate || ""}
                      onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="situation">Current Situation</Label>
                  <Textarea
                    id="situation"
                    value={formData.currentSituation || ""}
                    onChange={(e) => setFormData({ ...formData, currentSituation: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the student record for <strong>{student.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
