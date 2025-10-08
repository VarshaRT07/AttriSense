import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import PDFDocument from "pdfkit";
import pool from "../config/database.js";

// Initialize chart renderer
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width: 600,
  height: 400,
  backgroundColour: "white",
});

// Helper function to calculate health index
const calculateHealthIndex = (stats) => {
  const {
    attritionRate,
    avgPerformanceRating,
    avgSalary,
    highRiskCount,
    totalEmployees,
  } = stats;

  // Weighted scoring system (0-100)
  const attritionScore = Math.max(0, 100 - attritionRate * 5); // Lower is better
  const performanceScore = (avgPerformanceRating / 5) * 100; // Higher is better
  const riskScore = Math.max(0, 100 - (highRiskCount / totalEmployees) * 100); // Lower risk is better

  // Weighted average
  const healthIndex =
    attritionScore * 0.4 + performanceScore * 0.3 + riskScore * 0.3;

  return {
    score: Math.round(healthIndex),
    status:
      healthIndex >= 80
        ? "Excellent"
        : healthIndex >= 60
        ? "Good"
        : healthIndex >= 40
        ? "Fair"
        : "Critical",
    components: {
      attrition: Math.round(attritionScore),
      performance: Math.round(performanceScore),
      risk: Math.round(riskScore),
    },
  };
};

// Generate insights based on data with real-world benchmarks
const generateInsights = (stats, departmentData, riskDistribution) => {
  const insights = [];

  // Calculate key metrics for insights
  const highRiskPercentage =
    (riskDistribution.high / stats.totalEmployees) * 100;
  const industryAvgAttrition = 12.5; // Industry benchmark
  const costPerAttrition = stats.avgSalary * 1.5; // 150% of annual salary
  const totalAttritionCost =
    stats.attritionRate > 0
      ? Math.round(
          (stats.totalEmployees *
            (stats.attritionRate / 100) *
            costPerAttrition) /
            1000000
        )
      : 0;

  // Executive Summary Insight
  insights.push({
    type:
      stats.attritionRate > 15
        ? "critical"
        : stats.attritionRate > 10
        ? "warning"
        : "positive",
    category: "Executive Summary",
    message: `Current attrition rate: ${stats.attritionRate.toFixed(
      1
    )}% (Industry avg: ${industryAvgAttrition}%). Estimated annual cost: $${totalAttritionCost}M`,
    recommendation:
      stats.attritionRate > industryAvgAttrition
        ? `Reducing attrition by 5% could save ~$${Math.round(
            totalAttritionCost * 0.33
          )}M annually`
        : "Maintain current retention strategies and monitor trends",
  });

  // High-Risk Employee Insight
  if (highRiskPercentage > 20) {
    insights.push({
      type: "critical",
      category: "Risk Management",
      message: `${highRiskPercentage.toFixed(1)}% (${
        riskDistribution.high
      } employees) at high attrition risk. Potential loss: $${Math.round(
        (riskDistribution.high * costPerAttrition) / 1000000
      )}M`,
      recommendation:
        "Implement 1-on-1 retention meetings, career development plans, and competitive compensation reviews for high-risk employees",
    });
  } else if (highRiskPercentage > 10) {
    insights.push({
      type: "warning",
      category: "Risk Management",
      message: `${highRiskPercentage.toFixed(
        1
      )}% employees at high risk. Early intervention can prevent 60-70% of potential attrition`,
      recommendation:
        "Deploy pulse surveys and engagement initiatives targeting at-risk segments",
    });
  }

  // Department-Specific Insights
  const highRiskDepts = departmentData.filter((d) => d.attrition_rate > 15);
  const topAttritionDept = departmentData[0]; // Already sorted by attrition_rate DESC

  if (highRiskDepts.length > 0) {
    insights.push({
      type: "warning",
      category: "Department Analysis",
      message: `${topAttritionDept.department} has highest attrition (${topAttritionDept.attrition_rate}%). ${highRiskDepts.length} dept(s) exceed 15% threshold`,
      recommendation: `Focus on ${topAttritionDept.department}: Review manager effectiveness, workload distribution, and team dynamics. Consider skip-level meetings`,
    });
  }

  // Performance & Engagement Insight
  if (stats.avgPerformanceRating < 3.5) {
    insights.push({
      type: "warning",
      category: "Performance & Engagement",
      message: `Average performance rating ${stats.avgPerformanceRating.toFixed(
        2
      )}/5.0 indicates engagement issues. Low performers are 3x more likely to leave`,
      recommendation:
        "Implement performance improvement plans, mentorship programs, and skills training. Review goal-setting processes",
    });
  } else if (stats.avgPerformanceRating >= 4.0) {
    insights.push({
      type: "positive",
      category: "Performance & Engagement",
      message: `Strong performance rating ${stats.avgPerformanceRating.toFixed(
        2
      )}/5.0. High performers need retention focus to prevent competitive poaching`,
      recommendation:
        "Offer career advancement opportunities, challenging projects, and recognition programs for top performers",
    });
  }

  // Compensation Insight with market analysis
  const marketRate = 75000; // Market average
  const compensationGap = ((marketRate - stats.avgSalary) / marketRate) * 100;

  if (stats.avgSalary < marketRate * 0.9) {
    insights.push({
      type: "critical",
      category: "Compensation Strategy",
      message: `Average salary $${Math.round(
        stats.avgSalary
      ).toLocaleString()} is ${Math.abs(compensationGap).toFixed(
        1
      )}% below market. 45% of exits cite compensation`,
      recommendation: `Conduct immediate market analysis. Budget $${Math.round(
        (stats.totalEmployees * (marketRate - stats.avgSalary) * 0.1) / 1000
      )}K for targeted adjustments`,
    });
  } else if (stats.avgSalary >= marketRate * 1.1) {
    insights.push({
      type: "positive",
      category: "Compensation Strategy",
      message: `Competitive compensation (${Math.abs(compensationGap).toFixed(
        1
      )}% above market). Focus retention efforts on non-monetary factors`,
      recommendation:
        "Invest in work-life balance, flexible arrangements, and career development programs",
    });
  }

  return insights.slice(0, 6); // Limit to 6 key insights for space
};

// Generate chart as buffer
const generateChart = async (type, data, options) => {
  const configuration = {
    type,
    data,
    options: {
      ...options,
      plugins: {
        ...options.plugins,
        legend: {
          display: true,
          position: "bottom",
        },
      },
    },
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
};

// Main PDF generation function
const generatePDFReport = async (req, res) => {
  try {
    // Fetch all required data
    const [statsResult, departmentResult, riskResult, employeeResult] =
      await Promise.all([
        pool.query(`
        SELECT
          COUNT(*) as total_employees,
          COUNT(CASE WHEN attrition = 0 THEN 1 END) as active_employees,
          COUNT(CASE WHEN attrition = 1 THEN 1 END) as attrited_employees,
          ROUND(AVG(CASE WHEN attrition = 0 THEN performance_rating END), 2) as avg_performance_rating,
          ROUND(AVG(CASE WHEN attrition = 0 THEN salary END), 2) as avg_salary,
          COUNT(CASE WHEN attrition_score >= 0.7 THEN 1 END) as high_risk_count
        FROM employees
      `),
        pool.query(`
        SELECT
          department,
          COUNT(*) as total,
          COUNT(CASE WHEN attrition = 1 THEN 1 END) as attrited,
          ROUND((COUNT(CASE WHEN attrition = 1 THEN 1 END)::numeric / COUNT(*)) * 100, 2) as attrition_rate,
          ROUND(AVG(salary), 2) as avg_salary,
          ROUND(AVG(attrition_score), 3) as avg_risk_score
        FROM employees
        GROUP BY department
        ORDER BY attrition_rate DESC
      `),
        pool.query(`
        SELECT
          CASE
            WHEN attrition_score >= 0.7 THEN 'High'
            WHEN attrition_score >= 0.4 THEN 'Medium'
            ELSE 'Low'
          END as risk_level,
          COUNT(*) as count
        FROM employees
        GROUP BY risk_level
      `),
        pool.query(`
        SELECT
          working_model,
          COUNT(*) as count
        FROM employees
        WHERE working_model IS NOT NULL AND attrition = 0
        GROUP BY working_model
      `),
      ]);

    const stats = {
      totalEmployees: parseInt(statsResult.rows[0].total_employees),
      activeEmployees: parseInt(statsResult.rows[0].active_employees),
      attritionRate: parseFloat(
        (
          (statsResult.rows[0].attrited_employees /
            statsResult.rows[0].total_employees) *
          100
        ).toFixed(2)
      ),
      avgPerformanceRating: parseFloat(
        statsResult.rows[0].avg_performance_rating
      ),
      avgSalary: parseFloat(statsResult.rows[0].avg_salary),
      highRiskCount: parseInt(statsResult.rows[0].high_risk_count),
    };

    const departmentData = departmentResult.rows;
    const riskData = riskResult.rows;
    const workingModelData = employeeResult.rows;

    // Calculate health index
    const healthIndex = calculateHealthIndex(stats);

    // Generate insights
    const riskDistribution = {
      high: riskData.find((r) => r.risk_level === "High")?.count || 0,
      medium: riskData.find((r) => r.risk_level === "Medium")?.count || 0,
      low: riskData.find((r) => r.risk_level === "Low")?.count || 0,
    };
    const insights = generateInsights(stats, departmentData, riskDistribution);

    // Generate charts
    const departmentChart = await generateChart(
      "bar",
      {
        labels: departmentData.map((d) => d.department),
        datasets: [
          {
            label: "Attrition Rate (%)",
            data: departmentData.map((d) => parseFloat(d.attrition_rate)),
            backgroundColor: "rgba(139, 92, 246, 0.7)",
            borderColor: "rgba(139, 92, 246, 1)",
            borderWidth: 2,
          },
        ],
      },
      {
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Attrition Rate (%)" },
          },
        },
        plugins: {
          title: { display: true, text: "Department-wise Attrition Rate" },
        },
      }
    );

    const riskChart = await generateChart(
      "doughnut",
      {
        labels: ["High Risk", "Medium Risk", "Low Risk"],
        datasets: [
          {
            data: [
              riskDistribution.high,
              riskDistribution.medium,
              riskDistribution.low,
            ],
            backgroundColor: [
              "rgba(239, 68, 68, 0.8)",
              "rgba(251, 191, 36, 0.8)",
              "rgba(34, 197, 94, 0.8)",
            ],
            borderColor: [
              "rgba(239, 68, 68, 1)",
              "rgba(251, 191, 36, 1)",
              "rgba(34, 197, 94, 1)",
            ],
            borderWidth: 2,
          },
        ],
      },
      {
        plugins: {
          title: { display: true, text: "Employee Risk Distribution" },
        },
      }
    );

    const workingModelChart = await generateChart(
      "pie",
      {
        labels: workingModelData.map((w) => w.working_model),
        datasets: [
          {
            data: workingModelData.map((w) => parseInt(w.count)),
            backgroundColor: [
              "rgba(139, 92, 246, 0.8)",
              "rgba(59, 130, 246, 0.8)",
              "rgba(236, 72, 153, 0.8)",
            ],
            borderColor: [
              "rgba(139, 92, 246, 1)",
              "rgba(59, 130, 246, 1)",
              "rgba(236, 72, 153, 1)",
            ],
            borderWidth: 2,
          },
        ],
      },
      {
        plugins: {
          title: { display: true, text: "Working Model Distribution" },
        },
      }
    );

    // Create PDF with professional layout
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 60, left: 40, right: 40 },
      bufferPages: true  // Enable buffering for footer on all pages
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=AttriSense-Report-${
        new Date().toISOString().split("T")[0]
      }.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // ============= PAGE 1: EXECUTIVE SUMMARY & KEY METRICS =============

    // Header with branding
    doc
      .fontSize(26)
      .fillColor("#8B5CF6")
      .text("AttriSense", { align: "center" });
    doc.moveDown(0.2);
    doc
      .fontSize(18)
      .fillColor("#1e40af")
      .text("HR Attrition Analytics Report", { align: "center" });
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text(
        `Generated: ${new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })} | Report Period: Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`,
        { align: "center" }
      );
    
    // Add a decorative line
    doc.moveDown(0.5);
    doc
      .moveTo(100, doc.y)
      .lineTo(495, doc.y)
      .lineWidth(2)
      .strokeColor("#8B5CF6")
      .stroke();
    doc.moveDown(1);

    // Executive Summary Box with border
    const summaryBoxY = doc.y;
    doc
      .rect(40, summaryBoxY, 515, 100)
      .fillAndStroke("#F3F4F6", "#E5E7EB");
    
    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Executive Summary", 50, summaryBoxY + 10);
    doc.moveDown(0.5);

    const healthColor =
      healthIndex.status === "Excellent"
        ? "#22c55e"
        : healthIndex.status === "Good"
        ? "#3b82f6"
        : healthIndex.status === "Fair"
        ? "#f59e0b"
        : "#ef4444";

    // Health Index with better formatting
    doc.fontSize(11).fillColor("#1f2937");
    const healthY = doc.y;
    doc.text("Organization Health Index:", 50, healthY);
    doc
      .fontSize(20)
      .fillColor(healthColor)
      .text(`${healthIndex.score}/100`, 200, healthY - 3);
    doc
      .fontSize(12)
      .fillColor(healthColor)
      .text(`(${healthIndex.status})`, 270, healthY);
    
    doc.moveDown(1.5);

    // Key metrics in a grid layout with better spacing
    doc.fontSize(10).fillColor("#1f2937");
    const metricsY = doc.y;

    // Row 1
    doc.text("Total Employees:", 50, metricsY);
    doc.fillColor("#3b82f6").fontSize(14).text(stats.totalEmployees.toString(), 50, metricsY + 15);
    
    doc.fillColor("#1f2937").fontSize(10).text("Active Employees:", 180, metricsY);
    doc.fillColor("#22c55e").fontSize(14).text(stats.activeEmployees.toString(), 180, metricsY + 15);
    
    doc.fillColor("#1f2937").fontSize(10).text("Attrition Rate:", 310, metricsY);
    doc
      .fillColor(
        stats.attritionRate > 15
          ? "#ef4444"
          : stats.attritionRate > 10
          ? "#f59e0b"
          : "#22c55e"
      )
      .fontSize(14)
      .text(`${stats.attritionRate}%`, 310, metricsY + 15);
    
    doc.fillColor("#1f2937").fontSize(10).text("High Risk:", 440, metricsY);
    doc.fillColor("#ef4444").fontSize(14).text(stats.highRiskCount.toString(), 440, metricsY + 15);

    doc.y = metricsY + 40;

    // Row 2
    const metrics2Y = doc.y;
    doc.fillColor("#1f2937").fontSize(10).text("Avg Performance:", 50, metrics2Y);
    doc.fillColor("#8B5CF6").fontSize(14).text(`${stats.avgPerformanceRating.toFixed(2)}/5.0`, 50, metrics2Y + 15);
    
    doc.fillColor("#1f2937").fontSize(10).text("Avg Salary:", 180, metrics2Y);
    doc.fillColor("#22c55e").fontSize(14).text(`$${Math.round(stats.avgSalary).toLocaleString()}`, 180, metrics2Y + 15);
    
    doc.fillColor("#1f2937").fontSize(10).text("Departments:", 310, metrics2Y);
    doc.fillColor("#3b82f6").fontSize(14).text(departmentData.length.toString(), 310, metrics2Y + 15);
    
    doc.fillColor("#1f2937").fontSize(10).text("Health Score:", 440, metrics2Y);
    doc.fillColor(healthColor).fontSize(14).text(`${healthIndex.score}%`, 440, metrics2Y + 15);

    doc.y = metrics2Y + 50;

    // Visual Analytics Section - Left-aligned
    doc
      .fontSize(16)
      .fillColor("#1f2937")
      .text("Visual Analytics", 40, doc.y, { width: 515, underline: true });
    doc.moveDown(0.5);

    const chartY = doc.y;
    const chartWidth = 240;
    const chartHeight = 180;

    // Department chart (left) with title box
    doc
      .rect(40, chartY, chartWidth, 20)
      .fillAndStroke("#8B5CF6", "#8B5CF6");
    doc
      .fontSize(10)
      .fillColor("#FFFFFF")
      .text("Department Attrition Rate", 50, chartY + 5);
    doc.image(departmentChart, 40, chartY + 20, {
      width: chartWidth,
      height: chartHeight,
    });

    // Risk distribution chart (right) with title box
    doc
      .rect(315, chartY, chartWidth, 20)
      .fillAndStroke("#8B5CF6", "#8B5CF6");
    doc
      .fontSize(10)
      .fillColor("#FFFFFF")
      .text("Employee Risk Distribution", 325, chartY + 5);
    doc.image(riskChart, 315, chartY + 20, {
      width: chartWidth,
      height: chartHeight,
    });

    doc.y = chartY + chartHeight + 30;

    // Department Details Table with better styling - Left-aligned
    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Department Performance Breakdown", 40, doc.y, { width: 515, underline: true });
    doc.moveDown(0.5);
    
    // Table header with background
    const tableTop = doc.y;
    doc
      .rect(40, tableTop, 515, 18)
      .fillAndStroke("#8B5CF6", "#8B5CF6");
    
    doc.fontSize(9).fillColor("#FFFFFF");
    doc.text("Department", 45, tableTop + 5, { width: 100 });
    doc.text("Total", 145, tableTop + 5, { width: 40 });
    doc.text("Attrited", 185, tableTop + 5, { width: 45 });
    doc.text("Rate %", 230, tableTop + 5, { width: 40 });
    doc.text("Avg Salary", 270, tableTop + 5, { width: 70 });
    doc.text("Risk Score", 340, tableTop + 5, { width: 50 });

    doc.y = tableTop + 20;

    // Table rows with alternating colors
    doc.fontSize(8);
    departmentData.slice(0, 8).forEach((dept, index) => {
      const y = doc.y;
      
      // Alternating row background
      if (index % 2 === 0) {
        doc.rect(40, y - 2, 515, 14).fillAndStroke("#F9FAFB", "#F9FAFB");
      }
      
      doc.fillColor("#1f2937").text(dept.department.substring(0, 18), 45, y, { width: 100 });
      doc.text(dept.total, 145, y, { width: 40 });
      doc.text(dept.attrited, 185, y, { width: 45 });
      
      const rateColor =
        dept.attrition_rate > 15
          ? "#ef4444"
          : dept.attrition_rate > 10
          ? "#f59e0b"
          : "#22c55e";
      doc.fillColor(rateColor).text(`${dept.attrition_rate}%`, 230, y, { width: 40 });
      doc
        .fillColor("#1f2937")
        .text(`$${Math.round(parseFloat(dept.avg_salary) / 1000)}K`, 270, y, {
          width: 70,
        });
      
      const riskColor = dept.avg_risk_score >= 0.7 ? "#ef4444" : dept.avg_risk_score >= 0.4 ? "#f59e0b" : "#22c55e";
      doc.fillColor(riskColor).text(dept.avg_risk_score, 340, y, { width: 50 });
      doc.moveDown(0.7);
    });

    // ============= PAGE 2: INSIGHTS & RECOMMENDATIONS =============
    doc.addPage();

    // Page 2 Header
    doc
      .fontSize(20)
      .fillColor("#8B5CF6")
      .text("Key Insights & Strategic Recommendations", { align: "center" });
    doc.moveDown(0.3);
    doc
      .moveTo(100, doc.y)
      .lineTo(495, doc.y)
      .lineWidth(2)
      .strokeColor("#8B5CF6")
      .stroke();
    doc.moveDown(1);

    // Insights with better formatting
    insights.forEach((insight, index) => {
      const iconColor =
        insight.type === "critical"
          ? "#ef4444"
          : insight.type === "warning"
          ? "#f59e0b"
          : insight.type === "positive"
          ? "#22c55e"
          : "#3b82f6";

      const bgColor =
        insight.type === "critical"
          ? "#FEE2E2"
          : insight.type === "warning"
          ? "#FEF3C7"
          : insight.type === "positive"
          ? "#D1FAE5"
          : "#DBEAFE";

      const icon =
        insight.type === "critical"
          ? "⚠"
          : insight.type === "warning"
          ? "⚡"
          : insight.type === "positive"
          ? "✓"
          : "ℹ";

      const insightY = doc.y;
      
      // Background box for insight
      doc
        .rect(40, insightY, 515, 50)
        .fillAndStroke(bgColor, iconColor);

      doc
        .fontSize(12)
        .fillColor(iconColor)
        .text(`${icon} ${insight.category}`, 50, insightY + 8, { underline: true });
      doc.moveDown(0.3);
      doc
        .fontSize(9)
        .fillColor("#1f2937")
        .text(insight.message, 50, doc.y, { width: 495 });
      doc.moveDown(0.2);
      doc
        .fontSize(8)
        .fillColor("#059669")
        .text(`→ Recommended Action: ${insight.recommendation}`, 50, doc.y, {
          width: 495,
          italic: true,
        });
      
      doc.y = insightY + 55;
    });

    doc.moveDown(1);

    // Strategic Action Plan with better styling - Left-aligned
    doc
      .fontSize(16)
      .fillColor("#1f2937")
      .text("Strategic Action Plan", 40, doc.y, { width: 515, underline: true });
    doc.moveDown(0.5);

    const actionPlan = [
      {
        priority: "Immediate (0-30 days)",
        color: "#ef4444",
        actions: [
          "Schedule 1-on-1s with all high-risk employees",
          "Review and adjust compensation for top performers",
          "Launch pulse survey to identify pain points",
        ],
      },
      {
        priority: "Short-term (1-3 months)",
        color: "#f59e0b",
        actions: [
          "Implement mentorship program for career development",
          "Enhance flexible work policies and communication",
          "Develop retention bonuses for critical roles",
        ],
      },
      {
        priority: "Long-term (3-12 months)",
        color: "#22c55e",
        actions: [
          "Build succession planning framework",
          "Create internal mobility and upskilling programs",
          "Establish quarterly engagement tracking system",
        ],
      },
    ];

    doc.fontSize(9);
    actionPlan.forEach((plan) => {
      const planY = doc.y;
      doc
        .rect(40, planY, 515, 15)
        .fillAndStroke(plan.color, plan.color);
      doc.fillColor("#FFFFFF").fontSize(10).text(plan.priority, 50, planY + 3);
      doc.y = planY + 18;
      
      plan.actions.forEach((action) => {
        doc.fillColor("#1f2937").fontSize(8).text(`  • ${action}`, 50);
        doc.moveDown(0.3);
      });
      doc.moveDown(0.3);
    });

    // Working Model Distribution - Left-aligned
    doc.moveDown(0.5);
    doc
      .fontSize(14)
      .fillColor("#1f2937")
      .text("Working Model Distribution", 40, doc.y, { width: 515, underline: true });
    doc.moveDown(0.3);
    doc.image(workingModelChart, 180, doc.y, { width: 220, height: 165 });
    doc.moveDown(11);

    // Key Takeaways Box with border
    const takeawayY = doc.y;
    doc
      .rect(40, takeawayY, 515, 80)
      .fillAndStroke("#F0FDF4", "#22c55e");
    
    doc
      .fontSize(12)
      .fillColor("#1f2937")
      .text("Key Takeaways", 50, takeawayY + 8, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor("#1f2937");

    const takeaways = [
      `Annual attrition cost estimated at $${Math.round(
        (stats.totalEmployees *
          (stats.attritionRate / 100) *
          stats.avgSalary *
          1.5) /
          1000000
      )}M`,
      `${stats.highRiskCount} employees require immediate retention intervention`,
      `Priority departments: ${departmentData
        .slice(0, 3)
        .map((d) => d.department)
        .join(", ")}`,
      `Potential ROI: 5% attrition reduction = $${Math.round(
        (stats.totalEmployees * 0.05 * stats.avgSalary * 1.5) / 1000000
      )}M annual savings`,
    ];

    takeaways.forEach((takeaway) => {
      doc.text(`  ✓ ${takeaway}`, 50);
      doc.moveDown(0.4);
    });

    // Add footer to all pages using buffering (prevents extra blank page)
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(7)
        .fillColor("#9ca3af")
        .text(
          "AttriSense | Confidential - For internal HR use only",
          40,
          doc.page.height - 40,
          { align: "center", width: 515 }
        );
    }

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Error generating PDF report:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to generate PDF report",
        details: error.message,
      });
    }
  }
};

export { generatePDFReport };
