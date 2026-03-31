// Load transactions on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
});

// Load all transactions
async function loadTransactions() {
    try {
        const response = await fetch(TRANSACTIONS_API);
        const transactions = await response.json();
        displayTransactions(transactions);
        updateTransactionStats(transactions);
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Display transactions in table
function displayTransactions(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    tbody.innerHTML = '';

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;">No data</td></tr>';
        return;
    }

    transactions.forEach(transaction => {
        let typeClass, typeIcon, typeText;

        switch (transaction.transactionType) {
            case 'BUY':
                typeClass = 'transaction-buy';
                typeIcon = '📈';
                typeText = 'Buy';
                break;
            case 'SELL':
                typeClass = 'transaction-sell';
                typeIcon = '📉';
                typeText = 'Sell';
                break;
            case 'DEPOSIT':
                typeClass = 'transaction-deposit';
                typeIcon = '💰';
                typeText = 'Deposit';
                break;
            case 'WITHDRAW':
                typeClass = 'transaction-withdraw';
                typeIcon = '💵';
                typeText = 'Withdraw';
                break;
            default:
                typeClass = '';
                typeIcon = '📝';
                typeText = 'Other';
        }

        const profitLossClass = transaction.profitLoss > 0 ? 'profit-positive' :
                               transaction.profitLoss < 0 ? 'profit-negative' : 'profit-neutral';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.id}</td>
            <td><strong>${transaction.ticker || '-'}</strong></td>
            <td>${transaction.stockName || '-'}</td>
            <td><span class="badge ${typeClass}">${typeIcon} ${typeText}</span></td>
            <td>${transaction.volume || '-'}</td>
            <td>${formatCurrency(transaction.price)}</td>
            <td>${formatCurrency(transaction.totalAmount)}</td>
            <td>${formatCurrency(transaction.fee)}</td>
            <td class="${profitLossClass}">${transaction.profitLoss ? formatCurrency(transaction.profitLoss) : '-'}</td>
            <td>${formatDateTime(transaction.transactionDate)}</td>
            <td>
                <button class="action-btn btn-delete" onclick="deleteTransaction(${transaction.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update transaction statistics
function updateTransactionStats(transactions) {
    document.getElementById('totalTransactions').textContent = transactions.length;

    const buyCount = transactions.filter(t => t.transactionType === 'BUY').length;
    const sellCount = transactions.filter(t => t.transactionType === 'SELL').length;
    const depositCount = transactions.filter(t => t.transactionType === 'DEPOSIT').length;
    const withdrawCount = transactions.filter(t => t.transactionType === 'WITHDRAW').length;

    document.getElementById('buyCount').textContent = buyCount;
    document.getElementById('sellCount').textContent = sellCount;
    document.getElementById('depositCount').textContent = depositCount;
    document.getElementById('withdrawCount').textContent = withdrawCount;
}

// Delete transaction
async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction record?')) {
        return;
    }

    try {
        const response = await fetch(`${TRANSACTIONS_API}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadTransactions();
            alert('Delete successful!');
        } else {
            alert('Delete failed, please try again');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Delete failed, please check network connection');
    }
}
