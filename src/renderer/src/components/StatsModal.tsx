import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import useEditorStore from '../store/editor-store'
import { useT } from '../i18n/strings'

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

function StatRow({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <div className='flex items-baseline justify-between py-2' style={{ borderBottom: '1px solid var(--color-border)' }}>
      <span className='text-xs' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)' }}>
        {label}
      </span>
      <span style={{ color: 'var(--color-prose)', fontFamily: 'var(--font-prose)', fontSize: '1.1rem' }}>
        {value.toLocaleString()}
      </span>
    </div>
  )
}

export default function StatsModal({ onClose }: { onClose: () => void }): JSX.Element {
  const t = useT()
  const { sceneWordCount, sessionWordsAtOpen, projectWordCount } = useEditorStore()
  const [dailyWords, setDailyWords] = useState<Record<string, number>>({})

  useEffect(() => {
    window.api.getAllDailyWords().then(setDailyWords).catch(() => {})
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  const sessionCount = Math.max(0, sceneWordCount - sessionWordsAtOpen)
  const days = lastFourteenDays(dailyWords)
  const maxDay = Math.max(1, ...days.map(d => d.words))
  const todayWords = days[days.length - 1].words
  const allTime = Object.values(dailyWords).reduce((sum, n) => sum + n, 0)

  return (
    <div
      data-modal='stats'
      className='fixed inset-0 flex items-center justify-center'
      style={{ background: 'rgba(0,0,0,0.5)', zIndex: 50 }}
      onClick={onClose}
    >
      <div
        className='rounded-lg px-6 py-5'
        style={{
          width: 380,
          background: 'var(--color-chrome)',
          border: '1px solid var(--color-border)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className='flex items-center justify-between pb-3'>
          <h2 className='text-xs uppercase tracking-wider' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)' }}>
            {t('statsTitle')}
          </h2>
          <button
            onClick={onClose}
            title={t('close')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-dim)', fontSize: 16, lineHeight: 1, padding: 0,
            }}
          >
            ×
          </button>
        </div>

        <StatRow label={t('statsToday')} value={todayWords} />
        <StatRow label={t('statsSession')} value={sessionCount} />
        <StatRow label={t('statsScene')} value={sceneWordCount} />
        <StatRow label={t('statsProject')} value={projectWordCount} />
        <StatRow label={t('statsAllTime')} value={allTime} />

        <p className='text-xs pt-4 pb-2 uppercase tracking-wider' style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-ui)', opacity: 0.6 }}>
          {t('journeyLast14')}
        </p>
        <div className='flex items-end gap-1' style={{ height: 48 }}>
          {days.map((day, i) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.words}`}
              className='flex-1'
              style={{
                height: Math.max(2, (day.words / maxDay) * 48),
                background: i === days.length - 1 ? 'var(--color-accent)' : 'var(--color-border)',
                borderRadius: 1,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
