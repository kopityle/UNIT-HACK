import { playSound } from '../utils/audio.js';
// Task 6: Stop DDoS Attack
export function setupStopDdosAttackTask({ gameAreaElement, taskTitleElement, completeTask, gameState, updateScore, playSound: playSoundFromGame }) {
    taskTitleElement.textContent = 'Отбей DDOS-атаку! Уничтожь вредоносные пакеты (красные)';

    // Create server in the center
    const serverContainer = document.createElement('div');
    serverContainer.className = 'server-icon';
    serverContainer.style.width = '100px';
    serverContainer.style.height = '120px';
    serverContainer.style.position = 'absolute';
    serverContainer.style.left = '50%';
    serverContainer.style.top = '50%';
    serverContainer.style.transform = 'translate(-50%, -50%)';

    gameAreaElement.appendChild(serverContainer);

    // Track packets
    const packets = [];
    let packetCount = 0;
    let badPacketsDestroyed = 0;
    let goodPacketsDestroyed = 0;
    let targetScore = 10; // Need to destroy 10 bad packets

    // Spawn packets periodically
    const spawnInterval = setInterval(() => {
        spawnPacket();
    }, 800);

    function spawnPacket() {
        if (!gameState.isPlaying) {
            clearInterval(spawnInterval);
            return;
        }

        // Create a packet
        const packet = document.createElement('div');
        packet.className = 'packet';
        packetCount++;

        // Decide if it's good or bad (70% chance of bad)
        const isBad = Math.random() < 0.7;
        if (!isBad) {
            packet.classList.add('good');
        }

        // Random starting position (from edges)
        const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        const gameRect = gameAreaElement.getBoundingClientRect();

        let x, y;
        switch (edge) {
            case 0: // top
                x = Math.random() * gameRect.width;
                y = 0;
                break;
            case 1: // right
                x = gameRect.width - 40;
                y = Math.random() * gameRect.height;
                break;
            case 2: // bottom
                x = Math.random() * gameRect.width;
                y = gameRect.height - 40;
                break;
            case 3: // left
                x = 0;
                y = Math.random() * gameRect.height;
                break;
        }

        packet.style.left = `${x}px`;
        packet.style.top = `${y}px`;

        gameAreaElement.appendChild(packet);

        // Add to tracking
        packets.push({
            element: packet,
            isBad: isBad,
            x: x,
            y: y,
            speed: Math.random() * 1 + 1 // Random speed between 1-2
        });

        // Add click handler
        packet.addEventListener('click', function() {
            // Remove the packet
            const index = packets.findIndex(p => p.element === this);
            if (index > -1) {
                const isPacketBad = packets[index].isBad;

                if (isPacketBad) {
                    badPacketsDestroyed++;
                    this.style.transform = 'scale(1.5)';
                    this.style.opacity = '0';
                    setTimeout(() => {
                        destroyPacket(this);
                        packets.splice(index, 1);
                    }, 200);
                    playSoundFromGame('success');
                } else {
                    goodPacketsDestroyed++;
                    this.style.backgroundColor = 'var(--error-color)';
                    setTimeout(() => {
                        destroyPacket(this);
                        packets.splice(index, 1);
                    }, 200);
                    playSound('error');
                    // Penalty for destroying good packets
                    gameState.score = Math.max(0, gameState.score - 20);
                    updateScore();
                }

                // Check if target reached
                if (badPacketsDestroyed >= targetScore) {
                    clearInterval(spawnInterval);
                    clearInterval(moveInterval);

                    // Remove all packets
                    packets.forEach(packet => {
                        destroyPacket(packet.element);
                    });
                    packets.length = 0;

                    completeTask(true, Math.floor(gameState.timeLeft / 15));
                }
            }
        });
    }

    // Move packets
    const moveInterval = setInterval(() => {
        movePackets();
    }, 30);

    function movePackets() {
        if (!gameState.isPlaying) {
            clearInterval(moveInterval);
            return;
        }

        const serverRect = serverContainer.getBoundingClientRect();
        const gameRect = gameAreaElement.getBoundingClientRect();

        const serverCenterX = serverRect.left + serverRect.width / 2 - gameRect.left;
        const serverCenterY = serverRect.top + serverRect.height / 2 - gameRect.top;

        // Move each packet towards the server
        for (let i = packets.length - 1; i >= 0; i--) {
            const packet = packets[i];

            // Calculate direction towards server
            const dx = serverCenterX - (packet.x + 20);
            const dy = serverCenterY - (packet.y + 20);
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Normalize and apply speed
            if (distance > 0) {
                packet.x += (dx / distance) * packet.speed;
                packet.y += (dy / distance) * packet.speed;

                packet.element.style.left = `${packet.x}px`;
                packet.element.style.top = `${packet.y}px`;
            }

            // Check if packet reached the server (within 30px)
            if (distance < 30) {
                // Remove the packet
                destroyPacket(packet.element);
                packets.splice(i, 1);

                // Penalty if bad packet reaches server
                if (packet.isBad) {
                    gameState.score = Math.max(0, gameState.score - 30);
                    updateScore();

                    // Visual feedback
                    serverContainer.style.backgroundColor = 'var(--error-color)';
                    setTimeout(() => {
                        serverContainer.style.backgroundColor = '';
                    }, 200);

                    playSound('error');
                }
            }
        }
    }

    function destroyPacket(packet) {
        // Проверяем, существует ли элемент и является ли он дочерним элементом gameAreaElement
        if (packet && packet.parentNode === gameAreaElement) {
            gameAreaElement.removeChild(packet);
        }
    }

    function stopGame() {
        // Очистка всех пакетов
        packets.forEach(packet => {
            destroyPacket(packet.element);
        });
        packets.length = 0; // Очищаем массив пакетов

        // Остановка интервала создания пакетов
        if (spawnInterval) {
            clearInterval(spawnInterval);
        }
    }
}