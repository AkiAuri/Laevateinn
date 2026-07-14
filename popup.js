let lastResults = null;
let activeTabId = null;
let activeTabTitle = "";
let activeTabUrl = "";
let currentScore = 100;
let isDarkMode = false;

document.getElementById('themeToggle').addEventListener('change', (e) => {
    isDarkMode = e.target.checked;
    document.body.classList.toggle('dark-mode', isDarkMode);
});

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 1. NEW: Load saved state when popup opens
document.addEventListener('DOMContentLoaded', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTabId = tab.id;
    activeTabTitle = tab.title;
    activeTabUrl = tab.url;

    chrome.storage.local.get("odinCurrentState", (result) => {
        if (result.odinCurrentState && result.odinCurrentState.url === activeTabUrl) {
            lastResults = result.odinCurrentState.violations;
            currentScore = result.odinCurrentState.score;
            renderResults(lastResults);
        }
    });
});

document.getElementById('scanButton').addEventListener('click', async () => {
    const container = document.getElementById('results-container');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const exportBtn = document.getElementById('exportPdfButton');
    const filterContainer = document.getElementById('filterContainer');

    container.innerHTML = `<p style="text-align:center;">Scanning...</p>`;
    scoreDisplay.style.display = 'none';
    exportBtn.style.display = 'none';
    filterContainer.style.display = 'none';

    await chrome.scripting.executeScript({ target: { tabId: activeTabId }, files: ['axe.min.js'] });

    chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        func: runAxeAndHighlightErrors
    }, (injectionResults) => {
        if (injectionResults && injectionResults[0].result) {
            lastResults = injectionResults[0].result;

            // Recalculate Score
            let deduction = 0;
            lastResults.forEach(v => {
                let weight = v.impact === 'critical' ? 10 : v.impact === 'serious' ? 5 : v.impact === 'moderate' ? 2 : 1;
                deduction += (weight * v.nodes.length);
            });
            currentScore = Math.max(0, 100 - deduction);

            // 2. NEW: Save results to storage immediately after scanning
            chrome.storage.local.set({
                odinCurrentState: {
                    url: activeTabUrl,
                    title: activeTabTitle,
                    score: currentScore,
                    violations: lastResults
                }
            }, () => {
                renderResults(lastResults);
            });
        }
    });
});

document.querySelectorAll('.sev-filter').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        if (!lastResults) return;
        const activeSeverities = Array.from(document.querySelectorAll('.sev-filter:checked')).map(cb => cb.value);

        document.querySelectorAll('.error-card').forEach(card => {
            const isVisible = activeSeverities.some(sev => card.classList.contains(`card-${sev}`));
            card.style.display = isVisible ? 'block' : 'none';
        });

        chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            func: updateWebpageHighlights,
            args: [activeSeverities]
        });
    });
});

document.getElementById('exportPdfButton').addEventListener('click', () => {
    if (lastResults) {
        // Send state to report page
        chrome.storage.local.set({
            odinReportData: {
                title: activeTabTitle,
                url: activeTabUrl,
                score: currentScore,
                violations: lastResults
            }
        }, () => {
            chrome.tabs.create({ url: chrome.runtime.getURL("report.html") });
        });
    }
});

function renderResults(violations) {
    const container = document.getElementById('results-container');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const exportBtn = document.getElementById('exportPdfButton');
    const filterContainer = document.getElementById('filterContainer');
    container.innerHTML = '';

    scoreDisplay.style.display = 'block';
    scoreDisplay.innerText = `Score: ${currentScore}/100`;
    if (currentScore >= 90) { scoreDisplay.style.backgroundColor = '#d4edda'; scoreDisplay.style.color = '#155724'; }
    else if (currentScore >= 70) { scoreDisplay.style.backgroundColor = '#fff3cd'; scoreDisplay.style.color = '#856404'; }
    else { scoreDisplay.style.backgroundColor = '#f8d7da'; scoreDisplay.style.color = '#721c24'; }

    if (violations.length === 0) {
        container.innerHTML = `<p style="text-align:center; color: #4CAF50; font-weight:bold;">No accessibility errors found!</p>`;
        return;
    }

    exportBtn.style.display = 'block';
    exportBtn.innerText = "View & Download Report";
    filterContainer.style.display = 'flex';

    violations.forEach(violation => {
        const card = document.createElement('div');
        card.className = `error-card card-${violation.impact}`;
        const totalOccurrences = violation.nodes.length;
        const firstNodeSelector = escapeHtml(violation.nodes[0].target.join(', '));
        const firstNodeHtml = escapeHtml(violation.nodes[0].html);

        card.innerHTML = `
          <div class="error-title">${escapeHtml(violation.help)}</div>
          <div class="error-desc">${escapeHtml(getLaymanText(violation))}</div>
          <div style="margin-top: 5px; font-size: 11px; margin-bottom: 8px;">
            Impact: <strong style="text-transform: capitalize;">${violation.impact}</strong> | Occurrences: ${totalOccurrences} 
            <span class="occurrence-tracker" style="display: none; font-weight: bold; color: #1890ff; margin-left: 5px;"></span>
          </div>
          <details style="margin-top: 8px; font-size: 11px; padding: 6px; border-radius: 4px; border: 1px solid var(--border-color);" onclick="event.stopPropagation();">
            <summary>Developer Details (Technical)</summary>
            <div style="margin-top: 8px;"><strong>Selector:</strong> <code>${firstNodeSelector}</code></div>
            <div style="margin-top: 5px;"><strong>Code Snippet:</strong>
              <pre style="background: #272822; color: #f8f8f2; padding: 6px; border-radius: 3px; overflow-x: auto; margin: 3px 0;">${firstNodeHtml}</pre>
            </div>
            <div style="margin-top: 5px;"><a href="${violation.helpUrl}" target="_blank" style="color: #1890ff; text-decoration: none;">View Docs &rarr;</a></div>
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

// --- INJECTED FUNCTIONS (Runs inside the Webpage) ---
async function runAxeAndHighlightErrors() {

    // 3. NEW: Rigorous Cleanup BEFORE scanning to prevent Axe score shifting
    document.querySelectorAll('[data-axe-highlighted="true"]').forEach(el => {
        // Restore exact original style string to prevent false contrast errors
        if (el.hasAttribute('data-original-style')) {
            el.setAttribute('style', el.getAttribute('data-original-style'));
        } else {
            el.removeAttribute('style');
        }
        // Wipe custom attributes
        el.removeAttribute('data-axe-highlighted');
        el.removeAttribute('data-axe-severity');
        el.removeAttribute('data-original-style');
        el.removeAttribute('data-axe-bg-color');
        el.removeAttribute('data-axe-outline-color');
    });

    const results = await axe.run();

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
                // Save original inline style string BEFORE applying highlights
                if (!el.hasAttribute('data-original-style')) {
                    el.setAttribute('data-original-style', el.getAttribute('style') || '');
                }

                el.style.backgroundColor = bgColor;
                el.style.outline = outlineColor;
                el.style.outlineOffset = '2px';

                // Save state data for the filter toggles
                el.dataset.axeHighlighted = "true";
                el.dataset.axeSeverity = violation.impact;
                el.dataset.axeBgColor = bgColor;
                el.dataset.axeOutlineColor = outlineColor;
            });
        });
    });

    return results.violations;
}

function updateWebpageHighlights(activeSeverities) {
    document.querySelectorAll('[data-axe-highlighted="true"]').forEach(el => {
        if (activeSeverities.includes(el.dataset.axeSeverity)) {
            // Restore Highlight
            el.style.backgroundColor = el.dataset.axeBgColor;
            el.style.outline = el.dataset.axeOutlineColor;
            el.style.outlineOffset = '2px';
        } else {
            // Hide Highlight by restoring original style
            if (el.hasAttribute('data-original-style')) {
                el.setAttribute('style', el.getAttribute('data-original-style'));
            } else {
                el.removeAttribute('style');
            }
        }
    });
}

function jumpToElement(targetSelectorArray) {
    const selector = targetSelectorArray.join(',');
    const element = document.querySelector(selector);

    if (element) {
        const previousFocused = document.querySelector('[data-axe-active-focus="true"]');
        if (previousFocused) {
            if (previousFocused.hasAttribute('data-original-style')) {
                previousFocused.setAttribute('style', previousFocused.getAttribute('data-original-style'));
            } else {
                previousFocused.removeAttribute('style');
            }
            previousFocused.removeAttribute('data-axe-active-focus');
            if (previousFocused.dataset.focusTimeout) clearTimeout(parseInt(previousFocused.dataset.focusTimeout));
        }

        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.backgroundColor = 'rgba(156, 39, 176, 0.4)';
        element.style.outline = '4px solid #9c27b0';
        element.dataset.axeActiveFocus = "true";

        const timeoutId = setTimeout(() => {
            if (element.dataset.axeActiveFocus === "true") {
                if (element.hasAttribute('data-original-style')) {
                    element.setAttribute('style', element.getAttribute('data-original-style'));
                } else {
                    element.removeAttribute('style');
                }
                element.removeAttribute('data-axe-active-focus');
            }
        }, 2500);

        element.dataset.focusTimeout = timeoutId.toString();
    }
}