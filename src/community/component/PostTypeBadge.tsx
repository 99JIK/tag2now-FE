import { charImageUrl } from '@/shared/characterImage'

type BadgeSize = 'sm' | 'md'

interface PostTypeBadgeProps {
  postType: string
  /** When present, the team's portraits take the badge slot instead of the type. */
  characters?: string[]
  size?: BadgeSize
}

const imgClassOf = (size: BadgeSize) => size === 'md' ? 'h-6 w-6' : 'h-5 w-5'

export function CharacterBadges({ characters, size = 'sm' }: { characters: string[]; size?: BadgeSize }) {
  return (
    <span className="inline-flex gap-0.5">
      {characters.map((name) => {
        const url = charImageUrl(name)
        return url && <img key={name} src={url} alt={name} title={name} className={`${imgClassOf(size)} object-cover rounded`} />
      })}
    </span>
  )
}

export default function PostTypeBadge({ postType, characters = [], size = 'sm' }: PostTypeBadgeProps) {
  if (characters.length > 0) return <CharacterBadges characters={characters} size={size} />

  const url = charImageUrl(postType)
  const textClass = size === 'md'
    ? 'text-xs px-2 py-0.5'
    : 'text-2xs px-1.5 py-0.5'

  if (url) {
    return <img src={url} alt={postType} className={`${imgClassOf(size)} object-cover rounded`} />
  }

  return (
    <span className={`${textClass} font-bold uppercase tracking-wider bg-primary-glow text-primary-text border border-primary-dim rounded`}>
      {postType}
    </span>
  )
}
