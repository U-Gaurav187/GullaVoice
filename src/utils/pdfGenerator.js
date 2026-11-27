/**
 * Clean, plain-white printable Khata Ledger PDF generator (100% in-app).
 */

export function generateKhataPdfHtml(customers = [], options = {}) {
  const {
    filterPendingOnly = true,
    storeName = 'गल्ला वॉयस किराना स्टोर',
    englishStoreName = 'GallaVoice Kirana Store'
  } = options;

  const debtors = filterPendingOnly
    ? customers.filter(c => ((c.totalUdhaar || 0) - (c.totalJama || 0)) > 0)
    : customers;

  const sortedDebtors = [...debtors].sort((a, b) => {
    const netA = Math.max(0, (a.totalUdhaar || 0) - (a.totalJama || 0));
    const netB = Math.max(0, (b.totalUdhaar || 0) - (b.totalJama || 0));
    return netB - netA;
  });

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
    ? `<tr><td colspan="5" style="text-align:center;padding:24px;color:#6b7280;">कोई बकाया खाता नहीं है।</td></tr>`
    : sortedDebtors.map((c, index) => {
        const net = Math.max(0, (c.totalUdhaar || 0) - (c.totalJama || 0));
        return `
          <tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:10px 12px;text-align:center;color:#4b5563;">${index + 1}</td>
            <td style="padding:10px 12px;">
              <div style="font-weight:700;color:#111827;">${c.name}</div>
              ${c.hindiName && c.hindiName !== c.name ? `<div style="font-size:11px;color:#6b7280;">${c.hindiName}</div>` : ''}
            </td>
            <td style="padding:10px 12px;text-align:right;color:#374151;font-family:monospace;">₹${(c.totalUdhaar || 0).toLocaleString('en-IN')}</td>
            <td style="padding:10px 12px;text-align:right;color:#374151;font-family:monospace;">₹${(c.totalJama || 0).toLocaleString('en-IN')}</td>
            <td style="padding:10px 12px;text-align:right;font-weight:700;color:#111827;font-family:monospace;">₹${net.toLocaleString('en-IN')}</td>
          </tr>
        `;
      }).join('');

  return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>उधारी बहीखाता - ${storeName}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm 16mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", sans-serif;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #111827;
      font-size: 12px;
      line-height: 1.45;
    }
    .sheet { max-width: 780px; margin: 0 auto; background: #ffffff; }
    .header {
      border-bottom: 2px solid #111827;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title { font-size: 18px; font-weight: 800; margin: 0; color: #111827; }
    .subtitle { font-size: 11px; color: #4b5563; margin-top: 2px; }
    .meta { text-align: right; font-size: 11px; color: #4b5563; }
    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 18px;
    }
    .summary-box {
      border: 1px solid #d1d5db;
      padding: 10px 12px;
      background: #ffffff;
    }
    .summary-label { font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 600; }
    .summary-val { font-size: 16px; font-weight: 800; font-family: monospace; color: #111827; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th {
      background: #f9fafb;
      color: #111827;
      font-weight: 700;
      font-size: 11px;
      padding: 9px 12px;
      border-top: 1px solid #111827;
      border-bottom: 1px solid #111827;
      text-align: left;
    }
    tfoot td {
      padding: 10px 12px;
      border-top: 2px solid #111827;
      border-bottom: 2px solid #111827;
      font-weight: 800;
      background: #f9fafb;
    }
    .footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #d1d5db;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <h1 class="title">${storeName} (${englishStoreName})</h1>
        <div class="subtitle">उधारी बहीखाता विवरण (Outstanding Balance Statement)</div>
      </div>
      <div class="meta">
        <div>दिनांक: ${formattedDate} | ${formattedTime}</div>
        <div>ग्राहक: ${sortedDebtors.length} (${filterPendingOnly ? 'सिर्फ बकाया' : 'सभी खाते'})</div>
      </div>
    </div>

    <div class="summary">
      <div class="summary-box">
        <div class="summary-label">शुद्ध बकाया (Net Balance)</div>
        <div class="summary-val">₹${totalNetPending.toLocaleString('en-IN')}</div>
      </div>
      <div class="summary-box">
        <div class="summary-label">कुल उधार (Total Udhaar)</div>
        <div class="summary-val">₹${totalGrossUdhaar.toLocaleString('en-IN')}</div>
      </div>
      <div class="summary-box">
        <div class="summary-label">कुल जमा (Total Jama)</div>
        <div class="summary-val">₹${totalJama.toLocaleString('en-IN')}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:45px;text-align:center;">क्र.</th>
          <th>ग्राहक का नाम (Customer Name)</th>
          <th style="text-align:right;">कुल उधार</th>
          <th style="text-align:right;">कुल जमा</th>
          <th style="text-align:right;">बाकी राशि (Net)</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="text-align:right;">कुल योग (${sortedDebtors.length} ग्राहक):</td>
          <td style="text-align:right;font-family:monospace;">₹${totalGrossUdhaar.toLocaleString('en-IN')}</td>
          <td style="text-align:right;font-family:monospace;">₹${totalJama.toLocaleString('en-IN')}</td>
          <td style="text-align:right;font-family:monospace;">₹${totalNetPending.toLocaleString('en-IN')}</td>
        </tr>
      </tfoot>
    </table>

    <div class="footer">
      <div>GallaVoice Ledger Report</div>
      <div>हस्ताक्षर: _____________________</div>
    </div>
  </div>
</body>
</html>`;
}

export function printKhataPdf(customers = [], options = {}) {
  const htmlContent = generateKhataPdfHtml(customers, options);
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
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
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 2000);
  }, 300);
}

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
