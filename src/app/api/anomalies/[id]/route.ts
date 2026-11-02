import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const anomalyId = parseInt(params.id, 10);

    const anomalyRes = await query(
      `
      SELECT 
        a.anomaly_id,
        a.anomaly_type,
        a.severity_level,
        a.score::FLOAT AS anomaly_score,
        a.description,
        a.detected_at,
        TO_CHAR(md.trade_date, 'YYYY-MM-DD') AS trade_date,
        s.ticker,
        c.name AS company_name,
        sec.name AS sector_name,
        md.open_price::FLOAT AS open_price,
        md.close_price::FLOAT AS close_price,
        md.volume::BIGINT AS volume
      FROM anomaly a
      JOIN market_data md ON a.market_data_id = md.market_data_id
      JOIN stock s ON md.stock_id = s.stock_id
      JOIN company c ON s.company_id = c.company_id
      JOIN sector sec ON c.sector_id = sec.sector_id
      WHERE a.anomaly_id = $1;
      `,
      [anomalyId]
    );

    if (anomalyRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Anomaly not found' },
        { status: 404 }
      );
    }

    const indicatorRes = await query(
      `
      SELECT 
        ai.name AS indicator_name,
        ai.description AS indicator_desc,
        ai.unit,
        aiv.actual_value::FLOAT AS actual_value,
        aiv.threshold_value::FLOAT AS threshold_value,
        aiv.deviation::FLOAT AS deviation
      FROM anomaly_indicator_value aiv
      JOIN anomaly_indicator ai ON aiv.indicator_id = ai.indicator_id
      WHERE aiv.anomaly_id = $1;
      `,
      [anomalyId]
    );

    return NextResponse.json({
      success: true,
      anomaly: anomalyRes.rows[0],
      indicators: indicatorRes.rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch anomaly detail' },
      { status: 500 }
    );
  }
}
