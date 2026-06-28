import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import all models to test registration
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import AcademicProfile from '../models/AcademicProfile.js';
import ResearchArea from '../models/ResearchArea.js';
import UserResearchArea from '../models/UserResearchArea.js';
import Keyword from '../models/Keyword.js';
import UserKeyword from '../models/UserKeyword.js';
import Publication from '../models/Publication.js';
import PublicationAuthor from '../models/PublicationAuthor.js';
import PublicationKeyword from '../models/PublicationKeyword.js';
import PublicationResearchArea from '../models/PublicationResearchArea.js';
import CollaborationPreference from '../models/CollaborationPreference.js';
import CollaborationRequest from '../models/CollaborationRequest.js';
import Recommendation from '../models/Recommendation.js';
import Notification from '../models/Notification.js';
import SavedPublication from '../models/SavedPublication.js';
import Follow from '../models/Follow.js';
import SearchHistory from '../models/SearchHistory.js';
import ActivityLog from '../models/ActivityLog.js';
import Report from '../models/Report.js';
import DownloadAnalytics from '../models/DownloadAnalytics.js';

dotenv.config();

const testCompilation = () => {
  console.log('⚡ Starting Mongoose Model Compilation Verification...\n');

  const models = [
    { name: 'User', model: User },
    { name: 'Profile', model: Profile },
    { name: 'AcademicProfile', model: AcademicProfile },
    { name: 'ResearchArea', model: ResearchArea },
    { name: 'UserResearchArea', model: UserResearchArea },
    { name: 'Keyword', model: Keyword },
    { name: 'UserKeyword', model: UserKeyword },
    { name: 'Publication', model: Publication },
    { name: 'PublicationAuthor', model: PublicationAuthor },
    { name: 'PublicationKeyword', model: PublicationKeyword },
    { name: 'PublicationResearchArea', model: PublicationResearchArea },
    { name: 'CollaborationPreference', model: CollaborationPreference },
    { name: 'CollaborationRequest', model: CollaborationRequest },
    { name: 'Recommendation', model: Recommendation },
    { name: 'Notification', model: Notification },
    { name: 'SavedPublication', model: SavedPublication },
    { name: 'Follow', model: Follow },
    { name: 'SearchHistory', model: SearchHistory },
    { name: 'ActivityLog', model: ActivityLog },
    { name: 'Report', model: Report },
    { name: 'DownloadAnalytics', model: DownloadAnalytics }
  ];

  let successCount = 0;

  for (const item of models) {
    try {
      if (item.model && mongoose.model(item.name)) {
        console.log(`✅ [OK] Model compiled successfully: ${item.name}`);
        successCount++;
      } else {
        console.error(`❌ [FAIL] Model validation failed: ${item.name} is undefined`);
      }
    } catch (error) {
      console.error(`❌ [ERROR] Failed to compile ${item.name}: ${error.message}`);
    }
  }

  console.log(`\n🎉 Verification Completed: ${successCount}/${models.length} models compiled successfully without any errors!`);
  process.exit(successCount === models.length ? 0 : 1);
};

testCompilation();
