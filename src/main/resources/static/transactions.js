// Load transactions on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
    loadHoldingSelect();
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

// Load holding select options
async function loadHoldingSelect() {
    try {
        const response = await fetch(HOLDINGS_API);
        const holdings = await response.json();

        const select = document.getElementById('holdingSelect');
        select.innerHTML = '<option value="">请选择持仓</option>';

        holdings.forEach(holding => {
            const option = document.createElement('option');
            option.value = holding.id;
            option.textContent = `${holding.ticker} (${getAssetTypeName(holding.assetType)}) - ${holding.volume}股`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading holdings:', error);
    }
}

// Display transactions in table
function displayTransactions(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    tbody.innerHTML = '';

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">暂无数据</td></tr>';
        return;
    }

    transactions.forEach(transaction => {
        const typeClass = transaction.transactionType === 'BUY' ? 'transaction-buy' : 'transaction-sell';
        const typeIcon = transaction.transactionType === 'BUY' ? '📈' : '📉';
        const typeText = transaction.transactionType === 'BUY' ? '买入' : '卖出';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.id}</td>
            <td><strong>${transaction.holding?.ticker || 'N/A'}</strong></td>
            <td><span class="badge ${typeClass}">${typeIcon} ${typeText}</span></td>
            <td>${transaction.volume}</td>
            <td>${formatCurrency(transaction.price)}</td>
            <td>${formatCurrency(transaction.totalAmount)}</td>
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
    const totalAmount = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    document.getElementById('buyCount').textContent = buyCount;
    document.getElementById('sellCount').textContent = sellCount;
    document.getElementById('totalAmount').textContent = formatCurrency(totalAmount);
}

// Open transaction modal
function openTransactionModal() {
    document.getElementById('transactionModalTitle').textContent = '新建交易';
    document.getElementById('transactionForm').reset();
    document.getElementById('transactionId').value = '';
    document.getElementById('transactionModal').style.display = 'block';
}

// Save transaction
async function saveTransaction(event) {
    event.preventDefault();

    const holdingId = document.getElementById('holdingSelect').value;
    const transactionType = document.getElementById('transactionType').value;
    const volume = parseInt(document.getElementById('transactionVolume').value);
    const price = parseFloat(document.getElementById('transactionPrice').value);

    try {
        let url;
        let method;

        if (transactionType === 'BUY') {
            url = `${TRANSACTIONS_API}/buy?holdingId=${holdingId}&volume=${volume}&price=${price}`;
            method = 'POST';
        } else {
            url = `${TRANSACTIONS_API}/sell?holdingId=${holdingId}&volume=${volume}&price=${price}`;
            method = 'POST';
        }

        const response = await fetch(url, { method });

        if (response.ok) {
            closeTransactionModal();
            loadTransactions();
            alert('交易创建成功！');
        } else {
            const errorData = await response.json();
            alert('保存失败：' + (errorData.message || '请重试'));
        }
    } catch (error) {
        console.error('Error saving transaction:', error);
        alert('保存失败，请检查网络连接');
    }
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

// Close modal
function closeTransactionModal() {
    document.getElementById('transactionModal').style.display = 'none';
}
