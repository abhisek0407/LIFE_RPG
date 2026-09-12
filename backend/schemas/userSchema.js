// {
//   _id: ObjectId,

//   username: String,
//   email: String,
//   passwordHash: String,

//   character: {
//     title: String,
//     avatar: String,
//     overallLevel: Number,
//     totalXpEarned: Number,
//     gold: Number,
//     gems: Number
//   },

//   domains: {
//     health: {
//       level: Number,
//       currentXp: Number,
//       xpToNextLevel: Number
//     },

//     mental: {
//       level: Number,
//       currentXp: Number,
//       xpToNextLevel: Number
//     },

//     skill: {
//       level: Number,
//       currentXp: Number,
//       xpToNextLevel: Number
//     }
//   },

//   streak: {
//     currentStreak: Number,
//     longestStreak: Number,
//     lastActivityDate: Date,
//     streakFreezesAvailable: Number
//   },

//   inventory: [
//     {
//       itemId: String,
//       name: String,
//       type: String,
//       quantity: Number,
//       equipped: Boolean,
//       acquiredAt: Date
//     }
//   ],

//   createdAt: Date,
//   updatedAt: Date
// }