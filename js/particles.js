import { ctx } from './canvas.js';
import { state } from './state.js';
import { grid } from './grid.js';

export const particles = [];

export function createParticles(x, y, type) {
    const baseColors = {
        'snake': ["0,255,255", "0,200,255", "100,255,255"],
        'square': ["0,255,0", "100,255,100", "150,255,150"],
        'diamond': ["0,0,255", "100,100,255", "150,150,255"],
        'spiky': ["255,20,147", "255,100,180", "255,150,200"],
        'octagon': ["255,0,255", "255,100,255", "255,150,255"],
        'star': ["255,255,0", "255,255,100", "255,255,150"],
        'powerup': ["255,215,0", "255,200,0", "255,180,0"],
        'player': ["255,255,255", "200,200,255", "180,180,255"]
    };

    const colors = baseColors[type] || ["255,255,255", "200,200,255", "180,180,255"];

    const particleCount = {
        'HD': (type === 'powerup' ? 80 : 60),
        'LD': (type === 'powerup' ? 40 : 30),
        'VLD': (type === 'powerup' ? 20 : 15)
    }[state.graphicsQuality];

    const speed = type === 'powerup' ? 25 : 20;

    for (let i = 0; i < particleCount; i++) {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * speed,
            vy: (Math.random() - 0.5) * speed,
            size: Math.random() * 6 + 3,
            life: 1,
            color: randomColor,
            glow: {
                'HD': Math.random() * 30 + 20,
                'LD': Math.random() * 15 + 10,
                'VLD': Math.random() * 5 + 5
            }[state.graphicsQuality],
            trail: [],
            trailLength: {
                'HD': Math.floor(Math.random() * 10) + 5,
                'LD': Math.floor(Math.random() * 5) + 3,
                'VLD': Math.floor(Math.random() * 3) + 2
            }[state.graphicsQuality]
        });
    }

    // Grid disturbance
    const distRadius = state.graphicsQuality === 'VLD' ? 50 : 100;
    const distStrength = state.graphicsQuality === 'VLD' ? 0.2 : (state.graphicsQuality === 'HD' ? 1.0 : 0.5);
    const distColor = state.graphicsQuality === 'HD' 
        ? `rgba(${colors[Math.floor(Math.random() * colors.length)]},0.3)`
        : `rgba(${colors[0]},0.2)`;

    grid.disturb(x, y, distRadius, distStrength, distColor);
}

export function updateParticles() {
    // Optimization: combine loops or remove filter for performance? 
    // Splice backward is fine.
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

export function drawParticles() {
    ctx.save();
    // Batch setting context if possible, but particles have different colors.
    // However, we can disable shadows globally for lower settings.
    const useShadows = state.graphicsQuality === 'HD';

    particles.forEach(p => {
        // Optimization: Avoid save/restore inside loop if we can manage state manually,
        // but transform is not used here, only stroke/fill styles.
        // Actually save/restore is used. Let's optimize.
        
        if (useShadows) {
            ctx.shadowBlur = p.glow;
            ctx.shadowColor = `rgb(${p.color})`;
        } else {
            ctx.shadowBlur = 0;
        }
        
        ctx.fillStyle = `rgba(${p.color},${p.life})`;

        // Only draw trails if quality is not VLD or trail length > 0
        if (p.trail.length > 0 && state.graphicsQuality !== 'VLD') {
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            // Optimization: Maybe skip some points in trail for LD?
            p.trail.forEach(pos => ctx.lineTo(pos.x, pos.y));
            ctx.strokeStyle = `rgba(${p.color},${p.life * 0.5})`;
            ctx.stroke();
        } else {
            // Draw simple dot for particle head if no trail or VLD
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            ctx.fill();
        }

        p.trail.unshift({x: p.x, y: p.y});
        if (p.trail.length > p.trailLength) p.trail.pop();
    });
    ctx.restore();
}