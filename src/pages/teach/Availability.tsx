import { useState } from "react";
import { TeachLayout } from "@/components/teach/TeachLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, Save, Calendar } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface TimeSlot {
  start: string;
  end: string;
  enabled: boolean;
}

const defaultAvailability: Record<string, TimeSlot> = {
  Monday: { start: "06:00", end: "12:00", enabled: true },
  Tuesday: { start: "06:00", end: "14:00", enabled: true },
  Wednesday: { start: "06:00", end: "12:00", enabled: true },
  Thursday: { start: "06:00", end: "14:00", enabled: true },
  Friday: { start: "07:00", end: "11:00", enabled: true },
  Saturday: { start: "08:00", end: "13:00", enabled: true },
  Sunday: { start: "00:00", end: "00:00", enabled: false },
};

export default function TeachAvailability() {
  const { toast } = useToast();
  const [availability, setAvailability] = useState(defaultAvailability);
  const [subAvailable, setSubAvailable] = useState(true);
  const [subRadius, setSubRadius] = useState("any");

  const toggleDay = (day: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const updateTime = (day: string, field: "start" | "end", value: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = () => {
    toast({
      title: "Availability saved",
      description: "Your weekly availability has been updated.",
    });
  };

  return (
    <TeachLayout>
      <SEOHead title="Availability" noindex />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Availability</h1>
            <p className="text-muted-foreground">Set your weekly teaching availability</p>
          </div>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>

        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {DAYS.map((day) => {
              const slot = availability[day];
              return (
                <div key={day} className="flex items-center gap-4 py-3 border-b last:border-0">
                  <Switch checked={slot.enabled} onCheckedChange={() => toggleDay(day)} />
                  <span className="w-28 font-medium">{day}</span>
                  {slot.enabled ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateTime(day, "start", e.target.value)}
                        className="px-3 py-1.5 rounded-md border bg-background text-sm"
                      />
                      <span className="text-muted-foreground">to</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateTime(day, "end", e.target.value)}
                        className="px-3 py-1.5 rounded-md border bg-background text-sm"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unavailable</span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Sub Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sub Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Available for subs</p>
                <p className="text-sm text-muted-foreground">
                  Other teachers can see you as available for sub requests
                </p>
              </div>
              <Switch checked={subAvailable} onCheckedChange={setSubAvailable} />
            </div>

            {subAvailable && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Sub radius</p>
                <div className="flex gap-2">
                  {["any", "same-studio", "same-style"].map((option) => (
                    <Badge
                      key={option}
                      variant={subRadius === option ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSubRadius(option)}
                    >
                      {option === "any" ? "Any class" : option === "same-studio" ? "Same studio only" : "Same style only"}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TeachLayout>
  );
}
