import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../api/axios';
import { Ionicons } from '@expo/vector-icons';

export default function AdminHistoryScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(''); // '' means all

  useEffect(() => { loadChats(filter); }, [filter]);

  const loadChats = async (category) => {
    try {
      setLoading(true);
      const url = category ? `/admin/chats?category=${category}` : '/admin/chats';
      const res = await api.get(url);
      setChats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openChat = (item) => {
    const categoryMap = {
      pregnancy: 'Pregnancy Support',
      diabetes: 'Diabetes Support',
      mental: 'Mental Health Support',
      general: 'General Consultation'
    };
    navigation.navigate('ChatScreen', { 
      session_id: item.id, 
      category: categoryMap[item.disease_category?.toLowerCase()] || 'General Consultation',
      isAdmin: true
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openChat(item)}>
      <Text style={styles.userName}>{item.user_name || 'Unknown User'}</Text>
      <Text style={styles.categoryBadge}>{item.disease_category ? item.disease_category.toUpperCase() : 'GENERAL'}</Text>
      <Text style={styles.messageLabel}>User:</Text>
      <Text numberOfLines={2} style={styles.preview}>{item.message_preview}</Text>
      <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#3498db" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>View History</Text>
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity style={[styles.filterBtn, filter === '' && styles.filterBtnActive]} onPress={() => setFilter('')}>
          <Text style={[styles.filterText, filter === '' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, filter === 'Pregnancy' && styles.filterBtnActive]} onPress={() => setFilter('Pregnancy')}>
          <Text style={[styles.filterText, filter === 'Pregnancy' && styles.filterTextActive]}>Pregnancy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, filter === 'Diabetes' && styles.filterBtnActive]} onPress={() => setFilter('Diabetes')}>
          <Text style={[styles.filterText, filter === 'Diabetes' && styles.filterTextActive]}>Diabetes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, filter === 'Mental Health' && styles.filterBtnActive]} onPress={() => setFilter('Mental Health')}>
          <Text style={[styles.filterText, filter === 'Mental Health' && styles.filterTextActive]}>Mental Health</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 50 }} />
      ) : chats.length === 0 ? (
        <Text style={styles.noData}>No chat history found.</Text>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd', flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 15, padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  filterContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#ecf0f1', marginRight: 8, marginBottom: 8 },
  filterBtnActive: { backgroundColor: '#3498db' },
  filterText: { color: '#7f8c8d', fontSize: 13, fontWeight: 'bold' },
  filterTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#34495e', marginBottom: 5 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#e8f4f8', color: '#2980b9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  messageLabel: { fontSize: 12, color: '#95a5a6', fontWeight: 'bold' },
  preview: { fontSize: 14, color: '#2c3e50', fontStyle: 'italic', marginBottom: 10 },
  date: { fontSize: 12, color: '#bdc3c7', textAlign: 'right' },
  noData: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#7f8c8d' }
});
