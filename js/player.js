import { canvas, ctx } from './canvas.js';
import { input } from './input.js';
import { grid } from './grid.js';
import { state } from './state.js';

export const player = {
    x: 0,
    y: 0,
    size: 20,
    speed: 5,
    
    reset() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
    },
    
    update() {
        if (input.touch.active || input.mouse.leftDown) {
            const dx = input.touch.x - this.x;
            const dy = input.touch.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > this.size) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;

                // Disturb grid
                grid.disturb(this.x, this.y, 100, 1, 'rgba(255,255,255,0.3)');
            }
        }
    },
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (input.touch.active || input.mouse.leftDown) {
            ctx.rotate(Math.atan2(input.touch.y - this.y, input.touch.x - this.x));
        }
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fff';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(-this.size/2, this.size/2);
        ctx.lineTo(-this.size/2, -this.size/2);
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
    }
};

