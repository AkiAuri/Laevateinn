const laymanDictionary = {
    "color-contrast": {
        en: "The text doesn't stand out enough from the background, making it hard to read.",
        tl: "Hindi masyadong halata ang text sa background, kaya mahirap itong basahin."
    },
    "image-alt": {
        en: "This image is missing a text description, which is needed for visually impaired users.",
        tl: "Walang text na naglalarawan sa larawang ito, na kailangan ng mga bulag na gumagamit."
    },
    "button-name": {
        en: "This button doesn't have a clear name, so screen readers won't know what it does.",
        tl: "Walang malinaw na pangalan ang button na ito, kaya hindi malalaman ng screen readers kung ano ang silbi nito."
    },
    "landmark-one-main": {
        en: "The page is missing a main landmark (<main> tag), making it hard for screen readers to find the primary content.",
        tl: "Walang pangunahing landmark (<main> tag) ang pahina, kaya mahirap hanapin ang nilalaman para sa screen readers."
    },
    "region": {
        en: "Some content is placed outside of structural landmarks (like headers or footers), which can confuse navigation tools.",
        tl: "May mga nilalaman na nasa labas ng mga landmark, na maaaring makalito sa mga navigation tools."
    }
};

let currentLang = 'en';
let lastResults = null;
let activeTabId = null;

function getLaymanText(ruleId) {
    if (laymanDictionary[ruleId]) {
        return laymanDictionary[ruleId][currentLang];
    }
    return currentLang === 'en' ? `Accessibility issue: ${ruleId}` : `Isyu sa accessibility: ${ruleId}`;
}

document.getElementById('languageToggle').addEventListener('change', (e) => {
    currentLang = e.target.checked ? 'tl' : 'en';
    if (lastResults) renderResults(lastResults);
});

document.getElementById('scanButton').addEventListener('click', async () => {
    const container = document.getElementById('results-container');
    const scoreDisplay = document.getElementById('scoreDisplay');
    container.innerHTML = `<p style="text-align:center;">Scanning...</p>`;
    scoreDisplay.style.display = 'none';

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTabId = tab.id;

    await chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        files: ['axe.min.js']
    });

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

function renderResults(violations) {
    const container = document.getElementById('results-container');
    const scoreDisplay = document.getElementById('scoreDisplay');
    container.innerHTML = '';

    // 1. Calculate Score based on impact weights
    let deduction = 0;
    violations.forEach(v => {
        let weight = 0;
        if (v.impact === 'critical') weight = 10;
        if (v.impact === 'serious') weight = 5;
        if (v.impact === 'moderate') weight = 2;
        if (v.impact === 'minor') weight = 1;

        // Deduct points for every single node that fails
        deduction += (weight * v.nodes.length);
    });

    let score = Math.max(0, 100 - deduction);

    // 2. Render Score UI
    scoreDisplay.style.display = 'block';
    scoreDisplay.innerText = `Score: ${score}/100`;
    if (score >= 90) { scoreDisplay.style.backgroundColor = '#d4edda'; scoreDisplay.style.color = '#155724'; }
    else if (score >= 70) { scoreDisplay.style.backgroundColor = '#fff3cd'; scoreDisplay.style.color = '#856404'; }
    else { scoreDisplay.style.backgroundColor = '#f8d7da'; scoreDisplay.style.color = '#721c24'; }

    if (violations.length === 0) {
        container.innerHTML = `<p style="text-align:center; color: green;">No errors found!</p>`;
        return;
    }

    // 3. Render Cards
    violations.forEach(violation => {
        const laymanText = getLaymanText(violation.id);
        const card = document.createElement('div');
        card.className = `error-card card-${violation.impact}`;

        card.innerHTML = `
      <div class="error-title">${violation.help}</div>
      <div class="error-desc">${laymanText}</div>
      <div style="margin-top: 5px; font-size: 11px; color: #888;">Impact: ${violation.impact.toUpperCase()} | Occurrences: ${violation.nodes.length}</div>
    `;

        // 4. Add Click-to-Jump functionality
        card.addEventListener('click', () => {
            // Pass the CSS selector of the FIRST instance of this error
            const targetSelectorArray = violation.nodes[0].target;

            chrome.scripting.executeScript({
                target: { tabId: activeTabId },
                func: jumpToElement,
                args: [targetSelectorArray]
            });
        });

        container.appendChild(card);
    });
}

// --- INJECTED FUNCTIONS (Runs inside the Webpage) ---

async function runAxeAndHighlightErrors() {
    const results = await axe.run();

    // Clean up any old highlights before running again
    document.querySelectorAll('[data-axe-highlighted]').forEach(el => {
        el.style.backgroundColor = '';
        el.style.outline = '';
        delete el.dataset.axeHighlighted;
    });

    results.violations.forEach(violation => {
        let bgColor, outlineColor;
        switch(violation.impact) {
            case 'critical':
                bgColor = 'rgba(255, 77, 79, 0.2)'; outlineColor = '3px solid #ff4d4f'; break;
            case 'serious':
                bgColor = 'rgba(250, 173, 20, 0.2)'; outlineColor = '3px solid #faad14'; break;
            case 'moderate':
                bgColor = 'rgba(250, 219, 20, 0.2)'; outlineColor = '3px solid #fadb14'; break;
            case 'minor':
                bgColor = 'rgba(24, 144, 255, 0.2)'; outlineColor = '3px solid #1890ff'; break;
            default:
                bgColor = 'rgba(255, 77, 79, 0.2)'; outlineColor = '3px solid #ff4d4f';
        }

        violation.nodes.forEach(node => {
            const selector = node.target.join(',');
            const elements = document.querySelectorAll(selector);

            elements.forEach(el => {
                el.style.backgroundColor = bgColor;
                el.style.outline = outlineColor;
                el.style.outlineOffset = '2px';

                // Save original styles to revert if needed, and mark as highlighted
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
        // 1. Scroll the element smoothly into the center of the viewport
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // 2. Temporarily highlight it purple to show it is the active clicked element
        element.style.backgroundColor = 'rgba(156, 39, 176, 0.4)'; // Purple transparent
        element.style.outline = '4px solid #9c27b0'; // Purple solid

        // 3. Reset back to its specific error color after 2.5 seconds
        setTimeout(() => {
            element.style.backgroundColor = element.dataset.originalBg || '';
            element.style.outline = element.dataset.originalOutline || '';
        }, 2500);
    }
}