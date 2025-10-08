import pandas as pd
import numpy as np
from faker import Faker

# Parameters
NUM_ROWS = 1000000

np.random.seed(42)
faker = Faker("en_IN")
faker.seed_instance(42)


# --- Helper functions for survey response generation ---


def random_likert(mean=3):
    """
    Sample from a skewed Likert-style distribution.
    mean ~ 1-5
    """
    probs = np.array([0.1, 0.15, 0.25, 0.3, 0.2])  # Base distribution
    shift = mean - 3
    # Adjust probabilities to shift towards desired mean
    if shift > 0:
        for i in range(len(probs)):
            if i >= 3:
                probs[i] += shift * 0.05
            else:
                probs[i] -= shift * 0.03
    elif shift < 0:
        for i in range(len(probs)):
            if i <= 1:
                probs[i] += abs(shift) * 0.05
            else:
                probs[i] -= abs(shift) * 0.03
    probs = np.clip(probs, 0.01, 1)
    probs = probs / probs.sum()
    return np.random.choice([1, 2, 3, 4, 5], p=probs)


def attrition_probability(row):
    """
    Calculate attrition likelihood based on multiple factors.
    Score accumulates if dissatisfaction or stress is high.
    """
    score = 0

    # Key dissatisfaction/stress drivers with weights (example weights)
    if row["Job Satisfaction"] <= 2:
        score += 4
    elif row["Job Satisfaction"] == 3:
        score += 2

    if row["Work-Life Balance"] <= 2:
        score += 3
    elif row["Work-Life Balance"] == 3:
        score += 1

    if row["Stress levels/work pressure"] >= 4:
        score += 3
    elif row["Stress levels/work pressure"] == 3:
        score += 1

    if row["Relationship with Manager"] <= 2:
        score += 2

    if row["Recognition and Reward Satisfaction"] <= 2:
        score += 2

    if row["Career growth and advancement opportunities"] <= 2:
        score += 3

    if row["Perceived job security"] <= 2:
        score += 2

    if row["Overall engagement"] <= 2:
        score += 4

    # Positive protective factors reduce score
    if row["Team cohesion and peer support"] >= 4:
        score -= 1
    if row["Flexibility support"] >= 4:
        score -= 1
    if row["Environment satisfaction"] >= 4:
        score -= 1

    return score


# --- Generate dataset ---
data = []
for i in range(NUM_ROWS):
    row = {
        "Employee ID": f"E{1001 + i}",
        "Full Name": faker.first_name(),
        "Work-Life Balance": random_likert(mean=3),
        "Job Satisfaction": random_likert(mean=3),
        "Relationship with Manager": random_likert(mean=3),
        "Communication effectiveness": random_likert(mean=3),
        "Recognition and Reward Satisfaction": random_likert(mean=3),
        "Career growth and advancement opportunities": random_likert(mean=3),
        "Alignment with Company Values/Mission": random_likert(mean=3),
        "Perceived fairness": random_likert(mean=3),
        "Team cohesion and peer support": random_likert(mean=3),
        "Autonomy at work": random_likert(mean=3),
        "Overall engagement": random_likert(mean=3),
        "Training and skill development satisfaction": random_likert(mean=3),
        "Stress levels/work pressure": random_likert(mean=3),
        "Organizational change readiness": random_likert(mean=3),
        "Feedback frequency and usefulness": random_likert(mean=3),
        "Flexibility support": random_likert(mean=3),
        "Conflict at work": random_likert(mean=3),
        "Perceived job security": random_likert(mean=3),
        "Environment satisfaction": random_likert(mean=3),
    }
    score = attrition_probability(row)
    prob = 1 / (1 + np.exp(-(score - 9)))
    # prob = 0.1 + 0.8 * prob  # ensures min=0.1, max=0.9
    row["Attrition_Prob"] = prob
    row["Attrition"] = np.random.binomial(1, prob)
    data.append(row)

# Save
df = pd.DataFrame(data)
df.to_csv("synthetic_employee_survey_dataset.csv", index=False)
print("CSV file generated: synthetic_employee_survey_dataset.csv")


# df['raw_score'] = df.apply(attrition_probability, axis=1)
# print(df['raw_score'].describe())

# def sigmoid(x):
#     return 1 / (1 + np.exp(-x))

# def final_probability_from_score(score, shift, base_min=0.1, base_span=0.8):
#     """Maps raw score into probability with scaling."""
#     base = sigmoid(score - shift)
#     return base_min + base_span * base

# def assign_attrition(row, shift, base_min=0.1, base_span=0.8):
#     score = attrition_probability(row)
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
# target = 0.25
# idx = np.argmin(np.abs(np.array(rates) - target))
# best_shift = shifts[idx]
# print("Best shift:", best_shift, "-> attrition rate:", rates[idx])

# chosen_shift = best_shift
# df['Attrition'] = df.apply(lambda row: assign_attrition(row, chosen_shift), axis=1)
# print("Final attrition rate:", df['Attrition'].mean())
