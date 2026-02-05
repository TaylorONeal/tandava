import { useState } from "react";
import { TeachLayout } from "@/components/teach/TeachLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Repeat2,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Check,
  X,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubOpportunity {
  id: string;
  className: string;
  style: string;
  originalTeacher: string;
  date: string;
  dayOfWeek: string;
  time: string;
  endTime: string;
  room: string;
  location: string;
  capacity: number;
  booked: number;
  pay: number;
  postedAt: string;
  matchesQualification: boolean;
}

interface SubRequest {
  id: string;
  className: string;
  style: string;
  date: string;
  dayOfWeek: string;
  time: string;
  endTime: string;
  room: string;
  booked: number;
  status: "pending" | "claimed" | "cancelled";
  requestedAt: string;
  claimedBy?: string;
  reason?: string;
}

const mockOpportunities: SubOpportunity[] = [
  {
    id: "1",
    className: "Gentle Flow",
    style: "Hatha",
    originalTeacher: "James Liu",
    date: "Feb 10",
    dayOfWeek: "Mon",
    time: "9:30 AM",
    endTime: "10:30 AM",
    room: "Main Studio",
    location: "SOMA",
    capacity: 20,
    booked: 14,
    pay: 75,
    postedAt: "2 hours ago",
    matchesQualification: true,
  },
  {
    id: "2",
    className: "Yin Restore",
    style: "Yin",
    originalTeacher: "Ava Kim",
    date: "Feb 14",
    dayOfWeek: "Fri",
    time: "4:30 PM",
    endTime: "5:45 PM",
    room: "Main Studio",
    location: "SOMA",
    capacity: 20,
    booked: 8,
    pay: 65,
    postedAt: "1 day ago",
    matchesQualification: false,
  },
  {
    id: "3",
    className: "Morning Vinyasa",
    style: "Vinyasa",
    originalTeacher: "Maya Patel",
    date: "Feb 12",
    dayOfWeek: "Wed",
    time: "7:00 AM",
    endTime: "8:15 AM",
    room: "Main Studio",
    location: "SOMA",
    capacity: 25,
    booked: 19,
    pay: 75,
    postedAt: "3 days ago",
    matchesQualification: true,
  },
  {
    id: "4",
    className: "Hot Vinyasa",
    style: "Hot",
    originalTeacher: "Sarah Chen",
    date: "Feb 18",
    dayOfWeek: "Tue",
    time: "9:00 AM",
    endTime: "10:15 AM",
    room: "Hot Room",
    location: "SOMA",
    capacity: 30,
    booked: 22,
    pay: 85,
    postedAt: "5 hours ago",
    matchesQualification: true,
  },
];

const mockRequests: SubRequest[] = [
  {
    id: "1",
    className: "Morning Vinyasa",
    style: "Vinyasa",
    date: "Feb 12",
    dayOfWeek: "Wed",
    time: "7:00 AM",
    endTime: "8:15 AM",
    room: "Main Studio",
    booked: 19,
    status: "pending",
    requestedAt: "Feb 1",
    reason: "Doctor appointment",
  },
  {
    id: "2",
    className: "Evening Vinyasa",
    style: "Vinyasa",
    date: "Feb 5",
    dayOfWeek: "Wed",
    time: "6:00 PM",
    endTime: "7:15 PM",
    room: "Main Studio",
    booked: 15,
    status: "claimed",
    requestedAt: "Jan 28",
    claimedBy: "James Liu",
  },
  {
    id: "3",
    className: "Community Flow",
    style: "Vinyasa",
    date: "Jan 25",
    dayOfWeek: "Sat",
    time: "11:00 AM",
    endTime: "12:15 PM",
    room: "Main Studio",
    booked: 20,
    status: "cancelled",
    requestedAt: "Jan 20",
    reason: "Personal emergency",
  },
];

export default function TeachSubs() {
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<SubOpportunity | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SubRequest | null>(
    null
  );
  const { toast } = useToast();

  const pendingRequests = mockRequests.filter((r) => r.status === "pending");
  const pastRequests = mockRequests.filter((r) => r.status !== "pending");

  const handleClaimSub = () => {
    if (!selectedOpportunity) return;
    toast({
      title: "Sub claimed!",
      description: `You are now teaching ${selectedOpportunity.className} on ${selectedOpportunity.date} at ${selectedOpportunity.time}.`,
    });
    setClaimDialogOpen(false);
    setSelectedOpportunity(null);
  };

  const handleCancelRequest = () => {
    if (!selectedRequest) return;
    toast({
      title: "Request cancelled",
      description: `Your sub request for ${selectedRequest.className} has been cancelled.`,
    });
    setCancelDialogOpen(false);
    setSelectedRequest(null);
  };

  const getStatusBadge = (status: SubRequest["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-[10px] border-accent-gold/50 text-accent-gold"
          >
            Pending
          </Badge>
        );
      case "claimed":
        return (
          <Badge className="text-[10px] bg-accent-sage/20 text-accent-sage border-0">
            Covered
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="text-[10px]">
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <TeachLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find coverage or pick up extra classes
          </p>
        </div>

        <Tabs defaultValue="opportunities" className="space-y-6">
          <TabsList>
            <TabsTrigger value="opportunities" className="gap-2">
              <Repeat2 className="h-4 w-4" />
              Open Opportunities
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {mockOpportunities.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <Clock className="h-4 w-4" />
              My Requests
              {pendingRequests.length > 0 && (
                <Badge className="ml-1 text-[10px] bg-accent-gold/20 text-accent-gold border-0">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Open Opportunities */}
          <TabsContent value="opportunities" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Classes that need coverage matching your qualifications
              </p>
            </div>

            {mockOpportunities.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Repeat2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No open sub opportunities right now
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check back later for new requests
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {mockOpportunities.map((opp) => (
                  <Card
                    key={opp.id}
                    className={`transition-all ${
                      opp.matchesQualification
                        ? "hover:border-accent-sage/50 hover:shadow-md"
                        : "opacity-60"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4 min-w-0">
                          {/* Date & Time */}
                          <div className="shrink-0 w-24 text-center p-3 rounded-xl bg-secondary/50">
                            <p className="text-xs text-muted-foreground">
                              {opp.dayOfWeek}
                            </p>
                            <p className="text-sm font-bold">{opp.date}</p>
                            <p className="text-xs font-medium mt-1">{opp.time}</p>
                          </div>

                          {/* Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold">
                                {opp.className}
                              </h3>
                              <Badge variant="outline" className="text-[10px]">
                                {opp.style}
                              </Badge>
                              {!opp.matchesQualification && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  Outside Qualifications
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Covering for{" "}
                              <span className="font-medium">
                                {opp.originalTeacher}
                              </span>
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {opp.room}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {opp.time} - {opp.endTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {opp.booked}/{opp.capacity} booked
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Posted {opp.postedAt}
                            </p>
                          </div>
                        </div>

                        {/* Pay & Action */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-1 text-lg font-bold text-accent-sage">
                            <DollarSign className="h-4 w-4" />
                            {opp.pay}
                          </div>
                          <Button
                            size="sm"
                            disabled={!opp.matchesQualification}
                            onClick={() => {
                              setSelectedOpportunity(opp);
                              setClaimDialogOpen(true);
                            }}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Claim
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Requests */}
          <TabsContent value="requests" className="space-y-6">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Pending Requests
                </h2>
                {pendingRequests.map((req) => (
                  <Card
                    key={req.id}
                    className="border-accent-gold/30 bg-accent-gold/5"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4 min-w-0">
                          {/* Date & Time */}
                          <div className="shrink-0 w-24 text-center p-3 rounded-xl bg-accent-gold/10">
                            <p className="text-xs text-muted-foreground">
                              {req.dayOfWeek}
                            </p>
                            <p className="text-sm font-bold">{req.date}</p>
                            <p className="text-xs font-medium mt-1">{req.time}</p>
                          </div>

                          {/* Details */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold">
                                {req.className}
                              </h3>
                              {getStatusBadge(req.status)}
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {req.room}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {req.booked} booked
                              </span>
                            </div>
                            {req.reason && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Reason: {req.reason}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Requested {req.requestedAt}
                            </p>
                          </div>
                        </div>

                        {/* Action */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedRequest(req);
                            setCancelDialogOpen(true);
                          }}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Past Requests */}
            {pastRequests.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Past Requests
                </h2>
                {pastRequests.map((req) => (
                  <Card key={req.id} className="bg-secondary/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4 min-w-0">
                          {/* Date & Time */}
                          <div className="shrink-0 w-24 text-center p-3 rounded-xl bg-secondary/50">
                            <p className="text-xs text-muted-foreground">
                              {req.dayOfWeek}
                            </p>
                            <p className="text-sm font-bold">{req.date}</p>
                            <p className="text-xs font-medium mt-1">{req.time}</p>
                          </div>

                          {/* Details */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold">
                                {req.className}
                              </h3>
                              {getStatusBadge(req.status)}
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {req.room}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {req.booked} booked
                              </span>
                            </div>
                            {req.claimedBy && (
                              <p className="text-xs text-accent-sage mt-2">
                                Covered by {req.claimedBy}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Requested {req.requestedAt}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {mockRequests.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No sub requests yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Request a sub from your schedule when you need coverage
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Claim Sub Dialog */}
      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Claim This Sub</DialogTitle>
            <DialogDescription>
              Confirm that you want to teach this class.
            </DialogDescription>
          </DialogHeader>
          {selectedOpportunity && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-secondary/50">
                <h3 className="text-sm font-semibold">
                  {selectedOpportunity.className}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Covering for {selectedOpportunity.originalTeacher}
                </p>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedOpportunity.dayOfWeek}, {selectedOpportunity.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedOpportunity.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedOpportunity.room}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedOpportunity.booked} booked
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-accent-sage/10 border border-accent-sage/20">
                <span className="text-sm font-medium">Compensation</span>
                <span className="text-lg font-bold text-accent-sage">
                  ${selectedOpportunity.pay}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleClaimSub}>
              <Check className="h-4 w-4 mr-2" />
              Confirm Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Request Alert Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Sub Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your sub request for{" "}
              {selectedRequest?.className} on {selectedRequest?.date}? You will
              need to teach this class yourself.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelRequest}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TeachLayout>
  );
}
