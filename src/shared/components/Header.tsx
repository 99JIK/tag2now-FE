import { LATEST_PATCH_VERSION } from '@/config/patchNotes'
import { Radio } from 'lucide-react'

interface HeaderProps {
  totalUsers?: number
}

export default function Header({ totalUsers }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true"><span>2</span></div>
        <div>
          <h1 aria-label="Tag 2 Now">TAG<span>2</span>NOW</h1>
          <p>Tekken Tag Tournament 2 live hub <b>v{LATEST_PATCH_VERSION}</b></p>
        </div>
      </div>

      <div className="header-live" aria-label={`${totalUsers ?? 0}명 온라인`}>
        <Radio size={15} aria-hidden="true" />
        <span>Live</span>
        {totalUsers != null && totalUsers > 0 && <strong>{totalUsers}</strong>}
      </div>
      <div id="headerProfileSlot" className="profile-control" />
    </header>
  )
}
