import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { forwardRef, KeyboardEvent, useCallback, useRef, useState } from 'react'

export interface Tag {
    id: string
    text: string
}

interface TagInputProps {
    tags: Tag[]
    setTags: (tags: Tag[]) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    value?: string
    onChange?: (e: any) => void
}

export const TagInput = forwardRef<HTMLInputElement, TagInputProps>(
    ({ tags, setTags, placeholder, className, disabled, value, onChange, ...props }, ref) => {
        const [inputValue, setInputValue] = useState('')
        const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)
        const inputRef = useRef<HTMLInputElement>(null)

        const handleKeyDown = useCallback(
            (e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    const text = inputValue.trim()
                    if (text && !tags.some((tag) => tag.text === text)) {
                        const newTag: Tag = {
                            id: `${Date.now()}-${text}`,
                            text,
                        }
                        setTags([...tags, newTag])
                        setInputValue('')
                    }
                } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
                    if (activeTagIndex !== null) {
                        const newTags = tags.filter((_, index) => index !== activeTagIndex)
                        setTags(newTags)
                        setActiveTagIndex(null)
                    } else {
                        setActiveTagIndex(tags.length - 1)
                    }
                }
            },
            [inputValue, tags, setTags, activeTagIndex],
        )

        const removeTag = useCallback(
            (tagToRemove: Tag) => {
                setTags(tags.filter((tag) => tag.id !== tagToRemove.id))
                setActiveTagIndex(null)
            },
            [tags, setTags],
        )

        return (
            <div
                className={cn(
                    'flex min-h-[40px] w-full flex-wrap gap-2 rounded-alinma-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-all duration-200',
                    'hover:border-ring/50',
                    'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:shadow-sm',
                    disabled && 'cursor-not-allowed opacity-50',
                    className,
                )}
                onClick={() => inputRef.current?.focus()}
            >
                {tags.map((tag, index) => (
                    <div
                        key={tag.id}
                        className={cn(
                            'inline-flex h-7 items-center gap-1.5 rounded-alinma-sm bg-secondary px-2.5 py-1 text-sm font-medium text-secondary-foreground transition-colors',
                            'hover:bg-secondary/80',
                            activeTagIndex === index && 'ring-2 ring-ring',
                        )}
                    >
                        <span className="select-none leading-none">{tag.text}</span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                removeTag(tag)
                            }}
                            className={cn(
                                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors',
                                'hover:bg-foreground/10',
                            )}
                            disabled={disabled}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={tags.length === 0 ? placeholder : undefined}
                    disabled={disabled}
                    className={cn(
                        'min-w-[120px] flex-1 border-none bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm',
                        'disabled:cursor-not-allowed',
                    )}
                    {...props}
                />
            </div>
        )
    },
)

TagInput.displayName = 'TagInput'
