import { useState } from "react";
import BirthdayCalendar, { Birthday } from "../BirthdayCalendar";

export default function BirthdayCalendarExample() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([
    { id: "1", name: "John Smith", date: "1990-12-15", notes: "Likes chocolate cake" },
    { id: "2", name: "Sarah Johnson", date: "1985-12-15", notes: null },
    { id: "3", name: "Mike Wilson", date: "1992-12-20", notes: "Prefers gift cards" },
    { id: "4", name: "Emma Davis", date: "1988-12-25", notes: "Birthday on Christmas!" },
    { id: "5", name: "Alex Brown", date: "1995-01-05", notes: null },
  ]);

  const handleAddBirthday = (birthday: Omit<Birthday, "id">) => {
    const newBirthday: Birthday = {
      ...birthday,
      id: Date.now().toString(),
    };
    setBirthdays([...birthdays, newBirthday]);
    console.log("Added birthday:", newBirthday);
  };

  const handleEditBirthday = (birthday: Birthday) => {
    setBirthdays(birthdays.map((b) => (b.id === birthday.id ? birthday : b)));
    console.log("Edited birthday:", birthday);
  };

  const handleDeleteBirthday = (id: string) => {
    setBirthdays(birthdays.filter((b) => b.id !== id));
    console.log("Deleted birthday:", id);
  };

  return (
    <BirthdayCalendar
      birthdays={birthdays}
      onAddBirthday={handleAddBirthday}
      onEditBirthday={handleEditBirthday}
      onDeleteBirthday={handleDeleteBirthday}
    />
  );
}
