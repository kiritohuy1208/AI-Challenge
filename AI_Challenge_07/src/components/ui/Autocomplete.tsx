import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'

import { fieldInputClassName, FormField } from '@/components/ui/form-field'
import { cn } from '@/lib/utils'

interface AutocompleteProps<T> {
  id?: string
  label: string
  required?: boolean
  error?: string
  placeholder?: string
  value: string
  onValueChange: (value: string) => void
  onSelect: (option: T) => void
  options: T[]
  getOptionKey: (option: T) => string
  getOptionLabel: (option: T) => string
  getOptionSearchText?: (option: T) => string
  noResultsText?: string
  description?: string
  onBlur?: () => void
  listboxClassName?: string
  /** When true, the dropdown is never rendered (e.g. after a confirmed selection). */
  hideDropdown?: boolean
  /** When false, focusing the input will not open the dropdown. */
  openOnFocus?: boolean
}

export function Autocomplete<T>({
  id: idProp,
  label,
  required = false,
  error,
  placeholder,
  value,
  onValueChange,
  onSelect,
  options,
  getOptionKey,
  getOptionLabel,
  getOptionSearchText,
  noResultsText = 'No matches found',
  description,
  onBlur,
  listboxClassName,
  hideDropdown = false,
  openOnFocus = true,
}: AutocompleteProps<T>) {
  const generatedId = useId()
  const id = idProp ?? generatedId
  const listboxId = `${id}-listbox`

  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const closeList = useCallback(() => {
    setIsOpen(false)
    setActiveIndex(-1)
  }, [])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeList()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [closeList])

  const handleSelect = (option: T) => {
    onSelect(option)
    closeList()
  }

  const handleOptionPointerDown = (
    event: ReactMouseEvent<HTMLLIElement>,
    option: T,
  ) => {
    // Prevent input blur before selection is applied
    event.preventDefault()
    handleSelect(option)
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setIsOpen(true)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) =>
        current < options.length - 1 ? current + 1 : 0,
      )
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) =>
        current > 0 ? current - 1 : options.length - 1,
      )
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()

      if (isOpen && options.length > 0) {
        const index = activeIndex >= 0 ? activeIndex : 0
        handleSelect(options[index])
      }

      return
    }

    if (event.key === 'Escape') {
      closeList()
    }
  }

  const showList = !hideDropdown && isOpen && value.trim().length > 0

  return (
    <FormField
      id={id}
      label={label}
      required={required}
      error={error}
      description={description}
    >
      <div
        ref={containerRef}
        className={cn('relative', showList && 'z-50')}
      >
        <input
          id={id}
          type="text"
          role="combobox"
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value)
            setIsOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => {
            if (openOnFocus && value.trim()) {
              setIsOpen(true)
            }
          }}
          onBlur={() => {
            closeList()
            onBlur?.()
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={showList ? listboxId : undefined}
          aria-invalid={error ? true : undefined}
          className={fieldInputClassName}
        />

        {showList && (
          <ul
            id={listboxId}
            role="listbox"
            className={cn(
              'absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-lg ring-1 ring-black/5',
              listboxClassName,
            )}
          >
            {options.length === 0 ? (
              <li className="bg-white px-3 py-2 text-sm text-muted-foreground">
                {noResultsText}
              </li>
            ) : (
              options.map((option, index) => (
                <li
                  key={getOptionKey(option)}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={cn(
                    'cursor-pointer bg-white px-3 py-2 text-sm text-foreground',
                    index === activeIndex && 'bg-accent text-accent-foreground',
                  )}
                  onMouseDown={(event) => handleOptionPointerDown(event, option)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {getOptionLabel(option)}
                  {getOptionSearchText && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {getOptionSearchText(option)}
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </FormField>
  )
}
