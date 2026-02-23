/**
 * import-reminders.js
 * ───────────────────
 * Reads reminders.csv from the project root and bulk-inserts them into
 * the Supabase 'tasks' table.
 *
 * Usage:
 *   node scripts/import-reminders.js
 *
 * Requires:
 *   npm install @supabase/supabase-js csv-parse dotenv
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// ── Config ────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CSV_PATH = path.resolve(__dirname, '../reminders.csv');
const BATCH_SIZE = 50; // insert in batches to avoid timeouts

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Converts "2026-07-15 23:41:00" into:
 *   date: "2026-07-15"
 *   time: { hour: 11, minute: 41, ampm: 'PM' }
 */
function parseDateTime(raw) {
    if (!raw || !raw.trim()) return null;

    // Normalise: strip extra whitespace / newlines that may exist in the CSV
    const cleaned = raw.replace(/\s+/g, ' ').trim();

    // Expected: "YYYY-MM-DD HH:MM:SS"
    const match = cleaned.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})(?::\d{2})?/);
    if (!match) {
        console.warn(`  ⚠️  Could not parse DateTime: "${raw}"`);
        return null;
    }

    const date = match[1];
    let hour24 = parseInt(match[2], 10);
    const minute = parseInt(match[3], 10);

    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;

    return { date, time: { hour: hour12, minute, ampm } };
}

/**
 * Cleans a raw cell value — strips leading whitespace/newlines that appeared
 * in the multi-line cells of the CSV.
 */
function cleanCell(raw) {
    if (!raw) return '';
    return raw.replace(/\s+/g, ' ').trim();
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
    console.log('📂 Reading CSV from:', CSV_PATH);

    const records = [];

    await new Promise((resolve, reject) => {
        fs.createReadStream(CSV_PATH)
            .pipe(
                parse({
                    columns: true,         // first row = headers
                    skip_empty_lines: true,
                    relax_column_count: true,
                    relax_quotes: true,
                    trim: false,           // we handle trimming ourselves
                })
            )
            .on('data', (row) => {
                const title = cleanCell(row['Title'] || row['title'] || '');
                const message = cleanCell(row['Description'] || row['description'] || '');
                const rawDT = cleanCell(row['DateTime'] || row['datetime'] || row['Date'] || '');

                if (!title || !rawDT) return; // skip empty rows

                const parsed = parseDateTime(rawDT);
                if (!parsed) return;

                records.push({
                    title,
                    message,
                    date: parsed.date,
                    time: parsed.time,
                    completed: false,
                    notified: false,
                });
            })
            .on('end', resolve)
            .on('error', reject);
    });

    console.log(`✅ Parsed ${records.length} records from CSV.`);

    if (records.length === 0) {
        console.log('Nothing to insert. Exiting.');
        return;
    }

    // ── Insert in batches ──────────────────────────────────────────
    let totalInserted = 0;
    let totalErrors = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(records.length / BATCH_SIZE);

        process.stdout.write(`  Inserting batch ${batchNum}/${totalBatches} (${batch.length} rows)… `);

        const { error } = await supabase.from('tasks').insert(batch);

        if (error) {
            console.error(`\n  ❌ Batch ${batchNum} failed:`, error.message);
            totalErrors += batch.length;
        } else {
            console.log('✓');
            totalInserted += batch.length;
        }
    }

    console.log('\n─────────────────────────────────────────');
    console.log(`✅ Inserted : ${totalInserted}`);
    if (totalErrors > 0) {
        console.log(`❌ Failed   : ${totalErrors}`);
    }
    console.log('Done!');
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
