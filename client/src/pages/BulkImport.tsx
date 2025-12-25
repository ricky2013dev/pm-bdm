import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Papa from "papaparse";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BulkImport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const importMutation = useMutation({
    mutationFn: async (csvData: string) => {
      // Parse CSV with proper handling of quoted fields
      const parseResult = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().replace(/\s+/g, ""),
      });

      if (parseResult.errors.length > 0) {
        const parseErrors = parseResult.errors.map(
          (err) => `Line ${err.row !== undefined ? err.row + 2 : '?'}: ${err.message}`
        );
        setErrors(parseErrors);
        throw new Error(`Found ${parseErrors.length} parsing errors in CSV`);
      }

      const students = parseResult.data as any[];
      const importErrors: string[] = [];

      if (students.length === 0) {
        throw new Error("CSV file must contain at least one student record");
      }

      setErrors(importErrors);
      setPreview(students.slice(0, 5));

      if (importErrors.length > 0) {
        throw new Error(`Found ${importErrors.length} errors in CSV`);
      }

      const results = await Promise.allSettled(
        students.map(async (student, index) => {
          // Helper to convert empty strings to undefined
          const cleanValue = (val: any) => (val === "" || val === null || val === undefined) ? undefined : val;

          // Helper to parse date from MM/DD/YYYY format to YYYY-MM-DD
          const parseDate = (dateStr: string | undefined): string => {
            if (!dateStr) return new Date().toISOString().split("T")[0];

            // Try MM/DD/YYYY HH:MM:SS format first
            const mmddyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (mmddyyyyMatch) {
              const [, month, day, year] = mmddyyyyMatch;
              return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }

            // If already in YYYY-MM-DD format, return as is
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              return dateStr;
            }

            // Default to current date
            return new Date().toISOString().split("T")[0];
          };

          const registrationDate = parseDate(
            cleanValue(student.timestamp) ||
            cleanValue(student.register_date) ||
            cleanValue(student.registrationdate)
          );

          const response = await fetch("/api/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: cleanValue(student.name) || "Unknown",
              email: cleanValue(student.email) || `unknown_${Date.now()}_${Math.random()}@example.com`,
              phone: cleanValue(student.phone) || "0000000000",
              courseInterested: cleanValue(student.interested_medical_professions) || cleanValue(student.courseinterested) || cleanValue(student.course),
              location: cleanValue(student.location),
              status: cleanValue(student.status) || "pending",
              citizenshipStatus: cleanValue(student.current_status_citizenship) || cleanValue(student.citizenshipstatus),
              currentSituation: cleanValue(student.current_situation) || cleanValue(student.currentsituation),
              registrationDate,
            }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: "Unknown error" }));
            const errorMsg = error.details
              ? `${error.error}: ${JSON.stringify(error.details)}`
              : error.error || `HTTP ${response.status}`;
            throw new Error(errorMsg);
          }

          return response.json();
        })
      );

      const succeeded = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;

      // Log failures for debugging
      const failures = results.filter(r => r.status === "rejected") as PromiseRejectedResult[];
      if (failures.length > 0) {
        console.error("Import failures:", failures.map(f => f.reason.message));
      }

      return { succeeded, failed, total: students.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Import completed",
        description: `Successfully imported ${data.succeeded} students. ${data.failed} failed.`,
      });
      if (data.succeeded > 0) {
        setTimeout(() => setLocation("/students"), 1500);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Import failed", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast({ title: "Invalid file type", description: "Please select a CSV file", variant: "destructive" });
        return;
      }
      setFile(selectedFile);
      setPreview([]);
      setErrors([]);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      importMutation.mutate(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="w-[90%] mx-auto px-4 md:px-6 py-6 space-y-6 flex-1">
        <Button variant="ghost" onClick={() => setLocation("/students")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Students
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Bulk Import Students</CardTitle>
            <CardDescription>Upload a CSV file to import multiple student records at once</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                CSV Format: name, email, phone, courseInterested, location, status, citizenshipStatus, currentSituation, registrationDate
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>

              {file && (
                <div className="flex gap-2">
                  <Button onClick={handleImport} disabled={importMutation.isPending}>
                    <Upload className="w-4 h-4 mr-2" />
                    {importMutation.isPending ? "Importing..." : "Import Students"}
                  </Button>
                </div>
              )}
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <div className="font-semibold mb-2">Errors found:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.slice(0, 10).map((error, idx) => (
                      <li key={idx} className="text-sm">{error}</li>
                    ))}
                    {errors.length > 10 && <li className="text-sm">...and {errors.length - 10} more</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {preview.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Preview (first 5 records):</h3>
                <div className="border rounded-md overflow-auto">
                  <pre className="p-4 text-xs">{JSON.stringify(preview, null, 2)}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sample CSV File</CardTitle>
            <CardDescription>Download and use this template for your import</CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/sample_student.csv" download className="inline-block">
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Download Sample CSV
              </Button>
            </a>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
