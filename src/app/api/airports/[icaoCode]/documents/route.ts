import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Force dynamic so it runs as a serverless function on Vercel
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ icaoCode: string }> }
) {
  try {
    const { icaoCode } = await params;
    const code = icaoCode.toUpperCase();

    // Read the documents metadata
    const metadataPath = join(
      process.cwd(),
      'public',
      'aip-documents',
      'documents-metadata.json'
    );

    let metadataContent: string;
    try {
      metadataContent = await readFile(metadataPath, 'utf-8');
    } catch {
      return NextResponse.json(
        { error: `No documents metadata available` },
        { status: 404 }
      );
    }

    const allDocuments = JSON.parse(metadataContent);
    const airportDocuments = allDocuments.find(
      (a: { icaoCode: string }) => a.icaoCode === code
    );

    if (!airportDocuments) {
      return NextResponse.json(
        { error: `No documents found for airport ${code}` },
        { status: 404 }
      );
    }

    // Return document data with full URLs
    const documents = airportDocuments.documents.map(
      (doc: {
        type: string;
        code: string;
        name: string;
        description: string;
        file: string;
        category: string;
      }) => ({
        type: doc.type,
        code: doc.code,
        name: doc.name,
        description: doc.description,
        file: doc.file,
        category: doc.category,
        url: `/aip-documents/${code}/${doc.file}`,
      })
    );

    // Group by category
    const grouped = documents.reduce(
      (acc: Record<string, typeof documents>, doc: typeof documents[number]) => {
        if (!acc[doc.category]) acc[doc.category] = [];
        acc[doc.category].push(doc);
        return acc;
      },
      {}
    );

    return NextResponse.json({
      icaoCode: code,
      totalDocuments: documents.length,
      documents,
      grouped,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
