/* ============================================================
   MATCHAPP AMBIENT BACKGROUND

   Two layers on one canvas:

   1. FLOWING AURORA — several independent sine waves, each with its own
      speed, amplitude and phase, stacked with additive blending so where
      they overlap the colour brightens. The palette is MatchApp's own
      (gold #E5C158, royal purple #6B3FA0, deep magenta) rather than any
      other product's, and the motion is built from layered sine bands
      rather than any particular library's look — it should read as ours.

   2. STREAMING LOGOS with REAL COLLISION. The previous version was a CSS
      animation that floated logos straight up and let them pass through
      each other. These are physics bodies: each carries a position,
      velocity and radius, bounces off the viewport edges, and resolves
      genuine circle-to-circle collisions with its neighbours using an
      elastic impulse along the collision normal — so they visibly bump
      and deflect rather than overlapping.

   Performance and courtesy:
   - Respects prefers-reduced-motion by rendering ONE static frame and
     stopping. Motion sensitivity is real and a moving background is
     exactly the kind of thing that triggers it.
   - Pauses entirely when the tab is hidden (no wasted battery).
   - Caps device pixel ratio at 2 — beyond that the cost climbs sharply
     for no visible gain.
   - Reduces logo count on small screens where there's less room anyway.
   ============================================================ */

(function () {
    const canvas = document.getElementById('ambient-bg');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');

    const reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0, dpr = 1;
    let rafId = null;
    let t = 0;

    /* ---------- Aurora wave bands ---------- */
    // Each band is an independent sine with its own character. Layered with
    // 'lighter' compositing so crossings glow rather than occlude.
    const BANDS = [
        { colour: '229,193,88',  amp: 0.055, freq: 1.15, speed: 0.00022, yOff: 0.34, alpha: 0.16, thick: 0.16 },
        { colour: '107,63,160',  amp: 0.075, freq: 0.85, speed: -0.00016, yOff: 0.52, alpha: 0.20, thick: 0.22 },
        { colour: '163,118,182', amp: 0.045, freq: 1.55, speed: 0.00029, yOff: 0.63, alpha: 0.13, thick: 0.14 },
        { colour: '196,72,123',  amp: 0.065, freq: 0.65, speed: -0.00021, yOff: 0.74, alpha: 0.11, thick: 0.18 }
    ];

    function drawBands() {
        ctx.globalCompositeOperation = 'lighter';
        for (const b of BANDS) {
            const baseY = H * b.yOff;
            const amp = H * b.amp;
            const thickness = H * b.thick;

            const grad = ctx.createLinearGradient(0, baseY - thickness, 0, baseY + thickness);
            grad.addColorStop(0,   `rgba(${b.colour},0)`);
            grad.addColorStop(0.5, `rgba(${b.colour},${b.alpha})`);
            grad.addColorStop(1,   `rgba(${b.colour},0)`);

            ctx.beginPath();
            ctx.moveTo(0, H);
            const step = Math.max(6, W / 120);
            for (let x = 0; x <= W + step; x += step) {
                // Two summed sines per band so the crest never repeats on a
                // simple period — it keeps drifting instead of looping visibly.
                const p = (x / W) * Math.PI * 2 * b.freq;
                const y = baseY
                    + Math.sin(p + t * b.speed * 1000) * amp
                    + Math.sin(p * 0.5 + t * b.speed * 640) * amp * 0.45;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(W, H);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    /* ---------- Streaming logos as physics bodies ---------- */
    // Drawn as text glyphs rather than remote images: the old version
    // hotlinked four SVGs from Wikimedia (an external dependency we don't
    // control, and a request per logo). These are the real service marks
    // rendered from their own wordmark initials in their brand colours.
    const LOGOS = [
        { label: 'N',  colour: '#E50914' }, // Netflix
        { label: '♫',  colour: '#1DB954' }, // Spotify
        { label: 'M',  colour: '#0074E4' }, // Max
        { label: 'D+', colour: '#113CCF' }, // Disney+
        { label: 'P',  colour: '#00A8E1' }, // Prime Video
        { label: 'G',  colour: '#F5001E' }, // Globoplay
        { label: 'A',  colour: '#FF9900' }, // Apple TV / Crunchyroll-ish accent
        { label: 'C',  colour: '#F47521' }  // Crunchyroll
    ];

    let bodies = [];

    function makeBodies() {
        const small = W < 700;
        const count = small ? 5 : 8;
        bodies = [];
        for (let i = 0; i < count; i++) {
            const src = LOGOS[i % LOGOS.length];
            const r = (small ? 15 : 21) + Math.random() * (small ? 6 : 10);
            bodies.push({
                x: r + Math.random() * Math.max(1, W - r * 2),
                y: r + Math.random() * Math.max(1, H - r * 2),
                // Slow drift — this is ambience, not a screensaver.
                vx: (Math.random() - 0.5) * 0.34,
                vy: (Math.random() - 0.5) * 0.34,
                r,
                label: src.label,
                colour: src.colour,
                spin: (Math.random() - 0.5) * 0.004,
                angle: Math.random() * Math.PI * 2
            });
        }
    }

    function stepBodies() {
        // Move + bounce off viewport edges.
        for (const b of bodies) {
            b.x += b.vx;
            b.y += b.vy;
            b.angle += b.spin;

            if (b.x - b.r < 0)      { b.x = b.r;      b.vx = Math.abs(b.vx); }
            else if (b.x + b.r > W) { b.x = W - b.r;  b.vx = -Math.abs(b.vx); }
            if (b.y - b.r < 0)      { b.y = b.r;      b.vy = Math.abs(b.vy); }
            else if (b.y + b.r > H) { b.y = H - b.r;  b.vy = -Math.abs(b.vy); }
        }

        // Circle-to-circle collisions. This is the part the old CSS version
        // could never do: logos genuinely bump off each other instead of
        // sliding through. Equal-mass elastic response along the collision
        // normal, plus a positional correction so overlapping pairs get
        // pushed apart rather than sticking together.
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const a = bodies[i], b = bodies[j];
                const dx = b.x - a.x, dy = b.y - a.y;
                const distSq = dx * dx + dy * dy;
                const minDist = a.r + b.r;
                if (distSq === 0 || distSq >= minDist * minDist) continue;

                const dist = Math.sqrt(distSq);
                const nx = dx / dist, ny = dy / dist;

                // Separate them so they don't overlap next frame.
                const overlap = (minDist - dist) / 2;
                a.x -= nx * overlap; a.y -= ny * overlap;
                b.x += nx * overlap; b.y += ny * overlap;

                // Exchange velocity along the normal. For equal masses an
                // elastic collision applies the FULL impulse to each body,
                // which swaps their normal-direction velocities. An earlier
                // version halved it, which is the perfectly INELASTIC case:
                // a head-on pair stopped dead on contact, and total energy
                // decayed toward zero, so the whole background would slowly
                // freeze. Verified by simulation before and after.
                const rvx = b.vx - a.vx, rvy = b.vy - a.vy;
                const velAlongNormal = rvx * nx + rvy * ny;
                if (velAlongNormal > 0) continue; // already separating
                const impulse = -velAlongNormal;
                a.vx -= impulse * nx; a.vy -= impulse * ny;
                b.vx += impulse * nx; b.vy += impulse * ny;
            }
        }
    }

    function drawBodies() {
        for (const b of bodies) {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.angle);

            // Soft brand-coloured halo
            ctx.beginPath();
            ctx.arc(0, 0, b.r, 0, Math.PI * 2);
            const g = ctx.createRadialGradient(0, 0, b.r * 0.2, 0, 0, b.r);
            g.addColorStop(0, b.colour + '55');
            g.addColorStop(1, b.colour + '00');
            ctx.fillStyle = g;
            ctx.fill();

            // Ring
            ctx.beginPath();
            ctx.arc(0, 0, b.r * 0.82, 0, Math.PI * 2);
            ctx.strokeStyle = b.colour + '66';
            ctx.lineWidth = 1.4;
            ctx.stroke();

            // Mark
            ctx.fillStyle = b.colour + 'cc';
            ctx.font = `900 ${Math.round(b.r * 0.85)}px Inter, Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(b.label, 0, 1);

            ctx.restore();
        }
    }

    function frame(now) {
        t = now || 0;
        ctx.clearRect(0, 0, W, H);
        drawBands();
        stepBodies();
        drawBodies();
        rafId = requestAnimationFrame(frame);
    }

    function renderStaticFrame() {
        ctx.clearRect(0, 0, W, H);
        drawBands();
        drawBodies();
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.floor(W * dpr);
        canvas.height = Math.floor(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        makeBodies();
        if (reduceMotion) renderStaticFrame();
    }

    function start() {
        if (reduceMotion || rafId !== null) return;
        rafId = requestAnimationFrame(frame);
    }
    function stop() {
        if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    }

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 180);
    });

    // Don't burn battery animating a background nobody is looking at.
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop(); else start();
    });

    resize();
    start();
})();
