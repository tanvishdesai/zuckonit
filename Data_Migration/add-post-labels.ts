import 'dotenv/config'; // Load .env file variables
import { databases, DATABASES, COLLECTIONS } from '../lib/appwrite';
import { Query } from 'appwrite';

/**
 * This script adds a 'label' field to all posts in the database:
 * - label = 'Work' (default for all existing posts)
 */
async function main() {
  console.log('🚀 Starting update to add labels to posts...');
  
  try {
    // Get all posts without a label field (all existing posts)
    const response = await databases.listDocuments(
      DATABASES.MAIN,
      COLLECTIONS.POSTS,
      [
        Query.limit(1000) // Adjust as needed based on your post count
      ]
    );
    
    let updatedCount = 0;
    
    // Update each post to add the label field
    for (const post of response.documents) {
      await databases.updateDocument(
        DATABASES.MAIN,
        COLLECTIONS.POSTS,
        post.$id,
        {
          label: 'Work' // Set the default label to 'Work'
        }
      );
      updatedCount++;
    }
    
    console.log(`✅ Successfully added 'Work' label to ${updatedCount} posts`);
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