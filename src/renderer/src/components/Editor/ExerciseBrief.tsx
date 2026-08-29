import type { JSX } from 'react'
import useAppStore from '../../store/app-store'
import { findStep } from '../../journey/levels'
import type { Language, ProjectNode } from '@shared/types'

// Shown above the writing space for scenes seeded from the Path.
// The brief lives here, in the reader's language — never inside the page he writes on.
export default function ExerciseBrief({ node }: { node: ProjectNode }): JSX.Element | null {
  const language: Language = useAppStore(s => s.config?.language) ?? 'ro'

  if (node.journeyStepId === null) return null
  const step = findStep(node.journeyStepId)
  if (step === undefined) return null

  return (
    <div
      className='px-5 py-4 mb-2'
      style={{
        borderLeft: '2px solid var(--color-accent)',
        background: 'var(--color-chrome)',
        borderRadius: '0 6px 6px 0',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-prose)',
          fontSize: '1.1rem',
          color: 'var(--color-prose)',
          marginBottom: 6,
        }}
      >
        {step.title[language]}
      </h2>
      <p
        className='text-xs'
        style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)', lineHeight: 1.65 }}
      >
        {step.text[language]}
      </p>
    </div>
  )
}
