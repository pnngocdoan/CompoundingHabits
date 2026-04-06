import { Stack } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import IntroSlide4 from '../screens/IntroSlide4';

export default function TheoryRoute() {
  const { width, height } = useWindowDimensions();
  return (
    <>
      <Stack.Screen
        options={{
          title: 'The 1% Better Theory',
          headerShown: true,
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#000000',
          headerBackTitle: '',
          headerTitleStyle: { fontFamily: 'DMSans-SemiBold' },
          headerShadowVisible: false,
        }}
      />
      <IntroSlide4 width={width} height={height} active={true} />
    </>
  );
}
