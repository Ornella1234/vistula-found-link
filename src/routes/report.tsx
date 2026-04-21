import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Upload, X, Sparkles } from "lucide-react";
import { CATEGORIES, LOCATIONS } from "@/lib/constants";

const reportSearchSchema = z.object({
  type: fallback(z.enum(["lost", "found"]), "lost").default("lost"),
});

export const Route = createFileRoute("/report")({
  validateSearch: zodValidator(reportSearchSchema),
  component: ReportPage,
  head: () => ({
    meta: [
      { title: "Report an item — FoundIt" },
      { name: "description", content: "Report a lost or found item to the Vistula University community." },
    ],
  }),
});

function ReportPage() {
  const { type: initialType } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [type, setType] = useState<"lost" | "found">(initialType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"edit" | "review">("edit");

  useEffect(() => {
    if (!authLoading && !user) {
      void navigate({ to: "/auth" });
    }
  }, [user, authLoading, navigate]);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  // turn the picked file into a base64 data url so we can send it to the function
  function readAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }

  async function handleAiScan() {
    if (!photoFile) {
      toast.error("Upload a photo first to scan it.");
      return;
    }

    setScanning(true);
    try {
      const dataUrl = await readAsDataUrl(photoFile);
      const { data, error } = await supabase.functions.invoke("scan-item", {
        body: { imageDataUrl: dataUrl, type },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // only fill in the fields we got back, keep what the user already typed otherwise
      if (data?.title) setTitle(String(data.title).slice(0, 120));
      if (data?.description) setDescription(String(data.description).slice(0, 1000));
      if (data?.category && (CATEGORIES as readonly string[]).includes(data.category)) {
        setCategory(data.category);
      }

      toast.success("Details filled in — give them a quick read before posting.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scan failed, try again.");
    } finally {
      setScanning(false);
    }
  }

  const goToReview = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category || !location) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setStep("review");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      let photoUrl: string | null = null;

      if (photoFile) {
        const ext = photoFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("item-photos")
          .upload(path, photoFile, { contentType: photoFile.type, upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("item-photos").getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from("items")
        .insert({
          user_id: user.id,
          type,
          title: title.trim(),
          description: description.trim(),
          category,
          location,
          event_date: eventDate,
          photo_url: photoUrl,
        })
        .select("id")
        .single();
      if (error) throw error;

      toast.success(type === "lost" ? "Lost item posted!" : "Found item posted!");
      void navigate({ to: "/items/$itemId", params: { itemId: data.id } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Report an item</h1>
          <p className="mt-1 text-muted-foreground">
            Share details so the right person can find it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="space-y-2">
            <Label>I'm reporting a...</Label>
            <Tabs value={type} onValueChange={(v) => setType(v as "lost" | "found")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lost">🔍 Lost item</TabsTrigger>
                <TabsTrigger value="found">✋ Found item</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "lost" ? "e.g. Black iPhone 13 with cracked screen" : "e.g. Set of keys with red keychain"}
              maxLength={120}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe distinguishing features, color, brand, contents..."
              rows={4}
              maxLength={1000}
              required
            />
            <p className="text-xs text-muted-foreground">
              For lost items, hold back one detail to verify the finder. For found items, avoid revealing all details (helps verify owner).
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>
                Category <span className="text-destructive">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>
                Location <span className="text-destructive">*</span>
              </Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger><SelectValue placeholder="Where on campus?" /></SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="eventDate">
              {type === "lost" ? "When did you lose it?" : "When did you find it?"}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="eventDate"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label>Photo (optional)</Label>
              {photoPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAiScan}
                  disabled={scanning}
                  className="gap-1.5"
                >
                  {scanning ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  )}
                  {scanning ? "Scanning…" : "Auto-fill with AI"}
                </Button>
              )}
            </div>
            {photoPreview ? (
              <div className="relative w-fit">
                <img src={photoPreview} alt="Preview" className="h-40 rounded-lg border border-border object-cover" />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90"
                  aria-label="Remove photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface px-4 py-8 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Upload className="h-5 w-5" />
                Click to upload photo (max 5MB)
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            )}
            {photoPreview && (
              <p className="text-xs text-muted-foreground">
                Tip: Click <span className="font-medium text-foreground">Auto-fill with AI</span> to let AI suggest a title, description, and category from the photo.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Link to="/" className="flex-1">
              <Button type="button" variant="outline" className="w-full">Cancel</Button>
            </Link>
            <Button type="submit" disabled={submitting} className="flex-1 font-semibold" size="lg">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post item
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
