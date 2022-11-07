import { localPoint } from "@visx/event";
import { scaleLinear } from "@visx/scale";
import { useTooltip } from "@visx/tooltip";
import { voronoi } from "@visx/voronoi";
import React, { useMemo, useState, useCallback, useRef } from "react";
import { EnhancedPoint, PointWithTitleAndId } from "../types";

function useCircles(
  graphData: EnhancedPoint[],
  apexData: PointWithTitleAndId,
  width: number,
  height: number
) {
  const { hideTooltip, showTooltip, tooltipOpen, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<EnhancedPoint>();

  const [tooltipMessage, setTooltipMessage] = useState<JSX.Element>(undefined);
  const [activeDot, setActiveDot] = useState<EnhancedPoint>();
  const [linkAlertIsOpen, setLinkAlertIsOpen] = useState(false);

  let tooltipTimeout: number;
  const minMaxXY = useMemo(() => {
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

    return { minXWithPadding, minYWithPadding, maxXWithPadding, maxYWithPadding };
  }, [graphData]);

  const svgRef = useRef<SVGSVGElement>(null);
  const xScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [minMaxXY.minXWithPadding, minMaxXY.maxXWithPadding],
        range: [0, width],
        clamp: true,
      }),
    [width, minMaxXY.minXWithPadding, minMaxXY.maxXWithPadding]
  );
  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [minMaxXY.minYWithPadding, minMaxXY.maxYWithPadding],
        range: [height, 0],
        clamp: true,
      }),
    [height, minMaxXY.minYWithPadding, minMaxXY.maxYWithPadding]
  );
  const voronoiLayout = useMemo(
    () =>
      voronoi<EnhancedPoint>({
        x: (d) => xScale(d.x) ?? 0,
        y: (d) => yScale(d.y) ?? 0,
        width,
        height,
      })(graphData),
    [width, height, xScale, yScale, graphData]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (tooltipTimeout) clearTimeout(tooltipTimeout);
      if (!svgRef.current) return;

      const point = localPoint(svgRef.current, event);
      if (!point) return;
      const neighborRadius = 100;
      const closest = voronoiLayout.find(point.x, point.y, neighborRadius);
      if (closest) {
        setActiveDot(closest.data);
        showTooltip({
          tooltipLeft: xScale(closest.data.x),
          tooltipTop: yScale(closest.data.y),
          tooltipData: closest.data,
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

  const circleClick = useCallback(() => {
    console.log("circleClick tooltipData", tooltipData);

    setTooltipMessage(
      <>
        create a link between [[<strong>{tooltipData?.title}</strong>]] and [[
        <strong>{apexData?.title}</strong>]]?
      </>
    );
    setLinkAlertIsOpen(true);
  }, [tooltipData, apexData]);

  const handleLinkConfirm = useCallback(() => {
    const linkPagesAsync = async () => {
      console.log("handleLinkConfirm activeDot", activeDot);
      console.log("apexData", apexData);

      await window.roamAlphaAPI.createBlock({
        location: { "parent-uid": apexData.uid, order: 0 },
        block: {
          string: `on [[${window.roamAlphaAPI.util.dateToPageTitle(
            new Date()
          )}]] you used [[Similar Pages extension]] to link ${apexData.title} to [[${
            activeDot.title
          }]]`,
        },
      });

      // TODO move dot over to reflect new distance
      // TODO make the dot a different color to indicate it's linked
      // TODO stop moved dot from being linkable (?)

      setLinkAlertIsOpen(false);
    };

    linkPagesAsync();
  }, [activeDot, apexData]);

  const handleLinkCancel = useCallback(() => {
    setLinkAlertIsOpen(false);
  }, []);

  return {
    svgRef,
    handleMouseMove,
    handleMouseLeave,
    circleClick,
    activeDot,
    xScale,
    yScale,
    voronoiLayout,
    tooltipData,
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    linkAlertIsOpen,
    handleLinkConfirm,
    handleLinkCancel,
    tooltipMessage,
  };
}

export { useCircles };
