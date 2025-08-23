import {createClient} from '@supabase/supabase-js';

// بيانات مشروعك من Supabase
const supabaseUrl = 'https://quloihkscingxdbsbjcz.supabase.co';
const supabaseKey = 'ضع هنا ال-anon key من Supabase Dashboard';
const supabase = createClient (supabaseUrl, supabaseKey);

async function testInsert () {
  const {data, error} = await supabase
    .from ('weather_data') // استبدلها باسم الجدول عندك
    .insert ([{station: 'دمشق', temp: 30, humidity: 55}]);

  if (error) {
    console.error ('❌ خطأ:', error);
  } else {
    console.log ('✅ تم الإدخال:', data);
  }
}

testInsert ();
