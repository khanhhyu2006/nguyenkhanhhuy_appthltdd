import { Platform } from 'react-native';
import { addDays, scheduledBills } from './schedule';

const prefix = 'billtrack-renewal-';
const channel = 'billtrack-renewals';
let queue = Promise.resolve();
let handlerConfigured = false;

async function applySchedule(bills, enabled, requestPermission) {
  if (Platform.OS === 'web') return null;
  const api = await import('expo-notifications');
  if (enabled && Platform.OS === 'android') {
    await api.setNotificationChannelAsync(channel, {
      name: 'Nhắc gia hạn BillTrack',
      importance: api.AndroidImportance.DEFAULT,
    });
  }
  let permission = await api.getPermissionsAsync();
  if (enabled && requestPermission && !permission.granted && permission.canAskAgain) {
    permission = await api.requestPermissionsAsync();
  }
  const authorized = permission.granted || permission.ios?.status === api.IosAuthorizationStatus.PROVISIONAL;
  if (enabled && !authorized) return null;
  if (enabled && !handlerConfigured) {
    api.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false,
      }),
    });
    handlerConfigured = true;
  }

  const now = new Date();
  const start = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  const events = enabled ? scheduledBills(bills, start, addDays(start, 395)) : [];
  const desired = events.flatMap((bill) => {
    const hours = bill.trial ? [24, 2] : (bill.reminders ?? [bill.remind ?? 3]).map((days) => days * 24);
    return [...new Set(hours)].filter((hour) => Number.isInteger(hour) && hour > 0 && hour <= 365 * 24)
      .map((hour) => ({
        id: prefix + bill.id + '-' + bill.next + '-' + hour + '-' + Number(bill.trial),
        date: new Date(new Date(bill.next + 'T09:00:00').getTime() - hour * 3600000),
        bill,
      }));
  }).filter((entry) => entry.date > now)
    .sort((a, b) => a.date - b.date).slice(0, 48);
  const scheduled = (await api.getAllScheduledNotificationsAsync()).filter((item) => item.identifier.startsWith(prefix));
  const desiredIds = new Set(desired.map((item) => item.id));
  const existing = new Set(scheduled.map((item) => item.identifier));
  for (const item of scheduled) {
    if (!desiredIds.has(item.identifier)) await api.cancelScheduledNotificationAsync(item.identifier);
  }
  for (const { id, date, bill } of desired) {
    if (existing.has(id)) continue;
    await api.scheduleNotificationAsync({
      identifier: id,
      content: {
        title: bill.trial ? 'Sắp hết dùng thử' : 'Sắp đến kỳ gia hạn',
        body: bill.name + ' · ' + bill.next,
        data: { billId: bill.id },
      },
      trigger: { type: api.SchedulableTriggerInputTypes.DATE, date, channelId: channel },
    });
  }
  return desired.length;
}

export function syncRenewalReminders(bills, enabled, requestPermission = false) {
  const operation = queue.then(() => applySchedule(bills, enabled, requestPermission));
  queue = operation.catch(() => {});
  return operation;
}
