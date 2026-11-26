import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, CreditCard, History, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { dateLabel, money, today, useBills } from './bills';
import { monthSnapshot } from './finance-metrics';
import { addMonths, isIsoDate, nextBillingDate } from './schedule';
import { Button, Card, Row, Screen, Section, color, s } from './ui';

const monthLabel = (month) => month.slice(5) + '/' + month.slice(0, 4);
const detailPath = (id) => ({ pathname: '/subscriptions/[id]', params: { id } });
const textInput = (label, value, onChangeText, extra = {}) =>
  <View><Text style={s.label}>{label}</Text>
    <TextInput style={s.input} accessibilityLabel={label} value={value} onChangeText={onChangeText} {...extra} />
  </View>;

export function RecordPayment() {
  const { id, period } = useLocalSearchParams();
  const { bills, charges, loaded, recordCharge } = useBills();
  const bill = bills.find((item) => item.id === id);
  const available = loaded && bill?.status === 'active' && bill.next === period &&
    isIsoDate(period) && !charges.some((item) => item.id === id + ':' + period);
  return <Screen title="Ghi nhận thanh toán" subtitle={bill?.name}>
    {!loaded ? <Text style={s.muted}>Đang đọc dữ liệu…</Text> : available
      ? <ChargeForm key={id + ':' + period} bill={bill} onSave={recordCharge} />
      : <Card style={s.inset}><Text style={s.muted}>Kỳ này đã thay đổi hoặc đã được ghi nhận.</Text>
        <Button title="Về gói đăng ký" href={bill ? detailPath(bill.id) : '/subscriptions'} /></Card>}
  </Screen>;
}

function ChargeForm({ bill, onSave }) {
  const [price, setPrice] = useState(() => String(bill.amount));
  const [paidAt, setPaidAt] = useState(today);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const following = nextBillingDate(bill);

  const save = () => {
    const input = price.trim().replace(',', '.');
    if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(input) || !isIsoDate(paidAt) || paidAt > today() || !isIsoDate(following)) {
      setError('Nhập số tiền hợp lệ và ngày thanh toán không sau hôm nay.');
      return;
    }
    onSave(bill.id, bill.next, Number(input), paidAt, note.trim());
    router.replace(detailPath(bill.id));
  };

  return <Card style={s.inset}>
    <Text style={s.rowTitle}>Kỳ đến hạn {dateLabel(bill.next, true)}</Text>
    <Text style={s.muted}>Sau khi ghi nhận, ngày gia hạn tiếp theo là {dateLabel(following, true)}.</Text>
    {textInput('Số tiền đã trả (' + bill.currency + ')', price, setPrice, { keyboardType: 'decimal-pad', maxLength: 15 })}
    {textInput('Ngày thanh toán (YYYY-MM-DD)', paidAt, setPaidAt, { maxLength: 10 })}
    {textInput('Ghi chú thanh toán', note, setNote, { maxLength: 500 })}
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    <Button title="Lưu thanh toán" onPress={save} />
  </Card>;
}

const csvCell = (value) => {
  const text = String(value ?? '');
  const safe = /^\s*[=+@-]|^[\t\r\n]/.test(text) ? "'" + text : text;
  return '"' + safe.replaceAll('"', '""') + '"';
};

export function ChargeHistory() {
  const { id } = useLocalSearchParams();
  const { charges, bills } = useBills();
  const [month, setMonth] = useState(() => today().slice(0, 7));
  const [feedback, setFeedback] = useState('');
  const filtered = charges.filter((item) => item.paidAt.startsWith(month) && (!id || item.billId === id))
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  const total = filtered.reduce((sum, item) => sum + item.amountVnd, 0);
  const bill = bills.find((item) => item.id === id);
  const changeMonth = (offset) => {
    setMonth(addMonths(month + '-01', offset).slice(0, 7));
    setFeedback('');
  };
  const copy = async () => {
    const rows = [['Dịch vụ', 'Ngày thanh toán', 'Kỳ đến hạn', 'Số tiền', 'Tiền tệ', 'Quy đổi VND', 'Nguồn thanh toán', 'Ghi chú'],
      ...filtered.map((item) => [item.name, item.paidAt, item.period, item.amount, item.currency, Math.round(item.amountVnd), item.paymentName, item.note])];
    try {
      const copied = await Clipboard.setStringAsync(rows.map((row) => row.map(csvCell).join(',')).join('\r\n'));
      setFeedback(copied ? 'Đã sao chép dữ liệu CSV.' : 'Không thể sao chép dữ liệu.');
    } catch {
      setFeedback('Không thể sao chép dữ liệu.');
    }
  };
  return <Screen title="Lịch sử thanh toán" subtitle={bill ? bill.name : 'Các khoản bạn đã ghi nhận trên thiết bị.'}>
    <Card style={s.inset}>
      <View style={[s.wrap, { justifyContent: 'space-between', alignItems: 'center' }]}>
        <Button title="Tháng trước" subtle onPress={() => changeMonth(-1)} />
        <Text style={s.sectionTitle}>{monthLabel(month)}</Text>
        {month < today().slice(0, 7) ? <Button title="Tháng sau" subtle onPress={() => changeMonth(1)} /> : null}
      </View>
      <Text style={s.label}>Tổng đã trả</Text><Text style={s.title}>{money(Math.round(total))}</Text>
      <Text style={s.muted}>{filtered.length} khoản thanh toán</Text>
      {filtered.length ? <Button title="Sao chép CSV" subtle onPress={copy} /> : null}
      {feedback ? <Text style={s.muted} accessibilityLiveRegion="polite">{feedback}</Text> : null}
    </Card>
    <Card>{filtered.length ? filtered.map((item) => <Row key={item.id} icon={History} title={item.name}
      detail={[dateLabel(item.paidAt, true), item.paymentName, item.note].filter(Boolean).join(' · ')}
      end={money(item.amount, item.currency)} href={detailPath(item.billId)} />) :
      <View style={s.inset}><Text style={s.muted}>Chưa có khoản thanh toán trong tháng này.</Text></View>}</Card>
  </Screen>;
}

export function MonthlyBudget() {
  const { bills, charges, monthlyBudget, setMonthlyBudget, loaded } = useBills();
  const [input, setInput] = useState(null);
  const [feedback, setFeedback] = useState('');
  const numbers = monthSnapshot(bills, charges, today());
  const forecast = Math.round(numbers.paid + numbers.upcoming);
  const difference = monthlyBudget - forecast;
  const value = input ?? (monthlyBudget ? String(monthlyBudget) : '');
  return <Screen title="Ngân sách tháng" subtitle="So sánh hạn mức với khoản đã trả và các kỳ sắp đến hạn.">
    <Card style={s.inset}>
      <Wallet size={25} color={color.accent} />
      <Text style={s.label}>Dự kiến chi trong tháng</Text><Text style={s.title}>{money(forecast)}</Text>
      {monthlyBudget ? <Text style={difference < 0 ? s.error : s.muted}>
        {difference < 0 ? 'Dự kiến vượt ' : 'Dự kiến còn '}{money(Math.abs(difference))}
      </Text> : <Text style={s.muted}>Bạn chưa đặt hạn mức.</Text>}
    </Card>
    <Card>
      <Row icon={CreditCard} title="Đã thanh toán" end={money(Math.round(numbers.paid))} href="/dashboard/history" />
      <Row icon={CalendarDays} title="Còn dự kiến trả" end={money(Math.round(numbers.upcoming))} href="/dashboard/calendar" />
    </Card>
    <Section title="Đặt hạn mức"><Card style={s.inset}>
      {textInput('Hạn mức mỗi tháng (VND)', value, setInput, { keyboardType: 'number-pad', maxLength: 12, placeholder: 'Ví dụ: 1000000', placeholderTextColor: color.muted })}
      <Button title="Lưu hạn mức" onPress={() => {
        if (!loaded) return;
        if (!/^\d{1,12}$/.test(value) || Number(value) <= 0) { setFeedback('Nhập hạn mức VND lớn hơn 0.'); return; }
        setMonthlyBudget(Number(value));
        setInput(null);
        setFeedback('Đã lưu hạn mức tháng.');
      }} />
      {monthlyBudget ? <Button title="Bỏ hạn mức" subtle onPress={() => {
        setMonthlyBudget(0);
        setInput(null);
        setFeedback('Đã bỏ hạn mức.');
      }} /> : null}
      {feedback ? <Text style={s.muted} accessibilityLiveRegion="polite">{feedback}</Text> : null}
    </Card></Section>
  </Screen>;
}
