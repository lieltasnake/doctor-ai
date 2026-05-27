import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';

export default function RegisterScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      return setErrorMsg(t('allFieldsRequired'));
    }
    if (password !== confirmPassword) {
      return setErrorMsg(t('passwordsDoNotMatch'));
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
    if (!passwordRegex.test(password)) {
      return setErrorMsg('Password must be at least 8 characters, include an uppercase letter, a lowercase letter, and a number.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setErrorMsg(t('invalidEmail') || 'Please enter a valid email address.');
    }

    setErrorMsg('');
    setLoading(true);

    try {
      // Role is handled entirely in the backend
      await api.post('/signup', { name, email, password });
      navigation.navigate('Login');
    } catch (err) {
      const errorResponse = err.response?.data?.error;
      if (errorResponse === 'User exists') {
        setErrorMsg('This email is already registered. Please sign in instead.');
      } else {
        setErrorMsg(errorResponse || 'Registration failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView key={i18n.language} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <Ionicons name="person-add" size={40} color="#2980b9" />
          </View>
          <Text style={styles.title}>{t('createAccount')}</Text>
          <Text style={styles.subtitle}>{t('joinDoctorAi')}</Text>
        </View>

        <View style={styles.formContainer}>
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color="#e74c3c" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color="#7f8c8d" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('fullName') || 'Full Name'}
              placeholderTextColor="#95a5a6"
              value={name}
              onChangeText={(text) => { setName(text); setErrorMsg(''); }}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={22} color="#7f8c8d" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('emailAddress') || 'Email Address'}
              placeholderTextColor="#95a5a6"
              value={email}
              onChangeText={(text) => { setEmail(text); setErrorMsg(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#7f8c8d" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('password') || 'Password'}
              placeholderTextColor="#95a5a6"
              value={password}
              onChangeText={(text) => { setPassword(text); setErrorMsg(''); }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#7f8c8d" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('confirmPassword') || 'Confirm Password'}
              placeholderTextColor="#95a5a6"
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); setErrorMsg(''); }}
              secureTextEntry={!showPassword}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSignUp} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.buttonText}>{t('signup')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('alreadyHaveAccount')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>{t('signIn')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f9' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 30 },
  header: { alignItems: 'center', marginBottom: 30 },
  iconWrapper: { backgroundColor: '#e1f0fa', padding: 20, borderRadius: 25, marginBottom: 15, elevation: 5, shadowColor: '#2980b9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  title: { fontSize: 30, fontWeight: '800', color: '#1a5276', marginBottom: 5, letterSpacing: 0.5 },
  subtitle: { fontSize: 15, color: '#7f8c8d', textAlign: 'center', paddingHorizontal: 10 },
  formContainer: { backgroundColor: '#ffffff', borderRadius: 20, padding: 25, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, marginBottom: 30 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdecea', padding: 12, borderRadius: 10, marginBottom: 15 },
  errorText: { color: '#e74c3c', marginLeft: 8, fontSize: 13, flex: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: '#e9ecef' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#2c3e50' },
  eyeIcon: { padding: 10 },
  button: { backgroundColor: '#2980b9', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, elevation: 3, shadowColor: '#2980b9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  buttonDisabled: { backgroundColor: '#95a5a6', elevation: 0 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  footerText: { fontSize: 15, color: '#7f8c8d' },
  linkText: { fontSize: 15, color: '#2980b9', fontWeight: 'bold' }
});
