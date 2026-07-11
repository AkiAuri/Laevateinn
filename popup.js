const laymanDictionary = {
    "color-contrast": { en: "The text doesn't stand out enough from the background, making it hard to read.", tl: "Hindi masyadong halata ang text sa background, kaya mahirap itong basahin." },
    "image-alt": { en: "This image is missing a text description, which is needed for visually impaired users.", tl: "Walang text na naglalarawan sa larawang ito, na kailangan ng mga bulag na gumagamit." },
    "button-name": { en: "This button doesn't have a clear name, so screen readers won't know what it does.", tl: "Walang malinaw na pangalan ang button na ito, kaya hindi malalaman ng screen readers kung ano ang silbi nito." },
    "landmark-one-main": { en: "The page is missing a main landmark (<main> tag), making it hard for screen readers to find the primary content.", tl: "Walang pangunahing landmark (<main> tag) ang pahina, kaya mahirap hanapin ang nilalaman para sa screen readers." },
    "region": { en: "Some content is placed outside of structural landmarks (like headers or footers), which can confuse navigation tools.", tl: "May mga nilalaman na nasa labas ng mga landmark, na maaaring makalito sa mga navigation tools." }
};

let currentLang = 'en';
let lastResults = null;
let activeTabId = null;
let activeTabTitle = "";
let activeTabUrl = "";
let currentScore = 100;

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getLaymanText(violation) {
    if (laymanDictionary[violation.id]) return laymanDictionary[violation.id][currentLang];
    return violation.description;
}

document.getElementById('languageToggle').addEventListener('change', (e) => {
    currentLang = e.target.checked ? 'tl' : 'en';
    if (lastResults) renderResults(lastResults);
});

document.getElementById('scanButton').addEventListener('click', async () => {
    const container = document.getElementById('results-container');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const exportBtn = document.getElementById('exportPdfButton');

    container.innerHTML = `<p style="text-align:center;">Scanning...</p>`;
    scoreDisplay.style.display = 'none';
    exportBtn.style.display = 'none';

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTabId = tab.id;
    activeTabTitle = tab.title;
    activeTabUrl = tab.url;

    await chrome.scripting.executeScript({ target: { tabId: activeTabId }, files: ['axe.min.js'] });

    chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        func: runAxeAndHighlightErrors
    }, (injectionResults) => {
        if (injectionResults && injectionResults[0].result) {
            lastResults = injectionResults[0].result;
            renderResults(lastResults);
        }
    });
});

document.getElementById('exportPdfButton').addEventListener('click', () => {
    if (lastResults) generatePDFReport(lastResults, currentScore);
});

function renderResults(violations) {
    const container = document.getElementById('results-container');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const exportBtn = document.getElementById('exportPdfButton');
    container.innerHTML = '';

    let deduction = 0;
    violations.forEach(v => {
        let weight = v.impact === 'critical' ? 10 : v.impact === 'serious' ? 5 : v.impact === 'moderate' ? 2 : 1;
        deduction += (weight * v.nodes.length);
    });

    currentScore = Math.max(0, 100 - deduction);

    scoreDisplay.style.display = 'block';
    scoreDisplay.innerText = `Score: ${currentScore}/100`;
    if (currentScore >= 90) { scoreDisplay.style.backgroundColor = '#d4edda'; scoreDisplay.style.color = '#155724'; }
    else if (currentScore >= 70) { scoreDisplay.style.backgroundColor = '#fff3cd'; scoreDisplay.style.color = '#856404'; }
    else { scoreDisplay.style.backgroundColor = '#f8d7da'; scoreDisplay.style.color = '#721c24'; }

    if (violations.length === 0) {
        container.innerHTML = `<p style="text-align:center; color: green;">No errors found!</p>`;
        return;
    }

    exportBtn.style.display = 'block';

    violations.forEach(violation => {
        const laymanText = getLaymanText(violation);
        const card = document.createElement('div');
        card.className = `error-card card-${violation.impact}`;
        const totalOccurrences = violation.nodes.length;

        const firstNodeSelector = violation.nodes[0].target.join(', ');
        const firstNodeHtml = escapeHtml(violation.nodes[0].html);

        card.innerHTML = `
          <div class="error-title">${violation.help}</div>
          <div class="error-desc">${laymanText}</div>
          <div style="margin-top: 5px; font-size: 11px; color: #888; margin-bottom: 8px;">
            Impact: <strong style="text-transform: capitalize; color: #333;">${violation.impact}</strong> | Occurrences: ${totalOccurrences} 
            <span class="occurrence-tracker" style="display: none; font-weight: bold; color: #1890ff; margin-left: 5px;"></span>
          </div>
          
          <details style="margin-top: 8px; font-size: 11px; background: #f9f9f9; padding: 6px; border-radius: 4px; border: 1px solid #ddd;" onclick="event.stopPropagation();">
            <summary>Developer Details (Technical)</summary>
            <div style="margin-top: 8px;"><strong>Selector:</strong> <code style="background:#eee; padding:2px 4px; border-radius:3px;">${firstNodeSelector}</code></div>
            <div style="margin-top: 5px;"><strong>Code Snippet:</strong>
              <pre style="background: #272822; color: #f8f8f2; padding: 6px; border-radius: 3px; overflow-x: auto; margin: 3px 0;">${firstNodeHtml}</pre>
            </div>
            <div style="margin-top: 5px;"><a href="${violation.helpUrl}" target="_blank" style="color: #1890ff; text-decoration: none;">View Official Documentation &rarr;</a></div>
          </details>
        `;

        let currentIndex = 0;
        const trackerSpan = card.querySelector('.occurrence-tracker');

        card.addEventListener('click', () => {
            const targetSelectorArray = violation.nodes[currentIndex].target;
            if (totalOccurrences > 1) {
                trackerSpan.style.display = 'inline';
                trackerSpan.innerText = `(Focusing: ${currentIndex + 1} of ${totalOccurrences})`;
            }
            chrome.scripting.executeScript({
                target: { tabId: activeTabId },
                func: jumpToElement,
                args: [targetSelectorArray]
            });
            currentIndex = (currentIndex + 1) % totalOccurrences;
        });

        container.appendChild(card);
    });
}

function generatePDFReport(violations, score) {
    const grouped = { critical: [], serious: [], moderate: [], minor: [] };
    let stats = { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 };
    let categories = { "Design & Color": 0, "Keyboard & Nav": 0, "Forms & Inputs": 0, "Screen Readers & ARIA": 0, "Structure & Layout": 0, "Other": 0 };

    violations.forEach(v => {
        let count = v.nodes.length;
        if (grouped[v.impact]) {
            grouped[v.impact].push(v);
            stats[v.impact] += count;
        } else {
            grouped.minor.push(v);
            stats.minor += count;
        }
        stats.total += count;

        // Categorize for Management pie charts
        let tags = v.tags || [];
        if (tags.includes('cat.color')) categories["Design & Color"] += count;
        else if (tags.includes('cat.keyboard') || tags.includes('cat.navigation')) categories["Keyboard & Nav"] += count;
        else if (tags.includes('cat.forms')) categories["Forms & Inputs"] += count;
        else if (tags.includes('cat.aria') || tags.includes('cat.name-role-value')) categories["Screen Readers & ARIA"] += count;
        else if (tags.includes('cat.structure')) categories["Structure & Layout"] += count;
        else categories["Other"] += count;
    });

    // Calculate conic-gradient for the pie chart
    let critPct = (stats.critical / stats.total) * 100 || 0;
    let serPct = (stats.serious / stats.total) * 100 || 0;
    let modPct = (stats.moderate / stats.total) * 100 || 0;
    let minPct = (stats.minor / stats.total) * 100 || 0;

    let serStart = critPct;
    let modStart = serStart + serPct;
    let minStart = modStart + modPct;

    let pieChartCSS = `conic-gradient(
        #ff4d4f 0% ${critPct}%, 
        #faad14 ${serStart}% ${serStart + serPct}%, 
        #fadb14 ${modStart}% ${modStart + modPct}%, 
        #1890ff ${minStart}% 100%
    )`;

    let htmlContent = `
    <html>
    <head>
        <title>Accessibility Audit - ${activeTabTitle}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; }
            h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 5px; }
            .meta-info { text-align: center; color: #555; margin-bottom: 20px; font-size: 14px; }
            .score-box { text-align: center; font-size: 24px; font-weight: bold; padding: 15px; background: ${score >= 90 ? '#d4edda' : score >= 70 ? '#fff3cd' : '#f8d7da'}; color: ${score >= 90 ? '#155724' : score >= 70 ? '#856404' : '#721c24'}; border-radius: 8px; margin: 20px 0; }
            
            /* Dashboard Grid */
            .dashboard { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ddd; }
            .chart-container { text-align: center; width: 45%; }
            .pie-chart { width: 150px; height: 150px; border-radius: 50%; background: ${pieChartCSS}; margin: 0 auto 15px auto; border: 2px solid #fff; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
            .legend span { display: inline-block; padding: 3px 8px; color: white; border-radius: 3px; font-size: 12px; margin: 2px; text-transform: uppercase;}
            
            .category-stats { width: 50%; font-size: 14px; }
            .cat-row { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 6px 0; }
            .cat-row:last-child { border: none; }
            
            .category-header { font-size: 20px; font-weight: bold; margin-top: 30px; padding: 8px 12px; color: white; border-radius: 4px; text-transform: capitalize; }
            .critical { background-color: #ff4d4f; } .serious { background-color: #faad14; } .moderate { background-color: #fadb14; color: #333; } .minor { background-color: #1890ff; }
            
            .issue-block { border-left: 4px solid #ccc; padding-left: 15px; margin-bottom: 30px; page-break-inside: avoid; }
            .issue-title { font-size: 16px; font-weight: bold; margin-bottom: 5px; color: #222; }
            .issue-desc { font-style: italic; margin-bottom: 10px; color: #666; background: #f0f0f0; padding: 10px; border-radius: 4px; }
            
            .node-box { background: #fff; border: 1px solid #ddd; padding: 10px; border-radius: 4px; margin-top: 10px; font-family: monospace; font-size: 12px; }
            .node-box strong { font-family: Arial, sans-serif; color: #333; }
            pre { background: #272822; color: #f8f8f2; padding: 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; margin-top: 5px; }
            a { color: #1890ff; text-decoration: none; font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>Accessibility Audit Report</h1>
        <div class="meta-info">
            <strong>Site:</strong> ${activeTabTitle} <br>
            <strong>URL:</strong> <a href="${activeTabUrl}" target="_blank">${activeTabUrl}</a> <br>
            <strong>Date Generated:</strong> ${new Date().toLocaleString()}
        </div>
        
        <div class="score-box">Overall Accessibility Score: ${score}/100</div>
        
        <div class="dashboard">
            <div class="chart-container">
                <h3 style="margin-top:0;">Severity Breakdown</h3>
                <div class="pie-chart"></div>
                <div class="legend">
                    <span style="background:#ff4d4f">Crit: ${stats.critical}</span>
                    <span style="background:#faad14">Ser: ${stats.serious}</span>
                    <span style="background:#fadb14; color:#333;">Mod: ${stats.moderate}</span>
                    <span style="background:#1890ff">Min: ${stats.minor}</span>
                </div>
            </div>
            <div class="category-stats">
                <h3 style="margin-top:0;">Prominent Issue Types</h3>
                ${Object.entries(categories).sort((a,b) => b[1]-a[1]).map(([name, count]) => `
                    <div class="cat-row">
                        <strong>${name}:</strong> 
                        <span style="background: #eee; padding: 2px 8px; border-radius: 12px;">${count} instances</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    ['critical', 'serious', 'moderate', 'minor'].forEach(impactLevel => {
        if (grouped[impactLevel].length === 0) return;

        htmlContent += `<div class="category-header ${impactLevel}">${impactLevel} Issues</div>`;

        grouped[impactLevel].forEach(v => {
            htmlContent += `
            <div class="issue-block">
                <div class="issue-title">${v.help}</div>
                <div class="issue-desc">" ${getLaymanText(v)} " <br><br>
                <a href="${v.helpUrl}" target="_blank">View Developer & WCAG Documentation &rarr;</a></div>
            `;

            // Removed the Math.min cap to show ALL instances for programmers
            v.nodes.forEach((node, index) => {
                htmlContent += `
                <div class="node-box">
                    <strong>Instance ${index + 1} Selector:</strong> <br>${node.target.join(', ')}<br><br>
                    <strong>Failing HTML Snippet:</strong>
                    <pre>${escapeHtml(node.html)}</pre>
                </div>`;
            });
            htmlContent += `</div>`;
        });
    });

    htmlContent += `</body></html>`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
}

// --- INJECTED FUNCTIONS (Runs inside the Webpage) ---
async function runAxeAndHighlightErrors() {
    const results = await axe.run();

    document.querySelectorAll('[data-axe-highlighted]').forEach(el => {
        el.style.backgroundColor = '';
        el.style.outline = '';
        delete el.dataset.axeHighlighted;
    });

    results.violations.forEach(violation => {
        let bgColor, outlineColor;
        switch(violation.impact) {
            case 'critical': bgColor = 'rgba(255, 77, 79, 0.2)'; outlineColor = '3px solid #ff4d4f'; break;
            case 'serious': bgColor = 'rgba(250, 173, 20, 0.2)'; outlineColor = '3px solid #faad14'; break;
            case 'moderate': bgColor = 'rgba(250, 219, 20, 0.2)'; outlineColor = '3px solid #fadb14'; break;
            case 'minor': bgColor = 'rgba(24, 144, 255, 0.2)'; outlineColor = '3px solid #1890ff'; break;
            default: bgColor = 'rgba(255, 77, 79, 0.2)'; outlineColor = '3px solid #ff4d4f';
        }

        violation.nodes.forEach(node => {
            const selector = node.target.join(',');
            const elements = document.querySelectorAll(selector);

            elements.forEach(el => {
                el.style.backgroundColor = bgColor;
                el.style.outline = outlineColor;
                el.style.outlineOffset = '2px';
                el.dataset.axeHighlighted = "true";
                el.dataset.originalBg = bgColor;
                el.dataset.originalOutline = outlineColor;
            });
        });
    });

    return results.violations;
}

function jumpToElement(targetSelectorArray) {
    const selector = targetSelectorArray.join(',');
    const element = document.querySelector(selector);

    if (element) {
        // 1. Instantly clear ANY currently focused element on the page
        const previousFocused = document.querySelector('[data-axe-active-focus="true"]');
        if (previousFocused) {
            previousFocused.style.backgroundColor = previousFocused.dataset.originalBg || '';
            previousFocused.style.outline = previousFocused.dataset.originalOutline || '';
            delete previousFocused.dataset.axeActiveFocus;
            if (previousFocused.dataset.focusTimeout) {
                clearTimeout(parseInt(previousFocused.dataset.focusTimeout));
            }
        }

        // 2. Scroll to the new element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // 3. Highlight the new element
        element.style.backgroundColor = 'rgba(156, 39, 176, 0.4)';
        element.style.outline = '4px solid #9c27b0';
        element.dataset.axeActiveFocus = "true";

        // 4. Set a fresh timeout tied to this specific element
        const timeoutId = setTimeout(() => {
            if (element.dataset.axeActiveFocus === "true") {
                element.style.backgroundColor = element.dataset.originalBg || '';
                element.style.outline = element.dataset.originalOutline || '';
                delete element.dataset.axeActiveFocus;
            }
        }, 2500);

        element.dataset.focusTimeout = timeoutId.toString();
    }
}