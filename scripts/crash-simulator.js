/**
 * Crash Simulator - Interactive Risk Visualization
 * 
 * Logic:
 * - Listens to a slider input (0-100).
 * - Generates two SVG paths:
 *   1. Unprotected: Dips linearly/exponentially based on input.
 *   2. Protected: Flatlines (goes to cash) when drawdown exceeds threshold.
 */

document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('volatility-slider');
    if (!slider) return;

    const volatilityLabel = document.getElementById('volatility-label');
    const unprotectedPath = document.getElementById('crash-line-unprotected');
    const unprotectedArea = document.getElementById('crash-area-unprotected');
    const protectedPath = document.getElementById('crash-line-protected');
    const protectedArea = document.getElementById('crash-area-protected');
    const callout = document.getElementById('crash-callout');

    // Constants mapping to SVG ViewBox 0 0 800 350
    const WIDTH = 800;
    const HEIGHT = 350;
    const START_Y = 150; // 0% Baseline
    const STOP_LOSS_DELTA = 30; // ~10% Drop triggers cash
    const STOP_LOSS_Y = START_Y + STOP_LOSS_DELTA;

    function generatePaths(volatility) {
        // Volatility is 0 to 100
        const factor = volatility / 100;

        let unpPathStr = `M0,${START_Y}`;
        let protPathStr = `M0,${START_Y}`;

        let unpPoints = [[0, START_Y]];
        let protPoints = [[0, START_Y]];

        let isStoppedOut = false;
        let stopOutX = 0;

        // Generate points across X axis
        const steps = 20;
        const stepSize = WIDTH / steps;

        for (let i = 1; i <= steps; i++) {
            const x = i * stepSize;

            // MATH: Market Curve
            // Base sine wave for "market noise" + Volatility Drop
            // The drop is exponential based on X progress to simulate a crash accelerating
            const noise = Math.sin(x / 50) * 10;
            const crashDrop = (Math.pow(x / WIDTH, 2) * 200) * factor; // Max drop 200px at end

            let y = START_Y + noise + crashDrop;

            // Clamp to bounds
            y = Math.min(Math.max(y, 0), 350);

            unpPoints.push([x, y]);
            unpPathStr += ` L${x.toFixed(1)},${y.toFixed(1)}`;

            // Protected Logic
            if (!isStoppedOut) {
                if (y >= STOP_LOSS_Y) {
                    isStoppedOut = true;
                    stopOutX = x;
                    // Snap to cash line
                    protPoints.push([x, STOP_LOSS_Y]);
                    protPathStr += ` L${x.toFixed(1)},${STOP_LOSS_Y}`;
                } else {
                    protPoints.push([x, y]);
                    protPathStr += ` L${x.toFixed(1)},${y.toFixed(1)}`;
                }
            } else {
                // Stay in cash (flatline)
                protPoints.push([x, STOP_LOSS_Y]);
                protPathStr += ` L${x.toFixed(1)},${STOP_LOSS_Y}`;
            }
        }

        return {
            unpPath: unpPathStr,
            protPath: protPathStr,
            isStoppedOut,
            stopOutX,
            finalUnpY: unpPoints[unpPoints.length - 1][1]
        };
    }

    function updateChart() {
        const volatility = parseInt(slider.value);
        volatilityLabel.textContent = `${volatility}%`;

        const data = generatePaths(volatility);

        // Update Lines
        unprotectedPath.setAttribute('d', data.unpPath);
        protectedPath.setAttribute('d', data.protPath);

        // Update Areas (Close the loop)
        const closeLoop = ` L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;
        unprotectedArea.setAttribute('d', data.unpPath + closeLoop);
        protectedArea.setAttribute('d', data.protPath + closeLoop);

        // Update Callout ("Went to Cash")
        if (data.isStoppedOut) {
            callout.setAttribute('visibility', 'visible');
            // Move callout to the stop out point
            // data.stopOutX might be near 0 or 800
            let calloutX = Math.max(100, Math.min(data.stopOutX, 700));
            callout.setAttribute('transform', `translate(${calloutX}, ${STOP_LOSS_Y - 20})`);
        } else {
            // Hide if market didn't crash enough
            callout.setAttribute('visibility', 'hidden');
        }
    }

    // Init
    slider.addEventListener('input', updateChart);
    updateChart(); // First render
});
