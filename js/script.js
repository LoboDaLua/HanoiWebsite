document.addEventListener('DOMContentLoaded', () => {
    const menu = document.getElementById('menu');
    const hanoiBtn = document.getElementById('hanoi-btn');
    const synthBtn = document.getElementById('synth-btn');
    const fullscreenContainer = document.getElementById('fullscreen-container');
    const backBtn = document.getElementById('back-btn');
    const iframe = document.getElementById('fullscreen-iframe');

    hanoiBtn.addEventListener('click', () => {
        showFullscreen('Hanoi/index.html');
    });

    synthBtn.addEventListener('click', () => {
        showFullscreen('synth/index.html');
    });

    backBtn.addEventListener('click', () => {
        hideFullscreen();
    });

    function showFullscreen(url) {
        menu.classList.add('hidden');
        iframe.src = url;
        fullscreenContainer.classList.remove('hidden');
    }

    function hideFullscreen() {
        fullscreenContainer.classList.add('hidden');
        iframe.src = '';
        menu.classList.remove('hidden');
    }
});