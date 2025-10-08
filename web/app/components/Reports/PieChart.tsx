import { ResponsivePie } from "@nivo/pie";

interface PieChartProps {
  data: any[];
  innerRadius?: number;
  padAngle?: number;
  cornerRadius?: number;
  colors?: any;
  height?: number;
}

const PieChart = ({
  data,
  innerRadius = 0.5,
  padAngle = 1,
  cornerRadius = 3,
  colors = { scheme: "set2" },
  height = 400,
}: PieChartProps) => {
  return (
    <div style={{ height, width: '100%' }}>
      <ResponsivePie
        data={data}
        margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
        innerRadius={innerRadius} // 0 for Pie, 0.5 for Donut
        padAngle={padAngle}
        cornerRadius={cornerRadius}
        activeOuterRadiusOffset={8}
        colors={colors}
        borderWidth={1}
        borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
        arcLinkLabelsSkipAngle={15}
        arcLinkLabelsTextColor="#333333"
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: "color" }}
        arcLinkLabelsDiagonalLength={12}
        arcLinkLabelsStraightLength={16}
        arcLabelsSkipAngle={15}
        arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
        enableArcLabels={false}
        enableArcLinkLabels={true}
        legends={[
          {
            anchor: "bottom",
            direction: "row",
            justify: false,
            translateY: 56,
            itemWidth: 90,
            itemHeight: 18,
            itemsSpacing: 4,
            symbolSize: 12,
            symbolShape: "circle",
            itemTextColor: "#333",
            itemDirection: "left-to-right",
          },
        ]}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
};

export default PieChart;
