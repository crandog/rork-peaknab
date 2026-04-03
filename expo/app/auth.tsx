// Auth screen
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Cloud, Mountain, Chrome } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'signin' | 'signup';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, signUp, isSigningIn, isSigningUp, signInWithApple, signInWithGoogle, isSigningInWithApple, isSigningInWithGoogle } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const slideAnim = useRef(new Animated.Value(0)).current;
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const isLoading = isSigningIn || isSigningUp || isSigningInWithApple || isSigningInWithGoogle;
  const showAppleButton = Platform.OS === 'ios';

  const toggleMode = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setError('');
    const newMode = mode === 'signin' ? 'signup' : 'signin';
    Animated.timing(slideAnim, {
      toValue: newMode === 'signup' ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
    setMode(newMode);
  }, [mode, slideAnim]);

  const handleSubmit = useCallback(() => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (mode === 'signin') {
      signIn(email.trim(), password);
    } else {
      signUp(email.trim(), password);
    }
  }, [email, password, confirmPassword, mode, signIn, signUp]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' }}
        style={styles.bgImage}
        resizeMode="cover"
      />
      <View style={styles.bgOverlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            testID="auth-back-button"
          >
            <ArrowLeft color={Colors.white} size={22} />
          </TouchableOpacity>

          <View style={styles.heroSection}>
            <View style={styles.iconRow}>
              <View style={styles.cloudIcon}>
                <Cloud color={Colors.white} size={28} />
              </View>
              <View style={styles.syncDots}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={[styles.dot, styles.dotActive]} />
                <View style={[styles.dot, styles.dotActive]} />
              </View>
              <View style={styles.mountainIconCircle}>
                <Mountain color={Colors.white} size={28} />
              </View>
            </View>
            <Text style={styles.heroTitle}>
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {mode === 'signin'
                ? 'Sign in to sync your summit data across devices'
                : 'Your existing summit data will be backed up automatically'}
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Mail color={Colors.textMuted} size={18} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  testID="auth-email-input"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Lock color={Colors.textMuted} size={18} />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType={mode === 'signup' ? 'next' : 'done'}
                  onSubmitEditing={() =>
                    mode === 'signup' ? confirmRef.current?.focus() : handleSubmit()
                  }
                  testID="auth-password-input"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff color={Colors.textMuted} size={18} />
                  ) : (
                    <Eye color={Colors.textMuted} size={18} />
                  )}
                </TouchableOpacity>
              </View>

              {mode === 'signup' && (
                <View style={styles.inputWrapper}>
                  <Lock color={Colors.textMuted} size={18} />
                  <TextInput
                    ref={confirmRef}
                    style={styles.input}
                    placeholder="Confirm password"
                    placeholderTextColor={Colors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    testID="auth-confirm-password-input"
                  />
                </View>
              )}
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
              testID="auth-submit-button"
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={toggleMode}
              activeOpacity={0.7}
            >
              <Text style={styles.toggleText}>
                {mode === 'signin'
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <Text style={styles.toggleTextBold}>
                  {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={styles.googleButton}
                onPress={signInWithGoogle}
                disabled={isLoading}
                activeOpacity={0.8}
                testID="auth-google-button"
              >
                {isSigningInWithGoogle ? (
                  <ActivityIndicator color={Colors.text} size="small" />
                ) : (
                  <>
                    <Chrome color={Colors.text} size={20} />
                    <Text style={styles.googleButtonText}>Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {showAppleButton && (
                <TouchableOpacity
                  style={styles.appleButton}
                  onPress={signInWithApple}
                  disabled={isLoading}
                  activeOpacity={0.8}
                  testID="auth-apple-button"
                >
                  {isSigningInWithApple ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <>
                      <Text style={styles.appleLogo}></Text>
                      <Text style={styles.appleButtonText}>Apple</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={styles.infoDot} />
              <Text style={styles.infoText}>Your data stays on device even without an account</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoDot} />
              <Text style={styles.infoText}>Signing in syncs & backs up your summit data</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoDot} />
              <Text style={styles.infoText}>Access your data from any device</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.snow,
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 340,
  },
  bgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 340,
    backgroundColor: 'rgba(26, 51, 80, 0.65)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroSection: {
    marginBottom: 28,
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  cloudIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  syncDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  mountainIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputGroup: {
    gap: 12,
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.frost,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  errorBox: {
    backgroundColor: Colors.danger + '12',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.danger + '25',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  googleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.frost,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  appleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#000',
    borderRadius: 14,
    paddingVertical: 14,
  },
  appleButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  appleLogo: {
    fontSize: 18,
    color: '#fff',
  },
  toggleText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  toggleTextBold: {
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  infoSection: {
    gap: 10,
    paddingHorizontal: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary + '50',
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
});
