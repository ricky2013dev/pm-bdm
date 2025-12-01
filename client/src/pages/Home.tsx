import { useState } from "react";
import BirthdayCalendar, { Birthday } from "@/components/BirthdayCalendar";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  // todo: remove mock functionality - replace with API calls
  const [birthdays, setBirthdays] = useState<Birthday[]>([
    { id: "1", name: "John Smith", date: "1990-12-15", notes: "Likes chocolate cake" },
    { id: "2", name: "Sarah Johnson", date: "1985-12-15" },
    { id: "3", name: "Mike Wilson", date: "1992-12-20", notes: "Prefers gift cards" },
    { id: "4", name: "Emma Davis", date: "1988-12-25", notes: "Birthday on Christmas!" },
    { id: "5", name: "Alex Brown", date: "1995-01-05" },
  ]);

  const handleAddBirthday = (birthday: Omit<Birthday, "id">) => {
    // todo: remove mock functionality - replace with API call
    const newBirthday: Birthday = {
      ...birthday,
      id: Date.now().toString(),
    };
    setBirthdays([...birthdays, newBirthday]);
  };

  const handleEditBirthday = (birthday: Birthday) => {
    // todo: remove mock functionality - replace with API call
    setBirthdays(birthdays.map((b) => (b.id === birthday.id ? birthday : b)));
  };

  const handleDeleteBirthday = (id: string) => {
    // todo: remove mock functionality - replace with API call
    setBirthdays(birthdays.filter((b) => b.id !== id));
  };

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
