import { NextRequest, NextResponse } from 'next/server';

type RawEvent = {
  id?: string;
  title?: string;
  start: string | number | Date;
  end: string | number | Date;
  type?: string;
  energyRequired?: 'low' | 'medium' | 'high';
  [key: string]: any;
};

type NormalizedEvent = Omit<RawEvent, 'start' | 'end'> & {
  start: Date;
  end: Date;
};

export async function POST(request: NextRequest) {
  try {
    const { events = [], energy = 'medium', preferences = {} } = await request.json();

    const normalized = normalizeEvents(events as RawEvent[]);
    const optimized = optimizeCalendar(normalized, energy, preferences);
    const recommendations = generateRecommendations(optimized, energy);

    return NextResponse.json({
      events: optimized,
      recommendations
    });
  } catch (error) {
    console.error('optimize-calendar error:', error);
    return NextResponse.json({ events: [], recommendations: [] });
  }
}

function normalizeEvents(events: RawEvent[]): NormalizedEvent[] {
  return (events || [])
    .map((e, idx) => {
      const start = toDate(e.start);
      const end = toDate(e.end);
      if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
        return null;
      }
      return {
        id: e.id ?? `evt-${idx}`,
        title: e.title ?? 'Event',
        type: e.type ?? 'meeting',
        energyRequired: e.energyRequired ?? 'medium',
        ...e,
        start,
        end
      } as NormalizedEvent;
    })
    .filter(Boolean)
    .sort((a, b) => a!.start.getTime() - b!.start.getTime()) as NormalizedEvent[];
}

function toDate(value: string | number | Date | undefined): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') return new Date(value);
  return null;
}

function optimizeCalendar(events: NormalizedEvent[], energy: string, preferences: any) {
  // Placeholder for more complex logic: padding buffers, focusing creative blocks, etc.
  // For now, just return normalized events (already sorted).
  return events;
}

function generateRecommendations(events: NormalizedEvent[], energy: string) {
  const recs: string[] = [];

  // Back-to-back detection with < 15 minutes gap
  const backToBack = [] as NormalizedEvent[];
  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1];
    const cur = events[i];
    const gapMin = (cur.start.getTime() - prev.end.getTime()) / (60 * 1000);
    if (gapMin < 15) backToBack.push(cur);
  }

  if (backToBack.length > 2) {
    recs.push('Too many back-to-back meetings. Add at least 15-minute buffers.');
  }

  if (energy === 'low' && events.length > 5) {
    recs.push('Low energy detected. Reschedule non-critical meetings and protect recovery blocks.');
  }

  const highEnergyBlocks = events.filter(e => e.energyRequired === 'high').length;
  if (highEnergyBlocks >= 3) {
    recs.push('Consider spreading high-energy blocks across the day to prevent burnout.');
  }

  return recs;
}
