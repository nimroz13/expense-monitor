import React, { useState } from "react";

function ExpenseForm({ onAddExpense, currency }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !amount) return;

    const newExpense = {
      id: Date.now(),
      title,
      amount: parseFloat(amount),
      category,
      date: new Date().toLocaleDateString(),
    };

    onAddExpense(newExpense);

    setTitle("");
    setAmount("");
    setCategory("");
  };

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Expense title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="amount-currency">
        <span className="currency">{currency}</span>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <input
        type="text"
        placeholder="Category (e.g., Food, Travel)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      <button type="submit">Add</button>
    </form>
  );
}

export default ExpenseForm;
