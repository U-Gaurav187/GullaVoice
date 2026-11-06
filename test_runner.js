import { parseKiranaVoiceLocally } from './src/services/localParser.js';
import { INITIAL_CUSTOMERS } from './src/data/initialCustomers.js';
import { INITIAL_RATE_CARD } from './src/data/initialRateCard.js';
import { NOISY_GALLA_PRESETS } from './src/data/noisyGallaPresets.js';

console.log('--- GALLAVOICE LOCAL ENGINE TEST SUITE ---');

for (const preset of NOISY_GALLA_PRESETS) {
  console.log(`\nTesting Preset: [${preset.id}] ${preset.title}`);
  console.log(`Input: "${preset.spokenText}"`);

  const result = parseKiranaVoiceLocally(preset.spokenText, INITIAL_CUSTOMERS, INITIAL_RATE_CARD);

  console.log(`Intent: ${result.intent}`);
  console.log(`Customer: ${result.matched_customer_name} (Spoken: "${result.customer_spoken}", Confidence: ${result.match_confidence})`);
  console.log(`Type: ${result.transaction_type}, Total: ₹${result.total_amount_inr}`);
  console.log(`Items: ${JSON.stringify(result.items)}`);
  console.log(`Ignored Noise: "${result.ignored_side_chatter}"`);
  console.log(`Sanity Alert: ${result.price_sanity_alert}`);
  console.log(`Hindi Readback: "${result.tts_hindi_readback}"`);
}
