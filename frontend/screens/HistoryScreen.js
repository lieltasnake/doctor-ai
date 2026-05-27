import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen({ navigation, route }) {
  const [history, setHistory] = useState([]);
  
  const filterCategory = route.params?.filterCategory || '';
  const getBackendCategory = (cat) => {
    if (cat === 'Pregnancy Support') return 'pregnancy';
    if (cat === 'Diabetes Support') return 'diabetes';
    if (cat === 'Mental Health Support') return 'mental';
    return '';
  };
  const targetCategory = getBackendCategory(filterCategory);

  const loadHistory = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        const user = JSON.parse(data);
        const userId = user.id;
        const res = await api.get(`/api/chat/sessions/${userId}`);
        console.log("Sessions:", res.data);
        setHistory(res.data);
      }
    } catch (e) {
      console.error("Failed to load history sessions:", e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const clearHistory = async () => {
    Alert.alert('Confirm', 'Delete all history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete('/history');
          setHistory([]);
          Alert.alert('Success', 'History cleared');
        } catch (e) { Alert.alert('Error', 'Failed to delete'); }
      }}
    ]);
  };

  const deleteSession = async (sessionId) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/chat/session/${sessionId}`);
          loadHistory();
        } catch (e) {
          console.error("Failed to delete session:", e);
          Alert.alert('Error', 'Could not delete conversation.');
        }
      }}
    ]);
  };

  const openConversation = (item) => {
    const categoryMap = {
      pregnancy: 'Pregnancy Support',
      diabetes: 'Diabetes Support',
      mental: 'Mental Health Support',
      general: 'General Consultation'
    };
    navigation.navigate('ChatScreen', { 
      session_id: item.id, 
      category: categoryMap[item.category] || 'General Consultation'
    });
  };

  const filteredHistory = history.filter(item => {
    if (targetCategory) {
      return item.category === targetCategory;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat History</Text>
        <TouchableOpacity style={styles.backBtn} onPress={clearHistory}>
          <Text style={{color: '#e74c3c', fontSize: 16, fontWeight: '600'}}>Delete All</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 15 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openConversation(item)} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
              <Text style={{fontWeight: 'bold', fontSize: 16, color: '#3498db', flex: 1, marginRight: 10}} numberOfLines={1}>
                {item.title}
              </Text>
              <TouchableOpacity onPress={() => deleteSession(item.id)} style={{padding: 5}}>
                <Ionicons name="trash-outline" size={20} color="#e74c3c" />
              </TouchableOpacity>
            </View>
            <View>
              <Text style={styles.message} numberOfLines={2}>
                Category: {item.category ? item.category.toUpperCase() : 'GENERAL'}
              </Text>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 50, color: '#7f8c8d'}}>No history found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#1a5276', alignItems: 'center', elevation: 5 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 5 },
  card: { backgroundColor: '#fff', padding: 20, marginBottom: 15, borderRadius: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  date: { fontSize: 11, color: '#95a5a6', marginTop: 5 },
  message: { fontSize: 14, color: '#7f8c8d', lineHeight: 20 }
});
