// orders.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { OrderService } from 'src/app/services/order.service';
import { AuthService } from 'src/app/services/auth.service';
import { Order, OrderItem, Address } from 'src/app/models/order';
import { CartService } from 'src/app/services/cart.service';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedStatus: string = 'all';
  searchTerm: string = '';
  isLoading: boolean = true;
  isGeneratingInvoice: { [orderId: number]: boolean } = {};
  currentUser: any;
  
  private destroy$ = new Subject<void>();

  statusFilters = [
    { value: 'all', label: 'All Orders' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.loadOrders();
    } else {
      this.isLoading = false;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders() {
    this.isLoading = true;
    this.orderService.getUserOrders(this.currentUser.username)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          this.orders = orders;
          this.filteredOrders = [...orders];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load your orders. Please try again.',
            confirmButtonColor: '#000'
          });
        }
      });
  }

  filterOrders() {
    this.filteredOrders = this.orders.filter(order => {
      const matchesStatus = this.selectedStatus === 'all' || 
        order.status === this.selectedStatus;
      
      const matchesSearch = this.searchTerm === '' || 
        order.orderNumber?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.id.toString().includes(this.searchTerm) ||
        order.items.some(item => 
          item.productName.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      
      return matchesStatus && matchesSearch;
    });
  }

  onStatusChange() {
    this.filterOrders();
  }

  onSearchChange() {
    this.filterOrders();
  }

  clearFilters(): void {
    this.selectedStatus = 'all';
    this.searchTerm = '';
    this.filterOrders();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge bg-warning';
      case 'CONFIRMED': return 'badge bg-info';
      case 'PROCESSING': return 'badge bg-primary';
      case 'SHIPPED': return 'badge bg-secondary';
      case 'DELIVERED': return 'badge bg-success';
      case 'CANCELLED': return 'badge bg-danger';
      default: return 'badge bg-warning';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING': return 'bi bi-clock';
      case 'CONFIRMED': return 'bi bi-check-circle';
      case 'PROCESSING': return 'bi bi-gear';
      case 'SHIPPED': return 'bi bi-truck';
      case 'DELIVERED': return 'bi bi-box-seam';
      case 'CANCELLED': return 'bi bi-x-circle';
      default: return 'bi bi-clock';
    }
  }

  getPaymentMethodIcon(method: string): string {
    switch (method?.toUpperCase()) {
      case 'COD': return 'bi bi-cash';
      case 'CREDIT_CARD': 
      case 'DEBIT_CARD': return 'bi bi-credit-card';
      case 'PAYPAL': return 'bi bi-paypal';
      case 'STRIPE': return 'bi bi-wallet';
      default: return 'bi bi-wallet';
    }
  }

  getPaymentMethodLabel(method: string): string {
    switch (method?.toUpperCase()) {
      case 'COD': return 'Cash on Delivery';
      case 'CREDIT_CARD': return 'Credit Card';
      case 'DEBIT_CARD': return 'Debit Card';
      case 'PAYPAL': return 'PayPal';
      case 'STRIPE': return 'Stripe';
      default: return method || 'Unknown';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'success':
        return 'badge bg-success';
      case 'pending':
      case 'processing':
        return 'badge bg-warning';
      case 'failed':
      case 'declined':
        return 'badge bg-danger';
      case 'refunded':
      case 'cancelled':
        return 'badge bg-secondary';
      default:
        return 'badge bg-warning';
    }
  }

  trackOrder(order: Order) {
    Swal.fire({
      title: 'Track Order',
      html: `
        <div class="tracking-info">
          <h4>Order #${order.orderNumber || order.id}</h4>
          <div class="tracking-steps">
            <div class="tracking-step ${['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'active' : ''}">
              <i class="bi bi-check-circle"></i>
              <span>Order Placed</span>
            </div>
            <div class="tracking-step ${['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'active' : ''}">
              <i class="bi bi-gear"></i>
              <span>Confirmed</span>
            </div>
            <div class="tracking-step ${['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'active' : ''}">
              <i class="bi bi-box-seam"></i>
              <span>Processing</span>
            </div>
            <div class="tracking-step ${['SHIPPED', 'DELIVERED'].includes(order.status) ? 'active' : ''}">
              <i class="bi bi-truck"></i>
              <span>Shipped</span>
            </div>
            <div class="tracking-step ${order.status === 'DELIVERED' ? 'active' : ''}">
              <i class="bi bi-house-check"></i>
              <span>Delivered</span>
            </div>
          </div>
          ${order.status === 'CANCELLED' ? '<p class="text-danger mt-3"><i class="bi bi-exclamation-triangle"></i> This order has been cancelled.</p>' : ''}
        </div>
      `,
      confirmButtonColor: '#000',
      confirmButtonText: 'Close'
    });
  }

  reorder(order: Order) {
    Swal.fire({
      title: 'Reorder Items?',
      text: 'Add all items from this order to your cart?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#000',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, add to cart',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        let addedCount = 0;
        
        order.items.forEach(item => {
          const cartItem = {
            id: item.productId,
            name: item.productName,
            price: item.pricePerItem,
            imageUrl: item.productImage,
            quantity: item.quantity,
            selectedColor: '',
            selectedSize: ''
          };
          
          this.cartService.addToCart(cartItem);
          addedCount++;
        });
        
        Swal.fire({
          title: 'Added to Cart!',
          text: `${addedCount} items from this order have been added to your cart.`,
          icon: 'success',
          confirmButtonColor: '#000'
        });
      }
    });
  }

  downloadInvoice(order: Order) {
    this.isGeneratingInvoice[order.id] = true;
    
    Swal.fire({
      title: 'Generating Invoice...',
      text: 'Please wait while we prepare your invoice.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.orderService.downloadInvoice(order.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pdfBlob: Blob) => {
          // Create a blob URL and trigger download
          const blobUrl = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `invoice-${order.orderNumber || order.id}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up
          URL.revokeObjectURL(blobUrl);
          
          this.isGeneratingInvoice[order.id] = false;
          Swal.close();
          
          Swal.fire({
            icon: 'success',
            title: 'Invoice Downloaded!',
            text: 'Your invoice has been downloaded successfully.',
            confirmButtonColor: '#000'
          });
        },
        error: (error) => {
          console.error('Error downloading invoice:', error);
          this.isGeneratingInvoice[order.id] = false;
          Swal.close();
          
          let errorMessage = 'Failed to download invoice. Please try again.';
          
          if (error.status === 404) {
            errorMessage = 'Invoice not found for this order.';
          } else if (error.status === 500) {
            errorMessage = 'Server error while generating invoice. Please try again later.';
          } else if (error.status === 0) {
            errorMessage = 'Cannot connect to server. Please check your connection.';
          }
          
          Swal.fire({
            icon: 'error',
            title: 'Download Failed',
            text: errorMessage,
            confirmButtonColor: '#000'
          });
        }
      });
  }

  cancelOrder(order: Order): void {
    const statusMap: { [key: string]: string } = {
      'DELIVERED': 'delivered',
      'CANCELLED': 'already cancelled', 
      'SHIPPED': 'shipped and cannot be cancelled',
      'PROCESSING': 'in processing and cannot be cancelled',
      'CONFIRMED': 'confirmed and may not be cancellable'
    };

    if (['DELIVERED', 'CANCELLED', 'SHIPPED', 'PROCESSING'].includes(order.status)) {
      const statusMessage = statusMap[order.status] || 'processed';
      
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Cancel Order',
        text: `This order has been ${statusMessage}. Please contact customer support for assistance.`,
        confirmButtonColor: '#0d6efd'
      });
      return;
    }

    Swal.fire({
      title: 'Cancel Order?',
      html: `
        <div class="text-start">
          <p class="mb-2">Are you sure you want to cancel this order?</p>
          <div class="alert alert-warning mb-0">
            <small>
              <i class="bi bi-exclamation-triangle me-1"></i>
              This action cannot be undone. Any payment will be refunded according to our policy.
            </small>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel order',
      cancelButtonText: 'Keep order',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.performOrderCancellation(order);
      }
    });
  }

  private performOrderCancellation(order: Order): void {
    Swal.fire({
      title: 'Cancelling Order...',
      text: 'Please wait while we process your cancellation request.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.orderService.updateOrderStatus(order.id, 'CANCELLED')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedOrder) => {
          const index = this.orders.findIndex(o => o.id === order.id);
          if (index !== -1) {
            this.orders[index] = updatedOrder;
            this.filterOrders();
          }

          Swal.fire({
            title: 'Order Cancelled!',
            text: 'Your order has been cancelled successfully. Refund will be processed within 5-7 business days.',
            icon: 'success',
            confirmButtonColor: '#0d6efd'
          });
        },
        error: (error) => {
          console.error('Error cancelling order:', error);
          
          let errorMessage = 'Failed to cancel order. Please try again later.';
          if (error.status === 400) {
            errorMessage = 'This order can no longer be cancelled. Please contact customer support.';
          } else if (error.status === 404) {
            errorMessage = 'Order not found. It may have been already cancelled.';
          }

          Swal.fire({
            icon: 'error',
            title: 'Cancellation Failed',
            text: errorMessage,
            confirmButtonColor: '#0d6efd'
          });
        }
      });
  }

  getTotalItems(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getOrdersCountByStatus(statuses: string[]): number {
    return this.orders.filter(order => statuses.includes(order.status)).length;
  }

  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getShippingAddress(order: Order): string {
    if (!order.shippingAddress) return 'Address not available';
    
    const addr = order.shippingAddress;
    return `${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`;
  }

  getRecipientName(order: Order): string {
    return order.shippingAddress?.recipientName || 'Unknown Recipient';
  }
}