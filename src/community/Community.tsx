import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useCommunity from "@/community/useCommunity";
import { pathOf, postPath } from "@/config/routes";
import {createPost} from "@/community/communityApi";
import type { LeaderboardEntry} from "@/shared/types";
import { PostList, PostDetail, CreatePostForm } from "@/community/component";
import useIdentity from "@/shared/hooks/useIdentity";

/** 'detail' is not in this union: which post is open is the URL's answer, not
 * a second copy of it here. 'create' is a genuinely local mode — there is
 * nothing to link to until the post exists. */
type View = 'list' | 'create'

interface CommunityProps {
  leaderboardEntries?: LeaderboardEntry[]
}

export default function Community({ leaderboardEntries }: CommunityProps) {
  const community = useCommunity()
  const navigate = useNavigate()
  const { postId } = useParams()
  const { getUsername, ensureIdentity } = useIdentity()
  const [view, setView] = useState<View>('list')
  const [postType, setPostType] = useState('')
  const [characters, setCharacters] = useState<string[]>([])
  const reload = (page: number) => community.loadPosts(page, postType || undefined, characters).then()

  // A post id in the path is the whole trigger for the detail view, so it works
  // the same whether the reader clicked a row, pressed Back, or opened a shared
  // link cold.
  const openId = postId ? Number(postId) : null
  const showDetail = openId != null && Number.isFinite(openId)
  // One value decides what the panel shows, so the three branches below stay
  // mutually exclusive: a path with a post id wins over the local 'create'
  // mode, which navigating away from the form has already left behind.
  const mode: 'detail' | View = showDetail ? 'detail' : view

  useEffect(() => {
    reload(1)
  }, [postType, characters])

  useEffect(() => {
    if (!showDetail) return
    community.openPost(openId).then()
  }, [openId, showDetail])

  const handleSelectPost = (id: number) => {
    navigate(postPath(id))
  }

  const handleBack = () => {
    community.closePost()
    navigate(pathOf('community'))
    reload(community.page)
  }

  const handleCreatePost = async (title: string, body: string, type: string, team: string[], youtubeVideoId?: string) => {
    await ensureIdentity()
    await createPost(title, body, type, team, youtubeVideoId)
    setView('list')
    reload(1)
  }

  const handleDeleted = () => {
    navigate(pathOf('community'))
    reload(community.page)
  }

  return (
    <div className="panel">
      {mode === 'list' && (
        <PostList
          posts={community.posts}
          total={community.total}
          page={community.page}
          pageSize={community.pageSize}
          loading={community.loading}
          error={community.error}
          postType={postType}
          onPostTypeChange={setPostType}
          characters={characters}
          onCharactersChange={setCharacters}
          onPageChange={reload}
          onSelectPost={handleSelectPost}
          onRefresh={() => reload(community.page)}
          onWrite={() => setView('create')}
          leaderboardEntries={leaderboardEntries}
        />
      )}

      {mode === 'detail' && community.detailLoading && (
        <p className="state-msg">로딩 중...</p>
      )}
      {mode === 'detail' && community.detailError && (
        <p className="state-msg error">{community.detailError}</p>
      )}
      {mode === 'detail' && community.selectedPost && (
        <PostDetail
          key={community.selectedPost.id}
          post={community.selectedPost}
          username={getUsername()}
          onBack={handleBack}
          onRefresh={() => {
            community.refreshDetail()
            reload(community.page)
          }}
          ensureIdentity={ensureIdentity}
          onDeleted={handleDeleted}
          leaderboardEntries={leaderboardEntries}
        />
      )}

      {mode === 'create' && (
        <CreatePostForm
          onSubmit={handleCreatePost}
          onCancel={() => setView('list')}
        />
      )}
    </div>
  )
}
