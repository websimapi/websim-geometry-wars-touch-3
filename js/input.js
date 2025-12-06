import { canvas } from './canvas.js';

export const input = {
    touch: {
        active: false,
        x: 0,
        y: 0
    },
    mouse: {
        x: 0,
        y: 0,
        leftDown: false,
        rightDown: false,
        down: false
    },
    isMobile: ('ontouchstart' in window)
};

export const callbacks = {
    onBomb: () => {}
};

// Touch Events
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    input.touch.active = true;
    input.mouse.leftDown = true; // Map touch to left click logic
    input.touch.x = e.touches[0].clientX;
    input.touch.y = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    input.touch.x = e.touches[0].clientX;
    input.touch.y = e.touches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
    input.touch.active = false;
    input.mouse.leftDown = false;
    callbacks.onBomb();
});

// Mouse Events
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) {
        input.mouse.rightDown = true;
    } else if (e.button === 0) {
        input.mouse.leftDown = true;
        input.mouse.down = true;
        input.mouse.x = e.clientX;
        input.mouse.y = e.clientY;
        
        // Sync touch state for compatibility
        input.touch.active = true;
        input.touch.x = e.clientX;
        input.touch.y = e.clientY;
    }
});

canvas.addEventListener('mousemove', (e) => {
    input.mouse.x = e.clientX;
    input.mouse.y = e.clientY;
    if (input.mouse.leftDown) {
        input.touch.x = e.clientX;
        input.touch.y = e.clientY;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 2) {
        input.mouse.rightDown = false;
    } else if (e.button === 0) {
        input.mouse.leftDown = false;
        input.mouse.down = false;
        input.touch.active = false;
        callbacks.onBomb();
    }
});