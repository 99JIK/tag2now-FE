import { CHARACTER_GRID, charImageUrl } from '@/shared/characterImage'

interface CharacterGridProps {
  isActive: (name: string) => boolean
  onPick: (name: string) => void
}

function CharacterGrid({ isActive, onPick }: CharacterGridProps) {
  return (
    <div className="overflow-x-auto" role="group" aria-label="캐릭터 선택">
      {CHARACTER_GRID.map((row, ri) => (
        <div key={ri} className="flex gap-0.5 mb-0.5">
          {row.map((name, ci) => {
            const url = charImageUrl(name)
            if (!url) return <div key={ci} className="w-1/23 h-9" />
            const active = isActive(name)
            return (
              <button
                key={name}
                onClick={() => onPick(name)}
                aria-pressed={active}
                aria-label={`Filter by ${name}`}
                className={`w-1/23 h-9 p-0 border rounded-md cursor-pointer transition-colors ${
                  active ? 'border-primary border-2 bg-primary/12' : 'border-transparent opacity-75 hover:opacity-100 hover:border-primary-dim'
                }`}
                title={name}
              >
                <img src={url} alt={name} className={`h-full object-cover rounded block`} />
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

interface CharacterGridPickerProps {
  value: string
  onChange: (name: string) => void
  defaultValue: string
}

export default function CharacterGridPicker({ value, onChange, defaultValue }: CharacterGridPickerProps) {
  return <CharacterGrid isActive={(name) => name === value} onPick={(name) => onChange(name === value ? defaultValue : name)} />
}

interface CharacterMultiPickerProps {
  value: string[]
  onChange: (names: string[]) => void
  max: number
}

/** Picks up to `max` characters; a pick past the limit drops the oldest, so a team swaps one member per click. */
export function CharacterMultiPicker({ value, onChange, max }: CharacterMultiPickerProps) {
  const toggle = (name: string) =>
    onChange(value.includes(name) ? value.filter((n) => n !== name) : [...value, name].slice(-max))
  return <CharacterGrid isActive={(name) => value.includes(name)} onPick={toggle} />
}
