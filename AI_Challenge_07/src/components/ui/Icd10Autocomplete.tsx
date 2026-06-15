import { useCallback, useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { Autocomplete } from '@/components/ui/Autocomplete'
import { filterIcd10Codes } from '@/data/mockData'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/utils'
import type { Icd10Code, WizardFormValues } from '@/types'
import {
  ICD10_SELECTION_ERROR,
  isValidIcd10Selection,
  resolveExactIcd10Code,
} from '@/utils/icd10Validation'

interface Icd10AutocompleteProps {
  id?: string
  error?: string
}

export function Icd10Autocomplete({ id = 'icd10-search', error }: Icd10AutocompleteProps) {
  const { setValue, getValues, setError, clearErrors, watch } =
    useFormContext<WizardFormValues>()

  const icd10Code = watch('icd10Code')
  const icd10Description = watch('icd10Description')

  const [selectedIcd10, setSelectedIcd10] = useState<Icd10Code | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 250)
  const icd10Options = filterIcd10Codes(debouncedSearchQuery, 15)

  const isSearching = searchQuery.trim().length > 0
  const inputValue = isSearching ? searchQuery : (selectedIcd10?.code ?? '')

  useEffect(() => {
    if (isValidIcd10Selection(icd10Code, icd10Description)) {
      setSelectedIcd10({ code: icd10Code, description: icd10Description })
    }
    // Restore when returning to this step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applySelection = useCallback(
    (option: Icd10Code) => {
      setSelectedIcd10(option)
      setSearchQuery('')
      setValue('icd10Code', option.code, { shouldDirty: true, shouldValidate: false })
      setValue('icd10Description', option.description, {
        shouldDirty: true,
        shouldValidate: false,
      })
      clearErrors('icd10Code')
    },
    [clearErrors, setValue],
  )

  const tryResolveFromInput = useCallback(
    (text: string): boolean => {
      const match = resolveExactIcd10Code(text)

      if (match) {
        applySelection(match)
        return true
      }

      return false
    },
    [applySelection],
  )

  const validateSelection = useCallback(() => {
    const { icd10Code: code, icd10Description: description } = getValues()

    if (!isValidIcd10Selection(code, description)) {
      setError('icd10Code', {
        type: 'manual',
        message: ICD10_SELECTION_ERROR,
      })
      return false
    }

    clearErrors('icd10Code')
    return true
  }, [clearErrors, getValues, setError])

  const handleSelect = (option: Icd10Code) => {
    applySelection(option)
  }

  const handleInputChange = (value: string) => {
    setSearchQuery(value)

    const exactMatch = resolveExactIcd10Code(value)

    if (exactMatch) {
      applySelection(exactMatch)
      return
    }

    if (selectedIcd10) {
      setSelectedIcd10(null)
      setValue('icd10Code', '', { shouldDirty: true, shouldValidate: false })
      setValue('icd10Description', '', { shouldDirty: true, shouldValidate: false })
    }

    clearErrors('icd10Code')
  }

  const handleBlur = () => {
    const textToResolve = isSearching ? searchQuery : inputValue

    if (tryResolveFromInput(textToResolve)) {
      return
    }

    if (selectedIcd10 && !isSearching) {
      setSearchQuery('')
    }

    validateSelection()
  }

  return (
    <div className="space-y-1.5">
      <Autocomplete
        id={id}
        label="ICD-10 code"
        required
        placeholder="Search by code or description (e.g. E11.9 or diabetes)"
        value={inputValue}
        onValueChange={handleInputChange}
        onSelect={handleSelect}
        onBlur={handleBlur}
        options={icd10Options}
        getOptionKey={(option) => option.code}
        getOptionLabel={(option) => option.code}
        getOptionSearchText={(option) => option.description}
        error={error}
        description="Type or paste an exact code, or search by description and select"
        hideDropdown={!isSearching}
        openOnFocus={isSearching}
      />

      {selectedIcd10 && !isSearching && (
        <p
          className={cn(
            'rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground',
            error && 'mt-0',
          )}
          aria-live="polite"
        >
          <span className="font-medium text-foreground">{selectedIcd10.code}</span>
          {' — '}
          {selectedIcd10.description}
        </p>
      )}
    </div>
  )
}
