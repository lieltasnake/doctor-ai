import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import ProfileAvatar from '../components/ProfileAvatar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/me');
      if (res.data) {
        setUser(res.data);
        await AsyncStorage.setItem('userData', JSON.stringify(res.data));
        if (res.data.profile_image) {
          await AsyncStorage.setItem('profile_image', res.data.profile_image);
          setProfileImage(res.data.profile_image);
        } else {
          await AsyncStorage.removeItem('profile_image');
          setProfileImage(null);
        }
      }
    } catch (e) {
      // Fallback to async storage
      const data = await AsyncStorage.getItem('userData');
      if (data) setUser(JSON.parse(data));
      const storedImg = await AsyncStorage.getItem('profile_image');
      setProfileImage(storedImg);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  if (loading) return <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}><ActivityIndicator size="large" color="#1a5276" /></View>;

  // Fallbacks just in case
  const name = user?.full_name || '';
  const email = user?.email || '';
  const role = user?.role || 'user';
  const rawDate = user?.created_at;
  const dateStr = rawDate && !isNaN(new Date(rawDate).getTime()) ? new Date(rawDate).toLocaleDateString() : 'N/A';

  return (
    <View key={i18n.language} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile')}</Text>
        <View style={{width: 40}} />
      </View>
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <ProfileAvatar size={120} editable={false} imageUrl={profileImage} />
        </View>
        
        <View style={styles.card}>
          <Text style={styles.label}>{t('fullName')}</Text>
          <Text style={styles.value}>{name}</Text>
          
          <Text style={styles.label}>{t('emailAddress')}</Text>
          <Text style={styles.value}>{email}</Text>
          
          <Text style={styles.label}>Account Role</Text>
          <Text style={[styles.value, {color: '#2ecc71', fontWeight: 'bold'}]}>{role.toUpperCase()}</Text>
          
          <Text style={styles.label}>Member Since</Text>
          <Text style={styles.value}>{dateStr}</Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('ManageAccountScreen')}>
          <Text style={styles.btnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#1a5276', alignItems: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 5 },
  content: { padding: 20, alignItems: 'center' },
  avatarContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  card: { backgroundColor: '#fff', width: '100%', padding: 25, borderRadius: 20, elevation: 3, marginBottom: 25 },
  label: { fontSize: 12, color: '#000000', backgroundColor: '#ffffff', paddingHorizontal: 2, borderRadius: 2, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, alignSelf: 'flex-start' },
  value: { fontSize: 18, color: '#000000', backgroundColor: '#ffffff', paddingHorizontal: 2, borderRadius: 2, fontWeight: '600', marginBottom: 20, alignSelf: 'flex-start' },
  btn: { backgroundColor: '#1a5276', padding: 18, borderRadius: 15, width: '100%', alignItems: 'center', elevation: 3 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});
