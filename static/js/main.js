// static/js/main.js

document.addEventListener('DOMContentLoaded', function () {
    // 필요한 DOM 요소들을 먼저 선택합니다
    const mlModelToggle = document.getElementById('mlModelToggle');
    const modelList = document.getElementById('modelList');
    const arrow = mlModelToggle.querySelector('.arrow');
    const tabCards = document.querySelectorAll('.tab-card');
    const contentSections = document.querySelectorAll('.content-section');

    // 사이드바 토글 기능 구현
    mlModelToggle.addEventListener('click', function () {
        // 현재 상태를 확인합니다
        const isHidden = !modelList.classList.contains('show');

        // 애니메이션을 부드럽게 처리하기 위해 클래스를 토글합니다
        modelList.classList.toggle('show');

        // 화살표 방향을 업데이트합니다
        arrow.textContent = isHidden ? '▲' : '▼';

        // 접근성을 위해 aria-expanded 속성을 업데이트합니다
        mlModelToggle.setAttribute('aria-expanded', isHidden);
    });

    // 탭 전환 기능 구현
    tabCards.forEach(card => {
        card.addEventListener('click', function () {
            // 먼저 모든 탭과 컨텐츠의 활성 상태를 제거합니다
            tabCards.forEach(tab => tab.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));

            // 클릭된 탭을 활성화합니다
            this.classList.add('active');

            // 연결된 컨텐츠를 찾아 활성화합니다
            const targetId = this.dataset.content;
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // 초기 탭 활성화
    const firstTab = tabCards[0];
    if (firstTab) {
        firstTab.click();
    }
});