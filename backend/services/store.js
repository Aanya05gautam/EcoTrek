export const memoryStore = {
  users: [],
  reports: [],
  pickups: [],
  quizzes: [
    {
      id: 'q1',
      question: 'Which of the following is considered Wet/Organic waste?',
      options: ['Glass bottles', 'Vegetable peels and food scraps', 'Used batteries', 'Clean cardboard'],
      correctAnswerIndex: 1,
      category: 'Organic Waste',
      pointsValue: 10
    },
    {
      id: 'q2',
      question: 'What is the correct protocol for disposing of a bloated lithium-ion battery?',
      options: ['Seal it in a plastic bag and throw it in green bins', 'Flush it down the toilet', 'Schedule an E-Waste pickup immediately', 'Mix it with dry recyclables'],
      correctAnswerIndex: 2,
      category: 'E-Waste',
      pointsValue: 15
    },
    {
      id: 'q3',
      question: 'Why must Dry Recyclables (like paper and plastic) be cleaned before disposal?',
      options: ['To make them smell better', 'Because food contamination ruins the recycling process for the entire batch', 'To increase their physical weight', 'It is not necessary to clean them'],
      correctAnswerIndex: 1,
      category: 'Recyclables',
      pointsValue: 10
    },
    {
      id: 'q4',
      question: 'Which of these items qualifies as Hazardous Waste (SDG 12)?',
      options: ['Newspaper', 'Broken ceramic plates', 'Medical syringes and chemical paints', 'Aluminium foil'],
      correctAnswerIndex: 2,
      category: 'Hazardous Waste',
      pointsValue: 15
    },
    {
      id: 'q5',
      question: 'What is the ultimate goal of source segregation at home?',
      options: ['To maximize landfill usage', 'To ensure maximum recovery of reusable materials and minimize environmental toxicity', 'To give garbage collectors more work', 'To hide waste from neighbors'],
      correctAnswerIndex: 1,
      category: 'Awareness',
      pointsValue: 10
    },
    {
      id: 'q6',
      question: 'If you have bulky waste like an old sofa, what is the best Municipal action?',
      options: ['Leave it on the pavement', 'Burn it safely', 'Use the EcoTrek Fleet Dispatch to schedule a localized pickup', 'Break it into small pieces and put it in organic bins'],
      correctAnswerIndex: 2,
      category: 'Municipal Logistics',
      pointsValue: 10
    }
  ]
};
