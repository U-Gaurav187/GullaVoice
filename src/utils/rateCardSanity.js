/**
 * Rate Card Price Sanity Check & Accent Slip Disambiguator
 * Cross-references calculated item prices against spoken numbers
 * to catch regional phonetic slips (e.g., 15 vs 50 vs 500 or 1500 vs 140).
 */

/**
 * Checks item quantities against the Rate Card to detect price discrepancies.
 * 
 * @param {Array} items - Parsed items [{ name, quantity, calculatedPrice, spokenPrice }]
 * @param {number} spokenTotal - Total rupees spoken by user (if any)
 * @param {Array} rateCard - Current store rate card items
 * @returns {Object} - { sanitizedItems, recommendedTotal, isSanityAlert, notes }
 */
export function checkRateCardSanity(items = [], spokenTotal = 0, rateCard = []) {
  let computedTotal = 0;
  let hasPriceMismatch = false;
  const notes = [];

  const sanitizedItems = items.map(item => {
    // Find matching rate card entry
    const match = rateCard.find(rc => {
      const lowerItem = (item.name || '').toLowerCase();
      return (
        (rc.name && rc.name.toLowerCase() === lowerItem) ||
        (rc.displayName && rc.displayName.toLowerCase().includes(lowerItem)) ||
        (rc.hindiName && rc.hindiName === item.name) ||
        (rc.aliases && rc.aliases.some(a => lowerItem.includes(a.toLowerCase()) || a.toLowerCase().includes(lowerItem)))
      );
    });

    const unitPrice = match ? match.unitPrice : (item.unitPrice || 0);
    const qtyVal = parseFloat(item.quantity) || 1;
    const expectedItemPrice = Math.round(unitPrice * qtyVal);

    let accentNote = null;

    // Check if spoken item price conflicts with rate card
    if (item.spokenPrice && expectedItemPrice > 0) {
      const ratio = item.spokenPrice / expectedItemPrice;
      // If spoken price is > 2.5x higher or < 0.4x lower, flag accent confusion
      if (ratio > 2.5 || ratio < 0.4) {
        hasPriceMismatch = true;
        accentNote = `Accent Slip: Spoken ₹${item.spokenPrice} differs from Rate Card (₹${expectedItemPrice}).`;
        notes.push(`${item.name}: Spoken ₹${item.spokenPrice} vs expected ₹${expectedItemPrice}`);
      }
    }

    const calculatedPrice = expectedItemPrice > 0 ? expectedItemPrice : (item.calculatedPrice || item.spokenPrice || 0);
    computedTotal += calculatedPrice;

    return {
      ...item,
      unitPrice,
      calculatedPrice,
      accentNote
    };
  });

  // Check overall total sanity
  let finalTotal = computedTotal;
  let totalDiscrepancyNote = null;

  if (spokenTotal > 0 && computedTotal > 0) {
    const totalRatio = spokenTotal / computedTotal;
    if (totalRatio > 2.5 || totalRatio < 0.4) {
      hasPriceMismatch = true;
      totalDiscrepancyNote = `Spoken total ₹${spokenTotal} contradicts calculated ₹${computedTotal} (Rate Card applied).`;
      // Use the verified rate card calculation
      finalTotal = computedTotal;
    } else {
      // Within reasonable tolerance
      finalTotal = spokenTotal;
    }
  } else if (computedTotal > 0) {
    finalTotal = computedTotal;
  } else if (spokenTotal > 0) {
    finalTotal = spokenTotal;
  }

  return {
    sanitizedItems,
    recommendedTotal: finalTotal,
    computedTotal,
    spokenTotal,
    isSanityAlert: hasPriceMismatch,
    notes: notes.join('; ') || totalDiscrepancyNote
  };
}
