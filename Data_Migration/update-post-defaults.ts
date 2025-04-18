import 'dotenv/config'; // Load .env file variables
import { updateExistingPostsWithDefaults } from '../lib/appwrite';

/**
 * This script sets default values for all posts in the database:
 * - status = 'published' (if null)
 * - post_type = 'standard' (if null)
 */
async function main() {
  console.log('🚀 Starting update of post defaults...');
  
  try {
    const updatedCount = await updateExistingPostsWithDefaults();
    console.log(`✅ Successfully updated ${updatedCount} posts with default values`);
    console.log('- post_type: "standard"');
    console.log('- status: "published"');
  } catch (error) {
    console.error('❌ Error updating posts:', error);
    process.exit(1);
  }
  
  console.log('🏁 Update complete!');
}

// Run the main function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 