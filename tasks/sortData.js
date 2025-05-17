import { playSound } from '../utils/audio.js';

export function setupSortDataTask({ gameAreaElement, taskTitleElement, completeTask, gameState, updateScore, playSound: playSoundFromGame }) {
    taskTitleElement.textContent = 'Отсортируй данные по возрастанию';

    // Создание контейнера для сортировки
    const sortContainer = document.createElement('div');
    sortContainer.className = 'sortable-container';

    // Генерация случайных чисел
    const numItems = Math.floor(Math.random() * 3) + 4; // 4-6 элементов
    const numbers = Array.from({ length: numItems }, () => Math.floor(Math.random() * 100));
    numbers.sort(() => Math.random() - 0.5); // Перемешивание

    // Создание элементов для сортировки
    const items = numbers.map(num => {
        const item = document.createElement('div');
        item.className = 'sortable-item';
        item.textContent = num;
        sortContainer.appendChild(item);
        return item;
    });

    gameAreaElement.appendChild(sortContainer);

    let draggedItem = null;
    let startX, startY;

    // Обработка начала перетаскивания
    function startDrag(e) {
        if (!gameState.isPlaying) return;
        e.preventDefault();
        draggedItem = e.currentTarget;
        draggedItem.classList.add('dragging');

        const touch = e.type === 'touchstart' ? e.touches[0] : e;
        startX = touch.clientX;
        startY = touch.clientY;

        playSoundFromGame('click');
    }

    // Обработка движения
    function dragMove(e) {
        if (!draggedItem) return;
        e.preventDefault();

        const touch = e.type === 'touchmove' ? e.touches[0] : e;
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;

        draggedItem.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        draggedItem.style.zIndex = '1000';

        // Определяем, над каким элементом находится перетаскиваемый
        const target = findDropTarget(touch.clientX, touch.clientY);
        if (target && target !== draggedItem) {
            const allItems = [...sortContainer.querySelectorAll('.sortable-item')];
            const draggedIndex = allItems.indexOf(draggedItem);
            const targetIndex = allItems.indexOf(target);

            if (draggedIndex < targetIndex) {
                sortContainer.insertBefore(draggedItem, target.nextSibling);
            } else {
                sortContainer.insertBefore(draggedItem, target);
            }
        }
    }

    // Обработка окончания перетаскивания
    function endDrag(e) {
        if (!draggedItem) return;
        e.preventDefault();

        draggedItem.style.transform = '';
        draggedItem.style.zIndex = '';
        draggedItem.classList.remove('dragging');
        draggedItem = null;

        playSoundFromGame('click');
        checkSorting();
    }

    // Поиск цели для сброса
    function findDropTarget(x, y) {
        const allItems = [...sortContainer.querySelectorAll('.sortable-item')];
        return allItems.find(item => {
            if (item === draggedItem) return false;
            const rect = item.getBoundingClientRect();
            return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        });
    }

    // Проверка сортировки
    function checkSorting() {
        const items = [...sortContainer.querySelectorAll('.sortable-item')];
        const currentValues = items.map(item => parseInt(item.textContent));
        let isSorted = true;
        for (let i = 1; i < currentValues.length; i++) {
            if (currentValues[i] < currentValues[i - 1]) {
                isSorted = false;
                break;
            }
        }

        if (isSorted) {
            items.forEach(item => {
                item.style.backgroundColor = 'var(--success-color)';
                item.style.color = 'white';
                item.removeEventListener('mousedown', startDrag);
                item.removeEventListener('touchstart', startDrag);
            });
            document.removeEventListener('mousemove', dragMove);
            document.removeEventListener('touchmove', dragMove);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchend', endDrag);
            setTimeout(() => {
                completeTask(true, Math.floor(gameState.timeLeft / 10));
            }, 500);
        }
    }

    // Добавление обработчиков событий
    items.forEach(item => {
        item.addEventListener('mousedown', startDrag);
        item.addEventListener('touchstart', startDrag, { passive: false });
    });

    document.addEventListener('mousemove', dragMove);
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    // Добавление стилей для перетаскивания
    const style = document.createElement('style');
    style.textContent = `
        .sortable-item.dragging {
            opacity: 0.7;
            box-shadow: 0 0 10px var(--accent-blue);
            cursor: grabbing;
        }
    `;
    document.head.appendChild(style);
}