// static/js/base.js

// 페이지가 완전히 로드된 후에 모든 기능이 초기화되도록 보장합니다
document.addEventListener('DOMContentLoaded', function () {
    // 필요한 모든 DOM 요소들을 한 번에 선택하여 변수에 저장합니다
    // 이는 성능을 최적화하고 코드의 가독성을 높입니다
    const qrTrigger = document.getElementById('qrCodeTrigger'); // QR 코드를 감싸는 컨테이너
    const qrImage = document.getElementById('qrCodeImage');     // QR 코드 이미지
    const modal = document.getElementById('qrModal');           // 모달 컨테이너
    const modalContent = modal.querySelector('.modal-content'); // 모달 내용
    const modalQr = document.getElementById('modalQrCode');     // 모달 내 QR 코드
    const closeBtn = document.getElementById('closeModal');     // 닫기 버튼
    const downloadBtn = document.getElementById('downloadQr');  // 다운로드 버튼

    // QR 코드 이미지의 확대/축소 상태를 추적하는 변수입니다
    let isZoomed = false;

    // 모달을 여는 함수입니다
    // 트랜지션을 사용하여 부드러운 애니메이션 효과를 제공합니다
    function showModal(e) {
        e.preventDefault();
        e.stopPropagation();

        // 디버깅을 위한 로그
        console.log('Opening modal');

        // 먼저 모달을 화면에 표시합니다
        modal.style.display = 'flex';

        // 다음 프레임에서 트랜지션을 적용합니다
        // 이렇게 하면 부드러운 페이드인 효과가 적용됩니다
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
            modalContent.style.transform = 'translateY(0)';
        });
    }

    // 모달을 닫는 함수입니다
    // 애니메이션 완료 후에 모달을 실제로 숨깁니다
    function hideModal() {
        console.log('Closing modal');

        // 페이드 아웃 애니메이션을 시작합니다
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        modalContent.style.transform = 'translateY(10px)';

        // 애니메이션이 완료된 후 모달을 완전히 숨기고 상태를 초기화합니다
        setTimeout(() => {
            modal.style.display = 'none';
            modalQr.style.transform = 'scale(1)';
            isZoomed = false;
        }, 200); // CSS 트랜지션 시간과 일치
    }

    // QR 코드 이미지의 확대/축소를 토글하는 함수입니다
    function toggleZoom(e) {
        e.stopPropagation();
        isZoomed = !isZoomed;
        modalQr.style.transform = isZoomed ? 'scale(2)' : 'scale(1)';
    }

    // QR 코드 이미지를 다운로드하는 함수입니다
    function handleDownload() {
        // 임시 링크를 생성하여 다운로드를 트리거합니다
        const link = document.createElement('a');
        link.href = modalQr.src;
        link.download = 'qr-code.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 모든 필요한 이벤트 리스너들을 설정합니다
    if (qrTrigger) {
        qrTrigger.addEventListener('click', showModal);
        console.log('Added click listener to QR container');
    }

    if (qrImage) {
        qrImage.addEventListener('click', showModal);
        console.log('Added click listener to QR image');
    }

    // 모달 내부의 각 기능에 대한 이벤트 리스너들을 설정합니다
    modalQr.addEventListener('click', toggleZoom);
    closeBtn.addEventListener('click', hideModal);
    downloadBtn.addEventListener('click', handleDownload);

    // 모달 외부를 클릭하면 모달이 닫히도록 합니다
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    // ESC 키를 누르면 모달이 닫히도록 합니다
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            hideModal();
        }
    });

    // 스크립트가 성공적으로 초기화되었음을 콘솔에 기록합니다
    console.log('Script initialized successfully');
});