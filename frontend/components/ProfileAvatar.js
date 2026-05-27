import React, { useState, useEffect, useRef } from 'react';
import { View, Image, TouchableOpacity, Animated, StyleSheet, Modal, Text, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileAvatar({ size = 110, editable = false, imageUrl = null, onImageSelected }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const handlePickImage = async () => {
    setModalVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      if (onImageSelected) onImageSelected(base64Uri);
    }
  };

  const handleTakePhoto = async () => {
    setModalVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      if (onImageSelected) onImageSelected(base64Uri);
    }
  };

  const handleRemoveImage = () => {
    setModalVisible(false);
    if (onImageSelected) onImageSelected(null);
  };

  const handleViewPhoto = () => {
    setModalVisible(false);
    if (imageUrl) setViewingPhoto(true);
  };

  const renderAvatarContent = () => {
    if (imageUrl && imageUrl !== 'null') {
      if (imageUrl.length < 10 && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
        return (
          <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#eaf4fb', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#3498db' }}>
            <Text style={{ fontSize: size * 0.55 }}>{imageUrl}</Text>
          </View>
        );
      }
      return (
        <Image 
          source={{ uri: imageUrl }} 
          style={{ width: size, height: size, borderRadius: size / 2 }} 
        />
      );
    }

    return (
      <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
          style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="person" size={size * 0.55} color="#ffffff" style={{ opacity: 0.95 }} />
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={() => {
          if (editable) setModalVisible(true);
        }}
        disabled={!editable}
      >
        <View style={[styles.avatarWrapper, { width: size, height: size, borderRadius: size / 2 }]}>
          {renderAvatarContent()}
        </View>
        
        {editable && (
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Profile Photo</Text>
            
            {imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:') && imageUrl.length < 10 ? null : (
              imageUrl && (
                <TouchableOpacity style={styles.sheetOption} onPress={handleViewPhoto}>
                  <Ionicons name="image-outline" size={24} color="#2c3e50" />
                  <Text style={styles.sheetOptionText}>View Photo</Text>
                </TouchableOpacity>
              )
            )}
            
            <TouchableOpacity style={styles.sheetOption} onPress={handleTakePhoto}>
              <Ionicons name="camera-outline" size={24} color="#2c3e50" />
              <Text style={styles.sheetOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={handlePickImage}>
              <Ionicons name="images-outline" size={24} color="#2c3e50" />
              <Text style={styles.sheetOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
              <Ionicons name="happy-outline" size={24} color="#2c3e50" />
              <Text style={styles.sheetOptionText}>Pick an Emoji Avatar</Text>
            </TouchableOpacity>

            {showEmojiPicker && (
              <View style={styles.emojiRow}>
                {['😀', '😎', '🤓', '🤠', '👨‍⚕️', '👩‍⚕️', '👦', '👧', '👨', '👩', '👱‍♂️', '👱‍♀️', '👨‍🦱', '👩‍🦱', '👨‍🦰', '👩‍🦰', '👴', '👵', '🧕', '🧔'].map(e => (
                  <TouchableOpacity key={e} onPress={() => { setModalVisible(false); setShowEmojiPicker(false); if(onImageSelected) onImageSelected(e); }} style={styles.emojiItem}>
                    <Text style={styles.emojiText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {imageUrl && (
              <TouchableOpacity style={styles.sheetOption} onPress={handleRemoveImage}>
                <Ionicons name="trash-outline" size={24} color="#e74c3c" />
                <Text style={[styles.sheetOptionText, { color: '#e74c3c' }]}>Remove Avatar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.sheetOption, { borderBottomWidth: 0, marginTop: 10 }]} onPress={() => setModalVisible(false)}>
              <Text style={[styles.sheetOptionText, { color: '#7f8c8d', textAlign: 'center', width: '100%' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={viewingPhoto} transparent={true} animationType="zoom">
        <View style={styles.viewerContainer}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewingPhoto(false)}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: imageUrl }} style={styles.viewerImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  avatarWrapper: { elevation: 8, shadowColor: '#00f2fe', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, backgroundColor: '#fff' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1a5276', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 5, backgroundColor: '#ddd', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 20, textAlign: 'center' },
  sheetOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#ecf0f1' },
  sheetOptionText: { fontSize: 16, marginLeft: 15, color: '#2c3e50', fontWeight: '500' },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingVertical: 10, backgroundColor: '#f8f9fa', borderRadius: 10, marginTop: 5, marginBottom: 5 },
  emojiItem: { padding: 10 },
  emojiText: { fontSize: 28 },
  viewerContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  viewerClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  viewerImage: { width: '100%', height: '80%' }
});
