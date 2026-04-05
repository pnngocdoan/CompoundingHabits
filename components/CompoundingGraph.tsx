import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, PanResponder } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle, Defs, LinearGradient, Stop, ClipPath, Rect, G } from 'react-native-svg';
import { COLORS, FONTS, DEBUG_OUTLINES, getMilestone } from '@constants/theme';
import StatsOverlay from './StatsOverlay';

interface Props {
  data: number[];
  height?: number;
  label?: string;
  startDate?: string;
}

const PAD = { top: 16, bottom: 24, left: 8, right: 8 };
const MIN_VISIBLE_DAYS = 7;

function buildPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) return buildPath(points);
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function buildFillPath(points: { x: number; y: number }[], baseY: number): string {
  if (points.length < 2) return '';
  const curve = buildSmoothPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${curve} L ${last.x.toFixed(1)} ${baseY.toFixed(1)} L ${first.x.toFixed(1)} ${baseY.toFixed(1)} Z`;
}

// e.g. 37.78 → "+3,678.0%", 0.03 → "-97.0%"
function toGrowthStr(multiplier: number): string {
  const pct = ((multiplier - 1) * 100);
  const sign = pct >= 0 ? '+' : '';
  const abs = Math.abs(pct);
  const str = abs >= 1000
    ? `${Math.floor(abs / 1000)},${(abs % 1000).toFixed(1).padStart(5, '0')}`
    : abs.toFixed(1);
  return `${sign}${str}%`;
}

function formatDay(d: number): string {
  if (d === 0) return '0';
  if (d % 365 === 0) return `${d / 365}y`;
  if (d % 30 === 0) return `${d / 30}mo`;
  return `${d}d`;
}

function getXTicks(visibleDays: number, maxDays: number): number[] {
  let interval: number;
  if (visibleDays <= 7)        interval = 1;
  else if (visibleDays <= 30)  interval = 7;
  else if (visibleDays <= 90)  interval = 15;
  else if (visibleDays <= 365) interval = 30;
  else                         interval = 90;
  const cap = Math.round(Math.min(visibleDays, maxDays));
  const ticks: number[] = [];
  for (let d = 0; d <= cap; d += interval) ticks.push(d);
  return ticks;
}

function zoomLabel(visibleDays: number): string {
  if (visibleDays < 60) return `${Math.round(visibleDays)}d`;
  if (visibleDays < 365) return `${Math.round(visibleDays / 30)}m`;
  return `${Math.round((visibleDays / 365) * 10) / 10}y`;
}

export default function CompoundingGraph({ data, height: propH, startDate }: Props) {
  const { width } = useWindowDimensions();
  const [measuredH, setMeasuredH] = useState(0);
  const [animProgress, setAnimProgress] = useState(0);
  const hasAnimated = useRef(false);
  const rafRef = useRef<number>(0);
  const wRef = useRef(width);

  // Milestone — derived from days elapsed
  const daysElapsed = data.length - 1;
  const milestone = getMilestone(daysElapsed);
  const prevMilestoneDays = useRef(milestone.maxDays);

  // Zoom state — always anchored at day 0
  const [visibleDays, setVisibleDays] = useState(() => milestone.maxDays);
  const visibleDaysRef = useRef(milestone.maxDays);
  useEffect(() => { visibleDaysRef.current = visibleDays; }, [visibleDays]);

  // Reset zoom when milestone.maxDays changes
  useEffect(() => {
    if (milestone.maxDays !== prevMilestoneDays.current) {
      prevMilestoneDays.current = milestone.maxDays;
      setVisibleDays(milestone.maxDays);
      visibleDaysRef.current = milestone.maxDays;
    }
  }, [milestone.maxDays]);

  const H = propH ?? measuredH;
  const W = width;
  const innerH = H - PAD.top - PAD.bottom;
  const innerW = W - PAD.left - PAD.right;
  const innerWRef = useRef(innerW);
  useEffect(() => { wRef.current = W; innerWRef.current = innerW; }, [W, innerW]);

  // Y scale: minVal at bottom, maxVal at top — range expands downward when data dips below baseline
  const maxVal = milestone.maxVal;
  const minVal = data.length > 0 ? Math.min(1.0, ...data) : 1.0;
  const totalRange = Math.max(maxVal - minVal, 0.001);

  const toX = (day: number) => PAD.left + (day / visibleDays) * innerW;
  const toY = (v: number) => PAD.top + innerH - ((v - minVal) / totalRange) * innerH;

  // Draw-in animation on first mount
  useEffect(() => {
    if (hasAnimated.current || data.length === 0 || H === 0) return;
    hasAnimated.current = true;
    const startTime = Date.now();
    const duration = 900;
    function tick() {
      const t = Math.min((Date.now() - startTime) / duration, 1);
      setAnimProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [H, data.length]);

  const visibleData = animProgress >= 1
    ? data
    : data.slice(0, Math.max(2, Math.ceil(animProgress * data.length)));

  const allPoints = visibleData.map((v, i) => ({ x: toX(i), y: toY(v) }));
  const actualPath = buildSmoothPath(allPoints);

  // Endpoint beacon — only if last data point is within the visible range
  const lastDataDay = visibleData.length - 1;
  const endPt = (animProgress >= 1 && lastDataDay <= visibleDays)
    ? allPoints[lastDataDay]
    : null;

  // Reference curves — from day 0 to end of visible window (capped at milestone.maxDays)
  const idealRefPath = useMemo(() => {
    if (innerW <= 0 || innerH <= 0) return '';
    const endD = Math.min(milestone.maxDays, Math.ceil(visibleDays));
    return buildPath(Array.from({ length: endD + 1 }, (_, d) => ({
      x: PAD.left + (d / visibleDays) * innerW,
      y: PAD.top + innerH - ((Math.pow(1.01, d) - minVal) / totalRange) * innerH,
    })));
  }, [innerW, innerH, minVal, totalRange, visibleDays, milestone.maxDays]);

const baseY = toY(1.0);
  const currentVal = data[data.length - 1] ?? 1.0;
  const prevVal = data[data.length - 2] ?? currentVal;
  const isPositive = currentVal >= 1.0 && currentVal >= prevVal;
  const isDailyPositive = currentVal >= prevVal;
  const dailyDelta = (currentVal - prevVal) * 100;
  const dailyDeltaStr = `${dailyDelta >= 0 ? '' : ''}${dailyDelta.toFixed(1)}%`;
  const fillPath = buildFillPath(allPoints, baseY);

  // Scrub state
  const [scrubX, setScrubX] = useState<number | null>(null);
  const scrubRawDay = scrubX !== null
    ? Math.round(((scrubX - PAD.left) / innerW) * visibleDays)
    : null;
  const scrubDay = scrubRawDay !== null ? Math.max(0, Math.min(milestone.maxDays, scrubRawDay)) : null;
  const scrubVal = scrubDay !== null && scrubDay < data.length ? (data[scrubDay] ?? null) : null;
  const scrubDotY = scrubVal !== null ? toY(scrubVal) : null;

  // Dynamic x-axis ticks — always from 0
  const xTicks = useMemo(() => getXTicks(visibleDays, milestone.maxDays), [visibleDays, milestone.maxDays]);

  // Pinch state ref
  const pinchRef = useRef<{ dist: number; startVisibleDays: number } | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (e, gs) =>
        e.nativeEvent.touches.length >= 2 || Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderGrant: (e) => {
        const touches = e.nativeEvent.touches;
        if (touches.length >= 2) {
          const dx = touches[1].pageX - touches[0].pageX;
          const dy = touches[1].pageY - touches[0].pageY;
          pinchRef.current = { dist: Math.sqrt(dx * dx + dy * dy), startVisibleDays: visibleDaysRef.current };
          setScrubX(null);
        } else {
          pinchRef.current = null;
          setScrubX(Math.max(PAD.left, Math.min(wRef.current - PAD.right, e.nativeEvent.locationX)));
        }
      },
      onPanResponderMove: (e) => {
        const touches = e.nativeEvent.touches;
        if (touches.length >= 2) {
          setScrubX(null);
          const dx = touches[1].pageX - touches[0].pageX;
          const dy = touches[1].pageY - touches[0].pageY;
          const newDist = Math.sqrt(dx * dx + dy * dy);
          if (!pinchRef.current) {
            pinchRef.current = { dist: newDist, startVisibleDays: visibleDaysRef.current };
            return;
          }
          const scale = pinchRef.current.dist / Math.max(newDist, 1);
          const maxDays = prevMilestoneDays.current;
          const newVisibleDays = Math.max(MIN_VISIBLE_DAYS, Math.min(maxDays, pinchRef.current.startVisibleDays * scale));
          setVisibleDays(newVisibleDays);
        } else if (touches.length === 1) {
          pinchRef.current = null;
          setScrubX(Math.max(PAD.left, Math.min(wRef.current - PAD.right, e.nativeEvent.locationX)));
        }
      },
      onPanResponderRelease: () => { pinchRef.current = null; setScrubX(null); },
      onPanResponderTerminate: () => { pinchRef.current = null; setScrubX(null); },
    })
  ).current;

  const tooltipOnRight = scrubX !== null && scrubX < W / 2;

  return (
    <View
      style={[styles.container, !propH && styles.flex, DEBUG_OUTLINES && styles.debug]}
      onLayout={!propH ? e => setMeasuredH(e.nativeEvent.layout.height) : undefined}
      {...panResponder.panHandlers}
    >
      {H > 0 && (
        <>
          <Svg width={W} height={H}>
            <Defs>
<LinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={isPositive ? COLORS.win : COLORS.loss} stopOpacity="0.22" />
                <Stop offset="100%" stopColor={isPositive ? COLORS.win : COLORS.loss} stopOpacity="0" />
              </LinearGradient>
              <LinearGradient id="fillGradDown" x1="0" y1={baseY.toFixed(1)} x2="0" y2={(PAD.top + innerH).toFixed(1)} gradientUnits="userSpaceOnUse">
                <Stop offset="0%" stopColor={COLORS.loss} stopOpacity="0.22" />
                <Stop offset="100%" stopColor={COLORS.loss} stopOpacity="0" />
              </LinearGradient>
              {/* Clip all curves to the graph area */}
              <ClipPath id="graphClip">
                <Rect x={PAD.left} y={0} width={innerW} height={H} />
              </ClipPath>
            </Defs>


            {/* Clipped group: all curves stay within graph bounds */}
            <G clipPath="url(#graphClip)">
              {/* Ideal curve: 1.01^day */}
              {idealRefPath ? (
                <Path d={idealRefPath} stroke={COLORS.win} strokeWidth={3.5} fill="none" opacity={0.4} />
              ) : null}

{/* Gradient fill under actual path */}
              {fillPath ? (
                <Path d={fillPath} fill={currentVal < 1.0 ? "url(#fillGradDown)" : "url(#fillGrad)"} stroke="none" />
              ) : null}

              {/* Actual data path — green→white→red gradient on down day */}
              {actualPath ? (
                <Path
                  d={actualPath}
                  stroke={isPositive ? COLORS.win : COLORS.loss}
                  strokeWidth={4}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
            </G>

            {/* Baseline — drawn after curves so it's always visible on top */}
            <Line
              x1={PAD.left} y1={baseY} x2={W - PAD.right} y2={baseY}
              stroke={COLORS.neutral} strokeWidth={2}
            />

            {/* Ideal label at right edge */}
            <SvgText
              x={W - PAD.right - 2} y={toY(maxVal) - 4}
              fill={COLORS.win} fontSize={8} textAnchor="end" opacity={0.35}
              fontFamily={FONTS.body.regular}
            >
              {toGrowthStr(maxVal)}
            </SvgText>

            {/* Min value label — only shown when data dips below baseline */}
            {minVal < 1.0 ? (
              <SvgText
                x={W - PAD.right - 2} y={PAD.top + innerH - 4}
                fill={COLORS.loss} fontSize={8} textAnchor="end" opacity={0.35}
                fontFamily={FONTS.body.regular}
              >
                {toGrowthStr(minVal)}
              </SvgText>
            ) : null}

            {/* Endpoint beacon + growth label */}
            {endPt != null ? (
              <>
                <Circle cx={endPt.x} cy={endPt.y} r={12}
                  fill={isPositive ? COLORS.win : COLORS.loss} opacity={0.15} />
                <Circle cx={endPt.x} cy={endPt.y} r={6}
                  fill={isPositive ? COLORS.win : COLORS.loss} opacity={0.4} />
                <Circle cx={endPt.x} cy={endPt.y} r={3.5}
                  fill={isPositive ? COLORS.win : COLORS.loss} />
                <SvgText
                  x={endPt.x + 10}
                  y={endPt.y + 4}
                  fill={isPositive ? COLORS.win : COLORS.loss}
                  fontSize={12}
                  fontFamily={FONTS.body.semiBold}
                  textAnchor="start"
                >
                  {toGrowthStr(currentVal)}
                </SvgText>
              </>
            ) : null}

            {/* X-axis ticks — dynamic based on zoom */}
            {xTicks.map((day, idx) => {
              const x = toX(day);
              const anchor = idx === 0 ? 'start' : idx === xTicks.length - 1 ? 'end' : 'middle';
              return (
                <React.Fragment key={day}>
                  <Line x1={x} y1={baseY} x2={x} y2={baseY + 4} stroke={COLORS.neutral} strokeWidth={1} />
                  <SvgText x={x} y={baseY + 13} fill={COLORS.textMuted} fontSize={9} textAnchor={anchor} fontFamily={FONTS.body.regular}>
                    {formatDay(day)}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {/* Scrub cursor line + dot */}
            {scrubX !== null && (
              <>
                <Line
                  x1={scrubX} y1={PAD.top} x2={scrubX} y2={PAD.top + innerH}
                  stroke={COLORS.text} strokeWidth={1} opacity={0.3}
                />
                {scrubDotY !== null && (
                  <Circle cx={scrubX} cy={scrubDotY} r={3.5}
                    fill={isPositive ? COLORS.win : COLORS.loss} />
                )}
              </>
            )}

          </Svg>

          {/* Stats overlay — top left, Robinhood-style */}
          <StatsOverlay
            currentVal={currentVal}
            isPositive={isPositive}
            isDailyPositive={isDailyPositive}
            dailyDeltaStr={dailyDeltaStr}
          />

          {/* Scrub tooltip — absolute RN View for readable multi-line text */}
          {scrubX !== null && scrubDay !== null && (
            <View style={[
              styles.tooltip,
              tooltipOnRight
                ? { left: scrubX + 12 }
                : { right: W - scrubX + 12 },
            ]}>
              <Text style={styles.tooltipDay}>Day {scrubDay}</Text>
              <View style={styles.tooltipRow}>
                <Text style={styles.tooltipLabel}>Expected</Text>
                <Text style={[styles.tooltipVal, { color: COLORS.win }]}>
                  {toGrowthStr(Math.pow(1.01, scrubDay))}
                </Text>
              </View>
              {scrubVal !== null && (
                <View style={styles.tooltipRow}>
                  <Text style={styles.tooltipLabel}>Current</Text>
                  <Text style={[styles.tooltipVal, { color: isPositive ? COLORS.win : COLORS.loss }]}>
                    {toGrowthStr(scrubVal)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 4 },
  flex:      { flex: 1 },
  debug:     { borderWidth: 1, borderColor: '#0ff' },
  tooltip: {
    position: 'absolute',
    top: PAD.top + 6,
    backgroundColor: COLORS.bgCard,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    minWidth: 148,
    gap: 3,
  },
  tooltipDay: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: FONTS.body.medium,
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  tooltipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tooltipLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.body.regular,
  },
  tooltipVal: {
    fontSize: 11,
    fontFamily: FONTS.body.semiBold,
    fontVariant: ['tabular-nums'],
  },
});
