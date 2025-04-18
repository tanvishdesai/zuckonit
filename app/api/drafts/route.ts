import { NextResponse } from 'next/server';
import { databases, Query, DATABASES, COLLECTIONS } from '@/lib/appwrite';

export async function GET() {
  try {
    // Use the pre-configured databases client from lib/appwrite
    const response = await databases.listDocuments(
      DATABASES.MAIN,
      COLLECTIONS.POSTS,
      [
        Query.equal('status', 'draft'),
        Query.orderDesc('created_at')
      ]
    );

    console.log('API - Successfully retrieved drafts:', response.documents.length);
    return NextResponse.json(response);
  } catch (error) {
    console.error('API Error fetching drafts:', error);
    
    // Check if it's an unauthorized error
    if (error instanceof Error && error.toString().includes('401')) {
      console.log('API - Authentication failed, user is not logged in');
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to load drafts' },
      { status: 500 }
    );
  }
} 