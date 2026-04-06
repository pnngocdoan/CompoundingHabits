import { Stack } from 'expo-router';
import SettingsScreen from '../screens/SettingsScreen';

export default function SettingsRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settings & more',
          headerShown: true,
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#000000',
          headerBackTitle: '',
          headerTitleStyle: { fontFamily: 'DMSans-SemiBold' },
          headerShadowVisible: false,
        }}
      />
      <SettingsScreen />
    </>
  );
}
