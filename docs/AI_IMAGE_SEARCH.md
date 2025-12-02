# AI-Powered Image Search

## Overview
Enable natural language search that understands image content - find images by what's IN them, not just by tags or captions.

**Example searches:**
- "beach sunset"
- "red car"
- "people laughing"
- "product shots on white background"

## How It Works

AI image search requires **backend processing** - there's no frontend-only solution. The basic flow:

1. **Upload Time**: Image sent to AI service for analysis
2. **Storage**: AI-generated tags/descriptions saved to database
3. **Search Time**: Query includes AI-generated metadata

## Recommended Approach: Cloud AI Services

### Best Option: OpenAI Vision API (GPT-4 Vision)

**Why this option:**
- ✅ Easy integration with existing stack
- ✅ Works on Vercel serverless
- ✅ No additional databases needed
- ✅ Highly accurate
- ✅ Reasonable cost (~$0.01/image)
- ✅ Can generate structured metadata

**Pricing:** $0.00765 per image (one-time at upload)
- 100 uploads/month = $0.77
- 500 uploads/month = $3.83
- 1,000 uploads/month = $7.65

### Implementation Steps

#### 1. Database Schema Changes

Add columns to `media_assets` table:

```sql
ALTER TABLE media_assets ADD COLUMN ai_tags TEXT[];
ALTER TABLE media_assets ADD COLUMN ai_description TEXT;
ALTER TABLE media_assets ADD COLUMN ai_objects TEXT[];
ALTER TABLE media_assets ADD COLUMN ai_colors TEXT[];
ALTER TABLE media_assets ADD COLUMN ai_setting TEXT;
ALTER TABLE media_assets ADD COLUMN ai_analyzed_at TIMESTAMP;
```

#### 2. Install OpenAI SDK

```bash
npm install openai
```

#### 3. Add Environment Variable

```.env.local
OPENAI_API_KEY=sk-...
```

#### 4. Create AI Analysis Function

```typescript
// /lib/ai/analyzeImage.ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeImage(imageUrl: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this image and provide:
- Main objects/subjects (comma-separated)
- Primary colors (comma-separated)
- Setting/location description
- Overall description (one sentence)

Format as JSON: {
  "objects": ["object1", "object2"],
  "colors": ["color1", "color2"],
  "setting": "setting description",
  "description": "full description"
}`
          },
          {
            type: "image_url",
            image_url: { url: imageUrl }
          }
        ]
      }
    ],
    max_tokens: 300
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content);
}
```

#### 5. Update Upload API Route

```typescript
// /app/api/upload/route.ts
import { analyzeImage } from "@/lib/ai/analyzeImage";

export async function POST(req: NextRequest) {
  // ... existing Blob upload code ...

  // Analyze image if it's not a video
  let aiData = null;
  if (blob.contentType?.startsWith("image/")) {
    try {
      aiData = await analyzeImage(blob.url);
    } catch (error) {
      console.error("AI analysis failed:", error);
      // Continue without AI data - non-blocking
    }
  }

  // Update media record
  await sql`
    UPDATE media_assets
    SET
      ai_tags = ${aiData?.objects || []},
      ai_description = ${aiData?.description || null},
      ai_objects = ${aiData?.objects || []},
      ai_colors = ${aiData?.colors || []},
      ai_setting = ${aiData?.setting || null},
      ai_analyzed_at = NOW()
    WHERE id = ${mediaId}
  `;

  return NextResponse.json({ success: true, ...blob });
}
```

#### 6. Update Search Query

```typescript
// /lib/db/queries.ts
export async function searchMedia(searchTerm: string) {
  const results = await sql`
    SELECT *
    FROM media_assets
    WHERE
      caption ILIKE ${`%${searchTerm}%`}
      OR ai_description ILIKE ${`%${searchTerm}%`}
      OR ${searchTerm} = ANY(tags)
      OR ${searchTerm} = ANY(ai_tags)
      OR ${searchTerm} = ANY(ai_objects)
      OR ${searchTerm} = ANY(ai_colors)
      OR ai_setting ILIKE ${`%${searchTerm}%`}
    ORDER BY created_at DESC
  `;

  return results.rows;
}
```

#### 7. UI Enhancements

Show AI-detected tags with a badge:

```tsx
// In MediaCard or MediaDetailModal
{media.ai_tags && media.ai_tags.length > 0 && (
  <div className="flex flex-wrap gap-1">
    {media.ai_tags.map((tag) => (
      <Badge key={tag} variant="ai">
        <svg className="w-3 h-3 mr-1">
          {/* AI sparkle icon */}
        </svg>
        {tag}
      </Badge>
    ))}
  </div>
)}
```

## Alternative: Embedding-Based Search (Advanced)

For semantic similarity search and "find similar images":

### Architecture

1. **Generate Embeddings**: Convert images to vectors using CLIP
2. **Vector Database**: Store in Pinecone, Weaviate, or Qdrant
3. **Semantic Search**: Query by similarity

### Services
- **OpenAI CLIP** - Image embeddings
- **Pinecone** - Vector database ($70/month after free tier)
- **Cohere** - Embedding API

### Example Code

```typescript
import { OpenAI } from "openai";
import { PineconeClient } from "@pinecone-database/pinecone";

// Generate embedding
const embedding = await openai.embeddings.create({
  model: "clip-vit-base-patch32",
  input: imageUrl
});

// Store in Pinecone
await pinecone.upsert({
  id: mediaId,
  values: embedding.data[0].embedding,
  metadata: { url: imageUrl, caption: "..." }
});

// Search by natural language
const searchEmbedding = await openai.embeddings.create({
  model: "clip-vit-base-patch32",
  input: "beach sunset with palm trees"
});

const results = await pinecone.query({
  vector: searchEmbedding.data[0].embedding,
  topK: 10,
  includeMetadata: true
});
```

### When to Use Embeddings

✅ Visual similarity search ("find similar images")
✅ Semantic understanding ("happy moments", not just "smile")
✅ Large libraries (>10,000 images)

❌ Additional infrastructure cost
❌ More complex setup
❌ Requires vector database

## Hybrid Approach (Recommended)

### Phase 1: Simple AI Tagging
- Use OpenAI Vision for tag generation
- Store in existing PostgreSQL
- Low cost, immediate value

### Phase 2: Add Embeddings (If Needed)
- Add vector search for visual similarity
- Integrate Pinecone for advanced queries
- Upgrade when library grows large

## Cost Comparison

| Service | Cost | When to Use |
|---------|------|-------------|
| OpenAI Vision | $0.01/image | Start here - best value |
| Google Cloud Vision | $1.50/1000 images | Budget-conscious |
| Amazon Rekognition | $1.00/1000 images | AWS ecosystem |
| Pinecone (embeddings) | $70/month | Large libraries, similarity search |

## Re-Analyzing Existing Images

Add a background job or admin button to analyze existing images:

```typescript
// Admin action
async function reanalyzeAllMedia() {
  const media = await sql`SELECT id, blob_url FROM media_assets WHERE ai_analyzed_at IS NULL`;

  for (const item of media.rows) {
    const aiData = await analyzeImage(item.blob_url);
    await sql`
      UPDATE media_assets
      SET
        ai_tags = ${aiData.objects},
        ai_description = ${aiData.description},
        ai_analyzed_at = NOW()
      WHERE id = ${item.id}
    `;
  }
}
```

## Performance Considerations

- **Upload Time**: Adds 1-3 seconds per image
- **Solution**: Run AI analysis async after upload completes
- **User sees**: Upload succeeds immediately, AI tags appear moments later

```typescript
// Non-blocking approach
await uploadToBlob();
await createMediaRecord();

// Return success immediately
response.json({ success: true });

// Analyze in background (use queue in production)
analyzeImage(url).then(updateRecord);
```

## Testing

```bash
# Test AI analysis
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://..."}'

# Expected response
{
  "objects": ["car", "road", "trees"],
  "colors": ["red", "green", "blue"],
  "setting": "highway surrounded by forest",
  "description": "A red car driving on a highway through a forest"
}
```

## Error Handling

```typescript
try {
  aiData = await analyzeImage(blob.url);
} catch (error) {
  if (error.code === 'rate_limit_exceeded') {
    // Queue for retry
    await addToRetryQueue(mediaId);
  } else {
    // Log but don't block upload
    console.error("AI analysis failed:", error);
  }
  // Continue without AI data
}
```

## Privacy Considerations

- Images sent to OpenAI for analysis
- Review OpenAI's data usage policy
- Consider self-hosted models for sensitive content
- Option: Allow users to opt-out of AI analysis

## Next Steps

1. Set up OpenAI API key
2. Run database migrations
3. Update upload API route
4. Test with sample images
5. Update search queries
6. Add UI badges for AI tags
7. (Optional) Add re-analyze button for existing images

---

**Estimated Implementation Time:** 2-3 hours
**Cost:** $0.01 per image (one-time)
**Complexity:** Low-Medium
**Recommendation:** Start with OpenAI Vision, add embeddings later if needed
