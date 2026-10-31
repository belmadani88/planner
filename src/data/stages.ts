/**
 * The Universal Home-Services Operating Model — 11 stages from first contact
 * to completed work, payment and an ongoing customer relationship.
 *
 * This is the intellectual backbone shared by every industry; industry
 * configs layer variations on top (see industries.ts stageNotes).
 */

export interface StageDef {
  id: number
  name: string
  shortName: string
  purpose: string
  whatGoodLooksLike: string
}

export const STAGES: StageDef[] = [
  {
    id: 1,
    name: 'Attract customers',
    shortName: 'Attract',
    purpose: 'How new customers find out your company exists.',
    whatGoodLooksLike:
      'You know which channels (search, ads, referrals, repeat customers) actually bring you paying customers — not just clicks.'
  },
  {
    id: 2,
    name: 'Receive customer inquiries',
    shortName: 'Receive',
    purpose: 'How potential customers actually reach you — calls, forms, messages, referrals.',
    whatGoodLooksLike:
      'Every inquiry lands in one captured place. Nothing lives only in a voicemail box or an unread Facebook message.'
  },
  {
    id: 3,
    name: 'Respond and qualify',
    shortName: 'Respond',
    purpose: 'Answering fast, understanding the problem and deciding if the job fits you.',
    whatGoodLooksLike:
      'New inquiries get a human response within minutes, urgent jobs are spotted immediately, and someone owns every lead.'
  },
  {
    id: 4,
    name: 'Book an appointment or inspection',
    shortName: 'Book',
    purpose: 'Turning an interested caller into a scheduled visit.',
    whatGoodLooksLike:
      'Appointments are booked while the customer is still on the phone, confirmed automatically, and rarely no-show.'
  },
  {
    id: 5,
    name: 'Prepare and send an estimate',
    shortName: 'Estimate',
    purpose: 'Evaluating the work and putting a clear price in the customer’s hands.',
    whatGoodLooksLike:
      'Professional, itemized estimates go out fast from templates — and every estimate is recorded and followable.'
  },
  {
    id: 6,
    name: 'Follow up and win the job',
    shortName: 'Follow up',
    purpose: 'Winning the quotes you already earned the chance to send.',
    whatGoodLooksLike:
      'Every open estimate has a next follow-up date. Nobody has to remember to chase anything — reminders fire by themselves.'
  },
  {
    id: 7,
    name: 'Schedule and assign work',
    shortName: 'Schedule',
    purpose: 'Getting the right technician, equipment and materials to the right job.',
    whatGoodLooksLike:
      'One calendar shows technician availability, job priority and travel — changes don’t happen over scattered text threads.'
  },
  {
    id: 8,
    name: 'Perform and manage the job',
    shortName: 'Perform',
    purpose: 'Doing the work well and recording what was done.',
    whatGoodLooksLike:
      'Customers know when the tech is coming, work is documented with photos and notes, and completion triggers the next step.'
  },
  {
    id: 9,
    name: 'Invoice and collect payment',
    shortName: 'Invoice',
    purpose: 'Turning finished work into money in the bank.',
    whatGoodLooksLike:
      'Invoices go out the day work completes, customers can pay by text link, and overdue balances get automatic reminders.'
  },
  {
    id: 10,
    name: 'After-service relationship',
    shortName: 'After-service',
    purpose: 'Reviews, maintenance plans, warranties and repeat business.',
    whatGoodLooksLike:
      'Every completed job triggers a review request and a future touchpoint; past customers hear from you before they need you.'
  },
  {
    id: 11,
    name: 'Measure business performance',
    shortName: 'Measure',
    purpose: 'Knowing what is working: leads, close rates, revenue, productivity.',
    whatGoodLooksLike:
      'A weekly one-page scorecard answers: how many leads, how fast did we respond, what did we win, what do customers owe us.'
  }
]

export const STAGES_BY_ID: Record<number, StageDef> = Object.fromEntries(
  STAGES.map((s) => [s.id, s])
)

export function stageName(id: number): string {
  return STAGES_BY_ID[id]?.name ?? `Stage ${id}`
}
