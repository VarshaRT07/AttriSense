import pandas as pd
import numpy as np
from faker import Faker

import numpy as np
from faker import Faker

# Parameters
NUM_ROWS = 1000000
np.random.seed(5)
faker = Faker("en_IN")
faker.seed_instance(5)

# ----------------------------------
# Salary ranges per role
# ----------------------------------
salary_ranges = {
    # IT roles
    "Software Engineer": (30000, 40000, 60000, 80000, 90000, 120000),
    "DevOps Engineer": (35000, 45000, 65000, 85000, 100000, 130000),
    "QA Analyst": (25000, 35000, 45000, 60000, 65000, 85000),
    "Project Manager": (50000, 70000, 90000, 110000, 130000, 160000),
    "Business Analyst": (30000, 45000, 55000, 75000, 80000, 110000),
    "Network Administrator": (25000, 35000, 45000, 65000, 65000, 85000),
    "UX Designer": (30000, 45000, 60000, 80000, 85000, 110000),
    "Systems Analyst": (30000, 45000, 55000, 75000, 80000, 110000),
    "Database Administrator": (35000, 50000, 60000, 80000, 85000, 110000),
    "AI Engineer": (50000, 70000, 100000, 130000, 150000, 200000),
    "Data Scientist": (50000, 70000, 100000, 130000, 150000, 200000),
    "Cloud Engineer": (40000, 60000, 90000, 120000, 130000, 170000),
    "Cybersecurity Specialist": (40000, 60000, 90000, 120000, 130000, 180000),
    # Non-IT roles
    "Accountant": (30000, 40000, 50000, 70000, 80000, 100000),
    "HR Manager": (40000, 55000, 70000, 90000, 95000, 120000),
    "Sales Executive": (25000, 35000, 45000, 65000, 70000, 90000),
    "Operations Manager": (50000, 65000, 90000, 110000, 120000, 150000),
    "Chartered Accountant": (70000, 100000, 150000, 200000, 250000, 350000),
    "Legal Counsel": (60000, 90000, 120000, 150000, 160000, 200000),
    "Investment Banker": (100000, 150000, 200000, 300000, 350000, 500000),
    "Marketing Manager": (40000, 60000, 80000, 100000, 120000, 150000),
    "Business Development Manager": (30000, 45000, 60000, 90000, 100000, 130000),
    # BPO roles
    "Customer Support": (15000, 20000, 25000, 35000, 40000, 50000),
    "Technical Support": (20000, 30000, 40000, 50000, 55000, 70000),
    "Team Lead": (35000, 45000, 60000, 75000, 80000, 95000),
    "Quality Analyst": (20000, 30000, 40000, 50000, 55000, 70000),
    "Process Trainer": (25000, 35000, 45000, 60000, 65000, 80000),
    # Startup roles
    "Founder": (75000, 150000, 150000, 300000, 300000, 500000),
    "Growth Hacker": (50000, 70000, 100000, 150000, 150000, 250000),
    "Junior Developer": (20000, 35000, 40000, 70000, 80000, 100000),
    "Product Designer": (30000, 50000, 60000, 90000, 90000, 120000),
    "Chief Executive Officer": (150000, 300000, 300000, 500000, 500000, 1000000),
    "Chief Financial Officer": (120000, 250000, 250000, 400000, 400000, 800000),
    "Chief Marketing Officer": (120000, 250000, 250000, 400000, 400000, 800000),
    "VP Engineering": (100000, 200000, 200000, 350000, 350000, 700000),
}

# ----------------------------------
# Helpers
# ----------------------------------


def get_salary(role, experience_years):
    min1, max1, min5, max5, min10, max10 = salary_ranges[role]

    if experience_years <= 1:
        base_min, base_max = min1, max1
    elif experience_years >= 10:
        base_min, base_max = min10, max10
    elif 1 < experience_years < 5:
        factor = (experience_years - 1) / 4
        base_min = min1 + factor * (min5 - min1)
        base_max = max1 + factor * (max5 - max1)
    else:
        factor = (experience_years - 5) / 5
        base_min = min5 + factor * (min10 - min5)
        base_max = max5 + factor * (max10 - max5)

    min_salary = base_min * 0.7
    max_salary = base_max * 1.3

    mean_salary = (min_salary + max_salary) / 2
    std_dev = (max_salary - min_salary) * 0.15

    salary = int(np.random.normal(loc=mean_salary, scale=std_dev))
    return max(int(min_salary), min(int(max_salary), salary))


def random_industry():
    return np.random.choice(
        ["IT", "Non-IT", "BPO", "Startup"], p=[0.5, 0.15, 0.25, 0.1]
    )


def random_job_role(industry):
    if industry == "IT":
        return np.random.choice(
            list(
                {k for k in salary_ranges.keys()}
                & {
                    "Software Engineer",
                    "DevOps Engineer",
                    "QA Analyst",
                    "Project Manager",
                    "Business Analyst",
                    "Network Administrator",
                    "UX Designer",
                    "Systems Analyst",
                    "Database Administrator",
                    "AI Engineer",
                    "Data Scientist",
                    "Cloud Engineer",
                    "Cybersecurity Specialist",
                }
            )
        )
    elif industry == "Non-IT":
        return np.random.choice(
            [
                "Accountant",
                "HR Manager",
                "Sales Executive",
                "Operations Manager",
                "Chartered Accountant",
                "Legal Counsel",
                "Investment Banker",
                "Marketing Manager",
                "Business Development Manager",
            ]
        )
    elif industry == "BPO":
        return np.random.choice(
            [
                "Customer Support",
                "Technical Support",
                "Team Lead",
                "Quality Analyst",
                "Process Trainer",
            ]
        )
    else:
        return np.random.choice(
            [
                "Founder",
                "Growth Hacker",
                "Junior Developer",
                "Product Designer",
                "Chief Executive Officer",
                "Chief Financial Officer",
                "Chief Marketing Officer",
                "VP Engineering",
            ]
        )


def assign_department(industry, job_role):
    if industry == "IT":
        return "IT"
    if industry == "BPO":
        return "Support"
    if industry == "Non-IT":
        if job_role in ["Accountant", "Chartered Accountant"]:
            return "Finance"
        elif job_role == "HR Manager":
            return "HR"
        elif job_role in [
            "Sales Executive",
            "Business Development Manager",
            "Marketing Manager",
        ]:
            return "Sales"
        else:
            return "Operations"
    return np.random.choice(["Operations", "Sales", "Marketing", "Finance", "HR"])


# ----------------------------------
# Attrition scoring (cleaned and de-duplicated)
# ----------------------------------


def attrition_score(row):
    """
    Produces a probability in [0.1, 0.9].
    Key changes in this cleaned function:
      - Removed duplicate salary checks (no separate IT/Startup hard thresholds).
      - Unified promotions logic so industry-specific duplication is avoided.
      - Consolidated overtime / leaves penalties to avoid double-counting.
      - Restored an education-level edge-case penalty (Diploma in high job level).
    """

    score = 0
    industry = row.get("Industry")
    role = row.get("Job Role")
    exp = row.get("Years of experience", 0)
    salary = row.get("Salary", 0)

    # --- Salary market comparison (single place) ---
    if role in salary_ranges:
        min1, max1, min5, max5, min10, max10 = salary_ranges[role]
        if exp <= 1:
            base_min, base_max = min1, max1
        elif exp >= 10:
            base_min, base_max = min10, max10
        elif 1 < exp < 5:
            f = (exp - 1) / 4
            base_min = min1 + f * (min5 - min1)
            base_max = max1 + f * (max5 - max1)
        else:
            f = (exp - 5) / 5
            base_min = min5 + f * (min10 - min5)
            base_max = max5 + f * (max10 - max5)

        market_min = base_min * 0.7
        market_max = base_max * 1.3

        if salary < market_min:
            score += 3  # significantly below market
        elif salary > market_max:
            score -= 1  # well above market reduces risk slightly

    # --- Core factors ---
    promos = row.get("Number of Promotions", 0)
    ywc = row.get("YearsWithCompany", 0)
    ot = row.get("Overtime", "No")
    leaves = row.get("LeavesTaken", 8)
    commute = row.get("Commuting distance", 0)
    perf = row.get("Performance Rating", 3)
    wh = row.get("Working hours", 9)

    # Promotions (unified)
    expected_promos = max(0, int(ywc / 3))
    if promos == 0 and ywc > 2:
        score += 3
    elif promos < expected_promos:
        score += 1

    # Overtime & Leaves (consolidated to avoid double-counting)
    if ot == "Yes":
        score += 1
    if leaves < 5:
        score += 1
    if leaves < 3:
        score += 1

    # Commute
    if commute > 25:
        score += 2
    elif commute > 15:
        score += 1

    # Performance
    if perf < 3:
        score += 2

    # Working hours
    if wh > 10:
        score += 2
    elif wh > 9:
        score += 1
    # low hours alone is not necessarily attrition risk; penalize low hours only if performance is also low
    if wh < 7 and perf <= 2:
        score += 1

    # Salary hike
    last_hike = row.get("Last hike", 0)
    if last_hike == 0 and ywc > 1:
        score += 3
    elif last_hike < 5:
        score += 1

    # Years in current role (early churn risk)
    if row.get("Years in current role", 0) < 1 and ywc > 2:
        score += 2

    # Job-hopping
    if row.get("No. of companies worked previously", 0) > 3:
        score += 1

    # LeavesTaken already treated above; keep small extra risk for very low leaves (possible under-use or fear)
    # (already handled by leaves < 3)

    # Industry-specific adjustments (NO duplicate salary / promotion checks)
    if industry == "BPO":
        if wh > 10:
            score += 2
        if row.get("Job Level", 3) <= 2:
            score += 2
    elif industry == "Startup":
        if row.get("Working model", "Onsite") == "Onsite":
            score += 2
    elif industry == "IT":
        # IT tends to value remote/flexibility; slightly reduce risk for remote workers with good WLB
        if row.get("Working model") == "Remote":
            score -= 1
    elif industry == "Non-IT":
        if row.get("Marital Status") == "Single" and leaves < 3:
            score += 1

    # Edge cases: age, experience mismatch, dependents, education
    age = row.get("Age", 30)
    if age < 22 or age > 58:
        score += 1

    if row.get("Years of experience", 0) == 0 and age > 30:
        score += 2

    if row.get("Number of Dependents", 0) > 3 and row.get("Marital Status") == "Single":
        score += 1

    if row.get("Education Level") in ["Diploma"] and row.get("Job Level", 3) > 4:
        score += 1

    return score


# ----------------------------------
# Data Generation
# ----------------------------------
data = []
for i in range(NUM_ROWS):
    industry = random_industry()
    exp = np.random.randint(0, 40)
    age = np.clip(exp + np.random.randint(20, 25), 21, 60)
    gender = np.random.choice(["M", "F", "O"])
    job_role = random_job_role(industry)
    salary = get_salary(job_role, exp)
    perf_rating = np.random.randint(1, 6)

    years_with_company = min(exp, np.random.randint(0, exp + 1))
    job_level = np.clip(int(np.random.normal(loc=exp / 7 + 1, scale=1)), 1, 6)
    num_promotions = np.random.binomial(n=max(1, exp // 3), p=0.55)

    # Working hours & overtime
    working_hours = np.random.choice([7, 8, 9, 10, 11], p=[0.1, 0.32, 0.42, 0.13, 0.03])
    if working_hours > 9:
        overtime = np.random.choice(["Yes", "No"], p=[0.6, 0.4])
    elif working_hours < 8:
        overtime = np.random.choice(["Yes", "No"], p=[0.05, 0.95])
    else:
        overtime = np.random.choice(["Yes", "No"], p=[0.2, 0.8])

    commute = (
        0
        if np.random.rand() < 0.8 and industry == "Startup"
        else np.random.randint(0, 45)
    )
    edu_level = np.random.choice(
        ["School", "Diploma", "Graduate", "Post-Graduate", "Doctorate"],
        p=[0.05, 0.1, 0.65, 0.18, 0.02],
    )
    marital = np.random.choice(
        ["Single", "Married", "Divorced", "Widowed"], p=[0.32, 0.60, 0.05, 0.03]
    )
    dependents = np.random.poisson(1.5 if marital == "Married" else 0.2)

    hike_percentages = [0, 5, 7, 10, 13, 15, 20, 25, 30, 40, 50, 60]
    probs = [0.05, 0.10, 0.10, 0.30, 0.10, 0.07, 0.10, 0.07, 0.05, 0.03, 0.02, 0.01]
    last_hike = np.random.choice(hike_percentages, p=probs)

    years_in_role = min(
        np.random.randint(1, years_with_company + 1 if years_with_company else 2), 10
    )
    working_model = np.random.choice(
        ["Onsite", "Hybrid", "Remote"],
        p=[0.65, 0.25, 0.1] if industry != "IT" else [0.35, 0.35, 0.3],
    )
    department = assign_department(industry, job_role)
    prev_companies = min(exp, np.random.poisson(1.7 if exp > 10 else 0.5))
    leaves_taken = max(3, np.random.poisson(8))

    row = {
        "Employee ID": i + 1,
        "Full Name": faker.name(),
        "Age": age,
        "Gender": gender,
        "Years of experience": exp,
        "Job Role": job_role,
        "Salary": salary,
        "Performance Rating": perf_rating,
        "Number of Promotions": num_promotions,
        "Overtime": overtime,
        "Commuting distance": commute,
        "Education Level": edu_level,
        "Marital Status": marital,
        "Number of Dependents": dependents,
        "Job Level": job_level,
        "Last hike": last_hike,
        "Years in current role": years_in_role,
        "Working model": working_model,
        "Working hours": working_hours,
        "Department": department,
        "No. of companies worked previously": prev_companies,
        "LeavesTaken": leaves_taken,
        "YearsWithCompany": years_with_company,
    }

    score = attrition_score(row)
    prob = 1 / (1 + np.exp(-(score - 5)))
    # prob = 0.1 + 0.8 * prob  # ensures min=0.1, max=0.9
    row["Attrition_Prob"] = prob
    row["Attrition"] = np.random.binomial(1, prob)
    data.append(row)


# Save dataframe to CSV
df = pd.DataFrame(data)
df.to_csv("synthetic_employee_dataset-1.csv", index=False)
print("CSV file generated: synthetic_employee_dataset-0.8.csv")


# df['raw_score'] = df.apply(attrition_score, axis=1)
# print(df['raw_score'].describe())

# def sigmoid(x):
#     return 1 / (1 + np.exp(-x))

# def final_probability_from_score(score, shift, base_min=0.1, base_span=0.8):
#     """Maps raw score into probability with scaling."""
#     base = sigmoid(score - shift)
#     return base_min + base_span * base

# def assign_attrition(row, shift, base_min=0.1, base_span=0.8):
#     score = attrition_score(row)
#     prob = final_probability_from_score(score, shift, base_min, base_span)
#     return np.random.binomial(1, prob)


# def simulated_attrition_rate_for_shift(shift, df, base_min=0.1, base_span=0.8, seed=42):
#     np.random.seed(seed)
#     probs = df['raw_score'].apply(lambda s: final_probability_from_score(s, shift, base_min, base_span))
#     draws = np.random.binomial(1, probs)
#     return draws.mean()

# # Example: test a range of shifts
# shifts = np.linspace(df['raw_score'].min()-2, df['raw_score'].max()+2, 201)
# rates = [simulated_attrition_rate_for_shift(s, df) for s in shifts]

# # Pick shift where attrition rate is closest to your target (e.g. 0.25)
# target = 0.3
# idx = np.argmin(np.abs(np.array(rates) - target))
# best_shift = shifts[idx]
# print("Best shift:", best_shift, "-> attrition rate:", rates[idx])

# chosen_shift = best_shift
# df['Attrition'] = df.apply(lambda row: assign_attrition(row, chosen_shift), axis=1)
# print("Final attrition rate:", df['Attrition'].mean())
