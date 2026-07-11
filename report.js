function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// NEW: PDF-Safe Stacked Horizontal Bar Chart
function createStackedBarChart(crit, ser, mod, min, total) {
    if (total === 0) return `<div style="width:100%; height:30px; background:#444; border-radius:15px; margin: 20px 0;"></div>`;

    const critPct = (crit / total) * 100;
    const serPct = (ser / total) * 100;
    const modPct = (mod / total) * 100;
    const minPct = (min / total) * 100;

    return `
    <div style="display: flex; width: 100%; height: 30px; border-radius: 15px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 30px 0 20px 0;">
        ${critPct > 0 ? `<div style="width: ${critPct}%; background: #ff4d4f;" title="Critical: ${crit}"></div>` : ''}
        ${serPct > 0 ? `<div style="width: ${serPct}%; background: #faad14;" title="Serious: ${ser}"></div>` : ''}
        ${modPct > 0 ? `<div style="width: ${modPct}%; background: #fadb14;" title="Moderate: ${mod}"></div>` : ''}
        ${minPct > 0 ? `<div style="width: ${minPct}%; background: #1890ff;" title="Minor: ${min}"></div>` : ''}
    </div>
    `;
}

chrome.storage.local.get("odinReportData", (result) => {
    if (!result.odinReportData) return;
    const data = result.odinReportData;
    const violations = data.violations;
    const score = data.score;

    const grouped = { critical: [], serious: [], moderate: [], minor: [] };
    let stats = { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 };
    let categories = { "Design & Color": 0, "Keyboard & Nav": 0, "Forms & Inputs": 0, "Screen Readers & ARIA": 0, "Structure & Layout": 0, "Other": 0 };

    violations.forEach(v => {
        let count = v.nodes.length;
        if (grouped[v.impact]) grouped[v.impact].push(v);
        else grouped.minor.push(v);
        stats[v.impact ? v.impact : 'minor'] += count;
        stats.total += count;

        let tags = v.tags || [];
        if (tags.includes('cat.color')) categories["Design & Color"] += count;
        else if (tags.includes('cat.keyboard') || tags.includes('cat.navigation')) categories["Keyboard & Nav"] += count;
        else if (tags.includes('cat.forms')) categories["Forms & Inputs"] += count;
        else if (tags.includes('cat.aria') || tags.includes('cat.name-role-value')) categories["Screen Readers & ARIA"] += count;
        else if (tags.includes('cat.structure')) categories["Structure & Layout"] += count;
        else categories["Other"] += count;
    });

    const scoreColor = score >= 90 ? '#155724' : score >= 70 ? '#856404' : '#721c24';
    const scoreBg = score >= 90 ? '#d4edda' : score >= 70 ? '#fff3cd' : '#f8d7da';

    let htmlContent = `
        <div class="meta-info">
            <strong>Site:</strong> ${escapeHtml(data.title)} <br>
            <strong>URL:</strong> <a href="${escapeHtml(data.url)}" target="_blank" style="color:#1890ff;">${escapeHtml(data.url)}</a> <br>
            <strong>Date Generated:</strong> ${new Date().toLocaleString()}
        </div>
        
        <div class="score-box" style="color: ${scoreColor}; background: ${scoreBg};">
            Overall Accessibility Score: ${score}/100
        </div>
        
        <div class="dashboard">
            <div class="chart-container" style="width: 100%; text-align: center;">
                <h3 style="margin-top:0;">Severity Breakdown</h3>
                
                ${createStackedBarChart(stats.critical, stats.serious, stats.moderate, stats.minor, stats.total)}
                
                <div class="legend" style="margin-bottom: 25px;">
                    <span style="background:#ff4d4f; padding: 4px 8px; color: white; border-radius: 3px; font-size: 12px; margin: 2px; font-weight: bold;">Crit: ${stats.critical}</span>
                    <span style="background:#faad14; padding: 4px 8px; color: white; border-radius: 3px; font-size: 12px; margin: 2px; font-weight: bold;">Ser: ${stats.serious}</span>
                    <span style="background:#fadb14; padding: 4px 8px; color: #333; border-radius: 3px; font-size: 12px; margin: 2px; font-weight: bold;">Mod: ${stats.moderate}</span>
                    <span style="background:#1890ff; padding: 4px 8px; color: white; border-radius: 3px; font-size: 12px; margin: 2px; font-weight: bold;">Min: ${stats.minor}</span>
                </div>
            </div>
            
            <div class="category-stats" style="width: 100%;">
                <h3 style="margin-top:0;">Prominent Issue Types</h3>
                ${Object.entries(categories).sort((a,b) => b[1]-a[1]).map(([name, count]) => `
                    <div class="cat-row">
                        <strong>${name}:</strong> 
                        <span style="background: rgba(150,150,150,0.1); padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(150,150,150,0.2);">${count} instances</span>
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
                <div class="issue-title">${escapeHtml(v.help)}</div>
                <div class="issue-desc">" ${escapeHtml(v.description)} " <br><br>
                <a href="${v.helpUrl}" target="_blank">View Developer & WCAG Documentation &rarr;</a></div>
            `;
            v.nodes.forEach((node, index) => {
                htmlContent += `
                <div class="node-box">
                    <strong>Instance ${index + 1} Selector:</strong> <br>${escapeHtml(node.target.join(', '))}<br><br>
                    <strong>Failing HTML Snippet:</strong>
                    <pre>${escapeHtml(node.html)}</pre>
                </div>`;
            });
            htmlContent += `</div>`;
        });
    });

    document.getElementById('pdf-content').innerHTML = htmlContent;
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    const btn = document.getElementById('downloadBtn');
    btn.innerText = "Processing...";
    btn.disabled = true;

    document.body.classList.add('pdf-mode');

    chrome.storage.local.get("odinReportData", (result) => {
        const title = result.odinReportData ? result.odinReportData.title : 'Report';
        const cleanFileName = `Accessibility_Audit_${title.replace(/[^a-z0-9]/gi, '_')}.pdf`;

        const element = document.body;
        const opt = {
            margin:       [15, 10, 15, 10],
            filename:     cleanFileName,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            document.body.classList.remove('pdf-mode');
            btn.innerText = "⬇ Download as PDF";
            btn.disabled = false;
        });
    });
});