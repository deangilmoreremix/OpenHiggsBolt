import { describe, it, expect } from 'vitest'
import { parseScript, scriptToShots, extractCharacters, buildAnimaticTimeline, buildPitchDeckHtml, detectScriptFormat } from '../scriptPipeline'

const SCRIPT = `Title: T

EXT. CITY STREET - DAY

Rain hammers the skyline. MAYA runs toward a taxi.

MAYA
Wait! Hold the door!

INT. TAXI - CONTINUOUS

Maya looks at her phone.
`

describe('scriptPipeline', () => {
  const scenes = parseScript(SCRIPT)
  it('parses scenes and characters', () => {
    expect(scenes).toHaveLength(2)
    expect(scenes[0].location).toBe('CITY STREET')
    expect(extractCharacters(scenes).map((c) => c.name)).toEqual(['MAYA'])
  })
  it('parses FDX', () => {
    const xml = '<FinalDraft><Paragraph Type="Scene Heading"><Text>INT. LAB</Text></Paragraph><Paragraph Type="Action"><Text>A &amp; B.</Text></Paragraph></FinalDraft>'
    expect(detectScriptFormat(xml)).toBe('fdx')
    expect(parseScript(xml)[0].action[0]).toBe('A & B.')
  })
  it('maps onto the app camera taxonomy within clip limits', () => {
    const shots = scriptToShots(scenes)
    expect(shots[0].camera).toEqual({ shotType: 'Wide', movement: 'Pan Right' })
    expect(shots.every((s) => (s.duration as number) >= 1 && (s.duration as number) <= 8)).toBe(true)
    expect(scriptToShots(scenes, { maxShotsPerScene: 1 }).filter((s) => s.sceneNumber === 1)).toHaveLength(1)
  })
  it('builds a contiguous animatic timeline', () => {
    const tl = buildAnimaticTimeline(scriptToShots(scenes))
    tl.entries.slice(1).forEach((e, i) => expect(e.start).toBe(tl.entries[i].end))
    expect(tl.at(9999)!.index).toBe(tl.entries.length - 1)
  })
  it('escapes deck content and unsafe URLs', () => {
    const html = buildPitchDeckHtml({ title: '<i>x</i>', shots: [{ scene: '<script>1</script>', frameUrl: 'javascript:alert(1)' }] })
    expect(html).not.toContain('<script>1')
    expect(html).not.toContain('javascript:')
  })
})
