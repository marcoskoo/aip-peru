import { NextRequest, NextResponse } from 'next/server';
import chartsMetadata from '@/../public/charts/charts-metadata.json';

// Mark as dynamic so it runs as a serverless function
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ icaoCode: string }> }
) {
  try {
    const { icaoCode } = await params;
    const code = icaoCode.toUpperCase();

    // Use imported metadata (bundled at build time — works on Vercel serverless)
    const allCharts = chartsMetadata as { icaoCode: string; charts: { type: string; name: string; file: string }[] }[];

    const airportCharts = allCharts.find(
      (a) => a.icaoCode === code
    );

    if (!airportCharts) {
      return NextResponse.json(
        { error: `No charts found for airport ${code}` },
        { status: 404 }
      );
    }

    // Return chart data with full URLs
    const charts = airportCharts.charts.map((chart) => ({
      type: chart.type,
      name: chart.name,
      file: chart.file,
      url: `/charts/${code}/${chart.file}`,
    }));

    // Group by type
    const grouped = charts.reduce((acc: Record<string, typeof charts>, chart) => {
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
