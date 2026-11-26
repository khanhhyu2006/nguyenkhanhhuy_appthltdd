import { router, usePathname } from 'expo-router';
import { ArrowLeft, Bell, ChevronRight, Cloud, Cpu, House, Layers, Music2, Plus, ReceiptText, Tv, Users } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBrand } from './services';
import { cycleLabel, dateLabel, money, useBills } from './bills';

export const color = {
  bg: '#F9EBDD', ink: '#39251F', muted: '#785340', accent: '#8B2E2E',
  copper: '#B67F52', soft: '#F3DFCB', line: '#E5CBBA', white: '#FFF9F1',
};
const links = [
  ['/', 'Tổng quan', House],
  ['/subscriptions', 'Gói đăng ký', Layers],
  ['/ingestion', 'Thêm gói', Plus],
  ['/groups', 'Chia tiền', Users],
  ['/notifications', 'Thông báo', Bell],
];

export function Button({ title, href, onPress, subtle = false }) {
  const button = <Pressable accessibilityRole={href ? 'link' : 'button'} onPress={href ? () => router.push(href) : onPress} style={({ pressed }) => [s.button, subtle && s.subtle, pressed && s.pressed]}>
    <Text style={[s.buttonText, subtle && { color: color.accent }]}>{title}</Text>
  </Pressable>;
  return button;
}

export function Screen({ title, subtitle, children, action }) {
  const path = usePathname();
  const wide = useWindowDimensions().width >= 850;
  const isMain = links.some(([href]) => href === path);
  const nav = <View style={[s.nav, wide && s.sideNav]}>
    {links.map(([href, label, Icon]) => {
      const active = href === '/' ? path === '/' || path.startsWith('/dashboard') : path.startsWith(href);
      return (
        <Pressable key={href} onPress={() => router.replace(href)} accessibilityRole="link" accessibilityState={{ selected: active }} style={StyleSheet.flatten([s.navItem, wide && s.sideItem, active && s.selected])}>
          <Icon size={19} color={active ? color.accent : color.muted} />
          <Text style={[s.navText, wide && { fontSize: 14 }, active && { color: color.accent }]}>{label}</Text>
        </Pressable>
      );
    })}
  </View>;
  return <SafeAreaView style={s.safe}>
    <View style={s.header}>
      <Pressable onPress={() => router.replace('/')} style={s.brand} accessibilityRole="link">
        <View style={s.logo}><ReceiptText size={21} color="white" /></View>
        <Text style={s.brandText}>BillTrack</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/auth')} accessibilityLabel="Tài khoản" accessibilityRole="link" style={s.avatar}><Text style={s.avatarText}>BT</Text></Pressable>
    </View>
    <View style={s.body}>
      {wide && nav}
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={s.content}>
          {!isMain && <Pressable accessibilityRole="button" style={s.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><ArrowLeft size={18} color={color.accent} /><Text style={s.backText}>Quay lại</Text></Pressable>}
          <View style={s.heading}><View style={s.titleBlock}><Text accessibilityRole="header" style={s.title}>{title}</Text>{subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}</View>{action}</View>
          {children}
        </View>
      </ScrollView>
    </View>
    {!wide && nav}
  </SafeAreaView>;
}

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Section({ title, action, children }) {
  return <View style={s.section}>
    <View style={s.sectionHead}><Text accessibilityRole="header" style={s.sectionTitle}>{title}</Text>{action}</View>
    {children}
  </View>;
}
export function Row({ title, detail, end, href, mark, badge, icon: Icon = ChevronRight, tint = color.accent, background = color.soft }) {
  const body = <>
    <View style={[s.icon, { backgroundColor: background }]}>{mark ? <Text style={{ color: tint, fontWeight: '900' }}>{mark}</Text> : <Icon size={20} color={tint} />}</View>
    <View style={s.rowLabel}><Text style={s.rowTitle}>{title}</Text>{detail ? <Text style={s.muted}>{detail}</Text> : null}{badge ? <Text style={s.badge}>{badge}</Text> : null}</View>
    {end != null && end !== '' ? <Text style={s.rowEnd}>{end}</Text> : null}
    {href && <ChevronRight size={16} color={color.muted} />}
  </>;
  return href ? <Pressable onPress={() => router.push(href)} accessibilityRole="link" style={s.row}>{body}</Pressable> : <View style={s.row}>{body}</View>;
}
const serviceIcons = [[Tv, color.accent, '#F6DFD5'], [Music2, '#506249', '#E8EADB'], [Cpu, '#704F43', '#EDDDD2'], [Cloud, '#66588A', '#EBE3F1']];
export function BillRow({ bill, showPayment = false }) {
  const { paymentMethods } = useBills();
  const brand = getBrand(bill.name);
  const payment = paymentMethods.find((method) => method.id === bill.payment);
  const [icon, tint, background] = serviceIcons[bill.category] ?? serviceIcons[0];
  return <Row icon={icon} mark={brand?.mark} tint={brand?.tint ?? tint} background={background} title={bill.name}
    badge={bill.oldPrice != null && bill.amount > bill.oldPrice ? 'Tăng giá' : undefined}
    detail={[bill.trial ? 'Dùng thử' : bill.plan || cycleLabel(bill), dateLabel(bill.next), showPayment ? (payment?.name ?? 'Chưa có nguồn thanh toán') : null].filter(Boolean).join(' · ')}
    end={money(bill.amount, bill.currency)} href={{ pathname: '/subscriptions/[id]', params: { id: bill.id } }} />;
}

export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  header: { minHeight: 62, backgroundColor: color.white, borderBottomWidth: 1, borderColor: color.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: color.accent },
  brandText: { color: color.accent, fontSize: 23, fontWeight: '900', letterSpacing: -0.7 },
  avatar: { width: 38, height: 38, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: color.soft },
  avatarText: { color: color.accent, fontWeight: '800' },
  body: { flex: 1, flexDirection: 'row' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 26 },
  content: { maxWidth: 1040, width: '100%', alignSelf: 'center', gap: 18 },
  heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, justifyContent: 'space-between' },
  titleBlock: { gap: 4, flexShrink: 1 },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -1.1, color: color.accent },
  subtitle: { fontSize: 14, lineHeight: 21, color: color.muted, fontStyle: 'italic' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 44, alignSelf: 'flex-start' },
  backText: { color: color.accent, fontWeight: '700' },
  muted: { fontSize: 13, lineHeight: 19, color: color.muted },
  nav: { flexDirection: 'row', backgroundColor: color.white, borderTopWidth: 1, borderColor: color.line, paddingHorizontal: 6, paddingVertical: 6, gap: 2 },
  sideNav: { flexDirection: 'column', width: 206, borderTopWidth: 0, borderRightWidth: 1, padding: 14, gap: 7 },
  navItem: { flex: 1, minHeight: 50, borderRadius: 11, alignItems: 'center', justifyContent: 'center', gap: 4 },
  sideItem: { flex: 0, flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: 12, gap: 11 },
  navText: { fontSize: 10, fontWeight: '700', color: color.muted, textAlign: 'center' },
  selected: { backgroundColor: color.soft },
  button: { paddingHorizontal: 15, paddingVertical: 11, borderRadius: 10, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center', minHeight: 42 },
  buttonText: { fontSize: 13, color: color.white, fontWeight: '800' },
  subtle: { backgroundColor: color.soft },
  pressed: { opacity: 0.76 },
  card: { backgroundColor: color.white, borderRadius: 20, borderWidth: 1, borderColor: color.line, overflow: 'hidden' },
  section: { gap: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: color.accent, flexShrink: 1 },
  row: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 11, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.line },
  icon: { width: 39, height: 39, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  rowLabel: { flex: 1, minWidth: 0 },
  rowTitle: { color: color.ink, fontSize: 14, fontWeight: '750' },
  badge: { color: color.accent, backgroundColor: color.soft, fontWeight: '800', fontSize: 12, alignSelf: 'flex-start', paddingHorizontal: 7, borderRadius: 6, marginTop: 3 },
  rowEnd: { color: color.accent, fontSize: 13, fontWeight: '800', maxWidth: '43%', textAlign: 'right' },
  inset: { padding: 16, gap: 10 },
  input: { color: color.ink, minHeight: 44, borderRadius: 9, borderWidth: 1, borderColor: color.line, paddingHorizontal: 11, backgroundColor: color.white },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  label: { color: color.ink, fontWeight: '700', marginTop: 4, marginBottom: 5 },
  error: { color: '#a32144', fontWeight: '650' },
});
