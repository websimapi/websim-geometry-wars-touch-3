import { state } from './state.js';
import { enemies, Enemy, resetEnemies } from './enemies.js';
import { player } from './player.js';
import { bullets } from './bullets.js';
import { ui } from './ui.js';
import { createParticles } from './particles.js';
import { grid } from './grid.js';

export const replay = {
    data: [],
    currentFrame: 0,
    recording: false,
    frameEvents: [],

    reset() {
        this.data = [];
        this.currentFrame = 0;
        this.recording = false;
        this.frameEvents = [];
    },

    startRecording() {
        this.reset();
        this.recording = true;
        // console.log("Replay recording started");
    },

    stopRecording() {
        this.recording = false;
        // console.log("Replay recording stopped, frames:", this.data.length);
    },

    addEvent(type, data) {
        if (this.recording) {
            this.frameEvents.push({ type, data });
        }
    },

    recordFrame() {
        if (!this.recording || !state.gameActive) return;

        // Create lightweight snapshot
        const frameData = {
            p: { 
                x: Math.round(player.x), 
                y: Math.round(player.y),
                r: parseFloat(player.rotation.toFixed(2))
            },
            e: enemies.map(e => ({
                t: e.type,
                x: Math.round(e.x),
                y: Math.round(e.y),
                r: parseFloat((e.rotation || 0).toFixed(2)),
                s: Math.round(e.size),
                pp: e.pulsePhase ? parseFloat(e.pulsePhase.toFixed(2)) : 0,
                segs: e.segments ? e.segments.map(s => ({x: Math.round(s.x), y: Math.round(s.y)})) : null
            })),
            b: bullets.map(b => ({ x: Math.round(b.x), y: Math.round(b.y) })),
            sc: state.score,
            l: state.lives,
            bm: state.bombs,
            en: Math.round(state.energyBar),
            ev: this.frameEvents // capture events
        };

        this.data.push(frameData);
        this.frameEvents = []; // clear for next frame
    },

    startPlayback() {
        if (this.data.length === 0) return;

        state.isReplaying = true;
        state.gameActive = false; // Stop game logic
        this.currentFrame = 0;

        // Hide game over, show replay UI if needed
        ui.hideGameOver();
    },

    update() {
        if (!state.isReplaying) return;

        if (this.currentFrame >= this.data.length) {
            // End of replay
            state.isReplaying = false;
            ui.showGameOver(); // Return to game over screen
            return;
        }

        const frame = this.data[this.currentFrame];

        // Restore State
        player.x = frame.p.x;
        player.y = frame.p.y;
        player.rotation = frame.p.r || 0;
        state.score = frame.sc;
        state.lives = frame.l;
        state.bombs = frame.bm;
        state.energyBar = frame.en;

        ui.updateScore();
        ui.updateLives();
        ui.updateBombs();

        // Replay grid disturbance from player
        if (this.currentFrame > 0) {
            const prevFrame = this.data[this.currentFrame - 1];
            const dist = Math.hypot(frame.p.x - prevFrame.p.x, frame.p.y - prevFrame.p.y);
            if (dist > 0.5) {
                grid.disturb(player.x, player.y, 100, 1, 'rgba(255,255,255,0.3)');
            }
        }

        // Playback Events (Particles, etc.)
        if (frame.ev && frame.ev.length > 0) {
            frame.ev.forEach(event => {
                if (event.type === 'particles') {
                    // Temporarily allow particle creation
                    createParticles(event.data.x, event.data.y, event.data.t);
                }
            });
        }

        // Restore Bullets
        bullets.length = 0;
        frame.b.forEach(bData => {
            bullets.push({ x: bData.x, y: bData.y, vx: 0, vy: 0 }); // vx/vy irrelevant for drawing
        });

        // Restore Enemies
        // To be efficient, we clear and rebuild. 
        // Note: This creates garbage, but modern GC handles this okay for a replay.
        resetEnemies(); 
        frame.e.forEach(eData => {
            const enemy = new Enemy(eData.t);
            enemy.x = eData.x;
            enemy.y = eData.y;
            enemy.size = eData.s;
            enemy.rotation = eData.r;
            if (eData.pp) enemy.pulsePhase = eData.pp;
            if (eData.segs) enemy.segments = eData.segs;
            enemies.push(enemy);
        });

        this.currentFrame++;
    },

    getJSON() {
        return JSON.stringify(this.data);
    }
};