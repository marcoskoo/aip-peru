import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Mark as dynamic so it runs as a serverless function on Netlify
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ icaoCode: string }> }
) {
  try {
    const { icaoCode } = await params;
    const code = icaoCode.toUpperCase();

    // Read the charts metadata
    const metadataPath = join(process.cwd(), 'public', 'charts', 'charts-metadata.json');
    const metadataContent = await readFile(metadataPath, 'utf-8');
    const allCharts = JSON.parse(metadataContent);

    const airportCharts = allCharts.find(
      (a: { icaoCode: string }) => a.icaoCode === code
    );

    if (!airportCharts) {
      return NextResponse.json(
        { error: `No charts found for airport ${code}` },
        { status: 404 }
      );
    }

    // Return chart data with full URLs
    const charts = airportCharts.charts.map((chart: { type: string; name: string; file: string }) => ({
      type: chart.type,
      name: chart.name,
      file: chart.file,
      url: `/charts/${code}/${chart.file}`,
    }));

    // Group by type
    const grouped = charts.reduce((acc: Record<string, typeof charts>, chart: { type: string; name: string; file: string; url: string }) => {
      if (!acc[chart.type]) acc[chart.type] = [];
      acc[chart.type].push(chart);
      return acc;
    }, {});

    return NextResponse.json({
      icaoCode: code,
      totalCharts: charts.length,
      charts,
      grouped,
    });
  } catch (error) {
    console.error('Error fetching charts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
