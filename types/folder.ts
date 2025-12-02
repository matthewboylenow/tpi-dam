export interface Folder {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  is_starred: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FolderWithCount extends Folder {
  creator_name: string | null;
  creator_email: string;
  media_count: number;
}

export type CreateFolderInput = {
  name: string;
  description?: string;
};

export type UpdateFolderInput = Partial<CreateFolderInput>;
