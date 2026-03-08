insert into "todos" ("task", "isCompleted")
values
  ('Review template docs', false),
  ('Create your first feature', false),
  ('Ship your MVP', false);

insert into "emotions" ("slug", "name", "description")
values
  ('fear', 'Fear', 'When feeling afraid, these verses remind believers of God''s protection and presence.'),
  ('anger', 'Anger', 'These passages encourage self-control, forgiveness, and turning to God to manage rage.'),
  ('sadness', 'Sadness', 'For times of sorrow, these verses offer hope and God''s comfort.'),
  ('anxiety', 'Anxiety', 'These scriptures focus on casting worries onto God and finding peace.'),
  ('loneliness', 'Loneliness', 'Verses that affirm God''s constant companionship.'),
  ('joy', 'Joy', 'To cultivate or restore happiness, these emphasize rejoicing in the Lord.'),
  ('peace', 'Peace', 'For inner calm amid turmoil.'),
  ('grief', 'Grief', 'These provide solace in loss.');

insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Psalm 23:4', 'I will fear no evil, for you are with me.', 'NIV', 1
from "emotions" where "slug" = 'fear';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Isaiah 41:10', 'Do not fear, for I am with you.', 'NIV', 2
from "emotions" where "slug" = 'fear';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", '2 Timothy 1:7', 'God gives power, love, and self-discipline.', 'NIV', 3
from "emotions" where "slug" = 'fear';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Joshua 1:9', 'Be strong and courageous, for the Lord is with you.', 'NIV', 4
from "emotions" where "slug" = 'fear';

insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Ephesians 4:26-27', 'In your anger do not sin.', 'NIV', 1
from "emotions" where "slug" = 'anger';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'James 1:19-20', 'Be quick to listen, slow to speak, and slow to anger.', 'NIV', 2
from "emotions" where "slug" = 'anger';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Proverbs 15:1', 'A gentle answer turns away wrath.', 'NIV', 3
from "emotions" where "slug" = 'anger';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Psalm 37:8', 'Refrain from anger and turn from wrath.', 'NIV', 4
from "emotions" where "slug" = 'anger';

insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Psalm 34:18', 'The Lord is close to the brokenhearted.', 'NIV', 1
from "emotions" where "slug" = 'sadness';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Matthew 5:4', 'Blessed are those who mourn, for they will be comforted.', 'NIV', 2
from "emotions" where "slug" = 'sadness';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", '2 Corinthians 1:3-4', 'The God of all comfort comforts us in trouble.', 'NIV', 3
from "emotions" where "slug" = 'sadness';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Psalm 30:5', 'Weeping may stay for the night, rejoicing comes in the morning.', 'NIV', 4
from "emotions" where "slug" = 'sadness';

insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Philippians 4:6-7', 'Do not be anxious; present your requests to God.', 'NIV', 1
from "emotions" where "slug" = 'anxiety';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", '1 Peter 5:7', 'Cast all your anxiety on him because he cares for you.', 'NIV', 2
from "emotions" where "slug" = 'anxiety';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Matthew 6:34', 'Do not worry about tomorrow.', 'NIV', 3
from "emotions" where "slug" = 'anxiety';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Psalm 94:19', 'Your consolation brought me joy when anxiety was great.', 'NIV', 4
from "emotions" where "slug" = 'anxiety';

insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Deuteronomy 31:6', 'He will never leave you nor forsake you.', 'NIV', 1
from "emotions" where "slug" = 'loneliness';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Psalm 23:1', 'The Lord is my shepherd, I lack nothing.', 'NIV', 2
from "emotions" where "slug" = 'loneliness';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Isaiah 41:13', 'I am the Lord who says: Do not fear; I will help you.', 'NIV', 3
from "emotions" where "slug" = 'loneliness';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Matthew 28:20', 'Surely I am with you always, to the very end of the age.', 'NIV', 4
from "emotions" where "slug" = 'loneliness';

insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Philippians 4:4', 'Rejoice in the Lord always.', 'NIV', 1
from "emotions" where "slug" = 'joy';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Psalm 16:11', 'You fill me with joy in your presence.', 'NIV', 2
from "emotions" where "slug" = 'joy';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'John 15:11', 'My joy may be in you and your joy may be complete.', 'NIV', 3
from "emotions" where "slug" = 'joy';

insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'John 14:27', 'Peace I leave with you; my peace I give you.', 'NIV', 1
from "emotions" where "slug" = 'peace';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Isaiah 26:3', 'You will keep in perfect peace those whose minds are steadfast.', 'NIV', 2
from "emotions" where "slug" = 'peace';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Colossians 3:15', 'Let the peace of Christ rule in your hearts.', 'NIV', 3
from "emotions" where "slug" = 'peace';

insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Revelation 21:4', 'He will wipe every tear from their eyes.', 'NIV', 1
from "emotions" where "slug" = 'grief';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", 'Psalm 147:3', 'He heals the brokenhearted and binds up their wounds.', 'NIV', 2
from "emotions" where "slug" = 'grief';
insert into "scriptures" ("emotionId", "reference", "verseText", "translation", "displayOrder")
select "emotionId", '1 Thessalonians 4:13', 'Do not grieve like the rest of mankind, who have no hope.', 'NIV', 3
from "emotions" where "slug" = 'grief';

update "scriptures" s
set
  "contextChapterReference" = split_part(s."reference", ':', 1),
  "contextSummary" = case split_part(s."reference", ':', 1)
    when 'Psalm 23' then 'Psalm 23 presents God as a steady shepherd who protects, restores, and guides his people through danger.'
    when 'Isaiah 41' then 'Isaiah 41 reassures a fearful people that God is with them, strengthens them, and upholds them with his own hand.'
    when '2 Timothy 1' then 'Paul encourages Timothy to remain faithful and courageous, reminding him that God gives power, love, and disciplined judgment.'
    when 'Joshua 1' then 'Joshua 1 commissions a new leader and anchors courage in obedience to God and confidence in his presence.'
    when 'Ephesians 4' then 'Ephesians 4 calls believers to a new way of life marked by unity, truth, patience, and controlled speech and emotion.'
    when 'James 1' then 'James 1 teaches endurance in trials and wisdom in relationships, including being quick to listen and slow to anger.'
    when 'Proverbs 15' then 'Proverbs 15 contrasts destructive speech with gentle and wise responses that preserve peace.'
    when 'Psalm 37' then 'Psalm 37 urges patience and trust in God when evil seems to prosper, warning against reactive anger.'
    when 'Psalm 34' then 'Psalm 34 celebrates Gods deliverance and emphasizes that he is especially near to the brokenhearted.'
    when 'Matthew 5' then 'Matthew 5 begins the Sermon on the Mount, where Jesus redefines blessing through humility, mercy, and hope.'
    when '2 Corinthians 1' then 'Paul describes God as the Father of mercies who comforts his people so they can comfort others.'
    when 'Psalm 30' then 'Psalm 30 remembers Gods rescue and contrasts temporary sorrow with renewed joy.'
    when 'Philippians 4' then 'Philippians 4 calls believers to prayerful trust, thankful hearts, and steady minds in Christ.'
    when '1 Peter 5' then 'First Peter 5 calls believers to humility and vigilance, inviting them to cast anxiety on God who cares.'
    when 'Matthew 6' then 'In Matthew 6, Jesus teaches trusting the Father for daily needs rather than being consumed by worry about tomorrow.'
    when 'Psalm 94' then 'Psalm 94 brings anxiety and injustice before God and finds comfort in his wise and righteous rule.'
    when 'Deuteronomy 31' then 'Deuteronomy 31 prepares Israel for transition and repeats Gods promise that he will not leave or forsake his people.'
    when 'Matthew 28' then 'Matthew 28 closes with resurrection victory and Jesus promise to remain with his disciples always.'
    when 'Psalm 16' then 'Psalm 16 expresses secure joy in Gods presence and confidence that life with him is fullness, not emptiness.'
    when 'John 15' then 'John 15 teaches abiding in Christ as the source of fruitfulness, obedience, and lasting joy.'
    when 'John 14' then 'John 14 offers comfort to troubled hearts, promising the Spirit and the peace Christ gives.'
    when 'Isaiah 26' then 'Isaiah 26 is a song of trust that links steady minds and lasting peace to reliance on the Lord.'
    when 'Colossians 3' then 'Colossians 3 calls believers to set their minds on Christ and let his peace rule in community life.'
    when 'Revelation 21' then 'Revelation 21 portrays Gods final renewal, where sorrow and death are removed and God dwells with his people.'
    when 'Psalm 147' then 'Psalm 147 praises God for both cosmic power and personal care, including healing for the brokenhearted.'
    when '1 Thessalonians 4' then 'First Thessalonians 4 teaches holy living and offers hope-filled comfort about death through the promise of resurrection.'
    else concat(
      'This verse belongs to ',
      split_part(s."reference", ':', 1),
      '. Reading the full chapter helps clarify the setting and message around this passage.'
    )
  end,
  "fullContext" = concat(
    'Study Note: ',
    split_part(s."reference", ':', 1),
    E'\n\nChapter Focus: ',
    'This chapter provides theological and pastoral context for the selected verse and should be read as a complete unit before drawing application.',
    E'\n\nHistorical and Literary Context: ',
    case split_part(s."reference", ':', 1)
    when 'Psalm 23' then 'Psalm 23 is a song of trust that describes the Lord as a shepherd who personally leads, provides, and protects. The chapter moves from green pastures to dark valleys, showing that the same God is present in both peace and hardship. When this passage is read in full, the message becomes clear: fear is answered not by denial of trouble, but by confidence in the Shepherd who remains near.'
    when 'Isaiah 41' then 'Isaiah 41 speaks to people who feel threatened and weak. God repeatedly says, "Do not fear," not because danger is unreal, but because his covenant presence is greater than what they face. The chapter ties courage to relationship: the One who formed and called his people is the One who helps and sustains them.'
    when '2 Timothy 1' then 'In 2 Timothy 1, Paul writes from prison and calls Timothy to continue the gospel work without shame. The chapter emphasizes that fear does not come from God. Instead, the Spirit equips believers with strength for hardship, love for people, and self-control for wise action. Read together, the chapter grounds courage in calling, not in personality.'
    when 'Joshua 1' then 'Joshua 1 marks a transition after Moses, when the people must move forward into uncertainty. God repeats the command to be strong and courageous, tying that command to two realities: his ongoing presence and careful obedience to his word. The chapter shows that biblical courage is not self-confidence; it is faithfulness under God.'
    when 'Ephesians 4' then 'Ephesians 4 describes how people shaped by Christ should live with each other. Paul moves from the theology of unity to practical habits: speak truth, work honestly, forgive quickly, and do not let anger control behavior. In context, anger is acknowledged but bounded; it must not become a doorway for destructive patterns.'
    when 'James 1' then 'James 1 connects spiritual maturity with tested faith and disciplined response. Believers are called to ask God for wisdom, receive his word, and practice it in daily life. The counsel about anger sits inside a larger vision of integrity: hear well, speak carefully, and act in ways that align with Gods righteousness.'
    when 'Proverbs 15' then 'Proverbs 15 is a wisdom chapter about the moral weight of words. It shows how tone can calm conflict or inflame it, and how humble correction leads to life-giving outcomes. The verse about a gentle answer belongs to a broader teaching: wise speech is not passive, but intentionally healing and truthful.'
    when 'Psalm 37' then 'Psalm 37 addresses a common struggle: watching the wicked appear to succeed. Rather than panic or rage, the psalm calls people to trust, do good, and wait on the Lord. Anger is framed as spiritually dangerous when it drives impulsive action. In full, the chapter redirects attention from immediate frustration to Gods long-term justice.'
    when 'Psalm 34' then 'Psalm 34 combines testimony and invitation. The psalmist recounts rescue from fear, then invites others to seek the Lord and live wisely. The promise that God is near to the brokenhearted appears in a chapter that does not deny affliction, but insists God responds to those who cry out to him.'
    when 'Matthew 5' then 'Matthew 5 opens with the Beatitudes, where Jesus pronounces blessing on people the world often overlooks, including those who mourn. The promise of comfort is not shallow positivity; it belongs to the coming kingdom of God. In context, grief and hope are held together under Christs authority and teaching.'
    when '2 Corinthians 1' then 'In 2 Corinthians 1, Paul speaks honestly about severe hardship and then testifies to Gods sustaining mercy. Comfort is presented as both gift and mission: believers receive consolation from God and pass it on to others in pain. The chapter frames suffering as a place where dependence on God grows deeper.'
    when 'Psalm 30' then 'Psalm 30 is a thanksgiving song after deliverance. It reflects on distress, prayer, and restoration, showing that seasons of grief are real but not final for those who trust the Lord. The movement from night weeping to morning rejoicing highlights the rhythm of lament and hope in faithful worship.'
    when 'Philippians 4' then 'Philippians 4 offers practical guidance for anxiety and peace. Paul commands rejoicing, gentleness, prayer, and disciplined thinking. The promise of peace does not mean absence of pressure; it means Gods guarding presence in the middle of it. In context, emotional stability grows from prayer, gratitude, and Christ-centered focus.'
    when '1 Peter 5' then '1 Peter 5 addresses leadership, suffering, and spiritual resistance. The call to cast anxiety on God is grounded in his personal care and paired with a call to be alert and steadfast. Reading the chapter shows that trust is active: humble dependence, sober awareness, and perseverance under pressure.'
    when 'Matthew 6' then 'Matthew 6 is part of the Sermon on the Mount and addresses motives, prayer, and possessions. Jesus points to the Fathers faithful provision and teaches his disciples to seek Gods kingdom first. The warning against worry is not a denial of real needs; it is a call to reordered trust and daily dependence.'
    when 'Psalm 94' then 'Psalm 94 begins with a cry for justice against oppression and ends with confidence in God as refuge. The verse about anxiety appears in a chapter that names inner turmoil honestly. Consolation is not abstract; it comes through remembering Gods character, correction, and commitment to his people.'
    when 'Deuteronomy 31' then 'Deuteronomy 31 occurs as leadership passes from Moses to Joshua and the nation faces an uncertain future. The command to be strong is repeated to leaders and people alike, grounded in Gods enduring presence. In context, courage is communal and covenantal: move forward together because God goes with you.'
    when 'Matthew 28' then 'Matthew 28 records the resurrection and the commissioning of Jesus followers. The final promise, "I am with you always," anchors mission in presence. Read as a whole, the chapter moves from fear to worship to purpose, showing that Christs authority and nearness sustain his people.'
    when 'Psalm 16' then 'Psalm 16 is a confession of trust and delight in the Lord as portion and refuge. The closing line about fullness of joy comes after a sequence of dependence, counsel, and confidence. In context, joy is rooted in relationship with God, not in changing circumstances.'
    when 'John 15' then 'In John 15, Jesus uses the vine and branches image to explain spiritual life. Joy is connected to abiding in him, keeping his commands, and loving one another. The chapter frames joy as a result of shared life with Christ, not momentary emotion.'
    when 'John 14' then 'John 14 speaks into fear and uncertainty before Jesus death. He calls his disciples to trust, promises the coming Helper, and gives peace unlike the worlds version. In full context, peace is relational and durable because it flows from Christs presence and promises.'
    when 'Isaiah 26' then 'Isaiah 26 contrasts secure trust in God with unstable dependence on human strength. The promise of perfect peace appears within a chapter focused on righteousness, waiting, and hope. The larger message is that inner stability grows from fixing the mind on God.'
    when 'Colossians 3' then 'Colossians 3 describes a transformed life shaped by union with Christ. Paul calls believers to put away destructive habits and put on compassion, forgiveness, and love. The peace of Christ is meant to govern the heart and the church, producing gratitude and unity.'
    when 'Revelation 21' then 'Revelation 21 gives a vision of new creation after judgment. The promise that every tear will be wiped away sits within a larger picture of restored fellowship and complete healing. In context, grief is answered by Gods final and lasting redemption.'
    when 'Psalm 147' then 'Psalm 147 celebrates the Lord as Creator, Sustainer, and Restorer. The same God who names the stars also binds up wounded hearts. Read fully, the chapter emphasizes that divine greatness does not distance God from human pain; it enables compassionate care.'
    when '1 Thessalonians 4' then 'In 1 Thessalonians 4, Paul addresses daily discipleship and then responds to grief over believers who have died. He does not command people not to grieve at all, but not to grieve without hope. The chapter grounds comfort in Christs return and resurrection promise.'
    else concat(
      'This passage appears in ',
      split_part(s."reference", ':', 1),
      ', where the surrounding verses expand the main theme and help explain the emotional encouragement in context. ',
      'The chapter as a whole provides additional detail about who is speaking, who is being addressed, and how this verse connects to the broader biblical message. ',
      'For thoughtful study, read the chapter from the beginning and observe how the ideas build before and after this verse.'
    )
  end,
    E'\n\nPastoral Application: Bring your present emotion to God in prayer, then read this chapter slowly to see how its truth reshapes your response with faith, wisdom, and endurance.',
    E'\n\nHow to Read: Read the full chapter before and after the selected verse, note who is speaking, and trace how the chapter''s main argument leads into this passage.'
  ),
  "contextSourceName" = 'Seeded Study Context'
from "emotions" e
where s."emotionId" = e."emotionId";
