
// Transport Billing System - JavaScript with Animations

class TransportBillingSystem {
    constructor() {
        this.invoices = JSON.parse(localStorage.getItem('invoices')) || [];
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        this.currentInvoice = {};
        this.itemCounter = 1;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAnimations();
        this.setCurrentDate();
        this.generateInvoiceNumber();
        this.animateCounters();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchSection(e));
        });

        // Invoice form
        document.getElementById('addItem').addEventListener('click', () => this.addItem());
        document.getElementById('invoiceForm').addEventListener('submit', (e) => this.generateInvoice(e));
        document.getElementById('saveInvoice').addEventListener('click', () => this.saveInvoice());
        document.getElementById('generatePDF').addEventListener('click', () => this.generatePDF());

        // File upload
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('imageUpload');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Item calculations
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('item-qty') || 
                e.target.classList.contains('item-rate') || 
                e.target.classList.contains('gst-rate')) {
                this.calculateItemAmount(e.target);
                this.calculateTotals();
            }
        });

        // Remove item buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-item') || e.target.closest('.remove-item')) {
                this.removeItem(e.target);
            }
        });

        // Modal close
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());

        // Add expense
        document.getElementById('addExpense').addEventListener('click', () => this.showAddExpenseModal());
    }

    setupAnimations() {
        // Animate elements when they come into view
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe all animatable elements
        document.querySelectorAll('.fade-in, .slide-up, .bounce-in').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            observer.observe(el);
        });
    }

    switchSection(e) {
        const targetSection = e.target.dataset.section || e.target.closest('.nav-btn').dataset.section;
        
        // Remove active classes
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active-section'));
        
        // Add active classes with animation
        e.target.classList.add('active');
        const section = document.getElementById(targetSection);
        section.classList.add('active-section');
        
        // Trigger animations for the new section
        this.animateSection(section);
    }

    animateSection(section) {
        const animatableElements = section.querySelectorAll('.fade-in, .slide-up, .bounce-in');
        animatableElements.forEach((el, index) => {
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0) scale(1)';
            }, index * 100);
        });
    }

    animateCounters() {
        const counters = document.querySelectorAll('.stat-number[data-count]');
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.count);
            const isRupee = counter.textContent.includes('₹');
            let current = 0;
            const increment = target / 50;
            
            const updateCounter = () => {
                if (current < target) {
                    current += increment;
                    if (isRupee) {
                        counter.textContent = '₹' + Math.floor(current).toLocaleString();
                    } else {
                        counter.textContent = Math.floor(current);
                    }
                    requestAnimationFrame(updateCounter);
                } else {
                    if (isRupee) {
                        counter.textContent = '₹' + target.toLocaleString();
                    } else {
                        counter.textContent = target;
                    }
                }
            };
            
            // Start animation after a delay
            setTimeout(updateCounter, 500);
        });
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('invoiceDate').value = today;
        
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        document.getElementById('dueDate').value = dueDate.toISOString().split('T')[0];
    }

    generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const invoiceCount = this.invoices.length + 1;
        const invoiceNumber = `INV-${year}-${invoiceCount.toString().padStart(3, '0')}`;
        document.getElementById('invoiceNumber').value = invoiceNumber;
    }

    addItem() {
        this.itemCounter++;
        const itemsContainer = document.getElementById('itemsContainer');
        
        const itemRow = document.createElement('div');
        itemRow.className = 'item-row slide-down';
        itemRow.dataset.item = this.itemCounter;
        
        itemRow.innerHTML = `
            <div class="item-fields">
                <input type="text" placeholder="Description" class="item-desc" required>
                <input type="number" placeholder="Qty" class="item-qty" min="1" value="1" required>
                <input type="number" placeholder="Rate" class="item-rate" step="0.01" required>
                <select class="gst-rate">
                    <option value="0">0% GST</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18" selected>18% GST</option>
                    <option value="28">28% GST</option>
                </select>
                <input type="number" placeholder="Amount" class="item-amount" readonly>
                <button type="button" class="btn-danger remove-item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        itemsContainer.appendChild(itemRow);
        
        // Animate the new item
        setTimeout(() => {
            itemRow.style.opacity = '1';
            itemRow.style.transform = 'translateY(0)';
        }, 100);
    }

    removeItem(button) {
        const itemRow = button.closest('.item-row');
        itemRow.style.animation = 'slide-up 0.3s ease-out reverse';
        
        setTimeout(() => {
            itemRow.remove();
            this.calculateTotals();
        }, 300);
    }

    calculateItemAmount(element) {
        const itemRow = element.closest('.item-row');
        const qty = parseFloat(itemRow.querySelector('.item-qty').value) || 0;
        const rate = parseFloat(itemRow.querySelector('.item-rate').value) || 0;
        const amount = qty * rate;
        
        itemRow.querySelector('.item-amount').value = amount.toFixed(2);
    }

    calculateTotals() {
        let subtotal = 0;
        let totalGST = 0;
        
        document.querySelectorAll('.item-row').forEach(row => {
            const amount = parseFloat(row.querySelector('.item-amount').value) || 0;
            const gstRate = parseFloat(row.querySelector('.gst-rate').value) || 0;
            
            subtotal += amount;
            totalGST += (amount * gstRate) / 100;
        });
        
        const cgst = totalGST / 2;
        const sgst = totalGST / 2;
        const total = subtotal + totalGST;
        
        // Animate the totals update
        this.animateValue('subtotal', subtotal);
        this.animateValue('cgst', cgst);
        this.animateValue('sgst', sgst);
        this.animateValue('igst', 0);
        this.animateValue('totalAmount', total);
    }

    animateValue(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const currentValue = parseFloat(element.textContent.replace('₹', '').replace(',', '')) || 0;
        const increment = (targetValue - currentValue) / 20;
        let current = currentValue;
        
        const updateValue = () => {
            if (Math.abs(current - targetValue) > Math.abs(increment)) {
                current += increment;
                element.textContent = '₹' + current.toFixed(2);
                requestAnimationFrame(updateValue);
            } else {
                element.textContent = '₹' + targetValue.toFixed(2);
            }
        };
        
        updateValue();
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.style.borderColor = '#667eea';
        e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
    }

    handleDrop(e) {
        e.preventDefault();
        const files = e.dataTransfer.files;
        this.processFiles(files);
        
        e.currentTarget.style.borderColor = '#667eea';
        e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
    }

    handleFileSelect(e) {
        const files = e.target.files;
        this.processFiles(files);
    }

    processFiles(files) {
        const uploadedImages = document.getElementById('uploadedImages');
        
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageContainer = document.createElement('div');
                    imageContainer.className = 'uploaded-image';
                    imageContainer.innerHTML = `
                        <img src="${e.target.result}" alt="Uploaded image">
                        <button class="remove-image" onclick="this.parentElement.remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    uploadedImages.appendChild(imageContainer);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('loadingOverlay').style.opacity = '1';
        }, 10);
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }

    showSuccessModal() {
        const modal = document.getElementById('successModal');
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }

    closeModal() {
        const modal = document.getElementById('successModal');
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    generateInvoice(e) {
        e.preventDefault();
        
        this.showLoading();
        
        // Collect form data
        const formData = new FormData(e.target);
        const invoiceData = this.collectInvoiceData();
        
        // Simulate processing time
        setTimeout(() => {
            this.saveInvoiceToStorage(invoiceData);
            this.hideLoading();
            this.showSuccessModal();
            this.resetForm();
        }, 2000);
    }

    collectInvoiceData() {
        const items = [];
        document.querySelectorAll('.item-row').forEach(row => {
            items.push({
                description: row.querySelector('.item-desc').value,
                quantity: row.querySelector('.item-qty').value,
                rate: row.querySelector('.item-rate').value,
                gstRate: row.querySelector('.gst-rate').value,
                amount: row.querySelector('.item-amount').value
            });
        });

        return {
            id: Date.now(),
            invoiceNumber: document.getElementById('invoiceNumber').value,
            date: document.getElementById('invoiceDate').value,
            dueDate: document.getElementById('dueDate').value,
            company: {
                name: document.getElementById('companyName').value,
                gstin: document.getElementById('gstin').value,
                address: document.getElementById('companyAddress').value,
                phone: document.getElementById('companyPhone').value
            },
            customer: {
                name: document.getElementById('customerName').value,
                gstin: document.getElementById('customerGstin').value,
                address: document.getElementById('customerAddress').value,
                phone: document.getElementById('customerPhone').value
            },
            transportRoute: document.getElementById('transportRoute').value,
            items: items,
            totals: {
                subtotal: document.getElementById('subtotal').textContent,
                cgst: document.getElementById('cgst').textContent,
                sgst: document.getElementById('sgst').textContent,
                igst: document.getElementById('igst').textContent,
                total: document.getElementById('totalAmount').textContent
            }
        };
    }

    saveInvoiceToStorage(invoiceData) {
        this.invoices.push(invoiceData);
        localStorage.setItem('invoices', JSON.stringify(this.invoices));
    }

    saveInvoice() {
        const invoiceData = this.collectInvoiceData();
        this.saveInvoiceToStorage(invoiceData);
        
        // Show success animation
        const saveBtn = document.getElementById('saveInvoice');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        saveBtn.style.background = '#28a745';
        
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.style.background = '';
        }, 2000);
    }

    generatePDF() {
        this.showLoading();
        
        // Simulate PDF generation
        setTimeout(() => {
            this.hideLoading();
            
            // Create a simple PDF-like content
            const invoiceData = this.collectInvoiceData();
            const pdfContent = this.createPDFContent(invoiceData);
            
            // Open in new window for printing
            const newWindow = window.open('', '_blank');
            newWindow.document.write(pdfContent);
            newWindow.document.close();
            newWindow.print();
        }, 1500);
    }

    createPDFContent(data) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice - ${data.invoiceNumber}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body { 
                        font-family: 'Inter', 'Segoe UI', sans-serif; 
                        line-height: 1.6;
                        color: #2d3748;
                        background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                        padding: 0;
                        margin: 0;
                    }
                    
                    .invoice-container {
                        max-width: 900px;
                        margin: 0 auto;
                        background: white;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
                        border-radius: 16px;
                        overflow: hidden;
                    }
                    
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 40px;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .header::before {
                        content: '';
                        position: absolute;
                        top: -50%;
                        left: -50%;
                        width: 200%;
                        height: 200%;
                        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                        animation: float 6s ease-in-out infinite;
                    }
                    
                    .header h1 {
                        font-size: 2.5em;
                        font-weight: 700;
                        letter-spacing: -0.02em;
                        margin-bottom: 10px;
                        position: relative;
                        z-index: 1;
                    }
                    
                    .header h2 {
                        font-size: 1.8em;
                        font-weight: 500;
                        margin-bottom: 15px;
                        opacity: 0.95;
                        position: relative;
                        z-index: 1;
                    }
                    
                    .gstin-badge {
                        background: rgba(255, 255, 255, 0.2);
                        backdrop-filter: blur(10px);
                        padding: 8px 20px;
                        border-radius: 25px;
                        font-weight: 500;
                        display: inline-block;
                        position: relative;
                        z-index: 1;
                    }
                    
                    .invoice-body {
                        padding: 40px;
                    }
                    
                    .invoice-meta {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 40px;
                        margin-bottom: 40px;
                        padding: 30px;
                        background: linear-gradient(145deg, #f8fafc, #e2e8f0);
                        border-radius: 12px;
                        border: 1px solid rgba(102, 126, 234, 0.1);
                    }
                    
                    .invoice-details {
                        background: white;
                        padding: 25px;
                        border-radius: 8px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
                    }
                    
                    .invoice-details h3 {
                        color: #667eea;
                        font-weight: 600;
                        margin-bottom: 15px;
                        font-size: 1.1em;
                        border-bottom: 2px solid rgba(102, 126, 234, 0.2);
                        padding-bottom: 8px;
                    }
                    
                    .detail-item {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 8px;
                        align-items: center;
                    }
                    
                    .detail-label {
                        font-weight: 500;
                        color: #4a5568;
                    }
                    
                    .detail-value {
                        font-weight: 600;
                        color: #2d3748;
                    }
                    
                    .customer-info {
                        background: white;
                        padding: 25px;
                        border-radius: 8px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
                    }
                    
                    .customer-info h3 {
                        color: #667eea;
                        font-weight: 600;
                        margin-bottom: 15px;
                        font-size: 1.1em;
                        border-bottom: 2px solid rgba(102, 126, 234, 0.2);
                        padding-bottom: 8px;
                    }
                    
                    .customer-details {
                        line-height: 1.8;
                    }
                    
                    .route-banner {
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        color: white;
                        padding: 20px;
                        border-radius: 12px;
                        text-align: center;
                        margin: 30px 0;
                        font-weight: 600;
                        font-size: 1.2em;
                        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
                    }
                    
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 30px 0;
                        background: white;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
                    }
                    
                    .items-table thead {
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        color: white;
                    }
                    
                    .items-table th {
                        padding: 20px 15px;
                        font-weight: 600;
                        text-align: left;
                        font-size: 0.95em;
                        letter-spacing: 0.5px;
                        text-transform: uppercase;
                    }
                    
                    .items-table td {
                        padding: 18px 15px;
                        border-bottom: 1px solid #e2e8f0;
                        vertical-align: middle;
                    }
                    
                    .items-table tbody tr:nth-child(even) {
                        background: #f8fafc;
                    }
                    
                    .items-table tbody tr:hover {
                        background: rgba(102, 126, 234, 0.05);
                        transform: scale(1.01);
                        transition: all 0.2s ease;
                    }
                    
                    .amount-cell {
                        font-weight: 600;
                        color: #667eea;
                    }
                    
                    .totals-section {
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        color: white;
                        padding: 30px;
                        border-radius: 12px;
                        margin-top: 30px;
                        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
                    }
                    
                    .totals-grid {
                        display: grid;
                        gap: 15px;
                        max-width: 400px;
                        margin-left: auto;
                    }
                    
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px 0;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                        font-size: 1.05em;
                    }
                    
                    .total-row:last-child {
                        border-bottom: none;
                    }
                    
                    .final-total {
                        border-top: 2px solid rgba(255, 255, 255, 0.4);
                        padding-top: 20px;
                        margin-top: 15px;
                        font-weight: 700;
                        font-size: 1.4em;
                        background: rgba(255, 255, 255, 0.1);
                        padding: 20px;
                        border-radius: 8px;
                        backdrop-filter: blur(10px);
                    }
                    
                    .footer {
                        background: #f8fafc;
                        padding: 30px;
                        text-align: center;
                        color: #718096;
                        border-top: 1px solid #e2e8f0;
                    }
                    
                    .thank-you {
                        font-size: 1.1em;
                        font-weight: 500;
                        color: #4a5568;
                        margin-bottom: 10px;
                    }
                    
                    @keyframes float {
                        0%, 100% { transform: translateY(0px) rotate(0deg); }
                        50% { transform: translateY(-20px) rotate(5deg); }
                    }
                    
                    @media print {
                        body { background: white; }
                        .invoice-container { box-shadow: none; }
                        .header::before { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    <div class="header">
                        <h1>🚛 TRANSPORT INVOICE</h1>
                        <h2>${data.company.name}</h2>
                        <div class="gstin-badge">GSTIN: ${data.company.gstin}</div>
                    </div>
                    
                    <div class="invoice-body">
                        <div class="invoice-meta">
                            <div class="invoice-details">
                                <h3>📋 Invoice Details</h3>
                                <div class="detail-item">
                                    <span class="detail-label">Invoice Number:</span>
                                    <span class="detail-value">${data.invoiceNumber}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Invoice Date:</span>
                                    <span class="detail-value">${new Date(data.date).toLocaleDateString('en-IN')}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Due Date:</span>
                                    <span class="detail-value">${new Date(data.dueDate).toLocaleDateString('en-IN')}</span>
                                </div>
                            </div>
                            
                            <div class="customer-info">
                                <h3>👤 Bill To</h3>
                                <div class="customer-details">
                                    <strong>${data.customer.name}</strong><br>
                                    ${data.customer.address}<br>
                                    <strong>GSTIN:</strong> ${data.customer.gstin || 'N/A'}<br>
                                    <strong>Phone:</strong> ${data.customer.phone || 'N/A'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="route-banner">
                            🛣️ Transport Route: ${data.transportRoute}
                        </div>
                        
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Qty</th>
                                    <th>Rate (₹)</th>
                                    <th>GST %</th>
                                    <th>Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.items.map(item => `
                                    <tr>
                                        <td><strong>${item.description}</strong></td>
                                        <td>${item.quantity}</td>
                                        <td>₹${parseFloat(item.rate).toLocaleString('en-IN')}</td>
                                        <td><span style="background: rgba(102, 126, 234, 0.1); padding: 4px 8px; border-radius: 4px; font-weight: 600;">${item.gstRate}%</span></td>
                                        <td class="amount-cell">₹${parseFloat(item.amount).toLocaleString('en-IN')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        
                        <div class="totals-section">
                            <div class="totals-grid">
                                <div class="total-row">
                                    <span>💰 Subtotal:</span>
                                    <span>${data.totals.subtotal}</span>
                                </div>
                                <div class="total-row">
                                    <span>🏛️ CGST:</span>
                                    <span>${data.totals.cgst}</span>
                                </div>
                                <div class="total-row">
                                    <span>🏛️ SGST:</span>
                                    <span>${data.totals.sgst}</span>
                                </div>
                                <div class="total-row">
                                    <span>🏛️ IGST:</span>
                                    <span>${data.totals.igst}</span>
                                </div>
                                <div class="total-row final-total">
                                    <span>💎 Total Amount:</span>
                                    <span>${data.totals.total}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <div class="thank-you">Thank you for your business! 🙏</div>
                        <div>Generated on ${new Date().toLocaleDateString('en-IN')} | ${data.company.name}</div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    resetForm() {
        document.getElementById('invoiceForm').reset();
        document.getElementById('itemsContainer').innerHTML = `
            <div class="item-row slide-down" data-item="1">
                <div class="item-fields">
                    <input type="text" placeholder="Description" class="item-desc" required>
                    <input type="number" placeholder="Qty" class="item-qty" min="1" value="1" required>
                    <input type="number" placeholder="Rate" class="item-rate" step="0.01" required>
                    <select class="gst-rate">
                        <option value="0">0% GST</option>
                        <option value="5">5% GST</option>
                        <option value="12">12% GST</option>
                        <option value="18" selected>18% GST</option>
                        <option value="28">28% GST</option>
                    </select>
                    <input type="number" placeholder="Amount" class="item-amount" readonly>
                    <button type="button" class="btn-danger remove-item">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        document.getElementById('uploadedImages').innerHTML = '';
        this.setCurrentDate();
        this.generateInvoiceNumber();
        this.calculateTotals();
    }

    showAddExpenseModal() {
        const modal = document.createElement('div');
        modal.className = 'modal expense-modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content expense-modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-plus-circle"></i> Add New Expense</h3>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="expenseForm" class="expense-form">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Expense Type</label>
                            <select id="expenseType" required>
                                <option value="">Select Type</option>
                                <option value="fuel">⛽ Fuel</option>
                                <option value="maintenance">🔧 Maintenance</option>
                                <option value="toll">🛣️ Toll Charges</option>
                                <option value="driver">👨‍💼 Driver Salary</option>
                                <option value="insurance">🛡️ Insurance</option>
                                <option value="permit">📋 Permits</option>
                                <option value="parking">🅿️ Parking</option>
                                <option value="other">📝 Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Amount (₹)</label>
                            <input type="number" id="expenseAmount" step="0.01" required placeholder="Enter amount">
                        </div>
                        <div class="form-group">
                            <label>Date</label>
                            <input type="date" id="expenseDate" required>
                        </div>
                        <div class="form-group">
                            <label>Vehicle Number</label>
                            <input type="text" id="vehicleNumber" placeholder="e.g., DL-01-AB-1234">
                        </div>
                        <div class="form-group full-width">
                            <label>Description</label>
                            <textarea id="expenseDescription" rows="3" placeholder="Enter expense details"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Payment Method</label>
                            <select id="paymentMethod">
                                <option value="cash">💵 Cash</option>
                                <option value="card">💳 Card</option>
                                <option value="upi">📱 UPI</option>
                                <option value="bank">🏦 Bank Transfer</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Receipt/Bill</label>
                            <input type="file" id="expenseReceipt" accept="image/*,.pdf">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> Save Expense
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set current date
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
        
        // Handle form submission
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveExpense();
            modal.remove();
        });
        
        // Animate modal appearance
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }

    saveExpense() {
        const expenseData = {
            id: Date.now(),
            type: document.getElementById('expenseType').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            date: document.getElementById('expenseDate').value,
            vehicleNumber: document.getElementById('vehicleNumber').value,
            description: document.getElementById('expenseDescription').value,
            paymentMethod: document.getElementById('paymentMethod').value,
            createdAt: new Date().toISOString()
        };

        // Handle file upload
        const receiptFile = document.getElementById('expenseReceipt').files[0];
        if (receiptFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                expenseData.receipt = e.target.result;
                this.addExpenseToStorage(expenseData);
            };
            reader.readAsDataURL(receiptFile);
        } else {
            this.addExpenseToStorage(expenseData);
        }
    }

    addExpenseToStorage(expenseData) {
        this.expenses.push(expenseData);
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
        
        // Show success message
        this.showExpenseSuccessMessage();
        
        // Refresh expenses display
        this.refreshExpensesDisplay();
    }

    showExpenseSuccessMessage() {
        const message = document.createElement('div');
        message.className = 'success-toast';
        message.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-check-circle"></i>
                <span>Expense added successfully!</span>
            </div>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.opacity = '1';
            message.style.transform = 'translateY(0)';
        }, 100);
        
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateY(-100px)';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }

    refreshExpensesDisplay() {
        const expensesGrid = document.querySelector('.expenses-grid');
        if (!expensesGrid) return;
        
        // Clear existing expenses except static ones
        const existingExpenses = expensesGrid.querySelectorAll('.expense-card.dynamic');
        existingExpenses.forEach(card => card.remove());
        
        // Add recent expenses from storage
        const recentExpenses = this.expenses.slice(-6).reverse(); // Show last 6 expenses
        
        recentExpenses.forEach((expense, index) => {
            const expenseCard = document.createElement('div');
            expenseCard.className = 'expense-card dynamic slide-up';
            expenseCard.style.animationDelay = `${index * 0.1}s`;
            
            const typeIcon = this.getExpenseTypeIcon(expense.type);
            const formattedDate = new Date(expense.date).toLocaleDateString('en-IN');
            
            expenseCard.innerHTML = `
                <div class="expense-header">
                    <h3>${typeIcon} ${this.capitalizeFirst(expense.type)}</h3>
                    <span class="expense-amount">₹${expense.amount.toLocaleString('en-IN')}</span>
                </div>
                <div class="expense-details">
                    <p><i class="fas fa-calendar"></i> Date: ${formattedDate}</p>
                    ${expense.vehicleNumber ? `<p><i class="fas fa-truck"></i> Vehicle: ${expense.vehicleNumber}</p>` : ''}
                    <p><i class="fas fa-credit-card"></i> Payment: ${this.capitalizeFirst(expense.paymentMethod)}</p>
                    ${expense.description ? `<p><i class="fas fa-info-circle"></i> ${expense.description}</p>` : ''}
                </div>
                <div class="expense-actions">
                    <button class="btn-view-expense" onclick="viewExpense(${expense.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn-delete-expense" onclick="deleteExpense(${expense.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            
            expensesGrid.appendChild(expenseCard);
        });
    }

    getExpenseTypeIcon(type) {
        const icons = {
            fuel: '⛽',
            maintenance: '🔧',
            toll: '🛣️',
            driver: '👨‍💼',
            insurance: '🛡️',
            permit: '📋',
            parking: '🅿️',
            other: '📝'
        };
        return icons[type] || '📝';
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TransportBillingSystem();
});

// Add some interactive animations
document.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('stat-card')) {
        e.target.style.transform = 'translateY(-5px) scale(1.02)';
    }
});

document.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('stat-card')) {
        e.target.style.transform = 'translateY(0) scale(1)';
    }
});

// Add floating animation to buttons
document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
    btn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
    });
    
    btn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '';
    });
});

// Add ripple effect to buttons
function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add("ripple");

    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) {
        ripple.remove();
    }

    button.appendChild(circle);
}

// Add ripple effect styles
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Apply ripple effect to buttons
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', createRipple);
});

// Global functions for expense management
window.viewExpense = function(expenseId) {
    const expense = JSON.parse(localStorage.getItem('expenses') || '[]').find(e => e.id === expenseId);
    if (!expense) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    const typeIcon = {
        fuel: '⛽', maintenance: '🔧', toll: '🛣️', driver: '👨‍💼',
        insurance: '🛡️', permit: '📋', parking: '🅿️', other: '📝'
    }[expense.type] || '📝';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${typeIcon} Expense Details</h3>
                <button class="close-modal" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <div style="display: grid; gap: 15px;">
                    <div><strong>Type:</strong> ${expense.type.charAt(0).toUpperCase() + expense.type.slice(1)}</div>
                    <div><strong>Amount:</strong> ₹${expense.amount.toLocaleString('en-IN')}</div>
                    <div><strong>Date:</strong> ${new Date(expense.date).toLocaleDateString('en-IN')}</div>
                    ${expense.vehicleNumber ? `<div><strong>Vehicle:</strong> ${expense.vehicleNumber}</div>` : ''}
                    <div><strong>Payment Method:</strong> ${expense.paymentMethod.charAt(0).toUpperCase() + expense.paymentMethod.slice(1)}</div>
                    ${expense.description ? `<div><strong>Description:</strong> ${expense.description}</div>` : ''}
                    ${expense.receipt ? `<div><strong>Receipt:</strong><br><img src="${expense.receipt}" style="max-width: 100%; max-height: 200px; border-radius: 8px;"></div>` : ''}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-primary" onclick="this.closest('.modal').remove()">OK</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.style.opacity = '1', 10);
};

window.deleteExpense = function(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    let expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    expenses = expenses.filter(e => e.id !== expenseId);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    // Refresh display
    const system = new TransportBillingSystem();
    system.expenses = expenses;
    system.refreshExpensesDisplay();
    
    // Show success message
    const message = document.createElement('div');
    message.className = 'success-toast';
    message.style.background = 'linear-gradient(45deg, #dc3545, #c82333)';
    message.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-trash"></i>
            <span>Expense deleted successfully!</span>
        </div>
    `;
    
    document.body.appendChild(message);
    setTimeout(() => {
        message.style.opacity = '1';
        message.style.transform = 'translateY(0)';
    }, 100);
    
    setTimeout(() => {
        message.style.opacity = '0';
        message.style.transform = 'translateY(-100px)';
        setTimeout(() => message.remove(), 300);
    }, 3000);
};
