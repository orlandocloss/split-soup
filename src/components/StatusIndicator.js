import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { BORDER_RADIUS } from '../constants/theme';

/**
 * StatusIndicator Component
 * Animated colored bar for event status
 */
export const StatusIndicator = ({ status }) => {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;
  const anim4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'owner') return;

    // Wave 1 - main pulse
    const wave1 = Animated.loop(
      Animated.sequence([
        Animated.timing(anim1, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(anim1, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );

    // Wave 2 - offset pulse
    const wave2 = Animated.loop(
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(anim2, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(anim2, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    );

    // Wave 3 - fast flicker for sparks
    const wave3 = Animated.loop(
      Animated.sequence([
        Animated.timing(anim3, {
          toValue: 1,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(anim3, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.delay(800 + Math.random() * 1000),
      ])
    );

    // Wave 4 - traveling particle
    const wave4 = Animated.loop(
      Animated.timing(anim4, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      })
    );

    wave1.start();
    wave2.start();
    if (status === 'accepted') {
      wave3.start();
    }
    wave4.start();

    return () => {
      wave1.stop();
      wave2.stop();
      wave3.stop();
      wave4.stop();
    };
  }, [status, anim1, anim2, anim3, anim4]);

  const getColors = () => {
    switch (status) {
      case 'pending':
        return { main: '#FF9500', light: '#FFB84D', bright: '#FFCC80' };
      case 'accepted':
        return { main: '#00D26A', light: '#4DE89B', bright: '#FFFFFF' };
      case 'declined':
        return { main: '#E63946', light: '#FF6B6B', bright: '#FF9999' };
      default:
        return { main: '#D0D0D0', light: '#E0E0E0', bright: '#F0F0F0' };
    }
  };

  const colors = getColors();

  if (status === 'owner') {
    return (
      <View style={styles.container}>
        <View style={[styles.bar, { backgroundColor: '#E0E0E0' }]} />
      </View>
    );
  }

  // Interpolations
  const glowWidth = anim1.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 12],
  });

  const glowOpacity = anim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1, 0.5],
  });

  const pulse2Opacity = anim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const sparkOpacity = anim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const particleY = anim4.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80],
  });

  const particleOpacity = anim4.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <View style={styles.container}>
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: colors.light,
            width: glowWidth,
            opacity: glowOpacity,
          },
        ]}
      />

      {/* Pulsing layer */}
      <Animated.View
        style={[
          styles.pulseLayer,
          {
            backgroundColor: colors.main,
            opacity: pulse2Opacity,
          },
        ]}
      />

      {/* Traveling particle */}
      <Animated.View
        style={[
          styles.particle,
          {
            backgroundColor: colors.bright,
            transform: [{ translateY: particleY }],
            opacity: particleOpacity,
          },
        ]}
      />

      {/* Second particle (offset) */}
      <Animated.View
        style={[
          styles.particle2,
          {
            backgroundColor: colors.light,
            transform: [
              {
                translateY: anim4.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 120],
                }),
              },
            ],
            opacity: anim4.interpolate({
              inputRange: [0, 0.3, 0.7, 1],
              outputRange: [0, 0.8, 0.8, 0],
            }),
          },
        ]}
      />

      {/* Sparks for accepted */}
      {status === 'accepted' && (
        <>
          <Animated.View
            style={[
              styles.spark,
              {
                top: '15%',
                opacity: sparkOpacity,
                backgroundColor: '#FFFFFF',
              },
            ]}
          />
          <Animated.View
            style={[
              styles.spark,
              {
                top: '45%',
                opacity: anim3.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.5, 1, 0],
                }),
                backgroundColor: '#FFFFFF',
              },
            ]}
          />
          <Animated.View
            style={[
              styles.spark,
              {
                top: '75%',
                opacity: anim3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
                backgroundColor: '#FFFFFF',
              },
            ]}
          />
        </>
      )}

      {/* Core bar */}
      <View style={[styles.bar, { backgroundColor: colors.main }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 16,
    overflow: 'hidden',
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
  },
  glow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
  },
  pulseLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
  },
  particle: {
    position: 'absolute',
    left: 1,
    width: 3,
    height: 12,
    borderRadius: 2,
  },
  particle2: {
    position: 'absolute',
    left: 0,
    width: 4,
    height: 8,
    borderRadius: 2,
  },
  spark: {
    position: 'absolute',
    left: 0,
    width: 5,
    height: 4,
    borderRadius: 2,
  },
});
