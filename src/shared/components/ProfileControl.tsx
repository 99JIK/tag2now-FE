import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import PlayerHistoryPanel from './PlayerHistoryPanel'
import CharCell from './CharCell'
import { getUsername as getSavedUsername, saveUsername, clearUsername, isTransportableUsername, UNTRANSPORTABLE_USERNAME_MSG } from '@/shared/util/cookie'
import { setIdentity } from '@/community/communityApi'
import { AppError } from '@/shared/util/AppError'
import {CharInfo, LeaderboardEntry} from "@/shared/types";
import { Check, Pencil, UserRound, X } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * The API's own { detail } is Korean and written for users, so it is shown as
 * it is — "유저명은 50자를 넘을 수 없습니다." beats any generic line. Anything
 * else is a transport failure whose message is not user-facing text.
 */
function errorText(e: unknown): string {
  if (e instanceof AppError && e.explained) return e.message
  return '유저명을 저장하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.'
}

interface ProfileControlProps {
  leaderboardEntries?: LeaderboardEntry[]
}

/** Who you are on this site, and the way into your own record.
 *
 * It lived in the header, pinned to the right edge of a bar whose other job is
 * the wordmark. Above the nav it sits with the rest of "this browser's state" —
 * the Live count, the tab you are on, the badges — instead of reading as a
 * toolbar button that happens to be a person.
 *
 * Exactly one of these is mounted at a time; `App` decides where. See
 * `useMediaQuery` for why it is moved rather than duplicated and hidden.
 */
export default function ProfileControl({ leaderboardEntries }: ProfileControlProps) {
  const [username, setUsername] = useState(() => getSavedUsername() ?? '')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function startEditing() {
    setDraft(username)
    setEditing(true)
  }

  async function commitUsername() {
    const trimmed = draft.trim()
    // Refused before anything moves, so the editor simply stays open on what
    // was typed — the same recovery the failed-save path builds by reverting,
    // reached here without a request the backend would answer with a bare 500.
    if (!isTransportableUsername(trimmed)) {
      toast.error(UNTRANSPORTABLE_USERNAME_MSG)
      return
    }
    const prev = username
    setUsername(trimmed)
    setEditing(false)
    if (trimmed) {
      try {
        await setIdentity(trimmed)
        saveUsername(trimmed)
      } catch (e) {
        // Reopen rather than rethrowing. The rethrow reached the global
        // unhandledrejection handler, which toasts `e.message` verbatim — so a
        // dropped connection showed "Failed to fetch" and a 5xx without a body
        // showed "request failed: 500", both in English in an all-Korean UI.
        // Worse, the editor had already closed, so the typed name was gone and
        // the only way forward was to type it again from memory.
        setUsername(prev)
        setEditing(true)
        toast.error(errorText(e))
      }
    } else {
      clearUsername()
    }
  }

  const entry = username
    ? leaderboardEntries?.find(e => e.online_name === username)
    : undefined

  const mainChar = entry?.player_info?.main_char_info
  const subChar = entry?.player_info?.sub_char_info
  const chars = [mainChar, subChar].filter((c): c is CharInfo => !!c?.name)

  return (
    <>
      <div className="profile-control">
        {editing ? (
          <div className="profile-editor">
            <input ref={inputRef} type="text" value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitUsername().then(); if (e.key === 'Escape') setEditing(false) }}
              maxLength={50} placeholder="유저명 입력" aria-label="유저명 입력" className="input-base" />
            <button onClick={() => commitUsername()} aria-label="저장"><Check size={15} /></button>
            <button onClick={() => setEditing(false)} aria-label="취소"><X size={15} /></button>
          </div>
        ) : username ? (
          <div className="profile-summary">
            <div className="profile-copy">
              <small>#{entry?.rank || "UNRANKED"}</small>
              <button
                  onClick={() => setProfileOpen(true)}
                  disabled={!entry}
                  aria-label={`${username} 내 전적 보기`}
                  className="profile-name"
              >
                <span>{username}</span>
              </button>
              <button
                  onClick={startEditing}
                  aria-label={`${username} 유저명 수정`}
                  className="profile-edit"
              >
                <Pencil size={14} aria-hidden="true" />
              </button>
            </div>
            {/* The leaderboard's own cell, not a lookalike. This used to be a
                second rendering of the same three facts with different
                emphasis — raw W/L in green and red here, the win rate the
                leaderboard actually leads with there — so a player's own
                characters looked like different data to the ones they had just
                been reading one tab over. */}
            {chars.length > 0 && (
              <div className="profile-chars">
                {chars.map(char => (
                  <CharCell key={char.name} name={char.name} rankInfo={char.rank_info} wins={char.wins} losses={char.losses} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <button onClick={startEditing} className="profile-empty"><UserRound size={15} /> 유저명 설정</button>
        )}
      </div>
      {/* Portalled, because this control is mounted inside the chrome now: the
          header carries `backdrop-filter`, which makes it the containing block
          for any fixed descendant — the backdrop was clipped to the header's own
          68px instead of filling the viewport. The header used to dodge that by
          rendering the panel as its own sibling, which is not open to a
          component that does not know where it has been placed. */}
      {profileOpen && entry && createPortal(
        <PlayerHistoryPanel
          npid={entry.np_id}
          leaderboardEntry={entry}
          leaderboardEntries={leaderboardEntries}
          onClose={() => setProfileOpen(false)}
        />,
        document.body,
      )}
    </>
  )
}
