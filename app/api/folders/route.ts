import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createFolder, getFolders } from "@/lib/db/queries";
import { createFolderSchema } from "@/lib/validation/folderSchemas";

/**
 * POST /api/folders
 * Create a new folder (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = createFolderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, description } = validation.data;

    const folder = await createFolder({
      name,
      description,
      created_by: user.id,
    });

    return NextResponse.json({ success: true, folder });
  } catch (error: any) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/folders
 * List all folders (all authenticated users)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const folders = await getFolders();

    return NextResponse.json({ success: true, folders });
  } catch (error: any) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 }
    );
  }
}
