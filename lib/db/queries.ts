import { sql } from "@vercel/postgres";
import type { User, SafeUser, CreateUserInput } from "@/types/user";
import type {
  MediaAsset,
  MediaAssetWithTags,
  MediaAssetFull,
  CreateMediaAssetInput,
  MediaFilterParams,
} from "@/types/media";
import type {
  Folder,
  FolderWithCount,
  CreateFolderInput,
  UpdateFolderInput,
} from "@/types/folder";
import type {
  Invitation,
  InvitationWithInviter,
  CreateInvitationInput,
} from "@/types/invitation";

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

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await sql`
    SELECT id, email, name, password_hash, role, created_at
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;

  return result.rows[0] as User | null;
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

export async function updateUserPassword(
  userId: string,
  passwordHash: string
): Promise<void> {
  await sql`
    UPDATE users
    SET password_hash = ${passwordHash}
    WHERE id = ${userId}
  `;
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
    folder_id = null,
  } = input;

  const result = await sql`
    INSERT INTO media_assets (
      owner_user_id, blob_url, caption, client_name, mime_type, file_size, folder_id
    )
    VALUES (
      ${owner_user_id}, ${blob_url}, ${caption}, ${client_name},
      ${mime_type}, ${file_size}, ${folder_id}
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
    folder_id,
    starred_only,
    sort_by = "created_at",
    sort_order = "desc",
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

  if (folder_id) {
    conditions.push(`m.folder_id = $${valueIndex++}`);
    values.push(folder_id);
  }

  if (starred_only) {
    conditions.push(`m.is_starred = true`);
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

  // Build dynamic ORDER BY clause
  const sortColumn =
    sort_by === "file_size" ? "m.file_size" :
    sort_by === "client_name" ? "m.client_name" :
    "m.created_at";
  const sortDir = sort_order === "asc" ? "ASC" : "DESC";

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
    ORDER BY m.is_starred DESC, ${sortColumn} ${sortDir}, m.created_at DESC
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

export async function updateMediaAsset(
  id: string,
  updates: { blob_url?: string; file_size?: number }
): Promise<void> {
  const { blob_url, file_size } = updates;

  if (blob_url && file_size) {
    await sql`
      UPDATE media_assets
      SET blob_url = ${blob_url}, file_size = ${file_size}, updated_at = NOW()
      WHERE id = ${id}
    `;
  }
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

// ============================================================================
// Folder Queries
// ============================================================================

export async function createFolder(
  input: CreateFolderInput & { created_by: string }
): Promise<Folder> {
  const { name, description = null, created_by } = input;

  const result = await sql`
    INSERT INTO folders (name, description, created_by)
    VALUES (${name}, ${description}, ${created_by})
    RETURNING *
  `;

  return result.rows[0] as Folder;
}

export async function getFolders(): Promise<FolderWithCount[]> {
  const result = await sql`
    SELECT
      f.*,
      u.name as creator_name,
      u.email as creator_email,
      COUNT(m.id)::int as media_count
    FROM folders f
    LEFT JOIN users u ON f.created_by = u.id
    LEFT JOIN media_assets m ON f.id = m.folder_id
    GROUP BY f.id, u.name, u.email
    ORDER BY f.is_starred DESC, f.name ASC
  `;

  return result.rows as FolderWithCount[];
}

export async function getFolderById(id: string): Promise<Folder | null> {
  const result = await sql`
    SELECT * FROM folders WHERE id = ${id} LIMIT 1
  `;

  return result.rows[0] as Folder | null;
}

export async function updateFolder(
  id: string,
  input: UpdateFolderInput
): Promise<Folder> {
  const { name, description } = input;

  // Build dynamic SET clause
  const updates: string[] = [];
  const values: any[] = [];
  let valueIndex = 1;

  if (name !== undefined) {
    updates.push(`name = $${valueIndex++}`);
    values.push(name);
  }

  if (description !== undefined) {
    updates.push(`description = $${valueIndex++}`);
    values.push(description);
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const query = `
    UPDATE folders
    SET ${updates.join(", ")}
    WHERE id = $${valueIndex}
    RETURNING *
  `;

  const result = await sql.query(query, values);
  return result.rows[0] as Folder;
}

export async function deleteFolder(id: string): Promise<void> {
  await sql`
    DELETE FROM folders WHERE id = ${id}
  `;
}

// ============================================================================
// Invitation Queries
// ============================================================================

export async function createInvitation(
  input: CreateInvitationInput & { invited_by: string; token: string }
): Promise<Invitation> {
  const { email, token, role, invited_by, expires_at } = input;

  const result = await sql`
    INSERT INTO invitations (email, token, role, invited_by, expires_at)
    VALUES (${email}, ${token}, ${role}, ${invited_by}, ${expires_at.toISOString()})
    RETURNING *
  `;

  return result.rows[0] as Invitation;
}

export async function getInvitationByToken(
  token: string
): Promise<Invitation | null> {
  const result = await sql`
    SELECT * FROM invitations WHERE token = ${token} LIMIT 1
  `;

  return result.rows[0] as Invitation | null;
}

export async function getActiveInvitations(): Promise<InvitationWithInviter[]> {
  const result = await sql`
    SELECT
      i.*,
      u.name as inviter_name,
      u.email as inviter_email
    FROM invitations i
    LEFT JOIN users u ON i.invited_by = u.id
    WHERE i.used_at IS NULL AND i.expires_at > NOW()
    ORDER BY i.created_at DESC
  `;

  return result.rows as InvitationWithInviter[];
}

export async function markInvitationUsed(token: string): Promise<void> {
  await sql`
    UPDATE invitations
    SET used_at = NOW()
    WHERE token = ${token}
  `;
}

export async function deleteInvitation(id: string): Promise<void> {
  await sql`
    DELETE FROM invitations WHERE id = ${id}
  `;
}

export async function cleanupExpiredInvitations(): Promise<void> {
  await sql`
    DELETE FROM invitations
    WHERE expires_at < NOW() AND used_at IS NULL
  `;
}

// ============================================================================
// Starred Media Queries
// ============================================================================

export async function toggleMediaStarred(
  mediaId: string,
  isStarred: boolean
): Promise<void> {
  await sql`
    UPDATE media_assets
    SET is_starred = ${isStarred}
    WHERE id = ${mediaId}
  `;
}
