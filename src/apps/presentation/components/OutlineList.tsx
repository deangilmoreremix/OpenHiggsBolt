import { useState, useEffect } from 'react'
import { GripVertical, Plus, Trash2 } from 'lucide-react'

interface OutlineListProps {
  items: string[]
  onChange: (items: string[]) => void
  disabled?: boolean
}

interface OutlineItemType {
  id: string
  title: string
}

export default function OutlineList({ items, onChange, disabled }: OutlineListProps) {
  const [localItems, setLocalItems] = useState<OutlineItemType[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    setLocalItems((prev) => {
      if (prev.length === items.length && prev.every((p, i) => p.title === items[i])) {
        return prev
      }
      return items.map((title, index) => ({
        id: prev[index]?.id ?? `${Date.now()}-${index}`,
        title,
      }))
    })
  }, [items])

  const updateTitles = (next: OutlineItemType[]) => {
    setLocalItems(next)
    onChange(next.map((item) => item.title))
  }

  const handleTitleChange = (id: string, title: string) => {
    updateTitles(localItems.map((item) => (item.id === id ? { ...item, title } : item)))
  }

  const handleAdd = () => {
    updateTitles([...localItems, { id: `${Date.now()}-new`, title: 'New Slide' }])
  }

  const handleDelete = (id: string) => {
    updateTitles(localItems.filter((item) => item.id !== id))
  }

  const handleDragStart = (index: number) => {
    if (disabled) return
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    const next = [...localItems]
    const [moved] = next.splice(draggedIndex, 1)
    next.splice(index, 0, moved)
    setDraggedIndex(index)
    updateTitles(next)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-2">
      {localItems.map((item, index) => (
        <div
          key={item.id}
          draggable={!disabled}
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`group flex items-center gap-3 rounded-xl bg-bg-card border border-border-color p-3 transition-all ${
            draggedIndex === index ? 'opacity-50' : ''
          } ${disabled ? '' : 'cursor-move'}`}
        >
          <div className="text-secondary">
            <GripVertical size={18} />
          </div>
          <span className="text-secondary text-sm w-6">{index + 1}</span>
          <input
            type="text"
            value={item.title}
            onChange={(e) => handleTitleChange(item.id, e.target.value)}
            disabled={disabled}
            className="flex-1 bg-transparent text-sm outline-none min-w-0"
          />
          <button
            onClick={() => handleDelete(item.id)}
            disabled={disabled}
            className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 disabled:opacity-0"
            aria-label={`Delete slide ${index + 1}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <button
        onClick={handleAdd}
        disabled={disabled}
        className="w-full py-3 rounded-xl border border-dashed border-border-color text-secondary hover:text-white hover:border-secondary transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Plus size={18} />
        Add card
      </button>
    </div>
  )
}
