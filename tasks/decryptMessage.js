import { playSound } from '../utils/audio.js';

export function setupDecryptMessageTask({ gameAreaElement, taskTitleElement, completeTask, gameState, updateScore, playSound: playSoundFromGame }) {
    taskTitleElement.textContent = 'Расшифруй сообщение';

    // Сообщения с шифрованием и вариантами ответов
    const messages = [
        {
            encrypted: "тболу - рёуёсвфсд", // Шифруем "санкт - петербр" сдвигом +1
            options: ["сатир - плохое", "сдвиг - плавильня", "санкт - петербр", "сауис - плохой"],
            correctIndex: 2,
            hint: "Шифр Цезаря: каждая буква слова (не шифра!) смещена на 1 вперед по алфавиту. (А->Б)"
        },
        {
            encrypted: "йнмстп - ктцчзи", // Шифруем "контур - лучший" сдвигом -1
            options: ["контур - лучший", "лпнфус - дшъщкй", "мрохут - нцдылн", "контур - худший"],
            correctIndex: 0,
            hint: "Шифр Цезаря: каждая буква слова (не шифра!) смещена на 1 назад по алфавиту. (Б->А)"
        },
        {
            encrypted: "ииголонхет рутнок", // "контур технологии" наоборот
            options: ["умные технологии", "новые разработки", "контур технологии", "цифровые решения"],
            correctIndex: 2,
            hint: "Сообщение просто прочитано задом наперед!"
        },
        {
            encrypted: "щкуфэл мрё", // Шифруем "чистый код" сдвигом +2
            options: ["медленный кэш", "чистый код", "большой файл", "опасный баг"],
            correctIndex: 1,
            hint: "Шифр Цезаря: каждая буква слова (не шифра!) смещена на 2 вперед по алфавиту. (А->В)"
        },
        {
            encrypted: "мяйюим вюллщу", // Шифруем "облако данных" сдвигом -2
            options: ["память сервера", "быстрые сети", "старые диски", "облако данных"],
            correctIndex: 3,
            hint: "Шифр Цезаря: каждая буква слова (не шифра!) смещена на 2 назад по алфавиту. (В->А)"
        },
        {
            encrypted: "хыннад азаб", // "база данных" наоборот
            options: ["таблица строк", "ключи индексы", "база данных", "файлы логов"],
            correctIndex: 2,
            hint: "Сообщение прочитано задом наперед!"
        },
        {
            encrypted: "дюфхуюм фзуезу", // Шифруем "быстрый сервер" сдвигом +3
            options: ["быстрый сервер", "медленный клиент", "тяжёлый код", "надёжный диск"],
            correctIndex: 0,
            hint: "Шифр Цезаря: каждая буква слова (не шифра!) смещена на 3 вперед по алфавиту. (А->Г)"
        },
        {
            encrypted: "17 10 20 16 15", 
            options: ["пиано", "пират", "пинок", "питон"],
            correctIndex: 3,
            hint: "Каждой букве соответствует число по алфавитному порядку"
        },
        {
            encrypted: "нидо ьлон ырфиц", // "цифры ноль один" наоборот
            options: ["данные бит код", "цифры ноль один", "биты ноль два", "коды один ноль"],
            correctIndex: 1,
            hint: "Сообщение прочитано задом наперед!"
        },
        {
            encrypted: "23 1 12 1 20 16 15", 
            options: ["халат", "хакер", "хакатон", "химия"],
            correctIndex: 2,
            hint: "Каждой букве соответствует число по алфавитному порядку"
        }
    ];


    // Select a random message
    const messageIndex = Math.floor(Math.random() * messages.length);
    const message = messages[messageIndex];

    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.style.display = 'flex';
    messageContainer.style.flexDirection = 'column';
    messageContainer.style.alignItems = 'center';
    messageContainer.style.gap = '30px';

    // Отобразить подсказку
    const hintElement = document.createElement('p');
    hintElement.className = 'task-hint';
    hintElement.textContent = `Подсказка: ${message.hint}`;
    messageContainer.appendChild(hintElement);

    // Create encrypted message
    const encryptedElement = document.createElement('div');
    encryptedElement.className = 'code-snippet';
    encryptedElement.style.fontSize = '1.5rem';
    encryptedElement.style.padding = '20px 30px';
    encryptedElement.textContent = message.encrypted;

    messageContainer.appendChild(encryptedElement);

    // Create options
    const optionsContainer = document.createElement('div');
    optionsContainer.style.display = 'flex';
    optionsContainer.style.flexDirection = 'column';
    optionsContainer.style.gap = '15px';

    const choiceButtons = [];

    message.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = option;
        button.style.width = '300px';

        button.addEventListener('click', () => {
            if (index === message.correctIndex) {
                button.style.backgroundColor = 'var(--success-color)';
                playSoundFromGame('success');
                completeTask(true, Math.floor(gameState.timeLeft / 10));
            } else {
                button.style.backgroundColor = 'var(--error-color)';
                playSoundFromGame('error');
                completeTask(false);
            }
        });

        optionsContainer.appendChild(button);
        choiceButtons.push(button);
    });

    messageContainer.appendChild(optionsContainer);
    gameAreaElement.appendChild(messageContainer);
}