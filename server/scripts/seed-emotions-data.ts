export type EmotionSeed = {
  slug: string;
  name: string;
  description: string;
  scriptures: Array<{
    reference: string;
    verseText: string;
  }>;
};

export const emotionSeedData: EmotionSeed[] = [
  {
    slug: 'fear',
    name: 'Fear',
    description:
      "Verses that remind believers of God's protection and presence.",
    scriptures: [
      {
        reference: 'Psalm 23:4',
        verseText: 'I will fear no evil, for you are with me.',
      },
      {
        reference: 'Isaiah 41:10',
        verseText: 'Do not fear, for I am with you.',
      },
      {
        reference: '2 Timothy 1:7',
        verseText: 'God gives power, love, and self-discipline.',
      },
      {
        reference: 'Joshua 1:9',
        verseText: 'Be strong and courageous, for the Lord is with you.',
      },
    ],
  },
  {
    slug: 'anger',
    name: 'Anger',
    description:
      'These passages encourage self-control, forgiveness, and turning to God.',
    scriptures: [
      {
        reference: 'Ephesians 4:26-27',
        verseText: 'In your anger do not sin.',
      },
      {
        reference: 'James 1:19-20',
        verseText: 'Be quick to listen, slow to speak, and slow to anger.',
      },
      {
        reference: 'Proverbs 15:1',
        verseText: 'A gentle answer turns away wrath.',
      },
      {
        reference: 'Psalm 37:8',
        verseText: 'Refrain from anger and turn from wrath.',
      },
    ],
  },
  {
    slug: 'sadness',
    name: 'Sadness',
    description:
      "For times of sorrow, these verses offer hope and God's comfort.",
    scriptures: [
      {
        reference: 'Psalm 34:18',
        verseText: 'The Lord is close to the brokenhearted.',
      },
      {
        reference: 'Matthew 5:4',
        verseText: 'Blessed are those who mourn, for they will be comforted.',
      },
      {
        reference: '2 Corinthians 1:3-4',
        verseText: 'The God of all comfort comforts us in trouble.',
      },
      {
        reference: 'Psalm 30:5',
        verseText:
          'Weeping may stay for the night, rejoicing comes in the morning.',
      },
    ],
  },
  {
    slug: 'anxiety',
    name: 'Anxiety',
    description:
      'These scriptures focus on casting worries onto God and finding peace.',
    scriptures: [
      {
        reference: 'Philippians 4:6-7',
        verseText: 'Do not be anxious; present your requests to God.',
      },
      {
        reference: '1 Peter 5:7',
        verseText: 'Cast all your anxiety on him because he cares for you.',
      },
      {
        reference: 'Matthew 6:34',
        verseText: 'Do not worry about tomorrow.',
      },
      {
        reference: 'Psalm 94:19',
        verseText: 'Your consolation brought me joy when anxiety was great.',
      },
    ],
  },
  {
    slug: 'loneliness',
    name: 'Loneliness',
    description: "Verses that affirm God's constant companionship.",
    scriptures: [
      {
        reference: 'Deuteronomy 31:6',
        verseText: 'He will never leave you nor forsake you.',
      },
      {
        reference: 'Psalm 23:1',
        verseText: 'The Lord is my shepherd, I lack nothing.',
      },
      {
        reference: 'Isaiah 41:13',
        verseText: 'Do not fear; I will help you.',
      },
      {
        reference: 'Matthew 28:20',
        verseText: 'Surely I am with you always, to the very end of the age.',
      },
    ],
  },
  {
    slug: 'joy',
    name: 'Joy',
    description: 'These verses emphasize rejoicing in the Lord.',
    scriptures: [
      {
        reference: 'Philippians 4:4',
        verseText: 'Rejoice in the Lord always.',
      },
      {
        reference: 'Psalm 16:11',
        verseText: 'You fill me with joy in your presence.',
      },
      {
        reference: 'John 15:11',
        verseText: 'My joy may be in you and your joy may be complete.',
      },
    ],
  },
  {
    slug: 'peace',
    name: 'Peace',
    description: 'For inner calm amid turmoil.',
    scriptures: [
      {
        reference: 'John 14:27',
        verseText: 'Peace I leave with you; my peace I give you.',
      },
      {
        reference: 'Isaiah 26:3',
        verseText:
          'You will keep in perfect peace those whose minds are steadfast.',
      },
      {
        reference: 'Colossians 3:15',
        verseText: 'Let the peace of Christ rule in your hearts.',
      },
    ],
  },
  {
    slug: 'grief',
    name: 'Grief',
    description: 'These passages provide solace in loss.',
    scriptures: [
      {
        reference: 'Revelation 21:4',
        verseText: 'He will wipe every tear from their eyes.',
      },
      {
        reference: 'Psalm 147:3',
        verseText: 'He heals the brokenhearted and binds up their wounds.',
      },
      {
        reference: '1 Thessalonians 4:13',
        verseText: 'Do not grieve like the rest of mankind, who have no hope.',
      },
    ],
  },
];
