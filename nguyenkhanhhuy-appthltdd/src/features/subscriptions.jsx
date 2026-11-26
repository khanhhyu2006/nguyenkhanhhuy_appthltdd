import { openURL } from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { Bell, CalendarDays, CreditCard, History, Layers } from 'lucide-react-native';
import { useState } from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import { categories, cycleLabel, dateLabel, inVnd, money, statusNames, today, useBills } from './bills';
import { addDays, scheduledBills } from './schedule';
import { getBrand } from './services';
import { BillRow, Button, Card, Row, Screen, Section, color, s } from './ui';

export function SubscriptionList() {
  const { bills, paymentMethods } = useBills();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState(null);
  const [payment, setPayment] = useState(null);
  const filters = { all: 'Tất cả', active: 'Đang theo dõi', trial: 'Dùng thử', paused: 'Tạm dừng', cancelled: 'Đã hủy' };
  const visible = bills.filter((bill) => bill.name.toLowerCase().includes(query.trim().toLowerCase()) &&
    (filter === 'all' || (filter === 'trial' ? bill.trial && bill.status === 'active' : bill.status === filter)) &&
    (category === null || bill.category === category) && (payment === null || bill.payment === payment));
  return <Screen title="Gói đăng ký" subtitle={bills.length + ' gói đã lưu'} action={<Button title="+ Thêm gói" href="/ingestion" />}>
    <TextInput style={s.input} value={query} onChangeText={setQuery} accessibilityLabel="Tìm gói" placeholder="Tìm theo tên dịch vụ" placeholderTextColor={color.muted} />
    <View style={s.wrap}>{Object.entries(filters).map(([key, title]) => <Button key={key} title={title} subtle={key !== filter} onPress={() => setFilter(key)} />)}</View>
    <Card style={s.inset}>
      <Text style={s.label}>Danh mục</Text>
      <View style={s.wrap}><Button title="Mọi danh mục" subtle={category !== null} onPress={() => setCategory(null)} />
        {categories.map((label, index) => <Button key={label} title={label} subtle={category !== index} onPress={() => setCategory(index)} />)}</View>
      <Text style={s.label}>Nguồn thanh toán</Text>
      <View style={s.wrap}><Button title="Mọi nguồn" subtle={payment !== null} onPress={() => setPayment(null)} />
        {paymentMethods.map((method) => <Button key={method.id} title={method.name} subtle={payment !== method.id} onPress={() => setPayment(method.id)} />)}</View>
    </Card>
    <Card>{visible.map((bill) => <BillRow key={bill.id} bill={bill} />)}{!visible.length && <View style={s.inset}><Text style={s.muted}>Không có gói phù hợp.</Text></View>}</Card>
    <Button title="Nguồn thanh toán" subtle href="/subscriptions/payment-methods" />
  </Screen>;
}

export function SubscriptionDetail() {
  const { id } = useLocalSearchParams();
  const { bills, charges, update, paymentMethods } = useBills();
  const [cancelError, setCancelError] = useState('');
  const [customReminder, setCustomReminder] = useState('');
  const bill = bills.find((item) => item.id === id);
  if (!bill) return <Screen title="Không tìm thấy gói"><Button title="Về danh sách" href="/subscriptions" /></Screen>;
  const latest = charges.find((item) => item.billId === bill.id);
  const method = paymentMethods.find((entry) => entry.id === bill.payment);
  const brand = getBrand(bill.name);
  const cancelUrl = brand?.official_cancel_url;
  const increase = bill.oldPrice != null && bill.amount > bill.oldPrice;
  const reminders = bill.reminders ?? [bill.remind ?? 3];
  const reminderOptions = [...new Set([1, 3, 7, 14, ...reminders])].sort((a, b) => a - b);
  return <Screen title={bill.name} subtitle={bill.plan || categories[bill.category]} action={<Button title="Danh sách" subtle href="/subscriptions" />}>
    <Card style={s.inset}><Text style={s.muted}>{bill.trial && bill.status === 'active' ? 'Đang dùng thử' : statusNames[bill.status]}</Text><Text style={s.title}>{money(bill.amount, bill.currency)}</Text><Text style={s.muted}>Mỗi {cycleLabel(bill)?.toLowerCase()}</Text></Card>
    <Card>
      <Row icon={CalendarDays} title={bill.trial ? 'Hết dùng thử' : 'Gia hạn tiếp theo'} end={dateLabel(bill.next, true)} />
      <Row icon={Layers} title="Danh mục" end={categories[bill.category]} />
      <Row icon={CreditCard} title="Nguồn thanh toán" detail={method?.name ?? 'Chưa chọn'} href="/subscriptions/payment-methods" />
    </Card>
    <View style={s.wrap}>
      <Button title="Sửa thông tin gói" href={{ pathname: '/subscriptions/edit', params: { id } }} />
      {bill.status === 'active' ? <Button title="Ghi nhận thanh toán" href={{ pathname: '/subscriptions/record', params: { id, period: bill.next } }} /> : null}
      <Button title="Lịch sử chi riêng" subtle href={{ pathname: '/dashboard/history', params: { id } }} />
    </View>
    {bill.notes ? <Card style={s.inset}><Text style={s.label}>Ghi chú cá nhân</Text><Text style={s.muted}>{bill.notes}</Text></Card> : null}
    {latest ? <Card><Row icon={History} title="Lần thanh toán gần nhất" detail={dateLabel(latest.paidAt, true)} end={money(latest.amount, latest.currency)} /></Card> : null}
    {increase ? <Section title="Lịch sử hóa đơn · Tăng giá"><Card>
      <Row icon={History} title="Kỳ trước" end={money(bill.oldPrice, bill.currency)} />
      <Row icon={History} title="Kỳ hiện tại" end={money(bill.amount, bill.currency)} />
    </Card></Section> : null}
    {cancelUrl ? <Section title="Hủy gói tại nhà cung cấp"><Card style={s.inset}>
      {brand.instructions.map((instruction, index) => <Text key={instruction} style={s.muted}>{index + 1}. {instruction}</Text>)}
      <Button title="Mở trang hủy chính thức" onPress={async () => {
        setCancelError('');
        try { await openURL(cancelUrl); } catch { setCancelError('Không mở được liên kết hủy.'); }
      }} />
      {cancelError ? <Text accessibilityRole="alert" style={s.error}>{cancelError}</Text> : null}
    </Card></Section> : null}
    <Section title="Mốc nhắc trước kỳ hạn"><Card style={s.inset}>
      <Bell size={20} color={color.accent} />
      {bill.trial ? <Text style={s.muted}>Gói dùng thử nhắc trước 24 giờ và 2 giờ.</Text> : <>
      <TextInput style={s.input} keyboardType="number-pad" maxLength={3} accessibilityLabel="Số ngày nhắc tùy chỉnh" placeholder="Số ngày nhắc tùy chỉnh" placeholderTextColor={color.muted} value={customReminder} onChangeText={setCustomReminder} />
      <Button title="Thêm mốc nhắc" subtle onPress={() => {
        const days = Number(customReminder);
        if (Number.isInteger(days) && days >= 1 && days <= 365) {
          update(bill.id, { reminders: [...new Set([...reminders, days])] });
          setCustomReminder('');
        }
      }} />
      <View style={s.wrap}>{reminderOptions.map((days) => <Button key={days} title={`${days} ngày`} subtle={!reminders.includes(days)} onPress={() => update(bill.id, {
        reminders: reminders.includes(days) ? reminders.filter((value) => value !== days) : [...reminders, days],
      })} />)}</View></>}
    </Card></Section>
    <Section title="Mức độ sử dụng"><Card style={s.inset}>
      <Text style={s.muted}>{bill.unused ? 'Đang được đánh dấu ít sử dụng.' : 'Trong tháng qua bạn có dùng gói này không?'}</Text>
      <View style={s.wrap}><Button title="Có sử dụng" subtle={bill.unused !== false} onPress={() => update(bill.id, { unused: false })} />
        <Button title="Ít sử dụng" subtle={!bill.unused} onPress={() => update(bill.id, { unused: true })} /></View>
    </Card></Section>
    {bill.status !== 'cancelled' ? <Button title="Đánh dấu đã hủy trong BillTrack" subtle onPress={() => update(bill.id, { status: 'cancelled' })} /> : null}
    <Button title={bill.status === 'active' ? 'Tạm dừng theo dõi' : 'Tiếp tục theo dõi'} subtle onPress={() => update(bill.id, { status: bill.status === 'active' ? 'paused' : 'active' })} />
  </Screen>;
}

export function Payments() {
  const { bills, lockedPayments, setPaymentLocked, paymentMethods, addPaymentMethod, loaded } = useBills();
  const [name, setName] = useState('');
  const [type, setType] = useState('Thẻ ngân hàng');
  const [ending, setEnding] = useState('');
  const [methodFeedback, setMethodFeedback] = useState('');
  const current = today();
  const scheduled = scheduledBills(bills, current, addDays(current, 29));
  return <Screen title="Nguồn thanh toán" subtitle="Dự kiến thanh toán trong 30 ngày. Trạng thái khóa chỉ được ghi nhận trong BillTrack.">
    <Section title="Thêm nguồn thanh toán"><Card style={s.inset}>
      <TextInput style={s.input} accessibilityLabel="Tên nguồn thanh toán" placeholder="Ví dụ: Visa cá nhân"
        placeholderTextColor={color.muted} value={name} onChangeText={setName} maxLength={60} />
      <View style={s.wrap}>{['Thẻ ngân hàng', 'Tài khoản ngân hàng', 'Ví điện tử'].map((item) =>
        <Button key={item} title={item} subtle={type !== item} onPress={() => setType(item)} />)}</View>
      <TextInput style={s.input} accessibilityLabel="Bốn số cuối" placeholder="Bốn số cuối (tùy chọn)"
        placeholderTextColor={color.muted} maxLength={4} keyboardType="number-pad" value={ending} onChangeText={setEnding} />
      <Button title="Lưu nguồn thanh toán" onPress={() => {
        if (!loaded) return;
        const label = name.trim();
        if (!label || (ending && !/^\d{4}$/.test(ending))) {
          setMethodFeedback('Nhập tên và đúng bốn số cuối nếu có.');
        } else if (paymentMethods.some((item) => item.name.toLowerCase() === label.toLowerCase() && item.type === type && item.ending === ending)) {
          setMethodFeedback('Nguồn thanh toán này đã có.');
        } else {
          addPaymentMethod({ name: label, type, ending });
          setMethodFeedback('Đã lưu nguồn thanh toán.');
          setName('');
          setEnding('');
        }
      }} />
      {methodFeedback ? <Text style={s.muted} accessibilityLiveRegion="polite">{methodFeedback}</Text> : null}
    </Card></Section>
    {paymentMethods.map((item) => {
      const total = scheduled.filter((bill) => bill.payment === item.id).reduce((sum, bill) => sum + inVnd(bill), 0);
      return <Card key={item.id}>
        <Row icon={CreditCard} title={item.name} detail={item.ending ? item.type + ' · •••• ' + item.ending : item.type} end={money(Math.round(total))} />
        <View style={[s.inset, s.wrap, { alignItems: 'center', justifyContent: 'space-between' }]}>
          <Text style={s.rowTitle}>{lockedPayments[item.id] ? 'Đang khóa thẻ' : 'Đánh dấu đang khóa thẻ'}</Text>
          <Switch accessibilityLabel={'Trạng thái khóa ' + item.name} value={!!lockedPayments[item.id]} onValueChange={(locked) => setPaymentLocked(item.id, locked)} trackColor={{ true: color.copper }} />
        </View>
      </Card>;
    })}
  </Screen>;
}
