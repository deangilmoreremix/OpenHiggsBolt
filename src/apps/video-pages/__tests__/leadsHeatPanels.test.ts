import { describe, it, expect } from 'vitest'
import { leadsCsv } from '../LeadsTab'
import { peopleRows } from '../HeatPanel'

describe('Leads tab and heat panel helpers', () => {
  it('builds a quoted CSV with the contact each lead came from', () => {
    const csv = leadsCsv([{ id: '1', contactId: 'c1', who: 'Dana W', createdAt: 't', answers: { email: 'd@x.co', note: 'say "hi"' } }, { id: '2', contactId: null, who: 'Direct visit', createdAt: 't2', answers: { email: 'z@x.co' } }])
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('"When","Who","Personal link","email","note"')
    expect(lines[1]).toBe('"t","Dana W","c1","d@x.co","say ""hi"""')
    expect(lines[2]).toBe('"t2","Direct visit","","z@x.co",""')
    expect(leadsCsv([])).toBe('')
  })
  it('joins heat, event counts and leads into one row per personal link, newest first', () => {
    const rows = peopleRows(
      [{ contactId: 'c1', sessions: 2, clicks: 3, maxScroll: 80, watchedSeconds: 41, lastSeen: '2026-11-17T10:00:00Z' }],
      [{ contactId: 'c1', views: 2, plays: 1, completes: 1, leads: 1, lastSeen: '2026-11-17T09:00:00Z' }, { contactId: 'c2', views: 1, plays: 0, completes: 0, leads: 0, lastSeen: '2026-11-18T09:00:00Z' }],
      [{ id: 'c1', fields: { firstname: 'Dana', lastname: 'Whitfield' } }, { id: 'c2', fields: { company: 'Acme' } }],
    )
    expect(rows.map((r) => r.contactId)).toEqual(['c2', 'c1'])
    expect(rows.find((r) => r.contactId === 'c1')).toMatchObject({ who: 'Dana Whitfield', watchedSeconds: 41, maxScroll: 80, clicks: 3, leads: 1 })
    expect(rows.find((r) => r.contactId === 'c2')).toMatchObject({ who: 'Acme', watchedSeconds: 0 })
  })
})
