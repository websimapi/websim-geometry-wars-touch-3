import { state } from './state.js';
import { ctx, canvas } from './canvas.js';

const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const bombsElement = document.getElementById('bombs');
const gameOverDiv = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const startScreenDiv = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const backgroundMusic = document.getElementById('backgroundMusic');

export const ui = {
    updateScore() {
        scoreElement.textContent = state.score;
        if (state.score >= 10000) {
            scoreElement.style.fontSize = '48px';
            scoreElement.style.textShadow = '0 0 20px #fff, 0 0 30px #ff0';
        } else if (state.score >= 5000) {
            scoreElement.style.fontSize = '40px';
            scoreElement.style.textShadow = '0 0 15px #fff';
        } else {
            scoreElement.style.fontSize = '32px';
            scoreElement.style.textShadow = '0 0 10px #fff';
        }
    },

    updateLives() {
        livesElement.innerHTML = Array(state.lives).fill('<span class="heart">❤️</span>').join('');
    },

    updateBombs() {
        bombsElement.innerHTML = Array(state.bombs).fill('<span class="bomb">💣</span>').join('');
    },

    drawEnergyBar() {
        ctx.save();
        ctx.fillStyle = `rgba(0, 255, 255, ${state.energyBar/100})`;
        ctx.fillRect(10, canvas.height - 30, (state.energyBar/100) * 200, 20);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(10, canvas.height - 30, 200, 20);
        ctx.restore();
    },

    showGameOver() {
        gameOverDiv.style.display = 'block';
        finalScoreElement.textContent = state.score;
        // Ensure replay button exists
        let replayBtn = document.getElementById('watchReplay');
        if (!replayBtn) {
            replayBtn = document.createElement('button');
            replayBtn.id = 'watchReplay';
            replayBtn.innerText = 'Watch Instant Replay';
            replayBtn.style.marginTop = '10px';
            replayBtn.style.marginLeft = '10px';
            replayBtn.style.padding = '10px 20px';
            replayBtn.style.fontSize = '24px';
            replayBtn.style.background = '#fff';
            replayBtn.style.border = 'none';
            replayBtn.style.borderRadius = '5px';
            replayBtn.style.cursor = 'pointer';
            document.getElementById('restart').parentNode.appendChild(replayBtn);
        }
        replayBtn.style.display = 'inline-block';
    },

    hideGameOver() {
        gameOverDiv.style.display = 'none';
    },

    hideStartScreen() {
        startScreenDiv.style.display = 'none';
    },

    onStart(callback) {
        startButton.addEventListener('click', async () => {
             const qualitySelect = document.getElementById('graphicsQuality');
             state.graphicsQuality = qualitySelect.value;
             try {
                 await backgroundMusic.play();
             } catch(e) { console.error(e); }
             callback();
        });
    },

    onRestart(callback) {
        document.getElementById('restart').addEventListener('click', callback);
    },

    onWatchReplay(callback) {
        // Delegate event since button might be created dynamically
        document.addEventListener('click', (e) => {
            if(e.target && e.target.id === 'watchReplay') {
                callback();
            }
        });
    }
};

