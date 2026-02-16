import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

/**
 * SparkEffect Component
 * Green lightning celebration on event creation
 */
export const SparkEffect = ({ visible, onComplete }) => {
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const lineAnimations = useRef(
    Array.from({ length: 6 }, () => ({
      opacity: new Animated.Value(0),
      scaleY: new Animated.Value(0),
      translateX: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      triggerEffect();
    }
  }, [visible]);

  const triggerEffect = () => {
    // Flash effect
    Animated.sequence([
      Animated.timing(flashOpacity, {
        toValue: 1,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Lightning lines
    lineAnimations.forEach((anim, index) => {
      const delay = index * 30;
      
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(anim.scaleY, {
            toValue: 1,
            duration: 80,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(anim.scaleY, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        if (index === lineAnimations.length - 1) {
          onComplete?.();
        }
      });
    });
  };

  if (!visible) return null;

  const linePositions = [
    { left: '15%', height: 120, rotation: '-8deg' },
    { left: '30%', height: 180, rotation: '5deg' },
    { left: '45%', height: 140, rotation: '-3deg' },
    { left: '60%', height: 160, rotation: '7deg' },
    { left: '75%', height: 130, rotation: '-6deg' },
    { left: '85%', height: 100, rotation: '4deg' },
  ];

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Screen flash */}
      <Animated.View
        style={[
          styles.flash,
          { opacity: flashOpacity },
        ]}
      />

      {/* Lightning lines */}
      {lineAnimations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.line,
            {
              left: linePositions[index].left,
              height: linePositions[index].height,
              transform: [
                { rotate: linePositions[index].rotation },
                { scaleY: anim.scaleY },
              ],
              opacity: anim.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.sparkGlow,
  },
  line: {
    position: 'absolute',
    top: '20%',
    width: 2,
    backgroundColor: COLORS.spark,
    shadowColor: COLORS.spark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
});

