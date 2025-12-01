import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Cake,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  differenceInYears,
  parseISO,
} from "date-fns";

export interface Birthday {
  id: string;
  name: string;
  date: string;
  notes: string | null;
}

interface BirthdayCalendarProps {
  birthdays: Birthday[];
  onAddBirthday: (birthday: Omit<Birthday, "id">) => void;
  onEditBirthday: (birthday: Birthday) => void;
  onDeleteBirthday: (id: string) => void;
}

export default function BirthdayCalendar({
  birthdays,
  onAddBirthday,
  onEditBirthday,
  onDeleteBirthday,
}: BirthdayCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingBirthday, setEditingBirthday] = useState<Birthday | null>(null);
  const [formData, setFormData] = useState({ name: "", date: "", notes: "" });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getBirthdaysForDate = (date: Date) => {
    return birthdays.filter((b) => {
      const bDate = parseISO(b.date);
      return bDate.getMonth() === date.getMonth() && bDate.getDate() === date.getDate();
    });
  };

  const getAge = (birthDate: string) => {
    return differenceInYears(new Date(), parseISO(birthDate));
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setFormData({ name: "", date: format(date, "yyyy-MM-dd"), notes: "" });
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (birthday: Birthday) => {
    setEditingBirthday(birthday);
    setFormData({
      name: birthday.name,
      date: birthday.date,
      notes: birthday.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleAddSubmit = () => {
    if (formData.name && formData.date) {
      onAddBirthday({
        name: formData.name,
        date: formData.date,
        notes: formData.notes || null,
      });
      setIsAddDialogOpen(false);
      setFormData({ name: "", date: "", notes: "" });
    }
  };

  const handleEditSubmit = () => {
    if (editingBirthday && formData.name && formData.date) {
      onEditBirthday({
        ...editingBirthday,
        name: formData.name,
        date: formData.date,
        notes: formData.notes || null,
      });
      setIsEditDialogOpen(false);
      setEditingBirthday(null);
      setFormData({ name: "", date: "", notes: "" });
    }
  };

  const handleDeleteClick = (id: string) => {
    onDeleteBirthday(id);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Cake className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">Birthday Manager</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-medium min-w-[180px] text-center" data-testid="text-current-month">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              data-testid="button-next-month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => {
            setFormData({ name: "", date: format(new Date(), "yyyy-MM-dd"), notes: "" });
            setIsAddDialogOpen(true);
          }} data-testid="button-add-birthday">
            <Plus className="h-4 w-4 mr-2" />
            Add Birthday
          </Button>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}

            {days.map((day, idx) => {
              const dayBirthdays = getBirthdaysForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] p-2 rounded-md border cursor-pointer transition-colors hover-elevate ${
                    isCurrentMonth
                      ? "bg-card"
                      : "bg-muted/30 text-muted-foreground"
                  } ${isCurrentDay ? "ring-2 ring-primary" : ""}`}
                  onClick={() => handleDayClick(day)}
                  data-testid={`cell-day-${format(day, "yyyy-MM-dd")}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentDay ? "text-primary font-semibold" : ""
                  }`}>
                    {format(day, "d")}
                  </div>
                  <div className="flex flex-col gap-1">
                    {dayBirthdays.slice(0, 3).map((birthday) => (
                      <Popover key={birthday.id}>
                        <PopoverTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-left"
                            data-testid={`button-birthday-${birthday.id}`}
                          >
                            <Badge
                              variant="secondary"
                              className="w-full justify-start gap-1 truncate text-xs"
                            >
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-medium">
                                {getInitials(birthday.name)}
                              </span>
                              <span className="truncate hidden sm:inline">{birthday.name}</span>
                            </Badge>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-4" align="start">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                                {getInitials(birthday.name)}
                              </div>
                              <div>
                                <p className="font-medium" data-testid={`text-name-${birthday.id}`}>{birthday.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Turns {getAge(birthday.date) + 1} on {format(parseISO(birthday.date), "MMM d")}
                                </p>
                              </div>
                            </div>
                            {birthday.notes && (
                              <p className="text-sm text-muted-foreground border-t pt-2">
                                {birthday.notes}
                              </p>
                            )}
                            <div className="flex gap-2 pt-2 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(birthday);
                                }}
                                data-testid={`button-edit-${birthday.id}`}
                              >
                                <Pencil className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(birthday.id);
                                }}
                                data-testid={`button-delete-${birthday.id}`}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ))}
                    {dayBirthdays.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{dayBirthdays.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Birthday</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="input-name"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="date">Birth Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  data-testid="input-date"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  data-testid="input-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} data-testid="button-cancel-add">
                Cancel
              </Button>
              <Button onClick={handleAddSubmit} data-testid="button-submit-add">
                Add Birthday
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Birthday</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="input-edit-name"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-date">Birth Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  data-testid="input-edit-date"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-notes">Notes (optional)</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Add any notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  data-testid="input-edit-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-cancel-edit">
                Cancel
              </Button>
              <Button onClick={handleEditSubmit} data-testid="button-submit-edit">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
