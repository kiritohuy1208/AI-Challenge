import { ChevronDown, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

function defaultFormatLabel(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface MultiSelectDropdownProps<T extends string> {
  label: string;
  placeholder: string;
  options: readonly T[];
  selected: T[];
  onToggle: (value: T) => void;
  onClear: () => void;
  formatLabel?: (value: T) => string;
}

export function MultiSelectDropdown<T extends string>({
  label,
  placeholder,
  options,
  selected,
  onToggle,
  onClear,
  formatLabel = defaultFormatLabel,
}: MultiSelectDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const triggerContent = (() => {
    if (selected.length === 0) {
      return <span className="truncate text-slate-500">{placeholder}</span>;
    }

    if (selected.length === 1) {
      return (
        <span className="truncate font-medium text-slate-900">
          {formatLabel(selected[0])}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
        {selected.length} selected
      </span>
    );
  })();

  return (
    <div ref={containerRef} className="relative min-w-0 space-y-2">
      <p className="text-xs font-medium text-slate-600">{label}</p>

      <div className="flex h-10 w-full items-center rounded-lg border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
        <button
          type="button"
          tabIndex={0}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          className="flex min-w-0 flex-1 items-center px-3 text-sm transition-colors hover:bg-slate-50"
          onClick={() => setOpen((current) => !current)}
        >
          {triggerContent}
        </button>

        {selected.length > 0 ? (
          <button
            type="button"
            tabIndex={0}
            aria-label={`Clear ${label}`}
            className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            onClick={() => {
              onClear();
              setOpen(false);
            }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}

        <button
          type="button"
          tabIndex={0}
          aria-label={`Toggle ${label} options`}
          className="shrink-0 px-2 text-slate-400 hover:text-slate-600"
          onClick={() => setOpen((current) => !current)}
        >
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
          className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-50 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
        >
          {options.map((option) => {
            const isChecked = selected.includes(option);
            const optionId = `${listboxId}-${option}`;

            return (
              <label
                key={option}
                htmlFor={optionId}
                role="option"
                aria-selected={isChecked}
                className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 hover:bg-slate-50"
              >
                <input
                  id={optionId}
                  type="checkbox"
                  checked={isChecked}
                  tabIndex={0}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  onChange={() => onToggle(option)}
                />
                <span className="truncate text-sm text-slate-700" title={option}>
                  {formatLabel(option)}
                </span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
