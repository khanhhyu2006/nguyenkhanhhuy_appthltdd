import { ArrowUpRight, CalendarDays, ChartNoAxesCombined, CircleAlert, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { CalendarSync, MonthCalendar } from './calendar';
import { monthSnapshot } from './finance-metrics';
import { addDays, daysBetween, scheduledBills } from './schedule';
import { categories, dateLabel, money, monthly, today, useBills } from './bills';
import { BillRow, Button, Card, Row, Screen, Section, color, s } from './ui';

export function Dashboard() {
  const { bills, charges, monthlyBudget } = useBills();
  const active = bills.filter((bill) => bill.status === 'active');
  const forecast = active.reduce((total, bill) => total + monthly(bill), 0);
  const current = today();
  const [view, setView] = useState('list');
  const upcoming = scheduledBills(bills, current, addDays(current, 6)).slice(0, 5);
  const trial = active.filter((bill) => bill.trial && bill.next >= current)
    .sort((a, b) => a.next.localeCompare(b.next))[0];
  const daysLeft = trial ? daysBetween(current, trial.next) : null;
  const snapshot = monthSnapshot(bills, charges, current);
  const monthTotal = Math.round(snapshot.paid + snapshot.upcoming);
  const budgetDiff = monthlyBudget - monthTotal;
  const wide = useWindowDimensions().width >= 850;
  return <Screen title="Tổng quan" subtitle="Theo dõi chi phí định kỳ và các kỳ gia hạn." action={<Button title="+ Thêm gói" href="/ingestion" />}>
    {trial ? <Card style={d.trial}>
      <View style={d.trialHeader}><CircleAlert size={22} color="#A23A21" />
        <View style={s.rowLabel}><Text style={s.rowTitle}>{trial.name} {trial.plan}</Text>
          <Text style={d.trialLabel}>{daysLeft === 0 ? 'Hết dùng thử hôm nay' : 'Còn ' + daysLeft + ' ngày dùng thử'}</Text></View>
        <Button title="Chi tiết" subtle href={{ pathname: '/subscriptions/[id]', params: { id: trial.id } }} />
      </View>
      <View style={d.chartTrack} accessible accessibilityLabel="Mức độ cận hạn trong 7 ngày">
        <View style={[d.chartFill, { backgroundColor: '#BE5338', width: Math.max(0, (7 - daysLeft) * 100 / 7) + '%' }]} />
      </View>
      <Text style={s.muted}>Hết dùng thử ngày {dateLabel(trial.next, true)}</Text>
    </Card> : <Card style={s.inset}><Text style={s.muted}>Không có gói dùng thử sắp hết hạn.</Text></Card>}
    <View style={d.hero}>
      <View style={d.ring} pointerEvents="none" />
      <Wallet color={color.bg} size={26} />
      <Text style={d.heroLabel}>Chi phí dự kiến tháng này</Text>
      <Text style={d.amount}>{money(Math.round(monthTotal))}</Text>
      <View style={d.heroDetails}><Text style={d.heroLabel}>{active.length} gói đang theo dõi</Text><Text style={d.heroLabel}>≈ {money(Math.round(forecast * 12))} / năm</Text></View>
    </View>
    <Card>
      <Row icon={CalendarDays} title="Kỳ gia hạn còn lại tháng này" detail={snapshot.planned.length + ' kỳ · Tỷ giá mẫu'} end={money(Math.round(snapshot.upcoming))} href="/dashboard/calendar" />
      <Row icon={Wallet} title="Đã thanh toán trong tháng" end={money(Math.round(snapshot.paid))} href="/dashboard/history" />
      <Row icon={ChartNoAxesCombined} title="Ngân sách tháng" detail={monthlyBudget ? (budgetDiff < 0 ? 'Dự kiến vượt ' : 'Dự kiến còn ') + money(Math.abs(budgetDiff)) : 'Đặt hạn mức chi mỗi tháng'}
        badge={monthlyBudget && budgetDiff < 0 ? 'Vượt ngân sách' : undefined} href="/dashboard/budget" />
    </Card>
    {snapshot.overdue.length ? <Section title="Kỳ quá hạn chưa ghi nhận"><Card>
      {snapshot.overdue.slice(0, 5).map((bill) => <Row key={bill.id} icon={CircleAlert} title={bill.name}
        detail={'Đến hạn ' + dateLabel(bill.next, true)} href={{ pathname: '/subscriptions/[id]', params: { id: bill.id } }} />)}
    </Card></Section> : null}
    <View style={[d.columns, wide && { flexDirection: 'row' }]}>
      <View style={d.mainColumn}>
        <Section title="Sắp thanh toán" action={<Button title="Lịch đầy đủ" subtle href="/dashboard/calendar" />}>
          <View style={s.wrap}>
            <Button title="Danh sách 7 ngày" subtle={view !== 'list'} onPress={() => setView('list')} />
            <Button title="Lịch tháng" subtle={view !== 'calendar'} onPress={() => setView('calendar')} />
          </View>
          {view === 'calendar' ? <MonthCalendar bills={bills} /> : <Card>{upcoming.length
            ? upcoming.map((bill) => <BillRow key={bill.id + bill.next} bill={bill} showPayment />)
            : <View style={s.inset}><Text style={s.muted}>Không có kỳ thanh toán trong 7 ngày tới.</Text></View>}</Card>}
        </Section>
      </View>
      <View style={d.secondaryColumn}>
        <Section title="Phân tích">
          <Card>
            <Row icon={ChartNoAxesCombined} title="Phân bổ chi phí" detail="Theo danh mục dịch vụ" href="/dashboard/overlap" />
            <Row icon={ArrowUpRight} title="Giả lập tiết kiệm" detail="Ước tính khi ngừng theo dõi gói" href="/dashboard/what-if" />
            <Row icon={CalendarDays} title="Nhắc trước kỳ hạn" detail="Quản lý tùy chọn nhắc nhở" href="/notifications/settings" />
          </Card>
        </Section>
      </View>
    </View>
  </Screen>;
}

export function RenewalCalendar() {
  const { bills } = useBills();
  return <Screen title="Lịch gia hạn" subtitle="Chọn ngày có dấu chấm để xem các khoản đến hạn.">
    <MonthCalendar bills={bills} />
    <Section title="Đồng bộ lịch"><CalendarSync /></Section>
  </Screen>;
}

export function Overlap() {
  const { bills } = useBills();
  const active = bills.filter((bill) => bill.status === 'active');
  const total = active.reduce((sum, bill) => sum + monthly(bill), 0);
  const functions = [
    ['Nghe nhạc', /spotify|apple music|youtube music/i],
    ['Xem phim và video', /netflix|disney|hbo|prime video/i],
    ['Lưu trữ đám mây', /icloud|google one|dropbox|onedrive/i],
    ['Trợ lý AI', /chatgpt|claude|gemini|copilot/i],
  ];
  const duplicates = functions.map(([name, pattern]) => ({
    name,
    bills: active.filter((bill) => pattern.test(bill.name)),
  })).filter((group) => new Set(group.bills.map((bill) => bill.name.trim().toLowerCase())).size > 1);
  return <Screen title="Phân bổ chi phí" subtitle="Chi phí ước tính mỗi tháng theo danh mục.">
    <Card style={s.inset}>{categories.map((name, index) => {
      const subtotal = active.filter((bill) => bill.category === index).reduce((sum, bill) => sum + monthly(bill), 0);
      const share = total ? Math.round(subtotal * 100 / total) : 0;
      return <View key={name} style={d.chartItem}>
        <View style={d.chartLabel}><Text style={s.rowTitle}>{name}</Text><Text style={s.rowEnd}>{money(Math.round(subtotal))}</Text></View>
        <View style={d.chartTrack} accessible accessibilityLabel={`${name}, ${share}% tổng chi phí`}><View style={[d.chartFill, { width: `${share}%` }]} /></View>
      </View>;
    })}</Card>
    <Section title="Dịch vụ có thể trùng chức năng">
      <Card>{duplicates.map((group) => <Row key={group.name} icon={ChartNoAxesCombined} title={group.name} detail={group.bills.map((bill) => bill.name).join(' · ')} />)}
      {!duplicates.length && <View style={s.inset}><Text style={s.muted}>Chưa phát hiện dịch vụ có thể trùng chức năng.</Text></View>}</Card>
    </Section>
    <Section title="Gói cần xem lại">
      <Card>{active.filter((bill) => bill.unused).map((bill) => <BillRow key={bill.id} bill={bill} />)}
      {!active.some((bill) => bill.unused) && <View style={s.inset}><Text style={s.muted}>Chưa có gói được đánh dấu ít sử dụng.</Text></View>}</Card>
    </Section>
  </Screen>;
}

export function Simulator() {
  const { bills } = useBills();
  const [selected, setSelected] = useState([]);
  const active = bills.filter((bill) => bill.status === 'active');
  const saving = active.filter((bill) => selected.includes(bill.id)).reduce((sum, bill) => sum + monthly(bill), 0);
  return <Screen title="Giả lập tiết kiệm" subtitle="Chọn các gói để tính số tiền có thể tiết kiệm.">
    <View style={d.hero}><Text style={d.heroLabel}>Tiết kiệm ước tính mỗi năm</Text><Text style={d.amount}>{money(Math.round(saving * 12))}</Text><Text style={d.heroLabel}>{money(Math.round(saving * 36))} trong 3 năm</Text></View>
    <Card style={s.inset}>{active.map((bill) => {
      const checked = selected.includes(bill.id);
      return <Button key={bill.id} title={(checked ? '✓ ' : '+ ') + bill.name} subtle={!checked} onPress={() => setSelected((prev) => checked ? prev.filter((id) => id !== bill.id) : [...prev, bill.id])} />;
    })}{!active.length && <Text style={s.muted}>Bạn chưa có gói đang theo dõi.</Text>}</Card>
  </Screen>;
}

const d = StyleSheet.create({
  hero: { overflow: 'hidden', minHeight: 189, justifyContent: 'center', padding: 22, borderRadius: 22, backgroundColor: color.accent, gap: 8 },
  ring: { position: 'absolute', width: 310, height: 310, borderRadius: 160, borderWidth: 38, borderColor: '#ffffff14', right: -57, top: -100 },
  heroLabel: { color: color.bg, fontSize: 13, fontWeight: '600' },
  amount: { color: '#fff', fontSize: 39, fontWeight: '800', letterSpacing: -1.2 },
  heroDetails: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  trial: { gap: 8, backgroundColor: '#FBE2D5', borderColor: '#F1B9A4', padding: 14 },
  trialHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trialLabel: { color: '#96371F', fontWeight: '700' },
  chartItem: { gap: 7, paddingVertical: 5 },
  chartLabel: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  chartTrack: { height: 8, backgroundColor: color.soft, borderRadius: 4, overflow: 'hidden' },
  chartFill: { height: '100%', backgroundColor: color.copper },
  columns: { gap: 15 },
  mainColumn: { flex: 1.25, minWidth: 0 },
  secondaryColumn: { flex: 1, minWidth: 0 },
});
