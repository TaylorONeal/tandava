import { useState } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Play,
  Upload,
  Search,
  Filter,
  MoreVertical,
  Clock,
  Eye,
  Star,
  Youtube,
  Video,
  Plus,
  Grid3X3,
  List,
  FolderPlus,
  Link2,
  Pencil,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

// Mock data
const MOCK_VIDEOS = [
  {
    id: '1',
    title: 'Morning Vinyasa Flow',
    instructor: 'Maya Rivers',
    duration: 3600,
    views: 1247,
    rating: 4.8,
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=225&fit=crop',
    status: 'published',
    accessType: 'members_only',
    hostingType: 'self_hosted',
    style: 'Vinyasa',
    level: 'intermediate',
    publishedAt: '2024-01-15',
  },
  {
    id: '2',
    title: 'Gentle Yin for Deep Release',
    instructor: 'Luna Fox',
    duration: 2700,
    views: 892,
    rating: 4.9,
    thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=225&fit=crop',
    status: 'published',
    accessType: 'free',
    hostingType: 'youtube',
    style: 'Yin',
    level: 'beginner',
    publishedAt: '2024-01-20',
  },
  {
    id: '3',
    title: 'Power Hour: Full Body Sculpt',
    instructor: 'Aria Swift',
    duration: 3300,
    views: 2104,
    rating: 4.7,
    thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=225&fit=crop',
    status: 'published',
    accessType: 'members_only',
    hostingType: 'self_hosted',
    style: 'Power Vinyasa',
    level: 'advanced',
    publishedAt: '2024-02-01',
  },
  {
    id: '4',
    title: 'Breathwork Fundamentals',
    instructor: 'Sage Meadow',
    duration: 1800,
    views: 456,
    rating: 4.6,
    thumbnail: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=400&h=225&fit=crop',
    status: 'draft',
    accessType: 'purchase',
    hostingType: 'vimeo',
    style: 'Breathwork',
    level: 'all_levels',
    publishedAt: null,
  },
  {
    id: '5',
    title: 'Restorative Evening Practice',
    instructor: 'Willow Grace',
    duration: 2400,
    views: 0,
    rating: null,
    thumbnail: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=400&h=225&fit=crop',
    status: 'processing',
    accessType: 'members_only',
    hostingType: 'zoom_recording',
    style: 'Restorative',
    level: 'beginner',
    publishedAt: null,
  },
];

const MOCK_SERIES = [
  {
    id: 's1',
    title: '30-Day Yoga Journey',
    videoCount: 30,
    enrollments: 234,
    completions: 89,
    coverImage: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&h=225&fit=crop',
    status: 'published',
  },
  {
    id: 's2',
    title: 'Beginner Fundamentals',
    videoCount: 8,
    enrollments: 567,
    completions: 312,
    coverImage: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=400&h=225&fit=crop',
    status: 'published',
  },
];

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'published':
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Published</Badge>;
    case 'draft':
      return <Badge variant="outline" className="text-stone-500">Draft</Badge>;
    case 'processing':
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Processing</Badge>;
    case 'archived':
      return <Badge variant="secondary">Archived</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getAccessBadge(accessType: string) {
  switch (accessType) {
    case 'free':
      return <Badge variant="outline" className="text-emerald-600 border-emerald-300">Free</Badge>;
    case 'members_only':
      return <Badge variant="outline" className="text-indigo-600 border-indigo-300">Members</Badge>;
    case 'purchase':
      return <Badge variant="outline" className="text-amber-600 border-amber-300">Purchase</Badge>;
    case 'rental':
      return <Badge variant="outline" className="text-rose-600 border-rose-300">Rental</Badge>;
    default:
      return <Badge variant="outline">{accessType}</Badge>;
  }
}

function getHostingIcon(hostingType: string) {
  switch (hostingType) {
    case 'youtube':
      return <Youtube className="w-4 h-4 text-red-500" />;
    case 'vimeo':
      return <Video className="w-4 h-4 text-sky-500" />;
    case 'zoom_recording':
      return <Video className="w-4 h-4 text-blue-500" />;
    default:
      return <Video className="w-4 h-4 text-stone-400" />;
  }
}

export default function OnDemand() {
  const [activeTab, setActiveTab] = useState('videos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState('upload');

  const filteredVideos = MOCK_VIDEOS.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || video.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <ManageLayout>
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-8 mb-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-light tracking-tight text-white mb-2">
                On-Demand Library
              </h1>
              <p className="text-stone-400 max-w-xl">
                Manage your video content, series, and collections. Upload new classes or import from YouTube, Vimeo, and Zoom.
              </p>
            </div>
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-stone-900 hover:bg-stone-100 shadow-lg">
                  <Upload className="w-4 h-4 mr-2" />
                  Add Video
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Add New Video</DialogTitle>
                  <DialogDescription>
                    Upload a video file or import from an external platform.
                  </DialogDescription>
                </DialogHeader>
                <Tabs value={uploadTab} onValueChange={setUploadTab} className="mt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="upload">Upload</TabsTrigger>
                    <TabsTrigger value="youtube">YouTube</TabsTrigger>
                    <TabsTrigger value="zoom">Zoom</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="mt-4 space-y-4">
                    <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center hover:border-stone-300 transition-colors cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-6 h-6 text-stone-500" />
                      </div>
                      <p className="text-sm text-stone-600 mb-1">
                        Drag and drop your video file here
                      </p>
                      <p className="text-xs text-stone-400">
                        MP4, MOV, or WebM up to 5GB
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input placeholder="e.g., Morning Flow" />
                      </div>
                      <div className="space-y-2">
                        <Label>Instructor</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select instructor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="maya">Maya Rivers</SelectItem>
                            <SelectItem value="luna">Luna Fox</SelectItem>
                            <SelectItem value="aria">Aria Swift</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="youtube" className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>YouTube URL</Label>
                      <Input placeholder="https://youtube.com/watch?v=..." />
                      <p className="text-xs text-stone-500">
                        Paste a public or unlisted YouTube video URL
                      </p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-sm text-amber-800">
                        <strong>Note:</strong> YouTube videos may show ads. For an ad-free experience, consider self-hosting or using Vimeo.
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="zoom" className="mt-4 space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
                      <p className="text-sm text-blue-800">
                        Import recordings from your Zoom cloud storage.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { date: 'Feb 4, 2025', title: 'Power Vinyasa - 9:00 AM', duration: '55 min' },
                        { date: 'Feb 3, 2025', title: 'Yin & Meditation - 7:00 PM', duration: '75 min' },
                        { date: 'Feb 2, 2025', title: 'Morning Flow - 7:00 AM', duration: '60 min' },
                      ].map((recording, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-stone-200 hover:border-stone-300 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
                              <Video className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{recording.title}</p>
                              <p className="text-xs text-stone-500">{recording.date} · {recording.duration}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">Import</Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                  <Button>Continue</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Total Videos', value: '47', change: '+5 this month' },
              { label: 'Total Views', value: '12.4K', change: '+18% vs last month' },
              { label: 'Watch Time', value: '892h', change: 'This month' },
              { label: 'Avg. Completion', value: '67%', change: '+3% vs last month' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur rounded-xl p-4">
                <p className="text-2xl font-light text-white">{stat.value}</p>
                <p className="text-sm text-stone-400">{stat.label}</p>
                <p className="text-xs text-stone-500 mt-1">{stat.change}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="videos" className="gap-2">
              <Play className="w-4 h-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="series" className="gap-2">
              <FolderPlus className="w-4 h-4" />
              Series
            </TabsTrigger>
            <TabsTrigger value="collections" className="gap-2">
              <Grid3X3 className="w-4 h-4" />
              Collections
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Search videos..."
                className="pl-9 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <Filter className="w-4 h-4 mr-2 text-stone-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex items-center border rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-stone-100' : 'hover:bg-stone-50'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-stone-100' : 'hover:bg-stone-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Videos Tab */}
        <TabsContent value="videos" className="mt-0">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className="group bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-lg hover:border-stone-300 transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-stone-100 overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 text-stone-900 ml-1" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs font-medium">
                      {formatDuration(video.duration)}
                    </div>

                    {/* Status Overlay */}
                    {video.status === 'processing' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                          <p className="text-white text-sm">Processing...</p>
                        </div>
                      </div>
                    )}

                    {/* Hosting Type Icon */}
                    <div className="absolute top-2 left-2">
                      {getHostingIcon(video.hostingType)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-stone-900 line-clamp-2 group-hover:text-stone-700">
                        {video.title}
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded hover:bg-stone-100 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4 text-stone-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link2 className="w-4 h-4 mr-2" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-sm text-stone-500 mb-3">{video.instructor}</p>

                    <div className="flex items-center gap-2 mb-3">
                      {getStatusBadge(video.status)}
                      {getAccessBadge(video.accessType)}
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {video.views.toLocaleString()}
                        </span>
                        {video.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {video.rating}
                          </span>
                        )}
                      </div>
                      <span>{video.style}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Card */}
              <button
                onClick={() => setIsUploadOpen(true)}
                className="aspect-video flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3 group-hover:bg-stone-200 transition-colors">
                  <Plus className="w-6 h-6 text-stone-400" />
                </div>
                <p className="text-sm text-stone-500">Add New Video</p>
              </button>
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3">Video</th>
                    <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3">Access</th>
                    <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3">Views</th>
                    <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3">Rating</th>
                    <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3">Duration</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredVideos.map((video) => (
                    <tr key={video.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1 left-1">
                              {getHostingIcon(video.hostingType)}
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-stone-900">{video.title}</p>
                            <p className="text-sm text-stone-500">{video.instructor}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(video.status)}</td>
                      <td className="px-4 py-3">{getAccessBadge(video.accessType)}</td>
                      <td className="px-4 py-3 text-sm text-stone-600">{video.views.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {video.rating ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            {video.rating}
                          </span>
                        ) : (
                          <span className="text-sm text-stone-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-600">{formatDuration(video.duration)}</td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded hover:bg-stone-100">
                              <MoreVertical className="w-4 h-4 text-stone-400" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Series Tab */}
        <TabsContent value="series" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_SERIES.map((series) => (
              <div
                key={series.id}
                className="group bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-lg hover:border-stone-300 transition-all duration-300"
              >
                <div className="relative aspect-video bg-stone-100 overflow-hidden">
                  <img
                    src={series.coverImage}
                    alt={series.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg font-medium text-white mb-1">{series.title}</h3>
                    <p className="text-sm text-white/80">{series.videoCount} videos</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between text-sm text-stone-500">
                    <span>{series.enrollments} enrolled</span>
                    <span>{Math.round((series.completions / series.enrollments) * 100)}% completion</span>
                  </div>
                  <div className="mt-3 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(series.completions / series.enrollments) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Series */}
            <button className="aspect-video flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-colors group">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3 group-hover:bg-stone-200 transition-colors">
                <FolderPlus className="w-6 h-6 text-stone-400" />
              </div>
              <p className="text-sm text-stone-500">Create Series</p>
            </button>
          </div>
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="collections" className="mt-0">
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <Grid3X3 className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-medium text-stone-900 mb-2">No Collections Yet</h3>
            <p className="text-stone-500 mb-6 max-w-sm mx-auto">
              Organize your videos into themed collections for easy discovery.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Collection
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </ManageLayout>
  );
}
