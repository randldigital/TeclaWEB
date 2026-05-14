import assert from "node:assert/strict";
import Database from "better-sqlite3";

const db = new Database("teclaweb.db", { readonly: true });

function legacyShowtimesLookup(playId) {
  return db
    .prepare(
      `
      SELECT id
      FROM plays
      WHERE parent_play_id = ? OR id = ?
      ORDER BY showtime_order, date_time
      `,
    )
    .all(playId, playId);
}

function canonicalShowtimesLookup(playId) {
  const row = db
    .prepare(
      `
      SELECT id, parent_play_id, showtime_order
      FROM plays
      WHERE id = ?
      `,
    )
    .get(playId);

  if (!row) return [];

  const canonicalParentId =
    row.showtime_order === 0 || !row.parent_play_id || row.id === row.parent_play_id
      ? row.id
      : row.parent_play_id;

  return db
    .prepare(
      `
      SELECT id
      FROM plays
      WHERE parent_play_id = ? OR id = ?
      ORDER BY showtime_order, date_time
      `,
    )
    .all(canonicalParentId, canonicalParentId);
}

function run() {
  const childRows = db
    .prepare(
      `
      SELECT id, parent_play_id
      FROM plays
      WHERE showtime_order > 0
      `,
    )
    .all();

  let checkedChildren = 0;

  for (const child of childRows) {
    const totalInGroup = db
      .prepare("SELECT COUNT(*) AS count FROM plays WHERE parent_play_id = ?")
      .get(child.parent_play_id).count;

    const legacy = legacyShowtimesLookup(child.id);
    const canonical = canonicalShowtimesLookup(child.id);

    assert.ok(
      canonical.length >= legacy.length,
      `Canonical lookup should not return fewer showtimes for child ${child.id}`,
    );

    if (totalInGroup > 1) {
      assert.equal(
        canonical.length,
        totalInGroup,
        `Canonical lookup should return full group for child ${child.id}`,
      );
    }

    checkedChildren += 1;
  }

  const brokenTicketRefs = db
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM tickets t
      LEFT JOIN plays p ON p.id = t.play_id
      WHERE p.id IS NULL
      `,
    )
    .get().count;

  assert.equal(brokenTicketRefs, 0, "All tickets must keep a valid showtime reference");

  const cianuroRows = db
    .prepare(
      `
      SELECT id, parent_play_id, showtime_order, date_time
      FROM plays
      WHERE title = 'El cianuro… ¿Solo o con leche?'
      ORDER BY showtime_order, date_time
      `,
    )
    .all();

  if (cianuroRows.length > 1) {
    const child = cianuroRows.find((row) => row.showtime_order > 0);
    if (child) {
      const canonical = canonicalShowtimesLookup(child.id);
      assert.ok(
        canonical.length > 1,
        "Cianuro child ID should resolve to the complete showtime group",
      );
    }
  }

  console.log(`Showtime identity regression checks passed. Checked children: ${checkedChildren}`);
}

try {
  run();
} finally {
  db.close();
}
