// Community types
export interface PostSummary {
  id: number
  author: string
  title: string
  body: string
  post_type: string
  characters?: string[]
  youtube_video_id?: string | null
  thumbs_up: number
  thumbs_down: number
  created_at: string
  comment_count: number
}

export interface PostListResponse {
  posts: PostSummary[]
  total: number
  page: number
  page_size: number
}

export interface CommentOut {
  id: number
  post_id: number
  parent_id: number | null
  author: string
  body: string
  created_at: string
  replies: CommentOut[]
}

export interface PostDetail {
  id: number
  author: string
  title: string
  body: string
  post_type: string
  characters?: string[]
  youtube_video_id?: string | null
  thumbs_up: number
  thumbs_down: number
  created_at: string
  comments: CommentOut[]
}

/**
 * The post types, mirroring VALID_POST_TYPES in the backend's
 * community/models.py. That set is the authority — it rejects anything else —
 * so adding a type here alone yields a 422 on submit.
 *
 * Characters are not post types; they are tagged separately in `characters`.
 */
export const POST_TYPES = ['자유', '건의', '공략'] as const

/** A TTT2 team is two characters — mirrors MAX_POST_CHARACTERS in the backend. */
export const MAX_POST_CHARACTERS = 2
