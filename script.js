document.addEventListener('DOMContentLoaded', () => {
    // 3D Slot Machine Logic
    const leverControl = document.getElementById('lever-control');
    const instructionText = document.querySelector('.instruction-label');

    const rings = [
        document.getElementById('ring-1'),
        document.getElementById('ring-2'),
        document.getElementById('ring-3')
    ];

    // Symbols Map (12 faces)
    // Using simple shapes/text to look like classic slot symbols
    // 7, Cherry (Color), Bar, etc.
    const symbolMap = ['7', '🍒', 'BAR', '🔔', '🍒', '🍋', '7', 'BAR', '🔔', '🍋', '🍒', 'BAR'];
    const FACE_ANGLE = 30; // 360 / 12
    const RADIUS = 115; // Calculated for 80px face approx

    // Initialize Rings
    rings.forEach(ring => {
        symbolMap.forEach((sym, i) => {
            const face = document.createElement('div');
            face.className = 'ring-face';

            if (sym === '7') face.classList.add('gold-seven');
            if (sym === '🍒' || sym === '🍋') face.classList.add('red-symbol'); // Just generic color class

            face.textContent = sym;

            // 3D Transform
            face.style.transform = `rotateX(${i * FACE_ANGLE}deg) translateZ(${RADIUS}px)`;
            ring.appendChild(face);
        });

        // Set Random Start Position (Avoiding 7s)
        // Indices of 7 are 0 and 6.
        let randomStart;
        do {
            randomStart = Math.floor(Math.random() * symbolMap.length);
        } while (symbolMap[randomStart] === '7');

        ring.style.transform = `rotateX(${-1 * randomStart * FACE_ANGLE}deg)`;
    });

    // Sounds
    const bgMusic = document.getElementById('bg-music');
    const spinSound = document.getElementById('spin-sound');
    const winSound = document.getElementById('win-sound');

    // UI Elements
    const scene1 = document.getElementById('slot-machine-scene');
    const jackpotOverlay = document.getElementById('jackpot-overlay');
    const jackpotText = jackpotOverlay.querySelector('.jackpot-text');
    const subtitle = jackpotOverlay.querySelector('.subtitle');
    const quote = jackpotOverlay.querySelector('.quote');
    const scene2 = document.getElementById('message-scene');

    // State Management
    const STATE = {
        IDLE: 'idle',
        SPINNING: 'spinning',
        JACKPOT: 'jackpot'
    };

    let currentState = STATE.IDLE;

    // Interaction
    leverControl.addEventListener('click', () => {
        // Enforce State: Only actionable in IDLE
        if (currentState !== STATE.IDLE) return;

        // Transition to SPINNING immediately
        currentState = STATE.SPINNING;

        // Lever Animation
        leverControl.classList.add('pulled');
        instructionText.style.opacity = 0;

        // Delay spin start slightly to sync with lever visual
        setTimeout(() => {
            leverControl.classList.remove('pulled');
            startSpin();
        }, 300);
    });

    function startSpin() {
        // Audio: Spin sound only
        spinSound.currentTime = 0;
        spinSound.play().catch(() => { });

        // Spin Logic
        // Target Index 0 ('7') is at 0 degrees visually in our setup 
        // We spin to a large negative number that is a multiple of 360 to land back on 0 (Index 0/7)

        rings.forEach((ring, index) => {
            const extraSpins = 4 + index * 2; // Staggered spin counts
            const targetRot = -1 * (extraSpins * 360); // Always lands on 7 (0deg)

            const duration = 2.5 + index * 0.8; // 2.5s, 3.3s, 4.1s

            ring.style.transition = `transform ${duration}s cubic-bezier(0.15, 0.55, 0.25, 1.05)`; // Ease-out bounce

            // Force reflow
            ring.offsetHeight;

            // Execute Spin
            ring.style.transform = `rotateX(${targetRot}deg)`;

            // Trigger Jackpot ONLY after the last reel (index 2) finishes
            if (index === 2) {
                setTimeout(() => {
                    enterJackpotState();
                }, duration * 1000);
            }
        });
    }

    function enterJackpotState() {
        currentState = STATE.JACKPOT;
        triggerJackpot();
    }

    function triggerJackpot() {
        spinSound.pause();

        // MUSIC START: Fade in
        bgMusic.volume = 0;
        bgMusic.play().catch(() => { console.log("Music blocked"); });
        fadeAudio(bgMusic, 1.0, 5000);

        // --- Party Celebration Start ---

        // 1. Screen Shake
        const machineWrapper = document.querySelector('.machine-wrapper');
        machineWrapper.classList.add('shake-active');
        machineWrapper.addEventListener('animationend', () => {
            machineWrapper.classList.remove('shake-active');
        }, { once: true });

        // 2. Light Rays
        const rays = document.createElement('div');
        rays.className = 'light-rays active';
        document.body.appendChild(rays);

        // 3. Confetti Loop
        let confettiInterval = setInterval(createConfetti, 100);

        // 4. Sparkles & Hearts (Immediate Burst)
        createSparkles();
        createHearts();

        // Step 1: Show JACKPOT immediately (0.5s)
        setTimeout(() => {
            jackpotText.classList.remove('hidden');
            jackpotText.classList.add('visible');
        }, 500);

        // Step 2: Fade out slot machine completely (3s)
        setTimeout(() => {
            scene1.classList.add('scene-exit-fade');
        }, 3000);

        // Step 3: Show Subtitle (4.5s) - AFTER machine is gone
        setTimeout(() => {
            subtitle.classList.remove('hidden');
            subtitle.classList.add('visible');
        }, 4500);

        // stop confetti loop after 8 seconds 
        setTimeout(() => {
            clearInterval(confettiInterval);
        }, 8000);

        // Step 4: Show Quote (7s)
        setTimeout(() => {
            quote.classList.remove('hidden');
            quote.classList.add('visible');
        }, 7000);

        // --- Transition to Scene 2 ---
        // 12 Seconds: Fade out celebration text/overlay, Fade IN Message
        setTimeout(() => {
            rays.style.opacity = '0'; // Fade out rays
            jackpotOverlay.style.opacity = '0';
            jackpotOverlay.style.transition = 'opacity 2s ease';

            // Fade IN Message Scene 
            setTimeout(() => {
                transitionToScene2();
            }, 2000);
        }, 12000);
    }

    function createConfetti() {
        const colors = ['confetti-gold', 'confetti-pink'];
        const piece = document.createElement('div');
        const colorClass = colors[Math.floor(Math.random() * colors.length)];
        piece.classList.add('confetti', colorClass);

        // Random Position
        piece.style.left = Math.random() * 100 + 'vw';

        // Random Fall Speed & Sway
        const duration = Math.random() * 2 + 3; // 3-5s
        piece.style.animation = `confettiFall ${duration}s linear forwards, confettiSway 3s ease-in-out infinite`;

        document.body.appendChild(piece);

        // Cleanup
        setTimeout(() => piece.remove(), duration * 1000);
    }

    function transitionToScene2() {
        scene2.classList.remove('hidden');
        scene2.classList.add('scene-enter');

        // Start Ambience for Message
        startMessageAmbience();
    }

    function startMessageAmbience() {
        const container = document.createElement('div');
        container.className = 'ambient-container';
        document.body.appendChild(container);

        // Create initial batch
        for (let i = 0; i < 20; i++) createAmbientParticle(container);

        // Periodic spawn
        setInterval(() => createAmbientParticle(container), 2000);
    }

    function createAmbientParticle(container) {
        const p = document.createElement('div');
        // Mix of particles and hearts
        const isHeart = Math.random() > 0.7;

        if (isHeart) {
            p.className = 'ambient-heart';
            p.innerHTML = '♥';
            p.style.left = Math.random() * 100 + 'vw';
            p.style.animationDuration = (Math.random() * 10 + 10) + 's'; // Slow
        } else {
            p.className = 'ambient-particle';
            const size = Math.random() * 4 + 2;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = Math.random() * 100 + 'vw';
            p.style.top = Math.random() * 100 + 'vh';
            p.style.animationDuration = (Math.random() * 5 + 5) + 's';
        }

        container.appendChild(p);
        setTimeout(() => p.remove(), 20000); // Long life
    }

    function createSparkles() {
        for (let i = 0; i < 40; i++) {
            setTimeout(() => {
                const spark = document.createElement('div');
                spark.className = 'sparkle';
                spark.style.left = Math.random() * 100 + 'vw';
                spark.style.top = Math.random() * 100 + 'vh';
                const scale = Math.random() * 0.5 + 0.5;
                spark.style.transform = `scale(${scale})`;
                spark.style.animationDuration = (Math.random() * 1 + 1.5) + 's';
                document.body.appendChild(spark);
                setTimeout(() => spark.remove(), 3000);
            }, i * 50);
        }
    }

    function createHearts() {
        const heartCount = 30; // Reduced slightly as we have confetti now
        for (let i = 0; i < heartCount; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.classList.add('heart-particle');
                heart.innerHTML = '♥';
                heart.style.left = Math.random() * 100 + 'vw';
                heart.style.top = (Math.random() * 20 + 80) + 'vh';
                const scale = Math.random() * 1 + 0.5;
                heart.style.fontSize = (scale * 2) + 'rem';
                heart.style.animationDuration = (Math.random() * 2 + 2) + 's';
                document.body.appendChild(heart);
                setTimeout(() => heart.remove(), 4000);
            }, i * 50);
        }
    }
});
