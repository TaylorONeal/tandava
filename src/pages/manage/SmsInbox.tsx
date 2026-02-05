import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Send,
  Search,
  Filter,
  MoreVertical,
  Archive,
  CheckCheck,
  User,
  Clock,
  ChevronDown,
  ExternalLink,
  Phone,
  Mail,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

// Mock conversation data
const mockConversations = [
  {
    id: "1",
    memberId: "m1",
    memberName: "Sarah Chen",
    memberPhone: "+1 (415) 555-0101",
    memberEmail: "sarah@example.com",
    avatar: "",
    lastMessage: "Thanks! See you tomorrow for the 9am class!",
    lastMessageTime: "2 min ago",
    unread: true,
    unreadCount: 2,
    archived: false,
    assignedTo: null,
  },
  {
    id: "2",
    memberId: "m2",
    memberName: "James Liu",
    memberPhone: "+1 (415) 555-0102",
    memberEmail: "james@example.com",
    avatar: "",
    lastMessage: "Is there still space in the evening vinyasa?",
    lastMessageTime: "15 min ago",
    unread: true,
    unreadCount: 1,
    archived: false,
    assignedTo: "me",
  },
  {
    id: "3",
    memberId: "m3",
    memberName: "Emma Wilson",
    memberPhone: "+1 (415) 555-0103",
    memberEmail: "emma@example.com",
    avatar: "",
    lastMessage: "Got it, I'll bring my own mat then",
    lastMessageTime: "1 hr ago",
    unread: false,
    unreadCount: 0,
    archived: false,
    assignedTo: "me",
  },
  {
    id: "4",
    memberId: "m4",
    memberName: "Michael Park",
    memberPhone: "+1 (415) 555-0104",
    memberEmail: "michael@example.com",
    avatar: "",
    lastMessage: "Thank you for the reminder!",
    lastMessageTime: "3 hrs ago",
    unread: false,
    unreadCount: 0,
    archived: false,
    assignedTo: null,
  },
  {
    id: "5",
    memberId: "m5",
    memberName: "Ava Kim",
    memberPhone: "+1 (415) 555-0105",
    memberEmail: "ava@example.com",
    avatar: "",
    lastMessage: "Can I reschedule my private session?",
    lastMessageTime: "5 hrs ago",
    unread: false,
    unreadCount: 0,
    archived: false,
    assignedTo: null,
  },
];

const mockMessages: Record<string, Array<{
  id: string;
  content: string;
  timestamp: string;
  isOutbound: boolean;
  status?: "sent" | "delivered" | "read";
}>> = {
  "1": [
    { id: "m1", content: "Hi Sarah! This is a reminder that you have Morning Vinyasa tomorrow at 9:00 AM.", timestamp: "10:30 AM", isOutbound: true, status: "read" },
    { id: "m2", content: "Thanks for the reminder!", timestamp: "10:45 AM", isOutbound: false },
    { id: "m3", content: "You're welcome! Let us know if you need anything.", timestamp: "10:46 AM", isOutbound: true, status: "delivered" },
    { id: "m4", content: "Actually, is there mat rental available?", timestamp: "11:00 AM", isOutbound: false },
    { id: "m5", content: "Yes! We have mats available for $2 rental. Just ask at the front desk.", timestamp: "11:02 AM", isOutbound: true, status: "read" },
    { id: "m6", content: "Thanks! See you tomorrow for the 9am class!", timestamp: "11:05 AM", isOutbound: false },
  ],
  "2": [
    { id: "m1", content: "Hi James! Your class pack is running low - you have 2 classes remaining.", timestamp: "Yesterday", isOutbound: true, status: "read" },
    { id: "m2", content: "Thanks for letting me know. I'll renew soon.", timestamp: "Yesterday", isOutbound: false },
    { id: "m3", content: "Is there still space in the evening vinyasa?", timestamp: "2:30 PM", isOutbound: false },
  ],
  "3": [
    { id: "m1", content: "Hi Emma! Quick note - we're at capacity for mat rentals tomorrow. Please bring your own if possible.", timestamp: "12:00 PM", isOutbound: true, status: "read" },
    { id: "m2", content: "Oh okay, no problem!", timestamp: "12:15 PM", isOutbound: false },
    { id: "m3", content: "Got it, I'll bring my own mat then", timestamp: "12:16 PM", isOutbound: false },
  ],
};

const quickReplies = [
  { id: "1", label: "Confirm booking", text: "Your booking is confirmed! See you soon." },
  { id: "2", label: "Class full", text: "Unfortunately this class is now full. Would you like to join the waitlist?" },
  { id: "3", label: "Running late", text: "No problem! The class will start on time but you're welcome to join when you arrive." },
  { id: "4", label: "Cancellation confirmed", text: "Your cancellation has been processed. We hope to see you at another class soon!" },
  { id: "5", label: "Pack renewal", text: "Your class pack is running low. Visit our website or the front desk to purchase more classes." },
];

export default function SmsInbox() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "assigned">("all");
  const [selectedConversation, setSelectedConversation] = useState<string | null>("1");
  const [messageInput, setMessageInput] = useState("");
  const [conversations, setConversations] = useState(mockConversations);

  const filteredConversations = conversations.filter((conv) => {
    if (conv.archived) return false;
    if (filter === "unread" && !conv.unread) return false;
    if (filter === "assigned" && conv.assignedTo !== "me") return false;
    if (searchQuery && !conv.memberName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selectedConv = conversations.find((c) => c.id === selectedConversation);
  const messages = selectedConversation ? mockMessages[selectedConversation] || [] : [];

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

    toast({
      title: "Message sent",
      description: "Your message has been sent successfully.",
    });
    setMessageInput("");
  };

  const handleQuickReply = (text: string) => {
    setMessageInput(text);
  };

  const handleMarkAsRead = (convId: string) => {
    setConversations((convs) =>
      convs.map((c) => (c.id === convId ? { ...c, unread: false, unreadCount: 0 } : c))
    );
    toast({
      title: "Marked as read",
      description: "Conversation marked as read.",
    });
  };

  const handleArchive = (convId: string) => {
    setConversations((convs) =>
      convs.map((c) => (c.id === convId ? { ...c, archived: true } : c))
    );
    if (selectedConversation === convId) {
      setSelectedConversation(null);
    }
    toast({
      title: "Conversation archived",
      description: "The conversation has been archived.",
    });
  };

  const totalUnread = conversations.filter((c) => c.unread && !c.archived).length;

  return (
    <ManageLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              SMS Inbox
              {totalUnread > 0 && (
                <Badge className="bg-primary text-primary-foreground">
                  {totalUnread} unread
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Two-way SMS messaging with your members
            </p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[500px]">
          {/* Left Sidebar - Conversation List */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filter */}
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All conversations</SelectItem>
                  <SelectItem value="unread">Unread only</SelectItem>
                  <SelectItem value="assigned">Assigned to me</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-1 p-2">
                  {filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No conversations found
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={cn(
                          "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors",
                          selectedConversation === conv.id
                            ? "bg-primary/10"
                            : "hover:bg-secondary"
                        )}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conv.avatar} />
                            <AvatarFallback className="bg-accent-lilac text-foreground text-sm">
                              {conv.memberName.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          {conv.unread && (
                            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn(
                              "text-sm truncate",
                              conv.unread ? "font-semibold" : "font-medium"
                            )}>
                              {conv.memberName}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {conv.lastMessageTime}
                            </span>
                          </div>
                          <p className={cn(
                            "text-xs truncate mt-0.5",
                            conv.unread ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {conv.lastMessage}
                          </p>
                          {conv.assignedTo === "me" && (
                            <Badge variant="outline" className="text-[10px] mt-1 h-5">
                              Assigned to me
                            </Badge>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-primary text-primary-foreground h-5 min-w-5 justify-center">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right Panel - Message Thread */}
          <Card className="flex flex-col">
            {selectedConv ? (
              <>
                {/* Conversation Header */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConv.avatar} />
                        <AvatarFallback className="bg-accent-lilac text-foreground">
                          {selectedConv.memberName.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{selectedConv.memberName}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {selectedConv.memberPhone}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/manage/members/${selectedConv.memberId}`}>
                          <User className="h-4 w-4 mr-1" />
                          Profile
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleMarkAsRead(selectedConv.id)}>
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Mark as read
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleArchive(selectedConv.id)}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive conversation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                {/* Message Thread */}
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex",
                            message.isOutbound ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-4 py-2",
                              message.isOutbound
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-secondary rounded-bl-md"
                            )}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className={cn(
                              "flex items-center gap-1 mt-1",
                              message.isOutbound ? "justify-end" : "justify-start"
                            )}>
                              <span className={cn(
                                "text-[10px]",
                                message.isOutbound ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}>
                                {message.timestamp}
                              </span>
                              {message.isOutbound && message.status && (
                                <CheckCheck className={cn(
                                  "h-3 w-3",
                                  message.status === "read"
                                    ? "text-primary-foreground"
                                    : "text-primary-foreground/50"
                                )} />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Compose Area */}
                <div className="border-t p-4 space-y-3">
                  {/* Quick Replies */}
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Quick replies
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-64">
                        {quickReplies.map((reply) => (
                          <DropdownMenuItem
                            key={reply.id}
                            onClick={() => handleQuickReply(reply.text)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{reply.label}</span>
                              <span className="text-xs text-muted-foreground truncate">
                                {reply.text}
                              </span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <span className="text-xs text-muted-foreground">
                      Press Enter to send, Shift+Enter for new line
                    </span>
                  </div>

                  {/* Message Input */}
                  <div className="flex items-end gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      rows={2}
                      className="resize-none"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Empty State
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Select a conversation</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose a conversation from the list to view messages
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </ManageLayout>
  );
}
