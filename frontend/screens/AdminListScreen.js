import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import api from '../api/axios';
import { Ionicons } from '@expo/vector-icons';

export default function AdminListScreen({ route, navigation }) {
  const { type } = route.params; // 'users', 'patients', 'admins', 'chats'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      if (type === 'users') endpoint = '/admin/users';
      else if (type === 'patients') endpoint = '/admin/users?role=patient';
      else if (type === 'admins') endpoint = '/admin/users?role=admin';
      else if (type === 'chats') endpoint = '/admin/chats';

      const res = await api.get(endpoint);
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    if (type === 'chats') {
      return (
        <View style={styles.card}>
          <Text style={styles.title}>{item.user_name || 'Unknown User'}</Text>
          <Text style={styles.subtitle}>Category: {item.disease_category}</Text>
          <Text numberOfLines={2} style={styles.preview}>{item.message_preview}</Text>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.title}>{item.full_name}</Text>
        <Text style={styles.subtitle}>{item.email}</Text>
        <Text style={styles.roleBadge}>Role: {item.role}</Text>
        <Text style={styles.date}>Joined: {new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#3498db" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Total {type.charAt(0).toUpperCase() + type.slice(1)}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 50 }} />
      ) : data.length === 0 ? (
        <Text style={styles.noData}>No data available.</Text>
      ) : (
        <FlatList
          data={data}
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
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#34495e' },
  subtitle: { fontSize: 14, color: '#7f8c8d', marginVertical: 4 },
  preview: { fontSize: 14, color: '#2c3e50', fontStyle: 'italic', marginBottom: 5 },
  roleBadge: { fontSize: 13, fontWeight: '600', color: '#2980b9' },
  date: { fontSize: 12, color: '#bdc3c7', marginTop: 5 },
  noData: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#7f8c8d' }
});
