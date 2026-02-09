import { useState } from "react";
import { TeachLayout } from "@/components/teach/TeachLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Save, Award, BookOpen, Star } from "lucide-react";

export default function TeachProfile() {
  const { toast } = useToast();
  const { profile } = useAuth();

  const profileName = profile?.display_name
    || (profile ? `${profile.first_name} ${profile.last_name}` : "Instructor");
  const initials = profileName.split(" ").map((n: string) => n[0]).join("").toUpperCase();

  const [bio, setBio] = useState(
    "E-RYT 500 certified yoga instructor with a passion for dynamic vinyasa and restorative practices. Teaching for 8+ years across multiple studios."
  );
  const [specialties, setSpecialties] = useState(["Vinyasa", "Power Yoga", "Yin"]);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [certifications] = useState([
    { name: "RYT-500", issuer: "Yoga Alliance", year: "2020" },
    { name: "Prenatal Yoga", issuer: "Birthlight", year: "2022" },
    { name: "Yin Yoga 100hr", issuer: "Insight Yoga Institute", year: "2023" },
  ]);

  const handleSave = () => {
    toast({
      title: "Profile updated",
      description: "Your instructor profile has been saved.",
    });
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties([...specialties, newSpecialty.trim()]);
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (s: string) => {
    setSpecialties(specialties.filter((sp) => sp !== s));
  };

  return (
    <TeachLayout>
      <SEOHead title="My Profile" noindex />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
            <p className="text-muted-foreground">Manage your public instructor profile</p>
          </div>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Profile
          </Button>
        </div>

        {/* Avatar & Name */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{profileName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm">4.9 rating</span>
                  <span className="text-sm text-muted-foreground">• 1,240 classes taught</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              About Me
            </CardTitle>
            <CardDescription>This appears on your public profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Tell students about yourself, your teaching style, and what to expect..."
            />
            <p className="text-xs text-muted-foreground mt-2">{bio.length}/500 characters</p>
          </CardContent>
        </Card>

        {/* Specialties */}
        <Card>
          <CardHeader>
            <CardTitle>Specialties</CardTitle>
            <CardDescription>Styles and focus areas you teach</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {specialties.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1 pr-1">
                  {s}
                  <button
                    onClick={() => removeSpecialty(s)}
                    className="ml-1 rounded-full hover:bg-muted p-0.5 text-xs"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                placeholder="Add specialty..."
                onKeyDown={(e) => e.key === "Enter" && addSpecialty()}
              />
              <Button variant="outline" onClick={addSpecialty}>Add</Button>
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {certifications.map((cert, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border">
                  <div>
                    <p className="font-medium">{cert.name}</p>
                    <p className="text-sm text-muted-foreground">{cert.issuer} • {cert.year}</p>
                  </div>
                  <Badge variant="outline">Verified</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TeachLayout>
  );
}
