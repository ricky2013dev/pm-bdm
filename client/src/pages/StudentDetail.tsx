import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Student, insertStudentSchema, type StudentNote } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Save, X, Trash2, Plus, Clock } from "lucide-react";
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
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [activeTab, setActiveTab] = useState<"details" | "notes" | "log">("details");
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<StudentNote | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");

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
      setLocation("/students");
    },
    onError: () => {
      toast({ title: "Failed to delete student", variant: "destructive" });
    },
  });

  const { data: notes = [], isLoading: isLoadingNotes } = useQuery<StudentNote[]>({
    queryKey: [`/api/students/${studentId}/notes`],
    queryFn: async () => {
      const res = await fetch(`/api/students/${studentId}/notes`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
    enabled: !!studentId,
  });

  // Filter notes into user notes and system logs
  const userNotes = notes.filter(note => !note.isSystemGenerated);
  const systemLogs = notes.filter(note => note.isSystemGenerated);

  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/students/${studentId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create note");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}/notes`] });
      toast({ title: "Note added successfully" });
      setIsAddNoteOpen(false);
      setNoteContent("");
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update note");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}/notes`] });
      toast({ title: "Note updated successfully" });
      setEditingNote(null);
      setNoteContent("");
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete note");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}/notes`] });
      toast({ title: "Note deleted successfully" });
      setDeletingNoteId(null);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
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

  const handleAddNote = () => {
    if (!noteContent.trim()) {
      toast({ title: "Note content cannot be empty", variant: "destructive" });
      return;
    }
    createNoteMutation.mutate(noteContent);
  };

  const handleEditNote = () => {
    if (!editingNote || !noteContent.trim()) {
      toast({ title: "Note content cannot be empty", variant: "destructive" });
      return;
    }
    updateNoteMutation.mutate({ id: editingNote.id, content: noteContent });
  };

  const openEditDialog = (note: StudentNote) => {
    setEditingNote(note);
    setNoteContent(note.content);
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
          <Button variant="ghost" onClick={() => setLocation("/students")} className="mb-4">
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
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <Button variant="ghost" onClick={() => setLocation("/students")} className="pl-0 md:pl-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="md:hidden">Back</span>
              <span className="hidden md:inline">Back to Students</span>
            </Button>
            {!isEditing ? (
              <div className="flex gap-2 w-full md:w-auto justify-end">
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
              <div className="flex gap-2 w-full md:w-auto justify-end">
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
                <CardDescription>Student Information</CardDescription>
              </div>
              <Badge className={statusColors[student.status as keyof typeof statusColors]}>
                {student.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "details" | "notes" | "log")}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="notes">Notes ({userNotes.length})</TabsTrigger>
                <TabsTrigger value="log">Log ({systemLogs.length})</TabsTrigger>
              </TabsList>

              {/* DETAILS TAB */}
              <TabsContent value="details" className="space-y-6">
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
              </TabsContent>

              {/* NOTES TAB */}
              <TabsContent value="notes" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Student Notes</h3>
                  <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Note
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Note</DialogTitle>
                        <DialogDescription>
                          Add a note for {student.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="note-content">Note Content</Label>
                          <Textarea
                            id="note-content"
                            placeholder="Enter your note here..."
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            rows={5}
                            maxLength={5000}
                          />
                          <p className="text-xs text-muted-foreground">
                            {noteContent.length}/5000 characters
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddNoteOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddNote}
                          disabled={createNoteMutation.isPending || !noteContent.trim()}
                        >
                          {createNoteMutation.isPending ? "Adding..." : "Add Note"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {isLoadingNotes ? (
                  <Skeleton className="h-32 w-full" />
                ) : userNotes.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center text-muted-foreground py-8">
                        <p>No notes yet for this student.</p>
                        <p className="text-sm mt-2">Click "Add Note" to create the first one.</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {userNotes.map((note) => (
                      <Card key={note.id}>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{note.createdByName}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {new Date(note.createdAt).toLocaleString()}
                                  </span>
                                  {note.updatedAt !== note.createdAt && (
                                    <span className="italic">(edited)</span>
                                  )}
                                </div>
                              </div>
                              {user?.id === note.createdBy && (
                                <div className="flex gap-2">
                                  <Dialog
                                    open={!!editingNote && editingNote.id === note.id}
                                    onOpenChange={(open) => !open && setEditingNote(null)}
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditDialog(note)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Edit Note</DialogTitle>
                                        <DialogDescription>
                                          Update your note for {student.name}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-note-content">Note Content</Label>
                                          <Textarea
                                            id="edit-note-content"
                                            value={noteContent}
                                            onChange={(e) => setNoteContent(e.target.value)}
                                            rows={5}
                                            maxLength={5000}
                                          />
                                          <p className="text-xs text-muted-foreground">
                                            {noteContent.length}/5000 characters
                                          </p>
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <Button
                                          variant="outline"
                                          onClick={() => setEditingNote(null)}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={handleEditNote}
                                          disabled={updateNoteMutation.isPending || !noteContent.trim()}
                                        >
                                          {updateNoteMutation.isPending ? "Updating..." : "Update Note"}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>

                                  <AlertDialog
                                    open={deletingNoteId === note.id}
                                    onOpenChange={(open) => !open && setDeletingNoteId(null)}
                                  >
                                    <button
                                      onClick={() => setDeletingNoteId(note.id)}
                                      className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Note</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this note? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteNoteMutation.mutate(note.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              )}
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* LOG TAB */}
              <TabsContent value="log" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">System Logs</h3>
                </div>

                {isLoadingNotes ? (
                  <Skeleton className="h-32 w-full" />
                ) : systemLogs.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center text-muted-foreground py-8">
                        <p>No system logs yet for this student.</p>
                        <p className="text-sm mt-2">Status changes and system events will appear here.</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {systemLogs.map((log) => (
                      <Card key={log.id}>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{log.createdByName}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {new Date(log.createdAt).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                                System Log
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{log.content}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
