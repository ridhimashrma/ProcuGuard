// ══ CONFIG ══════════════════════════════════════════════════
const API = '/api'; // change to 'http://localhost:8897/api' if running separately

// ══ STATE ═══════════════════════════════════════════════════
let currentUser = null;
let allRequestsData = [];
let myRequestsData  = [];
let vendorsData = [];
let currentFilter = { my: 'all', admin: 'all' };
let addVendorVisible = false;
let selectedCategory = '';
let selectedVendorId = '';
let allProductsData = [];

// ══ UTILS ═══════════════════════════════════════════════════
async function api(path, method = 'GET', body = null) {
  const token = localStorage.getItem('pg_token');
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `show toast-${type}`;
  setTimeout(() => { el.className = ''; }, 3200);
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusBadge(s) {
  return `<span class="badge-status badge-${s}">${s}</span>`;
}

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn._orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn._orig || btn.innerHTML;
    btn.disabled = false;
  }
}

// ══ AUTH ════════════════════════════════════════════════════
function switchTab(tab) {
  document.getElementById('login-form').style.display    = tab === 'login' ? '' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('auth-error').style.display = 'none';
}
function toggleVendorFields() {

const checked =
  document.getElementById('is-vendor').checked;

document.getElementById('vendor-fields').style.display =
  checked ? 'block' : 'none';

}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return showAuthError('Please fill in all fields.');
  setLoading('login-btn', true);
  try {
    const data = await api('/auth/login', 'POST', { email, password });
    handleAuthSuccess(data);
  } catch (e) {
    showAuthError(e.message);
  } finally { setLoading('login-btn', false); }
}

async function doRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const isVendor =
  document.getElementById('is-vendor').checked;

const businessName =
  document.getElementById('vendor-business-name').value.trim();

const businessType =
  document.getElementById('vendor-business-type').value.trim();
  if (!name || !email || !password) return showAuthError('All fields are required.');
  setLoading('reg-btn', true);
  try {
    const data = await api('/auth/register', 'POST', {

name,
email,
password,

role: isVendor
  ? 'vendor'
  : 'user',

businessName,

businessType

});
    handleAuthSuccess(data);
  } catch (e) {
    showAuthError(e.message);
  } finally { setLoading('reg-btn', false); }
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg; el.style.display = '';
}

function handleAuthSuccess({ token, user }) {
  localStorage.setItem('pg_token', token);
  localStorage.setItem('pg_user', JSON.stringify(user));
  currentUser = user;
  bootApp();
}

function doLogout() {
  localStorage.removeItem('pg_token');
  localStorage.removeItem('pg_user');
  currentUser = null;
  document.getElementById('app').classList.remove('visible');
  document.getElementById('auth-page').style.display = 'flex';
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  switchTab('login');
}

// ══ BOOT ════════════════════════════════════════════════════
async function bootApp() {
  document.getElementById('auth-page').style.display = 'none';
  document.getElementById('app').classList.add('visible');

  // Setup UI by role
  const isAdmin = currentUser.role === 'admin';
  const isVendor = currentUser.role === 'vendor';
  document.getElementById('sidebar-username').textContent = currentUser.name;
  document.getElementById('sidebar-role').textContent =

  isAdmin
    ? 'Administrator'
    : isVendor
      ? 'Vendor'
      : 'User';

  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
  document.querySelectorAll('.user-only').forEach(el => {

    el.style.display =
      (!isAdmin && !isVendor)
        ? ''
        : 'none';

    });


    document.querySelectorAll('.vendor-only').forEach(el => {

    el.style.display =
      isVendor
        ? ''
        : 'none';

    });
  // Vendors add button admin only
  const toggleVendorBtn = document.getElementById('toggle-add-vendor');
  if (toggleVendorBtn) toggleVendorBtn.style.display = isAdmin ? '' : 'none';

  // Dashboard user col
  document.getElementById('dash-user-col').style.display = isAdmin ? '' : 'none';

  navigate('dashboard');
  await loadDashboard();
}

// ══ NAVIGATION ══════════════════════════════════════════════
const pageTitles = {
  dashboard: 'Dashboard',
  'my-requests': 'My Requests',
  'new-request': 'New Request',
  'all-requests': 'All Requests',
  vendors: 'Vendors',
  'vendor-dashboard': 'Vendor Dashboard',
  'my-products': 'My Products',
  'add-product': 'Add Product',
  users: 'Users',
  categories: 'Shop Categories',
'vendors-market': 'Vendor Marketplace',
'products-market': 'Products',
  
};

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  document.getElementById('page-title').textContent = pageTitles[page] || page;

  if (page === 'dashboard')    loadDashboard();
  if (page === 'my-requests')  loadMyRequests();
  if (page === 'all-requests') loadAllRequests();
  if (page === 'new-request')  loadVendorSelect();
  if (page === 'vendors')      loadVendors();
  if (page === 'users')        loadUsers();
  if (page === 'vendor-dashboard') loadVendorDashboard();
  if (page === 'my-products') loadMyProducts();
  if (page === 'vendors-market') loadMarketplaceVendors();
  if (page === 'products-market') loadMarketplaceProducts();
}

  async function requestProduct(
    productId,
    productName,
    vendorId
  ) {
  
    try {
  
      await api('/requests', 'POST', {
  
        itemName: productName,
  
        quantity: 1,
  
        vendor: vendorId,
  
        notes: `Requested from product catalog`,
  
        product: productId
  
      });
  
      toast(
        'Request submitted successfully!',
        'success'
      );
  
      await loadMyRequests();
  
    } catch (e) {
  
      toast(e.message, 'error');
  
    }
  
  }
  function openCategory(category) {

    selectedCategory = category;
  
    document.getElementById(
      'selected-category-title'
    ).textContent = `${category} Vendors`;
  
    navigate('vendors-market');
  
  }
async function loadMarketplaceVendors() {

    try {
  
      const vendors = await api('/vendors');
  
      const filtered = vendors.filter(v => {

        const vendorCategory =
          v.category || v.businessType || '';
      
        return vendorCategory
          .toLowerCase()
          .includes(
            selectedCategory.toLowerCase()
          );
      
      });
  
      const grid =
        document.getElementById('vendors-market-grid');
  
      if (!filtered.length) {
  
        grid.innerHTML = `
          <div class="empty-state">
            <p>No vendors found.</p>
          </div>
        `;
  
        return;
  
      }
  
      grid.innerHTML = filtered.map(v => `

        <div class="vendor-card">
      
          <div class="vendor-name">
            ${v.businessName || v.name}
          </div>
      
          <div class="vendor-email">
            ${v.email}
          </div>
      
          <div class="vendor-tags">
      
            <span class="tag">
              ${v.category || v.businessType || 'General'}
            </span>
  
          </div>
  
          <div class="vendor-actions">
  
            <button
              class="btn btn-primary btn-sm"
              onclick="openVendorProducts('${v._id}', '${v.businessName || v.name}')"
            >
              View Catalog
            </button>
  
          </div>
  
        </div>
  
      `).join('');
  
    } catch (e) {
  
      toast(e.message, 'error');
  
    }
  
  }
  function openVendorProducts(vendorId, vendorName) {

    selectedVendorId = vendorId;
  
    document.getElementById(
      'selected-vendor-title'
    ).textContent = `${vendorName} Catalog`;
  
    navigate('products-market');
  
  }
async function loadMarketplaceProducts() {
    try {
        const products = await api('/products');
        console.log("All Products:", products);
        console.log("Selected Vendor ID:", selectedVendorId);

        const filtered = products.filter(p => {
            if (!p.vendor) return false;
            return String(p.vendor._id || p.vendor) === String(selectedVendorId);
        });

        const grid = document.getElementById('products-market-grid');
        grid.innerHTML = ''; // Clear previous content

        if (!filtered.length) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>No products found for this vendor.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(p => `
            <div class="vendor-card">
                <div class="product-image-container">
                    ${p.image ? `
                        <img src="${p.image}" 
                             alt="${p.name}"
                             onerror="this.src='https://via.placeholder.com/300x180?text=No+Image'">
                    ` : `
                        <div class="no-image">No Image</div>
                    `}
                </div>

                <div class="vendor-name">${p.name}</div>
                
                <div class="vendor-email">${p.category || 'General'}</div>

                <div class="vendor-tags">
                    <span class="tag">₹${parseFloat(p.price || 0).toLocaleString('en-IN')}</span>
                    <span class="tag ${p.stock > 0 ? 'tag-green' : 'tag-red'}">
                        ${p.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                </div>

                <p class="text-muted" style="margin: 10px 0; font-size:13px; line-height:1.4;">
                    ${p.description ? p.description.substring(0, 85) + '...' : 'No description available'}
                </p>

                <div class="vendor-actions">
                    <button 
                        class="btn btn-primary btn-full"
                        onclick="openRequestForm(
                                '${p._id}',
                                '${p.name.replace(/'/g, "\\'")}',
                                '${p.vendor._id || p.vendor}'
                              )">
                        Request To Buy
                    </button>
                </div>
            </div>
        `).join('');

    } catch (e) {
        console.error(e);
        toast(e.message || 'Failed to load products', 'error');
    }
}

function openRequestForm(
  productId,
  productName,
  vendorId
) {

  // Open hidden request page
  navigate('new-request');

  // Autofill form
  document.getElementById('req-item').value =
    productName;

  document.getElementById('req-qty').value = 1;

  document.getElementById('req-notes').value =
    `Request for ${productName}`;

  // Auto-select vendor
  const vendorSelect =
    document.getElementById('req-vendor');

  vendorSelect.value = vendorId;

}
// ══ DASHBOARD ═══════════════════════════════════════════════
async function loadDashboard() {
  try {
    const [requests, vendors] = await Promise.all([
      api('/requests'),
      api('/vendors'),
    ]);
    const pending  = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;

    // Stats
    const isAdmin = currentUser.role === 'admin';
    let stats = [
      { label: 'Total Requests', value: requests.length, cls: 'blue' },
      { label: 'Pending', value: pending, cls: 'amber' },
      { label: 'Approved', value: approved, cls: 'green' },
      { label: 'Rejected', value: rejected, cls: 'red' },
    ];
    if (isAdmin) stats.push({ label: 'Vendors', value: vendors.length, cls: '' });

    document.getElementById('stats-grid').innerHTML = stats.map(s =>
      `<div class="stat-card">
        <div class="stat-label">${s.label}</div>
        <div class="stat-value ${s.cls}">${s.value}</div>
      </div>`
    ).join('');

    // Update pending badges
    if (pending > 0) {
      const ub = document.getElementById('pending-badge');
      const ab = document.getElementById('admin-pending-badge');
      if (ub) { ub.textContent = pending; ub.style.display = ''; }
      if (ab) { ab.textContent = pending; ab.style.display = ''; }
    }

    // Recent table
    const recent = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
    const tbody = document.getElementById('recent-tbody');
    if (!recent.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-muted" style="text-align:center;padding:32px">No requests yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = recent.map(r => `
      <tr>
        <td><strong>${r.itemName}</strong></td>
        <td>${r.quantity}</td>
        <td style="display:${isAdmin?'':'none'}">${r.user?.name || '—'}</td>
        <td>${r.vendor?.name || '—'}</td>
        <td>${statusBadge(r.status)}</td>
        <td class="text-muted text-sm">${fmtDate(r.createdAt)}</td>
      </tr>`).join('');
  } catch (e) {
    toast(e.message, 'error');
  }
}

// ══ MY REQUESTS ═════════════════════════════════════════════
async function loadMyRequests() {
  try {
    myRequestsData = await api('/requests');
    renderMyRequests();
  } catch (e) { toast(e.message, 'error'); }
}

function renderMyRequests() {
  const f = currentFilter.my;
  const data = f === 'all' ? myRequestsData : myRequestsData.filter(r => r.status === f);
  const tbody = document.getElementById('my-requests-tbody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-muted" style="text-align:center;padding:32px">No requests found.</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(r => `
    <tr>
      <td><strong>${r.itemName}</strong></td>
      <td>${r.quantity}</td>
      <td>${r.vendor?.name || '—'}</td>
      <td class="text-muted text-sm">${r.notes || '—'}</td>
      <td>${statusBadge(r.status)}</td>
      <td class="text-muted text-sm">${fmtDate(r.createdAt)}</td>
    </tr>`).join('');
}

function filterRequests(scope, val, btn) {
  currentFilter[scope] = val;
  const tabsId = scope === 'my' ? 'my-filter-tabs' : null;
  const parent = btn.closest('.filter-tabs');
  parent.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  if (scope === 'my') renderMyRequests();
  else renderAllRequests();
}
async function applyRequestFilters() {

try {

  const search =
    document.getElementById('request-search').value;

  const sort =
    document.getElementById('request-sort').value;

  const requests = await api(
    `/requests?search=${encodeURIComponent(search)}&sort=${sort}`
  );

  renderAllRequests(requests);

} catch (e) {

  toast(e.message, 'error');

}

}

// ══ ALL REQUESTS (admin) ════════════════════════════════════
async function loadAllRequests() {
  try {
    allRequestsData = await api('/requests');
    renderAllRequests();
  } catch (e) { toast(e.message, 'error'); }
}

function renderAllRequests(filteredData = null){
  const f = currentFilter.admin;
  const sourceData = filteredData || allRequestsData;

  const data = f === 'all'
  ? sourceData
  : sourceData.filter(r => r.status === f);

  const tbody = document.getElementById('admin-requests-tbody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-muted" style="text-align:center;padding:32px">No requests found.</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(r => `
    <tr>
      <td><strong>${r.itemName}</strong></td>
      <td>${r.quantity}</td>
      <td>
        <div class="flex items-center gap-8">
          <div class="avatar">${initials(r.user?.name || '?')}</div>
          <div>
            <div style="font-size:13px;font-weight:500">${r.user?.name || '—'}</div>
            <div class="text-xs text-muted">${r.user?.email || ''}</div>
          </div>
        </div>
      </td>
      <td>${r.vendor?.name || '—'}</td>
      <td class="text-muted text-sm">${r.notes || '—'}</td>
      <td>${statusBadge(r.status)}</td>
      <td class="text-muted text-sm">${fmtDate(r.createdAt)}</td>
      <td>
        ${r.status !== 'completed' && r.status !== 'rejected' ? `
         <div style="min-width:170px">
  <select
    onchange="updateRequestStatus('${r._id}', this.value)"
    style="
      width:100%;
      background:var(--bg3);
      color:var(--text);
      border:1px solid var(--border);
      padding:7px 10px;
      border-radius:8px;
      font-size:12px;
      cursor:pointer;
    "
  >

    <option value="">Change Status</option>

    <option value="pending">Pending</option>

    <option value="under-review">Under Review</option>

    <option value="approved">Approved</option>

    <option value="ordered">Ordered</option>

    <option value="delivered">Delivered</option>

    <option value="completed">Completed</option>

    <option value="rejected">Rejected</option>

  </select>
</div>
        ` : '<span class="text-muted text-sm">Locked</span>'}
      </td>
    </tr>`).join('');
}

async function updateRequestStatus(id, status) {

if (!status) return;

try {

  await api(`/requests/${id}/status`, 'PUT', {
    status
  });

  toast(`Request moved to ${status}`, 'success');

  await loadAllRequests();
  await loadDashboard();

} catch (e) {

  toast(e.message, 'error');

}
}


// ══ NEW REQUEST ══════════════════════════════════════════════
async function loadVendorSelect() {
  try {
    const vendors = await api('/vendors');
    const sel = document.getElementById('req-vendor');
    sel.innerHTML = '<option value="">Select vendor…</option>' +
      vendors.map(v => `<option value="${v._id}">${v.name} (${v.category || 'General'})</option>`).join('');
  } catch (e) { toast(e.message, 'error'); }
}

async function submitRequest() {
  const itemName = document.getElementById('req-item').value.trim();
  const quantity = parseInt(document.getElementById('req-qty').value);
  const vendor   = document.getElementById('req-vendor').value;
  const notes    = document.getElementById('req-notes').value.trim();
  const alertEl  = document.getElementById('req-alert');

  alertEl.innerHTML = '';
  if (!itemName || !vendor || !quantity) {
    alertEl.innerHTML = `<div class="alert alert-error">Please fill item name, quantity and vendor.</div>`;
    return;
  }
  setLoading('req-submit-btn', true);
  try {
    await api('/requests', 'POST', { itemName, quantity, vendor, notes });
    alertEl.innerHTML = `<div class="alert alert-success">Request submitted successfully!</div>`;
    document.getElementById('req-item').value = '';
    document.getElementById('req-qty').value  = 1;
    document.getElementById('req-vendor').value = '';
    document.getElementById('req-notes').value  = '';
    toast('Request submitted!', 'success');
    setTimeout(() => navigate('my-requests'), 1500);
  } catch (e) {
    alertEl.innerHTML = `<div class="alert alert-error">${e.message}</div>`;
  } finally { setLoading('req-submit-btn', false); }
}

// ══ VENDORS ═════════════════════════════════════════════════
async function loadVendors() {

    try {
  
      vendorsData = await api('/vendors');
  
      renderVendors();
  
      // Vendor dashboard stats
      if (currentUser.role === 'vendor') {
  
        const products =
          await api('/products/my-products');
  
        const totalProducts =
          products.length;
  
        const inStock =
          products.filter(p => p.stock > 0).length;
  
        const outOfStock =
          products.filter(p => p.stock <= 0).length;
  
        const totalValue =
          products.reduce(
            (sum, p) => sum + (p.price * p.stock),
            0
          );
  
        document.getElementById('vendor-stats').style.display =
          'grid';
  
        document.getElementById('vendor-stats').innerHTML = `
          
          <div class="stat-card">
            <div class="stat-label">
              Total Products
            </div>
  
            <div class="stat-value blue">
              ${totalProducts}
            </div>
          </div>
  
          <div class="stat-card">
            <div class="stat-label">
              In Stock
            </div>
  
            <div class="stat-value green">
              ${inStock}
            </div>
          </div>
  
          <div class="stat-card">
            <div class="stat-label">
              Out Of Stock
            </div>
  
            <div class="stat-value red">
              ${outOfStock}
            </div>
          </div>
  
          <div class="stat-card">
            <div class="stat-label">
              Inventory Value
            </div>
  
            <div class="stat-value amber">
              ₹${totalValue}
            </div>
          </div>
  
        `;
  
      }
  
    } catch (e) {
  
      toast(e.message, 'error');
  
    }
  
  }

function renderVendors() {
  const grid = document.getElementById('vendors-grid');
  if (!vendorsData.length) {
    grid.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg><p>No vendors yet.</p></div>`;
    return;
  }
  const isAdmin = currentUser.role === 'admin';
  grid.innerHTML = vendorsData.map(v => `
    <div class="vendor-card">
      <div class="vendor-name">${v.businessName || v.name}</div>
      <div class="vendor-email">${v.email}</div>
      <div class="vendor-tags">
        ${v.category ? `<span class="tag">${v.category || v.businessType || 'General'}</span>` : ''}
        <span class="tag tag-rating">★ ${parseFloat(v.rating).toFixed(1)}</span>
        ${v.phone ? `<span class="tag">${v.phone}</span>` : ''}
      </div>
      <button class="btn btn-primary btn-sm" onclick="openVendorProducts( '${v._id}',  '${v.businessName || v.name}'  )">
  View Catalog
</button>
      ${isAdmin ? `<div class="vendor-actions">
        <button class="btn btn-danger btn-sm" onclick="deleteVendor('${v._id}')">Delete</button>
      </div>` : ''}
    </div>`).join('');
}
// ═══════════════════════════════════════
// ADD PRODUCT
// ═══════════════════════════════════════
async function addProduct() {

const name =
  document.getElementById('product-name').value.trim();

const category =
  document.getElementById('product-category').value.trim();

const description =
  document.getElementById('product-description').value.trim();

const price =
  parseFloat(
    document.getElementById('product-price').value
  );

const stock =
  parseInt(
    document.getElementById('product-stock').value
  );

const image =
  document.getElementById('product-image').value.trim();

const features =
  document.getElementById('product-features')
    .value
    .split(',')
    .map(f => f.trim())
    .filter(f => f);

const alertEl =
  document.getElementById('product-alert');

alertEl.innerHTML = '';

if (
  !name ||
  !category ||
  !price ||
  stock < 0
) {

  alertEl.innerHTML = `
    <div class="alert alert-error">
      Please fill all required fields.
    </div>
  `;

  return;

}

try {

  await api('/products', 'POST', {

    name,
    category,
    description,
    price,
    stock,
    image,
    features

  });

  alertEl.innerHTML = `
    <div class="alert alert-success">
      Product added successfully!
    </div>
  `;

  toast('Product added!', 'success');

  document.getElementById('product-name').value = '';
  document.getElementById('product-category').value = '';
  document.getElementById('product-description').value = '';
  document.getElementById('product-price').value = '';
  document.getElementById('product-stock').value = '';
  document.getElementById('product-image').value = '';
  document.getElementById('product-features').value = '';

  loadMyProducts();

} catch (e) {

  alertEl.innerHTML = `
    <div class="alert alert-error">
      ${e.message}
    </div>
  `;

}

}
// ═══════════════════════════════════════
// LOAD MY PRODUCTS
// ═══════════════════════════════════════
// ══ VENDOR PRODUCTS ═══════════════════════════════
async function loadMyProducts() {

try {

  const products = await api('/products/my-products');

  const grid =
    document.getElementById('my-products-grid');

  if (!products.length) {

    grid.innerHTML = `
      <div class="empty-state">
        <p>No products added yet.</p>
      </div>
    `;

    return;

  }

  grid.innerHTML = products.map(product => `

    <div class="vendor-card">

      <div
        style="
          width:100%;
          height:180px;
          overflow:hidden;
          border-radius:12px;
          margin-bottom:12px;
          background:var(--bg3);
        "
      >

        <img
          src="${product.image}"
          alt="${product.name}"
          style="
            width:100%;
            height:100%;
            object-fit:cover;
          "
        >

      </div>

      <div class="vendor-name">
        ${product.name}
      </div>

      <div class="vendor-email">
        ${product.category}
      </div>

      <div class="vendor-tags">

        <span class="tag">
          ₹${product.price}
        </span>

        <span class="tag">
          Stock: ${product.stock}
        </span>

        <span class="tag tag-rating">
          ${product.inStock ? 'In Stock' : 'Out of Stock'}
        </span>

      </div>

      <p
        style="
          margin-top:12px;
          color:var(--text2);
          font-size:12px;
          line-height:1.5;
        "
      >
        ${product.description || 'No description'}
      </p>

    </div>

  `).join('');

} catch (e) {

  toast(e.message, 'error');

}
}

// ═══════════════════════════════════════
// DELETE PRODUCT
// ═══════════════════════════════════════
async function deleteProduct(id) {

if (!confirm('Delete this product?'))
  return;

try {

  await api(`/products/${id}`, 'DELETE');

  toast('Product deleted!', 'success');

  loadMyProducts();

  loadVendorDashboard();

} catch (e) {

  toast(e.message, 'error');

}
}

function toggleAddVendor() {
  addVendorVisible = !addVendorVisible;
  document.getElementById('add-vendor-section').style.display = addVendorVisible ? '' : 'none';
  document.getElementById('toggle-add-vendor').textContent = addVendorVisible ? '✕ Cancel' : '+ Add Vendor';
}

async function addVendor() {
  const name     = document.getElementById('v-name').value.trim();
  const email    = document.getElementById('v-email').value.trim();
  const category = document.getElementById('v-category').value.trim();
  const phone    = document.getElementById('v-phone').value.trim();
  const rating   = parseFloat(document.getElementById('v-rating').value);
  const alertEl  = document.getElementById('vendor-alert');

  alertEl.innerHTML = '';
  if (!name || !email) {
    alertEl.innerHTML = `<div class="alert alert-error">Name and email are required.</div>`;
    return;
  }
  setLoading('add-vendor-btn', true);
  try {
    await api('/vendors', 'POST', { name, email, category, phone, rating });
    alertEl.innerHTML = `<div class="alert alert-success">Vendor added!</div>`;
    document.getElementById('v-name').value  = '';
    document.getElementById('v-email').value = '';
    document.getElementById('v-category').value = '';
    document.getElementById('v-phone').value = '';
    document.getElementById('v-rating').value = 4.0;
    document.getElementById('v-rating-val').textContent = '4.0';
    toast('Vendor added!', 'success');
    await loadVendors();
    setTimeout(() => toggleAddVendor(), 1000);
  } catch (e) {
    alertEl.innerHTML = `<div class="alert alert-error">${e.message}</div>`;
  } finally { setLoading('add-vendor-btn', false); }
}

async function deleteVendor(id) {
  if (!confirm('Delete this vendor?')) return;
  try {
    await api(`/vendors/${id}`, 'DELETE');
    toast('Vendor deleted.', 'success');
    await loadVendors();
  } catch (e) { toast(e.message, 'error'); }
}

// ══ USERS ═══════════════════════════════════════════════════
async function loadUsers() {
  try {
    const users = await api('/users');
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div class="flex items-center gap-8">
            <div class="avatar">${initials(u.name)}</div>
            <span style="font-weight:500">${u.name}</span>
          </div>
        </td>
        <td class="text-muted">${u.email}</td>
        <td><span class="badge-status badge-${u.role}" style="font-size:11px">${u.role}</span></td>
        <td class="text-muted text-sm">${fmtDate(u.createdAt)}</td>
        <td>

  ${
    u.role === 'vendor' &&
    !u.vendorApproved
      ? `
        <button
          class="btn btn-success btn-sm"
          onclick="approveVendor('${u._id}')"
        >
          Approve Vendor
        </button>
      `
      : ''
  }

  ${
    u._id !== currentUser.id
      ? `
        <button
          class="btn btn-danger btn-sm"
          onclick="deleteUser('${u._id}')"
        >
          Remove
        </button>
      `
      : '<span class="text-muted text-sm">You</span>'
  }

</td>
      </tr>`).join('');
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteUser(id) {
  if (!confirm('Remove this user?')) return;
  try {
    await api(`/users/${id}`, 'DELETE');
    toast('User removed.', 'success');
    loadUsers();
  } catch (e) { toast(e.message, 'error'); }
}
async function approveVendor(id) {

    try {
  
      await api(
        `/users/${id}/approve-vendor`,
        'PUT'
      );
  
      toast('Vendor approved!', 'success');
  
      loadUsers();
  
    } catch (e) {
  
      toast(e.message, 'error');
  
    }
  
  }
// ══ INIT ════════════════════════════════════════════════════
(function init() {
  const token = localStorage.getItem('pg_token');
  const user  = localStorage.getItem('pg_user');
  if (token && user) {
    currentUser = JSON.parse(user);
    bootApp();
  }
})();