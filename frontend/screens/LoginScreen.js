import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';

import api from '../api/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

export default function LoginScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [langModalVisible, setLangModalVisible] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg(t('pleaseEnterCredentials'));
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg(t('invalidEmail') || 'Please enter a valid email address.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.post('/login', { email, password });
      await AsyncStorage.setItem('userToken', res.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(res.data.user));
      if (res.data.user.role === 'admin') navigation.replace('AdminDashboard');
      else navigation.replace('PatientDashboard');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = async (code) => {
    await i18n.changeLanguage(code);
    await AsyncStorage.setItem('lang', code);
    setLangModalVisible(false);
  };

  return (
    <KeyboardAvoidingView key={i18n.language} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <TouchableOpacity 
        style={styles.langSelectorBtn} 
        onPress={() => setLangModalVisible(true)}
      >
        <Text style={{fontSize:24}}>🌐</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <Text style={{fontSize:50}}>🩺</Text>
          </View>
          <Text style={styles.title}>Doctor AI</Text>
          <Text style={styles.subtitle}>{t('welcomeBack')}</Text>
        </View>

        <View style={styles.formContainer}>
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={{fontSize:20}}>⚠️</Text>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={[styles.inputIcon, {fontSize:20}]}>📧</Text>
            <TextInput
              style={styles.input}
              placeholder={t('emailAddress')}
              placeholderTextColor="#95a5a6"
              value={email}
              onChangeText={(text) => { setEmail(text); setErrorMsg(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputIcon, {fontSize:20}]}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder={t('password')}
              placeholderTextColor="#95a5a6"
              value={password}
              onChangeText={(text) => { setPassword(text); setErrorMsg(''); }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Text style={{fontSize:20}}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPasswordScreen')}>
            <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.buttonText}>{t('signIn')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('dontHaveAccount')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>{t('signup')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={langModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setLangModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Language / ቋንቋ ይምረጡ</Text>
            <View style={styles.divider} />
            
            <TouchableOpacity 
              style={[styles.langOption, i18n.language === 'en' && styles.langOptionSelected]}
              onPress={() => changeLanguage('en')}
            >
              <Text style={[styles.langOptionText, i18n.language === 'en' && styles.langOptionTextSelected]}>🇺🇸 English</Text>
              {i18n.language === 'en' && <Text style={{fontSize:18}}>✅</Text>}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.langOption, i18n.language === 'am' && styles.langOptionSelected]}
              onPress={() => changeLanguage('am')}
            >
              <Text style={[styles.langOptionText, i18n.language === 'am' && styles.langOptionTextSelected]}>🇪🇹 አማርኛ</Text>
              {i18n.language === 'am' && <Text style={{fontSize:18}}>✅</Text>}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.langOption, i18n.language === 'om' && styles.langOptionSelected]}
              onPress={() => changeLanguage('om')}
            >
              <Text style={[styles.langOptionText, i18n.language === 'om' && styles.langOptionTextSelected]}>🇪🇹 Afaan Oromo</Text>
              {i18n.language === 'om' && <Text style={{fontSize:18}}>✅</Text>}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.langOption, i18n.language === 'ti' && styles.langOptionSelected]}
              onPress={() => changeLanguage('ti')}
            >
              <Text style={[styles.langOptionText, i18n.language === 'ti' && styles.langOptionTextSelected]}>🇪🇹 ትግርኛ</Text>
              {i18n.language === 'ti' && <Text style={{fontSize:18}}>✅</Text>}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f9', position: 'relative' },
  langSelectorBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 30 },
  header: { alignItems: 'center', marginBottom: 40 },
  iconWrapper: { backgroundColor: '#e1f0fa', padding: 20, borderRadius: 25, marginBottom: 20, elevation: 5, shadowColor: '#2980b9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  title: { fontSize: 34, fontWeight: '800', color: '#1a5276', marginBottom: 10, letterSpacing: 0.5 },
  subtitle: { fontSize: 16, color: '#000000', backgroundColor: '#ffffff', padding: 5, borderRadius: 5, textAlign: 'center', paddingHorizontal: 20 },
  formContainer: { backgroundColor: '#ffffff', borderRadius: 20, padding: 25, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, marginBottom: 30 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdecea', padding: 12, borderRadius: 10, marginBottom: 15 },
  errorText: { color: '#e74c3c', marginLeft: 8, fontSize: 14, flex: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: '#e9ecef' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#2c3e50' },
  eyeIcon: { padding: 10 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 25 },
  forgotText: { color: '#2980b9', fontSize: 14, fontWeight: '600' },
  button: { backgroundColor: '#2980b9', paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 3, shadowColor: '#2980b9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  buttonDisabled: { backgroundColor: '#95a5a6', elevation: 0 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  footerText: { fontSize: 15, color: '#000000', backgroundColor: '#ffffff', padding: 2, borderRadius: 2 },
  linkText: { fontSize: 15, color: '#2980b9', fontWeight: 'bold' },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 350,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    backgroundColor: '#ffffff',
    padding: 5,
    borderRadius: 5,
    textAlign: 'center',
    marginBottom: 15
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginBottom: 15
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f8f9fa'
  },
  langOptionSelected: {
    backgroundColor: '#e1f0fa',
    borderWidth: 1,
    borderColor: '#3498db'
  },
  langOptionText: {
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#ffffff',
    paddingHorizontal: 5,
    borderRadius: 3,
    fontWeight: '500'
  },
  langOptionTextSelected: {
    color: '#2980b9',
    fontWeight: 'bold'
  }
});
