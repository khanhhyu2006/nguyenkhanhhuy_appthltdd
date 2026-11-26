const dayMs = 86400000;
const atUtc = (date) => new Date(date + 'T00:00:00Z');
const isoDate = (date) => date.toISOString().slice(0, 10);

export function addDays(date, days) {
  return isoDate(new Date(atUtc(date).getTime() + days * dayMs));
}

export function daysBetween(start, end) {
  return Math.round((atUtc(end).getTime() - atUtc(start).getTime()) / dayMs);
}

export function addMonths(date, months) {
  const source = atUtc(date);
  const first = new Date(source);
  first.setUTCMonth(source.getUTCMonth() + months, 1);
  const last = new Date(first);
  last.setUTCMonth(first.getUTCMonth() + 1, 0);
  const lastDay = last.getUTCDate();
  first.setUTCDate(Math.min(source.getUTCDate(), lastDay));
  return isoDate(first);
}

export function monthBounds(month) {
  const start = month + '-01';
  return { start, end: addDays(addMonths(start, 1), -1), weekday: (atUtc(start).getUTCDay() + 6) % 7 };
}

const monthCycles = { monthly: 1, quarterly: 3, yearly: 12 };

export function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(atUtc(value).getTime()) && isoDate(atUtc(value)) === value;
}

function billingDayCycle(bill) {
  if (bill.cycle === 'weekly') return 7;
  if (bill.cycle === 'custom' && Number.isInteger(bill.customDays) && bill.customDays > 0) return bill.customDays;
  return 0;
}

function occurrenceDate(bill, index) {
  if (index === 0) return bill.next;
  const days = billingDayCycle(bill);
  if (days) return addDays(bill.next, days * index);
  const monthStart = atUtc(bill.next.slice(0, 7) + '-01');
  monthStart.setUTCMonth(monthStart.getUTCMonth() + (monthCycles[bill.cycle] ?? 1) * index);
  if (monthStart.getUTCFullYear() > 9999) return '';
  const target = isoDate(monthStart);
  const last = new Date(monthStart);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  const day = Math.min(bill.billingDay ?? Number(bill.next.slice(8)), last.getUTCDate());
  return target.slice(0, 8) + String(day).padStart(2, '0');
}

export function nextBillingDate(bill) {
  return occurrenceDate(bill, 1);
}

export function scheduledBills(bills, start, end) {
  return bills.flatMap((bill) => {
    if (bill.status !== 'active' || !isIsoDate(bill.next) || bill.next > end) return [];
    const dayCycle = billingDayCycle(bill);
    const monthCycle = monthCycles[bill.cycle] ?? 1;
    const useDays = Number.isInteger(dayCycle) && dayCycle > 0;
    const monthsFromStart = (Number(start.slice(0, 4)) - Number(bill.next.slice(0, 4))) * 12 +
      Number(start.slice(5, 7)) - Number(bill.next.slice(5, 7));
    let index = Math.max(0, useDays
      ? Math.ceil(daysBetween(bill.next, start) / dayCycle)
      : Math.floor(monthsFromStart / monthCycle));
    const occurrenceAt = (index) => occurrenceDate(bill, index);
    const occurrences = [];
    for (let date = occurrenceAt(index); isIsoDate(date) && date <= end; date = occurrenceAt(++index)) {
      if (date >= start) occurrences.push({ ...bill, next: date, trial: !!bill.trial && index === 0 });
    }
    return occurrences;
  }).sort((a, b) => a.next.localeCompare(b.next) || a.name.localeCompare(b.name));
}
