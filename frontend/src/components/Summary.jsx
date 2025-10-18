import React from "react";

function Summary({ expenses, budget, currency, exchangeRate }) {
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const convertedSpent = totalSpent * exchangeRate;
  const convertedBudget = budget * exchangeRate;
  const remaining = convertedBudget - convertedSpent;
  const savings = remaining > 0 ? remaining : 0;

  return (
    <div className="summary">
      <h3>Budget: {currency}{convertedBudget.toFixed(2)}</h3>
      <h3>Spent: {currency}{convertedSpent.toFixed(2)}</h3>
      <h3>Remaining: {currency}{remaining.toFixed(2)}</h3>
      <h3>Savings: {currency}{savings.toFixed(2)}</h3>
    </div>
  );
}

export default Summary;
