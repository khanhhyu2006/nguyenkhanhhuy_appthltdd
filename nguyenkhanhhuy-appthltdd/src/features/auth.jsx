import AsyncStorage from '@react-native-async-storage/async-storage';
import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from 'expo-crypto';
import { router } from 'expo-router';
import { LockKeyhole, UserRound, UserRoundPlus } from 'lucide-react-native';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput } from 'react-native';
import { Button, Card, Screen, color, s } from './ui';

const AuthContext = createContext(null);
const storageKey = 'billtrack.auth.demo.v1';
const demoAccounts = [
  {
    "name": "Khánh Huy",
    "email": "huy@billtrack.example",
    "salt": "billtrack-demo-huy",
    "digest": "279cb267a5f08eeb2e9a46d6f2382c9e0eba8932c31199e8555d9b3647287180"
  },
  {
    "name": "Minh Anh",
    "email": "minhanh@billtrack.example",
    "salt": "billtrack-demo-minhanh",
    "digest": "c09dcce8668fc9514a3bed0169b862a4eb3f620f720c8f6d3914604f24b7b7b1"
  }
];
const emptyState = { accounts: demoAccounts, session: null };

const passwordDigest = (password, salt) =>
  digestStringAsync(CryptoDigestAlgorithm.SHA256, salt + ':' + password);

export function AuthProvider({ children }) {
  const [state, setState] = useState(null);
  const pending = useRef(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey).then((raw) => {
      if (!active) return;
      const saved = raw ? JSON.parse(raw) : emptyState;
      const seeded = demoAccounts.filter((demo) => !saved.accounts.some((account) => account.email === demo.email));
      setState({ ...saved, accounts: [...saved.accounts, ...seeded] });
    }).catch(() => {
      if (active) setState(emptyState);
    });
    return () => { active = false; };
  }, []);

  async function submit({ name, email, password }, register) {
    if (!state || pending.current) return false;
    pending.current = true;
    try {
      const existing = state.accounts.find((account) => account.email === email);
      let accounts = state.accounts;
      if (register) {
        if (existing) throw new Error('Email này đã được đăng ký trên thiết bị.');
        const salt = randomUUID();
        accounts = [...accounts, { name, email, salt, digest: await passwordDigest(password, salt) }];
      } else if (!existing || await passwordDigest(password, existing.salt) !== existing.digest) {
        throw new Error('Email hoặc mật khẩu chưa đúng.');
      }
      const next = { accounts, session: email };
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      setState(next);
      return true;
    } finally {
      pending.current = false;
    }
  }

  async function signOut() {
    if (!state || pending.current) return;
    pending.current = true;
    try {
      const next = { ...state, session: null };
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      setState(next);
    } finally {
      pending.current = false;
    }
  }

  const current = state?.accounts.find((account) => account.email === state.session);
  const user = current ? { name: current.name, email: current.email } : null;
  return <AuthContext.Provider value={{ user, ready: state !== null, submit, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function Login() {
  return <AuthForm />;
}

export function Register() {
  return <AuthForm register />;
}

function AuthForm({ register = false }) {
  const { ready, submit } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const Icon = register ? UserRoundPlus : LockKeyhole;
  const title = register ? 'Đăng ký tài khoản' : 'Đăng nhập';

  async function save() {
    if (!ready || busy) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (register && !name.trim()) return setStatus('Nhập họ và tên.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return setStatus('Nhập địa chỉ email hợp lệ.');
    if (!password) return setStatus('Nhập mật khẩu.');
    if (register && password.length < 8) return setStatus('Mật khẩu cần ít nhất 8 ký tự.');
    if (register && password !== confirmation) return setStatus('Mật khẩu xác nhận chưa khớp.');
    setStatus('');
    setBusy(true);
    try {
      if (await submit({ name: name.trim(), email: normalizedEmail, password }, register)) router.replace('/auth');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setStatus(['Email này đã được đăng ký trên thiết bị.', 'Email hoặc mật khẩu chưa đúng.'].includes(message)
        ? message : 'Không thể lưu tài khoản. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  }

  return <Screen title={title} subtitle="Tài khoản demo trên thiết bị. Hãy dùng mật khẩu thử.">
    <Card style={s.inset}>
      <Icon size={27} color={color.accent} />
      {register ? <>
        <Text style={s.label}>Họ và tên</Text>
        <TextInput style={s.input} accessibilityLabel="Họ và tên" value={name} onChangeText={setName} autoComplete="name" autoCapitalize="words" maxLength={80} />
      </> : null}
      <Text style={s.label}>Email</Text>
      <TextInput style={s.input} accessibilityLabel="Email" value={email} onChangeText={setEmail} autoComplete="email" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" maxLength={254} />
      <Text style={s.label}>Mật khẩu</Text>
      <TextInput style={s.input} accessibilityLabel="Mật khẩu" value={password} onChangeText={setPassword} autoComplete={register ? 'new-password' : 'current-password'} autoCapitalize="none" autoCorrect={false} secureTextEntry={!showPasswords} maxLength={128} />
      {register ? <>
        <Text style={s.label}>Xác nhận mật khẩu</Text>
        <TextInput style={s.input} accessibilityLabel="Xác nhận mật khẩu" value={confirmation} onChangeText={setConfirmation} autoComplete="new-password" autoCapitalize="none" autoCorrect={false} secureTextEntry={!showPasswords} maxLength={128} />
      </> : null}
      <Button title={showPasswords ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} subtle onPress={() => setShowPasswords(!showPasswords)} />
      {status ? <Text accessibilityRole="alert" style={s.error}>{status}</Text> : null}
      {ready && !busy ? <Button title={title} onPress={save} /> : <ActivityIndicator color={color.accent} accessibilityLabel="Đang xử lý tài khoản" />}
    </Card>
    <Card style={s.inset}>
      <Text style={s.rowTitle}>{register ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}</Text>
      <Button title={register ? 'Đăng nhập' : 'Tạo tài khoản'} href={register ? '/auth/login' : '/auth/register'} subtle />
    </Card>
  </Screen>;
}

export function AccountAccess() {
  const { user, ready, signOut } = useAuth();
  const [error, setError] = useState('');
  if (!ready) return <Card style={s.inset}><ActivityIndicator color={color.accent} accessibilityLabel="Đang tải tài khoản" /></Card>;
  return <Card style={s.inset}>
    <UserRound size={26} color={color.accent} />
    {user ? <>
      <Text style={s.sectionTitle}>{user.name}</Text>
      <Text style={s.muted}>{user.email}</Text>
      {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
      <Button title="Đăng xuất" subtle onPress={async () => {
        setError('');
        try { await signOut(); } catch { setError('Không thể đăng xuất. Vui lòng thử lại.'); }
      }} />
    </> : <>
      <Button title="Đăng nhập" href="/auth/login" />
      <Button title="Đăng ký tài khoản" href="/auth/register" subtle />
    </>}
  </Card>;
}
