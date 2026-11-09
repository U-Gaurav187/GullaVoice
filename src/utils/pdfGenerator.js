/**
 * Utility to generate and print/download formatted PDF reports for 
 * GallaVoice Kirana Khata (Debtors & Remaining Udhaar).
 */

export function generateKhataPdfHtml(customers = [], options = {}) {
  const {
    filterPendingOnly = true,
    storeName = 'गल्ला वॉयस किराना एवं जनरल स्टोर',
    englishStoreName = 'GallaVoice Kirana & General Store',
    storeTagline = 'भारत का डिजिटल आवाज़-आधारित बहीखाता (Voice-First Khata for Bharat)'
  } = options;

  // Filter customers who owe money if filterPendingOnly is active
  const debtors = filterPendingOnly
    ? customers.filter(c => ((c.totalUdhaar || 0) - (c.totalJama || 0)) > 0)
    : customers;

  // Sort by net remaining debt descending (highest pending balance first)
  const sortedDebtors = [...debtors].sort((a, b) => {
    const netA = Math.max(0, (a.totalUdhaar || 0) - (a.totalJama || 0));
    const netB = Math.max(0, (b.totalUdhaar || 0) - (b.totalJama || 0));
    return netB - netA;
  });

  // Calculate aggregate figures
  const totalGrossUdhaar = sortedDebtors.reduce((sum, c) => sum + (c.totalUdhaar || 0), 0);
  const totalJama = sortedDebtors.reduce((sum, c) => sum + (c.totalJama || 0), 0);
  const totalNetPending = sortedDebtors.reduce((sum, c) => sum + Math.max(0, (c.totalUdhaar || 0) - (c.totalJama || 0)), 0);

  const formattedDate = new Date().toLocaleDateString('hi-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const rowsHtml = sortedDebtors.length === 0
    ? `<tr><td colspan="6" style="text-align: center; padding: 24px; color: #78716c; font-size: 13px;">कोई बाकी उधारी खाता नहीं है। सभी खाते चुकता हैं।</td></tr>`
    : sortedDebtors.map((c, index) => {
        const net = Math.max(0, (c.totalUdhaar || 0) - (c.totalJama || 0));
        const owesMoney = net > 0;
        const aliasStr = (c.aliases || []).filter(a => a && a !== c.name && a !== c.hindiName).slice(0, 2).join(', ');

        return `
          <tr style="border-bottom: 1px solid #e7e5e4; ${index % 2 === 1 ? 'background-color: #fafaf9;' : ''}">
            <td style="padding: 10px 12px; font-weight: bold; color: #57534e; text-align: center; font-size: 12px;">${index + 1}</td>
            <td style="padding: 10px 12px;">
              <div style="font-weight: 700; color: #1c1917; font-size: 13px;">${c.name}</div>
              <div style="font-size: 11px; color: #78716c; margin-top: 2px;">
                ${c.hindiName || ''} ${c.upNativeName ? `• <span style="color: #ea580c; font-weight: 600;">${c.upNativeName}</span>` : ''}
              </div>
            </td>
            <td style="padding: 10px 12px; font-size: 11px; color: #78716c;">
              <div>${c.phone || '+91 98000 00000'}</div>
              ${aliasStr ? `<div style="font-size: 10px; color: #a8a29e;">उपनाम: ${aliasStr}</div>` : ''}
            </td>
            <td style="padding: 10px 12px; text-align: right; font-weight: 600; color: #dc2626; font-family: monospace; font-size: 13px;">
              ₹${(c.totalUdhaar || 0).toLocaleString('en-IN')}
            </td>
            <td style="padding: 10px 12px; text-align: right; font-weight: 600; color: #16a34a; font-family: monospace; font-size: 13px;">
              ₹${(c.totalJama || 0).toLocaleString('en-IN')}
            </td>
            <td style="padding: 10px 12px; text-align: right;">
              <span style="font-weight: 800; font-family: monospace; font-size: 14px; color: ${owesMoney ? '#b91c1c' : '#15803d'};">
                ₹${net.toLocaleString('en-IN')}
              </span>
              <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; margin-top: 2px; color: ${owesMoney ? '#991b1b' : '#166534'};">
                ${owesMoney ? '● बकाया बाकी' : '✓ चुकता'}
              </div>
            </td>
          </tr>
        `;
      }).join('');

  return `
<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>उधारी बहीखाता रिपोर्ट - ${storeName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", "Mangal", sans-serif;
      margin: 0;
      padding: 0;
      color: #1c1917;
      background-color: #ffffff;
      font-size: 12px;
      line-height: 1.4;
    }
    .pdf-container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header-box {
      border-bottom: 2px solid #ea580c;
      padding-bottom: 14px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .store-title {
      font-size: 20px;
      font-weight: 900;
      color: #9a3412;
      letter-spacing: -0.3px;
      margin: 0 0 2px 0;
    }
    .store-subtitle {
      font-size: 11px;
      color: #78716c;
      margin: 0 0 6px 0;
    }
    .badge-report {
      display: inline-block;
      background-color: #ffedd5;
      color: #9a3412;
      border: 1px solid #fdba74;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 11px;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #78716c;
    }
    .meta-box strong {
      color: #292524;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 18px;
    }
    .kpi-card {
      border: 1px solid #e7e5e4;
      border-radius: 10px;
      padding: 10px 14px;
      background-color: #fafaf9;
    }
    .kpi-card.highlight {
      background-color: #fef2f2;
      border-color: #fecaca;
    }
    .kpi-card.jama {
      background-color: #f0fdf4;
      border-color: #bbf7d0;
    }
    .kpi-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #78716c;
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: 18px;
      font-weight: 900;
      font-family: monospace;
      color: #1c1917;
    }
    .kpi-sub {
      font-size: 10px;
      color: #a8a29e;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    th {
      background-color: #f5f5f4;
      color: #44403c;
      font-weight: 700;
      text-align: left;
      padding: 8px 12px;
      font-size: 11px;
      border-top: 1px solid #d6d3d1;
      border-bottom: 2px solid #d6d3d1;
      text-transform: uppercase;
    }
    .table-footer {
      background-color: #f5f5f4;
      font-weight: 800;
      border-top: 2px solid #292524;
      border-bottom: 2px solid #292524;
    }
    .table-footer td {
      padding: 10px 12px;
    }
    .footer-sign {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px dashed #d6d3d1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 11px;
      color: #78716c;
    }
    .sign-box {
      text-align: center;
      width: 180px;
    }
    .sign-line {
      border-bottom: 1px solid #78716c;
      height: 40px;
      margin-bottom: 6px;
    }
    .galla-tag {
      font-weight: bold;
      color: #ea580c;
    }
  </style>
</head>
<body>
  <div class="pdf-container">
    <!-- Header -->
    <div class="header-box">
      <div>
        <h1 class="store-title">🏪 ${storeName}</h1>
        <div class="store-subtitle">${englishStoreName} • ${storeTagline}</div>
        <div class="badge-report">📋 उधारी बहीखाता विवरण (Pending Debtors Statement)</div>
      </div>
      <div class="meta-box">
        <div>दिनांक: <strong>${formattedDate}</strong></div>
        <div>समय: <strong>${formattedTime}</strong></div>
        <div style="margin-top: 4px;">रिपोर्ट प्रकार: <strong>${filterPendingOnly ? 'सिर्फ बाकी उधारी वाले ग्राहक' : 'सभी खाते'}</strong></div>
      </div>
    </div>

    <!-- Summary KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card highlight">
        <div class="kpi-label" style="color: #b91c1c;">कुल शुद्ध बाकी (Net Pending)</div>
        <div class="kpi-value" style="color: #b91c1c;">₹${totalNetPending.toLocaleString('en-IN')}</div>
        <div class="kpi-sub">जमा काटने के बाद बाकी शुद्ध रुपया</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">कुल पुराना उधार (Gross Udhaar)</div>
        <div class="kpi-value">₹${totalGrossUdhaar.toLocaleString('en-IN')}</div>
        <div class="kpi-sub">कुल दर्ज हुआ सामान उधार</div>
      </div>
      <div class="kpi-card jama">
        <div class="kpi-label" style="color: #15803d;">कुल जमा (Total Jama)</div>
        <div class="kpi-value" style="color: #15803d;">₹${totalJama.toLocaleString('en-IN')}</div>
        <div class="kpi-sub">ग्राहकों द्वारा दिया गया नकद</div>
      </div>
    </div>

    <!-- Debtors Table -->
    <table>
      <thead>
        <tr>
          <th style="width: 38px; text-align: center;">क्र.</th>
          <th>ग्राहक का नाम (Customer Name)</th>
          <th>फोन / पहचान</th>
          <th style="text-align: right;">कुल उधार</th>
          <th style="text-align: right;">कुल जमा</th>
          <th style="text-align: right;">बाकी रुपया (Net)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
      <tfoot>
        <tr class="table-footer">
          <td colspan="3" style="text-align: right; padding-right: 14px;">
            <strong>कुल योग (${sortedDebtors.length} ग्राहक):</strong>
          </td>
          <td style="text-align: right; color: #dc2626; font-family: monospace; font-size: 13px;">
            ₹${totalGrossUdhaar.toLocaleString('en-IN')}
          </td>
          <td style="text-align: right; color: #16a34a; font-family: monospace; font-size: 13px;">
            ₹${totalJama.toLocaleString('en-IN')}
          </td>
          <td style="text-align: right; color: #b91c1c; font-family: monospace; font-size: 15px;">
            ₹${totalNetPending.toLocaleString('en-IN')}
          </td>
        </tr>
      </tfoot>
    </table>

    <!-- Footer Signature & Branding -->
    <div class="footer-sign">
      <div>
        <div class="galla-tag">⚡ गल्ला वॉयस (GallaVoice)</div>
        <div>शोर-प्रतिरोधी वॉयस बहीखाता • स्वतः गणितीय हिसाब</div>
        <div style="font-size: 9px; color: #a8a29e; margin-top: 2px;">This is a system-generated accounting record.</div>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div>दुकानदार हस्ताक्षर व मुहर</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Triggers the native browser print / "Save as PDF" dialog cleanly 
 * via an isolated hidden iframe without disturbing the active screen.
 */
export function printKhataPdf(customers = [], options = {}) {
  const htmlContent = generateKhataPdfHtml(customers, options);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow.print();
    } catch (e) {
      console.error('Print trigger failed:', e);
    }
    // Clean up iframe after print dialog resolves
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  }, 350);
}

/**
 * Downloads a standalone printable HTML file (which can be opened offline or sent on WhatsApp)
 */
export function downloadKhataHtml(customers = [], options = {}) {
  const htmlContent = generateKhataPdfHtml(customers, options);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `GallaVoice_Udhaar_Khata_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
