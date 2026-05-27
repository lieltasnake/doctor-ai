import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// FOR EMULATOR (Android Emulator):
// const API_URL = 'http://10.0.2.2:5000';

// FOR WI-FI (Active local Wi-Fi IP):
// const API_URL = 'http://10.101.48.184:5000';

// FOR MOBILE HOTSPOT (Windows Hotspot IP):
const API_URL = 'https://doctor-ai-04d3.onrender.com';

const instance = axios.create({
  baseURL: API_URL,
});

// Automatically intercept requests to attach the JWT Token if it exists
instance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
