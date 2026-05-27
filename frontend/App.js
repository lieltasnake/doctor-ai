import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

import './src/i18n';
import i18n from './src/i18n';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import PatientDashboard from './screens/PatientDashboard';
import AdminDashboard from './screens/AdminDashboard';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import ManageAccountScreen from './screens/ManageAccountScreen';
import HistoryScreen from './screens/HistoryScreen';
import AdminListScreen from './screens/AdminListScreen';
import AdminUsersScreen from './screens/AdminUsersScreen';
import AdminHistoryScreen from './screens/AdminHistoryScreen';
import AdminOverviewScreen from './screens/AdminOverviewScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    const checkLoginState = async () => {
      try {
        // Pre-load vector icons font to fix invisible icons in APK
        await Font.loadAsync(Ionicons.font);

        // Load saved language
        const savedLang = await AsyncStorage.getItem('lang');
        if (savedLang) {
          await i18n.changeLanguage(savedLang);
        }

        const token = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('userData');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          if (user.role === 'admin') {
            setInitialRoute('AdminDashboard');
          } else {
            setInitialRoute('PatientDashboard');
          }
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginState();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7f9' }}>
        <ActivityIndicator size="large" color="#2980b9" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
        <Stack.Screen name="PatientDashboard" component={PatientDashboard} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="ManageAccountScreen" component={ManageAccountScreen} />
        <Stack.Screen name="HistoryScreen" component={HistoryScreen} />
        <Stack.Screen name="AdminListScreen" component={AdminListScreen} />
        <Stack.Screen name="AdminUsersScreen" component={AdminUsersScreen} />
        <Stack.Screen name="AdminHistoryScreen" component={AdminHistoryScreen} />
        <Stack.Screen name="AdminOverviewScreen" component={AdminOverviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
