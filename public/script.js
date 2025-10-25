// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set default dates
    setDefaultDates();
    
    // Initialize event listeners
    setupEventListeners();
    
    // Initialize first item row
    updateItemRow(0);
    
    // Update preview initially
    updatePreview();
}

// Set default dates for invoice date and due date
function setDefaultDates() {
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 30);
    
    document.getElementById('invoiceDate').value = formatDate(today);
    document.getElementById('dueDate').value = formatDate(dueDate);
    
    // Set default invoice number
    document.getElementById('invoiceNumber').value = generateInvoiceNumber();
}

// Format date as MM/DD/YYYY for display (US format)
function formatDateUS(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
}

// Format date as YYYY-MM-DD for input fields
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Generate a simple invoice number
function generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}${day}-${random}`;
}

// Set up all event listeners
function setupEventListeners() {
    // Mobile navigation
    setupMobileNavigation();
    
    // Add item button
    document.getElementById('addItem').addEventListener('click', addItemRow);
    
    // Reset form
    document.getElementById('resetForm').addEventListener('click', resetForm);
    
    // Download PDF
    document.getElementById('downloadPDF').addEventListener('click', downloadPDF);
    
    // Logo upload
    document.getElementById('logoUpload').addEventListener('change', handleLogoUpload);
    
    // Form input changes (using event delegation for dynamic content)
    document.getElementById('invoiceForm').addEventListener('input', function(e) {
        if (e.target.matches('input, textarea, select')) {
            updatePreview();
        }
    });
    
    // Tax rate change
    document.getElementById('taxRate').addEventListener('input', function() {
        updateTotals();
        updatePreview();
    });
    
    // Items container event delegation for dynamic item rows
    document.getElementById('itemsContainer').addEventListener('input', function(e) {
        if (e.target.matches('.item-name, .item-quantity, .item-price')) {
            const itemRow = e.target.closest('.item-row');
            const index = parseInt(itemRow.dataset.index);
            updateItemRow(index);
            updatePreview();
        }
    });
    
    // Remove item buttons
    document.getElementById('itemsContainer').addEventListener('click', function(e) {
        if (e.target.matches('.remove-item') && !e.target.disabled) {
            const itemRow = e.target.closest('.item-row');
            removeItemRow(parseInt(itemRow.dataset.index));
            updatePreview();
        }
    });
}

// Mobile Navigation Setup
function setupMobileNavigation() {
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const mobileNavClose = document.querySelector('.mobile-nav-close');
    const mobileNavMenu = document.querySelector('.mobile-nav-menu');
    const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
    const navLinks = document.querySelectorAll('.mobile-nav-menu .nav-link');

    // Toggle mobile menu
    function toggleMobileMenu() {
        mobileNavMenu.classList.toggle('active');
        mobileNavOverlay.classList.toggle('active');
        document.body.style.overflow = mobileNavMenu.classList.contains('active') ? 'hidden' : '';
    }

    // Close mobile menu
    function closeMobileMenu() {
        mobileNavMenu.classList.remove('active');
        mobileNavOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Event listeners
    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', toggleMobileMenu);
    }

    if (mobileNavClose) {
        mobileNavClose.addEventListener('click', closeMobileMenu);
    }

    if (mobileNavOverlay) {
        mobileNavOverlay.addEventListener('click', closeMobileMenu);
    }

    // Close menu when clicking on nav links
    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });

    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileNavMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });
}



// Add a new item row
function addItemRow() {
    const itemsContainer = document.getElementById('itemsContainer');
    const itemCount = itemsContainer.children.length;
    const newIndex = itemCount;
    
    const newItemRow = document.createElement('div');
    newItemRow.className = 'item-row fade-in';
    newItemRow.dataset.index = newIndex;
    newItemRow.innerHTML = `
        <input type="text" class="item-name" placeholder="description">
        <input type="number" class="item-quantity" placeholder="Qty" min="1" value="1">
        <input type="number" class="item-price" placeholder="Price" min="0" step="0.01">
        <span class="item-total">0.00</span>
        <button type="button" class="remove-item">×</button>
    `;
    
    itemsContainer.appendChild(newItemRow);
    
    // Enable remove buttons if there's more than one item
    updateRemoveButtons();
    
    // Focus on the new item name field
    newItemRow.querySelector('.item-name').focus();
}

// Remove an item row
function removeItemRow(index) {
    const itemsContainer = document.getElementById('itemsContainer');
    const itemRow = itemsContainer.querySelector(`[data-index="${index}"]`);
    
    if (itemsContainer.children.length > 1) {
        itemRow.remove();
        
        // Re-index remaining items
        const remainingRows = itemsContainer.querySelectorAll('.item-row');
        remainingRows.forEach((row, newIndex) => {
            row.dataset.index = newIndex;
        });
        
        updateRemoveButtons();
        updateTotals();
    }
}

// Update remove buttons state (disable if only one item)
function updateRemoveButtons() {
    const itemsContainer = document.getElementById('itemsContainer');
    const removeButtons = itemsContainer.querySelectorAll('.remove-item');
    const hasMultipleItems = itemsContainer.children.length > 1;
    
    removeButtons.forEach(button => {
        button.disabled = !hasMultipleItems;
    });
}

// Update individual item row calculations
function updateItemRow(index) {
    const itemRow = document.querySelector(`[data-index="${index}"]`);
    const quantity = parseFloat(itemRow.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(itemRow.querySelector('.item-price').value) || 0;
    const total = quantity * price;
    
    itemRow.querySelector('.item-total').textContent = formatCurrency(total);
    
    updateTotals();
}

// Update all totals (subtotal, tax, grand total)
function updateTotals() {
    const itemsContainer = document.getElementById('itemsContainer');
    const itemRows = itemsContainer.querySelectorAll('.item-row');
    
    let subtotal = 0;
    
    itemRows.forEach(row => {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        subtotal += quantity * price;
    });
    
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const grandTotal = subtotal + taxAmount;
    
    // Update form totals
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('taxAmount').textContent = formatCurrency(taxAmount);
    document.getElementById('grandTotal').textContent = formatCurrency(grandTotal);
    
    return { subtotal, taxAmount, grandTotal, taxRate };
}

// Format currency with 2 decimal places
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Update the preview section in real-time
function updatePreview() {
    // Update basic invoice info
    document.getElementById('previewNumber').textContent = 
        document.getElementById('invoiceNumber').value || '';
    document.getElementById('previewDate').textContent = 
        formatDateUS(document.getElementById('invoiceDate').value) || '';
    document.getElementById('previewDueDate').textContent = 
        formatDateUS(document.getElementById('dueDate').value) || '';
    
    // Update seller info - hide entire line if no value
    togglePreviewLine('previewSellerName', document.getElementById('sellerName').value.trim());
    togglePreviewLine('previewSellerAddress', document.getElementById('sellerAddress').value.trim());
    togglePreviewLine('previewSellerPhone', document.getElementById('sellerPhone').value.trim());
    togglePreviewLine('previewSellerTaxId', document.getElementById('sellerTaxId').value.trim());
    
    // Update buyer info - hide entire line if no value
    togglePreviewLine('previewBuyerName', document.getElementById('buyerName').value.trim());
    togglePreviewLine('previewBuyerAddress', document.getElementById('buyerAddress').value.trim());
    togglePreviewLine('previewBuyerPhone', document.getElementById('buyerPhone').value.trim());
    togglePreviewLine('previewBuyerTaxId', document.getElementById('buyerTaxId').value.trim());
    
    // Update items in preview
    updatePreviewItems();
    
    // Update totals in preview - hide entire section if all totals are zero
    const totals = updateTotals();
    const previewTotalsSection = document.querySelector('.preview-totals');
    
    if (totals.subtotal === 0 && totals.taxAmount === 0 && totals.grandTotal === 0) {
        previewTotalsSection.style.display = 'none';
    } else {
        previewTotalsSection.style.display = 'block';
        document.getElementById('previewSubtotal').textContent = formatCurrency(totals.subtotal);
        document.getElementById('previewTaxRate').textContent = `${totals.taxRate}%`;
        document.getElementById('previewTaxAmount').textContent = formatCurrency(totals.taxAmount);
        document.getElementById('previewGrandTotal').textContent = formatCurrency(totals.grandTotal);
    }
    
    // Update notes - hide entire line if no value
    togglePreviewLine('previewNotes', document.getElementById('notes').value.trim());
}

// Helper function to show/hide entire preview line based on content
function togglePreviewLine(elementId, value) {
    const element = document.getElementById(elementId);
    const parentParagraph = element.parentElement;
    
    if (value) {
        element.textContent = value;
        parentParagraph.style.display = 'block';
    } else {
        element.textContent = '';
        parentParagraph.style.display = 'none';
    }
}

// Handle logo upload
function handleLogoUpload(event) {
    const file = event.target.files[0];
    const fileChosen = document.getElementById('fileChosen');
    const fileUploadLabel = document.querySelector('.file-upload-label');
    
    if (file) {
        fileChosen.textContent = file.name;
        fileUploadLabel.textContent = 'Change File';
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewLogo = document.getElementById('previewLogo');
            previewLogo.src = e.target.result;
            previewLogo.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        fileChosen.textContent = 'No file chosen';
        fileUploadLabel.textContent = 'Choose File';
        const previewLogo = document.getElementById('previewLogo');
        previewLogo.style.display = 'none';
    }
}

// Update the items table in the preview
function updatePreviewItems() {
    const previewItemsBody = document.getElementById('previewItemsBody');
    const itemsContainer = document.getElementById('itemsContainer');
    const itemRows = itemsContainer.querySelectorAll('.item-row');
    const previewItemsSection = document.querySelector('.preview-items');
    
    // Clear current items
    previewItemsBody.innerHTML = '';
    
    let hasValidItems = false;
    
    // Check if there are any valid items
    itemRows.forEach(row => {
        const name = row.querySelector('.item-name').value;
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        
        if (name && price > 0) {
            hasValidItems = true;
            const total = quantity * price;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${name}</td>
                <td>${quantity}</td>
                <td>${formatCurrency(price)}</td>
                <td>${formatCurrency(total)}</td>
            `;
            previewItemsBody.appendChild(tr);
        }
    });
    
    // Show or hide the entire items section based on whether there are valid items
    if (hasValidItems) {
        previewItemsSection.style.display = 'block';
    } else {
        previewItemsSection.style.display = 'none';
    }
}

// Reset the entire form
function resetForm() {
    if (confirm('Are you sure you want to reset all content? This will clear all entered information.')) {
        document.getElementById('invoiceForm').reset();
        setDefaultDates();
        
        // Reset items to one row
        const itemsContainer = document.getElementById('itemsContainer');
        itemsContainer.innerHTML = `
            <div class="item-row" data-index="0">
                <input type="text" class="item-name" placeholder="Item description">
                <input type="number" class="item-quantity" placeholder="Qty" min="1" value="1">
                <input type="number" class="item-price" placeholder="Price" min="0" step="0.01">
                <span class="item-total">0.00</span>
                <button type="button" class="remove-item" disabled>×</button>
            </div>
        `;
        
        updatePreview();
    }
}

// Check if PDF libraries are loaded
function arePDFLibrariesLoaded() {
    return window.jspdf && window.html2canvas;
}

// Load PDF libraries dynamically when needed
function loadPDFLibraries() {
    return new Promise((resolve, reject) => {
        if (arePDFLibrariesLoaded()) {
            resolve();
            return;
        }

        const scripts = [
            'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
        ];

        let loadedCount = 0;
        
        scripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                loadedCount++;
                if (loadedCount === scripts.length) {
                    resolve();
                }
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    });
}

// Download invoice as PDF
function downloadPDF() {
    const downloadBtn = document.getElementById('downloadPDF');
    const originalText = downloadBtn.textContent;
    
    // Show loading state
    downloadBtn.textContent = 'Loading libraries...';
    downloadBtn.disabled = true;
    
    loadPDFLibraries()
        .then(() => {
            downloadBtn.textContent = 'Generating PDF...';
            
            // Use html2canvas to capture the preview
            return html2canvas(document.getElementById('invoicePreview'), {
                scale: 2, // Higher quality
                useCORS: true,
                logging: false
            });
        })
        .then(canvas => {
            // Create PDF using jsPDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // Add the canvas image to PDF
            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 10;
            
            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            
            // Generate filename
            const invoiceNumber = document.getElementById('invoiceNumber').value || 'invoice';
            const buyerName = document.getElementById('buyerName').value || 'client';
            const filename = `${invoiceNumber}_${buyerName}.pdf`.replace(/[^a-zA-Z0-9_-]/g, '_');
            
            // Download the PDF
            pdf.save(filename);
            
            // Restore button state
            downloadBtn.textContent = originalText;
            downloadBtn.disabled = false;
        })
        .catch(error => {
            console.error('PDF generation error:', error);
            alert('PDF generation failed. Please try again or check your browser support.');
            downloadBtn.textContent = originalText;
            downloadBtn.disabled = false;
        });
}



// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl + Enter to download PDF
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        downloadPDF();
    }
    
    // Ctrl + N to add new item
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        addItemRow();
    }
    
    // Escape to reset form
    if (e.key === 'Escape') {
        e.preventDefault();
        resetForm();
    }
});

// Add service worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            console.log('ServiceWorker registration successful');
        }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
