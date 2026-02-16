import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing, Vibration } from 'react-native';

const { width, height } = Dimensions.get('window');
const CENTER_X = width / 2;
const CENTER_Y = height / 2;

// App-consistent color palette
const COLORS = {
  background: '#1a1a1a',
  bowl: '#242424',
  bowlRim: '#333333',
  soup: '#E63946',
  soupHighlight: '#FF5A5A',
  steam: 'rgba(255, 255, 255, 0.35)',
};

const PARTICLE_COLORS = ['#00D26A', '#FF9500', '#E63946']; // green, orange, red
const PARTICLE_COUNT = 3;

// Timing
const EXPAND_DURATION = 500;
const ORBIT_START = 700;
const BOWL_APPEAR = 1800;
const DROP_START = 2400;
const DROP_INTERVAL = 500;
const STEAM_START = DROP_START + (PARTICLE_COUNT * DROP_INTERVAL) + 600;
const FADE_OUT = STEAM_START + 1600;

/**
 * Orbiting particle
 */
const Particle = ({ index, phase, onEnterSoup }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const posX = useRef(new Animated.Value(0)).current;
  const posY = useRef(new Animated.Value(0)).current;
  
  const color = PARTICLE_COLORS[index];
  const size = 16;
  const orbitRadius = 50;
  
  // Initial position (spread evenly in circle)
  const startAngle = (index / PARTICLE_COUNT) * Math.PI * 2 - Math.PI / 2;
  const startX = Math.cos(startAngle) * orbitRadius;
  const startY = Math.sin(startAngle) * orbitRadius - 30;

  // Phase 1: Expand from center
  useEffect(() => {
    if (phase === 'expand') {
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1,
            friction: 7,
            tension: 50,
            useNativeDriver: false,
          }),
          Animated.timing(posX, {
            toValue: startX,
            duration: EXPAND_DURATION,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: false,
          }),
          Animated.timing(posY, {
            toValue: startY,
            duration: EXPAND_DURATION,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: false,
          }),
        ]).start();
      }, index * 80);
    }
  }, [phase]);

  // Phase 2: Orbit in circle
  useEffect(() => {
    if (phase === 'orbit') {
      let currentAngle = startAngle;
      const orbitY = -30; // Center of orbit
      
      const orbit = () => {
        currentAngle += 0.08; // Rotation speed
        const targetX = Math.cos(currentAngle) * orbitRadius;
        const targetY = Math.sin(currentAngle) * orbitRadius * 0.5 + orbitY;
        
        Animated.parallel([
          Animated.timing(posX, {
            toValue: targetX,
            duration: 50,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.timing(posY, {
            toValue: targetY,
            duration: 50,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
        ]).start();
      };
      
      const interval = setInterval(orbit, 50);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Phase 3: Drop into soup (one by one)
  useEffect(() => {
    if (phase === 'drop') {
      setTimeout(() => {
        Animated.sequence([
          // Move to center above bowl
          Animated.parallel([
            Animated.timing(posX, {
              toValue: 0,
              duration: 300,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: false,
            }),
            Animated.timing(posY, {
              toValue: 10,
              duration: 300,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: false,
            }),
          ]),
          // Drop into soup
          Animated.parallel([
            Animated.timing(posY, {
              toValue: 50,
              duration: 200,
              easing: Easing.in(Easing.quad),
              useNativeDriver: false,
            }),
            Animated.timing(scale, {
              toValue: 0.4,
              duration: 200,
              useNativeDriver: false,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }),
          ]),
        ]).start(() => onEnterSoup?.());
      }, index * DROP_INTERVAL);
    }
  }, [phase]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          transform: [
            { translateX: posX },
            { translateY: posY },
            { scale },
          ],
        },
      ]}
    />
  );
};

/**
 * Steam wisp
 */
const Steam = ({ delay, offsetX }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 2500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => animate());
    };
    
    setTimeout(animate, delay);
  }, []);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.2, 0.7, 1],
    outputRange: [0, 0.5, 0.3, 0],
  });

  const scaleX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1, 1.3],
  });

  return (
    <Animated.View
      style={[
        styles.steam,
        {
          left: CENTER_X + offsetX - 6,
          transform: [{ translateY }, { scaleX }],
          opacity,
        },
      ]}
    />
  );
};

/**
 * Bowl
 */
const Bowl = ({ visible, soupLevel }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 10,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const soupHeight = 8 + (soupLevel / PARTICLE_COUNT) * 28;
  const soupOpacity = 0.5 + (soupLevel / PARTICLE_COUNT) * 0.5;

  return (
    <Animated.View 
      style={[
        styles.bowlContainer, 
        { opacity, transform: [{ scale }] }
      ]}
    >
      <View style={styles.bowl}>
        <View style={styles.bowlInner} />
        
        <View style={[
          styles.soup,
          { height: soupHeight, opacity: soupOpacity }
        ]}>
          <View style={styles.soupHighlight} />
        </View>
        
        <View style={styles.bowlRim} />
      </View>
      
      <View style={styles.bowlShadow} />
    </Animated.View>
  );
};

/**
 * LoadingScreen
 */
export const LoadingScreen = ({ onComplete }) => {
  const [phase, setPhase] = useState('expand');
  const [showBowl, setShowBowl] = useState(false);
  const [showSteam, setShowSteam] = useState(false);
  const [soupLevel, setSoupLevel] = useState(0);
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const particlesEntered = useRef(0);

  const handleParticleEnterSoup = () => {
    particlesEntered.current += 1;
    setSoupLevel(particlesEntered.current);
  };

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('orbit'), ORBIT_START);
    const t2 = setTimeout(() => setShowBowl(true), BOWL_APPEAR);
    const t3 = setTimeout(() => setPhase('drop'), DROP_START);
    
    const t4 = setTimeout(() => {
      setShowSteam(true);
      Vibration.vibrate(60);
    }, STEAM_START);
    
    const t5 = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(() => onComplete?.());
    }, FADE_OUT);

    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <Bowl visible={showBowl} soupLevel={soupLevel} />

      <View style={styles.particlesContainer}>
        {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
          <Particle
            key={i}
            index={i}
            phase={phase}
            onEnterSoup={handleParticleEnterSoup}
          />
        ))}
      </View>

      {showSteam && (
        <>
          <Steam delay={0} offsetX={-10} />
          <Steam delay={400} offsetX={6} />
          <Steam delay={800} offsetX={-3} />
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particlesContainer: {
    position: 'absolute',
    top: CENTER_Y,
    left: CENTER_X,
    width: 0,
    height: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  particle: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  bowlContainer: {
    position: 'absolute',
    top: CENTER_Y + 25,
    left: CENTER_X - 55,
    width: 110,
    height: 70,
    zIndex: 5,
  },
  bowl: {
    width: 110,
    height: 55,
    backgroundColor: COLORS.bowl,
    borderBottomLeftRadius: 55,
    borderBottomRightRadius: 55,
    overflow: 'hidden',
    position: 'relative',
  },
  bowlInner: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 47,
    borderBottomRightRadius: 47,
  },
  soup: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    backgroundColor: COLORS.soup,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  soupHighlight: {
    position: 'absolute',
    top: 4,
    left: '20%',
    width: '40%',
    height: 6,
    backgroundColor: COLORS.soupHighlight,
    borderRadius: 3,
    opacity: 0.5,
  },
  bowlRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: COLORS.bowlRim,
    borderTopLeftRadius: 55,
    borderTopRightRadius: 55,
  },
  bowlShadow: {
    position: 'absolute',
    bottom: 0,
    left: 15,
    width: 80,
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 40,
  },
  steam: {
    position: 'absolute',
    top: CENTER_Y + 10,
    width: 12,
    height: 18,
    borderRadius: 6,
    backgroundColor: COLORS.steam,
  },
});
