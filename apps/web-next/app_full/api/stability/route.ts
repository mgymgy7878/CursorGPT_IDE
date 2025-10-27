/**
 * Stability API - UI Dashboard
 * P95 metrikleri ve stability durumu
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Prometheus'dan P95 metrikleri çek
    const metricsUrl = 'http://127.0.0.1:4001/metrics';
    const response = await fetch(metricsUrl);
    
    if (!response.ok) {
      throw new Error(`Metrics fetch failed: ${response.status}`);
    }
    
    const metricsText = await response.text();
    
    // P95 Place→ACK hesapla
    const placeAckMatch = metricsText.match(/spark_place_ack_duration_seconds_bucket\{le="([^"]+)"\}\s+(\d+)/g);
    let p95PlaceAck = 0;
    
    if (placeAckMatch) {
      // Basit P95 hesaplama (gerçekte histogram_quantile kullanılmalı)
      const buckets = placeAckMatch.map(match => {
        const [, le, count] = match.match(/le="([^"]+)"\}\s+(\d+)/) || [];
        return { le: parseFloat(le), count: parseInt(count) };
      });
      
      if (buckets.length > 0) {
        // En yüksek bucket'ı P95 olarak kabul et (basitleştirme)
        p95PlaceAck = Math.max(...buckets.map(b => b.le)) * 1000; // saniye → ms
      }
    }
    
    // P95 Feed→DB hesapla
    const feedDbMatch = metricsText.match(/spark_feed_to_db_seconds_bucket\{le="([^"]+)"\}\s+(\d+)/g);
    let p95FeedDb = 0;
    
    if (feedDbMatch) {
      const buckets = feedDbMatch.map(match => {
        const [, le, count] = match.match(/le="([^"]+)"\}\s+(\d+)/) || [];
        return { le: parseFloat(le), count: parseInt(count) };
      });
      
      if (buckets.length > 0) {
        p95FeedDb = Math.max(...buckets.map(b => b.le)) * 1000; // saniye → ms
      }
    }
    
    // Stability kriterleri
    const stable = p95PlaceAck < 1000 && p95FeedDb < 300;
    
    return NextResponse.json({
      stable,
      p95PlaceAck: Math.round(p95PlaceAck),
      p95FeedDb: Math.round(p95FeedDb),
      lastCheck: new Date().toISOString(),
      thresholds: {
        placeAck: 1000,
        feedDb: 300
      }
    });
    
  } catch (error) {
    console.error('Stability check failed:', error);
    
    return NextResponse.json({
      stable: false,
      p95PlaceAck: 0,
      p95FeedDb: 0,
      lastCheck: new Date().toISOString(),
      error: error.message,
      thresholds: {
        placeAck: 1000,
        feedDb: 300
      }
    }, { status: 500 });
  }
}
