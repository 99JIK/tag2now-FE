import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { Check, Pencil, Radio, Trophy, UserRound, X } from 'lucide-react'
import { setIdentity } from '@/community/communityApi'
import type { RoomUser } from '@/match/types'
import type { CharInfo, LeaderboardEntry } from '@/shared/types'
import { charImageUrl } from '@/shared/characterImage'
import { AppError } from '@/shared/util/AppError'
import {
  clearUsername,
  getUsername as getSavedUsername,
  isTransportableUsername,
  saveUsername,
  UNTRANSPORTABLE_USERNAME_MSG,
} from '@/shared/util/cookie'
import PlayerHistoryPanel from './PlayerHistoryPanel'
import RankImage from './RankImage'

interface PlayerProfileCardProps {
  leaderboardEntries?: LeaderboardEntry[]
  roomUsers?: RoomUser[]
}

function errorText(error: unknown): string {
  if (error instanceof AppError && error.explained) return error.message
  return '유저명을 저장하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.'
}

export default function PlayerProfileCard({ leaderboardEntries, roomUsers = [] }: PlayerProfileCardProps) {
  const [username, setUsername] = useState(() => getSavedUsername() ?? '')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobile, setMobile] = useState(() => window.matchMedia?.('(max-width: 760px)').matches ?? false)
  const [mobileTarget, setMobileTarget] = useState<HTMLElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    const query = window.matchMedia?.('(max-width: 760px)')
    if (!query) return
    const update = () => setMobile(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    setMobileTarget(document.getElementById('mobileProfileSlot'))
  }, [])

  const entry = username
    ? leaderboardEntries?.find(item => item.online_name === username)
    : undefined
  const characters = [entry?.player_info?.main_char_info, entry?.player_info?.sub_char_info]
    .filter((character): character is CharInfo => !!character?.name)
  const online = !!username && roomUsers.some(user =>
    (entry?.np_id && user.np_id === entry.np_id) || user.online_name === username,
  )

  function startEditing() {
    setDraft(username)
    setEditing(true)
  }

  async function commitUsername() {
    const trimmed = draft.trim()
    if (!isTransportableUsername(trimmed)) {
      toast.error(UNTRANSPORTABLE_USERNAME_MSG)
      return
    }

    const previous = username
    setUsername(trimmed)
    setEditing(false)
    if (!trimmed) {
      clearUsername()
      return
    }

    try {
      await setIdentity(trimmed)
      saveUsername(trimmed)
    } catch (error) {
      setUsername(previous)
      setEditing(true)
      toast.error(errorText(error))
    }
  }

  const card = (
      <section className={`sidebar-profile-card${editing ? ' is-editing' : ''}${mobile ? ' is-mobile-profile' : ''}`} aria-label="내 파이터 정보">
        <div className="sidebar-profile-heading">
          <span>My fighter</span>
          {!editing && username && (
            <button type="button" onClick={startEditing} aria-label={`${username} 유저명 수정`}>
              <Pencil size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        {editing ? (
          <div className="profile-editor sidebar-profile-editor">
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={event => setDraft(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') void commitUsername()
                if (event.key === 'Escape') setEditing(false)
              }}
              maxLength={50}
              placeholder="유저명 입력"
              aria-label="유저명 입력"
              className="input-base"
            />
            <button type="button" onClick={() => void commitUsername()} aria-label="저장"><Check size={15} /></button>
            <button type="button" onClick={() => setEditing(false)} aria-label="취소"><X size={15} /></button>
          </div>
        ) : username ? (
          <>
            <div className="sidebar-profile-identity">
              <button
                type="button"
                className="sidebar-profile-name"
                onClick={() => setProfileOpen(true)}
                disabled={!entry}
                aria-label={`${username} 내 전적 보기`}
              >
                <strong>{username}</strong>
                <span>#{entry?.rank ?? 'UNRANKED'}</span>
              </button>
              <small className={online ? 'is-online' : ''}>
                <Radio size={12} aria-hidden="true" />
                {online ? '온라인' : '오프라인'}
              </small>
            </div>

            {characters.length > 0 && (
              <div className="sidebar-profile-characters" aria-label="캐릭터와 계급">
                {characters.map((character, index) => (
                  <ProfileCharacter key={`${character.name}-${index}`} character={character} order={index} />
                ))}
              </div>
            )}

            <button
              type="button"
              className="sidebar-profile-history"
              onClick={() => setProfileOpen(true)}
              disabled={!entry}
            >
              <Trophy size={14} aria-hidden="true" />
              내 전적 보기
            </button>
          </>
        ) : (
          <button type="button" onClick={startEditing} className="profile-empty sidebar-profile-empty">
            <UserRound size={15} aria-hidden="true" /> 유저명 설정
          </button>
        )}
      </section>
  )

  return (
    <>
      {mobile && mobileTarget ? createPortal(card, mobileTarget) : card}
      {profileOpen && entry && createPortal(
        <PlayerHistoryPanel
          npid={entry.np_id}
          leaderboardEntry={entry}
          onClose={() => setProfileOpen(false)}
        />,
        document.body,
      )}
    </>
  )
}

function ProfileCharacter({ character, order }: { character: CharInfo; order: number }) {
  const imageUrl = charImageUrl(character.name)
  const role = order === 0 ? '메인' : '서브'

  return (
    <div className="sidebar-profile-character" aria-label={`${role} 캐릭터 ${character.name}, 계급 ${character.rank_info?.name ?? '없음'}`}>
      <RankImage rankInfo={character.rank_info} className="sidebar-profile-rank" />
      <div className="sidebar-profile-portrait">
        {imageUrl ? <img src={imageUrl} alt={character.name} /> : <UserRound size={18} aria-hidden="true" />}
      </div>
    </div>
  )
}
