import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, LayoutGrid, Mail, ScanLine } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Switch, Text, TextInput, View } from 'react-native';
import { categories, cycles, money, templates, today, useBills } from './bills';
import { isIsoDate } from './schedule';
import { parseReceipt } from './receipt-parser';
import { recognizeReceipt } from './receipt-image';
import { getBrand, servicePlans } from './services';
import { Button, Card, Row, Screen, Section, color, s } from './ui';

export function Ingestion() {
  const { template, plan, receiptName, receiptAmount, receiptCurrency, receiptNext } = useLocalSearchParams();
  const base = templates.find((item) => item.name === template || item.name === receiptName);
  const selected = base ? servicePlans(base).find((item) => item.plan === plan) ?? base : undefined;
  const hasReceipt = [receiptName, receiptAmount, receiptCurrency, receiptNext].some((item) => typeof item === 'string');
  const draft = hasReceipt ? {
    name: typeof receiptName === 'string' ? receiptName : '',
    plan: selected?.plan,
    amount: typeof receiptAmount === 'string' && receiptAmount !== '' ? Number(receiptAmount) : undefined,
    currency: ['VND', 'USD', 'EUR'].includes(receiptCurrency) ? receiptCurrency : undefined,
    next: typeof receiptNext === 'string' ? receiptNext : '',
    category: selected?.category,
  } : selected;
  return <Screen title="Thêm gói đăng ký" subtitle="Lưu dịch vụ và ngày gia hạn để theo dõi chi phí.">
    <Card>
      <Row icon={LayoutGrid} title="Chọn mẫu dịch vụ" detail="Điền nhanh tên, danh mục và giá" href="/ingestion/templates" />
      <Row icon={ScanLine} title="Đọc ảnh hóa đơn" detail="Trích xuất văn bản ngay trên thiết bị" href="/ingestion/receipt-ocr" />
      <Row icon={Mail} title="Dán nội dung hóa đơn" href="/ingestion/email-alias" />
    </Card>
    <Section title="Thông tin gói"><BillForm key={JSON.stringify(draft) ?? 'manual'} selected={draft} /></Section>
  </Screen>;
}

export function EditSubscription() {
  const { id } = useLocalSearchParams();
  const { bills, loaded } = useBills();
  const bill = bills.find((item) => item.id === id);
  return <Screen title="Chỉnh sửa gói đăng ký" subtitle={bill?.name}>
    {!loaded ? <Text style={s.muted}>Đang đọc dữ liệu…</Text> : bill
      ? <BillForm key={bill.id} selected={bill} editing />
      : <Button title="Về danh sách gói" href="/subscriptions" />}
  </Screen>;
}

function BillForm({ selected, editing = false }) {
  const { add, update, paymentMethods, loaded } = useBills();
  const [name, setName] = useState(selected?.name ?? '');
  const [plan, setPlan] = useState(selected?.plan ?? '');
  const [amount, setAmount] = useState(selected?.amount == null ? '' : String(selected.amount));
  const [next, setNext] = useState(() => selected?.next ?? today());
  const [category, setCategory] = useState(selected?.category ?? 0);
  const [currency, setCurrency] = useState(selected?.currency ?? 'VND');
  const [cycle, setCycle] = useState(selected?.cycle ?? 'monthly');
  const [payment, setPayment] = useState(selected?.payment ?? null);
  const [trial, setTrial] = useState(!!selected?.trial);
  const [customDays, setCustomDays] = useState(() => selected?.customDays ? String(selected.customDays) : '');
  const [notes, setNotes] = useState(selected?.notes ?? '');
  const [error, setError] = useState('');
  const save = () => {
    if (!loaded) return;
    const value = Number(amount.trim().replace(',', '.'));
    if (cycle === 'custom' && (!/^\d+$/.test(customDays) || Number(customDays) < 1 || Number(customDays) > 999)) {
      setError('Nhập chu kỳ tùy chỉnh từ 1 đến 999 ngày.');
      return;
    }
    if (!name.trim() || !amount.trim() || !Number.isFinite(value) || value < 0 || value > 9999999999999.99 || !isIsoDate(next)) {
      setError('Nhập tên dịch vụ, số tiền hợp lệ và ngày theo dạng YYYY-MM-DD.');
      return;
    }
    const draft = { name: name.trim(), plan: plan.trim(), amount: value, next, category, currency, cycle, customDays: Number(customDays), payment, trial, notes: notes.trim() };
    let id;
    if (editing) {
      id = selected.id;
      const oldPrice = currency !== selected.currency ? null :
        value === selected.amount ? selected.oldPrice : selected.amount;
      update(id, { ...draft, oldPrice });
    } else {
      id = add({ ...draft, remind: trial ? 1 : 3 });
    }
    router.replace({ pathname: '/subscriptions/[id]', params: { id } });
  };
  const fields = [
    ['Tên dịch vụ', name, setName, { maxLength: 150 }],
    ['Tên gói (tùy chọn)', plan, setPlan, { maxLength: 120 }],
    ['Số tiền', amount, setAmount, { keyboardType: 'decimal-pad', maxLength: 17 }],
    ['Ngày gia hạn (YYYY-MM-DD)', next, setNext, { maxLength: 10 }],
  ];
  return <Card style={s.inset}>
    {fields.map(([label, value, change, props]) => <View key={label}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} accessibilityLabel={label} value={value} onChangeText={change} {...props} />
    </View>)}
    <Text style={s.label}>Tiền tệ</Text>
    <View style={s.wrap}>{['VND', 'USD', 'EUR'].map((item) => <Button key={item} title={item} subtle={currency !== item} onPress={() => setCurrency(item)} />)}</View>
    <Text style={s.label}>Chu kỳ</Text>
    <View style={s.wrap}>{Object.entries(cycles).map(([key, label]) => <Button key={key} title={label} subtle={cycle !== key} onPress={() => setCycle(key)} />)}</View>
    {cycle === 'custom' && <TextInput style={s.input} accessibilityLabel="Số ngày mỗi kỳ" placeholder="Số ngày mỗi kỳ" placeholderTextColor={color.muted} keyboardType="number-pad" value={customDays} onChangeText={setCustomDays} maxLength={3} />}
    <Text style={s.label}>Danh mục</Text>
    <View style={s.wrap}>{categories.map((name, index) => <Button key={name} title={name} subtle={category !== index} onPress={() => setCategory(index)} />)}</View>
    <Text style={s.label}>Nguồn thanh toán</Text>
    <View style={s.wrap}><Button title="Chưa chọn" subtle={payment !== null} onPress={() => setPayment(null)} />{paymentMethods.map((method) => <Button key={method.id} title={method.name} subtle={payment !== method.id} onPress={() => setPayment(method.id)} />)}</View>
    <View style={[s.wrap, { alignItems: 'center' }]}><Text style={s.label}>Đang dùng thử</Text><Switch value={trial} onValueChange={setTrial} accessibilityLabel="Đang dùng thử" trackColor={{ true: color.copper }} /></View>
    <Text style={s.label}>Ghi chú cá nhân</Text>
    <TextInput multiline style={[s.input, { minHeight: 72, paddingVertical: 8 }]} accessibilityLabel="Ghi chú cá nhân" value={notes} onChangeText={setNotes} maxLength={500} />
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    <Button title={editing ? 'Lưu thay đổi' : 'Lưu gói đăng ký'} onPress={save} />
  </Card>;
}

export function Templates() {
  return <Screen title="Kho mẫu dịch vụ" subtitle="Chọn một dịch vụ để điền nhanh thông tin.">
    <Text style={s.muted}>Giá và gói cước dùng dữ liệu mẫu.</Text>
    {templates.map((template) => {
      const brand = getBrand(template.name);
      return <Section key={template.name} title={template.name}><Card>{servicePlans(template).map((item) =>
        <Row key={item.plan} icon={LayoutGrid} mark={brand?.mark} tint={brand?.tint} title={item.plan} detail={categories[item.category]}
          end={money(item.amount, item.currency)} href={{ pathname: '/ingestion', params: { template: item.name, plan: item.plan } }} />
      )}</Card></Section>;
    })}
  </Screen>;
}

function ReceiptDraft({ text }) {
  const result = parseReceipt(text);
  const fields = [
    ['Tên dịch vụ', result.name],
    ['Số tiền', result.amount == null ? '—' : money(result.amount, result.currency)],
    ['Ngày gia hạn', result.next],
  ];
  const found = result.name || result.amount != null || result.next;
  const params = {
    receiptName: result.name ?? '',
    receiptAmount: result.amount == null ? '' : String(result.amount),
    receiptCurrency: result.currency ?? '',
    receiptNext: result.next ?? '',
  };
  return <Card style={s.inset}>
    {fields.map(([label, value]) => <Text key={label} style={s.rowTitle}>{label} · {value || '—'}</Text>)}
    <Text style={s.muted}>Kiểm tra dữ liệu và bổ sung các trường còn thiếu trước khi lưu.</Text>
    {found ? <Button title="Điền vào form thêm gói" href={{ pathname: '/ingestion', params }} /> :
      <Text style={s.error}>Chưa tìm được tên, số tiền hoặc ngày gia hạn.</Text>}
  </Card>;
}

export function Receipt() {
  const [image, setImage] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
      if (!result.canceled) { setImage(result.assets[0].uri); setError(''); setText(''); }
    } catch {
      setError('Không thể mở thư viện ảnh.');
    }
  };
  const scan = async () => {
    setBusy(true);
    setError('');
    try {
      const recognized = await recognizeReceipt(image);
      setText(recognized);
      if (!recognized.trim()) setError('Không đọc được chữ trong ảnh.');
    } catch (error) {
      setError(error?.code === 'OCR_UNAVAILABLE' ? 'Quét ảnh trên thiết bị cần bản development build. Bạn có thể dán văn bản hóa đơn ngay.' : 'Không đọc được ảnh hóa đơn. Hãy thử ảnh rõ hơn.');
    } finally {
      setBusy(false);
    }
  };
  return <Screen title="Ảnh hóa đơn" subtitle="Đọc văn bản từ ảnh rồi kiểm tra trước khi lưu.">
    <Card style={s.inset}>
      {image ? <Image accessibilityLabel="Ảnh hóa đơn đã chọn" source={{ uri: image }} style={{ width: '100%', height: 245 }} resizeMode="contain" /> : <Camera color={color.accent} size={35} />}
      {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
      {busy ? <Text accessibilityLiveRegion="polite" style={s.muted}>Đang đọc ảnh…</Text> : <>
        <Button title={image ? 'Đổi ảnh' : 'Chọn ảnh hóa đơn'} onPress={pick} />
        {image ? <Button title="Đọc văn bản trong ảnh" onPress={scan} /> : null}
      </>}
      <Button title="Nhập thông tin thủ công" subtle href="/ingestion" />
    </Card>
    {text ? <Section title="Thông tin trích xuất"><ReceiptDraft text={text} /></Section> : null}
    <Section title="Kết quả đọc hóa đơn mẫu"><Card style={s.inset}>
      <Text style={s.rowTitle}>Netflix · Tiêu chuẩn</Text>
      <Text style={s.muted}>220.000 ₫ / tháng · Dữ liệu minh họa</Text>
      <Button title="Dùng kết quả mẫu để điền form" href={{ pathname: '/ingestion', params: { template: 'Netflix' } }} />
    </Card></Section>
  </Screen>;
}

export function Email() {
  const [status, setStatus] = useState('');
  const [receipt, setReceipt] = useState('');
  const [parsed, setParsed] = useState('');
  const alias = 'billtrack.demo@example.com';
  return <Screen title="Hóa đơn qua email">
    <Section title="Dán nội dung hóa đơn"><Card style={s.inset}>
      <TextInput multiline style={[s.input, { minHeight: 110, paddingVertical: 10, textAlignVertical: 'top' }]}
        value={receipt} onChangeText={setReceipt} accessibilityLabel="Nội dung hóa đơn" placeholder="Dán tên dịch vụ, số tiền và ngày gia hạn"
        placeholderTextColor={color.muted} maxLength={12000} />
      <Button title="Trích xuất thông tin" onPress={() => setParsed(receipt.trim())} />
    </Card></Section>
    {parsed ? <Section title="Thông tin trích xuất"><ReceiptDraft text={parsed} /></Section> : null}
    <Card style={s.inset}>
      <Text style={s.label}>Địa chỉ minh họa</Text><Text selectable style={s.muted}>{alias}</Text>
      <Button title="Sao chép địa chỉ mẫu" subtle onPress={async () => {
        try { setStatus(await Clipboard.setStringAsync(alias) ? 'Đã sao chép địa chỉ mẫu.' : 'Không thể sao chép.'); }
        catch { setStatus('Không thể sao chép.'); }
      }} />
      {status ? <Text accessibilityLiveRegion="polite" style={s.muted}>{status}</Text> : null}
    </Card>
    <Section title="Lịch sử bóc tách mẫu"><Card><Row icon={Mail} title="Hóa đơn ChatGPT Plus" detail="Email · 24/11/2026" end="Đã xử lý" href={{ pathname: '/ingestion', params: { template: 'ChatGPT Plus' } }} /></Card></Section>
  </Screen>;
}
