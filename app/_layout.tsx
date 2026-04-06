import '../global.css';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureGuestSession } from '../api/habits';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [sessionReady, setSessionReady] = useState(false);
  const [fontsLoaded] = useFonts({
    // Bricolage Grotesque — headings
    'BricolageGrotesque-ExtraLight': require('../assets/fonts/BricolageGrotesque_200ExtraLight.ttf'),
    'BricolageGrotesque-Light':      require('../assets/fonts/BricolageGrotesque_300Light.ttf'),
    'BricolageGrotesque-Regular':    require('../assets/fonts/BricolageGrotesque_400Regular.ttf'),
    'BricolageGrotesque-Medium':     require('../assets/fonts/BricolageGrotesque_500Medium.ttf'),
    'BricolageGrotesque-SemiBold':   require('../assets/fonts/BricolageGrotesque_600SemiBold.ttf'),
    'BricolageGrotesque-Bold':       require('../assets/fonts/BricolageGrotesque_700Bold.ttf'),
    'BricolageGrotesque-ExtraBold':  require('../assets/fonts/BricolageGrotesque_800ExtraBold.ttf'),
    // DM Sans — body
    'DMSans-Thin':             require('../assets/fonts/DMSans_100Thin.ttf'),
    'DMSans-ThinItalic':       require('../assets/fonts/DMSans_100Thin_Italic.ttf'),
    'DMSans-ExtraLight':       require('../assets/fonts/DMSans_200ExtraLight.ttf'),
    'DMSans-ExtraLightItalic': require('../assets/fonts/DMSans_200ExtraLight_Italic.ttf'),
    'DMSans-Light':            require('../assets/fonts/DMSans_300Light.ttf'),
    'DMSans-LightItalic':      require('../assets/fonts/DMSans_300Light_Italic.ttf'),
    'DMSans-Regular':          require('../assets/fonts/DMSans_400Regular.ttf'),
    'DMSans-Italic':           require('../assets/fonts/DMSans_400Regular_Italic.ttf'),
    'DMSans-Medium':           require('../assets/fonts/DMSans_500Medium.ttf'),
    'DMSans-MediumItalic':     require('../assets/fonts/DMSans_500Medium_Italic.ttf'),
    'DMSans-SemiBold':         require('../assets/fonts/DMSans_600SemiBold.ttf'),
    'DMSans-SemiBoldItalic':   require('../assets/fonts/DMSans_600SemiBold_Italic.ttf'),
    'DMSans-Bold':             require('../assets/fonts/DMSans_700Bold.ttf'),
    'DMSans-BoldItalic':       require('../assets/fonts/DMSans_700Bold_Italic.ttf'),
    'DMSans-ExtraBold':        require('../assets/fonts/DMSans_800ExtraBold.ttf'),
    'DMSans-ExtraBoldItalic':  require('../assets/fonts/DMSans_800ExtraBold_Italic.ttf'),
    'DMSans-Black':            require('../assets/fonts/DMSans_900Black.ttf'),
    'DMSans-BlackItalic':      require('../assets/fonts/DMSans_900Black_Italic.ttf'),
  });

  useEffect(() => {
    if (!fontsLoaded) return;
    ensureGuestSession()
      .catch(() => {})
      .finally(() => {
        setSessionReady(true);
        SplashScreen.hideAsync();
      });
  }, [fontsLoaded]);

  useEffect(() => {
    if (sessionReady) router.replace('/intro');
  }, [sessionReady]);

  if (!fontsLoaded || !sessionReady) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
        <Stack.Screen name="intro" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="habit/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: '#fff' },
            headerTintColor: '#000',
            headerBackTitle: '',
            headerTitleStyle: { fontFamily: 'DMSans-SemiBold' },
          }}
        />
        <Stack.Screen
          name="habit/add"
          options={{
            headerShown: true,
            title: '',
            headerStyle: { backgroundColor: '#000' },
            headerTintColor: '#fff',
            headerBackTitle: '',
          }}
        />
        <Stack.Screen
          name="habit/select"
          options={{
            headerShown: true,
            title: '',
            headerStyle: { backgroundColor: '#000' },
            headerTintColor: '#fff',
            headerBackTitle: '',
          }}
        />
        <Stack.Screen name="settings" />
        <Stack.Screen name="theory" />
      </Stack>
    </>
  );
}
