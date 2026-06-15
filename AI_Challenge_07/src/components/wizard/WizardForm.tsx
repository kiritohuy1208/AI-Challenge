import { useEffect, useRef, useState } from 'react'
import { FormProvider, useForm, useFormContext } from 'react-hook-form'
import { ClipboardList } from 'lucide-react'

import {
  Step1ClaimType,
  Step2MemberInfo,
  Step3DiagnosisTreatment,
  Step4Documents,
  Step5Review,
} from '@/components/steps'
import { StepNavigation } from '@/components/wizard/StepNavigation'
import { Stepper } from '@/components/wizard/Stepper'
import { SubmitSuccess } from '@/components/wizard/SubmitSuccess'
import { getWizardStepConfig, TOTAL_WIZARD_STEPS } from '@/constants/wizardSteps'
import { DocumentUploadProvider, useDocumentUpload } from '@/context/DocumentUploadContext'
import { createDefaultFormValues } from '@/data/mockData'
import { useIsCurrentStepValid } from '@/hooks/useIsCurrentStepValid'
import type { WizardFormValues, WizardStep } from '@/types'
import { isWizardReadyToSubmit } from '@/utils/stepValidation'
import { buildClaimSubmissionPayload, submitClaim } from '@/utils/submitClaim'
import { validateWizardStep } from '@/utils/validateStep'

function StepContent({ step }: { step: WizardStep }) {
  switch (step) {
    case 1:
      return <Step1ClaimType />
    case 2:
      return <Step2MemberInfo />
    case 3:
      return <Step3DiagnosisTreatment />
    case 4:
      return <Step4Documents />
    case 5:
      return <Step5Review />
    default:
      return null
  }
}

function WizardFormInner() {
  const methods = useForm<WizardFormValues>({
    defaultValues: createDefaultFormValues(),
    shouldUnregister: false,
  })

  return (
    <FormProvider {...methods}>
      <WizardFormContent />
    </FormProvider>
  )
}

function WizardFormContent() {
  const { watch, setValue, handleSubmit, getValues, setError, clearErrors, reset } =
    useFormContext<WizardFormValues>()
  const { isAnyUploading } = useDocumentUpload()
  const isCurrentStepValid = useIsCurrentStepValid()
  const [isSubmitted, setIsSubmitted] = useState(false)

  const currentStep = watch('currentStep')
  const stepConfig = getWizardStepConfig(currentStep)
  const stepHeadingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    stepHeadingRef.current?.focus()
  }, [currentStep])

  const goToStep = (step: WizardStep) => {
    setValue('currentStep', step, { shouldDirty: true })
  }

  const handleNext = () => {
    if (currentStep < TOTAL_WIZARD_STEPS) {
      goToStep((currentStep + 1) as WizardStep)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep((currentStep - 1) as WizardStep)
    }
  }

  const handleStartNew = () => {
    reset(createDefaultFormValues())
    setIsSubmitted(false)
  }

  const onFormSubmit = handleSubmit(async () => {
    if (currentStep === TOTAL_WIZARD_STEPS) {
      const isValid = await validateWizardStep(
        currentStep,
        getValues(),
        setError,
        clearErrors,
        setValue,
      )

      if (!isValid) {
        return
      }

      if (!isWizardReadyToSubmit(getValues(), { isAnyUploading })) {
        return
      }

      const payload = buildClaimSubmissionPayload(getValues())
      submitClaim(payload)
      setIsSubmitted(true)
      return
    }

    const isValid = await validateWizardStep(
      currentStep,
      getValues(),
      setError,
      clearErrors,
      setValue,
    )

    if (isValid) {
      handleNext()
    }
  })

  if (isSubmitted) {
    return <SubmitSuccess onStartNew={handleStartNew} />
  }

  return (
    <form
      onSubmit={onFormSubmit}
      noValidate
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10"
    >
      <header className="flex flex-col gap-2 text-center sm:text-left">
        <div className="flex items-center justify-center gap-3 sm:justify-start">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ClipboardList className="size-5" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Claims Intake Wizard
          </h1>
        </div>
        <p className="text-sm text-muted-foreground sm:pl-[3.25rem]">
          Submit your insurance claim in five simple steps.
        </p>
      </header>

      <Stepper currentStep={currentStep} />

      <section
        aria-labelledby="wizard-step-heading"
        className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6"
      >
        <h2
          id="wizard-step-heading"
          ref={stepHeadingRef}
          tabIndex={-1}
          className="mb-1 text-xl font-semibold outline-none sm:text-2xl"
        >
          {stepConfig.title}
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">{stepConfig.description}</p>

        <StepContent step={currentStep} />
      </section>

      <StepNavigation
        currentStep={currentStep}
        onBack={handleBack}
        isNextDisabled={!isCurrentStepValid}
      />
    </form>
  )
}

export function WizardForm() {
  return (
    <DocumentUploadProvider>
      <WizardFormInner />
    </DocumentUploadProvider>
  )
}
