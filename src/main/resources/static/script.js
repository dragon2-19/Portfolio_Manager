const API_URL = 'http://localhost:8080/api/holdings';

// Load holdings on page load
document.addEventListener('DOMContentLoaded', () => {
    loadHoldings();
});

// Load all holdings
async function loadHoldings() {
    try {
        const response = await fetch(API_URL);
        const holdings = await response.json();
        displayHoldings(holdings);
        updateStats(holdings);
    } catch (error) {
        console.error('Error loading holdings:', error);
        alert('加载数据失败，请检查后端服务是否启动');
    }
}

// Display holdings in table
function displayHoldings(holdings) {
    const tbody = document.getElementById('holdingsTableBody');
    tbody.innerHTML = '';

    if (holdings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">暂无数据</td></tr>';
        return;
    }

    holdings.forEach(holding => {
        const badgeClass = getBadgeClass(holding.assetType);
        const assetTypeName = getAssetTypeName(holding.assetType);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${holding.id}</td>
            <td><strong>${holding.ticker}</strong></td>
            <td><span class="badge ${badgeClass}">${assetTypeName}</span></td>
            <td>${holding.volume}</td>
            <td>
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

// Get badge class based on asset type
function getBadgeClass(assetType) {
    switch (assetType) {
        case 'STOCK':
            return 'badge-stock';
        case 'BOND':
            return 'badge-bond';
        case 'CASH':
            return 'badge-cash';
        default:
            return '';
    }
}

// Get asset type name in Chinese
function getAssetTypeName(assetType) {
    switch (assetType) {
        case 'STOCK':
            return '股票';
        case 'BOND':
            return '债券';
        case 'CASH':
            return '现金';
        default:
            return assetType;
    }
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
        const response = await fetch(`${API_URL}/${id}`);
        const holding = await response.json();

        document.getElementById('modalTitle').textContent = '编辑资产';
        document.getElementById('holdingId').value = holding.id;
        document.getElementById('ticker').value = holding.ticker;
        document.getElementById('assetType').value = holding.assetType;
        document.getElementById('volume').value = holding.volume;
        document.getElementById('holdingModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading holding:', error);
        alert('加载资产信息失败');
    }
}

// Save holding (create or update)
async function saveHolding(event) {
    event.preventDefault();

    const holdingId = document.getElementById('holdingId').value;
    const holding = {
        ticker: document.getElementById('ticker').value,
        assetType: document.getElementById('assetType').value,
        volume: parseInt(document.getElementById('volume').value)
    };

    try {
        const url = holdingId ? `${API_URL}/${holdingId}` : API_URL;
        const method = holdingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
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

// Delete holding
async function deleteHolding(id) {
    if (!confirm('确定要删除该资产吗？')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
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

// Close modal
function closeModal() {
    document.getElementById('holdingModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('holdingModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
