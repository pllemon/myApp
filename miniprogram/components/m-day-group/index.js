function formatAmount(value) {
  var n = Number(value) || 0;
  var s = n.toFixed(2);
  return s.slice(-3) === '.00' ? s.slice(0, -3) : s;
}

Component({
  properties: {
    label: { type: String, value: '' },
    weekday: { type: String, value: '' },
    expense: { type: Number, value: 0 },
    income: { type: Number, value: 0 },
    count: { type: Number, value: 0 },
    dot: { type: Boolean, value: false },
    dense: { type: Boolean, value: false },
    variant: { type: String, value: 'default' },
    sticky: { type: Boolean, value: false },
    bare: { type: Boolean, value: false }
  },
  observers: {
    'expense, income': function (expense, income) {
      this.setData({
        _expenseText: expense > 0 ? formatAmount(expense) : '',
        _incomeText: income > 0 ? formatAmount(income) : ''
      });
    }
  }
});
