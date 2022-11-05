import React, { useMemo, useState, useCallback, useRef } from "react";
import { Group } from "@visx/group";
import { Circle } from "@visx/shape";
import { GradientPinkBlue } from "@visx/gradient";
import { scaleLinear } from "@visx/scale";
import { withTooltip, Tooltip } from "@visx/tooltip";
import { WithTooltipProvidedProps } from "@visx/tooltip/lib/enhancers/withTooltip";
import { voronoi, VoronoiPolygon } from "@visx/voronoi";
import { localPoint } from "@visx/event";
import { Point, PointsRange } from "../../types";
import { genRandomNormalPoints } from "@visx/mock-data";

const BASE_R = 2;
const CIRCLE_RESIZE_FACTOR = 3;

// const points: PointsRange[] = genRandomNormalPoints(600, /* seed= */ 0.5).filter((_, i) => i < 600);

type DotsProps = {
  width: number;
  height: number;
  showControls?: boolean;
  graphData: Point[];
};

let tooltipTimeout: number;

export default withTooltip<DotsProps, PointsRange>(
  ({
    width,
    height,
    // TODO fix the voronoi
    showControls = true,
    hideTooltip,
    showTooltip,
    tooltipOpen,
    tooltipData,
    tooltipLeft,
    tooltipTop,
    graphData,
  }: DotsProps & WithTooltipProvidedProps<PointsRange>) => {
    if (width < 10) return null;

    const minX = Math.min(...graphData.map((point) => point.x));
    const maxX = Math.max(...graphData.map((point) => point.x));
    const minY = Math.min(...graphData.map((point) => point.y));
    const maxY = Math.max(...graphData.map((point) => point.y));

    const xPadding = (maxX - minX) * 0.05;
    const yPadding = (maxY - minY) * 0.05;

    const minXWithPadding = minX - xPadding;
    const minYWithPadding = minY - yPadding;
    const maxXWithPadding = maxX + xPadding;
    const maxYWithPadding = maxY + yPadding;

    const [showVoronoi, setShowVoronoi] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const xScale = useMemo(
      () =>
        scaleLinear<number>({
          domain: [minXWithPadding, maxXWithPadding],
          range: [0, width],
          clamp: true,
        }),
      [width]
    );
    const yScale = useMemo(
      () =>
        scaleLinear<number>({
          domain: [minYWithPadding, maxYWithPadding],
          range: [height, 0],
          clamp: true,
        }),
      [height]
    );
    const voronoiLayout = useMemo(
      () =>
        voronoi<Point>({
          x: (d) => xScale(d.x) ?? 0,
          y: (d) => yScale(d.y) ?? 0,
          width,
          height,
        })(graphData),
      [width, height, xScale, yScale]
    );

    // event handlers
    const handleMouseMove = useCallback(
      (event: React.MouseEvent | React.TouchEvent) => {
        if (tooltipTimeout) clearTimeout(tooltipTimeout);
        if (!svgRef.current) return;

        // find the nearest polygon to the current mouse position
        const point = localPoint(svgRef.current, event);
        if (!point) return;
        const neighborRadius = 100;
        const closest = voronoiLayout.find(point.x, point.y, neighborRadius);
        if (closest) {
          // TODO tooltip on right edge causes jitter
          // TODO make it to bottom right
          showTooltip({
            tooltipLeft: xScale(closest.data.x),
            tooltipTop: yScale(closest.data.y),
            tooltipData: [closest.data.x, closest.data.y, undefined],
          });
        }
      },
      [xScale, yScale, showTooltip, voronoiLayout]
    );

    const handleMouseLeave = useCallback(() => {
      tooltipTimeout = window.setTimeout(() => {
        hideTooltip();
      }, 10);
    }, [hideTooltip]);

    return (
      <div>
        <svg width={width} height={height} ref={svgRef}>
          <GradientPinkBlue id="dots-pink" rotate={45} x1={-0.5} x2={0} y1={0} y2={1} />
          {/** capture all mouse events with a rect */}
          <rect
            width={width}
            height={height}
            rx={14}
            fill="url(#dots-pink)"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseLeave}
          />
          <Group pointerEvents="none">
            {graphData.map((point, i) => {
              const xPoint = point.x;
              const yPoint = point.y;

              const size = BASE_R + xPoint * yPoint * CIRCLE_RESIZE_FACTOR;

              return (
                <Circle
                  key={`point-${point.x}-${i}`}
                  className="dot"
                  cx={xScale(xPoint)}
                  cy={yScale(yPoint)}
                  r={size}
                  fill={
                    // TODO this feels clunky, look into after we customize tooltip
                    tooltipData?.[0] === point.x && tooltipData?.[1] === point.y
                      ? "white"
                      : "#f6c431"
                  }
                />
              );
            })}
            {showVoronoi &&
              voronoiLayout.polygons().map((polygon, i) => (
                <VoronoiPolygon
                  key={`polygon-${i}`}
                  polygon={polygon}
                  fill="white"
                  stroke="white"
                  strokeWidth={1}
                  strokeOpacity={0.2}
                  fillOpacity={
                    // TODO this feels clunky, look into later
                    tooltipData[0] === polygon.data.x && tooltipData[1] === polygon.data.y ? 0.5 : 0
                  }
                />
              ))}
          </Group>
        </svg>
        {tooltipOpen && tooltipData && tooltipLeft != null && tooltipTop != null && (
          <Tooltip left={tooltipLeft + 10} top={tooltipTop + 10}>
            <div>
              <strong>x:</strong> {tooltipData[0]}
            </div>
            <div>
              <strong>y:</strong> {tooltipData[1]}
            </div>
          </Tooltip>
        )}
        {showControls && (
          <div>
            <label style={{ fontSize: 12 }}>
              <input
                type="checkbox"
                checked={showVoronoi}
                onChange={() => setShowVoronoi(!showVoronoi)}
              />
              &nbsp;Show voronoi point map
            </label>
          </div>
        )}
      </div>
    );
  }
);