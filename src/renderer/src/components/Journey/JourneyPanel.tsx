import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import useAppStore from '../../store/app-store'
import { useT } from '../../i18n/strings'
import { LEVELS, TOTAL_STEPS } from '../../journey/levels'
import type { JourneyLevel } from '../../journey/levels'
import type { JourneyState, Language } from '@shared/types'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

function lastFourteenDays(allWords: Record<string, number>): Array<{ date: string; words: number }> {
  const days: Array<{ date: string; words: number }> = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const key = `${d.getFullYear()}-${month}-${day}`
    days.push({ date: key, words: allWords[key] ?? 0 })
  }
  return days
}

function levelDoneCount(level: JourneyLevel, completed: Record<string, string>): number {
  return level.steps.filter(s => completed[s.id]).length
}

export default function JourneyPanel(): JSX.Element {
  const t = useT()
  const language: Language = useAppStore(s => s.config?.language) ?? 'ro'
  const saveStatus = useAppStore(s => s.saveStatus)
  const [journey, setJourney] = useState<JourneyState>({ completed: {} })
  const [dailyWords, setDailyWords] = useState<Record<string, number>>({})

  useEffect(() => {
    window.api.getJourneyState().then(setJourney).catch(() => {})
  }, [])

  useEffect(() => {
    if (saveStatus === 'saved') {
      window.api.getAllDailyWords().then(setDailyWords).catch(() => {})
    }
  }, [saveStatus])

  const toggleStep = (stepId: string) => {
    const done = !journey.completed[stepId]
    window.api.setJourneyLevel(stepId, done).then(setJourney).catch(() => {})
  }

  const doneSteps = LEVELS.reduce((sum, l) => sum + levelDoneCount(l, journey.completed), 0)
  const currentLevelIndex = LEVELS.findIndex(
    l => levelDoneCount(l, journey.completed) < l.steps.length
  )
  const allDone = currentLevelIndex === -1

  const days = lastFourteenDays(dailyWords)
  const maxDay = Math.max(1, ...days.map(d => d.words))
  const todayWords = days[days.length - 1].words

  return (
    <aside
      className='flex flex-col h-full shrink-0 border-r overflow-y-auto'
      style={{
        width: '330px',
        background: 'var(--color-chrome)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className='px-4 py-3 border-b flex items-baseline justify-between' style={{ borderColor: 'var(--color-border)' }}>
        <h2 className='text-xs uppercase tracking-wider' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)' }}>
          {t('journeyTitle')}
        </h2>
        <span className='text-xs' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)' }}>
          {doneSteps} {t('journeyProgress')} {TOTAL_STEPS} {t('journeySteps')}
        </span>
      </div>

      <div style={{ height: 2, background: 'var(--color-border)' }}>
        <div
          style={{
            height: 2,
            width: `${(doneSteps / TOTAL_STEPS) * 100}%`,
            background: 'var(--color-accent)',
            transition: 'width 300ms ease',
          }}
        />
      </div>

      <div className='px-4 py-3 flex-1'>
        {allDone && (
          <p className='text-xs py-4' style={{ color: 'var(--color-prose)', fontFamily: 'var(--font-prose)', fontStyle: 'italic', lineHeight: 1.6 }}>
            {t('journeyFinished')}
          </p>
        )}

        {LEVELS.map((level, levelIndex) => {
          const done = levelDoneCount(level, journey.completed)
          const isComplete = done === level.steps.length
          const isCurrent = levelIndex === currentLevelIndex
          const isFuture = !isComplete && !isCurrent

          if (isComplete) {
            return (
              <div key={level.id} className='py-1 flex items-baseline gap-2'>
                <span className='text-xs' style={{ color: 'var(--color-accent)' }}>✓</span>
                <span className='text-xs' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)' }}>
                  {ROMAN[levelIndex]}. {level.title[language]}
                </span>
              </div>
            )
          }

          if (isFuture) {
            return (
              <div key={level.id} className='py-1'>
                <span className='text-xs' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)', opacity: 0.45 }}>
                  {ROMAN[levelIndex]}. {level.title[language]}
                </span>
              </div>
            )
          }

          // Current level — expanded card with its steps
          const firstUndoneIndex = level.steps.findIndex(s => !journey.completed[s.id])
          return (
            <div
              key={level.id}
              className='my-2 px-4 py-4'
              style={{
                borderLeft: '2px solid var(--color-accent)',
                background: 'var(--color-page)',
                borderRadius: '0 6px 6px 0',
              }}
            >
              <p className='text-xs pb-1 flex items-baseline justify-between' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)' }}>
                <span>{ROMAN[levelIndex]}</span>
                <span>{done}/{level.steps.length}</span>
              </p>
              <h3 style={{ fontFamily: 'var(--font-prose)', fontSize: '1.3rem', color: 'var(--color-prose)', marginBottom: 8 }}>
                {level.title[language]}
              </h3>
              <p className='text-xs' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)', lineHeight: 1.6, marginBottom: 14 }}>
                {level.lesson[language]}
              </p>

              <div className='flex flex-col gap-1'>
                {level.steps.map((step, stepIndex) => {
                  const stepDone = Boolean(journey.completed[step.id])
                  const isActiveStep = stepIndex === firstUndoneIndex
                  return (
                    <button
                      key={step.id}
                      onClick={() => toggleStep(step.id)}
                      title={t('journeyToggleHint')}
                      className='flex items-start gap-3 text-left py-1.5'
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0' }}
                    >
                      <span
                        className='shrink-0'
                        style={{
                          width: 14, height: 14, borderRadius: '50%', marginTop: 1,
                          border: `1.5px solid ${stepDone || isActiveStep ? 'var(--color-accent)' : 'var(--color-dim)'}`,
                          background: stepDone ? 'var(--color-accent)' : 'transparent',
                        }}
                      />
                      <span
                        className='text-xs'
                        style={{
                          fontFamily: 'var(--font-ui)',
                          lineHeight: 1.55,
                          color: stepDone
                            ? 'var(--color-dim)'
                            : isActiveStep ? 'var(--color-prose)' : 'var(--color-dim)',
                          textDecoration: stepDone ? 'line-through' : 'none',
                          opacity: stepDone ? 0.65 : 1,
                        }}
                      >
                        {step.text[language]}
                      </span>
                    </button>
                  )
                })}
              </div>

              <blockquote style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, marginTop: 10 }}>
                <p style={{ fontFamily: 'var(--font-prose)', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--color-prose)', lineHeight: 1.6 }}>
                  {level.quote.text[language]}
                </p>
                <p className='text-xs pt-1 text-right' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)' }}>
                  — {level.quote.author}
                </p>
              </blockquote>
            </div>
          )
        })}
      </div>

      <div className='px-4 py-4 border-t' style={{ borderColor: 'var(--color-border)' }}>
        <p className='text-xs pb-2 uppercase tracking-wider' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)', opacity: 0.6 }}>
          {t('journeyLast14')}
        </p>
        <div className='flex items-end gap-1' style={{ height: 40 }}>
          {days.map((day, i) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.words}`}
              className='flex-1'
              style={{
                height: Math.max(2, (day.words / maxDay) * 40),
                background: i === days.length - 1 ? 'var(--color-accent)' : 'var(--color-border)',
                borderRadius: 1,
              }}
            />
          ))}
        </div>
        <p className='text-xs pt-2' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)' }}>
          {todayWords.toLocaleString()} {t('words')} {t('journeyWordsToday')}
        </p>
      </div>
    </aside>
  )
}
