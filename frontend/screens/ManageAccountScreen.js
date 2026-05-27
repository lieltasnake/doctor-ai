import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import ProfileAvatar from '../components/ProfileAvatar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function ManageAccountScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get('/me');
        if (res.data) {
          setName(res.data.full_name || '');
          setEmail(res.data.email || '');
          setProfileImage(res.data.profile_image || null);
          if (res.data.profile_image) {
            await AsyncStorage.setItem('profile_image', res.data.profile_image);
          } else {
            await AsyncStorage.removeItem('profile_image');
          }
        }
      } catch(e) {
        // Fallback to AsyncStorage
        const data = await AsyncStorage.getItem('userData');
        if (data) {
          const user = JSON.parse(data);
          setName(user.full_name || '');
          setEmail(user.email || '');
        }
        const storedImg = await AsyncStorage.getItem('profile_image');
        setProfileImage(storedImg || null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSave = async () => {
    try {
      const payload = { name, email, profile_image: profileImage };
      if (password) payload.password = password;
      
      const res = await api.put('/update-account', payload);
      
      if (res.data.user) {
        await AsyncStorage.setItem('userData', JSON.stringify(res.data.user));
        if (res.data.user.profile_image) {
          await AsyncStorage.setItem('profile_image', res.data.user.profile_image);
        } else {
          await AsyncStorage.removeItem('profile_image');
        }
      } else {
        if (profileImage) {
          await AsyncStorage.setItem('profile_image', profileImage);
        } else {
          await AsyncStorage.removeItem('profile_image');
        }
      }
      
      Alert.alert('Success', 'Account updated successfully');
      navigation.goBack();
    } catch (e) { Alert.alert('Error', 'Update failed'); }
  };

  return (
    <View key={i18n.language} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('manageAccount')}</Text>
        <View style={{width: 40}} />
      </View>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#1a5276" />
        ) : (
          <>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <ProfileAvatar 
                size={100} 
                editable={true} 
                imageUrl={profileImage} 
                onImageSelected={setProfileImage} 
              />
            </View>
            <TextInput style={styles.input} placeholder={t('fullName')} placeholderTextColor="#95a5a6" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder={t('emailAddress')} placeholderTextColor="#95a5a6" value={email} onChangeText={setEmail} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="New Password (optional)" placeholderTextColor="#95a5a6" value={password} onChangeText={setPassword} secureTextEntry />
            <TouchableOpacity style={styles.btn} onPress={handleSave}>
              <Text style={{color:'#fff', fontWeight: 'bold', fontSize: 16}}>Save Changes</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#1a5276', alignItems: 'center' },
  backBtn: { padding: 5 },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 25 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, color: '#000000' },
  btn: { backgroundColor: '#2ecc71', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 }
});
