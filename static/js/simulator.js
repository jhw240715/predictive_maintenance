document.addEventListener('DOMContentLoaded', function () {
    // 요소 선택
    const qrCodeImage = document.getElementById('qrCodeImage');
    const qrModal = document.getElementById('qrModal');
    const closeModal = document.getElementById('closeModal');
    const modalQrCode = document.getElementById('modalQrCode');
    const downloadQr = document.getElementById('downloadQr');
    const parameterForm = document.getElementById('parameter-form');
    const resultDiv = document.getElementById('prediction-result');

    let isZoomed = false;

    // QR 코드 모달 관련
    qrCodeImage.addEventListener('click', () => {
        qrModal.classList.remove('hidden');
    });

    closeModal.addEventListener('click', () => {
        qrModal.classList.add('hidden');
        modalQrCode.style.transform = 'scale(1)';
        isZoomed = false;
    });

    modalQrCode.addEventListener('click', () => {
        isZoomed = !isZoomed;
        modalQrCode.style.transform = isZoomed ? 'scale(2)' : 'scale(1)';
    });

    downloadQr.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = modalQrCode.src;
        link.download = 'qr-code.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) {
            qrModal.classList.add('hidden');
            modalQrCode.style.transform = 'scale(1)';
            isZoomed = false;
        }
    });

    // 파라미터 입력 폼 제출
    parameterForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);

        try {
            const response = await fetch('/simulator/predict/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            });

            const data = await response.json();

            if (data.status === 'success') {
                resultDiv.classList.remove('hidden');
                document.getElementById('prediction-text').textContent = data.prediction;
                document.getElementById('prediction-probability').textContent =
                    `${(data.probability * 100).toFixed(2)}%`;

                // 현재 시간 표시
                const now = new Date();
                document.getElementById('prediction-timestamp').textContent =
                    now.toLocaleString();

                // 3D 모델 상태 업데이트 (simulator3D.js에 구현 필요)
                if (typeof updateMachineState === 'function') {
                    updateMachineState(data.prediction);
                }
            } else {
                alert('예측 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('서버 오류가 발생했습니다.');
        }
    });

    // 입력값 유효성 검사
    const inputs = parameterForm.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            const min = parseFloat(e.target.min);
            const max = parseFloat(e.target.max);

            if (value < min) e.target.value = min;
            if (value > max) e.target.value = max;
        });
    });

    // 온도 입력값 검증
    const airTempInput = document.querySelector('input[name="air_temperature"]');
    const processTempInput = document.querySelector('input[name="process_temperature"]');

    function validateTemperatures() {
        const airTemp = parseFloat(airTempInput.value);
        const processTemp = parseFloat(processTempInput.value);

        if (airTemp && processTemp && airTemp >= processTemp) {
            processTempInput.setCustomValidity('공정 온도는 공기 온도보다 높아야 합니다.');
        } else {
            processTempInput.setCustomValidity('');
        }
    }

    airTempInput.addEventListener('input', validateTemperatures);
    processTempInput.addEventListener('input', validateTemperatures);
});