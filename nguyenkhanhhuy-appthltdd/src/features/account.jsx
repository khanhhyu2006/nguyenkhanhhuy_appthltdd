import { router, useLocalSearchParams } from 'expo-router';
import { Bell, CreditCard, Settings, Users, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Switch, Text, TextInput, View } from 'react-native';
import { AccountAccess } from './auth';
import { dateLabel, inVnd, money, today, useBills } from './bills';
import { monthSnapshot } from './finance-metrics';
import { syncRenewalReminders } from './reminders';
import { VietQr, vietQrPayload } from './vietqr';
import { Button, Card, Row, Screen, Section, color, s } from './ui';

const groupPath = (id) => ({ pathname: '/groups/[id]', params: { id } });
const qrPath = (id, member) => ({ pathname: '/groups/[id]/vietqr', params: { id, member: String(member) } });
const sampleGroup = (paid) => ({
  id: '1', name: 'YouTube Family', period: '11/2026', members: [
    { name: 'Khánh Huy', amount: 30000, paid: true },
    { name: 'Minh Anh', amount: 30000, paid },
  ],
});

export function Groups() {
  const { paid, groups } = useBills();
  return <Screen title="Chia tiền" subtitle="Theo dõi chi phí các gói dùng chung." action={<Button title="+ Tạo nhóm" href="/groups/new" />}>
    <Card>{[sampleGroup(paid), ...groups].map((group) => <Row key={group.id} icon={Users} title={group.name}
      detail={`Kỳ ${group.period} · ${group.members.length} thành viên`}
      end={`${group.members.filter((member) => member.paid).length}/${group.members.length} đã đóng`} href={groupPath(group.id)} />)}</Card>
  </Screen>;
}

export function CreateGroup() {
  const { bills, addGroup } = useBills();
  const [billId, setBillId] = useState('');
  const [names, setNames] = useState('');
  const [mode, setMode] = useState('equal');
  const [amounts, setAmounts] = useState('');
  const [error, setError] = useState('');
  const active = bills.filter((bill) => bill.status === 'active');
  const bill = active.find((item) => item.id === billId);
  const save = () => {
    const members = names.split(',').map((name) => name.trim()).filter(Boolean);
    if (!bill || members.length < 2) {
      setError('Chọn một gói và nhập ít nhất hai tên thành viên.');
      return;
    }
    const total = Math.round(inVnd(bill));
    const portion = Math.floor(total / members.length);
    const entered = amounts.split(',').map((item) => item.trim());
    if (mode === 'custom' && (entered.length !== members.length ||
        entered.some((item) => !/^\d+$/.test(item) || !Number.isSafeInteger(Number(item))) ||
        entered.reduce((sum, item) => sum + Number(item), 0) !== total)) {
      setError('Nhập một số tiền VND cho từng người theo đúng thứ tự. Tổng phải bằng ' + money(total) + '.');
      return;
    }
    const id = addGroup({ name: bill.name, mode, period: today().slice(0, 7).split('-').reverse().join('/'),
      members: members.map((name, index) => ({ name, paid: false, amount: mode === 'custom' ? Number(entered[index]) : portion + (index < total % members.length ? 1 : 0) })),
    });
    router.replace(groupPath(id));
  };
  return <Screen title="Tạo nhóm dùng chung" subtitle="Chia đều hoặc tự nhập phần tiền từng thành viên.">
    <Card style={s.inset}>
      <Text style={s.label}>Gói đăng ký</Text>
      <View style={s.wrap}>{active.map((item) => <Button key={item.id} title={item.name} subtle={item.id !== billId} onPress={() => setBillId(item.id)} />)}</View>
      {!active.length && <Text style={s.muted}>Hãy thêm một gói đang theo dõi để tạo nhóm.</Text>}
      {bill && <Text style={s.muted}>Tổng tiền một kỳ {money(Math.round(inVnd(bill)))}</Text>}
      <Text style={s.label}>Thành viên</Text>
      <TextInput style={s.input} value={names} onChangeText={setNames} placeholder="Khánh Huy, Minh Anh" placeholderTextColor={color.muted} accessibilityLabel="Tên thành viên, cách nhau bằng dấu phẩy" />
      <Text style={s.label}>Cách chia</Text>
      <View style={s.wrap}><Button title="Chia đều" subtle={mode !== 'equal'} onPress={() => setMode('equal')} />
        <Button title="Số tiền riêng" subtle={mode !== 'custom'} onPress={() => setMode('custom')} /></View>
      {mode === 'custom' ? <TextInput style={s.input} value={amounts} onChangeText={setAmounts}
        accessibilityLabel="Số tiền từng thành viên, cách nhau bằng dấu phẩy" placeholder="30000, 50000" placeholderTextColor={color.muted} /> : null}
      {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
      <Button title="Lưu nhóm" onPress={save} />
    </Card>
  </Screen>;
}

export function GroupDetail() {
  const { id } = useLocalSearchParams();
  const { paid, groups } = useBills();
  const group = id === '1' ? sampleGroup(paid) : groups.find((item) => item.id === id);
  if (!group) return <Screen title="Không tìm thấy nhóm"><Button title="Về danh sách nhóm" href="/groups" /></Screen>;
  return <Screen title={group.name} subtitle={(group.mode === 'custom' ? 'Số tiền riêng' : 'Chia đều') + ' · Kỳ ' + group.period}>
    <Section title="Thành viên"><Card>
      {group.members.map((member, index) => <Row key={index} icon={Users} title={member.name}
        detail={member.paid ? 'Đã đóng' : 'Chưa đóng'} end={money(member.amount)}
        href={id !== '1' || index === 1 ? qrPath(id, index) : undefined} />)}
    </Card></Section>
  </Screen>;
}
export function SplitPayment() {
  const { id, member: memberParam } = useLocalSearchParams();
  const { paid, setPaid, groups, toggleMemberPaid, recipients, saveRecipient } = useBills();
  const [bank, setBank] = useState(null);
  const [account, setAccount] = useState(null);
  const [qrError, setQrError] = useState('');
  const group = id === '1' ? sampleGroup(paid) : groups.find((item) => item.id === id);
  const index = Number(memberParam ?? 1);
  const member = group?.members[index];
  const recipient = recipients[id];
  const note = group ? ('BT ' + group.period.replace('/', '') + ' G' + String(id).slice(-8) + ' M' + (index + 1)) : '';
  const payload = member && recipient ? vietQrPayload(recipient.bank, recipient.account, member.amount, note) : null;
  if (!member || (id === '1' && index !== 1)) return <Screen title="Không tìm thấy khoản chia"><Button title="Về danh sách nhóm" href="/groups" /></Screen>;
  return <Screen title="Thanh toán nhóm" subtitle={`${group.name} · Kỳ ${group.period}`}>
    <Card style={s.inset}>
      {payload ? <VietQr payload={payload} /> : <Text style={s.muted}>Nhập tài khoản nhận tiền để tạo VietQR cho khoản đóng này.</Text>}
      <Text style={s.label}>Khoản đóng của {member.name}</Text><Text style={s.title}>{money(member.amount)}</Text>
      <Text style={s.muted}>Nội dung chuyển khoản</Text><Text selectable style={s.rowTitle}>{note}</Text>
      {member.amount > 0 ? <>
        <TextInput style={s.input} value={bank ?? recipient?.bank ?? ''} onChangeText={setBank} maxLength={6}
          keyboardType="number-pad" accessibilityLabel="Mã BIN ngân hàng" placeholder="Mã BIN ngân hàng (6 số)" placeholderTextColor={color.muted} />
        <TextInput style={s.input} value={account ?? recipient?.account ?? ''} onChangeText={setAccount} maxLength={19}
          keyboardType="number-pad" accessibilityLabel="Số tài khoản nhận tiền" placeholder="Số tài khoản nhận tiền" placeholderTextColor={color.muted} />
        <Button title="Tạo mã VietQR" subtle onPress={() => {
          const next = { bank: (bank ?? recipient?.bank ?? '').trim(), account: (account ?? recipient?.account ?? '').trim() };
          if (!vietQrPayload(next.bank, next.account, member.amount, note)) {
            setQrError('Kiểm tra BIN, số tài khoản và số tiền chuyển.');
            return;
          }
          setQrError('');
          saveRecipient(id, next);
        }} />
        {qrError ? <Text accessibilityRole="alert" style={s.error}>{qrError}</Text> : null}
        {payload ? <Text style={s.muted}>Đối chiếu tên người nhận trong ứng dụng ngân hàng trước khi chuyển.</Text> : null}
      </> : <Text style={s.muted}>Khoản chia này không cần chuyển khoản.</Text>}
      <Button title={member.paid ? 'Bỏ xác nhận đã nhận tiền' : 'Đánh dấu đã nhận tiền'}
        onPress={() => id === '1' ? setPaid(!paid) : toggleMemberPaid(id, index)} subtle={member.paid} />
    </Card>
  </Screen>;
}

export function Notifications() {
  const { bills, charges, monthlyBudget } = useBills();
  const current = today();
  const snapshot = monthSnapshot(bills, charges, current);
  const budgetOver = monthlyBudget ? Math.max(0, Math.round(snapshot.paid + snapshot.upcoming) - monthlyBudget) : 0;
  const items = bills.filter((bill) => bill.status === 'active' && (bill.oldPrice != null || (bill.next >= current && bill.trial)));
  return <Screen title="Thông báo" subtitle="Các sự kiện cần chú ý trong gói đang theo dõi." action={<Button title="Cài đặt" href="/notifications/settings" subtle />}>
    {budgetOver ? <Card><Row icon={Wallet} title="Dự kiến vượt ngân sách" end={money(budgetOver)} href="/dashboard/budget" /></Card> : null}
    {snapshot.overdue.length ? <Section title="Kỳ quá hạn chưa ghi nhận"><Card>
      {snapshot.overdue.map((bill) => <Row key={bill.id} icon={Bell} title={bill.name} detail={dateLabel(bill.next, true)}
        href={{ pathname: '/subscriptions/[id]', params: { id: bill.id } }} />)}
    </Card></Section> : null}
    <Card>{items.map((bill) => <Row key={bill.id} icon={Bell} title={bill.trial ? bill.name + ' sắp hết dùng thử' : bill.name + ' thay đổi giá'} detail={bill.trial ? dateLabel(bill.next, true) : money(bill.oldPrice, bill.currency) + ' → ' + money(bill.amount, bill.currency)} href={{ pathname: '/subscriptions/[id]', params: { id: bill.id } }} />)}
      {!items.length && <View style={s.inset}><Text style={s.muted}>Chưa có thông báo.</Text></View>}</Card>
  </Screen>;
}
export function ReminderSettings() {
  const { reminder, setReminder, bills, channels, toggleChannel, telegramId, saveTelegramId } = useBills();
  const [telegramInput, setTelegramInput] = useState(null);
  const [feedback, setFeedback] = useState('');
  return <Screen title="Cài đặt nhắc nhở" subtitle="Tùy chọn lưu trên thiết bị.">
    <Card style={s.inset}><View style={[s.wrap, { alignItems: 'center', justifyContent: 'space-between' }]}><Text style={s.rowTitle}>Nhắc trước ngày gia hạn</Text><Switch accessibilityLabel="Nhắc trước ngày gia hạn" value={reminder} onValueChange={setReminder} /></View>
      <Text style={s.muted}>{Platform.OS === 'web' ? 'Web hiển thị lịch nhắc. Thông báo trên thiết bị có trên Android và iOS.' : 'Cấp quyền để BillTrack gửi nhắc ngay trên thiết bị.'}</Text>
      {Platform.OS !== 'web' && reminder ? <Button title="Bật thông báo trên thiết bị" subtle onPress={async () => {
        try {
          const count = await syncRenewalReminders(bills, reminder && channels.includes('Push'), true);
          setFeedback(count == null ? 'Chưa được cấp quyền thông báo.' : 'Đã lên lịch ' + count + ' thông báo.');
        } catch { setFeedback('Không thể lên lịch thông báo trên thiết bị.'); }
      }} /> : null}
      {feedback ? <Text accessibilityLiveRegion="polite" style={s.muted}>{feedback}</Text> : null}
    </Card>
    <Section title="Telegram Chat ID"><Card style={s.inset}>
      <TextInput style={s.input} value={telegramInput ?? telegramId} onChangeText={setTelegramInput}
        accessibilityLabel="Telegram Chat ID" placeholder="Nhập Telegram Chat ID" placeholderTextColor={color.muted} maxLength={24} />
      <Button title="Lưu Chat ID" subtle onPress={() => {
        const value = (telegramInput ?? telegramId).trim();
        if (value && !/^-?\d{1,20}$/.test(value)) { setFeedback('Chat ID phải là một số nguyên.'); return; }
        saveTelegramId(value);
        setFeedback(value ? 'Đã lưu Telegram Chat ID.' : 'Đã xóa Telegram Chat ID.');
      }} />
      <Text style={s.muted}>Gửi nhắc qua Telegram cần kết nối bot từ máy chủ.</Text>
    </Card></Section>
    {reminder && <>
      <Section title="Kênh nhận thông báo"><Card style={s.inset}>
        <View style={s.wrap}>{['Push', 'Email', 'Telegram', 'Discord'].map((channel) => <Button key={channel} title={channel} subtle={!channels.includes(channel)} onPress={() => toggleChannel(channel)} />)}</View>
        <Text style={s.muted}>Lựa chọn minh họa được lưu trên thiết bị.</Text>
      </Card></Section>
      <Section title="Mốc nhắc của từng gói"><Card>{bills.filter((bill) => bill.status === 'active').map((bill) => {
        const days = (bill.reminders ?? [bill.remind ?? 3]).slice().sort((a, b) => a - b);
        return <Row key={bill.id} title={bill.name} icon={Bell} end={bill.trial ? 'Trước 24 giờ và 2 giờ' : days.length ? `Trước ${days.join(', ')} ngày` : 'Đã tắt'} href={{ pathname: '/subscriptions/[id]', params: { id: bill.id } }} />;
      })}</Card></Section>
    </>}
  </Screen>;
}

export function Profile() {
  return <Screen title="Tài khoản" subtitle="Thông tin tài khoản và tùy chọn BillTrack.">
    <AccountAccess />
    <Card>
      <Row icon={Settings} title="Thiết lập ban đầu" href="/auth/onboarding" />
      <Row icon={CreditCard} title="Nguồn thanh toán" href="/subscriptions/payment-methods" />
      <Row icon={Wallet} title="Ngân sách tháng" href="/dashboard/budget" />
      <Row icon={CreditCard} title="Lịch sử thanh toán" href="/dashboard/history" />
      <Row icon={Bell} title="Cài đặt nhắc nhở" href="/notifications/settings" />
    </Card>
  </Screen>;
}
export function Onboarding() {
  const [step, setStep] = useState(0);
  const steps = [
    ['Theo dõi chi phí', 'Xem số tiền ước tính mỗi tháng và mỗi năm.'],
    ['Quản lý kỳ gia hạn', 'Mở danh sách gói để tìm ngày gia hạn và ngày hết dùng thử.'],
    ['Thêm gói đầu tiên', 'Chọn mẫu dịch vụ hoặc nhập thủ công.'],
  ];
  return <Screen title="Bắt đầu với BillTrack">
    <Card style={s.inset}><Wallet color={color.accent} size={28} /><Text style={s.sectionTitle}>{steps[step][0]}</Text><Text style={s.muted}>{steps[step][1]}</Text>
      <Button title={step === steps.length - 1 ? 'Thêm gói' : 'Tiếp tục'} onPress={() => step === steps.length - 1 ? router.replace('/ingestion') : setStep(step + 1)} />
      {step > 0 && <Button title="Quay lại" subtle onPress={() => setStep(step - 1)} />}
    </Card>
  </Screen>;
}
