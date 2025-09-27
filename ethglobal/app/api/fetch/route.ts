import { NextResponse } from 'next/server';
import { createOrOpenSpace } from '@graphprotocol/hypergraph';

export async function GET() {
  try {
    // Create or open the public space
    const space = await createOrOpenSpace('ethglobal-trades');
    
    // Query all documents from the space
    const documents = await space.queryDocuments();
    
    // Organize documents by type for better structure
    const organizedData = {
      tokens: documents.filter(doc => doc['@type'] === 'Token'),
      analytics: documents.filter(doc => doc['@type'] === 'Analytics'),
      trades: documents.filter(doc => doc['@type'] === 'Trade'),
      reports: documents.filter(doc => doc['@type'] === 'Report'),
      allDocuments: documents
    };
    
    return NextResponse.json({ 
      success: true,
      count: documents.length,
      data: organizedData
    });
    
  } catch (error) {
    console.error('Error fetching trade data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trade data' },
      { status: 500 }
    );
  }
}
