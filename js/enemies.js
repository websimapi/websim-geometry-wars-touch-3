import { ctx, canvas } from './canvas.js';
import { player } from './player.js';
import { bullets } from './bullets.js';
import { state } from './state.js';

export let enemies = [];

export function resetEnemies() {
    enemies = [];
}

export class Enemy {
    constructor(typeOverride) {
        let availableTypes = ['diamond'];

        if (state.score >= 3000) availableTypes.push('spiky');
        if (state.score >= 6000) availableTypes.push('square');
        if (state.score >= 9000) availableTypes.push('octagon');
        if (state.score >= 12000) availableTypes.push('star');
        if (state.score >= 15000) availableTypes.push('snake');

        this.type = typeOverride || availableTypes[Math.floor(Math.random() * availableTypes.length)];
        this.size = 20 + Math.random() * 20;
        this.speed = 2 + Math.random() * 2;
        this.dodging = false;
        this.dodgeDirection = { x: 0, y: 0 };
        this.rotation = 0;

        // Init properties based on type
        if (this.type === 'square') {
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        } else if (this.type === 'spiky') {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.2;
            this.arcPhase = Math.random() * Math.PI * 2;
            this.arcAmplitude = 2 + Math.random() * 2;
            this.arcSpeed = 0.02 + Math.random() * 0.02;
        } else if (this.type === 'octagon') {
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.15;
            this.speed = 3;
        } else if (this.type === 'star') {
            this.points = 5;
            this.innerRadius = this.size * 0.4;
            this.outerRadius = this.size;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.2;
            this.speed = 3.5;
        } else if (this.type === 'diamond') {
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.speed = 1;
        } else if (this.type === 'snake') {
            this.segments = [{x: 0, y: 0}]; // Init placeholder
            this.segmentLength = 30;
            this.maxSegments = 8;
            this.speed = 2.5;
            this.angleSpeed = 0.05;
            this.angle = Math.random() * Math.PI * 2;
        }

        // Spawn position logic
        if (Math.random() < 0.5) {
            this.x = Math.random() < 0.5 ? -this.size : canvas.width + this.size;
            this.y = Math.random() * canvas.height;
        } else {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() < 0.5 ? -this.size : canvas.height + this.size;
        }

        if (this.type === 'snake') {
            this.segments = [{x: this.x, y: this.y}];
        }
    }

    checkBullets() {
        if (this.type !== 'square') return;

        for (let bullet of bullets) {
            const dx = bullet.x - this.x;
            const dy = bullet.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
                this.dodging = true;
                const bulletDir = { x: bullet.vx, y: bullet.vy };
                this.dodgeDirection = {
                    x: -bulletDir.y,
                    y: bulletDir.x
                };
                return;
            }
        }
        this.dodging = false;
    }

    update() {
        if (this.type === 'spiky') {
            this.arcPhase += this.arcSpeed;
            const arcOffsetX = Math.cos(this.arcPhase) * this.arcAmplitude;
            const arcOffsetY = Math.sin(this.arcPhase) * this.arcAmplitude;

            this.x += this.vx + arcOffsetX;
            this.y += this.vy + arcOffsetY;

            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

            this.rotation += this.rotationSpeed;
            return;
        }

        if (this.type === 'square') {
            this.checkBullets();
            if (this.dodging) {
                this.x += this.dodgeDirection.x * 0.5;
                this.y += this.dodgeDirection.y * 0.5;
            } else {
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
            this.rotation += this.rotationSpeed;
            return;
        }

        if (this.type === 'diamond') {
            this.pulsePhase += 0.05;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const pulseSpeed = this.speed * (1 + Math.sin(this.pulsePhase) * 0.5);
            this.x += (dx / dist) * pulseSpeed;
            this.y += (dy / dist) * pulseSpeed;
        }

        if (this.type === 'octagon' || this.type === 'star') {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
            this.rotation += this.rotationSpeed;
        }

        if (this.type === 'snake') {
            this.angle += (Math.random() - 0.5) * this.angleSpeed;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const targetAngle = Math.atan2(dy, dx);
            this.angle += Math.sin(targetAngle - this.angle) * 0.1;

            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;

            this.segments.unshift({x: this.x, y: this.y});
            if (this.segments.length > this.maxSegments) {
                this.segments.pop();
            }
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (state.graphicsQuality === 'HD') {
            ctx.shadowBlur = 20;
        } else {
            ctx.shadowBlur = 0;
        }

        if (this.type === 'spiky') {
            ctx.rotate(this.rotation);
            if (state.graphicsQuality === 'HD') ctx.shadowColor = '#ff1493';
            ctx.strokeStyle = '#ff1493';
            ctx.lineWidth = 2;

            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI / 4);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * this.size, Math.sin(angle) * this.size);
                ctx.stroke();
            }
        } 
        else if (this.type === 'diamond') {
            const pulseSize = this.size * (1 + Math.sin(this.pulsePhase) * 0.2);
            if (state.graphicsQuality === 'HD') ctx.shadowColor = '#00f';
            ctx.strokeStyle = '#00f';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(pulseSize, 0);
            ctx.lineTo(0, pulseSize);
            ctx.lineTo(-pulseSize, 0);
            ctx.lineTo(0, -pulseSize);
            ctx.closePath();
            ctx.stroke();
        }
        else if (this.type === 'square') {
            ctx.rotate(this.rotation);
            if (state.graphicsQuality === 'HD') ctx.shadowColor = '#0f0';
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.rect(-this.size/2, -this.size/2, this.size, this.size);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.rect(-this.size/2 * 0.7, -this.size/2 * 0.7, this.size * 0.7, this.size * 0.7);
            ctx.stroke();
        }
        else if (this.type === 'octagon') {
            ctx.rotate(this.rotation);
            if (state.graphicsQuality === 'HD') ctx.shadowColor = '#ff00ff';
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 3;

            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = i * Math.PI / 4;
                const x = Math.cos(angle) * this.size;
                const y = Math.sin(angle) * this.size;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }
        else if (this.type === 'star') {
            ctx.rotate(this.rotation);
            if (state.graphicsQuality === 'HD') ctx.shadowColor = '#ffff00';
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 3;

            ctx.beginPath();
            for (let i = 0; i < this.points * 2; i++) {
                const radius = i % 2 === 0 ? this.outerRadius : this.innerRadius;
                const angle = (i * Math.PI) / this.points;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }
        else if (this.type === 'snake') {
            ctx.restore();  
            ctx.save();     
            if (state.graphicsQuality === 'HD') {
                ctx.shadowBlur = 25;
                ctx.shadowColor = '#00ffff';
            }
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 15;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (this.segments && this.segments.length > 0) {
                ctx.beginPath();
                ctx.moveTo(this.segments[0].x, this.segments[0].y);
                for (let i = 1; i < this.segments.length; i++) {
                    ctx.lineTo(this.segments[i].x, this.segments[i].y);
                }
                ctx.stroke();
            }
        }

        ctx.restore();
    }
}

export function spawnEnemy() {
    if (!state.gameStarted) return;

    const maxEnemies = Math.min(20, 10 + Math.floor(state.score / 1000));

    // Mass spawn logic
    if (state.score >= 5500 && state.score - state.lastMassSpawnScore >= 5500) {
        state.lastMassSpawnScore = state.score - (state.score % 5500);

        // Pick a type to mass spawn
        // Let's duplicate logic cleanly
        let availableTypes = ['diamond'];
        if (state.score >= 3000) availableTypes.push('spiky');
        if (state.score >= 6000) availableTypes.push('square');
        if (state.score >= 9000) availableTypes.push('octagon');
        if (state.score >= 12000) availableTypes.push('star');
        if (state.score >= 15000) availableTypes.push('snake');

        const selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];

        if (selectedType === 'spiky') {
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    if(!state.gameActive) return;
                    enemies.push(new Enemy('spiky'));
                }, i * 100);
            }
        } else {
            for (let i = 0; i < 10; i++) {
                enemies.push(new Enemy(selectedType));
            }
        }
    }

    if (enemies.length < maxEnemies) {
        enemies.push(new Enemy());
    }
}