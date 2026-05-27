import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import api from '../api/axios';
import { Ionicons } from '@expo/vector-icons';

export default function AdminOverviewScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#3498db" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Overview</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 50 }} />
      ) : stats ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Most Used Disease Category</Text>
            <Text style={styles.cardValueMain}>{stats.mostUsedCategory}</Text>
          </View>
          
          <View style={styles.grid}>
            <View style={styles.smallCard}>
              <Text style={styles.smallCardTitle}>Total Conversations</Text>
              <Text style={styles.smallCardValue}>{stats.totalChats}</Text>
            </View>
            <View style={styles.smallCard}>
              <Text style={styles.smallCardTitle}>Active Users</Text>
              <Text style={styles.smallCardValue}>{stats.activeUsers}</Text>
            </View>
            <View style={styles.smallCard}>
              <Text style={styles.smallCardTitle}>Total Users</Text>
              <Text style={styles.smallCardValue}>{stats.totalUsers}</Text>
            </View>
            <View style={styles.smallCard}>
              <Text style={styles.smallCardTitle}>System Health</Text>
              <Text style={[styles.smallCardValue, { color: stats.systemHealth === 100 ? '#2ecc71' : (stats.systemHealth >= 50 ? '#f39c12' : '#e74c3c') }]}>
                {stats.systemHealth !== undefined ? `${stats.systemHealth}%` : 'N/A'}
              </Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.noData}>No data available.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd', flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 15, padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  content: { padding: 20 },
  card: { backgroundColor: '#3498db', padding: 25, borderRadius: 12, marginBottom: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  cardTitle: { fontSize: 16, color: '#ecf0f1', fontWeight: 'bold', marginBottom: 10 },
  cardValueMain: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  smallCard: { backgroundColor: '#fff', width: '48%', padding: 20, borderRadius: 12, marginBottom: 15, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  smallCardTitle: { fontSize: 14, color: '#7f8c8d', fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  smallCardValue: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50' },
  noData: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#7f8c8d' }
});
