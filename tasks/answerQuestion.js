import { playSound } from '../utils/audio.js';

export function setupAnswerQuestionTask({ gameAreaElement, taskTitleElement, completeTask, gameState, updateScore, playSound: playSoundFromGame }) {
    taskTitleElement.textContent = 'Ответь на вопрос';

    // Вопросы с вариантами ответов
    const questions = [
        {
            question: "Как называется язык программирования, созданный первым?",
            options: ["Fortran", "Python", "Java", "C++"],
            correctIndex: 0,
            hint: "Этот язык появился в 1950-х годах для научных вычислений."
        },
        {
            question: "Что такое HTML?",
            options: ["Язык программирования", "Язык разметки", "База данных", "Система управления"],
            correctIndex: 1,
            hint: "Используется для создания структуры веб-страниц."
        },
        {
            question: "Какой протокол используется для безопасной передачи данных в интернете?",
            options: ["FTP", "HTTP", "HTTPS", "SMTP"],
            correctIndex: 2,
            hint: "Это защищённая версия HTTP с шифрованием."
        },
        {
            question: "Что такое Git?",
            options: ["Текстовый редактор", "Система контроля версий", "Компилятор", "Браузер"],
            correctIndex: 1,
            hint: "Используется для управления изменениями в коде."
        },
        {
            question: "Как называется структура данных, работающая по принципу 'последним пришёл — первым ушёл'?",
            options: ["Очередь", "Стек", "Массив", "Граф"],
            correctIndex: 1,
            hint: "Похожа на стопку тарелок."
        },
        {
            question: "Какой порт обычно используется для HTTP?",
            options: ["21", "80", "443", "8080"],
            correctIndex: 1,
            hint: "Это стандартный порт для незащищённых веб-соединений."
        },
        {
            question: "Что такое SQL?",
            options: ["Язык запросов к базам данных", "Язык программирования", "Протокол связи", "Формат файлов"],
            correctIndex: 0,
            hint: "Используется для работы с реляционными базами данных."
        },
        {
            question: "Как называется процесс поиска и исправления ошибок в коде?",
            options: ["Компиляция", "Тестирование", "Отладка", "Деплой"],
            correctIndex: 2,
            hint: "Это как поиск багов в программе."
        },
        {
            question: "Что такое API?",
            options: ["Программа для дизайна", "Интерфейс для обмена данными", "Операционная система", "Антивирус"],
            correctIndex: 1,
            hint: "Позволяет приложениям общаться друг с другом."
        },
        {
            question: "Какой термин обозначает программное обеспечение с открытым исходным кодом?",
            options: ["Проприетарное", "Open Source", "Облачное", "Встроенное"],
            correctIndex: 1,
            hint: "Код такого ПО доступен для всех."
        }
    ];

    // Выбрать случайный вопрос
    const questionIndex = Math.floor(Math.random() * questions.length);
    const question = questions[questionIndex];

    // Создать контейнер для вопроса
    const questionContainer = document.createElement('div');
    questionContainer.style.display = 'flex';
    questionContainer.style.flexDirection = 'column';
    questionContainer.style.alignItems = 'center';
    questionContainer.style.gap = '30px';

    // Отобразить подсказку
    const hintElement = document.createElement('p');
    hintElement.className = 'task-hint';
    hintElement.textContent = `Подсказка: ${question.hint}`;
    questionContainer.appendChild(hintElement);

    // Создать текст вопроса
    const questionElement = document.createElement('div');
    questionElement.className = 'question-text';
    questionElement.style.fontSize = '1.5rem';
    questionElement.style.padding = '20px 30px';
    questionElement.style.textAlign = 'center';
    questionElement.textContent = question.question;
    questionContainer.appendChild(questionElement);

    // Создать варианты ответа
    const optionsContainer = document.createElement('div');
    optionsContainer.style.display = 'flex';
    optionsContainer.style.flexDirection = 'column';
    optionsContainer.style.gap = '15px';

    const choiceButtons = [];

    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = option;
        button.style.width = '300px';

        button.addEventListener('click', () => {
            if (index === question.correctIndex) {
                button.style.backgroundColor = 'var(--success-color)';
                playSoundFromGame('success');
                choiceButtons.forEach(btn => btn.disabled = true); // Отключить кнопки только при правильном ответе
                completeTask(true, Math.floor(gameState.timeLeft / 10));
            } else {
                button.style.backgroundColor = 'var(--error-color)';
                button.disabled = true; // Отключить только выбранную кнопку
                playSoundFromGame('error');
                // Не вызываем completeTask, чтобы продолжить выбор
            }
        });

        optionsContainer.appendChild(button);
        choiceButtons.push(button);
    });

    questionContainer.appendChild(optionsContainer);
    gameAreaElement.appendChild(questionContainer);
}