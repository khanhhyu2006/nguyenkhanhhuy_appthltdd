import * as Clipboard from 'expo-clipboard';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { dateLabel, today, useBills } from './bills';
import { addMonths, monthBounds, scheduledBills } from './schedule';
import { BillRow, Button, Card, color, s } from './ui';

const week = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function MonthCalendar({ bills }) {
  const [month, setMonth] = useState(() => today().slice(0, 7));
  const [day, setDay] = useState(today);
  const { start, end, weekday } = monthBounds(month);
  const events = scheduledBills(bills, start, end);
  const eventsByDay = new Map();
  for (const event of events) {
    if (!eventsByDay.has(event.next)) eventsByDay.set(event.next, []);
    eventsByDay.get(event.next).push(event);
  }
  const changeMonth = (offset) => {
    const next = addMonths(start, offset);
    setMonth(next.slice(0, 7));
    setDay(next);
  };
  return <>
    <Card style={s.inset}>
      <View style={styles.header}>
        <Button title="Trước" subtle onPress={() => changeMonth(-1)} />
        <Text style={s.sectionTitle}>Tháng {month.slice(5)}/{month.slice(0, 4)}</Text>
        <Button title="Sau" subtle onPress={() => changeMonth(1)} />
      </View>
      <View style={styles.grid}>
        {week.map((label) => <Text key={label} style={[styles.cell, styles.weekday]}>{label}</Text>)}
        {Array.from({ length: weekday }, (_, index) => <View key={'gap-' + index} style={styles.cell} />)}
        {Array.from({ length: Number(end.slice(-2)) }, (_, index) => {
          const date = month + '-' + String(index + 1).padStart(2, '0');
          const items = eventsByDay.get(date) ?? [];
          return <View key={date} style={styles.cell}>
            <Pressable style={[styles.day, day === date && styles.selected]} accessibilityRole="button"
              accessibilityState={{ selected: day === date }}
              accessibilityLabel={dateLabel(date, true) + ', ' + items.length + ' lịch thanh toán'}
              onPress={() => setDay(date)}>
              <Text style={s.rowTitle}>{index + 1}</Text>
              {items.length ? <View style={[styles.dot, items.some((item) => item.trial) && styles.trialDot]} /> : null}
            </Pressable>
          </View>;
        })}
      </View>
    </Card>
    <Card>
      <View style={s.inset}><Text style={s.sectionTitle}>Ngày {dateLabel(day, true)}</Text>
        {!eventsByDay.has(day) ? <Text style={s.muted}>Không có lịch thanh toán.</Text> : null}
      </View>
      {(eventsByDay.get(day) ?? []).map((bill) => <BillRow key={bill.id} bill={bill} showPayment />)}
    </Card>
  </>;
}

function calendarContent(bills) {
  const start = today();
  const dates = scheduledBills(bills, start, addMonths(start, 12));
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const escape = (value) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BillTrack//Renewals//VI',
    ...dates.flatMap((bill) => [
      'BEGIN:VEVENT',
      'UID:' + bill.id + '-' + bill.next + '@billtrack.local',
      'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + bill.next.replace(/-/g, ''),
      'SUMMARY:' + escape((bill.trial ? 'Hết dùng thử: ' : 'Gia hạn: ') + bill.name),
      'END:VEVENT',
    ]), 'END:VCALENDAR', ''].join('\r\n');
}

export function CalendarSync() {
  const { bills, calendarUrl, saveCalendarUrl } = useBills();
  const [url, setUrl] = useState(null);
  const [status, setStatus] = useState('');
  const copy = async () => {
    const address = (url ?? calendarUrl).trim();
    if (!/^https:\/\/[^\s]+\.ics(?:\?[^\s]*)?$/i.test(address)) {
      setStatus('Nhập liên kết HTTPS đến lịch .ics.');
      return;
    }
    saveCalendarUrl(address);
    try {
      setStatus(await Clipboard.setStringAsync(address) ? 'Đã lưu và sao chép liên kết.' : 'Đã lưu liên kết. Không thể sao chép.');
    } catch {
      setStatus('Đã lưu liên kết. Không thể sao chép.');
    }
  };
  const exportCalendar = async () => {
    try {
      const contents = calendarContent(bills);
      if (Platform.OS === 'web') {
        const objectUrl = URL.createObjectURL(new Blob([contents], { type: 'text/calendar;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = 'billtrack.ics';
        link.click();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      } else {
        const file = new File(Paths.cache, 'billtrack.ics');
        file.create({ overwrite: true });
        file.write(contents);
        await Sharing.shareAsync(file.uri, { mimeType: 'text/calendar', UTI: 'com.apple.ical.ics' });
      }
      setStatus('Đã tạo lịch gia hạn cho 12 tháng tới.');
    } catch {
      setStatus('Không thể xuất lịch.');
    }
  };
  return <Card style={s.inset}>
    <Text style={s.muted}>Xuất lịch để nhập vào Google Calendar hoặc Apple Calendar. Nếu đã có liên kết lịch trực tuyến, bạn có thể lưu và sao chép bên dưới.</Text>
    <Button title="Xuất tệp .ics" onPress={exportCalendar} />
    <TextInput style={s.input} value={url ?? calendarUrl} onChangeText={setUrl} autoCapitalize="none"
      keyboardType="url" accessibilityLabel="Liên kết lịch .ics" placeholder="https://…/calendar.ics" placeholderTextColor={color.muted} />
    <Button title="Lưu và sao chép liên kết" subtle onPress={copy} />
    {status ? <Text accessibilityLiveRegion="polite" style={s.muted}>{status}</Text> : null}
  </Card>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.285%', alignItems: 'center' },
  weekday: { color: color.muted, textAlign: 'center', fontWeight: '700', paddingVertical: 6 },
  day: { width: '95%', minHeight: 45, alignItems: 'center', justifyContent: 'center', borderRadius: 10, gap: 2 },
  selected: { backgroundColor: color.soft },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.accent },
  trialDot: { backgroundColor: '#C46A35' },
});
