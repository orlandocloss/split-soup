import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONT } from '../constants/theme';

/**
 * AuthScreen Component
 * Login and signup with minimal typewriter aesthetic
 */
export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        const result = await signUp(email, password, username);
        if (result?.needsConfirmation) {
          setMessage('check your email to confirm');
          setIsLogin(true);
        }
      }
    } catch (err) {
      console.log('Auth error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setMessage('');
  };

  const isValid = email.includes('@') && password.length >= 6 && (isLogin || username.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>split soup</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'welcome back' : 'create account'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.field}>
              <Text style={styles.label}>username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="_"
                placeholderTextColor={COLORS.inkMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="_"
              placeholderTextColor={COLORS.inkMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••"
              placeholderTextColor={COLORS.inkMuted}
              secureTextEntry
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              !isValid && styles.buttonDisabled,
              pressed && isValid && styles.buttonPressed,
            ]}
            onPress={handleSubmit}
            disabled={!isValid || loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.background} size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'login' : 'signup'}
              </Text>
            )}
          </Pressable>
        </View>

        <Pressable style={styles.toggle} onPress={toggleMode}>
          <Text style={styles.toggleText}>
            {isLogin ? "don't have an account? " : 'already have an account? '}
            <Text style={styles.toggleLink}>
              {isLogin ? 'signup' : 'login'}
            </Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xxl,
    alignItems: 'center',
  },
  title: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.lg,
    fontWeight: '300',
    color: COLORS.ink,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.inkMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  form: {
    marginBottom: SPACING.xl,
  },
  field: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.inkMuted,
    marginBottom: SPACING.xs,
  },
  input: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    color: COLORS.ink,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingVertical: SPACING.sm,
  },
  error: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.danger,
    marginBottom: SPACING.md,
  },
  message: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.xs,
    color: COLORS.spark,
    marginBottom: SPACING.md,
  },
  button: {
    backgroundColor: COLORS.spark,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  buttonDisabled: {
    backgroundColor: COLORS.line,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    fontWeight: '600',
  },
  toggle: {
    alignItems: 'center',
  },
  toggleText: {
    fontFamily: FONT.mono,
    fontSize: FONT_SIZES.sm,
    color: COLORS.inkMuted,
  },
  toggleLink: {
    color: COLORS.ink,
    fontWeight: '500',
  },
});
