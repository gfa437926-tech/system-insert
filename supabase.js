// supabase.js - إدارة الاتصال بقاعدة البيانات Supabase

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'

// تهيئة Supabase - تم التحديث بالمعلومات الصحيحة
const SUPABASE_URL = 'https://quloihkscingxdbsbjcz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1bG9paGtzY2luZ3hkYnNiamN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MTc1NjksImV4cCI6MjA3MTQ5MzU2OX0.cyko7m6855bjpfVJ7kTNlvWqsTKADxFASgWw_mF_H9c'

// إنشاء عميل Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// دالة للتحقق من اتصال Supabase
async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('stations')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ خطأ في الاتصال بـ Supabase:', error.message)
      return false
    }
    
    console.log('✅ الاتصال بـ Supabase ناجح')
    return true
  } catch (error) {
    console.error('❌ خطأ غير متوقع في الاتصال:', error.message)
    return false
  }
}

// دالة لتسجيل الدخول
async function loginUser(username, password) {
  try {
    // البحث عن المستخدم في جدول users
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single()
    
    if (error) throw error
    
    if (user) {
      return {
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        session: null
      }
    } else {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة')
    }
  } catch (error) {
    console.error('Error logging in:', error.message)
    throw error
  }
}

// دالة لتسجيل الخروج
async function logoutUser() {
  try {
    // مسح البيانات المحلية
    localStorage.removeItem('loggedIn')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('userRole')
    
    return true
  } catch (error) {
    console.error('Error logging out:', error.message)
    throw error
  }
}

// دالة للحصول على المستخدم الحالي
function getCurrentUser() {
  const userId = localStorage.getItem('userId')
  const username = localStorage.getItem('username')
  const userRole = localStorage.getItem('userRole')
  
  if (userId && username && userRole) {
    return {
      user: {
        id: userId,
        username: username,
        role: userRole
      }
    }
  }
  
  return null
}

// دالة لإدراج بيانات ساعية
async function insertHourlyData(data) {
  try {
    const { data: result, error } = await supabase
      .from('hourly_observations')
      .insert([{
        station_code: data.station.code,
        observation_date: data.observation.date,
        observation_time: data.observation.time,
        observer_name: data.observer,
        dry_temperature: data.temperature.dry,
        wet_temperature: data.temperature.wet,
        station_pressure: data.pressure.station,
        msl_pressure: data.pressure.msl,
        wind_direction_surface: data.wind.surfaceDir,
        wind_speed_surface: data.wind.surfaceSpeed,
        wind_direction_mean: data.wind.meanDir,
        wind_speed_mean: data.wind.meanSpeed,
        visibility: data.visibility,
        current_weather: data.weather.current,
        past_weather: data.weather.past,
        cloud_cover_total: data.clouds.totalCover,
        cloud_layer1_amount: data.clouds.layer1.amount,
        cloud_layer1_type: data.clouds.layer1.type,
        cloud_layer1_height: data.clouds.layer1.height,
        cloud_layer2_amount: data.clouds.layer2.amount,
        cloud_layer2_type: data.clouds.layer2.type,
        cloud_layer2_height: data.clouds.layer2.height,
        cloud_layer3_amount: data.clouds.layer3.amount,
        cloud_layer3_type: data.clouds.layer3.type,
        cloud_layer3_height: data.clouds.layer3.height,
        cloud_layer4_amount: data.clouds.layer4.amount,
        cloud_sum_12: data.clouds.sum12,
        cloud_sum_123: data.clouds.sum123,
        vapor_pressure: data.calculated.vaporPressure,
        dew_point: data.calculated.dewPoint,
        relative_humidity: data.calculated.humidity,
        vapor_pressure_diff: data.calculated.vaporDiff,
        created_at: new Date().toISOString()
      }])
      .select()
    
    if (error) throw error
    return result
  } catch (error) {
    console.error('Error inserting hourly data:', error.message)
    throw error
  }
}

// دالة لإدراج بيانات يومية
async function insertDailyData(data) {
  try {
    const { data: result, error } = await supabase
      .from('daily_observations')
      .insert([{
        station_code: data.station.code,
        observation_date: data.observation.date,
        observation_time: data.observation.time,
        observer_name: data.observer,
        min_temperature: data.temperatures.min,
        max_temperature: data.temperatures.max,
        precipitation: data.precipitation.amount,
        snow_thickness: data.precipitation.snowThickness,
        thunderstorm: data.weatherElements.thunderstorm,
        hail: data.weatherElements.hail,
        snow: data.weatherElements.snow,
        rain: data.weatherElements.rain,
        frost: data.weatherElements.frost,
        fog: data.weatherElements.fog,
        drizzle: data.weatherElements.drizzle,
        dust_storm: data.weatherElements.dustStorm,
        dust: data.weatherElements.dust,
        haze: data.weatherElements.haze,
        stormy_wind: data.weatherElements.stormyWind,
        evaporation_record: data.evaporation.record,
        evaporation_leach: data.evaporation.leach,
        actual_sunshine: data.sunshine.actual,
        total_sunshine: data.sunshine.total,
        sunshine_percentage: data.sunshine.percentage,
        gust_speed: data.gust.speed,
        gust_direction: data.gust.direction,
        gust_time: data.gust.time,
        max_humidity: data.humidity.max,
        max_humidity_time: data.humidity.maxTime,
        min_humidity: data.humidity.min,
        min_humidity_time: data.humidity.minTime,
        dew_amount: data.humidity.dewAmount,
        responsibility_accepted: data.responsibility.accepted,
        responsibility_accepted_at: data.responsibility.acceptedAt,
        created_at: new Date().toISOString()
      }])
      .select()
    
    if (error) throw error
    return result
  } catch (error) {
    console.error('Error inserting daily data:', error.message)
    throw error
  }
}

// دالة لجلب المحطات
async function fetchStations() {
  try {
    const { data, error } = await supabase
      .from('stations')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching stations:', error.message)
    throw error
  }
}

// دالة لجلب المستخدمين
async function fetchUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching users:', error.message)
    throw error
  }
}

// دالة لإضافة محطة جديدة
async function addStation(stationData) {
  try {
    const { data, error } = await supabase
      .from('stations')
      .insert([{
        code: stationData.code,
        name: stationData.name,
        elevation: stationData.elevation,
        password: stationData.password,
        created_at: new Date().toISOString()
      }])
      .select()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error adding station:', error.message)
    throw error
  }
}

// دالة لإضافة مستخدم جديد
async function addUser(userData) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        username: userData.username,
        password: userData.password,
        role: userData.role,
        created_at: new Date().toISOString()
      }])
      .select()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error adding user:', error.message)
    throw error
  }
}

// دالة لحذف محطة
async function deleteStation(stationId) {
  try {
    const { error } = await supabase
      .from('stations')
      .delete()
      .eq('id', stationId)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting station:', error.message)
    throw error
  }
}

// دالة لحذف مستخدم
async function deleteUser(userId) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting user:', error.message)
    throw error
  }
}

// دالة للتحقق من صحة كلمة مرور المحطة
async function validateStationPassword(stationCode, password) {
  try {
    const { data: station, error } = await supabase
      .from('stations')
      .select('*')
      .eq('code', stationCode)
      .eq('password', password)
      .single()
    
    if (error) throw error
    return !!station
  } catch (error) {
    console.error('Error validating station password:', error.message)
    return false
  }
}

// تصدير الدوال للاستخدام في ملفات أخرى
export {
  supabase,
  checkSupabaseConnection,
  loginUser,
  logoutUser,
  getCurrentUser,
  insertHourlyData,
  insertDailyData,
  fetchStations,
  fetchUsers,
  addStation,
  addUser,
  deleteStation,
  deleteUser,
  validateStationPassword
}