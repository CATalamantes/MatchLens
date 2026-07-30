// API-Football reports fixture state as short codes. The app used to test for
// invented strings like 'UPCOMING', which never matched anything the API sends
// — so every match fell through to the wrong branch. These helpers are the one
// place those codes are interpreted.

// In progress right now, in any form.
const LIVE_CODES = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT']

// Played to a result.
const FINISHED_CODES = ['FT', 'AET', 'PEN']

// Scheduled but not yet kicked off.
const UPCOMING_CODES = ['TBD', 'NS']

export const isLive = (status) => LIVE_CODES.includes(status)
export const isFinished = (status) => FINISHED_CODES.includes(status)
export const isUpcoming = (status) => UPCOMING_CODES.includes(status)

const LABELS = {
  TBD: 'TBD',
  NS: 'UPCOMING',
  HT: 'HALF-TIME',
  ET: 'EXTRA TIME',
  BT: 'BREAK',
  P: 'PENALTIES',
  SUSP: 'SUSPENDED',
  INT: 'INTERRUPTED',
  FT: 'FULL TIME',
  AET: 'AFTER EXTRA TIME',
  PEN: 'ON PENALTIES',
  PST: 'POSTPONED',
  CANC: 'CANCELLED',
  ABD: 'ABANDONED',
  AWD: 'AWARDED',
  WO: 'WALKOVER',
}

// A live match is more usefully labelled by its clock than its code.
export function statusLabel(status, minute) {
  if ((status === '1H' || status === '2H' || status === 'LIVE') && minute != null) {
    return `LIVE ${minute}'`
  }
  return LABELS[status] ?? status ?? ''
}
