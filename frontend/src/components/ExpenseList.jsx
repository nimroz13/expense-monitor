import React from "react";

function ExpenseList({ expenses, onDelete, currency, exchangeRate }) {
  if (expenses.length === 0) {
    return <p>No expenses yet. Add some!</p>;
  }

  return (
    <ul className="expense-list">
      {expenses.map((exp) => (
        <li key={exp.id}>
          <div className="expense-item">
            <strong>{exp.title}</strong> – {currency}
            {(exp.amount * exchangeRate).toFixed(2)} ({exp.category})
            <span className="date">{exp.date}</span>
          </div>
          <button onClick={() => onDelete(exp.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}

export default ExpenseList;
