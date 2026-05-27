import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleResetPassword = async () => {
    if (!email || !newPassword) {
      setErrorMsg('Please enter both email and new password.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.post('/reset-password', { email, newPassword });
      Alert.alert('Success', res.data.message, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#1a5276" />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <Ionicons name="lock-closed" size={50} color="#2980b9" />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your email to set a new password.</Text>
        </View>

        <View style={styles.formContainer}>
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color="#e74c3c" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={22} color="#7f8c8d" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#95a5a6"
              value={email}
              onChangeText={(text) => { setEmail(text); setErrorMsg(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="key-outline" size={22} color="#7f8c8d" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor="#95a5a6"
              value={newPassword}
              onChangeText={(text) => { setNewPassword(text); setErrorMsg(''); }}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleResetPassword} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f9' },
  scrollContent: { flexGrow: 1, padding: 30, paddingTop: 60 },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 10 },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 40 },
  iconWrapper: { backgroundColor: '#e1f0fa', padding: 20, borderRadius: 25, marginBottom: 20, elevation: 5, shadowColor: '#2980b9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  title: { fontSize: 30, fontWeight: '800', color: '#1a5276', marginBottom: 10, letterSpacing: 0.5 },
  subtitle: { fontSize: 16, color: '#7f8c8d', textAlign: 'center', paddingHorizontal: 20 },
  formContainer: { backgroundColor: '#ffffff', borderRadius: 20, padding: 25, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, marginBottom: 30 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdecea', padding: 12, borderRadius: 10, marginBottom: 15 },
  errorText: { color: '#e74c3c', marginLeft: 8, fontSize: 14, flex: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: '#e9ecef' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#2c3e50' },
  button: { backgroundColor: '#2980b9', paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 3, shadowColor: '#2980b9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, marginTop: 10 },
  buttonDisabled: { backgroundColor: '#95a5a6', elevation: 0 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 }
});
