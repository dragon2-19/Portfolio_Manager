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
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;">暂无数据</td></tr>';
        return;
    }

    transactions.forEach(transaction => {
        let typeClass, typeIcon, typeText;

        switch (transaction.transactionType) {
            case 'BUY':
                typeClass = 'transaction-buy';
                typeIcon = '📈';
                typeText = '买入';
                break;
            case 'SELL':
                typeClass = 'transaction-sell';
                typeIcon = '📉';
                typeText = '卖出';
                break;
            case 'DEPOSIT':
                typeClass = 'transaction-deposit';
                typeIcon = '💰';
                typeText = '充值';
                break;
            case 'WITHDRAW':
                typeClass = 'transaction-withdraw';
                typeIcon = '💵';
                typeText = '提取';
                break;
            default:
                typeClass = '';
                typeIcon = '📝';
                typeText = '其他';
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
                <button class="action-btn btn-delete" onclick="deleteTransaction(${transaction.id})">删除</button>
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
    if (!confirm('确定要删除该交易记录吗？')) {
        return;
    }

    try {
        const response = await fetch(`${TRANSACTIONS_API}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadTransactions();
            alert('删除成功！');
        } else {
            alert('删除失败，请重试');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('删除失败，请检查网络连接');
    }
}
