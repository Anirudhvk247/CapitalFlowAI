// CapitalFlowAi Frontend Controller

// Ticker formatting with local currency symbol and code
function formatTickerValue(name, price) {
    if (price === null || price === undefined) return "--";
    
    // Check for flows
    if (name === "FII Net Flow" || name === "DII Net Flow" || name === "Total Net Flow") {
        const sign = price >= 0 ? "+₹" : "-₹";
        return `${sign}${Math.abs(price).toLocaleString()} Cr INR`;
    }
    
    // Format based on index/commodity
    const lowerName = name.toLowerCase();
    
    // Yields & VIX (no currency)
    if (lowerName.includes("yield") || lowerName === "vix" || lowerName.includes("bond")) {
        return `${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 3})}%`;
    }
    
    // Dollar Index (points)
    if (lowerName.includes("dollar index") || lowerName === "dxy") {
        return `${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} Pts`;
    }
    
    // Indian Equities / USD/INR Exchange rate
    if (lowerName.includes("nifty") || lowerName === "usd/inr") {
        return `₹${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} INR`;
    }
    
    // US / Commodities / Cryptos
    if (lowerName.includes("s&p 500") || lowerName.includes("nasdaq") || lowerName === "gold" || lowerName === "silver" || lowerName === "copper" || lowerName.includes("brent") || lowerName === "bitcoin" || lowerName === "ethereum") {
        return `$${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} USD`;
    }
    
    // European Indices
    if (lowerName.includes("ftse")) {
        return `£${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} GBP`;
    }
    if (lowerName.includes("cac 40") || lowerName.includes("stoxx")) {
        return `€${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} EUR`;
    }
    
    // Japanese Indices
    if (lowerName.includes("nikkei")) {
        return `¥${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} JPY`;
    }
    
    // Chinese Indices
    if (lowerName.includes("shanghai") || lowerName.includes("china")) {
        return `¥${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} CNY`;
    }
    
    // Taiwanese Indices
    if (lowerName.includes("taiex") || lowerName.includes("taiwan")) {
        return `NT$${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} TWD`;
    }
    
    // Fallback default
    return price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2});
}

// Toast Notifications Helper
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// Markdown Parser Helper
function markdownToHtml(md) {
    if (!md) return "";
    let lines = md.split('\n');
    let html = [];
    let inList = false;
    
    for (let line of lines) {
        let trimmed = line.trim();
        
        // Horizontal Rule
        if (trimmed === '---' || trimmed === '***' || trimmed === '===') {
            if (inList) { html.push('</ul>'); inList = false; }
            html.push('<hr>');
            continue;
        }
        
        // Headers
        if (trimmed.startsWith('# ')) {
            if (inList) { html.push('</ul>'); inList = false; }
            html.push(`<h1>${parseInline(trimmed.substring(2))}</h1>`);
            continue;
        }
        if (trimmed.startsWith('## ')) {
            if (inList) { html.push('</ul>'); inList = false; }
            html.push(`<h2>${parseInline(trimmed.substring(3))}</h2>`);
            continue;
        }
        if (trimmed.startsWith('### ')) {
            if (inList) { html.push('</ul>'); inList = false; }
            html.push(`<h3>${parseInline(trimmed.substring(4))}</h3>`);
            continue;
        }
        
        // Blockquote
        if (trimmed.startsWith('> ')) {
            if (inList) { html.push('</ul>'); inList = false; }
            html.push(`<blockquote>${parseInline(trimmed.substring(2))}</blockquote>`);
            continue;
        }
        
        // Unordered List Items
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            if (!inList) { html.push('<ul>'); inList = true; }
            html.push(`<li>${parseInline(trimmed.substring(2))}</li>`);
            continue;
        }
        
        // Ordered List Items
        let olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (olMatch) {
            if (inList) { html.push('</ul>'); inList = false; }
            html.push(`<p><strong>${olMatch[1]}.</strong> ${parseInline(olMatch[2])}</p>`);
            continue;
        }
        
        // Empty lines
        if (trimmed === '') {
            if (inList) { html.push('</ul>'); inList = false; }
            continue;
        }
        
        // Paragraph
        if (inList) { html.push('</ul>'); inList = false; }
        html.push(`<p>${parseInline(trimmed)}</p>`);
    }
    
    if (inList) { html.push('</ul>'); }
    
    return html.join('\n');
}

function parseInline(text) {
    let escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
        
    // Bold (**text**)
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic (*text*)
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Code (`code`)
    escaped = escaped.replace(/`(.*?)`/g, '<code>$1</code>');
    
    return escaped;
}

// Chart.js Manager
let activeCharts = {};

function renderChart(canvasId, config, type = 'bar') {
    if (!config) return;
    
    if (activeCharts[canvasId]) {
        activeCharts[canvasId].destroy();
    }
    
    const canvasElement = document.getElementById(canvasId);
    if (!canvasElement) return;
    
    const ctx = canvasElement.getContext('2d');
    
    // Premium theme options
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: canvasId !== 'equitiesChart' && canvasId !== 'commoditiesChart' && canvasId !== 'othersChart',
                labels: {
                    color: '#9ca3af',
                    font: { family: 'Plus Jakarta Sans', size: 11 }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(17, 25, 40, 0.95)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                titleFont: { family: 'Outfit', weight: 'bold' },
                bodyFont: { family: 'Plus Jakarta Sans' },
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            const dsLabel = context.dataset.label || '';
                            if (dsLabel.includes('% Change')) {
                                label += (context.parsed.y >= 0 ? '+' : '') + context.parsed.y.toFixed(2) + '%';
                            } else {
                                label += formatTickerValue(dsLabel || canvasId, context.parsed.y);
                            }
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.03)' },
                ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans', size: 10 } }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.03)' },
                ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans', size: 10 } }
            }
        }
    };
    
    // Handle dual scale axes for trends
    if (canvasId === 'indexTrendChart') {
        options.scales = {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.03)' },
                ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans', size: 10 } }
            },
            yNifty: {
                type: 'linear',
                position: 'left',
                grid: { color: 'rgba(255, 255, 255, 0.03)' },
                ticks: { color: '#10b981', font: { family: 'Plus Jakarta Sans', size: 10 } },
                title: { display: true, text: 'NIFTY 50', color: '#10b981', font: { family: 'Outfit', weight: 'bold' } }
            },
            ySpx: {
                type: 'linear',
                position: 'right',
                grid: { drawOnChartArea: false },
                ticks: { color: '#6366f1', font: { family: 'Plus Jakarta Sans', size: 10 } },
                title: { display: true, text: 'S&P 500', color: '#6366f1', font: { family: 'Outfit', weight: 'bold' } }
            }
        };
    }
    
    if (canvasId === 'monthlyAssetsChart') {
        options.scales = {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.03)' },
                ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans', size: 10 } }
            },
            yNifty: {
                type: 'linear',
                position: 'left',
                grid: { color: 'rgba(255, 255, 255, 0.03)' },
                ticks: { color: '#10b981', font: { family: 'Plus Jakarta Sans', size: 10 } },
                title: { display: true, text: 'NIFTY 50', color: '#10b981' }
            },
            ySpx: {
                type: 'linear',
                position: 'right',
                grid: { drawOnChartArea: false },
                ticks: { color: '#6366f1', font: { family: 'Plus Jakarta Sans', size: 10 } },
                title: { display: true, text: 'S&P 500', color: '#6366f1' }
            },
            yGold: {
                type: 'linear',
                position: 'right',
                grid: { drawOnChartArea: false },
                ticks: { color: '#fbbf24', font: { family: 'Plus Jakarta Sans', size: 10 } },
                title: { display: true, text: 'Gold', color: '#fbbf24' }
            },
            yBtc: {
                type: 'linear',
                position: 'left',
                grid: { drawOnChartArea: false },
                ticks: { color: '#ef4444', font: { family: 'Plus Jakarta Sans', size: 10 } },
                title: { display: true, text: 'Bitcoin', color: '#ef4444' }
            }
        };
    }
    
    const datasets = config.datasets || [];
    // Inject nice gradient fill or styles if needed
    
    activeCharts[canvasId] = new Chart(ctx, {
        type: type,
        data: {
            labels: config.labels,
            datasets: datasets
        },
        options: options
    });
}

// Loader overlay helpers
function showLoader(text = 'Syncing latest global market data...') {
    const loader = document.getElementById('loaderOverlay');
    const loaderText = document.getElementById('loaderText');
    if (loader) {
        if (loaderText) loaderText.textContent = text;
        loader.classList.add('active');
    }
}

function hideLoader() {
    const loader = document.getElementById('loaderOverlay');
    if (loader) {
        loader.classList.remove('active');
    }
}

// Global API Actions
async function triggerSync(targetDate = null) {
    showLoader('Remotely calling Twelve Data and Upstox APIs...');
    try {
        const response = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: targetDate })
        });
        const result = await response.json();
        if (result.status === 'success') {
            showToast(result.message, 'success');
            // Refresh data
            if (typeof loadPageData === 'function') {
                await loadPageData();
            } else {
                location.reload();
            }
        } else {
            showToast(result.message || 'Sync failed', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Network error triggering database sync', 'error');
    } finally {
        hideLoader();
    }
}

// Load metadata dates for calendar limits
async function loadCalendarLimits() {
    try {
        const response = await fetch('/api/meta/dates');
        const result = await response.json();
        if (result.status === 'success') {
            const dateInput = document.getElementById('archiveDateInput');
            if (dateInput && result.dates.length > 0) {
                const latestDate = result.dates[0];
                const oldestDate = result.dates[result.dates.length - 1];
                
                if (window.flatpickr) {
                    // Initialize Flatpickr on date input
                    window.dailyFlatpickrInstance = flatpickr(dateInput, {
                        defaultDate: latestDate,
                        minDate: oldestDate,
                        maxDate: latestDate,
                        enable: result.dates, // restrict users to only dates with actual data
                        dateFormat: "Y-m-d",
                        theme: "dark",
                        locale: {
                            firstDayOfWeek: 1
                        }
                    });
                } else {
                    dateInput.max = latestDate;
                    dateInput.min = oldestDate;
                    dateInput.value = latestDate;
                }
            }
            
            const monthInput = document.getElementById('archiveMonthInput');
            if (monthInput && result.months.length > 0) {
                const latestMonth = result.months[0];
                const oldestMonth = result.months[result.months.length - 1];
                
                const formatMonth = (m) => `${m.year}-${String(m.month).padStart(2, '0')}`;
                
                if (window.flatpickr && window.monthSelectPlugin) {
                    // Initialize Flatpickr with monthSelectPlugin
                    window.monthlyFlatpickrInstance = flatpickr(monthInput, {
                        defaultDate: formatMonth(latestMonth),
                        plugins: [
                            new monthSelectPlugin({
                                shorthand: true,
                                dateFormat: "Y-m",
                                altFormat: "F Y",
                                theme: "dark"
                            })
                        ]
                    });
                } else {
                    monthInput.max = formatMonth(latestMonth);
                    monthInput.min = formatMonth(oldestMonth);
                    monthInput.value = formatMonth(latestMonth);
                }
            }
        }
    } catch (e) {
        console.error("Failed loading calendar limits:", e);
    }
}

// Bind Global Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Sync buttons
    const syncBtn = document.getElementById('headerSyncBtn');
    if (syncBtn) {
        syncBtn.addEventListener('click', () => triggerSync());
    }
    
    // Auto-load selector limits on historical pages
    if (document.getElementById('archiveDateInput') || document.getElementById('archiveMonthInput')) {
        loadCalendarLimits();
    }
});
