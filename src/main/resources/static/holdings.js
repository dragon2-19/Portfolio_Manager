// Load holdings on page load
document.addEventListener('DOMContentLoaded', () => {
    loadHoldings();
    loadSummary();
});

// Load all holdings
async function loadHoldings() {
    try {
        const response = await fetch(HOLDINGS_API);
        const holdings = await response.json();
        displayHoldings(holdings);
        updateStats(holdings);
    } catch (error) {
        console.error('Error loading holdings:', error);
        alert('加载数据失败，请检查后端服务是否启动');
    }
}

// Load summary
async function loadSummary() {
    try {
        const response = await fetch(`${HOLDINGS_API}/summary`);
        const summary = await response.json();
        // Update stats if needed
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

// Display holdings in table
function displayHoldings(holdings) {
    const tbody = document.getElementById('holdingsTableBody');
    tbody.innerHTML = '';

    if (holdings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;">暂无数据</td></tr>';
        return;
    }

    holdings.forEach(holding => {
        const badgeClass = getBadgeClass(holding.assetType);
        const profitLossClass = holding.profitLoss > 0 ? 'profit-positive' :
                               holding.profitLoss < 0 ? 'profit-negative' : 'profit-neutral';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${holding.id}</td>
            <td><strong>${holding.ticker}</strong></td>
            <td><span class="badge ${badgeClass}">${getAssetTypeName(holding.assetType)}</span></td>
            <td>${holding.volume}</td>
            <td>${formatCurrency(holding.purchasePrice)}</td>
            <td>${formatCurrency(holding.currentPrice)}</td>
            <td>${formatCurrency(holding.totalValue)}</td>
            <td class="${profitLossClass}">${formatCurrency(holding.profitLoss)}</td>
            <td>${formatPercentage(holding.profitLossPercentage)}</td>
            <td>${formatDate(holding.purchaseDate)}</td>
            <td>
                <button class="action-btn btn-price" onclick="openPriceModal(${holding.id})">更新价格</button>
                <button class="action-btn btn-edit" onclick="editHolding(${holding.id})">编辑</button>
                <button class="action-btn btn-delete" onclick="deleteHolding(${holding.id})">删除</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update statistics
function updateStats(holdings) {
    document.getElementById('totalCount').textContent = holdings.length;

    const stockCount = holdings.filter(h => h.assetType === 'STOCK').length;
    const bondCount = holdings.filter(h => h.assetType === 'BOND').length;
    const cashCount = holdings.filter(h => h.assetType === 'CASH').length;

    document.getElementById('stockCount').textContent = stockCount;
    document.getElementById('bondCount').textContent = bondCount;
    document.getElementById('cashCount').textContent = cashCount;
}

// Open add modal
function openAddModal() {
    document.getElementById('modalTitle').textContent = '添加资产';
    document.getElementById('holdingForm').reset();
    document.getElementById('holdingId').value = '';
    document.getElementById('holdingModal').style.display = 'block';
}

// Edit holding
async function editHolding(id) {
    try {
        const response = await fetch(`${HOLDINGS_API}/${id}`);
        const holding = await response.json();

        document.getElementById('modalTitle').textContent = '编辑资产';
        document.getElementById('holdingId').value = holding.id;
        document.getElementById('ticker').value = holding.ticker;
        document.getElementById('assetType').value = holding.assetType;
        document.getElementById('volume').value = holding.volume;
        document.getElementById('purchasePrice').value = holding.purchasePrice;
        document.getElementById('currentPrice').value = holding.currentPrice;
        document.getElementById('purchaseDate').value = holding.purchaseDate || '';

        document.getElementById('holdingModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading holding:', error);
        alert('加载资产信息失败');
    }
}

// Open price update modal
function openPriceModal(id) {
    document.getElementById('priceHoldingId').value = id;
    document.getElementById('newPrice').value = '';
    document.getElementById('priceModal').style.display = 'block';
}

// Save holding
async function saveHolding(event) {
    event.preventDefault();

    const holdingId = document.getElementById('holdingId').value;
    const holding = {
        ticker: document.getElementById('ticker').value,
        assetType: document.getElementById('assetType').value,
        volume: parseInt(document.getElementById('volume').value),
        purchasePrice: parseFloat(document.getElementById('purchasePrice').value),
        currentPrice: document.getElementById('currentPrice').value ?
                      parseFloat(document.getElementById('currentPrice').value) : null,
        purchaseDate: document.getElementById('purchaseDate').value
    };

    try {
        const url = holdingId ? `${HOLDINGS_API}/${holdingId}` : HOLDINGS_API;
        const method = holdingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(holding)
        });

        if (response.ok) {
            closeModal();
            loadHoldings();
            alert(holdingId ? '资产更新成功！' : '资产添加成功！');
        } else {
            alert('保存失败，请重试');
        }
    } catch (error) {
        console.error('Error saving holding:', error);
        alert('保存失败，请检查网络连接');
    }
}

// Update price
async function updatePrice(event) {
    event.preventDefault();

    const holdingId = document.getElementById('priceHoldingId').value;
    const newPrice = document.getElementById('newPrice').value;

    try {
        const response = await fetch(`${HOLDINGS_API}/${holdingId}/price?currentPrice=${newPrice}`, {
            method: 'PATCH'
        });

        if (response.ok) {
            closePriceModal();
            loadHoldings();
            alert('价格更新成功！');
        } else {
            alert('更新失败，请重试');
        }
    } catch (error) {
        console.error('Error updating price:', error);
        alert('更新失败，请检查网络连接');
    }
}

// Delete holding
async function deleteHolding(id) {
    if (!confirm('确定要删除该资产吗？')) {
        return;
    }

    try {
        const response = await fetch(`${HOLDINGS_API}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadHoldings();
            alert('删除成功！');
        } else {
            alert('删除失败，请重试');
        }
    } catch (error) {
        console.error('Error deleting holding:', error);
        alert('删除失败，请检查网络连接');
    }
}

// Close modals
function closeModal() {
    document.getElementById('holdingModal').style.display = 'none';
}

function closePriceModal() {
    document.getElementById('priceModal').style.display = 'none';
}
