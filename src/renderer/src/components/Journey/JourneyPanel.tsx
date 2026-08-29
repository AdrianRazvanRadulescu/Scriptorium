import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import useAppStore from '../../store/app-store'
import { useT } from '../../i18n/strings'
import { LEVELS } from '../../journey/levels'
import type { JourneyState, Language } from '@shared/types'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

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

export default function JourneyPanel(): JSX.Element {
  const t = useT()
  const language: Language = useAppStore(s => s.config?.language) ?? 'ro'
  const saveStatus = useAppStore(s => s.saveStatus)
  const [journey, setJourney] = useState<JourneyState>({ completed: {} })
  const [dailyWords, setDailyWords] = useState<Record<string, number>>({})

  useEffect(() => {
    window.api.getJourneyState().then(setJourney).catch(() => {})
  }, [])

  // Keep the daily bars fresh while he writes with the panel open
  useEffect(() => {
    if (saveStatus === 'saved') {
      window.api.getAllDailyWords().then(setDailyWords).catch(() => {})
    }
  }, [saveStatus])

  const toggleLevel = (levelId: string, done: boolean) => {
    window.api.setJourneyLevel(levelId, done).then(setJourney).catch(() => {})
  }

  const completedCount = LEVELS.filter(l => journey.completed[l.id]).length
  const currentIndex = LEVELS.findIndex(l => !journey.completed[l.id])
  const current = currentIndex === -1 ? null : LEVELS[currentIndex]

  const days = lastFourteenDays(dailyWords)
  const maxDay = Math.max(1, ...days.map(d => d.words))
  const todayWords = days[days.length - 1].words

  return (
    <aside
      className='flex flex-col h-full shrink-0 border-l overflow-y-auto'
      style={{
        width: '320px',
        background: 'var(--color-chrome)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className='px-4 py-3 border-b' style={{ borderColor: 'var(--color-border)' }}>
        <h2 className='text-xs uppercase tracking-wider' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)' }}>
          {t('journeyTitle')}
        </h2>
      </div>

      <div className='px-4 py-4 flex-1'>
        {/* Progress */}
        <div className='pb-1 flex items-baseline justify-between'>
          <span className='text-xs' style={{ color: 'var(--color-prose)', fontFamily: 'var(--font-ui)' }}>
            {completedCount} {t('journeyProgress')} {LEVELS.length} {t('journeyLevels')}
          </span>
          {completedCount > 0 && (
            <span className='text-xs' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)' }}>
              {t('journeyOnTrack')}
            </span>
          )}
        </div>
        <div style={{ height: 2, background: 'var(--color-border)', borderRadius: 1 }}>
          <div
            style={{
              height: 2,
              width: `${(completedCount / LEVELS.length) * 100}%`,
              background: 'var(--color-accent)',
              borderRadius: 1,
              transition: 'width 300ms ease',
            }}
          />
        </div>

        {/* Completed levels — compact, click to undo */}
        {completedCount > 0 && (
          <div className='pt-4'>
            {LEVELS.map((level, i) =>
              journey.completed[level.id] ? (
                <button
                  key={level.id}
                  onClick={() => toggleLevel(level.id, false)}
                  title={t('journeyUndoHint')}
                  className='block w-full text-left text-xs py-1'
                  style={{
                    color: 'var(--color-dim)',
                    fontFamily: 'var(--font-ui)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: 'var(--color-accent)', marginRight: 8 }}>✓</span>
                  {ROMAN[i]}. {level.title[language]}
                </button>
              ) : null
            )}
          </div>
        )}

        {/* Current level */}
        {current && (
          <div
            className='mt-4 px-4 py-4'
            style={{
              borderLeft: '2px solid var(--color-accent)',
              background: 'var(--color-page)',
              borderRadius: '0 6px 6px 0',
            }}
          >
            <p className='text-xs pb-1' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)' }}>
              {ROMAN[currentIndex]}
            </p>
            <h3 style={{ fontFamily: 'var(--font-prose)', fontSize: '1.25rem', color: 'var(--color-prose)', marginBottom: 10 }}>
              {current.title[language]}
            </h3>
            <p className='text-xs' style={{ color: 'var(--color-prose)', fontFamily: 'var(--font-ui)', lineHeight: 1.6, marginBottom: 10 }}>
              {current.lesson[language]}
            </p>
            <p className='text-xs' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)', lineHeight: 1.6, marginBottom: 14 }}>
              {current.exercise[language]}
            </p>

            <blockquote style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, marginBottom: 14 }}>
              <p style={{ fontFamily: 'var(--font-prose)', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--color-prose)', lineHeight: 1.6 }}>
                {current.quote.text[language]}
              </p>
              <p className='text-xs pt-1 text-right' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)' }}>
                — {current.quote.author}
              </p>
            </blockquote>

            <button
              onClick={() => toggleLevel(current.id, true)}
              className='text-xs px-3 py-1.5 rounded'
              style={{
                background: 'none',
                color: 'var(--color-accent)',
                border: '1px solid var(--color-accent)',
                fontFamily: 'var(--font-ui)',
                cursor: 'pointer',
              }}
            >
              {t('journeyMarkDone')}
            </button>
          </div>
        )}

        {/* Upcoming levels — titles only, dim */}
        {currentIndex !== -1 && currentIndex < LEVELS.length - 1 && (
          <div className='pt-4'>
            {LEVELS.slice(currentIndex + 1).map((level, i) => (
              <p key={level.id} className='text-xs py-1' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)', opacity: 0.5 }}>
                {ROMAN[currentIndex + 1 + i]}. {level.title[language]}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Daily words — last 14 days */}
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
