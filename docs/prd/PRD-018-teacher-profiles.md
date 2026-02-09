# PRD-018: Enhanced Teacher Profiles & Media

## Overview
**Phase:** 2
**Priority:** P1
**Status:** Planned
**Owner:** TBD
**Dependencies:** PRD-017 (Reviews)

---

## Jobs to Be Done

### Job 1: Teacher Self-Expression
**When** I want students to know who I am as a teacher,
**I want to** write my bio, upload photos/videos, and link my socials,
**So I can** build a compelling public profile that attracts students.

### Job 2: Studio Quality Control
**When** teachers update their profiles,
**I want to** approve changes before they go live,
**So I can** maintain brand consistency and quality standards.

### Job 3: Student Discovery
**When** I'm looking for the right teacher for me,
**I want to** see rich profiles with bio, teaching style, media, and reviews,
**So I can** make an informed choice about who to practice with.

---

## Features

### Teacher Bio
- Paragraph editable by teacher and studio owner/admin
- Help icon with writing suggestions:
  - "Share your yoga journey and what inspired you to teach"
  - "Describe your teaching style and what students can expect"
  - "Mention certifications, training, and specialties"
  - "Keep it personal — students want to connect with you"
- Max 1500 characters
- Studio owner can edit/override

### Profile Photo
- Teacher can upload/change their profile picture
- Supported formats: JPG, PNG, WebP (max 5MB)
- Auto-cropped to square with preview
- Studio admin approval required before going live
- Current photo remains until new one is approved

### Video Clips
- Teachers can upload short video clips (max 60 seconds, 100MB)
- Up to 3 clips per profile
- Supported: MP4, MOV, WebM
- Studio admin approval before public display
- Clips show on teacher's public profile page

### Social Media Links
- Instagram, YouTube, TikTok, Website, Spotify (for playlists)
- Teacher enters URLs, system validates format
- Studio admin approval required
- Displayed as icons on teacher's public profile

### Approval Workflow
1. Teacher submits profile change (bio, photo, video, social link)
2. Change enters "Pending Review" state
3. Studio owner/admin gets notification in inbox
4. Admin approves or rejects with optional note
5. Approved changes go live immediately
6. Rejected changes notify teacher with feedback

### Studio Owner Inbox
- New section in manage dashboard: "Pending Approvals"
- Shows all pending profile changes across teachers
- One-click approve/reject
- Batch approve for trusted teachers

---

## Implementation Status

### Existing
- [x] Teacher profile page (teach/Profile.tsx)
- [x] Teacher cards in manage/Teachers.tsx
- [x] Avatar/initials display

### Remaining
- [ ] Bio editing with help suggestions tooltip
- [ ] Photo upload + crop component
- [ ] Video clip upload with transcoding
- [ ] Social media link management
- [ ] Approval queue in manage dashboard
- [ ] Notification when changes need review
- [ ] Public teacher profile page (student-facing)
