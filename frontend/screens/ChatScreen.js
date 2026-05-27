import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Modal, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated, Easing, Keyboard
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import ProfileAvatar from '../components/ProfileAvatar';

import { useAudioRecorder, requestRecordingPermissionsAsync, RecordingPresets, setAudioModeAsync } from 'expo-audio';
import { useTranslation } from 'react-i18next';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system/legacy';

const BASE_URL = 'https://doctor-ai-04d3.onrender.com';

const customFetch = async (url, options = {}) => {
  const token = await AsyncStorage.getItem('userToken');
  const fullUrl = url.startsWith('/') ? `${BASE_URL}${url}` : url;
  const headers = { ...options.headers };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return global.fetch(fullUrl, { ...options, headers });
};

// ─── Typing indicator dots ────────────────────────────────────────────────────
function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, easing: Easing.ease, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0,  duration: 300, easing: Easing.ease, useNativeDriver: true }),
        ])
      ).start();
    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.aiAvatarSmall}>
        <Text style={styles.aiAvatarEmoji}>🩺</Text>
      </View>
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[styles.typingDot, { transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Recording overlay ────────────────────────────────────────────────────────
function RecordingOverlay({ isRecording, onStop }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.5, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  if (!isRecording) return null;

  return (
    <TouchableOpacity style={styles.recordingOverlay} activeOpacity={0.9} onPress={onStop}>
      <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
      <View style={styles.micCircle}>
        <Text style={{fontSize:36, color:'#fff'}}>🎤</Text>
      </View>
      <Text style={styles.recordingText}>Listening...</Text>
      <Text style={styles.recordingSubtext}>Tap anywhere to stop</Text>
    </TouchableOpacity>
  );
}

// ─── Risk badge ───────────────────────────────────────────────────────────────
function RiskBadge({ risk }) {
  if (!risk) return null;
  const map = {
    High:   { color: '#e74c3c', bg: '#fdecea', icon: '🔴' },
    Medium: { color: '#e67e22', bg: '#fef5e7', icon: '🟡' },
    Low:    { color: '#27ae60', bg: '#eafaf1', icon: '🟢' },
  };
  const style = map[risk] || map.Low;
  return (
    <View style={[styles.riskBadge, { backgroundColor: style.bg }]}>
      <Text style={[styles.riskText, { color: style.color }]}>
        {style.icon} Risk: {risk}
      </Text>
    </View>
  );
}

// ─── AI message bubble ────────────────────────────────────────────────────────
function AiMessage({ item }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  const isGreeting = item.phase === 'greeting';
  const hasCard = item.condition || item.risk;

  return (
    <Animated.View
      style={[
        styles.aiRow,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.aiAvatar}>
        <Text style={styles.aiAvatarEmoji}>🩺</Text>
      </View>
      <View style={[styles.aiBubble, item.isError && styles.errorBubble]}>
        {/* Message text */}
        <Text style={styles.aiText}>{(item.message || item.text).replace(/\*\*/g, '').replace(/\*/g, '')}</Text>

        {/* Card section — only shown in diagnosis phase */}
        {hasCard && (
          <View style={styles.diagnosisCard}>
            <View style={styles.diagnosisDivider} />
            {item.condition && (
              <View style={styles.conditionRow}>
                <Text style={{fontSize:14}}>🩺</Text>
                <Text style={styles.conditionText}> {item.condition}</Text>
              </View>
            )}
            <RiskBadge risk={item.risk} />
          </View>
        )}

        <Text style={styles.msgTime}>{item.time}</Text>
      </View>
    </Animated.View>
  );
}

// ─── User message bubble ──────────────────────────────────────────────────────
function UserMessage({ item }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.userRow, { opacity: fadeAnim }]}>
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{item.message || item.text}</Text>
        <Text style={styles.msgTimeUser}>{item.time}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Main ChatScreen ──────────────────────────────────────────────────────────
export default function ChatScreen({ route, navigation }) {
  const { t, i18n } = useTranslation();
  const { category, isAdmin } = route.params || { category: 'Mental Health Support', isAdmin: false };

  const getCategoryKey = (cat) => {
    if (cat === 'Pregnancy Support')    return 'pregnancySupport';
    if (cat === 'Diabetes Support')     return 'diabetesSupport';
    return 'mentalHealthSupport';
  };
  const categoryKey = getCategoryKey(category);

  const getCategoryColor = (cat) => {
    if (cat === 'Pregnancy Support') return '#8e44ad';
    if (cat === 'Diabetes Support')  return '#2980b9';
    return '#1a5276';
  };
  const headerColor = getCategoryColor(category);

  const getApiCategory = () => {
    if (category === 'Pregnancy Support') return 'pregnancy';
    if (category === 'Diabetes Support')  return 'diabetes';
    if (category === 'Mental Health Support') return 'mental';
    return 'general';
  };

  const getNow = () => {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState('');
  const [menuVisible, setMenuVisible]   = useState(false);
  const [langModalVisible, setLangModal] = useState(false);
  const [userName, setUserName]         = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [sessionId, setSessionId]       = useState(null);

  // recordingUrlRef captures the URL from the status callback (more reliable than .uri)
  const recordingUrlRef = useRef(null);
  const [isRecording, setIsRecording]   = useState(false);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const flatListRef   = useRef();

  const generateUUID = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });

  const addMessage = (role, text, extras = {}) => {
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role, message: text, time: getNow(), ...extras }
    ]);
  };

  // ── Init chat ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const passedSessionId = route.params?.session_id;
      if (passedSessionId) {
        setSessionId(passedSessionId);
        setIsLoading(true);
        try {
          const token = await AsyncStorage.getItem('userToken');
          const resp  = await global.fetch(`${BASE_URL}/api/chat/session/${passedSessionId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const history = await resp.json();
          if (Array.isArray(history)) {
            setMessages(history.map((m, i) => ({
              id: `h-${i}`, role: m.role, message: m.message, time: ''
            })));
          }
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
      } else {
        // Create session + show welcome
        setIsLoading(true);
        try {
          const token    = await AsyncStorage.getItem('userToken');
          const userData = await AsyncStorage.getItem('userData');
          const userId   = userData ? JSON.parse(userData).id : null;
          const resp     = await global.fetch(`${BASE_URL}/api/chat/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ user_id: userId, category: getApiCategory() })
          });
          const data = await resp.json();
          setSessionId(data.session_id || generateUUID());
        } catch (e) {
          setSessionId(generateUUID());
        }
        setIsLoading(false);
        // Welcome message
        const hour = new Date().getHours();
        const greetKey = hour < 12 ? 'goodMorning' : hour < 17 ? 'goodAfternoon' : hour < 21 ? 'goodEvening' : 'goodNight';
        const greet = t(greetKey);
        setTimeout(() => {
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            message: `${greet}! 👋 ${t('welcomeMessage1')}\n\n${t('welcomeMessage2')}`,
            time: getNow(),
            phase: 'greeting'
          }]);
        }, 400);
      }
    };
    init();
  }, [route.params?.session_id, category]);

  useFocusEffect(useCallback(() => {
    (async () => {
      const data = await AsyncStorage.getItem('userData');
      if (data) setUserName(JSON.parse(data).full_name || '');
      const img = await AsyncStorage.getItem('profile_image');
      setProfileImage(img || null);
    })();
  }, []));

  const changeLanguage = async (code) => {
    await i18n.changeLanguage(code);
    await AsyncStorage.setItem('lang', code);
    setLangModal(false);
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async (overrideText = null, voiceMode = false) => {
    const isOverrideString = typeof overrideText === 'string';
    const text = isOverrideString ? overrideText.trim() : input.trim();
    if (!text || (isLoading && !voiceMode)) return;
    
    Keyboard.dismiss();
    addMessage('user', text);
    if (!isOverrideString) setInput('');
    setIsLoading(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const apiCategory = getApiCategory();
      let url = `${BASE_URL}/api/chat/message`;
      let body = { session_id: sessionId, message: text, category: apiCategory, language: i18n.language };

      if (apiCategory === 'mental') {
        url  = `${BASE_URL}/api/chat/mental`;
        body = { session_id: sessionId, message: text, language: i18n.language };
      }

      const token = await AsyncStorage.getItem('userToken');
      const resp  = await global.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      if (!resp.ok) {
        addMessage('assistant', 'Something went wrong. Please try again.', { isError: true });
        return;
      }

      const data = await resp.json();
      const replyText = data.reply || '';
      
      addMessage('assistant', replyText, {
        condition: data.condition,
        risk: data.risk,
        phase: data.phase
      });

      // Automatically speak the response if voiceMode is enabled
      if (voiceMode && replyText) {
        Speech.speak(replyText.replace(/[*_#]/g, ''), { language: 'en' });
      }
    } catch (e) {
      console.error(e);
      addMessage('assistant', 'Could not connect to server. Check your connection.', { isError: true });
    } finally {
      setIsLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  // ── Voice ──────────────────────────────────────────────────────────────────
  const toggleVoice = async () => {
    try {
      if (isRecording || audioRecorder.isRecording) {
        // ── STOP ──
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        console.log('[Voice] Final URI:', uri);

        setIsRecording(false);

        if (!uri) {
          console.warn('[Voice] No URI — recording too short or failed.');
          setIsLoading(false);
          return;
        }

        setIsLoading(true);

        // Wait up to 1.5 seconds for the file to be flushed to disk
        let fileInfo = await FileSystem.getInfoAsync(uri);
        let retries = 0;
        while (!fileInfo.exists && retries < 5) {
          await new Promise(resolve => setTimeout(resolve, 300));
          fileInfo = await FileSystem.getInfoAsync(uri);
          retries++;
        }

        if (!fileInfo.exists) {
          console.warn('[Voice] File still does not exist after waiting. URI:', uri);
          alert('Recording failed. Please speak clearly without background noise.');
          setIsLoading(false);
          return;
        }

        console.log('[Voice] Copying to safe document directory...');
        const safeUri = FileSystem.documentDirectory + 'upload_temp.m4a';
        
        try {
          await FileSystem.copyAsync({ from: uri, to: safeUri });
        } catch (copyErr) {
          console.error('[Voice] Failed to copy audio file:', copyErr);
          setIsLoading(false);
          return;
        }

        console.log('[Voice] Uploading via FileSystem.uploadAsync from:', safeUri);
        const uploadResult = await FileSystem.uploadAsync(
          `${BASE_URL}/speech-to-text`,
          safeUri,
          {
            httpMethod: 'POST',
            uploadType: 1, // FileSystemUploadType.MULTIPART
            fieldName: 'audio',
            mimeType: 'audio/m4a',
            headers: { Accept: 'application/json' },
          }
        );

        // Cleanup
        await FileSystem.deleteAsync(safeUri, { idempotent: true });

        console.log('[Voice] Upload status:', uploadResult.status);
        if (uploadResult.status !== 200) {
          console.error('[Voice] Upload failed:', uploadResult.body);
          setIsLoading(false);
          return;
        }

        const respData = JSON.parse(uploadResult.body);
        console.log('[Voice] Transcription:', respData.text);
        if (respData.text) {
          await sendMessage(respData.text, true);
        }
        setIsLoading(false);

      } else {
        // ── START ──
        Speech.stop();

        const { granted } = await requestRecordingPermissionsAsync();
        if (!granted) {
          alert('Microphone permission required.');
          return;
        }

        await setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        // Must call prepareToRecordAsync first — required by expo-audio
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
        setIsRecording(true);
        setInput('');
      }
    } catch (e) {
      console.error('[Voice] Error:', e);
      setIsLoading(false);
      setIsRecording(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    setMenuVisible(false);
    navigation.replace('Login');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerColor }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{fontSize:24, color:'#fff', fontWeight:'bold'}}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t(categoryKey)}</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Dr. AI is online</Text>
          </View>
        </View>
        {!isAdmin ? (
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <ProfileAvatar size={36} editable={false} imageUrl={profileImage} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) =>
          item.role === 'user'
            ? <UserMessage item={item} />
            : <AiMessage item={item} />
        }
        ListFooterComponent={isLoading ? <TypingIndicator /> : null}
      />

      {/* Quick suggestions */}
      {!isAdmin && messages.length <= 1 && !isLoading && (
        <View style={styles.suggestionsRow}>
          {[t('suggestion1'), t('suggestion2'), t('suggestion3')].map(s => (
            <TouchableOpacity key={s} style={styles.suggestion} onPress={() => setInput(s)}>
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recording Overlay */}
      <RecordingOverlay isRecording={isRecording} onStop={toggleVoice} />

      {/* Input bar */}
      {!isAdmin && (
        <View style={styles.inputArea}>
          <TouchableOpacity
            style={[styles.voiceBtn, isRecording && styles.recordingBtn]}
            onPress={toggleVoice}
          >
            <Text style={{fontSize:22}}>{isRecording ? '🎤' : '🎙️'}</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={isRecording ? '🎙️ Listening...' : 'Type a message...'}
            placeholderTextColor="#aaa"
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || isLoading}
          >
            <Text style={{fontSize:18, color:'#fff'}}>➤</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Menu modal */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={styles.menu}>
            <View style={[styles.menuHeader, { backgroundColor: headerColor }]}>
              <ProfileAvatar size={50} editable={false} imageUrl={profileImage} />
              <Text style={styles.menuHeaderName}>{userName || 'Patient'}</Text>
            </View>
            {[
              { label: 'My Profile',    emoji: '👤', screen: 'ProfileScreen'       },
              { label: 'Manage Account',emoji: '⚙️', screen: 'ManageAccountScreen' },
              { label: 'History',       emoji: '🕐', screen: 'HistoryScreen'       },
            ].map(item => (
              <TouchableOpacity
                key={item.screen}
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  if (item.screen === 'HistoryScreen') {
                    navigation.navigate('HistoryScreen', { filterCategory: category });
                  } else {
                    navigation.navigate(item.screen);
                  }
                }}
              >
                <Text style={{fontSize:18}}>{item.emoji}</Text>
                <Text style={styles.menuText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); setLangModal(true); }}>
              <Text style={{fontSize:18}}>🌐</Text>
              <Text style={styles.menuText}>Language</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={handleLogout}>
              <Text style={{fontSize:18}}>🚪</Text>
              <Text style={[styles.menuText, { color: '#e74c3c' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Language modal */}
      <Modal visible={langModalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.langOverlay} activeOpacity={1} onPress={() => setLangModal(false)}>
          <View style={styles.langContainer}>
            <Text style={styles.langTitle}>🌐 Select Language</Text>
            {[
              { code: 'en', label: '🇺🇸 English'       },
              { code: 'am', label: '🇪🇹 አማርኛ'          },
              { code: 'om', label: '🇪🇹 Afaan Oromo'    },
              { code: 'ti', label: '🇪🇹 ትግርኛ'          },
            ].map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langOption, i18n.language === lang.code && styles.langOptionActive]}
                onPress={() => changeLanguage(lang.code)}
              >
                <Text style={[styles.langOptionText, i18n.language === lang.code && { color: '#2980b9', fontWeight: 'bold' }]}>
                  {lang.label}
                </Text>
                {i18n.language === lang.code && <Text style={{fontSize:20}}>✅</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f0f4f8' },

  // Header
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14, elevation: 6 },
  backBtn:       { marginRight: 12 },
  headerCenter:  { flex: 1 },
  headerTitle:   { color: '#fff', fontSize: 17, fontWeight: '700' },
  onlineRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2ecc71', marginRight: 5 },
  onlineText:    { color: 'rgba(255,255,255,0.8)', fontSize: 11 },

  // Messages
  messageList:   { paddingHorizontal: 14, paddingTop: 18, paddingBottom: 10 },

  // AI bubble
  aiRow:         { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14 },
  aiAvatar:      { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eaf4fb', borderWidth: 1.5, borderColor: '#aed6f1', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  aiAvatarSmall: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#eaf4fb', borderWidth: 1.5, borderColor: '#aed6f1', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  aiAvatarEmoji: { fontSize: 18 },
  aiBubble:      { flex: 1, backgroundColor: '#fff', borderRadius: 18, borderTopLeftRadius: 4, padding: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, maxWidth: '88%' },
  aiText:        { fontSize: 15, color: '#2c3e50', lineHeight: 23 },
  errorBubble:   { backgroundColor: '#fff5f5', borderLeftWidth: 3, borderLeftColor: '#e74c3c' },

  // Diagnosis card
  diagnosisCard:   { marginTop: 10 },
  diagnosisDivider:{ height: 1, backgroundColor: '#ecf0f1', marginBottom: 8 },
  conditionRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  conditionText:   { fontSize: 13, color: '#1a5276', fontWeight: '600' },
  riskBadge:       { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 4 },
  riskText:        { fontSize: 12, fontWeight: '700' },

  // User bubble
  userRow:    { alignItems: 'flex-end', marginBottom: 14 },
  userBubble: { backgroundColor: '#2980b9', borderRadius: 18, borderBottomRightRadius: 4, padding: 12, paddingHorizontal: 16, maxWidth: '78%', elevation: 2 },
  userText:   { color: '#fff', fontSize: 15, lineHeight: 22 },

  // Time
  msgTime:     { fontSize: 10, color: '#bdc3c7', marginTop: 6, alignSelf: 'flex-end' },
  msgTimeUser: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 4, alignSelf: 'flex-end' },

  // Typing indicator
  typingContainer: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14, paddingLeft: 14 },
  typingBubble:    { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 18, borderTopLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', elevation: 2, gap: 5 },
  typingDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#aed6f1' },

  // Quick suggestions
  suggestionsRow: { flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 8, flexWrap: 'wrap', gap: 8 },
  suggestion:     { backgroundColor: '#eaf4fb', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#aed6f1' },
  // Voice
  recordingOverlay:{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.92)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  pulseCircle:    { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(231, 76, 60, 0.2)' },
  micCircle:      { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e74c3c', justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#e74c3c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  recordingText:  { marginTop: 24, fontSize: 22, fontWeight: 'bold', color: '#e74c3c' },
  recordingSubtext:{ marginTop: 8, fontSize: 14, color: '#7f8c8d' },

  // Input area
  inputArea:   { flexDirection: 'row', padding: 10, paddingHorizontal: 12, backgroundColor: '#fff', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#e8edf2', paddingBottom: Platform.OS === 'ios' ? 28 : 10 },
  voiceBtn:    { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0f4f8', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  recordingBtn:{ backgroundColor: '#e74c3c' },
  input:       { flex: 1, backgroundColor: '#f0f4f8', borderRadius: 22, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, fontSize: 15, color: '#2c3e50', maxHeight: 100 },
  sendBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2980b9', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendBtnDisabled: { backgroundColor: '#aed6f1' },

  // Menu
  modalBg:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  menu:         { backgroundColor: '#fff', marginTop: 90, marginRight: 16, borderRadius: 16, width: 220, overflow: 'hidden', elevation: 12 },
  menuHeader:   { padding: 18, alignItems: 'center' },
  menuHeaderName:{ color: '#fff', fontWeight: '700', marginTop: 8, fontSize: 15 },
  menuItem:     { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', gap: 12 },
  menuItemDanger:{ },
  menuText:     { fontSize: 15, color: '#2c3e50', fontWeight: '500' },

  // Language
  langOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  langContainer:  { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  langTitle:      { fontSize: 18, fontWeight: '700', color: '#2c3e50', marginBottom: 18, textAlign: 'center' },
  langOption:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8, backgroundColor: '#f8f9fa' },
  langOptionActive:{ backgroundColor: '#eaf4fb', borderWidth: 1.5, borderColor: '#2980b9' },
  langOptionText: { fontSize: 16, color: '#2c3e50' },
});
