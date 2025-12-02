# Testing Guide - Taylor Products Digital Asset Management

## ✅ All Features Completed

### Phase 1-4 Complete:
1. ✅ Admin-only invitations
2. ✅ Rebranding
3. ✅ Global folders
4. ✅ Starred media
5. ✅ Bulk uploads with drag-and-drop
6. ✅ Sort by date
7. ✅ USA date formatting
8. ✅ iPhone file support (HEIC, MOV)
9. ✅ Enhanced error messages
10. ✅ Drag-and-drop organization

---

## Test Plan

### 1. Authentication & Invitations

**Admin Login:**
- Go to http://localhost:3000/login
- Email: matthew@adventii.com
- Password: Dunkin3!@
- ✅ Should log in successfully

**Create Invitation:**
- Go to Admin Dashboard → "Invite Users" tab
- Enter email and select role (admin or sales)
- Click "Send Invitation"
- ✅ Should see invitation in list with "Copy Link" button
- ✅ Copy the invite link

**Register with Invitation:**
- Open invite link in incognito/private window
- Fill out registration form
- ✅ Should create account and log in
- ✅ Public /register page should show "invite-only" message

### 2. Bulk File Upload

**Test Bulk Upload:**
- Log in as admin
- Click "Upload Media"
- ✅ See iPhone Recording Tips section (collapsible)
- Drag multiple files (or click to select):
  - Mix of photos (JPEG, PNG, HEIC)
  - Mix of videos (MOV, MP4)
  - Try files over 200MB (should show error)
  - Try files between 150-200MB (should show warning with time estimate)
  - Try invalid file type (should show error)
- ✅ Should see all files listed
- ✅ Valid files show green checkmark
- ✅ Large video files (>150MB) show upload time estimate
- ✅ Invalid files show red X with clear error message
- Enter caption, client name, tags
- Select a folder (optional)
- Click "Upload X Files"
- ✅ Should see progress bar for each file
- ✅ Should see percentage counter
- ✅ Files upload sequentially
- ✅ Success count increments (e.g., "Uploading... (3/5)")

**Error Handling:**
- Try uploading 250MB file
- ✅ Should show "File size exceeds 200MB limit"
- Try uploading 180MB video file
- ✅ Should show warning: "⚠️ Large file - may take 90-180 seconds to upload"
- Try uploading .txt file
- ✅ Should show "Invalid file format. Supported: Images (JPEG, PNG, GIF, WebP, HEIC) and Videos (MP4, MOV, M4V)"

### 3. Folders System

**Create Folders (Admin):**
- Go to Admin Dashboard → "Folders" tab
- Click "Create Folder"
- Name: "Logos", Description: "Company logos and branding"
- ✅ Should create successfully
- Create 2-3 more folders

**View Folders (All Users):**
- Log in as sales user
- Go to Dashboard
- ✅ Should see folder sidebar with all folders
- ✅ Each folder shows media count
- Click "All Media"
- ✅ Shows all media
- Click a folder name
- ✅ Filters to show only that folder's media

**Upload to Folder:**
- Click "Upload Media"
- Select files
- Choose a folder from dropdown
- Upload
- ✅ Media should appear in that folder

### 4. Starred/Pinned Media

**Star Media (Admin Only):**
- Log in as admin
- Click on any media card
- Modal opens
- ✅ See star button next to close button (yellow if starred, gray if not)
- Click star button
- ✅ Star toggles on/off
- Close modal
- ✅ Starred media shows gold star icon in top-right corner
- ✅ Starred media appears in "Pinned Assets" section at top

**View as Sales User:**
- Log in as sales user
- ✅ Should see "Pinned Assets" section
- ✅ Should see starred media first
- Click on starred media
- ✅ Modal opens but no star button (sales can't star)

### 5. Drag-and-Drop Organization (Admin Only)

**Drag Media to Folders:**
- Log in as admin
- Go to Admin Dashboard → "All Media" tab
- ✅ Media cards show cursor:grab on hover
- Click and hold a media card
- ✅ Card becomes semi-transparent
- ✅ Drag overlay appears with card preview
- Drag over a folder in sidebar
- ✅ Folder highlights with blue border
- Drop on folder
- ✅ Media moves to that folder
- ✅ Folder count updates
- ✅ Media disappears from current view if filtered

**Drag to "All Media":**
- Filter by a specific folder
- Drag a media card to "All Media" folder
- ✅ Removes media from folder (sets folder_id to null)

**Not Available for Sales:**
- Log in as sales user
- ✅ Can click media cards to view
- ✅ Cannot drag media (no cursor:grab)

### 6. Sorting

**Sort Controls:**
- Go to Dashboard or Admin → All Media
- ✅ See "Sort by:" dropdown on right side
- Test each option:
  - "Newest First" - ✅ Most recent uploads first
  - "Oldest First" - ✅ Oldest uploads first
  - "Caption (A-Z)" - ✅ Alphabetical by caption
  - "Caption (Z-A)" - ✅ Reverse alphabetical
- Click toggle button next to dropdown
- ✅ Reverses sort order

**Starred Always First:**
- Sort by "Oldest First"
- ✅ Starred media still appears in "Pinned Assets" section first
- ✅ Regular media sorted by oldest first below

### 7. Date Formatting

**USA Date Format:**
- View any media card
- ✅ Date shows as "Dec 2, 2025" (month abbreviated, day, year)
- Click to open media detail modal
- ✅ Date shows as "December 2, 2025" (month full name)
- ✅ Time shows as "3:45 PM" (12-hour format with AM/PM)

### 8. iPhone File Support

**Upload from iPhone:**
- From iPhone, take photo (saves as HEIC)
- Record video (saves as MOV)
- Go to site on iPhone or transfer files to computer
- Upload both files
- ✅ HEIC photo uploads successfully
- ✅ MOV video uploads successfully
- ✅ Files display correctly in grid
- ✅ Can view both in detail modal

### 9. Storage Stats (Admin Dashboard)

**View Storage Stats:**
- Log in as admin
- Go to Admin Dashboard → "All Media" tab
- ✅ See "Storage Usage" card below the "Showing X media assets" count
- ✅ Shows 4 metrics in grid:
  - Total Files (count with commas)
  - Total Size (GB if >1GB, MB if <1GB)
  - Avg File Size (MB)
  - Est. Monthly Cost (based on $0.15/GB/month)
- ✅ Cost breakdown displayed: "Storage ~$0.15/GB/month • Bandwidth ~$0.15/GB"

**Warning Triggers:**
- Upload files until total storage exceeds 10GB
- ✅ Should see amber warning: "⚠️ You're using X.X GB of storage. Consider asking users to record at 1080p to reduce file sizes."
- Upload large files until average exceeds 100MB
- ✅ Should see amber warning: "⚠️ Average file size is X MB. This suggests users may be uploading 4K videos or large images."

**Sales User (Should NOT See):**
- Log in as sales user
- Go to Dashboard
- ✅ Storage stats NOT visible (admin-only feature)

---

## Known Limitations & Future Enhancements

### Video Compression
**Status:** Not implemented (by design)
- Current limit: 200MB per file (increased from 100MB)
- Recommendation: See `/docs/VIDEO_COMPRESSION.md` for implementation options
- Current approach: Users should record at 1080p on iPhone to keep files under limit
- Smart warnings show upload time estimates for large files (>150MB)

### Network Issues
- If upload fails mid-way, file status shows red error
- User can re-select files and retry
- No automatic retry (prevents duplicate uploads)

### Browser Compatibility
- Tested on: Chrome, Safari, Firefox
- Drag-and-drop works on desktop browsers
- Mobile: Upload works, but drag-and-drop disabled (touch not ideal for this)

---

## Performance Testing

### Large Bulk Upload:
- Test with 10 files (~50MB each)
- ✅ Should complete in 2-5 minutes depending on connection
- ✅ UI remains responsive
- ✅ Can cancel and close form during upload

### Large Media Library:
- Test with 100+ media assets
- ✅ Page loads quickly
- ✅ Infinite scroll or pagination may be needed in future

---

## Bug Reporting

If you find any issues:
1. Note which feature/step failed
2. Check browser console for errors (F12)
3. Note the error message shown to user
4. Try to reproduce the issue
5. Document steps to reproduce

## Success Criteria

✅ All test scenarios pass
✅ No console errors
✅ Clear, user-friendly error messages
✅ Fast, responsive UI
✅ Works on desktop browsers (Chrome, Safari, Firefox)
✅ iPhone files (HEIC, MOV) upload successfully

---

## 9. Image Editing (Admin Only)

**Open Editor:**
- Log in as admin
- Click any image card (not video)
- Modal opens
- ✅ See "Edit Image" button
- Click "Edit Image"
- ✅ Fullscreen editor opens
- ✅ Image loads in crop area

**Crop Image:**
- Drag the image to reposition
- ✅ Image moves smoothly
- Drag crop corners
- ✅ Crop area adjusts
- ✅ Preview updates in real-time

**Zoom:**
- Use zoom slider (1x to 3x)
- ✅ Image zooms in/out
- OR scroll with mouse wheel
- ✅ Zoom responds to scroll
- On mobile: pinch to zoom
- ✅ Pinch gesture works

**Rotate:**
- Click "90° Right" button
- ✅ Image rotates 90° clockwise
- Click "90° Left" button
- ✅ Image rotates 90° counterclockwise
- Click multiple times
- ✅ Can rotate full 360° and beyond
- Click "Reset Rotation"
- ✅ Returns to 0° (original orientation)

**Save Edited Image:**
- Adjust crop/zoom/rotation as desired
- Click "Save Edited Image"
- ✅ Button shows "Saving..."
- ✅ Editor closes after 1-4 seconds
- ✅ Modal closes
- Refresh page
- ✅ Edited image appears in place of original
- ✅ File size updated if cropped smaller

**Cancel Editing:**
- Click "Edit Image"
- Make changes (crop, rotate, etc.)
- Click "Cancel" or close (X) button
- ✅ Editor closes without saving
- ✅ Original image unchanged

**Sales User (Should NOT See):**
- Log in as sales user
- Click any image
- ✅ "Edit Image" button NOT visible
- ✅ Only admin can edit

**Video Files:**
- Log in as admin
- Click a video file
- ✅ "Edit Image" button NOT visible
- ✅ Only works on images

**Error Handling:**
- Start editing an image
- Turn off internet
- Make changes and click Save
- ✅ Should show error alert
- ✅ Editor stays open (can retry)

**Mobile Testing:**
- Open on phone/tablet
- Click image, then "Edit Image"
- ✅ Editor works in portrait/landscape
- ✅ Touch gestures work (drag, pinch)
- ✅ Buttons are touch-friendly
- ✅ Save works same as desktop

**Performance:**
- Edit a large image (5-10MB)
- ✅ Editor loads within 1-2 seconds
- ✅ Crop/zoom/rotate feels smooth
- ✅ Save completes within 2-4 seconds

---

## Edge Cases

**Empty Crop:**
- Adjust crop to minimum size
- Try to save
- ✅ Should still save (minimum ~10x10px)

**Multiple Rotations:**
- Rotate left 4 times (360°)
- ✅ Returns to original orientation
- ✅ No image degradation

**Large Zoom:**
- Zoom to 3x
- Crop small area
- Save
- ✅ Creates small, zoomed portion
- ✅ No pixelation visible

**File Format Conversion:**
- Edit PNG image
- Save
- ✅ Converts to JPEG
- ✅ File size usually smaller
- ✅ Quality remains high (95%)

---

