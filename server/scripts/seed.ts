import { notInArray, sql } from 'drizzle-orm';
import { env } from '@server/config/env.js';
import { getDrizzleDb } from '@server/db/drizzle.js';
import { emotions, scriptures } from '@server/db/schema.js';
import { logger } from '@server/lib/logger.js';
import { emotionSeedData } from './seed-emotions-data.js';

/** Build chapter-level reference from a verse reference string. */
function toChapterReference(reference: string): string {
  return reference.split(':')[0]?.trim() || reference;
}

const chapterContextMap: Record<
  string,
  { summary: string; fullContext: string }
> = {
  'Psalm 23': {
    summary:
      'Psalm 23 presents God as a steady shepherd who protects, restores, and guides his people through danger.',
    fullContext:
      'Psalm 23 is a song of trust that describes the Lord as a shepherd who personally leads, provides, and protects. The chapter moves from green pastures to dark valleys, showing that the same God is present in both peace and hardship. When this passage is read in full, the message becomes clear: fear is answered not by denial of trouble, but by confidence in the Shepherd who remains near.',
  },
  'Isaiah 41': {
    summary:
      'Isaiah 41 reassures a fearful people that God is with them, strengthens them, and upholds them with his own hand.',
    fullContext:
      'Isaiah 41 speaks to people who feel threatened and weak. God repeatedly says, "Do not fear," not because danger is unreal, but because his covenant presence is greater than what they face. The chapter ties courage to relationship: the One who formed and called his people is the One who helps and sustains them.',
  },
  '2 Timothy 1': {
    summary:
      'Paul encourages Timothy to remain faithful and courageous, reminding him that God gives power, love, and disciplined judgment.',
    fullContext:
      'In 2 Timothy 1, Paul writes from prison and calls Timothy to continue the gospel work without shame. The chapter emphasizes that fear does not come from God. Instead, the Spirit equips believers with strength for hardship, love for people, and self-control for wise action. Read together, the chapter grounds courage in calling, not in personality.',
  },
  'Joshua 1': {
    summary:
      'Joshua 1 commissions a new leader and anchors courage in obedience to God and confidence in his presence.',
    fullContext:
      'Joshua 1 marks a transition after Moses, when the people must move forward into uncertainty. God repeats the command to be strong and courageous, tying that command to two realities: his ongoing presence and careful obedience to his word. The chapter shows that biblical courage is not self-confidence; it is faithfulness under God.',
  },
  'Ephesians 4': {
    summary:
      'Ephesians 4 calls believers to a new way of life marked by unity, truth, patience, and controlled speech and emotion.',
    fullContext:
      'Ephesians 4 describes how people shaped by Christ should live with each other. Paul moves from the theology of unity to practical habits: speak truth, work honestly, forgive quickly, and do not let anger control behavior. In context, anger is acknowledged but bounded; it must not become a doorway for destructive patterns.',
  },
  'James 1': {
    summary:
      'James 1 teaches endurance in trials and wisdom in relationships, including being quick to listen and slow to anger.',
    fullContext:
      'James 1 connects spiritual maturity with tested faith and disciplined response. Believers are called to ask God for wisdom, receive his word, and practice it in daily life. The counsel about anger sits inside a larger vision of integrity: hear well, speak carefully, and act in ways that align with Gods righteousness.',
  },
  'Proverbs 15': {
    summary:
      'Proverbs 15 contrasts destructive speech with gentle and wise responses that preserve peace.',
    fullContext:
      'Proverbs 15 is a wisdom chapter about the moral weight of words. It shows how tone can calm conflict or inflame it, and how humble correction leads to life-giving outcomes. The verse about a gentle answer belongs to a broader teaching: wise speech is not passive, but intentionally healing and truthful.',
  },
  'Psalm 37': {
    summary:
      'Psalm 37 urges patience and trust in God when evil seems to prosper, warning against reactive anger.',
    fullContext:
      'Psalm 37 addresses a common struggle: watching the wicked appear to succeed. Rather than panic or rage, the psalm calls people to trust, do good, and wait on the Lord. Anger is framed as spiritually dangerous when it drives impulsive action. In full, the chapter redirects attention from immediate frustration to Gods long-term justice.',
  },
  'Psalm 34': {
    summary:
      'Psalm 34 celebrates Gods deliverance and emphasizes that he is especially near to the brokenhearted.',
    fullContext:
      'Psalm 34 combines testimony and invitation. The psalmist recounts rescue from fear, then invites others to seek the Lord and live wisely. The promise that God is near to the brokenhearted appears in a chapter that does not deny affliction, but insists God responds to those who cry out to him.',
  },
  'Matthew 5': {
    summary:
      'Matthew 5 begins the Sermon on the Mount, where Jesus redefines blessing through humility, mercy, and hope.',
    fullContext:
      'Matthew 5 opens with the Beatitudes, where Jesus pronounces blessing on people the world often overlooks, including those who mourn. The promise of comfort is not shallow positivity; it belongs to the coming kingdom of God. In context, grief and hope are held together under Christs authority and teaching.',
  },
  '2 Corinthians 1': {
    summary:
      'Paul describes God as the Father of mercies who comforts his people so they can comfort others.',
    fullContext:
      'In 2 Corinthians 1, Paul speaks honestly about severe hardship and then testifies to Gods sustaining mercy. Comfort is presented as both gift and mission: believers receive consolation from God and pass it on to others in pain. The chapter frames suffering as a place where dependence on God grows deeper.',
  },
  'Psalm 30': {
    summary:
      'Psalm 30 remembers Gods rescue and contrasts temporary sorrow with renewed joy.',
    fullContext:
      'Psalm 30 is a thanksgiving song after deliverance. It reflects on distress, prayer, and restoration, showing that seasons of grief are real but not final for those who trust the Lord. The movement from night weeping to morning rejoicing highlights the rhythm of lament and hope in faithful worship.',
  },
  'Philippians 4': {
    summary:
      'Philippians 4 calls believers to prayerful trust, thankful hearts, and steady minds in Christ.',
    fullContext:
      'Philippians 4 offers practical guidance for anxiety and peace. Paul commands rejoicing, gentleness, prayer, and disciplined thinking. The promise of peace does not mean absence of pressure; it means Gods guarding presence in the middle of it. In context, emotional stability grows from prayer, gratitude, and Christ-centered focus.',
  },
  '1 Peter 5': {
    summary:
      'First Peter 5 calls believers to humility and vigilance, inviting them to cast anxiety on God who cares.',
    fullContext:
      '1 Peter 5 addresses leadership, suffering, and spiritual resistance. The call to cast anxiety on God is grounded in his personal care and paired with a call to be alert and steadfast. Reading the chapter shows that trust is active: humble dependence, sober awareness, and perseverance under pressure.',
  },
  'Matthew 6': {
    summary:
      'In Matthew 6, Jesus teaches trusting the Father for daily needs rather than being consumed by worry about tomorrow.',
    fullContext:
      'Matthew 6 is part of the Sermon on the Mount and addresses motives, prayer, and possessions. Jesus points to the Fathers faithful provision and teaches his disciples to seek Gods kingdom first. The warning against worry is not a denial of real needs; it is a call to reordered trust and daily dependence.',
  },
  'Psalm 94': {
    summary:
      'Psalm 94 brings anxiety and injustice before God and finds comfort in his wise and righteous rule.',
    fullContext:
      'Psalm 94 begins with a cry for justice against oppression and ends with confidence in God as refuge. The verse about anxiety appears in a chapter that names inner turmoil honestly. Consolation is not abstract; it comes through remembering Gods character, correction, and commitment to his people.',
  },
  'Deuteronomy 31': {
    summary:
      'Deuteronomy 31 prepares Israel for transition and repeats Gods promise that he will not leave or forsake his people.',
    fullContext:
      'Deuteronomy 31 occurs as leadership passes from Moses to Joshua and the nation faces an uncertain future. The command to be strong is repeated to leaders and people alike, grounded in Gods enduring presence. In context, courage is communal and covenantal: move forward together because God goes with you.',
  },
  'Matthew 28': {
    summary:
      'Matthew 28 closes with resurrection victory and Jesus promise to remain with his disciples always.',
    fullContext:
      'Matthew 28 records the resurrection and the commissioning of Jesus followers. The final promise, "I am with you always," anchors mission in presence. Read as a whole, the chapter moves from fear to worship to purpose, showing that Christs authority and nearness sustain his people.',
  },
  'Psalm 16': {
    summary:
      'Psalm 16 expresses secure joy in Gods presence and confidence that life with him is fullness, not emptiness.',
    fullContext:
      'Psalm 16 is a confession of trust and delight in the Lord as portion and refuge. The closing line about fullness of joy comes after a sequence of dependence, counsel, and confidence. In context, joy is rooted in relationship with God, not in changing circumstances.',
  },
  'John 15': {
    summary:
      'John 15 teaches abiding in Christ as the source of fruitfulness, obedience, and lasting joy.',
    fullContext:
      'In John 15, Jesus uses the vine and branches image to explain spiritual life. Joy is connected to abiding in him, keeping his commands, and loving one another. The chapter frames joy as a result of shared life with Christ, not momentary emotion.',
  },
  'John 14': {
    summary:
      'John 14 offers comfort to troubled hearts, promising the Spirit and the peace Christ gives.',
    fullContext:
      'John 14 speaks into fear and uncertainty before Jesus death. He calls his disciples to trust, promises the coming Helper, and gives peace unlike the worlds version. In full context, peace is relational and durable because it flows from Christs presence and promises.',
  },
  'Isaiah 26': {
    summary:
      'Isaiah 26 is a song of trust that links steady minds and lasting peace to reliance on the Lord.',
    fullContext:
      'Isaiah 26 contrasts secure trust in God with unstable dependence on human strength. The promise of perfect peace appears within a chapter focused on righteousness, waiting, and hope. The larger message is that inner stability grows from fixing the mind on God.',
  },
  'Colossians 3': {
    summary:
      'Colossians 3 calls believers to set their minds on Christ and let his peace rule in community life.',
    fullContext:
      'Colossians 3 describes a transformed life shaped by union with Christ. Paul calls believers to put away destructive habits and put on compassion, forgiveness, and love. The peace of Christ is meant to govern the heart and the church, producing gratitude and unity.',
  },
  'Revelation 21': {
    summary:
      'Revelation 21 portrays Gods final renewal, where sorrow and death are removed and God dwells with his people.',
    fullContext:
      'Revelation 21 gives a vision of new creation after judgment. The promise that every tear will be wiped away sits within a larger picture of restored fellowship and complete healing. In context, grief is answered by Gods final and lasting redemption.',
  },
  'Psalm 147': {
    summary:
      'Psalm 147 praises God for both cosmic power and personal care, including healing for the brokenhearted.',
    fullContext:
      'Psalm 147 celebrates the Lord as Creator, Sustainer, and Restorer. The same God who names the stars also binds up wounded hearts. Read fully, the chapter emphasizes that divine greatness does not distance God from human pain; it enables compassionate care.',
  },
  '1 Thessalonians 4': {
    summary:
      'First Thessalonians 4 teaches holy living and offers hope-filled comfort about death through the promise of resurrection.',
    fullContext:
      'In 1 Thessalonians 4, Paul addresses daily discipleship and then responds to grief over believers who have died. He does not command people not to grieve at all, but not to grieve without hope. The chapter grounds comfort in Christs return and resurrection promise.',
  },
};

/** Format chapter context in a consistent study-note style. */
function formatStudyNote(
  chapterReference: string,
  summary: string,
  contextAndFlow: string,
): string {
  return [
    `Study Note: ${chapterReference}`,
    `Chapter Focus: ${summary}`,
    `Historical and Literary Context: ${contextAndFlow}`,
    'Pastoral Application: Bring your present emotion to God in prayer, then read this chapter slowly to see how its truth reshapes your response with faith, wisdom, and endurance.',
    `How to Read: Read the full chapter before and after the selected verse, note who is speaking, and trace how the chapter's main argument leads into this passage.`,
  ].join('\n\n');
}

/** Build starter context text for a scripture row. */
function buildSeededContext(reference: string): {
  contextChapterReference: string;
  contextSummary: string;
  fullContext: string;
  contextSourceName: string;
} {
  const chapterReference = toChapterReference(reference);
  const chapterContext = chapterContextMap[chapterReference];
  if (chapterContext) {
    return {
      contextChapterReference: chapterReference,
      contextSummary: chapterContext.summary,
      fullContext: formatStudyNote(
        chapterReference,
        chapterContext.summary,
        chapterContext.fullContext,
      ),
      contextSourceName: 'Seeded Study Context',
    };
  }
  const fallbackSummary = `This verse belongs to ${chapterReference}. Reading the full chapter helps clarify the setting and message around this passage.`;
  const fallbackContext = `This passage appears in ${chapterReference}, where the surrounding verses expand the main theme and help explain the emotional encouragement in context. The chapter as a whole provides additional detail about who is speaking, who is being addressed, and how this verse connects to the broader biblical message.`;
  return {
    contextChapterReference: chapterReference,
    contextSummary: fallbackSummary,
    fullContext: formatStudyNote(
      chapterReference,
      fallbackSummary,
      fallbackContext,
    ),
    contextSourceName: 'Seeded Study Context',
  };
}

/**
 * Seed starter data transactionally.
 * Uses an advisory transaction lock and upsert semantics so reruns can heal
 * partial seed state instead of skipping on non-empty tables.
 */
async function seedDatabase(): Promise<void> {
  const db = getDrizzleDb();
  if (!db) {
    throw new Error('DATABASE_URL is required to run db:seed');
  }

  await db.transaction(async (tx) => {
    // Prevent concurrent seed jobs from racing each other.
    await tx.execute(sql`select pg_advisory_xact_lock(839421)`);

    const seededSlugs = emotionSeedData.map((emotion) => emotion.slug);
    for (const emotion of emotionSeedData) {
      const [savedEmotion] = await tx
        .insert(emotions)
        .values({
          slug: emotion.slug,
          name: emotion.name,
          description: emotion.description,
        })
        .onConflictDoUpdate({
          target: emotions.slug,
          set: {
            name: emotion.name,
            description: emotion.description,
            updatedAt: sql`now()`,
          },
        })
        .returning({ emotionId: emotions.emotionId });

      for (const [index, scripture] of emotion.scriptures.entries()) {
        const displayOrder = index + 1;
        const seededContext = buildSeededContext(scripture.reference);
        await tx
          .insert(scriptures)
          .values({
            emotionId: savedEmotion.emotionId,
            reference: scripture.reference,
            verseText: scripture.verseText,
            translation: 'NIV',
            displayOrder,
            contextChapterReference: seededContext.contextChapterReference,
            contextSummary: seededContext.contextSummary,
            fullContext: seededContext.fullContext,
            contextSourceName: seededContext.contextSourceName,
          })
          .onConflictDoUpdate({
            target: [scriptures.emotionId, scriptures.displayOrder],
            set: {
              reference: scripture.reference,
              verseText: scripture.verseText,
              translation: 'NIV',
              contextChapterReference: seededContext.contextChapterReference,
              contextSummary: seededContext.contextSummary,
              fullContext: seededContext.fullContext,
              contextSourceName: seededContext.contextSourceName,
              updatedAt: sql`now()`,
            },
          });
      }

      // Remove stale scripture rows when seed list length shrinks for a category.
      await tx.execute(sql`
        delete from "scriptures"
        where "emotionId" = ${savedEmotion.emotionId}
          and "displayOrder" > ${emotion.scriptures.length}
      `);
    }

    // Remove deprecated categories (and cascading scriptures) not present in current seed.
    await tx.delete(emotions).where(notInArray(emotions.slug, seededSlugs));
  });
}

seedDatabase()
  .then(() => {
    logger.info('Seeded starter database data');
  })
  .catch((err) => {
    logger.error({ err }, 'db:seed failed');
    process.exitCode = 1;
  })
  .finally(() => {
    logger.info({ nodeEnv: env.NODE_ENV }, 'db:seed completed');
  });
