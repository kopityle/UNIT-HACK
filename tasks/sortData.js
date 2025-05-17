import { playSound } from '../utils/audio.js';

export function setupSortDataTask({ gameAreaElement, taskTitleElement, completeTask, gameState, updateScore, playSound: playSoundFromGame }) {
    taskTitleElement.textContent = 'Отсортируй данные по возрастанию';

    // Create sorting container
    const sortContainer = document.createElement('div');
    sortContainer.className = 'sortable-container';

    // Generate random numbers to sort
    const numItems = Math.floor(Math.random() * 3) + 4; // 4-6 items
    const numbers = [];

    for (let i = 0; i < numItems; i++) {
        numbers.push(Math.floor(Math.random() * 100));
    }

    // Shuffle the numbers
    numbers.sort(() => Math.random() - 0.5);

    // Create sortable items
    numbers.forEach(num => {
        const item = document.createElement('div');
        item.className = 'sortable-item';
        item.textContent = num;
        item.draggable = true;

        // Add drag events
        item.addEventListener('dragstart', dragStart);
        item.addEventListener('dragover', dragOver);
        item.addEventListener('dragenter', dragEnter);
        item.addEventListener('dragleave', dragLeave);
        item.addEventListener('drop', drop);
        item.addEventListener('dragend', dragEnd);

        sortContainer.appendChild(item);
    });

    gameAreaElement.appendChild(sortContainer);

    // Drag and drop functionality
    let draggedItem = null;

    function dragStart() {
        draggedItem = this;
        setTimeout(() => this.classList.add('dragging'), 0);
        playSoundFromGame('click');
    }

    function dragOver(e) {
        e.preventDefault();
    }

    function dragEnter(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    }

    function dragLeave() {
        this.classList.remove('drag-over');
    }

    function drop() {
        this.classList.remove('drag-over');

        // Get the index of both items
        const allItems = [...sortContainer.querySelectorAll('.sortable-item')];
        const draggedIndex = allItems.indexOf(draggedItem);
        const dropTargetIndex = allItems.indexOf(this);

        // Swap the items
        if (draggedIndex < dropTargetIndex) {
            sortContainer.insertBefore(draggedItem, this.nextSibling);
        } else {
            sortContainer.insertBefore(draggedItem, this);
        }

        // Check if items are sorted
        checkSorting();
    }

    function dragEnd() {
        this.classList.remove('dragging');
    }

    function checkSorting() {
        const items = [...sortContainer.querySelectorAll('.sortable-item')];
        const currentValues = items.map(item => parseInt(item.textContent));

        // Check if sorted in ascending order
        let isSorted = true;
        for (let i = 1; i < currentValues.length; i++) {
            if (currentValues[i] < currentValues[i - 1]) {
                isSorted = false;
                break;
            }
        }

        if (isSorted) {
            // Remove event listeners
            items.forEach(item => {
                item.removeEventListener('dragstart', dragStart);
                item.removeEventListener('dragover', dragOver);
                item.removeEventListener('dragenter', dragEnter);
                item.removeEventListener('dragleave', dragLeave);
                item.removeEventListener('drop', drop);
                item.removeEventListener('dragend', dragEnd);

                item.style.backgroundColor = 'var(--success-color)';
                item.style.color = 'white';
            });

            setTimeout(() => {
                completeTask(true, Math.floor(gameState.timeLeft / 10));
            }, 500);
        }
    }
}