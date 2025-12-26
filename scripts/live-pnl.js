/**
 * LiveTicker - Manages the "Heartbeat" simulation for the Trade Conductor Landing Page
 *
 * Strategy:
 * - Updates occur on randomized intervals (800ms - 2400ms) to simulate stochastic market data.
 * - Uses a "Drift & Revert" algorithm to keep the value realistic (-0.05% to +0.05% range).
 * - Applies a visual "Flash" effect on update to simulate a terminal feed.
 */

class LiveTicker {
    constructor(config) {
        this.startValue = config.startValue || 388752.65;
        this.currentValue = this.startValue;
        this.volatility = config.volatility || 5.00; // Max swing per tick (+/- $5.00)
        this.driftBias = 0;
        this.containers = {
            value: document.getElementById('live-value-display'),
            pnl: document.getElementById('live-pnl-display'),
            widget: document.querySelector('.live-dashboard-widget')
        };

        // Formatters
        this.currencyFormatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        this.init();
    }

    init() {
        this.updateDOM();
        this.scheduleNextTick();
    }

    getNextInterval() {
        // Strategy: Randomized intervals (800ms - 2400ms) for robotic precision
        const min = 800;
        const max = 2400;
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    calculateNextValue() {
        const direction = Math.random() > 0.5 ? 1 : -1;
        // Slight random variation (+/- $0.05 to $5.00)
        let change = (Math.random() * this.volatility) + 0.05;

        // Trend Bias
        if (Math.random() > 0.9) {
            this.driftBias = Math.random() > 0.5 ? 0.5 : -0.5;
        }
        change += this.driftBias;

        // Reversion
        const diff = this.currentValue - this.startValue;
        if (Math.abs(diff) > 500) {
            change = -1 * (diff * 0.1);
        }

        this.currentValue += (change * direction);
    }

    updateDOM() {
        if (!this.containers.value) return;

        // Update Value
        this.containers.value.textContent = this.currencyFormatter.format(this.currentValue);

        // Flash Effect on Background
        // We target the value container itself for the background flash
        this.containers.value.classList.remove('data-flash');
        void this.containers.value.offsetWidth; // Trigger reflow
        this.containers.value.classList.add('data-flash');

        // Update PnL
        const openValue = 387474.12;
        const diff = this.currentValue - openValue;
        const pct = (diff / openValue) * 100;
        const sign = diff >= 0 ? '+' : '';

        if (this.containers.pnl) {
            this.containers.pnl.textContent = `${sign}${pct.toFixed(2)}% (${sign}$${Math.abs(diff).toFixed(2)})`;
            this.containers.pnl.className = diff >= 0 ? 'text-green' : 'text-red';
        }
    }

    scheduleNextTick() {
        setTimeout(() => {
            this.calculateNextValue();
            this.updateDOM();
            this.scheduleNextTick();
        }, this.getNextInterval());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('live-value-display')) {
        new LiveTicker({
            startValue: 388752.65,
            volatility: 5.00
        });
    }
});
