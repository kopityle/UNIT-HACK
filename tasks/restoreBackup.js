import { playSound } from '../utils/audio.js';

export function setupRestoreBackupTask({ gameAreaElement, taskTitleElement, completeTask, gameState, updateScore, playSound: playSoundFromGame }) {
    taskTitleElement.textContent = 'Срочно! Сервер упал. Что нужно делать?!';

    const backupContainer = document.createElement('div');
    backupContainer.className = 'backup-container';

    const fileIcon = document.createElement('div');
    fileIcon.className = 'file-icon damaged'; // Добавим класс для стилизации "повреждения"
    fileIcon.innerHTML = '<span style="font-size: 2rem;">⚠️</span>'; // Иконка повреждения
    backupContainer.appendChild(fileIcon);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const backupOptions = [
        { text: "Бэкап (вчера, 23:00, стабильный)", correct: true, hint: "Последний целый бэкап" },
        { text: "Бэкап (сегодня, 02:00, поврежден!)", correct: false, hint: "Этот бэкап поврежден" },
        { text: "Точка восстановления Windows (конфликт ПО)", correct: false, hint: "Это для ОС, а не для данных сервера" },
        { text: "Форматировать диск C:", correct: false, hint: "Точно не это!"}
    ];

    // Перемешаем варианты для большей случайности, но сохраним один правильный
    let correctBackup = backupOptions.find(opt => opt.correct);
    let wrongBackups = backupOptions.filter(opt => !opt.correct);
    
    // Перемешиваем неправильные варианты
    wrongBackups.sort(() => Math.random() - 0.5);

    // Собираем финальный набор из 3 кнопок: 1 правильная, 2 неправильные
    const finalButtonOptions = [correctBackup, wrongBackups[0], wrongBackups[1]];
    // Еще раз перемешиваем финальный набор
    finalButtonOptions.sort(() => Math.random() - 0.5);

    finalButtonOptions.forEach(option => {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = option.text;

        button.addEventListener('click', () => {
            if (option.correct) {
                button.style.backgroundColor = 'var(--success-color)';
                fileIcon.style.boxShadow = '0 0 15px var(--success-color)';
                fileIcon.classList.remove('damaged');
                fileIcon.classList.add('restored');
                fileIcon.querySelector('span').textContent = '✓';
                playSoundFromGame('success');
                completeTask(true, Math.floor(gameState.timeLeft / 10));
            } else {
                button.style.backgroundColor = 'var(--error-color)';
                playSoundFromGame('error');
                completeTask(false);
            }
        });
        buttonContainer.appendChild(button);
    });

    backupContainer.appendChild(buttonContainer);
    gameAreaElement.appendChild(backupContainer);
} 