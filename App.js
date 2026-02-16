import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoadingScreen } from './src/components/LoadingScreen';

/**
 * Navigation Container
 */
const Navigation = ({ showSplash, onSplashComplete }) => {
  const { user, loading } = useAuth();
  const [splashAnimationDone, setSplashAnimationDone] = useState(false);

  // When both animation is done AND auth is loaded, complete the splash
  useEffect(() => {
    if (splashAnimationDone && !loading && showSplash) {
      onSplashComplete();
    }
  }, [splashAnimationDone, loading, showSplash, onSplashComplete]);

  // Show animated splash screen until BOTH animation is done AND auth is loaded
  if (showSplash) {
    return (
      <LoadingScreen 
        onComplete={() => setSplashAnimationDone(true)} 
      />
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <HomeScreen />;
};

/**
 * App Entry Point
 */
export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <Navigation 
            showSplash={showSplash} 
            onSplashComplete={() => setShowSplash(false)} 
          />
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
