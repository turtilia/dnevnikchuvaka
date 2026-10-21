function showTime() {
	document.getElementById('currentTime').innerHTML = new Date().toUTCString();
}
showTime();
setInterval(function () {
	showTime();
}, 1000);


const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxeb3dnnRZBBXpV58H79Pg5IwNXWeDyq9NpL1dPgqkoWjl53pdGTTfccZrqNItV_hY/exec';

// --- 3. FORM HANDLERS ---
async function handleSave(event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalBtnContent = submitBtn.innerHTML;
    
    // Блокируем кнопку во время отправки
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Сохранение...`;

    const sugar = document.getElementById('sugar').value;
    const insulin = document.getElementById('insulin').value;
    const carbs = document.getElementById('carbs').value;
    const pressure = document.getElementById('pressure').value;
    const weight = document.getElementById('weight').value;
    const notes = document.getElementById('notes').value;

    const now = new Date();
    const timeString = `${now.toLocaleDateString('ru-RU')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newEntry = {
        time: timeString,
        sugar,
        insulin,
        carbs,
        pressure,
        weight,
        notes
    };

    try {
        // 1. Отправка данных в Google Таблицу
        if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== 'ВСТАВЬТЕ_СЮДА_ВАШ_URL_ИЗ_APPS_SCRIPT') {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Позволяет обойти CORS ограничения Google Apps Script
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newEntry)
            });
        }

        // 2. Сохранение локально в браузер (как и раньше)
        logs.unshift(newEntry);
        saveLogsToStorage();
        renderHistory();

        // 3. Очистка формы и уведомление
        resetForm();
        showToast('Данные сохранены в таблицу и историю!');
    } catch (error) {
        console.error('Ошибка при отправке:', error);
        showToast('Ошибка отправки в Google Таблицу');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
    }
}
