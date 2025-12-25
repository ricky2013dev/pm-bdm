import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { InsertStudent, insertStudentSchema } from "@shared/schema";
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
import { ArrowLeft, Save, RotateCcw, Upload } from "lucide-react";
import { courses } from "@/data/courses";

export default function AddStudent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<InsertStudent>>({
    status: "pending",
    registrationDate: new Date().toISOString().split("T")[0],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertStudent) => {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create student");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Student created successfully" });
      setLocation(`/students/${data.id}`);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = insertStudentSchema.parse(formData);
      createMutation.mutate(validated);
    } catch (error: any) {
      const errors = error.errors?.map((e: any) => e.message).join(", ") || "Validation error";
      toast({ title: "Please check your inputs", description: errors, variant: "destructive" });
    }
  };

  const handleClear = () => {
    setFormData({
      status: "pending",
      registrationDate: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="w-[90%] mx-auto px-4 md:px-6 py-6 flex-1">
        <Button variant="ghost" onClick={() => setLocation("/students")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="md:hidden">Back</span>
          <span className="hidden md:inline">Back to Students</span>
        </Button>
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Add New Student</CardTitle>
                <CardDescription>Enter student information below. Fields marked with * are required.</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setLocation("/students/import")} className="w-full md:w-auto">
                <Upload className="w-4 h-4 mr-2" />
                <span className="md:hidden">Import</span>
                <span className="hidden md:inline">Bulk Import</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    placeholder="(123) 456-7890"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status || ""}
                    onValueChange={(v) => setFormData({ ...formData, status: v as any })}
                    required
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
                      <SelectValue placeholder="Select a course (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">None</SelectItem>
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
                      <SelectValue placeholder="Select a location (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">None</SelectItem>
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
                    placeholder="e.g., Citizen, PR, International Student"
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
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="situation">Current Situation</Label>
                <Textarea
                  id="situation"
                  placeholder="Enter any additional notes about the student's current situation..."
                  value={formData.currentSituation || ""}
                  onChange={(e) => setFormData({ ...formData, currentSituation: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <Button type="submit" disabled={createMutation.isPending} className="flex-1 md:flex-none">
                  <Save className="w-4 h-4 mr-2" />
                  {createMutation.isPending ? "Creating..." : "Create Student"}
                </Button>
                <Button type="button" variant="outline" onClick={handleClear}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
