// test-connection.js
import { checkSupabaseConnection } from './supabase.js'

async function testConnection() {
  try {
    const isConnected = await checkSupabaseConnection()
    
    if (isConnected) {
      console.log('✅ الاتصال بـ Supabase ناجح!')
      console.log('🎉 النظام جاهز للعمل!')
      return true
    } else {
      console.log('❌ فشل الاتصال بـ Supabase')
      return false
    }
  } catch (error) {
    console.error('❌ خطأ غير متوقع:', error.message)
    return false
  }
}

// تشغيل الاختبار عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async function() {
  const connectionStatus = document.getElementById('connectionStatus')
  
  if (connectionStatus) {
    const isConnected = await testConnection()
    
    if (isConnected) {
      connectionStatus.innerHTML = '<i class="fas fa-check-circle text-success"></i> متصل بقاعدة البيانات'
      connectionStatus.className = 'alert alert-success'
    } else {
      connectionStatus.innerHTML = '<i class="fas fa-times-circle text-danger"></i> غير متصل بقاعدة البيانات'
      connectionStatus.className = 'alert alert-danger'
    }
    
    connectionStatus.style.display = 'block'
  }
})

// تصدير للاستخدام في وحدة الاختبار
export { testConnection }