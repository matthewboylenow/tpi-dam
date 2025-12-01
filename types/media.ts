export interface MediaAsset {
  id: string;
  owner_user_id: string;
  blob_url: string;
  caption: string | null;
  client_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: Date;
}

export interface MediaAssetWithOwner extends MediaAsset {
  owner_name: string | null;
  owner_email: string;
}

export interface MediaAssetWithTags extends MediaAsset {
  tags: string[];
}

export interface MediaAssetFull extends MediaAssetWithOwner {
  tags: string[];
}

export type CreateMediaAssetInput = {
  owner_user_id: string;
  blob_url: string;
  caption?: string;
  client_name?: string;
  mime_type?: string;
  file_size?: number;
};

export type MediaFilterParams = {
  owner_user_id?: string;
  client_name?: string;
  tag?: string;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};
