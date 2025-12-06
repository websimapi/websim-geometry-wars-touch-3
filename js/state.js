export const state = {
    score: 0,
    lives: 3,
    bombs: 3,
    gameActive: false,
    gameStarted: false,
    graphicsQuality: 'HD',
    energyBar: 100,
    timeDilation: 1,
    canUseTimeDilation: true,
    bulletAngles: 1,
    bulletSpeed: 40,
    bulletSpreadAngle: 0.2,
    upgradeLevel: 0,
    lastMassSpawnScore: 0,
    bulletInterval: 150,
    
    // Timers
    lastShotTime: 0,
    spawnTimer: 0,

    // Replay
    isReplaying: false
};

export function resetState() {
    state.score = 0;
    state.lives = 3;
    state.bombs = 3;
    state.gameActive = true;
    state.isReplaying = false;
    state.energyBar = 100;
    state.timeDilation = 1;
    state.canUseTimeDilation = true;
    state.bulletAngles = 1;
    state.bulletSpeed = 40;
    state.bulletSpreadAngle = 0.2;
    state.upgradeLevel = 0;
    state.lastMassSpawnScore = 0;
    state.spawnTimer = 0;
    state.lastShotTime = 0;
}

