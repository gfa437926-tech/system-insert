// daily.js - معالجات خاصة بالقسم اليومي مع التحقق من الصحة

document.addEventListener('DOMContentLoaded', function() {
    // تحميل معلومات المحطات من ملف JSON
    fetch('stations.json')
        .then(response => response.json())
        .then(data => {
            const stationSelect = document.getElementById('dailyStation');
            if (stationSelect) {
                stationSelect.innerHTML = '<option value="">اختر المحطة</option>';
                data.stations.forEach(station => {
                    const option = document.createElement('option');
                    option.value = station.code;
                    option.textContent = `${station.name} (${station.code})`;
                    option.dataset.name = station.name;
                    option.dataset.elevation = station.elevation;
                    stationSelect.appendChild(option);
                });
            }
        })
        .catch(error => console.error('Error loading stations:', error));

    // تحديث معلومات المحطة عند التغيير
    const stationSelect = document.getElementById('dailyStation');
    if (stationSelect) {
        stationSelect.addEventListener('change', updateDailyStationInfo);
    }

    // تعيين التاريخ الحالي
    document.getElementById('dailyObservationDate').valueAsDate = new Date();

    // إضافة خيارات التوقيت
    const observationTimeSelect = document.getElementById('dailyObservationTime');
    if (observationTimeSelect) {
        observationTimeSelect.innerHTML = '';
        ['06', '18', '24 ساعة'].forEach(time => {
            const option = document.createElement('option');
            option.value = time === '24 ساعة' ? '24' : time;
            option.textContent = time;
            observationTimeSelect.appendChild(option);
        });
    }

    // إضافة معالجات لأزرار القسم اليومي
    const dailySendBtn = document.getElementById('dailySendBtn');
    if (dailySendBtn) {
        dailySendBtn.addEventListener('click', validateAndSendDailyForm);
    }

    const dailyDownloadBtn = document.getElementById('dailyDownloadBtn');
    if (dailyDownloadBtn) {
        dailyDownloadBtn.addEventListener('click', downloadDailyData);
    }

    const dailyResetBtn = document.getElementById('dailyResetBtn');
    if (dailyResetBtn) {
        dailyResetBtn.addEventListener('click', resetDailyForm);
    }

    // إضافة مستمعات الأحداث للتحقق أثناء الكتابة
    addDailyValidationListeners();
});

// تحديث معلومات المحطة في القسم اليومي
function updateDailyStationInfo() {
    const stationSelect = document.getElementById('dailyStation');
    const station = stationSelect.options[stationSelect.selectedIndex];

    if (station.value) {
        document.getElementById('dailyStationCode').value = station.value;
        document.getElementById('dailyStationName').value = station.dataset.name || '';
        
        const elevation = parseFloat(station.dataset.elevation) || 0;
        document.getElementById('dailyElevation').value = elevation;
    } else {
        document.getElementById('dailyStationCode').value = '';
        document.getElementById('dailyStationName').value = '';
        document.getElementById('dailyElevation').value = '';
    }
}

// إضافة مستمعات الأحداث للتحقق من الصحة
function addDailyValidationListeners() {
    // درجات الحرارة
    document.getElementById('minTemp').addEventListener('blur', function() {
        formatDailyTemperature(this, true); // مسموح بالسالب
    });
    
    document.getElementById('maxTemp').addEventListener('blur', function() {
        formatDailyTemperature(this, false); // غير مسموح بالسالب
    });
    
    // الهطول والثلوج
    document.getElementById('precipitation').addEventListener('blur', function() {
        formatDailyPrecipitation(this);
    });
    
    document.getElementById('snowThickness').addEventListener('blur', function() {
        formatDailySnow(this);
    });
    
    // التبخر
    document.getElementById('evaporationRecord').addEventListener('blur', function() {
        formatDailyEvaporation(this);
    });
    
    document.getElementById('evaporationLeach').addEventListener('blur', function() {
        formatDailyEvaporation(this);
    });
    
    // سطوع الشمس
    document.getElementById('actualSunshine').addEventListener('blur', function() {
        formatDailySunshine(this);
    });
    
    document.getElementById('totalSunshine').addEventListener('blur', function() {
        formatDailySunshine(this);
    });
    
    document.getElementById('sunshinePercentage').addEventListener('blur', function() {
        formatDailyPercentage(this);
    });
    
    // أكبر نفخة
    document.getElementById('gustSpeed').addEventListener('blur', function() {
        formatDailyGustSpeed(this);
    });
    
    document.getElementById('gustDirection').addEventListener('blur', function() {
        formatDailyGustDirection(this);
    });
    
    document.getElementById('gustTime').addEventListener('blur', function() {
        formatDailyGustTime(this);
    });
    
    // الرطوبة
    document.getElementById('maxHumidity').addEventListener('blur', function() {
        formatDailyMaxHumidity(this);
    });
    
    document.getElementById('maxHumidityTime').addEventListener('blur', function() {
        formatDailyHumidityTime(this);
    });
    
    document.getElementById('minHumidity').addEventListener('blur', function() {
        formatDailyMinHumidity(this);
    });
    
    document.getElementById('minHumidityTime').addEventListener('blur', function() {
        formatDailyHumidityTime(this);
    });
    
    document.getElementById('dewAmount').addEventListener('blur', function() {
        formatDailyDewAmount(this);
    });
}

// دالة لتنسيق درجة الحرارة اليومية
function formatDailyTemperature(input, allowNegative = false) {
    let value = input.value.replace(/[^\d.-]/g, '');
    
    // إذا كانت القيمة فارغة
    if (!value) return;
    
    // التحقق من وجود إشارة سالبة إذا كان غير مسموح
    if (!allowNegative && value.includes('-')) {
        showDailyFieldError(input, 'القيمة لا يمكن أن تكون سالبة');
        input.value = '';
        return;
    }
    
    // فصل الأجزاء قبل وبعد الفاصلة
    let integerPart = '';
    let decimalPart = '0';
    
    if (value.includes('.')) {
        const parts = value.split('.');
        integerPart = parts[0];
        decimalPart = parts[1] || '0';
    } else {
        integerPart = value;
    }
    
    // تقييد الجزء العشري إلى رقم واحد
    decimalPart = decimalPart.charAt(0);
    
    // التأكد من أن الجزء الصحيح مكون من رقمين
    if (allowNegative && integerPart.startsWith('-')) {
        // إذا كانت سالبة، التأكد من أن القيمة المطلقة مكونة من رقمين
        const absValue = integerPart.substring(1);
        if (absValue.length > 2) {
            integerPart = integerPart.charAt(0) + absValue.slice(0, 2);
        } else if (absValue.length < 2) {
            integerPart = integerPart.charAt(0) + absValue.padStart(2, '0');
        }
    } else {
        // إذا كانت موجبة، التأكد من أنها مكونة من رقمين
        if (integerPart.length > 2) {
            integerPart = integerPart.slice(0, 2);
        } else if (integerPart.length < 2) {
            integerPart = integerPart.padStart(2, '0');
        }
    }
    
    input.value = integerPart + '.' + decimalPart;
    hideDailyFieldError(input);
}

// دالة لتنسيق الهطول
function formatDailyPrecipitation(input) {
    let value = input.value.replace(/[^\d.]/g, '');
    
    // إذا كانت القيمة فارغة
    if (!value) return;
    
    // فصل الأجزاء قبل وبعد الفاصلة
    let integerPart = '';
    let decimalPart = '0';
    
    if (value.includes('.')) {
        const parts = value.split('.');
        integerPart = parts[0];
        decimalPart = parts[1] || '0';
    } else {
        integerPart = value;
    }
    
    // تقييد الجزء العشري إلى رقم واحد
    decimalPart = decimalPart.charAt(0);
    
    // التأكد من أن الجزء الصحيح مكون من 3 أرقام
    if (integerPart.length > 3) {
        integerPart = integerPart.slice(0, 3);
    } else if (integerPart.length < 3) {
        integerPart = integerPart.padStart(3, '0');
    }
    
    input.value = integerPart + '.' + decimalPart;
    hideDailyFieldError(input);
}

// دالة لتنسيق سماكة الثلوج
function formatDailySnow(input) {
    let value = input.value.replace(/[^\d]/g, '');
    
    // إذا كانت القيمة فارغة
    if (!value) return;
    
    // التأكد من أن القيمة مكونة من رقمين
    if (value.length > 2) {
        value = value.slice(0, 2);
    } else if (value.length < 2) {
        value = value.padStart(2, '0');
    }
    
    input.value = value;
    hideDailyFieldError(input);
}

// دالة لتنسيق التبخر
function formatDailyEvaporation(input) {
    let value = input.value.replace(/[^\d.]/g, '');
    
    // إذا كانت القيمة فارغة
    if (!value) return;
    
    // فصل الأجزاء قبل وبعد الفاصلة
    let integerPart = '';
    let decimalPart = '0';
    
    if (value.includes('.')) {
        const parts = value.split('.');
        integerPart = parts[0];
        decimalPart = parts[1] || '0';
    } else {
        integerPart = value;
    }
    
    // تقييد الجزء العشري إلى رقم واحد
    decimalPart = decimalPart.charAt(0);
    
    // التأكد من أن الجزء الصحيح مكون من رقمين
    if (integerPart.length > 2) {
        integerPart = integerPart.slice(0, 2);
    } else if (integerPart.length < 2) {
        integerPart = integerPart.padStart(2, '0');
    }
    
    input.value = integerPart + '.' + decimalPart;
    hideDailyFieldError(input);
}

// دالة لتنسيق سطوع الشمس
function formatDailySunshine(input) {
    let value = input.value.replace(/[^\d.]/g, '');
    
    // إذا كانت القيمة فارغة
    if (!value) return;
    
    // فصل الأجزاء قبل وبعد الفاصلة
    let integerPart = '';
    let decimalPart = '0';
    
    if (value.includes('.')) {
        const parts = value.split('.');
        integerPart = parts[0];
        decimalPart = parts[1] || '0';
    } else {
        integerPart = value;
    }
    
    // تقييد الجزء العشري إلى رقم واحد
    decimalPart = decimalPart.charAt(0);
    
    // التأكد من أن الجزء الصحيح مكون من رقمين
    if (integerPart.length > 2) {
        integerPart = integerPart.slice(0, 2);
    } else if (integerPart.length < 2) {
        integerPart = integerPart.padStart(2, '0');
    }
    
    input.value = integerPart + '.' + decimalPart;
    hideDailyFieldError(input);
}

// دالة لتنسيق النسبة المئوية
function formatDailyPercentage(input) {
    let value = input.value.replace(/[^\d]/g, '');
    
    // إذا كانت القيمة فارغة
    if (!value) return;
    
    // التأكد من أن القيمة مكونة من 3 أرقام
    if (value.length > 3) {
        value = value.slice(0, 3);
    } else if (value.length < 3) {
        value = value.padStart(3, '0');
    }
    
    input.value = value;
    hideDailyFieldError(input);
}

// دالة لتنسيق سرعة النفخة
function formatDailyGustSpeed(input) {
    let value = input.value.replace(/[^\d]/g, '');
    
    // إذا كانت القيمة فارغة
    if (!value) return;
    
    // التأكد من أن القية مكونة من رقمين
    if (value.length > 2) {
        value = value.slice(0, 2);
    } else if (value.length < 2) {
        value = value.padStart(2, '0');
    }
    
    input.value = value;
    hideDailyFieldError(input);
}

// دالة لتنسيق اتجاه النفخة
function formatDailyGustDirection(input) {
    let value = input.value.replace(/[^\d]/g, '');
    
    // إذا كانت القيمة فارغة
    if (!value) return;
    
    // التأكد من أن القيمة بين 00 و 36
    const numValue = parseInt(value);
    if (numValue < 0 || numValue > 36) {
        showDailyFieldError(input, 'يجب أن تكون القيمة بين 00 و 36');
        return;
    }
    
    // التأكد من أن القيمة مكونة من رقمين
    if (value.length > 2) {
        value = value.slice(0, 2);
    } else if (value.length < 2) {
        value = value.padStart(2, '0');
    }
    
    input.value = value;
    hideDailyFieldError(input);
}

// دالة لتنسيق وقت النفخة
function formatDailyGustTime(input) {
    let value = input.value.replace(/[^\d.]/g, '');
    
    // إذا كانت القيمة فارغة
    if (!value) return;
    
    // فصل الأجزاء قبل وبعد الفاصلة
    let integerPart = '';
    let decimalPart = '0';
    
    if (value.includes('.')) {
        const parts = value.split('.');
        integerPart = parts[0];
        decimalPart = parts[1] || '0';
    } else {
        integerPart = value;
    }
    
    // تقييد الجزء العشري إلى رقم واحد
    decimalPart = decimalPart.charAt(0);
    
    // التأكد من أن الجزء الصحيح مكون من رقمين وبين 00 و 23
    const hourValue = parseInt(integerPart);
    if (hourValue < 0 || hourValue > 23) {
        showDailyFieldError(input, 'يجب أن تكون الساعة بين 00 و 23');
        return;
    }
    
    if (integerPart.length > 2) {
        integerPart = integerPart.slice(0, 2);
    } else if (integerPart.length < 2) {
        integerPart = integerPart.padStart(2, '0');
    }
    
    input.value = integerPart + '.' + decimalPart;
    hideDailyFieldError(input);
}

// دالة لتنسيق أقصى رطوبة
function formatDailyMaxHumidity(input) {
    let value = input.value.replace(/[^\d]/g, '');
    
    // إذا كانت القيمة فارغة
    if (!value) return;
    
    // التأكد من أن القيمة بين 0 و 100
    const numValue = parseInt(value);
    if (numValue < 0 || numValue > 100) {
        showDailyFieldError(input, 'يجب أن تكون القيمة بين 000 و 100');
        return;
    }
    
    // التأكد من أن القيمة مكونة من 3 أرقام
    if (value.length > 3) {
        value = value.slice(0, 3);
    } else if (value.length < 3) {
        value = value.padStart(3, '0');
    }
    
    input.value = value;
    hideDailyFieldError(input);
}

// دالة لتنسيق وقت الرطوبة
function formatDailyHumidityTime(input) {
    let value = input.value.replace(/[^\d.]/g, '');
    
    // إذا كانت القيمة فارغة
    if (!value) return;
    
    // فصل الأجزاء قبل وبعد الفاصلة
    let integerPart = '';
    let decimalPart = '0';
    
    if (value.includes('.')) {
        const parts = value.split('.');
        integerPart = parts[0];
        decimalPart = parts[1] || '0';
    } else {
        integerPart = value;
    }
    
    // تقييد الجزء العشري إلى رقم واحد
    decimalPart = decimalPart.charAt(0);
    
    // التأكد من أن الجزء الصحيح مكون من رقمين وبين 00 و 23
    const hourValue = parseInt(integerPart);
    if (hourValue < 0 || hourValue > 23) {
        showDailyFieldError(input, 'يجب أن تكون الساعة بين 00 و 23');
        return;
    }
    
    if (integerPart.length > 2) {
        integerPart = integerPart.slice(0, 2);
    } else if (integerPart.length < 2) {
        integerPart = integerPart.padStart(2, '0');
    }
    
    input.value = integerPart + '.' + decimalPart;
    hideDailyFieldError(input);
}

// دالة لتنسيق أدنى رطوبة
function formatDailyMinHumidity(input) {
    let value = input.value.replace(/[^\d]/g, '');
    
    // إذا كانت القيمة فارغة
    if (!value) return;
    
    // التأكد من أن القيمة بين 0 و 100
    const numValue = parseInt(value);
    if (numValue < 0 || numValue > 100) {
        showDailyFieldError(input, 'يجب أن تكون القيمة بين 00 و 100');
        return;
    }
    
    // التأكد من أن القيمة مكونة من رقمين
    if (value.length > 2) {
        value = value.slice(0, 2);
    } else if (value.length < 2) {
        value = value.padStart(2, '0');
    }
    
    input.value = value;
    hideDailyFieldError(input);
}

// دالة لتنسيق كمية الندى
function formatDailyDewAmount(input) {
    let value = input.value.replace(/[^\d.]/g, '');
    
    // إذا كانت القيمة فارغة
    if (!value) return;
    
    // فصل الأجزاء قبل وبعد الفاصلة
    let integerPart = '';
    let decimalPart = '0';
    
    if (value.includes('.')) {
        const parts = value.split('.');
        integerPart = parts[0];
        decimalPart = parts[1] || '0';
    } else {
        integerPart = value;
    }
    
    // تقييد الجزء العشري إلى رقم واحد
    decimalPart = decimalPart.charAt(0);
    
    // التأكد من أن الجزء الصحيح مكون من رقمين
    if (integerPart.length > 2) {
        integerPart = integerPart.slice(0, 2);
    } else if (integerPart.length < 2) {
        integerPart = integerPart.padStart(2, '0');
    }
    
    input.value = integerPart + '.' + decimalPart;
    hideDailyFieldError(input);
}

// التحقق من صحة النموذج اليومي وإرساله
function validateAndSendDailyForm() {
    // إعادة تعيين جميع أخطاء التحقق
    resetAllDailyValidationErrors();
    
    let isValid = true;
    let missingFields = [];
    
    // 1. التحقق من الحقول المطلوبة الأساسية
    const requiredFields = [
        {id: 'dailyStation', name: 'اسم المحطة'},
        {id: 'dailyObservationDate', name: 'تاريخ الرصد'},
        {id: 'dailyObservationTime', name: 'وقت الرصد'},
        {id: 'dailyObserver', name: 'اسم الراصد'},
        {id: 'dailyStationPassword', name: 'كلمة مرور المحطة'}
    ];
    
    requiredFields.forEach(field => {
        const fieldElement = document.getElementById(field.id);
        if (!fieldElement.value.trim()) {
            isValid = false;
            missingFields.push(field.name);
            showDailyFieldError(fieldElement, 'هذا الحقل مطلوب');
        }
    });
    
    // 2. التحقق من تأكيد المسؤولية
    if (!document.getElementById('dailyResponsibilityCheckbox').checked) {
        isValid = false;
        showDailyAlert('يجب الموافقة على تحمل المسؤولية قبل الإرسال', 'warning');
        
        // تسليط الضوء على خانة التأكيد
        const checkbox = document.getElementById('dailyResponsibilityCheckbox');
        checkbox.classList.add('is-invalid');
        const label = checkbox.nextElementSibling;
        label.classList.add('text-danger', 'fw-bold');
    }
    
    // 3. إذا كان هناك أخطاء، عرض رسالة تفصيلية
    if (!isValid) {
        let errorMessage = 'يوجد أخطاء في النموذج:\n';
        
        if (missingFields.length > 0) {
            errorMessage += `\n• الحقول المطلوبة: ${missingFields.join('، ')}`;
        }
        
        showDailyAlert(errorMessage, 'warning');
        
        // التمرير إلى أول حقل به خطأ
        scrollToFirstDailyError();
    } else {
        // إذا كان النموذج صحيحاً، المتابعة للإرسال
        sendDailyData();
    }
    
    return isValid;
}

// دالة لعرض خطأ للحقل في القسم اليومي
function showDailyFieldError(input, message) {
    // إزالة أي رسائل خطأ سابقة
    hideDailyFieldError(input);
    
    // إضافة صنف الخطأ للحقل
    input.classList.add('is-invalid');
    
    // إنشاء عنصر رسالة الخطأ
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    errorDiv.id = input.id + 'Error';
    
    // إضافة رسالة الخطأ بعد الحقل
    input.parentNode.appendChild(errorDiv);
}

// دالة لإخفاء خطأ الحقل في القسم اليومي
function hideDailyFieldError(input) {
    // إزالة صنف الخطأ
    input.classList.remove('is-invalid');
    
    // إزالة رسالة الخطأ إذا كانت موجودة
    const errorDiv = document.getElementById(input.id + 'Error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// دالة مساعدة لإعادة تعيين جميع أخطاء التحقق في القسم اليومي
function resetAllDailyValidationErrors() {
    // إزالة جميع أخطاء التحقق
    document.querySelectorAll('#daily .is-invalid').forEach(element => {
        element.classList.remove('is-invalid');
    });
    
    // إزالة جميع رسائل الخطأ
    document.querySelectorAll('#daily .invalid-feedback').forEach(element => {
        element.remove();
    });
    
    // إعادة تعيين تنسيق خانة التأكيد
    const checkbox = document.getElementById('dailyResponsibilityCheckbox');
    if (checkbox) {
        checkbox.classList.remove('is-invalid');
        const label = checkbox.nextElementSibling;
        if (label) {
            label.classList.remove('text-danger', 'fw-bold');
        }
    }
}

// دالة للتمرير إلى أول حقل به خطأ في القسم اليومي
function scrollToFirstDailyError() {
    const firstError = document.querySelector('#daily .is-invalid');
    if (firstError) {
        firstError.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        
        // إضافة تأثير اهتزاز للحقل
        firstError.classList.add('shake');
        setTimeout(() => {
            firstError.classList.remove('shake');
        }, 500);
        
        // التركيز على الحقل
        firstError.focus();
    }
}

// دالة لعرض رسائل تنبيه في القسم اليومي
function showDailyAlert(message, type = 'info') {
    // إزالة أي تنبيهات سابقة
    const existingAlerts = document.querySelectorAll('#daily .custom-alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : type === 'danger' ? 'fa-times-circle' : 'fa-info-circle'} me-2"></i>
            <div>${message}</div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // إضافة أنيميشن للتنبيه
    alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
    
    // إضافة التنبيه في أعلى الصفحة
    document.getElementById('daily').appendChild(alertDiv);
    
    // إزالة التنبيه تلقائياً بعد 5 ثوان
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// إرسال بيانات القسم اليومي
async function sendDailyData() {
    // جمع البيانات من النموذج
    const formData = {
        station: {
            code: document.getElementById('dailyStationCode').value,
            name: document.getElementById('dailyStationName').value,
            elevation: document.getElementById('dailyElevation').value
        },
        observation: {
            date: document.getElementById('dailyObservationDate').value,
            time: document.getElementById('dailyObservationTime').value
        },
        observer: document.getElementById('dailyObserver').value,
        authentication: {
            password: document.getElementById('dailyStationPassword').value
        },
        temperatures: {
            min: document.getElementById('minTemp').value,
            max: document.getElementById('maxTemp').value
        },
        precipitation: {
            amount: document.getElementById('precipitation').value,
            snowThickness: document.getElementById('snowThickness').value
        },
        weatherElements: {
            thunderstorm: document.getElementById('thunderstorm').checked,
            hail: document.getElementById('hail').checked,
            snow: document.getElementById('snow').checked,
            rain: document.getElementById('rain').checked,
            frost: document.getElementById('frost').checked,
            fog: document.getElementById('fog').checked,
            drizzle: document.getElementById('drizzle').checked,
            dustStorm: document.getElementById('dustStorm').checked,
            dust: document.getElementById('dust').checked,
            haze: document.getElementById('haze').checked,
            stormyWind: document.getElementById('stormyWind').checked
        },
        evaporation: {
            record: document.getElementById('evaporationRecord').value,
            leach: document.getElementById('evaporationLeach').value
        },
        sunshine: {
            actual: document.getElementById('actualSunshine').value,
            total: document.getElementById('totalSunshine').value,
            percentage: document.getElementById('sunshinePercentage').value
        },
        gust: {
            speed: document.getElementById('gustSpeed').value,
            direction: document.getElementById('gustDirection').value,
            time: document.getElementById('gustTime').value
        },
        humidity: {
            max: document.getElementById('maxHumidity').value,
            maxTime: document.getElementById('maxHumidityTime').value,
            min: document.getElementById('minHumidity').value,
            minTime: document.getElementById('minHumidityTime').value,
            dewAmount: document.getElementById('dewAmount').value
        },
        responsibility: {
            accepted: document.getElementById('dailyResponsibilityCheckbox').checked,
            acceptedAt: new Date().toISOString()
        },
        metadata: {
            generated: new Date().toISOString(),
            version: "1.0"
        }
    };
    
    try {
        const { insertDailyData, validateStationPassword } = await import('./supabase.js');
        
        // التحقق من كلمة مرور المحطة
        const isValidPassword = await validateStationPassword(
            formData.station.code, 
            formData.authentication.password
        );
        
        if (!isValidPassword) {
            showDailyAlert('كلمة مرور المحطة غير صحيحة', 'danger');
            return;
        }
        
        // إرسال البيانات إلى Supabase
        const result = await insertDailyData(formData);
        
        // هنا يمكنك إضافة منطق الإرسال الفعلي للبيانات
        console.log('بيانات النموذج اليومي:', formData);
        console.log('نتيجة الإرسال:', result);
        
        // عرض رسالة نجاح
        showDailyAlert('تم إرسال البيانات اليومية بنجاح!', 'success');
        
    } catch (error) {
        console.error('Error sending daily data:', error);
        showDailyAlert('حدث خطأ أثناء الإرسال: ' + error.message, 'danger');
    }
}

// تحميل بيانات القسم اليومي
function downloadDailyData() {
    if (!validateAndSendDailyForm()) return;
    
    // جمع البيانات من النموذج (نفس البيانات في sendDailyData)
    const formData = {
        // ... نفس كائن formData الموجود في sendDailyData
    };
    
    // تحويل البيانات إلى JSON
    const jsonData = JSON.stringify(formData, null, 2);
    
    // إنشاء رابط تحميل
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_weather_data_${formData.station.code}_${formData.observation.date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showDailyAlert('تم تحميل البيانات اليومية بنجاح', 'success');
}

// إعادة تعيين النموذج اليومي
function resetDailyForm() {
    if (confirm('هل أنت متأكد من أنك تريد إعادة تعيين النموذج اليومي؟')) {
        document.getElementById('dailyStation').selectedIndex = 0;
        document.getElementById('dailyObservationDate').valueAsDate = new Date();
        document.getElementById('dailyObservationTime').selectedIndex = 0;
        document.getElementById('dailyObserver').value = '';
        document.getElementById('dailyStationPassword').value = '';
        
        // إعادة تعيين الحقول الأخرى
        const fieldsToReset = [
            'minTemp', 'maxTemp', 'precipitation', 'snowThickness',
            'evaporationRecord', 'evaporationLeach', 'actualSunshine',
            'totalSunshine', 'sunshinePercentage', 'gustSpeed',
            'gustDirection', 'gustTime', 'maxHumidity', 'maxHumidityTime',
            'minHumidity', 'minHumidityTime', 'dewAmount'
        ];
        
        fieldsToReset.forEach(field => {
            const element = document.getElementById(field);
            if (element) element.value = '';
        });
        
        // إعادة تعيين checkboxes
        const checkboxes = document.querySelectorAll('#daily-weather-elements input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        document.getElementById('dailyResponsibilityCheckbox').checked = false;
        
        // إعادة تعيين أخطاء التحقق
        resetAllDailyValidationErrors();
        
        showDailyAlert('تم إعادة تعيين النموذج اليومي بنجاح', 'info');
    }
}