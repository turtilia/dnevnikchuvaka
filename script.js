<script>
        const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzVhzhj2KJFysmrEWk_qLEHd6-EIIQpxCnh-zvDruWk7nsR7M9ESpl-L_W956uZDa8soQ/exec';

        let attachedPhotoBase64 = null;
        let videoStream = null;

        // --- 1. CLOCK ---
        function updateClock() {
            const now = new Date();
            let hours = String(now.getHours()).padStart(2, '0');
            let minutes = String(now.getMinutes()).padStart(2, '0');
            let seconds = String(now.getSeconds()).padStart(2, '0');
            
            const clockEl = document.getElementById('digital-clock');
            if (clockEl) clockEl.textContent = `${hours}:${minutes}:${seconds}`;

            const dateEl = document.getElementById('clock-date');
            if (dateEl) {
                const options = { weekday: 'short', day: 'numeric', month: 'short' };
                dateEl.textContent = now.toLocaleDateString('ru-RU', options).toUpperCase();
            }
        }

        updateClock();
        setInterval(updateClock, 1000);

        // --- 2. CAMERA AND PHOTO HANDLERS ---
        async function openCameraModal() {
            const modal = document.getElementById('camera-modal');
            const video = document.getElementById('camera-video');
            const placeholder = document.getElementById('camera-placeholder');
            const snapBtn = document.getElementById('snap-btn');

            modal.classList.remove('hidden');

            try {
                // Request back camera on mobile devices if available
                videoStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' } },
                    audio: false
                });
                video.srcObject = videoStream;
                video.classList.remove('hidden');
                placeholder.classList.add('hidden');
                snapBtn.disabled = false;
            } catch (err) {
                console.warn('Не удалось запустить веб-камеру напрямую:', err);
                video.classList.add('hidden');
                placeholder.classList.remove('hidden');
                snapBtn.disabled = true;
            }
        }

        function closeCameraModal() {
            const modal = document.getElementById('camera-modal');
            modal.classList.add('hidden');

            if (videoStream) {
                videoStream.getTracks().forEach(track => track.stop());
                videoStream = null;
            }
        }

        function takeSnapshot() {
            const video = document.getElementById('camera-video');
            const canvas = document.getElementById('camera-canvas');
            const ctx = canvas.getContext('2d');

            if (!video.videoWidth) return;

            // Resize photo to optimize memory and upload payload
            const maxDimension = 800;
            let width = video.videoWidth;
            let height = video.videoHeight;

            if (width > height && width > maxDimension) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
            } else if (height > maxDimension) {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(video, 0, 0, width, height);

            attachedPhotoBase64 = canvas.toDataURL('image/jpeg', 0.8);
            showPhotoPreview(attachedPhotoBase64);
            closeCameraModal();
            showToast('Фотография сделана!');
        }

        function triggerNativeCamera() {
            closeCameraModal();
            document.getElementById('camera-file-input').click();
        }

        function handleFileInputChange(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    const maxDimension = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height && width > maxDimension) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else if (height > maxDimension) {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    attachedPhotoBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    showPhotoPreview(attachedPhotoBase64);
                    showToast('Фото успешно загружено!');
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        function showPhotoPreview(base64) {
            const container = document.getElementById('photo-preview-container');
            const img = document.getElementById('photo-preview-img');
            img.src = base64;
            container.classList.remove('hidden');
        }

        function removeAttachedPhoto() {
            attachedPhotoBase64 = null;
            document.getElementById('photo-preview-container').classList.add('hidden');
            document.getElementById('photo-preview-img').src = '';
            document.getElementById('camera-file-input').value = '';
        }

        function viewEnlargedImage(src) {
            const modal = document.getElementById('image-view-modal');
            const img = document.getElementById('enlarged-image');
            img.src = src;
            modal.classList.remove('hidden');
        }

        function closeImageViewModal() {
            document.getElementById('image-view-modal').classList.add('hidden');
        }

        // --- 3. LOCAL STORAGE & HISTORY ---
        let logs = JSON.parse(localStorage.getItem('health_logs') || '[]');

        function saveLogsToStorage() {
            localStorage.setItem('health_logs', JSON.stringify(logs));
        }

        function renderHistory() {
            const historyList = document.getElementById('history-list');
            if (!historyList) return;
            
            if (logs.length === 0) {
                historyList.innerHTML = `<p id="empty-history" class="text-sm text-slate-400 text-center py-4">Сохраненные записи пока отсутствуют</p>`;
                return;
            }

            historyList.innerHTML = logs.map((item, index) => `
                <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2 text-sm">
                    <div class="flex items-center justify-between text-xs text-sky-400 border-b border-slate-800/80 pb-2">
                        <span class="font-semibold"><i class="fa-regular fa-clock mr-1"></i>${item.timestring}</span>
                        <button onclick="deleteLog(${index})" class="text-slate-500 hover:text-rose-400 transition">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="text-slate-300"><span class="text-slate-400">Сахар:</span> <b class="text-rose-300 font-semibold">${item.sugar} ммоль/л</b></div>
                        <div class="text-slate-300"><span class="text-slate-400">Инсулин:</span> <b class="text-sky-300 font-semibold">${item.insulin} ЕД</b></div>
                        ${item.food ? `<div class="text-slate-300"><span class="text-slate-400">ХЕ:</span> <b>${item.food}</b></div>` : ''}
                        ${item.activity ? `<div class="text-slate-300"><span class="text-slate-400">Активность:</span> <b>${item.activity}</b></div>` : ''}
                        ${item.location ? `<div class="text-slate-300"><span class="text-slate-400">Локация:</span> <b>${item.location}</b></div>` : ''}
                    </div>
                    ${item.photo ? `
                        <div class="mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-3">
                            <img src="${item.photo}" onclick="viewEnlargedImage('${item.photo}')" class="w-12 h-12 object-cover rounded-lg border border-slate-700 cursor-pointer hover:opacity-80 transition" title="Нажмите, чтобы увеличить">
                            <span class="text-[11px] text-slate-400">Нажмите на фото для просмотра</span>
                        </div>
                    ` : ''}
                    ${item.notes ? `<div class="text-xs text-slate-400 italic bg-slate-800/40 p-2 rounded-lg mt-1 border border-slate-800">${item.notes}</div>` : ''}
                </div>
            `).join('');
        }

        // --- 4. SAVE HANDLER ---
        async function handleSave(event) {
            event.preventDefault();

            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalBtnContent = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Сохранение...`;

            const sugar = document.getElementById('sugar').value;
            const insulin = document.getElementById('insulin').value;
            const food = document.getElementById('food').value;
            const activity = document.getElementById('activity').value;
            const location = document.getElementById('location').value;
            const notes = document.getElementById('notes').value;

            const now = new Date();
            const timestring = `${now.toLocaleDateString('ru-RU')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            const newEntry = {
                timestring,
                sugar,
                insulin,
                food,
                activity,
                location,
                notes,
                photo: attachedPhotoBase64 || ''
            };

            // Замените этот фрагмент в handleSave():
            try {
                if (GOOGLE_SCRIPT_URL) {
                    await fetch(GOOGLE_SCRIPT_URL, {
                        method: 'POST',
                        // Отправляем данные в формате JSON
                        body: JSON.stringify(newEntry)
                    });
                }
            
                // LocalStorage save
                logs.unshift(newEntry);
                saveLogsToStorage();
                renderHistory();
            
                resetForm();
                showToast('Данные успешно сохранены!');
            } catch (error) {
                console.error('Ошибка при отправке:', error);
                showToast('Ошибка отправки в таблицу');
            }

                // LocalStorage save
                logs.unshift(newEntry);
                saveLogsToStorage();
                renderHistory();

                resetForm();
                showToast('Данные успешно сохранены!');
            } catch (error) {
                console.error('Ошибка при отправке:', error);
                showToast('Ошибка отправки в таблицу');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnContent;
            }
        }

        function resetForm() {
            document.getElementById('health-form').reset();
            removeAttachedPhoto();
        }

        function deleteLog(index) {
            logs.splice(index, 1);
            saveLogsToStorage();
            renderHistory();
        }

        function clearHistory() {
            if (logs.length === 0) return;
            if (confirm('Удалить всю локальную историю?')) {
                logs = [];
                saveLogsToStorage();
                renderHistory();
            }
        }

        function showToast(msg) {
            const toast = document.getElementById('toast');
            if (!toast) return;
            document.getElementById('toast-message').textContent = msg;
            toast.classList.remove('hidden');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 3000);
        }

        renderHistory();
    </script>
