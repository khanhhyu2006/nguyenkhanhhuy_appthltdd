import { inVnd } from './bills';
import { isIsoDate, monthBounds, scheduledBills } from './schedule';

export function monthSnapshot(bills, charges, current) {
  const month = current.slice(0, 7);
  const { end } = monthBounds(month);
  const planned = scheduledBills(bills, current, end);
  const paid = charges.filter((item) => item.paidAt.startsWith(month)).reduce((sum, item) => sum + item.amountVnd, 0);
  const upcoming = planned.reduce((sum, item) => sum + inVnd(item), 0);
  const overdue = bills.filter((item) => item.status === 'active' && isIsoDate(item.next) && item.next < current)
    .sort((a, b) => a.next.localeCompare(b.next));
  return { planned, paid, upcoming, overdue };
}
