# AttriSense API

**AI-Powered Attrition Intelligence**

A comprehensive REST API for managing employee data, pulse surveys, and AI-powered attrition predictions.

## Features

- **Employee Management**: Complete CRUD operations for employee data
- **Pulse Surveys**: Employee satisfaction and engagement surveys
- **Attrition Scoring**: ML-based attrition risk predictions with SHAP explanations
- **Analytics**: Comprehensive analytics and AI-powered insights
- **Data Validation**: Input validation and error handling
- **Database Integration**: PostgreSQL with connection pooling

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Set up the database:

```bash
# Create database and run schema.sql
psql -U postgres -d attrition_db -f ../database/schema.sql
```

4. Start the server:

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Health Check

- `GET /health` - Server health status

### Employees

- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `GET /api/employees/department/:department` - Get employees by department
- `GET /api/employees/attrition/:status` - Get employees by attrition status (0=stayed, 1=left)
- `GET /api/employees/stats` - Get employee statistics
- `GET /api/employees/stats/departments` - Get department-wise statistics
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Pulse Surveys

- `GET /api/pulse-surveys` - Get all pulse surveys
- `GET /api/pulse-surveys/:id` - Get pulse survey by ID
- `GET /api/pulse-surveys/employee/:employeeId` - Get surveys by employee
- `GET /api/pulse-surveys/latest` - Get latest surveys for all employees
- `GET /api/pulse-surveys/stats` - Get pulse survey statistics
- `GET /api/pulse-surveys/stats/departments` - Get department survey stats
- `POST /api/pulse-surveys` - Create new pulse survey
- `PUT /api/pulse-surveys/:id` - Update pulse survey
- `DELETE /api/pulse-surveys/:id` - Delete pulse survey

### Attrition Scores

- `GET /api/attrition-scores` - Get all attrition scores
- `GET /api/attrition-scores/:id` - Get attrition score by ID
- `GET /api/attrition-scores/employee/:employeeId` - Get scores by employee
- `GET /api/attrition-scores/latest` - Get latest scores for all employees
- `GET /api/attrition-scores/risk/:riskLevel` - Get scores by risk level (Low/Medium/High)
- `GET /api/attrition-scores/stats` - Get attrition score statistics
- `GET /api/attrition-scores/stats/departments` - Get department attrition stats
- `GET /api/attrition-scores/stats/model-performance` - Get model performance metrics
- `POST /api/attrition-scores` - Create new attrition score
- `PUT /api/attrition-scores/:id` - Update attrition score
- `DELETE /api/attrition-scores/:id` - Delete attrition score

### Analytics

- `GET /api/analytics/dashboard` - Get comprehensive dashboard analytics
- `GET /api/analytics/employee/:employeeId` - Get employee detailed analytics
- `GET /api/analytics/high-risk-employees` - Get high-risk employees with details
- `GET /api/analytics/predictive-insights` - Get predictive insights and correlations

## Data Models

### Employee

```json
{
  "employee_id": 1,
  "full_name": "John Doe",
  "age": 30,
  "gender": "Male",
  "years_of_experience": 5,
  "job_role": "Software Engineer",
  "salary": 75000,
  "work_life_balance": 4,
  "job_satisfaction": 4,
  "performance_rating": 4,
  "department": "Engineering",
  "attrition": 0
}
```

### Pulse Survey

```json
{
  "survey_id": 1,
  "employee_id": 1,
  "survey_date": "2024-01-15",
  "work_life_balance": 4,
  "job_satisfaction": 4,
  "overall_engagement": 4,
  "stress_levels": 2
}
```

### Attrition Score

```json
{
  "score_id": 1,
  "employee_id": 1,
  "model_version": "v1.0",
  "base_score": 0.25,
  "pulse_score": 0.3,
  "combined_score": 0.275,
  "risk_level": "Medium",
  "calculated_at": "2024-01-15T10:30:00Z"
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

Common HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (duplicate entries)
- `500` - Internal Server Error

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Environment Variables

See `.env.example` for required environment variables.

### Database Schema

The database schema is located in `../database/schema.sql`.

## License

MIT
