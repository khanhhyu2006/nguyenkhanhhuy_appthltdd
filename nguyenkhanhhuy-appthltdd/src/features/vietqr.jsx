import { Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { toQR } from 'toqr';
import { s } from './ui';

const tlv = (id, value) => id + String(value.length).padStart(2, '0') + value;

function checksum(value) {
  let crc = 0xffff;
  for (const character of value) {
    crc ^= character.charCodeAt(0) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function vietQrPayload(bank, account, amount, note) {
  if (!/^\d{6}$/.test(bank) || !/^\d{4,19}$/.test(account) ||
      !Number.isSafeInteger(amount) || amount < 1 || amount >= 500000000 || !/^[A-Z0-9 ]{1,25}$/.test(note)) return null;
  const beneficiary = tlv('00', bank) + tlv('01', account);
  const merchant = tlv('00', 'A000000727') + tlv('01', beneficiary) + tlv('02', 'QRIBFTTA');
  const data = tlv('00', '01') + tlv('01', '12') + tlv('38', merchant) + tlv('53', '704') +
    tlv('54', String(amount)) + tlv('58', 'VN') + tlv('62', tlv('08', note)) + '6304';
  return data + checksum(data);
}

export function VietQr({ payload }) {
  if (!payload) return <Text style={s.muted}>Nhập BIN và số tài khoản hợp lệ để tạo mã VietQR.</Text>;
  const matrix = toQR(payload);
  const width = Math.sqrt(matrix.length);
  const blocks = [];
  matrix.forEach((pixel, index) => {
    if (pixel) blocks.push('M' + (index % width + 4) + ',' + (Math.floor(index / width) + 4) + 'h1v1h-1z');
  });
  return <View accessible accessibilityLabel="VietQR chuyển khoản" style={{ alignSelf: 'center' }}>
    <Svg width={200} height={200} viewBox={'0 0 ' + (width + 8) + ' ' + (width + 8)}>
      <Rect width={width + 8} height={width + 8} fill="white" />
      <Path d={blocks.join('')} fill="black" />
    </Svg>
  </View>;
}
