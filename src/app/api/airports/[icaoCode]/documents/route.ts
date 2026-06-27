import { NextRequest, NextResponse } from 'next/server';
import documentsMetadata from '@/../public/aip-documents/documents-metadata.json';

// Force dynamic so it runs as a serverless function on Vercel
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ icaoCode: string }> }
) {
  try {
    const { icaoCode } = await params;
    const code = icaoCode.toUpperCase();

    // Use imported metadata (bundled at build time — works on Vercel serverless)
    const allDocuments = documentsMetadata as { icaoCode: string; documents: { type: string; code: string; name: string; description: string; file: string; category: string }[] }[];

    const airportDocuments = allDocuments.find(
      (a) => a.icaoCode === code
    );

    if (!airportDocuments) {
      return NextResponse.json(
        { error: `No documents found for airport ${code}` },
        { status: 404 }
      );
    }

    // Return document data with full URLs
    const documents = airportDocuments.documents.map((doc) => ({
      type: doc.type,
      code: doc.code,
      name: doc.name,
      description: doc.description,
      file: doc.file,
      category: doc.category,
      url: `/aip-documents/${code}/${doc.file}`,
    }));

    // Group by category
    const grouped = documents.reduce(
      (acc: Record<string, typeof documents>, doc) => {
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
