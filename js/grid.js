import { canvas, ctx } from './canvas.js';
import { state } from './state.js';

class GridCell {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.distortion = 0;
        this.color = 'rgba(30, 30, 40, 0.3)';
        this.targetColor = this.color;
        this.colorTransition = 0;
        this.gradient = Math.random() * 360;
        this.brightness = 0.1;
    }

    disturb(strength, color) {
        this.distortion = Math.min(this.distortion + strength, 1);
        this.targetColor = color;
        this.brightness = Math.min(this.brightness + strength, 0.8);
    }

    update() {
        // Optimization: Pre-calculate speed multiplier outside or access state less frequently if possible
        // But here simple access is fine.
        const speedMultiplier = {
            'HD': 1,
            'LD': 2,
            'VLD': 3
        }[state.graphicsQuality] || 1;

        if (this.distortion > 0) {
            this.distortion -= 0.05 * speedMultiplier;
            this.brightness = Math.max(0.1, this.brightness - (0.02 * speedMultiplier));
        }
    }

    draw(ctx) {
        // Optimization: Reduce property access and state changes
        ctx.strokeStyle = `hsla(${this.gradient}, 70%, ${this.brightness * 100}%, 0.3)`;
        
        // Skip heavy line width calc for VLD
        ctx.lineWidth = 1 + this.distortion * 2;

        const distortionOffset = this.distortion * 15;
        // Optimization: Use deterministic or faster random? Math.random is fine.
        // For VLD, maybe skip random angle distortion calculation if distortion is 0
        
        let x = this.x;
        let y = this.y;

        if (this.distortion > 0.01) {
             const randomAngle = Math.random() * Math.PI * 2; 
             x += Math.cos(randomAngle) * distortionOffset;
             y += Math.sin(randomAngle) * distortionOffset;
        }

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + this.size, y);
        ctx.lineTo(x + this.size, y + this.size);
        ctx.lineTo(x, y + this.size);
        ctx.closePath();
        ctx.stroke();
    }
}

export const grid = {
    cells: [],
    cellSize: 40,
    rows: 0,
    cols: 0,

    init() {
        this.cells = [];
        this.cols = Math.ceil(canvas.width / this.cellSize);
        this.rows = Math.ceil(canvas.height / this.cellSize);

        for (let x = 0; x < canvas.width; x += this.cellSize) {
            for (let y = 0; y < canvas.height; y += this.cellSize) {
                this.cells.push(new GridCell(x, y, this.cellSize));
            }
        }
    },

    update() {
        // Optimization: Don't update cells that are idle if possible, 
        // but they need to fade out. 
        this.cells.forEach(cell => cell.update());
    },

    draw() {
        // Optimization: Batch drawing if possible? 
        // Individual colors make batching hard. 
        // Ensure no shadow blur is active from previous draws.
        ctx.shadowBlur = 0; 
        
        const skipFactor = state.graphicsQuality === 'VLD' ? 2 : 1;
        
        for (let i = 0; i < this.cells.length; i += skipFactor) {
            this.cells[i].draw(ctx);
        }
    },

    disturb(x, y, radius, strength, color) {
        // Optimization: Spatial Hashing / Direct Indexing
        const startCol = Math.floor((x - radius) / this.cellSize);
        const endCol = Math.ceil((x + radius) / this.cellSize);
        const startRow = Math.floor((y - radius) / this.cellSize);
        const endRow = Math.ceil((y + radius) / this.cellSize);

        for (let c = startCol; c < endCol; c++) {
            for (let r = startRow; r < endRow; r++) {
                if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
                    const index = c * this.rows + r;
                    const cell = this.cells[index];
                    if (cell) {
                        const dist = Math.sqrt((cell.x - x) ** 2 + (cell.y - y) ** 2);
                        if (dist < radius) {
                             const falloff = 1 - (dist / radius);
                             cell.disturb(strength * falloff, color || 'rgba(255,255,255,0.3)');
                        }
                    }
                }
            }
        }
    }
};