# Video Compression Feature

## Current Status
Video uploads are currently limited to 100MB per file without compression.

## iPhone Video Considerations
- iPhones record in HEVC (H.265) format which is already highly compressed
- Typical iPhone videos: 1-5 minutes at 1080p/60fps = 50-200MB
- 4K videos can be much larger (400MB+ for a few minutes)

## Recommended Implementation Options

### Option 1: Client-Side Compression (Browser-Based)
**Pros:**
- No server infrastructure needed
- Reduces upload bandwidth

**Cons:**
- Slow on user's device (can take minutes for large files)
- May drain battery on mobile devices
- Limited browser support for advanced codecs

**Libraries:**
- `ffmpeg.wasm` - Full FFmpeg in browser (large bundle ~30MB)
- `browser-video-compressor` - Lighter weight option

**Implementation:**
```javascript
import { VideoCompressor } from 'browser-video-compressor';

const compressor = new VideoCompressor();
const compressedBlob = await compressor.compress(file, {
  targetHeight: 1080,
  quality: 0.8,
  bitrate: 5000000 // 5 Mbps
});
```

### Option 2: Server-Side Compression (Recommended)
**Pros:**
- Fast, doesn't block user
- Professional quality control
- Can process in background

**Cons:**
- Requires server infrastructure (FFmpeg)
- Additional costs

**Services:**
- AWS Lambda + FFmpeg Layer
- Cloudflare Stream (automatic compression)
- Azure Media Services
- Self-hosted FFmpeg worker

**Implementation Flow:**
1. User uploads original file to Vercel Blob
2. Trigger serverless function to compress
3. Function downloads, compresses (1080p, 5Mbps H.264)
4. Uploads compressed version, updates database
5. Original can be kept or deleted

### Option 3: Increase Limits + User Education
**Simplest approach:**
- Increase limit to 200-300MB for videos
- Add UI message: "For best results, record videos at 1080p on your iPhone"
- Show file size warning before upload

## Recommendation
Start with **Option 3** (increased limits), then implement **Option 2** (server-side) when budget allows.

Current 100MB limit is sufficient for:
- Most 1080p videos under 2 minutes
- All photos
- Professional content

## Cost Considerations
- Vercel Blob storage: ~$0.15/GB/month
- Typical video after compression: 50-100MB
- 1000 videos = 50-100GB = $7.50-15/month storage
- Bandwidth: $0.15/GB
