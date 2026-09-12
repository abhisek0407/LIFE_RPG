// Import all models from one place:
//   import { User, Quest, DailyQuest, StoreItem, ActivityLog } from "./wrappy.js";
import User from "./userSchema.js";
import Quest from "./questSchema.js";
import DailyQuest from "./dailyQuestSchema.js";
import StoreItem from "./storeItemSchema.js";
import ActivityLog from "./activityLogSchema.js";

export { User, Quest, DailyQuest, StoreItem, ActivityLog };