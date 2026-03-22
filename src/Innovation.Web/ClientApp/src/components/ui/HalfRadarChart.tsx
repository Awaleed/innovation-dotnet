import React from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  label: string;
  value: number;
  color: string;
}

interface Group {
  name: string;
  startIndex: number;
  endIndex: number;
  color?: string;
}

interface HalfRadarChartProps {
  // Matrix format: data[seriesIndex][axisIndex] = value
  data: number[][];
  labels?: string[];
  colors?: string[];
  maxValue?: number;
  levels?: number;
  width?: number;
  height?: number;
  groups?: Group[];
}

export default function HalfRadarChart({
  data,
  labels = [],
  colors = [],
  maxValue = 100,
  levels = 5,
  width = 600,
  height = 350,
  groups = [],
}: HalfRadarChartProps) {
  const centerX = width / 2;
  const centerY = height - 40;
  const radius = Math.min(width / 2, height - 40) - 60;

  // Get number of axes from first series length
  const numAxes = data.length > 0 ? (data[0]?.length ?? 0) : 0;

  // Generate default labels if not provided
  const axisLabels =
    labels.length > 0 ? labels : Array.from({ length: numAxes }, (_, i) => `Axis ${i + 1}`);

  // Generate default colors if not provided
  const defaultColors = [
    'hsl(217, 91%, 60%)', // Blue
    'hsl(142, 71%, 45%)', // Green
    'hsl(0, 84%, 60%)', // Red
    'hsl(38, 92%, 50%)', // Orange
    'hsl(271, 81%, 56%)', // Purple
    'hsl(199, 89%, 48%)', // Cyan
  ];

  const seriesColors =
    colors.length > 0
      ? colors
      : Array.from({ length: data.length }, (_, i) => defaultColors[i % defaultColors.length]);

  // Convert matrix to DataPoint arrays for each series
  const dataSeries: DataPoint[][] = data.map((series, seriesIndex) =>
    series.map((value, axisIndex) => ({
      label: axisLabels[axisIndex] ?? `Axis ${axisIndex + 1}`,
      value,
      color: seriesColors[seriesIndex] ?? defaultColors[0] ?? 'hsl(217, 91%, 60%)',
    })),
  );

  // Calculate angle for each data point (spread across 180 degrees)
  const angleStep = numAxes > 1 ? Math.PI / (numAxes - 1) : 0;

  // Generate grid levels
  const gridLevels = Array.from({ length: levels }, (_, i) => (i + 1) / levels);

  // Helper to convert angle from radians to degrees
  const toDegrees = (radians: number) => Math.round(radians * (180 / Math.PI));

  // Generate value labels for the horizontal axis
  const valueLabels = Array.from({ length: levels + 1 }, (_, i) =>
    Math.round((i / levels) * maxValue),
  );

  // Calculate position for a point - INVERTED: 100% at center, 0% at edge
  const getPointPosition = (angle: number, value: number) => {
    const normalizedValue = value / maxValue;
    // Invert the radius calculation: 100% = center (r=0), 0% = edge (r=radius)
    const r = radius * (1 - normalizedValue);
    const x = centerX + r * Math.cos(Math.PI - angle);
    const y = centerY - r * Math.sin(Math.PI - angle);
    return { x, y };
  };

  // Get edge position for labels and line starting points
  const getEdgePosition = (angle: number) => {
    const x = centerX + radius * Math.cos(Math.PI - angle);
    const y = centerY - radius * Math.sin(Math.PI - angle);
    return { x, y };
  };

  // Generate arc path for concentric grid lines
  const generateArcPath = (level: number) => {
    const r = radius * level;
    const path = [];

    for (let i = 0; i <= numAxes - 1; i++) {
      const angle = i * angleStep;
      const x = centerX + r * Math.cos(Math.PI - angle);
      const y = centerY - r * Math.sin(Math.PI - angle);

      if (i === 0) {
        path.push(`M ${x} ${y}`);
      } else {
        path.push(`L ${x} ${y}`);
      }
    }

    return path.join(' ');
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <svg
        width={width}
        height={height}
        className="max-w-full h-auto"
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          {/* Glow filters for points */}
          {dataSeries.flatMap((series, seriesIndex) =>
            series.map((_, pointIndex) => (
              <filter
                key={`glow-${seriesIndex}-${pointIndex}`}
                id={`glow-${seriesIndex}-${pointIndex}`}
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            )),
          )}
        </defs>

        {/* Group background indicators (optional) */}
        {groups.map((group, groupIndex) => {
          const startAngle = group.startIndex * angleStep;
          const endAngle = group.endIndex * angleStep;

          // Create a filled area for the group
          const groupPath = [];

          // Outer arc
          for (let i = group.startIndex; i <= group.endIndex; i++) {
            const angle = i * angleStep;
            const x = centerX + radius * Math.cos(Math.PI - angle);
            const y = centerY - radius * Math.sin(Math.PI - angle);
            groupPath.push(i === group.startIndex ? `M ${x} ${y}` : `L ${x} ${y}`);
          }

          // Line to center area
          const endX = centerX + 20 * Math.cos(Math.PI - endAngle);
          const endY = centerY - 20 * Math.sin(Math.PI - endAngle);
          groupPath.push(`L ${endX} ${endY}`);

          // Inner arc back
          for (let i = group.endIndex; i >= group.startIndex; i--) {
            const angle = i * angleStep;
            const x = centerX + 20 * Math.cos(Math.PI - angle);
            const y = centerY - 20 * Math.sin(Math.PI - angle);
            groupPath.push(`L ${x} ${y}`);
          }

          groupPath.push('Z');

          return (
            <motion.g key={`group-${groupIndex}`}>
              {/* Background fill */}
              <motion.path
                d={groupPath.join(' ')}
                fill={group.color || `hsl(${groupIndex * 60}, 70%, 50%)`}
                opacity={0.08}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.08 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />

              {/* Group boundary lines */}
              <motion.line
                x1={centerX}
                y1={centerY}
                x2={centerX + radius * Math.cos(Math.PI - startAngle)}
                y2={centerY - radius * Math.sin(Math.PI - startAngle)}
                stroke={group.color || `hsl(${groupIndex * 60}, 70%, 50%)`}
                strokeWidth="2"
                opacity={0.4}
                strokeDasharray="5 5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />

              <motion.line
                x1={centerX}
                y1={centerY}
                x2={centerX + radius * Math.cos(Math.PI - endAngle)}
                y2={centerY - radius * Math.sin(Math.PI - endAngle)}
                stroke={group.color || `hsl(${groupIndex * 60}, 70%, 50%)`}
                strokeWidth="2"
                opacity={0.4}
                strokeDasharray="5 5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />

              {/* Group label */}
              <motion.text
                x={centerX + (radius + 40) * Math.cos(Math.PI - (startAngle + endAngle) / 2)}
                y={centerY - (radius + 40) * Math.sin(Math.PI - (startAngle + endAngle) / 2)}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-bold"
                fill={group.color || `hsl(${groupIndex * 60}, 70%, 50%)`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                {group.name}
              </motion.text>
            </motion.g>
          );
        })}

        {/* Concentric grid arcs (semi-circular arcs) */}
        {gridLevels.map((level, i) => (
          <path
            key={`arc-${i}`}
            d={generateArcPath(level)}
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1"
            opacity={i === gridLevels.length - 1 ? 0.5 : 0.15}
          />
        ))}

        {/* Outer border (top arc and horizontal base) */}
        <g>
          {/* Outer arc */}
          <path
            d={generateArcPath(1)}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="1.5"
            opacity={0.6}
          />
          {/* Horizontal base line */}
          <line
            x1={centerX - radius}
            y1={centerY}
            x2={centerX + radius}
            y2={centerY}
            stroke="hsl(var(--foreground))"
            strokeWidth="1.5"
            opacity={0.6}
          />
        </g>

        {/* Axis lines (radial spokes) */}
        {Array.from({ length: numAxes }).map((_, i) => {
          const angle = i * angleStep;
          const { x: edgeX, y: edgeY } = getEdgePosition(angle);

          return (
            <motion.line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={edgeX}
              y2={edgeY}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="0.5"
              opacity={0.2}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.2 }}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.01 }}
            />
          );
        })}

        {/* Degree labels along the outer edge */}
        {Array.from({ length: numAxes }).map((_, i) => {
          const angle = i * angleStep;
          const degrees = toDegrees(angle);

          // Position label on outer edge
          const labelOffset = 15;
          const labelX = centerX + (radius + labelOffset) * Math.cos(Math.PI - angle);
          const labelY = centerY - (radius + labelOffset) * Math.sin(Math.PI - angle);

          return (
            <text
              key={`degree-${i}`}
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs font-medium"
              fill="hsl(var(--muted-foreground))"
            >
              {degrees}°
            </text>
          );
        })}

        {/* Value labels along the horizontal base */}
        {valueLabels.map((value, i) => {
          const r = radius * (i / levels);
          const x = centerX - radius + r * 2;
          const y = centerY + 20;

          return (
            <text
              key={`value-${i}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="hanging"
              className="text-xs font-medium"
              fill="hsl(var(--muted-foreground))"
            >
              {value}
            </text>
          );
        })}

        {/* Data labels at the outer edge (if there are labels) */}
        {axisLabels.length > 0 &&
          axisLabels.length < 30 &&
          axisLabels.map((label, i) => {
            const angle = i * angleStep;

            // Position label slightly beyond the edge, outside the degree labels
            const labelOffset = 40;
            const labelX = centerX + (radius + labelOffset) * Math.cos(Math.PI - angle);
            const labelY = centerY - (radius + labelOffset) * Math.sin(Math.PI - angle);

            return (
              <motion.text
                key={`label-${i}`}
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[9px] font-semibold"
                fill="hsl(var(--foreground))"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.01 }}
              >
                {label}
              </motion.text>
            );
          })}

        {/* Render each series */}
        {dataSeries.map((series, seriesIndex) => (
          <g key={`series-${seriesIndex}`}>
            {/* Connecting lines from edge to each point */}
            {series.map((point, i) => {
              const angle = i * angleStep;
              const { x: edgeX, y: edgeY } = getEdgePosition(angle);
              const { x: pointX, y: pointY } = getPointPosition(angle, point.value);

              return (
                <motion.line
                  key={`connect-${seriesIndex}-${i}`}
                  x1={edgeX}
                  y1={edgeY}
                  x2={edgeX}
                  y2={edgeY}
                  stroke={point.color}
                  strokeWidth="1.5"
                  opacity={0.3}
                  initial={{ x2: edgeX, y2: edgeY }}
                  animate={{ x2: pointX, y2: pointY }}
                  transition={{
                    duration: 1,
                    delay: 0.6 + seriesIndex * 0.1 + i * 0.02,
                    ease: 'easeOut',
                  }}
                />
              );
            })}

            {/* Data points - smaller for compact display */}
            {series.map((point, i) => {
              const angle = i * angleStep;
              const { x: edgeX, y: edgeY } = getEdgePosition(angle);
              const { x: pointX, y: pointY } = getPointPosition(angle, point.value);

              return (
                <motion.g
                  key={`point-${seriesIndex}-${i}`}
                  initial={{ x: edgeX - centerX, y: edgeY - centerY, scale: 0, opacity: 0 }}
                  animate={{
                    x: pointX - centerX,
                    y: pointY - centerY,
                    scale: 1,
                    opacity: 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.6 + seriesIndex * 0.1 + i * 0.02,
                  }}
                >
                  {/* Outer glow circle */}
                  <motion.circle
                    cx={centerX}
                    cy={centerY}
                    r="5"
                    fill={point.color}
                    opacity={0.2}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      delay: seriesIndex * 0.05 + i * 0.05,
                    }}
                  />

                  {/* Main point - smaller */}
                  <motion.circle
                    cx={centerX}
                    cy={centerY}
                    r="3.5"
                    fill={point.color}
                    stroke="white"
                    strokeWidth="1.5"
                    filter={`url(#glow-${seriesIndex}-${i})`}
                    style={{ cursor: 'pointer' }}
                    whileHover={{
                      scale: 2,
                      transition: { duration: 0.2 },
                    }}
                  />

                  {/* Inner white dot */}
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r="1.2"
                    fill="white"
                    opacity={0.9}
                    style={{ pointerEvents: 'none' }}
                  />
                </motion.g>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}
