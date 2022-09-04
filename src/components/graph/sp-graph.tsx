import { ResponsiveScatterPlotCanvas } from "@nivo/scatterplot";
import Graph from "graphology";
import { Attributes } from "graphology-types";
import React from "react";
import { SelectablePage } from "../../types";
import data from "./data";

type SpGraphProps = {
  graph: Graph<Attributes, Attributes, Attributes>;
  selectedPage: SelectablePage;
};

const SpGraph = ({ graph }: SpGraphProps) => {
  // const [count, setCount] = React.useState(0);
  console.log("data", data);
  return (
    <ResponsiveScatterPlotCanvas
      renderWrapper={true}
      renderNode={(ctx, node) => {
        // ctx.globalCompositeOperation = "overlay";

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size / 2, 0, 2 * Math.PI);
        ctx.fillStyle = "#417668c2";
        // ctx.fillStyle = node.color;
        ctx.fill();
      }}
      data={data}
      xScale={{ type: "linear", min: -1, max: "auto" }}
      xFormat=">-.2f"
      yScale={{ type: "linear", min: -1, max: "auto" }}
      yFormat=">-.2f"
      nodeSize={20}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "weight",
        legendPosition: "middle",
        legendOffset: 46,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "size",
        legendPosition: "middle",
        legendOffset: -60,
      }}
      legends={[
        {
          anchor: "bottom-right",
          direction: "column",
          justify: false,
          translateX: 130,
          translateY: 0,
          itemWidth: 100,
          itemHeight: 12,
          itemsSpacing: 5,
          itemDirection: "left-to-right",
          symbolSize: 12,
          symbolShape: "circle",
          effects: [
            {
              on: "hover",
              style: {
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
    />
  );
};

export default SpGraph;
