import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../features/auth';
import { BillProvider } from '../features/bills';
import { color } from '../features/ui';

export default function RootLayout() {
  return <AuthProvider><BillProvider>
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }} />
  </BillProvider></AuthProvider>;
}
