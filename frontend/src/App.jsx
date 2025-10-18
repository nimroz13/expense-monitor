// App.jsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./index.css";
import StatReviewer from "./StatReviewer.jsx";
import html2canvas from "html2canvas";

function App() {
  // THEME: get initial value (localStorage or system preference)
  const getInitialTheme = () => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored) return stored === "dark";
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  };

  const [darkMode, setDarkMode] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    try {
      localStorage.setItem("theme", darkMode ? "dark" : "light");
    } catch {}
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((v) => !v);

  // Inline editing state for incomes and expenses
  const [editingIncomeId, setEditingIncomeId] = useState(null);
  const [editingIncomeAmount, setEditingIncomeAmount] = useState("");
  const [editingIncomeCategory, setEditingIncomeCategory] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingExpenseName, setEditingExpenseName] = useState("");
  const [editingExpenseAmount, setEditingExpenseAmount] = useState("");
  const [editingExpenseCategory, setEditingExpenseCategory] = useState("");

  // Edit income handlers
  const startEditIncome = (inc) => {
    setEditingIncomeId(inc.id);
    setEditingIncomeAmount(inc.amount);
    setEditingIncomeCategory(inc.category);
  };
  const saveEditIncome = () => {
    setMonthlyIncomes((prev) => ({
      ...prev,
      [selectedMonth]: (prev[selectedMonth] || []).map((inc) =>
        inc.id === editingIncomeId
          ? { ...inc, amount: parseFloat(editingIncomeAmount), category: editingIncomeCategory }
          : inc
      ),
    }));
    setEditingIncomeId(null);
    setEditingIncomeAmount("");
    setEditingIncomeCategory("");
  };
  const cancelEditIncome = () => {
    setEditingIncomeId(null);
    setEditingIncomeAmount("");
    setEditingIncomeCategory("");
  };

  // Edit expense handlers
  const startEditExpense = (exp) => {
    setEditingExpenseId(exp.id);
    setEditingExpenseName(exp.name);
    setEditingExpenseAmount(exp.amount);
    setEditingExpenseCategory(exp.category);
  };
  const saveEditExpense = () => {
    setMonthlyExpenses((prev) => ({
      ...prev,
      [selectedMonth]: (prev[selectedMonth] || []).map((exp) =>
        exp.id === editingExpenseId
          ? { ...exp, name: editingExpenseName, amount: parseFloat(editingExpenseAmount), category: editingExpenseCategory }
          : exp
      ),
    }));
    setEditingExpenseId(null);
    setEditingExpenseName("");
    setEditingExpenseAmount("");
    setEditingExpenseCategory("");
  };
  const cancelEditExpense = () => {
    setEditingExpenseId(null);
    setEditingExpenseName("");
    setEditingExpenseAmount("");
    setEditingExpenseCategory("");
  };

  // Currency setup
  const getInitialCurrency = () => {
    const stored = localStorage.getItem("selectedCurrency");
    return stored || "₹";
  };
  const [currency, setCurrency] = useState(getInitialCurrency);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [exchangeRates, setExchangeRates] = useState({});
  const [baseCurrency, setBaseCurrency] = useState("INR");

  // Fetch exchange rates (live from API with fallback and periodic updates)
  useEffect(() => {
    const fetchRates = () => {
      fetch("https://api.exchangerate.host/latest?base=INR")
        .then((res) => res.json())
        .then((data) => {
          if (data?.rates) setExchangeRates(data.rates);
        })
        .catch((err) => console.error("Currency API error:", err));
    };

    // Set fallback rates initially
    setExchangeRates({
      USD: 0.012,
      EUR: 0.011,
      GBP: 0.0098,
      JPY: 1.8,
      CAD: 0.016,
    });

    // Fetch immediately
    fetchRates();

    // Fetch every hour (3600000 ms)
    const interval = setInterval(fetchRates, 3600000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // Income and expense initialization
  const getInitialMonthlyIncomes = () => {
    const stored = localStorage.getItem("monthlyIncomes");
    if (stored) return JSON.parse(stored);
    return {
      [selectedMonth]: [
        { id: 1, amount: 5000, category: "Salary", currency: "₹" },
        { id: 2, amount: 200, category: "Freelance", currency: "₹" },
      ],
    };
  };

  const getInitialMonthlyExpenses = () => {
    const stored = localStorage.getItem("monthlyExpenses");
    if (stored) return JSON.parse(stored);
    return {
      [selectedMonth]: [
        { id: 1, name: "Groceries", amount: 1500, category: "Food", currency: "₹" },
        { id: 2, name: "Rent", amount: 2500, category: "Housing", currency: "₹" },
      ],
    };
  };

  const [monthlyIncomes, setMonthlyIncomes] = useState(getInitialMonthlyIncomes);
  const [monthlyExpenses, setMonthlyExpenses] = useState(getInitialMonthlyExpenses);

  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeCategory, setIncomeCategory] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [sortCategory, setSortCategory] = useState("");

  // Local storage sync
  useEffect(() => {
    try {
      localStorage.setItem("monthlyIncomes", JSON.stringify(monthlyIncomes));
    } catch {}
  }, [monthlyIncomes]);

  useEffect(() => {
    try {
      localStorage.setItem("monthlyExpenses", JSON.stringify(monthlyExpenses));
    } catch {}
  }, [monthlyExpenses]);

  const incomes = monthlyIncomes[selectedMonth] || [];
  const expenses = monthlyExpenses[selectedMonth] || [];
  const sortedExpenses = sortCategory
    ? expenses.filter((exp) =>
        exp.category.toLowerCase().includes(sortCategory.toLowerCase())
      )
    : expenses;

  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = totalIncome - totalExpense;

  // Currency Conversion Logic
  const currencyMap = { "₹": "INR", "$": "USD", "€": "EUR", "£": "GBP", "¥": "JPY", "C$": "CAD" };
  const rate = exchangeRates[currencyMap[currency]] || 1;

  const handleCurrencyChange = (newSymbol) => {
    setCurrency(newSymbol);
    try {
      localStorage.setItem("selectedCurrency", newSymbol);
    } catch {}
  };

  // Income CRUD
  const addIncome = () => {
    if (!incomeAmount || !incomeCategory) return;
    const newIncome = {
      id: Date.now(),
      amount: parseFloat(incomeAmount),
      category: incomeCategory,
      currency: currency,
    };
    setMonthlyIncomes((prev) => ({
      ...prev,
      [selectedMonth]: [...(prev[selectedMonth] || []), newIncome],
    }));
    setIncomeAmount("");
    setIncomeCategory("");
  };

  const deleteIncome = (id) => {
    setMonthlyIncomes((prev) => ({
      ...prev,
      [selectedMonth]: (prev[selectedMonth] || []).filter(
        (inc) => inc.id !== id
      ),
    }));
  };

  // Expense CRUD
  const addExpense = () => {
    if (!expenseName || !expenseAmount || !expenseCategory) return;
    const newExpense = {
      id: Date.now(),
      name: expenseName,
      amount: parseFloat(expenseAmount),
      category: expenseCategory,
      currency: currency,
    };
    setMonthlyExpenses((prev) => ({
      ...prev,
      [selectedMonth]: [...(prev[selectedMonth] || []), newExpense],
    }));
    setExpenseName("");
    setExpenseAmount("");
    setExpenseCategory("");
  };

  const deleteExpense = (id) => {
    setMonthlyExpenses((prev) => ({
      ...prev,
      [selectedMonth]: (prev[selectedMonth] || []).filter(
        (exp) => exp.id !== id
      ),
    }));
  };

  const changeMonth = (delta) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, "0")}`);
  };

  // Download PDF with tables and charts
  const downloadPDF = async () => {
    // Temporarily render charts off-screen
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '800px'; // Set width for consistent capture
    tempDiv.style.background = 'white'; // Ensure white background for clean PDF
    document.body.appendChild(tempDiv);

    const root = ReactDOM.createRoot(tempDiv);
    root.render(<StatReviewer data={allData} currentMonth={selectedMonth} showLabels={true} />);

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Capture pie chart
    const pieElement = tempDiv.querySelector('.pie-chart');
    let imgDataPie = '';
    if (pieElement) {
      const rectPie = pieElement.getBoundingClientRect();
      const canvasPie = await html2canvas(pieElement, { width: 800, height: rectPie.height + 50 });
      imgDataPie = canvasPie.toDataURL('image/png');
    }

    // Capture bar chart
    const barElement = tempDiv.querySelector('.bar-chart');
    let imgDataBar = '';
    if (barElement) {
      const rectBar = barElement.getBoundingClientRect();
      const canvasBar = await html2canvas(barElement, { width: 800, height: rectBar.height + 50 });
      imgDataBar = canvasBar.toDataURL('image/png');
    }

    // Clean up
    root.unmount();
    document.body.removeChild(tempDiv);

    // Generate PDF
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Monthly Transactions and Charts", 14, 22);
    doc.setFontSize(12);
    doc.text(`Month: ${selectedMonth}`, 14, 30);

    const incomeColumns = ["Amount", "Category"];
    const pdfCurrency = currencyMap[currency] || currency;
    const incomeRows = (monthlyIncomes[selectedMonth] || []).map((inc) => [
      pdfCurrency + " " + (inc.amount * rate).toFixed(2),
      inc.category,
    ]);
    if (incomeRows.length > 0) {
      doc.autoTable({
        head: [incomeColumns],
        body: incomeRows,
        startY: 35,
        theme: "grid",
      });
    }

    const startY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 55;
    const expenseColumns = ["Name", "Amount", "Category"];
    const expenseRows = (monthlyExpenses[selectedMonth] || []).map((exp) => [
      exp.name,
      (exp.amount * rate).toFixed(2),
      exp.category,
    ]);
    if (expenseRows.length > 0) {
      doc.autoTable({
        head: [expenseColumns],
        body: expenseRows,
        startY,
        theme: "grid",
      });
    }

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : startY + 40;
    doc.text(`Total Income: ${pdfCurrency}${(totalIncome * rate).toFixed(2)}`, 14, finalY);
    doc.text(`Total Expenses: ${pdfCurrency}${(totalExpense * rate).toFixed(2)}`, 14, finalY + 7);
    doc.text(`Remaining: ${pdfCurrency}${(remaining * rate).toFixed(2)}`, 14, finalY + 14);

    // Add charts on new page
    if (imgDataPie || imgDataBar) {
      doc.addPage();
      let yPos = 20;
      if (imgDataPie) {
        doc.setFontSize(16);
        doc.text("Current Month: Savings vs Expenses", 14, yPos);
        doc.addImage(imgDataPie, 'PNG', 10, yPos + 10, 180, 120);
        yPos += 140;
      }
      if (imgDataBar) {
        doc.setFontSize(16);
        doc.text("Monthly Expenses vs Savings", 14, yPos);
        doc.addImage(imgDataBar, 'PNG', 10, yPos + 10, 180, 120);
      }
    }
    doc.save(`Transactions_Charts_${selectedMonth}.pdf`);
  };

  // Prepare data for StatReviewer: combine incomes (saving) and expenses, convert amounts
  const allData = [];
  Object.keys(monthlyIncomes).forEach(month => {
    (monthlyIncomes[month] || []).forEach(inc => {
      allData.push({ date: month + '-01', type: 'saving', amount: inc.amount * rate });
    });
  });
  Object.keys(monthlyExpenses).forEach(month => {
    (monthlyExpenses[month] || []).forEach(exp => {
      allData.push({ date: month + '-01', type: 'expense', amount: exp.amount * rate });
    });
  });

  const [view, setView] = useState('main'); // 'main' or 'stats'

  return (
    <div className="app-container">
      {/* Centered heading */}
      <h1 className="main-heading">💰 Monthly Budget Tracker</h1>

      <div className="top-controls">
        {/* Top row: currency (left) and swapped download + theme (right) */}
        <div
          className="top-row"
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label>Currency:</label>
            <select value={currency} onChange={(e) => handleCurrencyChange(e.target.value) || handleCurrencyChange(e.target.value)}>
              <option value="₹">₹ - INR</option>
              <option value="$">$ - USD</option>
              <option value="€">€ - EUR</option>
              <option value="£">£ - GBP</option>
              <option value="¥">¥ - JPY</option>
              <option value="C$">C$ - CAD</option>
            </select>
          </div>

          {/* Right side: DOWNLOAD first, THEME second (swapped) */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Desktop-only full Download button (shown under top-right in desktop via CSS) */}
            <button className="add-btn desktop-only" onClick={downloadPDF} aria-label="Download PDF">
              Download PDF
            </button>

            {/* Day/Night pill toggle */}
            <button
              type="button"
              className={`theme-switch ${darkMode ? "on" : "off"}`}
              onClick={toggleTheme}
              aria-pressed={darkMode}
              aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
              title={darkMode ? "Light" : "Dark"}
            >
              <span className="track" aria-hidden>
                <span className="icon icon-sun" aria-hidden>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" fill="currentColor"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                </span>

                <span className="knob" aria-hidden>
                  <svg className="knob-moon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </svg>

                  <svg className="knob-sun" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </span>

                <span className="icon icon-moon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </svg>
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* Month selector row (below top row) */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "8px", justifyContent: "flex-start", width: "100%" }}>
          <div className="month-selector" style={{ marginBottom: "0" }}>
            <button className="month-arrow-btn" onClick={() => changeMonth(-1)} style={{ marginRight: '8px' }}>◀</button>

            <input
              type="month"
              className="month-input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="Select month"
              style={{ marginRight: '8px' }}
            />

            <button className="month-arrow-btn" onClick={() => changeMonth(1)} style={{ marginLeft: '8px' }}>▶</button>
          </div>

          {/* NOTE: mobile-only download icon removed as requested */}
        </div>
      </div>

      {/* View Stats button (below top-controls, above tables) */}
      {view === 'main' && (
        <button className="view-stats-btn" onClick={() => setView('stats')} aria-label="View Statistics">
          📊 View Stats
        </button>
      )}

      {view === 'main' ? (
        <div className="tables-container">
          <div className="table-wrapper">
            <h3>Income</h3>
            <table>
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Action</th>
                </tr>
                <tr>
                  <td>
                    <input
                      type="number"
                      value={incomeAmount}
                      onChange={(e) => setIncomeAmount(e.target.value)}
                      placeholder="Amount"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={incomeCategory}
                      onChange={(e) => setIncomeCategory(e.target.value)}
                      placeholder="Category"
                    />
                  </td>
                  <td>
                    <button className="add-btn" onClick={addIncome}>Add</button>
                  </td>
                </tr>
              </thead>
              <tbody>
                {incomes.map((inc) => (
                  <tr key={inc.id}>
                    {editingIncomeId === inc.id ? (
                      <>
                        <td>
                          <input
                            type="number"
                            value={editingIncomeAmount}
                            onChange={(e) => setEditingIncomeAmount(e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editingIncomeCategory}
                            onChange={(e) => setEditingIncomeCategory(e.target.value)}
                          />
                        </td>
                        <td>
                          <button className="edit-btn" onClick={saveEditIncome}>Save</button>
                          <button className="delete-btn" onClick={cancelEditIncome}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{currency} {(inc.amount * rate).toFixed(2)}</td>
                        <td>{inc.category}</td>
                        <td>
                          {/* edit icon button */}
                          <button
                            className="edit-btn"
                            onClick={() => startEditIncome(inc)}
                            aria-label={`Edit income ${inc.category}`}
                            title="Edit"
                            style={{ padding: "8px" }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
                            </svg>
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() => deleteIncome(inc.id)}
                            aria-label={`Delete income ${inc.category}`}
                            title="Delete"
                            style={{ padding: "8px" }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="card-totals" style={{ right: 12, bottom: 12 }}>
              <p>Total Income: {currency}{(totalIncome * rate).toFixed(2)}</p>
            </div>
          </div>

          <div className="table-wrapper">
            <h3>Expenses</h3>
            <div className="sort-container" style={{ marginBottom: 8 }}>
              <input
                type="text"
                placeholder="Filter by category"
                value={sortCategory}
                onChange={(e) => setSortCategory(e.target.value)}
              />
            </div>

            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Action</th>
                </tr>
                <tr>
                  <td>
                    <input
                      type="text"
                      value={expenseName}
                      onChange={(e) => setExpenseName(e.target.value)}
                      placeholder="Expense Name"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="Amount"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      placeholder="Category"
                    />
                  </td>
                  <td>
                    <button className="add-btn" onClick={addExpense}>Add</button>
                  </td>
                </tr>
              </thead>
              <tbody>
                {sortedExpenses.map((exp) => (
                  <tr key={exp.id}>
                    {editingExpenseId === exp.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            value={editingExpenseName}
                            onChange={(e) => setEditingExpenseName(e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editingExpenseAmount}
                            onChange={(e) => setEditingExpenseAmount(e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editingExpenseCategory}
                            onChange={(e) => setEditingExpenseCategory(e.target.value)}
                          />
                        </td>
                        <td>
                          <button className="edit-btn" onClick={saveEditExpense}>Save</button>
                          <button className="delete-btn" onClick={cancelEditExpense}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{exp.name}</td>
                        <td>{currency} {(exp.amount * rate).toFixed(2)}</td>
                        <td>{exp.category}</td>
                        <td>
                          <button
                            className="edit-btn"
                            onClick={() => startEditExpense(exp)}
                            aria-label={`Edit expense ${exp.name}`}
                            title="Edit"
                            style={{ padding: "8px" }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
                          </svg>
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() => deleteExpense(exp.id)}
                            aria-label={`Delete expense ${exp.name}`}
                            title="Delete"
                            style={{ padding: "8px" }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="card-totals" style={{ right: 12, bottom: 12 }}>
              <p>Total Expenses: {currency}{(totalExpense * rate).toFixed(2)}</p>
              <p>Remaining: {currency}{(remaining * rate).toFixed(2)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="stats-page">
          <button className="back-btn" onClick={() => setView('main')} aria-label="Back to Main">
            ← Back
          </button>
          <p className="stats-info">
            Here are the statistics for your expenses and savings. The pie chart shows the current month's savings vs expenses. The bar chart displays monthly expenses vs savings over time, helping you track trends.
          </p>
          <StatReviewer data={allData} currentMonth={selectedMonth} />
        </div>
      )}
    </div>
  );
}

export default App;
