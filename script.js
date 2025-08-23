// استيراد دوال Supabase
import {insertHourlyData, fetchStations} from './supabase.js';

// التحقق من تسجيل الدخول
if (localStorage.getItem ('loggedIn') !== 'true') {
  window.location.href = 'login.html';
}

// إضافة وظيفة تسجيل الخروج
function logout () {
  localStorage.removeItem ('loggedIn');
  localStorage.removeItem ('username');
  window.location.href = 'login.html';
}

// إضافة زر تسجيل الخروج إلى الواجهة
document.addEventListener ('DOMContentLoaded', function () {
  // إنشاء زر تسجيل الخروج وإضافته إلى الرأس
  const logoutBtn = document.createElement ('button');
  logoutBtn.className = 'btn btn-outline-light btn-sm';
  logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt me-1"></i>تسجيل الخروج';
  logoutBtn.onclick = logout;

  const header = document.querySelector ('header .container');
  if (header) {
    const logoutDiv = document.createElement ('div');
    logoutDiv.className = 'text-center mt-2';
    logoutDiv.appendChild (logoutBtn);
    header.appendChild (logoutDiv);
  }
});

// دالة لتنسيق درجة الحرارة (XX.X)
function formatTemperature (input) {
  let value = input.value.replace (/[^\d.-]/g, '');

  // إزالة أي علامات سالبة متعددة
  value = value.replace (/(\-)+/g, '-');

  // إذا كانت القيمة تبدأ بنقطة، أضف صفر قبلها
  if (value.startsWith ('.')) {
    value = '0' + value;
  }

  // إذا كانت القيمة تحتوي على أكثر من نقطة، احتفظ بالأولى فقط
  const dotCount = (value.match (/\./g) || []).length;
  if (dotCount > 1) {
    value = value.replace (/\.+$/, '');
    const parts = value.split ('.');
    value = parts[0] + '.' + parts.slice (1).join ('');
  }

  // إذا كانت القيمة تحتوي على نقطة، تأكد من وجود رقم واحد بعدها
  if (value.includes ('.')) {
    const parts = value.split ('.');
    if (parts[1].length > 1) {
      value = parts[0] + '.' + parts[1].charAt (0);
    }
  }

  // إذا كانت القيمة لا تحتوي على نقطة وكانت مكونة من رقم واحد، أضف صفر قبلها ونقطة وصفر بعدها
  if (!value.includes ('.') && value.length === 1 && value !== '-') {
    value = '0' + value + '.0';
  }

  // إذا كانت القيمة لا تحتوي على نقطة وكانت مكونة من رقمين، أضف نقطة وصفر
  if (!value.includes ('.') && value.length === 2 && value !== '-') {
    value = value + '.0';
  }

  // إذا كانت القيمة سالبة وتحتوي على نقطة في البداية
  if (value.startsWith ('-.')) {
    value = '-0.' + value.slice (2);
  }

  // إذا كانت القيمة سالبة ومكونة من رقم واحد، أضف صفر ونقطة وصفر
  if (value.startsWith ('-') && value.length === 2) {
    value = value + '0.0';
  }

  // إذا كانت القيمة سالبة ومكونة من رقمين بعد الإشارة، أضف نقطة وصفر
  if (value.startsWith ('-') && value.length === 3) {
    value = value + '.0';
  }

  input.value = value;
}

// دالة للتحقق من صحة درجة الحرارة
function validateTemperature (input, isDryTemp = false, compareWith = null) {
  let value = input.value;

  // إذا كانت القيمة فارغة، لا تفعل شيئاً
  if (!value) return true;

  // التحقق من التنسيق XX.X
  const temperatureRegex = /^-?\d{2}\.\d$/;
  if (!temperatureRegex.test (value)) {
    showFieldError (
      input,
      'التنسيق غير صحيح. يجب أن يكون بالصيغة XX.X (مثال: 25.3)'
    );
    return false;
  }

  // تحويل إلى رقم للتحقق من القيم
  const numValue = parseFloat (value);

  // التحقق من النطاق (-20 إلى 60)
  if (numValue < -20 || numValue > 60) {
    showFieldError (input, 'يجب أن تكون القيمة بين -20 و 60');
    return false;
  }

  // إذا كانت هذه درجة حرارة جافة، التحقق من عدم وجود علامة سالبة
  if (isDryTemp && numValue < 0) {
    showFieldError (input, 'درجة الحرارة الجافة لا يمكن أن تكون سالبة');
    return false;
  }

  // إذا كانت هناك قيمة للمقارنة (الرطبة يجب أن تكون أقل من الجافة)
  if (compareWith !== null) {
    const compareValue = parseFloat (compareWith.value);
    if (!isNaN (compareValue)) {
      if (numValue > compareValue) {
        showFieldError (
          input,
          'درجة الحرارة الرطبة يجب أن تكون أقل من أو تساوي الجافة'
        );
        return false;
      }

      // التحقق من أن الفرق لا يتجاوز 25 درجة
      const difference = compareValue - numValue;
      if (difference > 25) {
        showFieldError (
          input,
          'الفرق بين الحرارة الجافة والرطبة لا يمكن أن يتجاوز 25 درجة'
        );
        return false;
      }
    }
  }

  // إذا كانت كل الشروط صحيحة، إخفاء أي أخطاء
  hideFieldError (input);
  return true;
}// دالة محسنة لتنسيق ضغط المحطة
function formatPressure (input) {
  let value = input.value.replace (/[^\d.]/g, '');

  // إذا كانت القيمة فارغة
  if (!value) return;

  // منع القيم التي تبدأ بأرقام عالية جداً
  if (value.length >= 2) {
    const firstTwoDigits = parseInt (value.substring (0, 2));
    if (firstTwoDigits > 10) {
      showFieldError (input, 'القيمة لا يمكن أن تتجاوز 1050.0');
      return;
    }
  }

  // فصل الأجزاء قبل وبعد الفاصلة
  let integerPart = '';
  let decimalPart = '';

  if (value.includes ('.')) {
    const parts = value.split ('.');
    integerPart = parts[0];
    decimalPart = parts[1] || '0';
  } else {
    integerPart = value;
    decimalPart = '0';
  }

  // تقييد الجزء العشري إلى رقم واحد
  decimalPart = decimalPart.charAt (0);

  // التأكد من أن الجزء الصحيح مكون من 4 أرقام
  integerPart = integerPart.padStart (4, '0');

  // إذا تجاوز 4 أرقام، نأخذ آخر 4 أرقام
  if (integerPart.length > 4) {
    integerPart = integerPart.slice (-4);
  }

  // التحقق من عدم تجاوز 1050
  const numericValue = parseFloat (integerPart + '.' + decimalPart);
  if (numericValue > 1050.0) {
    showFieldError (input, 'القيمة لا يمكن أن تتجاوز 1050.0');
    input.value = '1050.0';
    return;
  }

  input.value = integerPart + '.' + decimalPart;
}
// دالة للتحقق من صحة ضغط المحطة (معدلة)
function validatePressure (input) {
  let value = input.value;

  // إذا كانت القيمة فارغة، لا تفعل شيئاً
  if (!value) return true;

  // التحقق من التنسيق XXXX.X
  const pressureRegex = /^\d{4}\.\d$/;
  if (!pressureRegex.test (value)) {
    showFieldError (
      input,
      'التنسيق غير صحيح. يجب أن يكون بالصيغة XXXX.X (مثال: 1013.5)'
    );
    return false;
  }

  // تحويل إلى رقم للتحقق من القيم
  const numValue = parseFloat (value);

  // التحقق من النطاق (850.0 إلى 1050.0)
  if (numValue < 850.0) {
    showFieldError (input, 'يجب أن تكون القيمة بين 850.0 و 1050.0');
    return false;
  }

  if (numValue > 1050.0) {
    showFieldError (input, 'القيمة لا يمكن أن تتجاوز 1050.0');
    // إعادة تعيين القيمة إلى الحد الأقصى
    input.value = '1050.0';
    return false;
  }

  // إذا كانت كل الشروط صحيحة، إخفاء أي أخطاء
  hideFieldError (input);
  return true;
}

// دالة للتحقق من صحة تغطية الغيوم
function validateCloudCover (input) {
  let value = input.value;

  // إذا كانت القيمة فارغة، لا تفعل شيئاً
  if (!value) return true;

  // التحقق من أن القيمة رقمية بين 0 و 8
  if (!/^[0-8]$/.test (value)) {
    showFieldError (input, 'يجب إدخال رقم بين 0 و 8');
    return false;
  }

  // إذا كانت القيمة 0، تعطيل حقلي نوع وارتفاع السحب
  const cloudIndex = input.id.replace ('cloudAmount', '');
  if (value === '0') {
    document.getElementById (`cloudType${cloudIndex}`).disabled = true;
    document.getElementById (`cloudHeight${cloudIndex}`).disabled = true;
  } else {
    document.getElementById (`cloudType${cloudIndex}`).disabled = false;
    document.getElementById (`cloudHeight${cloudIndex}`).disabled = false;
  }

  // إذا كانت كل الشروط صحيحة، إخفاء أي أخطاء
  hideFieldError (input);
  return true;
}
// إضافة مستمعات الأحداث للتحقق من اتجاه الرياح
document
  .getElementById ('windDirSurface')
  .addEventListener ('blur', function () {
    validateWindDirection (this);
  });

document.getElementById ('windDirMean').addEventListener ('blur', function () {
  validateWindDirection (this);
});

// إضافة مستمعات الأحداث للتحقق من سرعة الرياح
document
  .getElementById ('windSpeedSurface')
  .addEventListener ('blur', function () {
    validateWindSpeed (this);
  });

document
  .getElementById ('windSpeedMean')
  .addEventListener ('blur', function () {
    validateWindSpeed (this);
  });


// دالة للتحقق من صحة سرعة الرياح
function validateWindSpeed (input) {
  let value = input.value;

  // إذا كانت القيمة فارغة، لا تفعل شيئاً
  if (!value) return true;

  // التحقق من أن القيمة رقمية
  if (!/^\d+$/.test (value)) {
    showFieldError (input, 'يجب إدخال أرقام فقط');
    return false;
  }

  // التأكد من أن القيمة مكونة من رقمين
  if (value.length < 2) {
    value = value.padStart (2, '0');
    input.value = value;
  }

  // التحقق من النطاق (00 إلى 99)
  const numValue = parseInt (value);
  if (numValue < 0 || numValue > 99) {
    showFieldError (input, 'يجب أن تكون القيمة بين 00 و 99');
    return false;
  }

  // إذا كانت كل الشروط صحيحة، إخفاء أي أخطاء
  hideFieldError (input);
  return true;
}

// دالة للتحقق من صحة الطقس الغابر (خانة واحدة)
function validatePastWeather (input) {
  let value = input.value;

  // إذا كانت القيمة فارغة، لا تفعل شيئاً
  if (!value) return true;

  // التحقق من أن القيمة رقمية بين 0 و 9
  if (!/^[0-9]$/.test (value)) {
    showFieldError (input, 'يجب إدخال رقم واحد بين 0 و 9');
    return false;
  }

  // إذا كانت كل الشروط صحيحة، إخفاء أي أخطاء
  hideFieldError (input);
  return true;
}

// دالة لعرض خطأ للحقل
function showFieldError (input, message) {
  // إزالة أي رسائل خطأ سابقة
  hideFieldError (input);

  // إضافة صنف الخطأ للحقل
  input.classList.add ('is-invalid');

  // إنشاء عنصر رسالة الخطأ
  const errorDiv = document.createElement ('div');
  errorDiv.className = 'invalid-feedback';
  errorDiv.textContent = message;
  errorDiv.id = input.id + 'Error';

  // إضافة رسالة الخطأ بعد الحقل
  input.parentNode.appendChild (errorDiv);
}

// دالة لإخفاء خطأ الحقل
function hideFieldError (input) {
  // إزالة صنف الخطأ
  input.classList.remove ('is-invalid');

  // إزالة رسالة الخطأ إذا كانت موجودة
  const errorDiv = document.getElementById (input.id + 'Error');
  if (errorDiv) {
    errorDiv.remove ();
  }
}

// دالة لتحديث التاريخ الحالي
function updateDate () {
  const now = new Date ();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  document.getElementById ('currentDate').textContent = now.toLocaleDateString (
    'ar-SY',
    options
  );
}

// تحديث معلومات المحطة عند التغيير
function updateStationInfo () {
  const stationSelect = document.getElementById ('station');
  const station = stationSelect.options[stationSelect.selectedIndex];

  if (station.value) {
    document.getElementById ('stationCode').value = station.value;
    document.getElementById ('stationName').value = station.dataset.name || '';

    const elevation = parseFloat (station.dataset.elevation) || 0;
    document.getElementById ('elevation').value = elevation;
  } else {
    document.getElementById ('stationCode').value = '';
    document.getElementById ('stationName').value = '';
    document.getElementById ('elevation').value = '';
  }
}

// دالة لتحويل التوقيت المحلي إلى التوقيت العالمي
function convertToUTC (localTime) {
  const localHour = parseInt (localTime);
  if (isNaN (localHour) || localHour < 0 || localHour > 23) return null;

  // سوريا في التوقيت الشتوي (UTC+2) والصيفي (UTC+3)
  // سنفترض أننا نستخدم التوقيت الشتوي (UTC+2) كافتراضي
  const utcOffset = 2; // UTC+2 للتوقيت الشتوي في سوريا
  let utcHour = (localHour - utcOffset + 24) % 24;

  // التأكد من أن القيمة مكونة من رقمين
  return utcHour.toString ().padStart (2, '0');
}

// دالة لعرض التوقيت العالمي
function showUTCTime (localTime) {
  const utcTime = convertToUTC (localTime);
  const utcInfoElement = document.getElementById ('utcTimeInfo');
  const utcTimeElement = document.getElementById ('utcTime');

  if (utcTime) {
    utcTimeElement.textContent = utcTime;
    utcInfoElement.style.display = 'block';
  } else {
    utcInfoElement.style.display = 'none';
  }
}

// متغير عام لتخزين رموز الطقس
let weatherCodes = [];

// دالة لتحميل وتفسير رموز الطقس الحاضر
async function loadWeatherCodes () {
  try {
    const response = await fetch ('طقس حاضر.json');
    if (!response.ok) {
      throw new Error (`خطأ في تحميل الملف: ${response.status}`);
    }
    const codes = await response.json ();
    console.log ('تم تحميل رموز الطقس:', codes.length, 'رمز');
    return codes;
  } catch (error) {
    console.error ('خطأ في تحميل رموز الطقس:', error);
    // إنشاء بيانات افتراضية للطوارئ
    return [
      {
        code: '00',
        description: 'رقم يدل على حالة الغيوم و الجو صافي خلال الساعة السابقة لوقت النشرة',
      },
      {
        code: '10',
        description: 'رقم يدل على شابورة مائية يعني ضباب الرؤية أقل من 1000م',
      },
      {
        code: '20',
        description: 'رزاز غير متجمد او حبيبات ثلجية فوق المحطة خلال الساعة السابقة',
      },
      // إضافة المزيد من الرموز الافتراضية حسب الحاجة
    ];
  }
}

// دالة لعرض شرح رمز الطقس الحاضر
function showWeatherCodeDescription (code) {
  // التأكد من أن الرمز مكون من رقمين
  if (code.length !== 2) {
    hideWeatherDescription ();
    return;
  }

  // البحث عن الرمز في المصفوفة
  const weatherInfo = weatherCodes.find (item => item.code === code);

  // إنشاء أو الحصول على عنصر عرض الشرح
  let descriptionElement = document.getElementById ('weatherCodeDescription');

  if (!descriptionElement) {
    descriptionElement = document.createElement ('div');
    descriptionElement.id = 'weatherCodeDescription';
    descriptionElement.className =
      'weather-description alert alert-info mt-2 p-2';
    document
      .getElementById ('currentWeather-group')
      .appendChild (descriptionElement);
  }

  if (weatherInfo) {
    // عرض الشرح إذا وجد الرمز
    descriptionElement.textContent = weatherInfo.description;
    descriptionElement.className =
      'weather-description alert alert-info mt-2 p-2';
    descriptionElement.style.display = 'block';
  } else {
    // إذا كان الرمز غير معروف
    descriptionElement.textContent =
      'رمز الطقس غير معروف - تأكد من إدخال رمز صحيح مكون من رقمين';
    descriptionElement.className =
      'weather-description alert alert-warning mt-2 p-2';
    descriptionElement.style.display = 'block';
  }
}

// دالة لإخفاء شرح الطقس
function hideWeatherDescription () {
  const descriptionElement = document.getElementById ('weatherCodeDescription');
  if (descriptionElement) {
    descriptionElement.style.display = 'none';
  }
}

// دالة لحساب القيم المشتقة
function calculateDerivedValues () {
  const dryTemp = parseFloat (document.getElementById ('dryTemp').value);
  const wetTemp = parseFloat (document.getElementById ('wetTemp').value);
  const stationPressure = parseFloat (
    document.getElementById ('stationPressure').value
  );

  if (isNaN (dryTemp) || isNaN (wetTemp) || isNaN (stationPressure)) {
    showAlert (
      'يجب إدخال قيم صحيحة لدرجة الحرارة الجافة والرطبة وضغط المحطة',
      'warning'
    );
    return;
  }

  // حساب ضغط بخار الماء (معادلة مبسطة)
  const vaporPressure = 6.11 * Math.pow (10, 7.5 * wetTemp / (237.3 + wetTemp));

  // حساب درجة الندى (معادلة مبسطة)
  const dewPoint =
    237.3 *
    Math.log (vaporPressure / 6.11) /
    (7.5 - Math.log (vaporPressure / 6.11));

  // حساب الرطوبة النسبية
  const saturationVaporPressure =
    6.11 * Math.pow (10, 7.5 * dryTemp / (237.3 + dryTemp));
  const relativeHumidity = vaporPressure / saturationVaporPressure * 100;

  // حساب فرق ضغط بخار الماء عن الإشباع
  const vaporPressureDiff = saturationVaporPressure - vaporPressure;

  // عرض النتائج
  document.getElementById (
    'vaporPressureResult'
  ).textContent = vaporPressure.toFixed (2);
  document.getElementById ('dewPointResult').textContent = dewPoint.toFixed (2);
  document.getElementById (
    'humidityResult'
  ).textContent = relativeHumidity.toFixed (2);
  document.getElementById (
    'vaporDiffResult'
  ).textContent = vaporPressureDiff.toFixed (2);

  // تحديث ملخص النتائج
  document.getElementById ('summaryVapor').textContent =
    vaporPressure.toFixed (2) + ' ميلبار';
  document.getElementById ('summaryDew').textContent =
    dewPoint.toFixed (2) + ' سْ';
  document.getElementById ('summaryHumidity').textContent =
    relativeHumidity.toFixed (2) + '%';
  document.getElementById ('summaryDiff').textContent =
    vaporPressureDiff.toFixed (2) + ' ميلبار';

  // إضافة تأثير للنتائج المحسوبة
  const results = document.querySelectorAll ('.calculated-value');
  results.forEach (result => {
    result.classList.add ('pulse');
    setTimeout (() => {
      result.classList.remove ('pulse');
    }, 1000);
  });

  showAlert ('تم حساب القيم المشتقة بنجاح', 'success');
}
// التحقق من صحة البيانات قبل الإرسال
function validateForm () {
  // إعادة تعيين جميع أخطاء التحقق
  resetAllValidationErrors ();

  let isValid = true;
  let missingFields = [];
  let invalidFields = [];

  // 1. التحقق من الحقول المطلوبة الأساسية
  const requiredFields = [
    {id: 'station', name: 'اسم المحطة'},
    {id: 'observationTime', name: 'توقيت الرصد المحلي'},
    {id: 'observationDate', name: 'تاريخ الرصد'},
    {id: 'observer', name: 'اسم الراصد'},
    {id: 'station-password', name: 'كلمة مرور المحطة'},
    {id: 'dryTemp', name: 'درجة الحرارة الجافة'},
    {id: 'wetTemp', name: 'درجة الحرارة الرطبة'},
    {id: 'stationPressure', name: 'ضغط المحطة'},
    {id: 'stationPressureMSL', name: 'ضغط المحطة المحول لسطح البحر'},
  ];

  requiredFields.forEach (field => {
    const fieldElement = document.getElementById (field.id);
    if (!fieldElement.value.trim ()) {
      isValid = false;
      missingFields.push (field.name);
      fieldElement.classList.add ('is-invalid');

      // إضافة رسالة خطأ محددة
      showFieldError (fieldElement, 'هذا الحقل مطلوب');
    }
  });

  // 2. التحقق من صحة التوقيت
  const observationTime = document.getElementById ('observationTime').value;
  if (observationTime && !/^([0-1][0-9]|2[0-3])$/.test (observationTime)) {
    isValid = false;
    invalidFields.push ('توقيت الرصد المحلي');
    showFieldError (
      document.getElementById ('observationTime'),
      'يجب أن يكون الوقت بين 00 و 23'
    );
  }

  // 3. التحقق من صحة درجات الحرارة
  const dryTemp = document.getElementById ('dryTemp');
  const wetTemp = document.getElementById ('wetTemp');

  if (dryTemp.value) {
    if (!validateTemperature (dryTemp, true)) {
      isValid = false;
      invalidFields.push ('درجة الحرارة الجافة');
    }
  }

  if (wetTemp.value) {
    if (!validateTemperature (wetTemp, false, dryTemp)) {
      isValid = false;
      invalidFields.push ('درجة الحرارة الرطبة');
    }
  }

  // 4. التحقق من صحة الضغط
  const stationPressure = document.getElementById ('stationPressure');
  const stationPressureMSL = document.getElementById ('stationPressureMSL');

  if (stationPressure.value && !validatePressure (stationPressure)) {
    isValid = false;
    invalidFields.push ('ضغط المحطة');
  }

  if (stationPressureMSL.value && !validatePressure (stationPressureMSL)) {
    isValid = false;
    invalidFields.push ('ضغط المحطة المحول لسطح البحر');
  }

  // 5. التحقق من صحة اتجاه الرياح
  const windDirSurface = document.getElementById ('windDirSurface');
  const windDirMean = document.getElementById ('windDirMean');

  if (windDirSurface.value && !validateWindDirection (windDirSurface)) {
    isValid = false;
    invalidFields.push ('اتجاه الرياح السطحية');
  }

  if (windDirMean.value && !validateWindDirection (windDirMean)) {
    isValid = false;
    invalidFields.push ('اتجاه المتوسط الساعي');
  }

  // 6. التحقق من صحة سرعة الرياح
  const windSpeedSurface = document.getElementById ('windSpeedSurface');
  const windSpeedMean = document.getElementById ('windSpeedMean');

  if (windSpeedSurface.value && !validateWindSpeed (windSpeedSurface)) {
    isValid = false;
    invalidFields.push ('سرعة الرياح السطحية');
  }

  if (windSpeedMean.value && !validateWindSpeed (windSpeedMean)) {
    isValid = false;
    invalidFields.push ('سرعة المتوسط الساعي');
  }

  // 7. التحقق من صحة الرؤية
  const visibility = document.getElementById ('visibility');
  if (visibility.value && !validateVisibility (visibility)) {
    isValid = false;
    invalidFields.push ('الرؤية السطحية الأفقية');
  }

  // 8. التحقق من صحة الطقس الحاضر
  const currentWeather = document.getElementById ('currentWeather');
  if (currentWeather.value && !validateCurrentWeather (currentWeather)) {
    isValid = false;
    invalidFields.push ('الطقس الحاضر');
  }

  // 9. التحقق من صحة الطقس الغابر
  const pastWeather = document.getElementById ('pastWeather');
  if (pastWeather.value && !validatePastWeather (pastWeather)) {
    isValid = false;
    invalidFields.push ('الطقس الغابر');
  }

  // 10. التحقق من صحة تغطية السحب
  for (let i = 1; i <= 4; i++) {
    const cloudAmount = document.getElementById (`cloudAmount${i}`);
    if (cloudAmount.value && !validateCloudCover (cloudAmount)) {
      isValid = false;
      invalidFields.push (`كمية السحب الطبقة ${i}`);
    }
  }

  // 11. التحقق من صحة ارتفاع السحب
  for (let i = 1; i <= 3; i++) {
    const cloudHeight = document.getElementById (`cloudHeight${i}`);
    const cloudAmount = document.getElementById (`cloudAmount${i}`);

    // التحقق من الارتفاع فقط إذا كانت كمية السحب > 0
    if (cloudAmount.value && cloudAmount.value !== '0' && cloudHeight.value) {
      if (!validateCloudHeight (cloudHeight)) {
        isValid = false;
        invalidFields.push (`ارتفاع السحب الطبقة ${i}`);
      }
    }
  }

  // 12. التحقق من الحقول الجديدة (cloudSum12 و cloudSum123)
  const cloudSum12 = document.getElementById ('cloudSum12');
  const cloudSum123 = document.getElementById ('cloudSum123');

  if (cloudSum12.value && !validateCloudSum (cloudSum12)) {
    isValid = false;
    invalidFields.push ('مجموع السحب 1+2');
  }

  if (cloudSum123.value && !validateCloudSum (cloudSum123)) {
    isValid = false;
    invalidFields.push ('مجموع السحب 1+2+3');
  }

  // 13. التحقق من تأكيد المسؤولية
  if (!document.getElementById ('responsibilityCheckbox').checked) {
    isValid = false;
    showAlert ('يجب الموافقة على تحمل المسؤولية قبل الإرسال', 'warning');

    // تسليط الضوء على خانة التأكيد
    const checkbox = document.getElementById ('responsibilityCheckbox');
    checkbox.classList.add ('is-invalid');
    const label = checkbox.nextElementSibling;
    label.classList.add ('text-danger', 'fw-bold');
  }

  // 14. إذا كان هناك أخطاء، عرض رسالة تفصيلية
  if (!isValid) {
    let errorMessage = 'يوجد أخطاء في النموذج:\n';

    if (missingFields.length > 0) {
      errorMessage += `\n• الحقول المطلوبة: ${missingFields.join ('، ')}`;
    }

    if (invalidFields.length > 0) {
      errorMessage += `\n• الحقول غير الصحيحة: ${invalidFields.join ('، ')}`;
    }

    showAlert (errorMessage, 'warning');

    // التمرير إلى أول حقل به خطأ
    scrollToFirstError ();
  }

  return isValid;
}

// دالة مساعدة لإعادة تعيين جميع أخطاء التحقق
function resetAllValidationErrors () {
  // إزالة جميع أخطاء التحقق
  document.querySelectorAll ('.is-invalid').forEach (element => {
    element.classList.remove ('is-invalid');
  });

  // إزالة جميع رسائل الخطأ
  document.querySelectorAll ('.invalid-feedback').forEach (element => {
    element.remove ();
  });

  // إعادة تعيين تنسيق خانة التأكيد
  const checkbox = document.getElementById ('responsibilityCheckbox');
  if (checkbox) {
    checkbox.classList.remove ('is-invalid');
    const label = checkbox.nextElementSibling;
    if (label) {
      label.classList.remove ('text-danger', 'fw-bold');
    }
  }
}

// دالة للتمرير إلى أول حقل به خطأ
function scrollToFirstError () {
  const firstError = document.querySelector ('.is-invalid');
  if (firstError) {
    firstError.scrollIntoView ({
      behavior: 'smooth',
      block: 'center',
    });

    // إضافة تأثير اهتزاز للحقل
    firstError.classList.add ('shake');
    setTimeout (() => {
      firstError.classList.remove ('shake');
    }, 500);

    // التركيز على الحقل
    firstError.focus ();
  }
}

// دالة للتحقق من صحة الرؤية
function validateVisibility (input) {
  let value = input.value;

  // إذا كانت القيمة فارغة، لا تفعل شيئاً
  if (!value) return true;

  // التحقق من أن القيمة رقمية
  if (!/^\d+$/.test (value)) {
    showFieldError (input, 'يجب إدخال أرقام فقط');
    return false;
  }

  // التحقق من النطاق (0 إلى 999)
  const numValue = parseInt (value);
  if (numValue < 0 || numValue > 999) {
    showFieldError (input, 'يجب أن تكون القيمة بين 000 و 999');
    return false;
  }

  // إذا كانت كل الشروط صحيحة، إخفاء أي أخطاء
  hideFieldError (input);
  return true;
}

// دالة للتحقق من صحة الطقس الحاضر
function validateCurrentWeather (input) {
  let value = input.value;

  // إذا كانت القيمة فارغة، لا تفعل شيئاً
  if (!value) return true;

  // التحقق من أن القيمة رقمية ومكونة من رقمين
  if (!/^\d{2}$/.test (value)) {
    showFieldError (input, 'يجب إدخال رمز مكون من رقمين');
    return false;
  }

  // التحقق من النطاق (00 إلى 99)
  const numValue = parseInt (value);
  if (numValue < 0 || numValue > 99) {
    showFieldError (input, 'يجب أن يكون الرمز بين 00 و 99');
    return false;
  }

  // إذا كانت كل الشروط صحيحة، إخفاء أي أخطاء
  hideFieldError (input);
  return true;
}

// دالة للتحقق من صحة مجموع السحب
function validateCloudSum (input) {
  let value = input.value;

  // إذا كانت القيمة فارغة، لا تفعل شيئاً
  if (!value) return true;

  // التحقق من أن القيمة رقمية
  if (!/^\d+$/.test (value)) {
    showFieldError (input, 'يجب إدخال أرقام فقط');
    return false;
  }

  // التحقق من النطاق (0 إلى 16 لمجموع 1+2، 0 إلى 24 لمجموع 1+2+3)
  const numValue = parseInt (value);
  const maxValue = input.id === 'cloudSum12' ? 16 : 24;

  if (numValue < 0 || numValue > maxValue) {
    showFieldError (input, `يجب أن تكون القيمة بين 0 و ${maxValue}`);
    return false;
  }

  // إذا كانت كل الشروط صحيحة، إخفاء أي أخطاء
  hideFieldError (input);
  return true;
}

// دالة للتحقق من صحة ارتفاع السحب
function validateCloudHeight (input) {
  let value = input.value;

  // إذا كانت القيمة فارغة، no action
  if (!value) return true;

  // التحقق من أن القيمة رقمية
  if (!/^\d+$/.test (value)) {
    showFieldError (input, 'يجب إدخال أرقام فقط');
    return false;
  }

  // التحقق من النطاق (0 إلى 999)
  const numValue = parseInt (value);
  if (numValue < 0 || numValue > 999) {
    showFieldError (input, 'يجب أن تكون القيمة بين 000 و 999');
    return false;
  }

  // إذا كانت كل الشروط صحيحة، إخفاء أي أخطاء
  hideFieldError (input);
  return true;
}

// دالة لعرض خطأ للحقل
function showFieldError (input, message) {
  // إزالة أي رسائل خطأ سابقة
  hideFieldError (input);

  // إضافة صنف الخطأ للحقل
  input.classList.add ('is-invalid');

  // إنشاء عنصر رسالة الخطأ
  const errorDiv = document.createElement ('div');
  errorDiv.className = 'invalid-feedback';
  errorDiv.textContent = message;
  errorDiv.id = input.id + 'Error';

  // إضافة رسالة الخطأ بعد الحقل
  input.parentNode.appendChild (errorDiv);
}

// دالة لإخفاء خطأ الحقل
function hideFieldError (input) {
  // إزالة صنف الخطأ
  input.classList.remove ('is-invalid');

  // إزالة رسالة الخطأ إذا كانت موجودة
  const errorDiv = document.getElementById (input.id + 'Error');
  if (errorDiv) {
    errorDiv.remove ();
  }
}

// إعادة تعيين النموذج
function resetForm () {
  if (
    confirm (
      'هل أنت متأكد من أنك تريد إعادة تعيين النموذج؟ سيتم فقدان جميع البيانات المدخلة.'
    )
  ) {
    document.getElementById ('station').selectedIndex = 0;
    document.getElementById ('observationTime').value = '';
    document.getElementById ('observer').value = '';
    document.getElementById ('station-password').value = '';
    document.getElementById ('dryTemp').value = '';
    document.getElementById ('wetTemp').value = '';
    document.getElementById ('stationPressure').value = '';
    document.getElementById ('stationPressureMSL').value = '';
    document.getElementById ('windDirSurface').value = '';
    document.getElementById ('windSpeedSurface').value = '';
    document.getElementById ('windDirMean').value = '';
    document.getElementById ('windSpeedMean').value = '';
    document.getElementById ('visibility').value = '';
    document.getElementById ('currentWeather').value = '';
    document.getElementById ('pastWeather').value = '';
    document.getElementById ('cloudSum12').value = '';
    document.getElementById ('cloudSum123').value = '';
    document.getElementById ('responsibilityCheckbox').checked = false;

    // إعادة تعيين حقول السحب
    for (let i = 1; i <= 4; i++) {
      document.getElementById (`cloudAmount${i}`).value = '';
      document.getElementById (`cloudType${i}`).value = '';
      document.getElementById (`cloudHeight${i}`).value = '';
      document.getElementById (`cloudType${i}`).disabled = true;
      document.getElementById (`cloudHeight${i}`).disabled = true;
    }

    // إعادة تعيين النتائج المحسوبة
    document.getElementById ('vaporPressureResult').textContent = '0.00';
    document.getElementById ('dewPointResult').textContent = '0.00';
    document.getElementById ('humidityResult').textContent = '0.00';
    document.getElementById ('vaporDiffResult').textContent = '0.00';

    // إعادة تعيين معلومات المحطة
    updateStationInfo ();

    // إخفاء معلومات التوقيت العالمي
    document.getElementById ('utcTimeInfo').style.display = 'none';

    // إخفاء رسائل الخطأ
    resetAllValidationErrors ();

    // إخفاء شرح الطقس
    hideWeatherDescription ();

    // إخفاء أي تنبيهات
    hideAlert ();

    // إعادة التركيز على أول حقل
    document.getElementById ('station').focus ();

    showAlert ('تم إعادة تعيين النموذج بنجاح', 'success');
  }
}

// دالة لعرض التنبيهات
function showAlert (message, type = 'info') {
  // إخفاء أي تنبيهات سابقة
  hideAlert ();

  // إنشاء عنصر التنبيه
  const alertDiv = document.createElement ('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  // إضافة التنبيه إلى الصفحة
  document.getElementById ('alertContainer').appendChild (alertDiv);

  // إخفاء التنبيه تلقائياً بعد 5 ثوانٍ
  setTimeout (() => {
    hideAlert ();
  }, 5000);
}

// دالة لإخفاء التنبيهات
function hideAlert () {
  const alertContainer = document.getElementById ('alertContainer');
  if (alertContainer) {
    alertContainer.innerHTML = '';
  }
}

// دالة لتنزيل البيانات كملف JSON
function downloadData () {
  // جمع البيانات من النموذج
  const formData = collectFormData ();

  // تحويل البيانات إلى JSON
  const jsonData = JSON.stringify (formData, null, 2);

  // إنشاء رابط تنزيل
  const blob = new Blob ([jsonData], {type: 'application/json'});
  const url = URL.createObjectURL (blob);
  const a = document.createElement ('a');
  a.href = url;
  a.download = `weather_data_${formData.station.code}_${formData.observation.date}_${formData.observation.time}.json`;
  document.body.appendChild (a);
  a.click ();
  document.body.removeChild (a);
  URL.revokeObjectURL (url);
}

// دالة لجمع البيانات من النموذج
function collectFormData () {
  const stationSelect = document.getElementById ('station');
  const selectedStation = stationSelect.options[stationSelect.selectedIndex];

  // جمع بيانات السحب
  const clouds = [];
  for (let i = 1; i <= 4; i++) {
    const amount = document.getElementById (`cloudAmount${i}`).value;
    const type = document.getElementById (`cloudType${i}`).value;
    const height = document.getElementById (`cloudHeight${i}`).value;

    if (amount || type || height) {
      clouds.push ({
        layer: i,
        amount: amount || null,
        type: type || null,
        height: height || null,
      });
    }
  }

  // إنشاء كائن البيانات
  const formData = {
    station: {
      code: selectedStation.value,
      name: selectedStation.dataset.name,
      elevation: parseFloat (selectedStation.dataset.elevation) || 0,
    },
    observation: {
      date: document.getElementById ('observationDate').value,
      time: document.getElementById ('observationTime').value,
      utcTime: convertToUTC (
        document.getElementById ('observationTime').value
      ),
    },
    observer: document.getElementById ('observer').value,
    authentication: {
      password: document.getElementById ('station-password').value,
    },
    temperature: {
      dry: parseFloat (document.getElementById ('dryTemp').value) || null,
      wet: parseFloat (document.getElementById ('wetTemp').value) || null,
      max: parseFloat (document.getElementById ('maxTemp').value) || null,
      min: parseFloat (document.getElementById ('minTemp').value) || null,
    },
    pressure: {
      station: parseFloat (
        document.getElementById ('stationPressure').value
      ) || null,
      msl: parseFloat (
        document.getElementById ('stationPressureMSL').value
      ) || null,
    },
    wind: {
      surface: {
        direction: document.getElementById ('windDirSurface').value || null,
        speed: document.getElementById ('windSpeedSurface').value || null,
      },
      mean: {
        direction: document.getElementById ('windDirMean').value || null,
        speed: document.getElementById ('windSpeedMean').value || null,
      },
    },
    visibility: document.getElementById ('visibility').value || null,
    weather: {
      current: document.getElementById ('currentWeather').value || null,
      past: document.getElementById ('pastWeather').value || null,
    },
    clouds: clouds,
    derived: {
      vaporPressure: parseFloat (
        document.getElementById ('vaporPressureResult').textContent
      ) || 0,
      dewPoint: parseFloat (
        document.getElementById ('dewPointResult').textContent
      ) || 0,
      humidity: parseFloat (
        document.getElementById ('humidityResult').textContent
      ) || 0,
      vaporPressureDiff: parseFloat (
        document.getElementById ('vaporDiffResult').textContent
      ) || 0,
    },
    calculatedAt: new Date ().toISOString (),
  };

  return formData;
}

// دالة محسنة للإرسال إلى Supabase
async function sendDataToSupabase (formData, isHourly = true) {
  try {
    const {insertHourlyData, insertDailyData, validateStationPassword} = await import (
      './supabase.js'
    );

    // التحقق من كلمة مرور المحطة أولاً
    const isValidPassword = await validateStationPassword (
      formData.station.code,
      formData.authentication.password
    );

    if (!isValidPassword) {
      throw new Error ('كلمة مرور المحطة غير صحيحة');
    }

    // إرسال البيانات بناءً على النوع
    let result;
    if (isHourly) {
      result = await insertHourlyData (formData);
    } else {
      result = await insertDailyData (formData);
    }

    return result;
  } catch (error) {
    console.error ('Error sending data to Supabase:', error);
    throw error;
  }
}

// دالة محسنة للإرسال
async function sendData () {
  if (!validateForm ()) return;

  try {
    // جمع البيانات من النموذج
    const formData = collectFormData ();

    // إرسال البيانات إلى Supabase
    const result = await sendDataToSupabase (formData, true);

    // تنزيل البيانات كملف JSON
    downloadData ();

    showAlert ('تم إرسال البيانات وتنزيلها بنجاح', 'success');
  } catch (error) {
    console.error ('Error in sendData:', error);
    showAlert ('حدث خطأ أثناء الإرسال: ' + error.message, 'danger');
  }
}

// تحديث دالة تحميل المحطات
async function loadStationsForSelect (selectId) {
  try {
    const {fetchStations} = await import ('./supabase.js');
    const stations = await fetchStations ();

    const select = document.getElementById (selectId);
    if (select) {
      select.innerHTML = '<option value="">اختر المحطة</option>';

      stations.forEach (station => {
        const option = document.createElement ('option');
        option.value = station.code;
        option.textContent = `${station.name} (${station.code})`;
        option.dataset.name = station.name;
        option.dataset.elevation = station.elevation;
        select.appendChild (option);
      });
    }
  } catch (error) {
    console.error ('Error loading stations:', error);
    showAlert ('حدث خطأ أثناء تحميل المحطات', 'warning');
  }
}

// تهيئة الصفحة عند تحميلها
document.addEventListener ('DOMContentLoaded', function () {
  // تحديث التاريخ الحالي
  updateDate ();

  // تعيين تاريخ اليوم كقيمة افتراضية
  const today = new Date ();
  const formattedDate = today.toISOString ().split ('T')[0];
  document.getElementById ('observationDate').value = formattedDate;

  // تعيين الوقت الحالي كقيمة افتراضية
  const hours = today.getHours ().toString ().padStart (2, '0');
  document.getElementById ('observationTime').value = hours;
  showUTCTime (hours);

  // تحميل المحطات
  loadStationsForSelect ('station');

  // تحميل رموز الطقس
  loadWeatherCodes ().then (codes => {
    weatherCodes = codes;
  });

  // إضافة مستمعات الأحداث
  document
    .getElementById ('station')
    .addEventListener ('change', updateStationInfo);

  document
    .getElementById ('observationTime')
    .addEventListener ('blur', function () {
      showUTCTime (this.value);
    });

  // إضافة مستمعات الأحداث لدرجات الحرارة
  document.getElementById ('dryTemp').addEventListener ('blur', function () {
    formatTemperature (this);
    validateTemperature (this, true);
  });

  document.getElementById ('wetTemp').addEventListener ('blur', function () {
    formatTemperature (this);
    validateTemperature (
      this,
      false,
      document.getElementById ('dryTemp')
    );
  });

  // إضافة مستمعات الأحداث للضغط
  document
    .getElementById ('stationPressure')
    .addEventListener ('blur', function () {
      formatPressure (this);
      validatePressure (this);
    });

  document
    .getElementById ('stationPressureMSL')
    .addEventListener ('blur', function () {
      formatPressure (this);
      validatePressure (this);
    });

  // إضافة مستمعات الأحداث للطقس الحاضر
  document
    .getElementById ('currentWeather')
    .addEventListener ('blur', function () {
      validateCurrentWeather (this);
      showWeatherCodeDescription (this.value);
    });

  document
    .getElementById ('currentWeather')
    .addEventListener ('focus', hideWeatherDescription);

  // إضافة مستمعات الأحداث للطقس الغابر
  document
    .getElementById ('pastWeather')
    .addEventListener ('blur', function () {
      validatePastWeather (this);
    });

  // إضافة مستمعات الأحداث للرؤية
  document.getElementById ('visibility').addEventListener ('blur', function () {
    validateVisibility (this);
  });

  // إضافة مستمعات الأحداث لتغطية السحب
  for (let i = 1; i <= 4; i++) {
    document
      .getElementById (`cloudAmount${i}`)
      .addEventListener ('blur', function () {
        validateCloudCover (this);
      });
  }

  // إضافة مستمعات الأحداث لارتفاع السحب
  for (let i = 1; i <= 3; i++) {
    document
      .getElementById (`cloudHeight${i}`)
      .addEventListener ('blur', function () {
        validateCloudHeight (this);
      });
  }

  // إضافة مستمعات الأحداث لمجموع السحب
  document.getElementById ('cloudSum12').addEventListener ('blur', function () {
    validateCloudSum (this);
  });

  document
    .getElementById ('cloudSum123')
    .addEventListener ('blur', function () {
      validateCloudSum (this);
    });

  // إضافة مستمعات الأحداث لأزرار الإرسال والحساب
  document
    .getElementById ('calculateBtn')
    .addEventListener ('click', calculateDerivedValues);

  document.getElementById ('sendBtn').addEventListener ('click', sendData);

  document.getElementById ('resetBtn').addEventListener ('click', resetForm);

  // إضافة تأثيرات للعناصر عند التحميل
  setTimeout (() => {
    document.querySelector ('header').classList.add ('fade-in');
    document.querySelector ('main').classList.add ('slide-in');
  }, 100);
});