import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function SummaryPlot() {
  const data = {
    labels: [
      'MonthlyIncome',
      'YearsAtCompany',
      'Age',
      'JobLevel',
      'TotalWorkingYears',
      'WorkLifeBalance',
      'JobSatisfaction',
      'DistanceFromHome',
      'OverTime',
      'Environment'
    ],
    datasets: [
      {
        label: 'SHAP Values',
        data: [0.42, 0.38, 0.35, 0.32, 0.28, 0.25, 0.22, 0.18, 0.15, 0.12],
        backgroundColor: 'rgba(53, 162, 235, 0.8)',
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    plugins: {
      title: {
        display: true,
        text: 'Feature Importance (SHAP Values)',
      },
    },
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Mean |SHAP Value|'
        }
      }
    }
  };

  return <Bar options={options} data={data} />;
}

export function DependencePlot({ feature }: { feature: string }) {
  const data = {
    labels: Array.from({ length: 100 }, (_, i) => i),
    datasets: [
      {
        label: `SHAP Value vs ${feature}`,
        data: Array.from({ length: 100 }, () => Math.random() * 2 - 1),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgba(53, 162, 235, 0.8)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    plugins: {
      title: {
        display: true,
        text: `SHAP Dependence Plot for ${feature}`,
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'SHAP Value'
        }
      },
      x: {
        title: {
          display: true,
          text: feature
        }
      }
    }
  };

  return <Line options={options} data={data} />;
}

export function IndividualPlot({ employeeId }: { employeeId?: string }) {
  const data = {
    labels: [
      'MonthlyIncome',
      'YearsAtCompany',
      'Age',
      'JobLevel',
      'TotalWorkingYears',
      'WorkLifeBalance',
      'JobSatisfaction',
      'DistanceFromHome',
      'OverTime',
      'Environment'
    ],
    datasets: [
      {
        label: 'Feature Contribution',
        data: [-0.3, 0.5, 0.2, -0.1, 0.4, -0.2, 0.3, -0.4, 0.1, -0.15],
        backgroundColor: (context: any) => {
          const value = context.raw;
          return value > 0 ? 'rgba(75, 192, 192, 0.8)' : 'rgba(255, 99, 132, 0.8)';
        },
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    plugins: {
      title: {
        display: true,
        text: `Individual Feature Contributions ${employeeId ? `for Employee ${employeeId}` : ''}`,
      },
    },
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: 'SHAP Value'
        }
      }
    }
  };

  return <Bar options={options} data={data} />;
}