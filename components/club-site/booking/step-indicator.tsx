/**
 * Indicatore visuale degli step della prenotazione.
 * Mobile-friendly con numeri e label.
 */
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

type Step = {
  id: number
  label: string
}

type Props = {
  steps: readonly Step[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: Props) {
  return (
    <nav aria-label="Passi della prenotazione">
      <ol className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep
          const isComplete = step.id < currentStep

          return (
            <li
              key={step.id}
              className="flex flex-1 items-center"
              aria-current={isActive ? "step" : undefined}
            >
              <div className="flex w-full flex-col items-center gap-1">
                {/* Cerchio numerato */}
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors sm:h-10 sm:w-10",
                    isComplete && "bg-primary text-primary-foreground",
                    isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isComplete && !isActive && "bg-muted text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    step.id
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-medium sm:text-sm",
                    isActive && "text-primary",
                    !isActive && !isComplete && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connettore tra step */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mb-5 h-0.5 w-full",
                    step.id < currentStep ? "bg-primary" : "bg-muted"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
