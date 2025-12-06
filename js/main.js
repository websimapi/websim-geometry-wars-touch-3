import { canvas, ctx, resizeCanvas } from './canvas.js';
import { state, resetState } from './state.js';
import { grid } from './grid.js';
import { player } from './player.js';
import { input, callbacks as inputCallbacks } from './input.js';
import { particles, createParticles, updateParticles, drawParticles } from './particles.js';
import { bullets, shootBullet, updateBullets, drawBullets } from './bullets.js';
import { enemies, spawnEnemy, resetEnemies } from './enemies.js';
import { ui } from './ui.js';
import { replay } from './replay.js';

// Setup Game Loop Logic
function checkCollisions() {
    // Bullet vs Enemy
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (!enemy) continue; 

        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < enemy.size) {
                createParticles(enemy.x, enemy.y, enemy.type);
                enemies.splice(i, 1);
                bullets.splice(j, 1);
                state.score += 100;
                ui.updateScore();

                // Upgrade logic
                if (state.score > 0 && state.score % 5000 === 0) {
                    state.upgradeLevel++;
                    const upgradeType = state.upgradeLevel % 3;
                    switch(upgradeType) {
                        case 0: state.bulletSpeed += 10; break;
                        case 1: state.bulletSpreadAngle += 0.1; break;
                        case 2: state.bulletAngles++; break;
                    }
                    state.bombs++;
                    ui.updateBombs();
                }
                break;
            }
        }
    }

    // Lives Up
    if (state.score > 0 && state.score % 10000 === 0) {
        if (state.lives < 5) {
            state.lives++;
            ui.updateLives();
            createParticles(player.x, player.y, 'powerup');
        }
    }

    // Enemy vs Player
    for (let enemy of enemies) {
        if (!enemy) continue;
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < enemy.size + player.size/2) {
            state.lives--;
            ui.updateLives();

            if (state.lives <= 0) {
                state.gameActive = false;
                ui.showGameOver();
            } else {
                enemies.forEach(e => {
                   if(e) createParticles(e.x, e.y, e.type);
                });
                resetEnemies();
                player.reset();
                createParticles(player.x, player.y, 'player');
            }
            break;
        }
    }
}

// Bomb Function
inputCallbacks.onBomb = () => {
    if (state.bombs > 0 && state.gameActive) {
        state.bombs--;
        ui.updateBombs();
        enemies.forEach(enemy => {
            if(enemy) createParticles(enemy.x, enemy.y, enemy.type);
        });
        state.score += enemies.length * 100;
        ui.updateScore();
        resetEnemies();
    }
};

function checkForNearbyEnemies() {
    const dangerRadius = 150; 
    return enemies.some(enemy => {
        if(!enemy) return false;
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        return (dx * dx + dy * dy) < (dangerRadius * dangerRadius);
    });
}

function update(dt) {
    if (state.isReplaying) {
        replay.update();
        // Still allow particles to update visually during replay for flair
        updateParticles();
        grid.update();
        return;
    }

    if (!state.gameActive) return;

    // Record state for replay
    replay.recordFrame();

    // Time Dilation
    const hasNearbyEnemies = checkForNearbyEnemies();

    if ((input.isMobile && hasNearbyEnemies && state.energyBar > 0 && state.canUseTimeDilation) || 
        (!input.isMobile && input.mouse.rightDown && state.energyBar > 0 && state.canUseTimeDilation)) {
        state.timeDilation = 0.3;
        state.energyBar = Math.max(0, state.energyBar - 0.5);
        if (state.energyBar <= 0) state.canUseTimeDilation = false;
    } else {
        state.timeDilation = 1;
        if (!input.mouse.rightDown || input.isMobile) {
            state.energyBar = Math.min(100, state.energyBar + 0.2);
            if (state.energyBar >= 100) state.canUseTimeDilation = true;
        }
    }

    const gameDt = dt * state.timeDilation;

    // Player
    player.update();

    // Enemies
    enemies.forEach(enemy => {
        if(!enemy) return;
        // Temporarily adjust speed for time dilation
        const originalSpeed = enemy.speed;
        enemy.speed *= state.timeDilation;
        enemy.update();
        enemy.speed = originalSpeed;
    });

    // Spawning & Shooting
    state.spawnTimer += gameDt; // Spawn timer runs on game time (slows down)
    if (state.spawnTimer > 1000) {
        spawnEnemy();
        state.spawnTimer = 0;
    }

    state.lastShotTime += gameDt; 
    if (state.lastShotTime > state.bulletInterval) {
        shootBullet();
        state.lastShotTime = 0;
    }

    updateParticles();
    updateBullets();
    checkCollisions();
}

function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    grid.update();
    grid.draw();

    drawParticles();
    drawBullets(); 
    enemies.forEach(enemy => {
        if(enemy) enemy.draw();
    });
    player.draw();
    ui.drawEnergyBar();
}

let animationId;
let lastTime = 0;

function gameLoop(timestamp) {
    animationId = requestAnimationFrame(gameLoop);

    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (state.gameActive || state.isReplaying) {
        update(dt);
        draw();
    } else {
        // Just draw the idle state (background grid animation usually) when game over
        // We still want to clear/draw so it doesn't smear if we want animations
        // But for now, keeping static last frame is fine, or we can continue drawing particles?
        // Let's allow drawing to keep particles fading out and grid moving
        draw();
    }
}

// Initialization
function startGame() {
    state.gameStarted = true;
    state.gameActive = true;
    ui.hideStartScreen();
    
    replay.startRecording();
    
    if (animationId) cancelAnimationFrame(animationId);
    lastTime = performance.now();
    gameLoop(lastTime);
}

function init() {
    window.addEventListener('resize', () => {
        resizeCanvas();
        grid.init();
    });

    resizeCanvas();
    grid.init();
    player.reset();

    ui.updateLives();
    ui.updateBombs();

    ui.onStart(() => {
        startGame();
    });

    ui.onRestart(() => {
        resetState();
        resetEnemies();
        bullets.length = 0;
        particles.length = 0;
        player.reset();

        ui.updateScore();
        ui.updateLives();
        ui.updateBombs();
        ui.hideGameOver();

        startGame();
    });

    ui.onWatchReplay(() => {
        replay.startPlayback();
    });

    // Start loop for grid animation in background?
    // Current requirement is "Do not start spawning in geometries until the game has started"
    // So we just draw grid?
    // Let's just run a draw loop for the menu background effect

    function menuLoop() {
        if (!state.gameStarted) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            grid.update();
            grid.draw();
            requestAnimationFrame(menuLoop);
        }
    }
    menuLoop();
}

init();