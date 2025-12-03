import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from "recharts";

type PieData = {
  name: string;
  value: number;
};

interface Props {
  data: PieData[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#e63946"];

// 🟩 Custom Label di Dalam Slice
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={14}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function PieChartCustom({ data }: Props) {
  const total = data.reduce((a, b) => a + b.value, 0);

  const actualData = total === 0 ? [{ name: "Tidak ada data", value: 1 }] : data;

  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={actualData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={110}
            label={total !== 0 ? renderCustomizedLabel : false}
            labelLine={false} // garis label dimatikan
          >
            {actualData.map((entry, index) => (
              <Cell
                key={index}
                fill={total === 0 ? "#d1d5db" : COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
