import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { data, isBackendConfigured } from "@/lib/backend";
import type { FeedbackType } from "@/types/database";
import { Send } from "lucide-react";

interface ContactFormProps {
  /** The type of message being sent */
  type: FeedbackType;
  /** Studio ID (for studio-directed messages) */
  studioId?: string;
  /** Class ID (for class feedback) */
  classId?: string;
  /** Whether anonymous submissions are allowed (studio inquiries only) */
  allowAnonymous?: boolean;
  /** Callback after successful submission */
  onSuccess?: () => void;
}

export function ContactForm({
  type,
  studioId,
  classId,
  allowAnonymous = false,
  onSuccess,
}: ContactFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: profile ? `${profile.first_name} ${profile.last_name}` : "",
    email: profile?.email || "",
    subject: "",
    body: "",
    // Honeypot — hidden from users, bots fill it
    _hp: "",
  });

  const isAnonymous = !profile && allowAnonymous;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check — if filled, silently reject
    if (formData._hp) {
      toast({ title: "Message sent!", description: "Thank you for reaching out." });
      return;
    }

    if (!formData.subject.trim() || !formData.body.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in the subject and message.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    if (!isBackendConfigured()) {
      // Demo mode — just show success
      await new Promise((r) => setTimeout(r, 500));
      toast({ title: "Message sent!", description: "Thank you for reaching out. (Demo mode)" });
      setFormData((prev) => ({ ...prev, subject: "", body: "" }));
      setIsSubmitting(false);
      onSuccess?.();
      return;
    }

    const { error } = await data.createMessage({
      type,
      studio_id: studioId || null,
      class_id: classId || null,
      sender_id: profile?.id || null,
      sender_name: isAnonymous ? formData.name : null,
      sender_email: isAnonymous ? formData.email : null,
      subject: formData.subject,
      body: formData.body,
      honeypot: formData._hp || null,
    });

    if (error) {
      toast({
        title: "Failed to send",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Message sent!", description: "Thank you for reaching out." });
      setFormData((prev) => ({ ...prev, subject: "", body: "" }));
      onSuccess?.();
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot — visually hidden, catches bots */}
      <div className="absolute -left-[9999px]" aria-hidden="true" tabIndex={-1}>
        <Input
          name="website"
          value={formData._hp}
          onChange={(e) => setFormData({ ...formData, _hp: e.target.value })}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Anonymous fields — only shown for unauthenticated visitors */}
      {isAnonymous && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact-name">Your Name</Label>
            <Input
              id="contact-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Jane Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="jane@example.com"
              required
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="contact-subject">Subject</Label>
        <Input
          id="contact-subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="What's this about?"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-body">Message</Label>
        <Textarea
          id="contact-body"
          value={formData.body}
          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          placeholder="Tell us more..."
          rows={5}
          required
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        <Send className="h-4 w-4 mr-2" />
        {isSubmitting ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
