# Proposal: Support Scripture Candidates (Stress/Guilt Category Refresh)

## Goal

Provide a review-first scripture candidate set for the updated support categories:

- fear
- anger
- sadness
- anxiety
- loneliness
- grief
- stress
- guilt

Each category includes **20 candidate references** intended for emotional support flows.

## Translation Scope

All references are selected to be compatible with current supported translations:

- `KJV`
- `ASV`
- `WEB`

## Category Migration Strategy

Current app categories include `joy` and `peace`. Proposed update replaces them with `stress` and `guilt`.

Recommended migration approach:

1. Replace category seed rows from `joy/peace` to `stress/guilt`.
2. Keep historical saved scriptures untouched (saved items are reference-based and category-agnostic).
3. Re-seed support `scriptures` references and regenerate context text after your approval.

## Canonical Validation Checklist

Before seeding:

- normalize book naming (`Psalm` -> `Psalms`, `Song of Songs` -> `Song of Solomon`)
- confirm chapter/verse format (`Book C:V` or `Book C:V-V`)
- validate each reference resolves in local corpus for KJV/ASV/WEB
- verify ranges are contiguous and in-order (`verseStart <= verseEnd`)
- verify no duplicate reference within same category

## Coverage Matrix (Planned)

| Category   | Candidates | OT/NT Intent | KJV | ASV | WEB |
| ---------- | ---------: | ------------ | --- | --- | --- |
| Fear       |         20 | balanced     | yes | yes | yes |
| Anger      |         20 | balanced     | yes | yes | yes |
| Sadness    |         20 | balanced     | yes | yes | yes |
| Anxiety    |         20 | balanced     | yes | yes | yes |
| Loneliness |         20 | balanced     | yes | yes | yes |
| Grief      |         20 | balanced     | yes | yes | yes |
| Stress     |         20 | balanced     | yes | yes | yes |
| Guilt      |         20 | balanced     | yes | yes | yes |

## Candidate References

### Fear (20)

1. Psalm 23:4
2. Isaiah 41:10
3. Joshua 1:9
4. 2 Timothy 1:7
5. Psalm 27:1
6. Psalm 56:3-4
7. Psalm 34:4
8. Psalm 91:1-2
9. Deuteronomy 31:6
10. Isaiah 43:1-2
11. Proverbs 3:25-26
12. Romans 8:15
13. Hebrews 13:6
14. John 14:27
15. Matthew 10:29-31
16. Psalm 118:6
17. Isaiah 35:4
18. 1 Peter 5:6-7
19. Psalm 46:1-2
20. Exodus 14:13-14

### Anger (20)

1. Ephesians 4:26-27
2. James 1:19-20
3. Proverbs 15:1
4. Proverbs 16:32
5. Ecclesiastes 7:9
6. Colossians 3:8
7. Proverbs 14:29
8. Psalm 37:8
9. Romans 12:19
10. Matthew 5:22
11. Proverbs 19:11
12. Galatians 5:22-23
13. Proverbs 29:11
14. Titus 1:7-8
15. 1 Peter 2:23
16. Psalm 4:4-5
17. Colossians 3:12-13
18. Matthew 6:14-15
19. Proverbs 17:27
20. Romans 12:21

### Sadness (20)

1. Psalm 34:18
2. Matthew 5:4
3. Psalm 42:11
4. Psalm 147:3
5. John 16:33
6. 2 Corinthians 1:3-4
7. Psalm 30:5
8. Lamentations 3:22-23
9. Isaiah 61:1-3
10. Romans 8:18
11. Revelation 21:4
12. Psalm 9:9
13. Nahum 1:7
14. Psalm 40:1-3
15. John 14:1
16. Psalm 62:8
17. 1 Peter 1:6-7
18. Psalm 73:26
19. Hebrews 4:15-16
20. 2 Corinthians 4:8-9

### Anxiety (20)

1. Philippians 4:6-7
2. 1 Peter 5:7
3. Matthew 6:34
4. Isaiah 26:3
5. Psalm 94:19
6. John 14:1
7. Psalm 55:22
8. Proverbs 12:25
9. Matthew 11:28-30
10. Romans 8:28
11. Psalm 46:10
12. Joshua 1:9
13. Hebrews 13:5-6
14. Psalm 121:1-2
15. Isaiah 41:13
16. Mark 4:39-40
17. Psalm 112:7
18. Luke 12:25-26
19. 2 Thessalonians 3:16
20. John 16:33

### Loneliness (20)

1. Deuteronomy 31:6
2. Matthew 28:20
3. Psalm 139:7-10
4. Isaiah 41:10
5. Hebrews 13:5
6. Psalm 68:6
7. John 14:18
8. Psalm 27:10
9. Romans 8:38-39
10. Psalm 25:16
11. Genesis 28:15
12. Zephaniah 3:17
13. Psalm 73:23-24
14. Isaiah 43:2
15. Psalm 145:18
16. 2 Timothy 4:16-17
17. Psalm 23:1
18. John 10:14
19. 1 John 4:13
20. Psalm 121:7-8

### Grief (20)

1. Revelation 21:4
2. Psalm 147:3
3. 1 Thessalonians 4:13-14
4. John 11:25-26
5. Psalm 34:18
6. Matthew 5:4
7. 2 Corinthians 1:3-4
8. Psalm 73:26
9. Isaiah 57:1-2
10. Romans 8:38-39
11. Psalm 116:15
12. Lamentations 3:31-33
13. Job 1:21
14. Psalm 30:5
15. John 14:27
16. Romans 14:8
17. Hebrews 4:15-16
18. Isaiah 41:10
19. Psalm 23:4
20. 2 Corinthians 4:16-18

### Stress (20)

1. Matthew 11:28-30
2. Psalm 46:1
3. Philippians 4:6-7
4. Psalm 55:22
5. Isaiah 40:29-31
6. John 14:27
7. Psalm 61:2
8. Proverbs 3:5-6
9. Exodus 33:14
10. Psalm 62:1-2
11. Hebrews 4:9-11
12. Isaiah 26:3
13. Mark 6:31
14. Psalm 37:7
15. Colossians 3:15
16. Nahum 1:7
17. 2 Corinthians 12:9
18. Psalm 16:8
19. John 16:33
20. Romans 15:13

### Guilt (20)

1. 1 John 1:9
2. Psalm 51:10
3. Romans 8:1
4. Isaiah 1:18
5. Psalm 32:5
6. Micah 7:18-19
7. Hebrews 8:12
8. Ephesians 1:7
9. Colossians 1:13-14
10. Romans 5:8-9
11. Psalm 103:10-12
12. Acts 3:19
13. Proverbs 28:13
14. Hebrews 10:22
15. Titus 3:5-7
16. 2 Corinthians 5:17
17. Isaiah 43:25
18. John 8:11
19. Luke 15:20-24
20. Psalm 130:3-4

## Support Translation/Save Behavior (Implementation Guardrails)

- Support viewer includes translation select (`KJV`, `ASV`, `WEB`).
- Verse text resolves from local corpus by reference + selected translation.
- If selected translation is missing for a specific reference/range:
  - fallback order: selected -> `KJV` -> `ASV` -> `WEB`
  - UI shows non-blocking fallback notice.
- Save action stores currently displayed translation/reference range through existing saved-scripture API.

## Operator Runbook Note (Current Migration Drift)

Because your local DB currently shows migration-history drift:

- use reset/import path for local curation runs (`db:import` + seed/corpus sync) OR
- baseline migration history before running `db:migrate` on non-empty schemas.

Do not apply final category reseed until this candidate list is approved.
