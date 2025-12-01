import { sql } from "@vercel/postgres";
import {
  User,
  SafeUser,
  CreateUserInput,
  MediaAsset,
  MediaAssetWithTags,
  MediaAssetFull,
  CreateMediaAssetInput,
  MediaFilterParams,
} from "@/types/media";
import type { User as UserType } from "@/types/user";

// ============================================================================
// User Queries
// ============================================================================

export async function createUser(
  input: CreateUserInput
): Promise<SafeUser> {
  const { email, name, password, role = "sales" } = input;

  const result = await sql`
    INSERT INTO users (email, name, password_hash, role)
    VALUES (${email}, ${name}, ${password}, ${role})
    RETURNING id, email, name, role, created_at
  `;

  return result.rows[0] as SafeUser;
}

export async function getUserByEmail(email: string): Promise<UserType | null> {
  const result = await sql`
    SELECT id, email, name, password_hash, role, created_at
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;

  return result.rows[0] as UserType | null;
}

export async function getUserById(id: string): Promise<SafeUser | null> {
  const result = await sql`
    SELECT id, email, name, role, created_at
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `;

  return result.rows[0] as SafeUser | null;
}

// ============================================================================
// Media Asset Queries
// ============================================================================

export async function createMediaAsset(
  input: CreateMediaAssetInput
): Promise<MediaAsset> {
  const {
    owner_user_id,
    blob_url,
    caption = null,
    client_name = null,
    mime_type = null,
    file_size = null,
  } = input;

  const result = await sql`
    INSERT INTO media_assets (
      owner_user_id, blob_url, caption, client_name, mime_type, file_size
    )
    VALUES (
      ${owner_user_id}, ${blob_url}, ${caption}, ${client_name},
      ${mime_type}, ${file_size}
    )
    RETURNING *
  `;

  return result.rows[0] as MediaAsset;
}

export async function getMediaAssetById(
  id: string
): Promise<MediaAssetFull | null> {
  const result = await sql`
    SELECT
      m.*,
      u.name as owner_name,
      u.email as owner_email,
      COALESCE(
        ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL),
        ARRAY[]::TEXT[]
      ) as tags
    FROM media_assets m
    LEFT JOIN users u ON m.owner_user_id = u.id
    LEFT JOIN media_tags mt ON m.id = mt.media_id
    LEFT JOIN tags t ON mt.tag_id = t.id
    WHERE m.id = ${id}
    GROUP BY m.id, u.name, u.email
  `;

  return result.rows[0] as MediaAssetFull | null;
}

export async function getMediaAssets(
  params: MediaFilterParams
): Promise<MediaAssetFull[]> {
  const {
    owner_user_id,
    client_name,
    tag,
    search,
    from,
    to,
    limit = 50,
    offset = 0,
  } = params;

  // Build dynamic WHERE conditions
  let conditions: string[] = [];
  let values: any[] = [];
  let valueIndex = 1;

  if (owner_user_id) {
    conditions.push(`m.owner_user_id = $${valueIndex++}`);
    values.push(owner_user_id);
  }

  if (client_name) {
    conditions.push(`m.client_name ILIKE $${valueIndex++}`);
    values.push(`%${client_name}%`);
  }

  if (search) {
    conditions.push(
      `(m.caption ILIKE $${valueIndex} OR m.client_name ILIKE $${valueIndex})`
    );
    values.push(`%${search}%`);
    valueIndex++;
  }

  if (from) {
    conditions.push(`m.created_at >= $${valueIndex++}`);
    values.push(from);
  }

  if (to) {
    conditions.push(`m.created_at <= $${valueIndex++}`);
    values.push(to);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // If filtering by tag, we need a special join
  let tagJoin = "";
  if (tag) {
    tagJoin = `
      INNER JOIN media_tags mt_filter ON m.id = mt_filter.media_id
      INNER JOIN tags t_filter ON mt_filter.tag_id = t_filter.id AND t_filter.name = $${valueIndex++}
    `;
    values.push(tag);
  }

  values.push(limit, offset);

  const query = `
    SELECT
      m.*,
      u.name as owner_name,
      u.email as owner_email,
      COALESCE(
        ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL),
        ARRAY[]::TEXT[]
      ) as tags
    FROM media_assets m
    LEFT JOIN users u ON m.owner_user_id = u.id
    LEFT JOIN media_tags mt ON m.id = mt.media_id
    LEFT JOIN tags t ON mt.tag_id = t.id
    ${tagJoin}
    ${whereClause}
    GROUP BY m.id, u.name, u.email
    ORDER BY m.created_at DESC
    LIMIT $${valueIndex++} OFFSET $${valueIndex++}
  `;

  const result = await sql.query(query, values);
  return result.rows as MediaAssetFull[];
}

export async function deleteMediaAsset(id: string): Promise<void> {
  await sql`
    DELETE FROM media_assets
    WHERE id = ${id}
  `;
}

// ============================================================================
// Tag Queries
// ============================================================================

export async function getOrCreateTag(name: string): Promise<number> {
  // Try to get existing tag
  const existing = await sql`
    SELECT id FROM tags WHERE name = ${name} LIMIT 1
  `;

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  // Create new tag
  const result = await sql`
    INSERT INTO tags (name)
    VALUES (${name})
    RETURNING id
  `;

  return result.rows[0].id;
}

export async function addTagsToMedia(
  mediaId: string,
  tagNames: string[]
): Promise<void> {
  for (const tagName of tagNames) {
    const tagId = await getOrCreateTag(tagName.trim().toLowerCase());

    // Insert into media_tags (ignore if already exists)
    await sql`
      INSERT INTO media_tags (media_id, tag_id)
      VALUES (${mediaId}, ${tagId})
      ON CONFLICT (media_id, tag_id) DO NOTHING
    `;
  }
}

export async function getAllTags(): Promise<Array<{ id: number; name: string }>> {
  const result = await sql`
    SELECT id, name FROM tags ORDER BY name ASC
  `;

  return result.rows as Array<{ id: number; name: string }>;
}

export async function getTagsForMedia(mediaId: string): Promise<string[]> {
  const result = await sql`
    SELECT t.name
    FROM tags t
    INNER JOIN media_tags mt ON t.id = mt.tag_id
    WHERE mt.media_id = ${mediaId}
    ORDER BY t.name ASC
  `;

  return result.rows.map((row) => row.name);
}
