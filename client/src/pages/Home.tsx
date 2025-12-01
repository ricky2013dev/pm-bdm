import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import BirthdayCalendar from "@/components/BirthdayCalendar";
import ThemeToggle from "@/components/ThemeToggle";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Birthday } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();

  const { data: birthdays = [], isLoading } = useQuery<Birthday[]>({
    queryKey: ["/api/birthdays"],
  });

  const addMutation = useMutation({
    mutationFn: async (birthday: Omit<Birthday, "id">) => {
      const res = await apiRequest("POST", "/api/birthdays", birthday);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/birthdays"] });
      toast({ title: "Birthday added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add birthday", variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async (birthday: Birthday) => {
      const res = await apiRequest("PUT", `/api/birthdays/${birthday.id}`, {
        name: birthday.name,
        date: birthday.date,
        notes: birthday.notes,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/birthdays"] });
      toast({ title: "Birthday updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update birthday", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/birthdays/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/birthdays"] });
      toast({ title: "Birthday deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete birthday", variant: "destructive" });
    },
  });

  const handleAddBirthday = (birthday: Omit<Birthday, "id">) => {
    addMutation.mutate(birthday);
  };

  const handleEditBirthday = (birthday: Birthday) => {
    editMutation.mutate(birthday);
  };

  const handleDeleteBirthday = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-end">
            <ThemeToggle />
          </div>
        </header>
        <main className="py-6">
          <div className="max-w-6xl mx-auto p-4 md:p-6">
            <div className="flex flex-col gap-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-[600px] w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-end">
          <ThemeToggle />
        </div>
      </header>
      <main className="py-6">
        <BirthdayCalendar
          birthdays={birthdays}
          onAddBirthday={handleAddBirthday}
          onEditBirthday={handleEditBirthday}
          onDeleteBirthday={handleDeleteBirthday}
        />
      </main>
    </div>
  );
}
