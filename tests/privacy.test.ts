/**
 * v1.0.1 — privacy disclosures match the actual data flow (audit P0.1/P0.2).
 *
 * The v1.0.0 UI claimed "answers stay in your browser / nothing is submitted
 * unless you ask for a consultation" while POSTing every answer to
 * /api/generate. These tests pin the corrected language to the real flow so
 * the mismatch can never silently return.
 *
 * Static assertions read the source files; behavioral assertions live in
 * tests/gemini.test.ts (declined AI = no fetch) and tests/consultation.test.ts.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(__dirname, '..')
const read = (p: string) => readFileSync(resolve(root, p), 'utf8')

describe('the public pages never claim the app is fully local', () => {
  const files = ['src/App.tsx', 'src/components/Landing.tsx', 'src/components/quiz/Quiz.tsx', 'src/components/ConsultationForm.tsx']

  it('the v1.0.0 misleading phrases are gone from every public-facing file', () => {
    for (const f of files) {
      const src = read(f)
      expect(src, f).not.toMatch(/answers stay in your browser/i)
      expect(src, f).not.toMatch(/nothing is submitted/i)
      expect(src, f).not.toMatch(/everything stays on this page/i)
      expect(src, f).not.toMatch(/never sold, never shared/i)
    }
  })

  it('every public-facing file links the real /privacy route', () => {
    for (const f of files) {
      expect(read(f), `${f} must link /privacy`).toContain('href="/privacy"')
    }
  })

  it('the footer states the true data flow in plain language', () => {
    const app = read('src/App.tsx')
    expect(app).toContain('submitted for processing when you generate your blueprint')
    expect(app).toContain('processed by Google Gemini')
  })

  it('a privacy notice with the AI choice appears BEFORE submission on the last question', () => {
    const quiz = read('src/components/quiz/Quiz.tsx')
    expect(quiz).toContain('Before your blueprint is built')
    expect(quiz).toContain('sends your answers over the internet to the WebThangs server')
    expect(quiz).toContain('allowAi')
    expect(quiz).toMatch(/AI personalization is off by default/)
    // the notice renders on the final screen only
    expect(quiz).toContain('index === visible.length - 1')
  })

  it('the analysis screen no longer pretends nothing is transmitted', () => {
    const app = read('src/App.tsx')
    expect(app).toContain('Your answers are being processed to build your blueprint')
  })

  it('no invented development contact address exists anywhere in the client', () => {
    const srcs = [...files, 'src/lib/api.ts']
    for (const f of srcs) {
      expect(read(f), f).not.toMatch(/webthangs\.example/)
      expect(read(f), f).not.toMatch(/privacy@|hello@/)
    }
  })

  it('the consultation consent text is accurate about processing and storage', () => {
    const form = read('src/components/ConsultationForm.tsx')
    expect(form).toContain('Privacy Policy')
    expect(form).toContain('Google Gemini processing if I opted in')
    expect(form).toContain('stored\n              in WebThangs’ request database when one is configured')
  })

  it('the client sends answers to the server only through the documented endpoints', () => {
    const api = read('src/lib/api.ts')
    expect(api).toContain("fetch('/api/generate'")
    expect(api).toContain("fetch('/api/consultation'")
    expect(api).toMatch(/aiPersonalization === true/)
    // declined AI short-circuits before any fetch
    expect(api.indexOf('if (!allowAi)')).toBeLessThan(api.indexOf("fetch('/api/generate'"))
  })

  it('the server forwards answers to Gemini ONLY after the explicit opt-in', () => {
    const gen = read('functions/api/generate.ts')
    expect(gen).toContain('body.ai === false')
    expect(gen.indexOf('body.ai === false')).toBeLessThan(gen.indexOf('generatePersonalization('))
  })
})

describe('P0.2 — the Privacy Policy is a real, public, built page', () => {
  it('privacy.html exists as a first-class Vite entry', () => {
    expect(existsSync(resolve(root, 'privacy.html'))).toBe(true)
    const cfg = read('vite.config.ts')
    expect(cfg).toContain('privacy.html')
    expect(cfg).toContain('rollupOptions')
  })

  it('the policy source contains every required disclosure', () => {
    const page = read('src/components/PrivacyPage.tsx')
    const required = [
      'What the questionnaire collects',
      'What happens when you generate a blueprint',
      'Google Gemini (optional AI personalization)',
      'When it happens',
      'What is sent',
      'If you decline',
      'If Gemini is unavailable or fails',
      'Consultation requests',
      'Cloudflare',
      'request database',
      'If storage or notification fails',
      'Third parties involved',
      'What we do not do',
      'Retention and deletion',
      'Security',
      'Contact',
      'launch blocker',
      'CONTACT_EMAIL',
      'DRAFT',
      'legal review',
      'not directed at children'
    ]
    for (const needle of required) {
      expect(page, `policy must mention: ${needle}`).toContain(needle)
    }
  })

  it('the policy does not invent retention periods, compliance, or addresses', () => {
    const page = read('src/components/PrivacyPage.tsx')
    expect(page).not.toMatch(/GDPR compliant|we comply with GDPR|CCPA compliant/i)
    expect(page).not.toMatch(/deleted within \d+ days|retained for \d+ days/i)
    expect(page).not.toMatch(/mailto:/)
  })

  it('docs/PRIVACY.md stays in the repository and agrees with the page', () => {
    const doc = read('docs/PRIVACY.md')
    expect(doc.toLowerCase()).toContain('draft')
    expect(doc).toContain('Gemini')
    expect(doc).toContain('CONTACT_EMAIL')
    expect(doc).not.toMatch(/answers stay in your browser/i)
  })
})

describe('production output carries the privacy page (run after `npm run build`)', () => {
  it('dist/privacy.html exists and is wired to its compiled chunk when the build is present', () => {
    const dist = resolve(root, 'dist')
    if (!existsSync(dist)) {
      console.warn('dist/ not built yet — run `npm run build`; this assertion is enforced by the delivery checklist')
      return
    }
    const privacyPath = resolve(dist, 'privacy.html')
    expect(existsSync(privacyPath)).toBe(true)
    const html = readFileSync(privacyPath, 'utf8')
    expect(html).toContain('Privacy Policy')
    // Vite rewrote the module source to a hashed compiled chunk
    const chunkMatch = html.match(/\/assets\/privacy-[A-Za-z0-9_-]+\.js/)
    expect(chunkMatch).toBeTruthy()
    expect(existsSync(resolve(dist, chunkMatch![0].replace(/^\//, '')))).toBe(true)
  })
})
