import { useState, useCallback } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Download,
  Loader2,
  X,
  Columns,
  Users,
  Calendar,
  CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ImportSource } from "@/types/database";

type ImportStep = "source" | "upload" | "mapping" | "preview" | "processing" | "complete";

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  sampleValues: string[];
  isRequired: boolean;
  autoMatched: boolean;
}

const sourceOptions: { value: ImportSource; label: string; description: string }[] = [
  { value: "mindbody", label: "MindBody Format", description: "Migration connector for MindBody-format CSV exports" },
  { value: "walla", label: "Walla Format", description: "Migration connector for Walla-format CSV exports" },
  { value: "arketa", label: "Arketa Format", description: "Migration connector for Arketa-format CSV exports" },
  { value: "momoyoga", label: "Momoyoga Format", description: "Migration connector for Momoyoga-format CSV exports" },
  { value: "generic_csv", label: "Generic CSV", description: "Import from any CSV with manual column mapping" },
];

const importTypes = [
  { value: "clients", label: "Clients / Students", icon: Users, description: "Names, emails, phone numbers, emergency contacts" },
  { value: "attendance", label: "Class History / Attendance", icon: Calendar, description: "Past class bookings and attendance records" },
  { value: "transactions", label: "Transaction History", icon: CreditCard, description: "Purchase history, payments, and refunds" },
];

// Mock: simulates auto-detected column mappings from a typical client export CSV
const mockColumnMappings: ColumnMapping[] = [
  { sourceColumn: "First Name", targetField: "first_name", sampleValues: ["Emma", "Alex", "Mia"], isRequired: true, autoMatched: true },
  { sourceColumn: "Last Name", targetField: "last_name", sampleValues: ["Wilson", "Rivera", "Tanaka"], isRequired: true, autoMatched: true },
  { sourceColumn: "Email", targetField: "email", sampleValues: ["emma@ex.com", "alex@ex.com", "mia@ex.com"], isRequired: true, autoMatched: true },
  { sourceColumn: "Mobile Phone", targetField: "phone", sampleValues: ["415-555-0101", "415-555-0102", ""], isRequired: false, autoMatched: true },
  { sourceColumn: "Birth Date", targetField: "date_of_birth", sampleValues: ["03/15/1990", "07/22/1985", ""], isRequired: false, autoMatched: true },
  { sourceColumn: "Emergency Contact Name", targetField: "emergency_contact_name", sampleValues: ["John Wilson", "", "Ken Tanaka"], isRequired: false, autoMatched: true },
  { sourceColumn: "Emergency Contact Phone", targetField: "emergency_contact_phone", sampleValues: ["415-555-0201", "", "415-555-0203"], isRequired: false, autoMatched: true },
  { sourceColumn: "Notes", targetField: "notes", sampleValues: ["Knee injury", "", "Prenatal"], isRequired: false, autoMatched: true },
  { sourceColumn: "Client ID", targetField: "", sampleValues: ["MB10001", "MB10002", "MB10003"], isRequired: false, autoMatched: false },
  { sourceColumn: "Home Phone", targetField: "", sampleValues: ["", "", ""], isRequired: false, autoMatched: false },
];

const targetFieldOptions = [
  { value: "", label: "Skip this column" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "date_of_birth", label: "Date of Birth" },
  { value: "emergency_contact_name", label: "Emergency Contact Name" },
  { value: "emergency_contact_phone", label: "Emergency Contact Phone" },
  { value: "notes", label: "Notes" },
  { value: "tags", label: "Tags" },
  { value: "pronouns", label: "Pronouns" },
];

export default function ImportManage() {
  const [step, setStep] = useState<ImportStep>("source");
  const [selectedSource, setSelectedSource] = useState<ImportSource | "">("");
  const [selectedImportType, setSelectedImportType] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState({ total: 0, success: 0, errors: 0, skipped: 0 });
  const { toast } = useToast();

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({ title: "Invalid file", description: "Please upload a CSV file.", variant: "destructive" });
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);

    // In production: parse the CSV headers, auto-detect mappings
    // For now: use mock mappings
    setColumnMappings(mockColumnMappings);
    setStep("mapping");
  }, [toast]);

  const handleMappingChange = (index: number, targetField: string) => {
    setColumnMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, targetField, autoMatched: false } : m))
    );
  };

  const handleStartImport = () => {
    setStep("processing");
    setProgress(0);

    // Simulate import processing
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setImportResults({ total: 347, success: 339, errors: 3, skipped: 5 });
          setStep("complete");
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  const handleReset = () => {
    setStep("source");
    setSelectedSource("");
    setSelectedImportType("");
    setFileName("");
    setFileSize(0);
    setColumnMappings([]);
    setProgress(0);
  };

  return (
    <ManageLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import Data</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Migrate your studio data from another platform or any CSV export
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 text-xs">
          {[
            { key: "source", label: "Source" },
            { key: "upload", label: "Upload" },
            { key: "mapping", label: "Map Columns" },
            { key: "preview", label: "Preview" },
            { key: "processing", label: "Import" },
            { key: "complete", label: "Done" },
          ].map((s, i, arr) => {
            const steps: ImportStep[] = ["source", "upload", "mapping", "preview", "processing", "complete"];
            const currentIndex = steps.indexOf(step);
            const stepIndex = steps.indexOf(s.key as ImportStep);
            const isDone = stepIndex < currentIndex;
            const isCurrent = s.key === step;

            return (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors ${
                    isCurrent ? "bg-primary text-primary-foreground" :
                    isDone ? "bg-accent-sage/20 text-accent-sage" :
                    "bg-secondary text-muted-foreground"
                  }`}
                >
                  {isDone && <CheckCircle2 className="h-3 w-3" />}
                  <span>{s.label}</span>
                </div>
                {i < arr.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            );
          })}
        </div>

        {/* Step: Source Selection */}
        {step === "source" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Source Platform</CardTitle>
                <CardDescription>Where is your data coming from?</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3">
                {sourceOptions.map((source) => (
                  <button
                    key={source.value}
                    onClick={() => setSelectedSource(source.value)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedSource === source.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <p className="text-sm font-semibold">{source.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{source.description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {selectedSource && (
              <Card>
                <CardHeader>
                  <CardTitle>What are you importing?</CardTitle>
                  <CardDescription>Select the type of data to import</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {importTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedImportType(type.value)}
                      className={`flex items-center gap-3 w-full p-4 rounded-xl border text-left transition-all ${
                        selectedImportType === type.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <type.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {selectedSource && selectedImportType && (
              <div className="flex justify-end">
                <Button onClick={() => setStep("upload")}>
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step: File Upload */}
        {step === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                {selectedSource === "generic_csv"
                  ? "Upload any CSV file with your studio data"
                  : "Upload the CSV file you exported from your previous platform. Check your old platform's documentation for CSV export instructions."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <label className="block border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/30 transition-colors">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium mt-3">Drop your CSV file here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Maximum file size: 50MB</p>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => setStep("source")}>
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Column Mapping */}
        {step === "mapping" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Map Columns</CardTitle>
                    <CardDescription>
                      We auto-detected {columnMappings.filter((m) => m.autoMatched).length} of {columnMappings.length} columns. Review and adjust mappings below.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{fileName}</span>
                    <span className="text-xs text-muted-foreground">({(fileSize / 1024).toFixed(0)} KB)</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Header */}
                  <div className="grid grid-cols-[1fr,auto,1fr,1fr] gap-3 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span>CSV Column</span>
                    <span></span>
                    <span>Maps To</span>
                    <span>Sample Values</span>
                  </div>

                  {columnMappings.map((mapping, index) => (
                    <div
                      key={index}
                      className={`grid grid-cols-[1fr,auto,1fr,1fr] gap-3 items-center p-3 rounded-xl ${
                        mapping.targetField ? "bg-secondary/30" : "bg-secondary/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Columns className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">{mapping.sourceColumn}</span>
                        {mapping.isRequired && (
                          <Badge variant="outline" className="text-[9px] px-1 shrink-0">Required</Badge>
                        )}
                      </div>

                      <ArrowRight className="h-3 w-3 text-muted-foreground" />

                      <Select
                        value={mapping.targetField}
                        onValueChange={(val) => handleMappingChange(index, val)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Skip" />
                        </SelectTrigger>
                        <SelectContent>
                          {targetFieldOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="text-xs text-muted-foreground truncate">
                        {mapping.sampleValues.filter(Boolean).slice(0, 2).join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={() => setStep("preview")}>
                Preview Import <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Preview</CardTitle>
                <CardDescription>Review what will be imported before confirming</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/50 text-center">
                    <p className="text-2xl font-bold">347</p>
                    <p className="text-xs text-muted-foreground">Total Records</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50 text-center">
                    <p className="text-2xl font-bold">{columnMappings.filter((m) => m.targetField).length}</p>
                    <p className="text-xs text-muted-foreground">Mapped Fields</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-accent-sage/10 border border-accent-sage/20">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-sage mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Ready to import</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        347 {selectedImportType} records from {sourceOptions.find(s => s.value === selectedSource)?.label} will be imported.
                        Duplicates (matched by email) will be skipped.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sample Preview Table */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">First 3 rows</p>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {columnMappings.filter((m) => m.targetField).slice(0, 4).map((m) => (
                            <th key={m.sourceColumn} className="text-left p-2 text-xs font-medium text-muted-foreground">
                              {m.targetField.replace(/_/g, " ")}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[0, 1, 2].map((row) => (
                          <tr key={row} className="border-b border-border last:border-0">
                            {columnMappings.filter((m) => m.targetField).slice(0, 4).map((m) => (
                              <td key={m.sourceColumn} className="p-2 text-xs">
                                {m.sampleValues[row] || <span className="text-muted-foreground">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("mapping")}>
                Back
              </Button>
              <Button onClick={handleStartImport}>
                Start Import <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Processing */}
        {step === "processing" && (
          <Card>
            <CardContent className="py-16 text-center space-y-6">
              <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
              <div>
                <h3 className="text-lg font-semibold">Importing your data...</h3>
                <p className="text-sm text-muted-foreground mt-1">This may take a moment</p>
              </div>
              <div className="max-w-sm mx-auto space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{progress}% complete</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Complete */}
        {step === "complete" && (
          <div className="space-y-6">
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-accent-sage mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold">Import Complete</h3>
                  <p className="text-sm text-muted-foreground mt-1">Your data has been successfully imported</p>
                </div>

                <div className="grid grid-cols-4 gap-4 max-w-md mx-auto pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{importResults.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent-sage">{importResults.success}</p>
                    <p className="text-xs text-muted-foreground">Imported</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-destructive">{importResults.errors}</p>
                    <p className="text-xs text-muted-foreground">Errors</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent-gold">{importResults.skipped}</p>
                    <p className="text-xs text-muted-foreground">Skipped</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {importResults.errors > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    {importResults.errors} Import Errors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { row: 45, message: "Invalid email format: 'not-an-email'" },
                    { row: 128, message: "Duplicate email: emma.w@example.com (already exists)" },
                    { row: 301, message: "Missing required field: Last Name" },
                  ].map((error, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-destructive/5 text-sm">
                      <AlertCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                      <span>Row {error.row}: {error.message}</span>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="mt-2">
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download Error Report
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                Import More Data
              </Button>
              <Button asChild>
                <a href="/manage/students">
                  View Imported Students <ArrowRight className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Past Imports */}
        {step === "source" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Import History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { date: "Jan 15, 2025", source: "CSV Migration", type: "Clients", total: 347, status: "completed" },
                { date: "Jan 15, 2025", source: "CSV Migration", type: "Attendance", total: 12430, status: "completed" },
                { date: "Jan 14, 2025", source: "CSV Migration", type: "Transactions", total: 2841, status: "partial" },
              ].map((job, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{job.type} from {job.source}</p>
                      <p className="text-xs text-muted-foreground">{job.date} — {job.total.toLocaleString()} records</p>
                    </div>
                  </div>
                  <Badge
                    className={`text-xs ${
                      job.status === "completed" ? "bg-accent-sage/20 text-accent-sage" : "bg-accent-gold/20 text-accent-gold"
                    }`}
                  >
                    {job.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </ManageLayout>
  );
}
