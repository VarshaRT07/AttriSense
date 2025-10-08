import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Home route
  index("routes/home.tsx"),

  // Analytics routes
  route("/analytics", "routes/analytics.tsx"),

  // Employee routes
  route("/employees/:employeeId", "routes/employees.$employeeId.tsx"),

  // Survey routes
  route("/surveys/:employeeId", "routes/surveys.$employeeId.tsx"),

  // Data management routes
  route("/data-management", "routes/data-management.tsx"),

  // Report routes
  route("/reports", "routes/reports.tsx"),

  // Settings route
  route("/settings", "routes/settings.tsx"),
] satisfies RouteConfig;
