import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';
import ProfileAvatar from '../components/ProfileAvatar';
import { useTranslation } from 'react-i18next';

const pregnancyImg = require('../assets/images/pregnancy.jpg');
const diabetesImg = require('../assets/images/diabetes.jpg');
const mentalHealthImg = require('../assets/images/mental_health.jpg');

export default function PatientDashboard({ navigation }) {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      const fetchUser = async () => {
        try {
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
          const data = await AsyncStorage.getItem('userData');
          if (data) {
            setUser(JSON.parse(data));
          }
          const storedImg = await AsyncStorage.getItem('profile_image');
          setProfileImage(storedImg);
        }
      };
      fetchUser();
    }, [])
  );

  const openChat = (category) => navigation.navigate('ChatScreen', { category });

  const name = user?.full_name || user?.name || t('patient');

  return (
    <View key={i18n.language} style={styles.container}>
      <LinearGradient colors={['#1a5276', '#2980b9']} style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>{t('welcomeBackComma')}</Text>
          <Text style={styles.userName}>{name}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen')} activeOpacity={0.7}>
          <ProfileAvatar size={54} editable={false} imageUrl={profileImage} />
        </TouchableOpacity>
      </LinearGradient>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{t('selectSupportCategory')}</Text>
        
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => openChat('Pregnancy Support')}>
          <LinearGradient colors={['#fdfbfb', '#ebedee']} style={styles.cardGradient}>
            <Image source={pregnancyImg} style={styles.cardImage} />
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>{t('pregnancySupport')}</Text>
              <Text style={styles.cardDesc}>{t('pregnancySupportDesc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => openChat('Diabetes Support')}>
          <LinearGradient colors={['#fdfbfb', '#ebedee']} style={styles.cardGradient}>
            <Image source={diabetesImg} style={styles.cardImage} />
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>{t('diabetesSupport')}</Text>
              <Text style={styles.cardDesc}>{t('diabetesSupportDesc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => openChat('Mental Health Support')}>
          <LinearGradient colors={['#fdfbfb', '#ebedee']} style={styles.cardGradient}>
            <Image source={mentalHealthImg} style={styles.cardImage} />
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>{t('mentalHealth')}</Text>
              <Text style={styles.cardDesc}>{t('mentalHealthDesc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f9' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 25, 
    paddingTop: 65, 
    paddingBottom: 35,
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    shadowColor: '#1a5276', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 10, 
    elevation: 8 
  },
  welcomeText: { color: '#a9cce3', fontSize: 15, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  userName: { color: '#ffffff', fontSize: 26, fontWeight: '800', letterSpacing: 0.5 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#2c3e50', marginBottom: 20, marginTop: 10, letterSpacing: 0.5 },
  card: { 
    marginBottom: 18, 
    borderRadius: 20, 
    backgroundColor: '#ffffff',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 5 
  },
  cardGradient: {
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 18, 
    borderRadius: 20,
  },
  cardImage: { width: 65, height: 65, borderRadius: 16, marginRight: 18 },
  cardTextContainer: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: 18, color: '#2c3e50', fontWeight: '800', marginBottom: 6 },
  cardDesc: { fontSize: 14, color: '#7f8c8d', lineHeight: 20, paddingRight: 10 }
});
