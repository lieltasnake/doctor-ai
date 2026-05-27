import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import api from '../api/axios';
import { Ionicons } from '@expo/vector-icons';

export default function AdminUsersScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    Alert.alert('Confirm', 'Are you sure you want to delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/admin/user/${id}`);
          loadUsers();
        } catch(e) { Alert.alert('Error', 'Failed to delete'); }
      }}
    ]);
  };

  const changeRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'patient' : 'admin';
    try {
      await api.put(`/admin/user/${id}/role`, { role: newRole });
      loadUsers();
    } catch(e) { Alert.alert('Error', 'Failed to update role'); }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.full_name}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.role}>Role: {item.role}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => changeRole(item.id, item.role)}>
          <Text style={styles.actionText}>Make {item.role === 'admin' ? 'Patient' : 'Admin'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => deleteUser(item.id)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#3498db" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Users</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={users}
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
  infoContainer: { marginBottom: 10 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#34495e' },
  email: { fontSize: 14, color: '#7f8c8d', marginVertical: 4 },
  role: { fontSize: 14, fontWeight: '600', color: '#2980b9' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#ecf0f1', paddingTop: 10 },
  actionBtn: { padding: 8, backgroundColor: '#e8f4f8', borderRadius: 6, flex: 1, marginRight: 5, alignItems: 'center' },
  deleteBtn: { backgroundColor: '#fdeced', marginLeft: 5, marginRight: 0 },
  actionText: { color: '#2980b9', fontWeight: 'bold' },
  deleteText: { color: '#e74c3c', fontWeight: 'bold' }
});
