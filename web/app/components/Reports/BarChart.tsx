import { ResponsiveBar } from "@nivo/bar";

interface BarChartProps {
  data: any[];
  keys: string[];
  indexBy: string;
  axisBottomLabel: string;
  axisLeftLabel: string;
  colors?: any;
  rotateLabels?: boolean;
  height?: number;
}

const BarChart = ({
  data,
  keys,
  indexBy,
  axisBottomLabel,
  axisLeftLabel,
  colors = { scheme: "nivo" },
  rotateLabels = true,
  height = 400,
}: BarChartProps) => {
  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveBar
        data={data}
        keys={keys}
        indexBy={indexBy}
        margin={{ top: 20, right: 30, bottom: 90, left: 70 }}
        padding={0.3}
        valueScale={{ type: "linear" }}
        indexScale={{ type: "band", round: true }}
        colors={colors}
        borderColor={{
          from: "color",
          modifiers: [["darker", 1.6]],
        }}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: rotateLabels ? -45 : 0,
          legend: axisBottomLabel,
          legendPosition: "middle",
          legendOffset: 70,
          truncateTickAt: 0,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          legend: axisLeftLabel,
          legendPosition: "middle",
          legendOffset: -55,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{
          from: "color",
          modifiers: [["darker", 1.6]],
        }}
        animate={true}
        motionConfig="gentle"
        role="application"
        enableLabel={false}
        theme={{
          axis: {
            ticks: {
              text: {
                fontSize: 11,
              },
            },
            legend: {
              text: {
                fontSize: 12,
                fontWeight: 600,
              },
            },
          },
        }}
      />
    </div>
  );
};

export default BarChart;
