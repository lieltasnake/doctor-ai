import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/axios';
import ProfileAvatar from '../components/ProfileAvatar';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboard({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      const fetchUser = async () => {
        try {
          const res = await api.get('/me');
          if (res.data) {
            setUser(res.data);
            await AsyncStorage.setItem('userData', JSON.stringify(res.data));
          }
        } catch (e) {
          const data = await AsyncStorage.getItem('userData');
          if (data) setUser(JSON.parse(data));
        }
      };
      fetchUser();
    }, [])
  );

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (e) {
      setError('Failed to load dashboard statistics.');
      Alert.alert('Error', 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const profileImage = user?.profile_image || null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>System Overview & Stats</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen')}>
          <ProfileAvatar size={45} editable={false} imageUrl={profileImage} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2980b9" />
          <Text style={styles.loadingText}>Loading Dashboard Data...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadStats}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>System Summary</Text>
          <View style={styles.cardsGrid}>
            <TouchableOpacity style={[styles.card, { backgroundColor: '#3498db' }]} onPress={() => navigation.navigate('AdminListScreen', { type: 'users' })}>
              <Text style={styles.cardNumber}>{stats?.totalUsers || 0}</Text>
              <Text style={styles.cardLabel}>Total Users</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.card, { backgroundColor: '#2ecc71' }]} onPress={() => navigation.navigate('AdminListScreen', { type: 'patients' })}>
              <Text style={styles.cardNumber}>{stats?.totalPatients || 0}</Text>
              <Text style={styles.cardLabel}>Total Patients</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.card, { backgroundColor: '#9b59b6' }]} onPress={() => navigation.navigate('AdminListScreen', { type: 'admins' })}>
              <Text style={styles.cardNumber}>{stats?.totalAdmins || 0}</Text>
              <Text style={styles.cardLabel}>Total Admins</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.card, { backgroundColor: '#e67e22' }]} onPress={() => navigation.navigate('AdminListScreen', { type: 'chats' })}>
              <Text style={styles.cardNumber}>{stats?.totalChats || 0}</Text>
              <Text style={styles.cardLabel}>Total Chats</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AdminUsersScreen')}>
              <Text style={styles.actionBtnText}>Manage Users</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AdminHistoryScreen')}>
              <Text style={styles.actionBtnText}>View History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AdminOverviewScreen')}>
              <Text style={styles.actionBtnText}>System Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { borderLeftColor: '#2ecc71' }]} onPress={() => navigation.navigate('PatientDashboard')}>
              <Text style={styles.actionBtnText}>Test Patient App</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Login')}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 25, 
    paddingTop: 60, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#ecf0f1', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a5276' },
  subtitle: { fontSize: 14, color: '#7f8c8d' },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 15, marginTop: 10 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#7f8c8d', fontSize: 16 },
  errorText: { color: '#e74c3c', fontSize: 16, marginBottom: 15 },
  retryBtn: { backgroundColor: '#3498db', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: 'bold' },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  card: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4
  },
  cardNumber: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  cardLabel: { fontSize: 14, color: '#fff', fontWeight: '600' },
  actionContainer: { marginBottom: 30 },
  actionBtn: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db'
  },
  actionBtnText: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  logoutBtn: { alignItems: 'center', padding: 15, marginTop: 10 },
  logoutText: { color: '#e74c3c', fontSize: 18, fontWeight: 'bold' }
});
