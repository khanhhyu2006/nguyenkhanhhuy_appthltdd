import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { syncRenewalReminders } from './reminders';
import { addDays, isIsoDate, nextBillingDate } from './schedule';

export const categories = ['Giải trí', 'Âm nhạc', 'AI & Công việc', 'Lưu trữ Cloud', 'Tên miền / Hosting'];
export const cycles = { weekly: 'Tuần', monthly: 'Tháng', quarterly: 'Quý', yearly: 'Năm', custom: 'Tùy chỉnh' };
export const cycleLabel = (bill) => bill.cycle === 'custom' ? `${bill.customDays} ngày` : cycles[bill.cycle];
export const statusNames = { active: 'Đang theo dõi', paused: 'Tạm dừng', cancelled: 'Đã hủy' };
export const templates = [
  { name: 'Netflix', plan: 'Tiêu chuẩn', amount: 220000, category: 0 },
  { name: 'YouTube Premium', plan: 'Family', amount: 149000, category: 0 },
  { name: 'ChatGPT Plus', plan: 'Plus', amount: 20, currency: 'USD', category: 2 },
  { name: 'Spotify', plan: 'Individual', amount: 59000, category: 1 },
  { name: 'iCloud+', plan: '200 GB', amount: 69000, category: 3 },
  { name: 'Apple Music', plan: 'Cá nhân', amount: 65000, category: 1 },
  { name: 'Google One', plan: '100 GB', amount: 45000, category: 3 },
  { name: 'Adobe', plan: 'Creative Cloud', amount: 34.99, currency: 'USD', category: 2 },
];
const defaultPaymentMethods = [
  { id: 1, name: 'Techcombank Visa Platinum', type: 'Thẻ ngân hàng', ending: '4512' },
  { id: 2, name: 'Ví điện tử MoMo', type: 'Ví điện tử', ending: '8899' },
  { id: 3, name: 'Vietcombank', type: 'Tài khoản ngân hàng', ending: '2608' },
];

const demoStart = today();
const initial = [
  { ...templates[1], id: '1', next: addDays(demoStart, 5), payment: 1 },
  { ...templates[2], id: '2', next: addDays(demoStart, 12), payment: 1, oldPrice: 18 },
  { ...templates[3], id: '3', next: addDays(demoStart, 6), payment: 2, unused: true, remind: 2 },
  { ...templates[4], id: '4', next: addDays(demoStart, 2), payment: 1, trial: true, remind: 1 },
  { ...templates[5], id: '5', next: addDays(demoStart, 18), payment: 2 },
].map((bill) => ({ currency: 'VND', cycle: 'monthly', status: 'active', remind: 3, ...bill }));

const Context = createContext(null);
const key = 'billtrack.mobile.v1';
const defaults = { bills: initial, reminder: true, paid: false, channels: ['Push'], groups: [], lockedPayments: {}, telegramId: '', calendarUrl: '', recipients: {}, paymentMethods: defaultPaymentMethods, charges: [], monthlyBudget: 0 };
const currencyFormat = new Intl.NumberFormat('vi-VN');

export function money(amount, currency = 'VND') {
  return currencyFormat.format(amount) + (currency === 'VND' ? ' ₫' : ' ' + currency);
}
export function monthly(bill) {
  if (bill.cycle === 'custom' && bill.customDays > 0) return inVnd(bill) * 365 / 12 / bill.customDays;
  return inVnd(bill) * ({ weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 }[bill.cycle] ?? 1);
}
export function inVnd(bill) {
  const demoRates = { USD: 25450, EUR: 27800 };
  return bill.amount * (demoRates[bill.currency] ?? 1);
}
export function dateLabel(date, year = false) {
  if (!date) return 'Chưa đặt ngày';
  const [y, m, d] = date.split('-');
  return year ? [d, m, y].join('/') : [d, m].join('/');
}
export function today() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
}
export function BillProvider({ children }) {
  const [state, setState] = useState(defaults);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(key).then((raw) => {
      if (raw && alive) setState({ ...defaults, ...JSON.parse(raw) });
    }).catch(() => {}).finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (loaded) AsyncStorage.setItem(key, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);
  const { bills, reminder, channels } = state;
  useEffect(() => {
    if (loaded && Platform.OS !== 'web') syncRenewalReminders(bills, reminder && channels.includes('Push')).catch(() => {});
  }, [loaded, bills, reminder, channels]);
  const add = (bill) => {
    const id = String(Date.now());
    setState((prev) => ({ ...prev, bills: [...prev.bills, { status: 'active', ...bill, id }] }));
    return id;
  };
  const update = (id, change) => setState((prev) => ({
    ...prev, bills: prev.bills.map((bill) => {
      if (bill.id !== id) return bill;
      const next = { ...bill, ...change };
      if (bill.next !== next.next || bill.cycle !== next.cycle) delete next.billingDay;
      return next;
    }),
  }));
  function recordCharge(id, period, amount, paidAt, note) {
    setState((prev) => {
      const bill = prev.bills.find((item) => item.id === id);
      const chargeId = id + ':' + period;
      if (!bill || bill.status !== 'active' || bill.next !== period || !isIsoDate(period) ||
        !isIsoDate(paidAt) || paidAt > today() || !Number.isFinite(amount) || amount < 0 ||
        prev.charges.some((charge) => charge.id === chargeId)) return prev;
      const next = nextBillingDate(bill);
      if (!isIsoDate(next)) return prev;
      const charge = {
        id: chargeId, billId: id, name: bill.name, period, paidAt, amount, note,
        currency: bill.currency, amountVnd: inVnd({ ...bill, amount }),
        paymentName: prev.paymentMethods.find((method) => method.id === bill.payment)?.name,
      };
      return { ...prev, charges: [charge, ...prev.charges], bills: prev.bills.map((item) => item.id === id ?
        { ...item, next, trial: false, billingDay: item.billingDay ?? Number(period.slice(8)) } : item) };
    });
  }
  function addPaymentMethod(method) {
    setState((prev) => {
      const duplicate = prev.paymentMethods.some((item) => item.name.toLowerCase() === method.name.toLowerCase() &&
        item.type === method.type && item.ending === method.ending);
      if (duplicate) return prev;
      const id = prev.paymentMethods.reduce((highest, item) => Math.max(highest, item.id), 0) + 1;
      return { ...prev, paymentMethods: [...prev.paymentMethods, { ...method, id }] };
    });
  }
  const addGroup = (group) => {
    const id = String(Date.now());
    setState((prev) => ({ ...prev, groups: [...prev.groups, { ...group, id }] }));
    return id;
  };
  return <Context.Provider value={{
    ...state, add, update, recordCharge, addPaymentMethod,
    setMonthlyBudget: (monthlyBudget) => setState((prev) => ({ ...prev, monthlyBudget })),
    loaded,
    saveRecipient: (id, recipient) => setState((prev) => ({ ...prev, recipients: { ...prev.recipients, [id]: recipient } })),
    saveCalendarUrl: (calendarUrl) => setState((prev) => ({ ...prev, calendarUrl })),
    saveTelegramId: (telegramId) => setState((prev) => ({ ...prev, telegramId })),
    setPaymentLocked: (id, locked) => setState((prev) => ({ ...prev, lockedPayments: { ...prev.lockedPayments, [id]: locked } })),
    setReminder: (reminder) => setState((prev) => ({ ...prev, reminder })),
    toggleChannel: (channel) => setState((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel) ? prev.channels.filter((item) => item !== channel) : [...prev.channels, channel],
    })),
    setPaid: (paid) => setState((prev) => ({ ...prev, paid })),
    addGroup,
    toggleMemberPaid: (groupId, memberIndex) => setState((prev) => ({
      ...prev,
      groups: prev.groups.map((group) => group.id === groupId ? {
        ...group,
        members: group.members.map((member, index) => index === memberIndex ? { ...member, paid: !member.paid } : member),
      } : group),
    })),
  }}>{children}</Context.Provider>;
}
export const useBills = () => useContext(Context);
