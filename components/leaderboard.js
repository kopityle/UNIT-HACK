import { getTopScores, submitScore } from '../utils/supabase.js'

export class Leaderboard {
    constructor(container) {
        this.container = container
        this.scores = []
        this.createLeaderboardUI()
    }

    createLeaderboardUI() {
        this.element = document.createElement('div')
        this.element.className = 'leaderboard'
        this.element.innerHTML = `
            <h3>Таблица лидеров</h3>
            <div class="leaderboard-table">
                <div class="leaderboard-header">
                    <div class="rank">Место</div>
                    <div class="name">Имя</div>
                    <div class="score">Очки</div>
                </div>
                <div class="leaderboard-entries"></div>
            </div>
        `
        this.entriesContainer = this.element.querySelector('.leaderboard-entries')
        this.container.appendChild(this.element)
    }

    async refresh() {
        this.scores = await getTopScores()
        this.render()
    }

    render() {
        this.entriesContainer.innerHTML = this.scores
            .map((score, index) => `
                <div class="leaderboard-entry">
                    <div class="rank">${index + 1}</div>
                    <div class="name">${score.display_name || 'Аноним'}</div>
                    <div class="score">${score.score}</div>
                </div>
            `)
            .join('')
    }

    async submitNewScore(score) {
        // Create name input dialog
        const nameDialog = document.createElement('div')
        nameDialog.className = 'name-dialog'
        nameDialog.innerHTML = `
            <div class="name-dialog-content">
                <h4>Новый рекорд: ${score} очков!</h4>
                <input type="text" id="nameInput" placeholder="Введите ваше имя" maxlength="20">
                <button class="btn" id="saveScoreBtn">Сохранить</button>
            </div>
        `
        
        document.body.appendChild(nameDialog)
        const input = nameDialog.querySelector('#nameInput')
        const button = nameDialog.querySelector('#saveScoreBtn')

        // Add hover effect class
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)'
        })
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)'
        })

        return new Promise((resolve) => {
            const handleSave = async () => {
                const displayName = input.value.trim() || 'Аноним'
                button.disabled = true // Prevent double-clicks
                const result = await submitScore(score, displayName)
                nameDialog.remove()
                if (result) await this.refresh()
                resolve(result)
            }

            // Add both click and keyboard enter support
            button.addEventListener('click', handleSave)
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSave()
                }
            })

            // Allow clicking outside to cancel
            nameDialog.addEventListener('click', (e) => {
                if (e.target === nameDialog) {
                    nameDialog.remove()
                    resolve(null)
                }
            })
        })
    }
}