// import { Component, OnInit } from '@angular/core';
// import { CartService } from 'src/app/services/cart.service';
// import Swal from 'sweetalert2';
// import jsPDF from 'jspdf';

// @Component({
//   selector: 'app-orders',
//   templateUrl: './orders.component.html',
//   styleUrls: ['./orders.component.css']
// })
// export class OrdersComponent implements OnInit {
//   orders: any[] = [];
//   filteredOrders: any[] = [];
//   selectedStatus: string = 'all';
//   searchTerm: string = '';
//   isLoading: boolean = true;
//   isGeneratingInvoice: { [orderId: string]: boolean } = {};

//   statusFilters = [
//     { value: 'all', label: 'All Orders' },
//     { value: 'confirmed', label: 'Confirmed' },
//     { value: 'processing', label: 'Processing' },
//     { value: 'shipped', label: 'Shipped' },
//     { value: 'delivered', label: 'Delivered' },
//     { value: 'cancelled', label: 'Cancelled' }
//   ];

//   constructor(private cartService: CartService) {}

//   ngOnInit() {
//     this.loadOrders();
//   }

//   loadOrders() {
//     this.isLoading = true;
//     // Simulate API call delay
//     setTimeout(() => {
//       this.orders = this.cartService.getOrders();
//       this.filteredOrders = [...this.orders];
//       this.isLoading = false;
//     }, 1000);
//   }

//   filterOrders() {
//     this.filteredOrders = this.orders.filter(order => {
//       const matchesStatus = this.selectedStatus === 'all' || order.status === this.selectedStatus;
//       const matchesSearch = this.searchTerm === '' || 
//         order.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
//         (order.customer.name && order.customer.name.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
//         (order.customer.firstName && order.customer.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
//       return matchesStatus && matchesSearch;
//     });
//   }

//   onStatusChange() {
//     this.filterOrders();
//   }

//   onSearchChange() {
//     this.filterOrders();
//   }

//   getStatusBadgeClass(status: string): string {
//     switch (status) {
//       case 'confirmed': return 'status-confirmed';
//       case 'processing': return 'status-processing';
//       case 'shipped': return 'status-shipped';
//       case 'delivered': return 'status-delivered';
//       case 'cancelled': return 'status-cancelled';
//       default: return 'status-confirmed';
//     }
//   }

//   getStatusIcon(status: string): string {
//     switch (status) {
//       case 'confirmed': return 'bi bi-check-circle';
//       case 'processing': return 'bi bi-gear';
//       case 'shipped': return 'bi bi-truck';
//       case 'delivered': return 'bi bi-box-seam';
//       case 'cancelled': return 'bi bi-x-circle';
//       default: return 'bi bi-check-circle';
//     }
//   }

//   getPaymentMethodIcon(method: string): string {
//     switch (method) {
//       case 'card': return 'bi bi-credit-card';
//       case 'paypal': return 'bi bi-paypal';
//       case 'cod': return 'bi bi-cash';
//       default: return 'bi bi-wallet';
//     }
//   }

//   deleteOrder(orderId: string) {
//     Swal.fire({
//       title: 'Delete Order?',
//       text: 'This action cannot be undone. Are you sure you want to delete this order?',
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonColor: '#d33',
//       cancelButtonColor: '#3085d6',
//       confirmButtonText: 'Yes, delete it!',
//       cancelButtonText: 'Cancel',
//       reverseButtons: true
//     }).then((result) => {
//       if (result.isConfirmed) {
//         this.cartService.deleteOrder(orderId);
//         this.loadOrders();
        
//         Swal.fire(
//           'Deleted!',
//           'Your order has been deleted.',
//           'success'
//         );
//       }
//     });
//   }

//   trackOrder(order: any) {
//     Swal.fire({
//       title: 'Track Order',
//       html: `
//         <div class="tracking-info">
//           <h4>Order #${order.id}</h4>
//           <div class="tracking-steps">
//             <div class="tracking-step ${order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' ? 'active' : ''}">
//               <i class="bi bi-check-circle"></i>
//               <span>Order Confirmed</span>
//             </div>
//             <div class="tracking-step ${order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' ? 'active' : ''}">
//               <i class="bi bi-gear"></i>
//               <span>Processing</span>
//             </div>
//             <div class="tracking-step ${order.status === 'shipped' || order.status === 'delivered' ? 'active' : ''}">
//               <i class="bi bi-truck"></i>
//               <span>Shipped</span>
//             </div>
//             <div class="tracking-step ${order.status === 'delivered' ? 'active' : ''}">
//               <i class="bi bi-box-seam"></i>
//               <span>Delivered</span>
//             </div>
//           </div>
//         </div>
//       `,
//       confirmButtonColor: '#000',
//       confirmButtonText: 'Close'
//     });
//   }

//   reorder(order: any) {
//     Swal.fire({
//       title: 'Reorder Items?',
//       text: 'Add all items from this order to your cart?',
//       icon: 'question',
//       showCancelButton: true,
//       confirmButtonColor: '#000',
//       cancelButtonColor: '#6c757d',
//       confirmButtonText: 'Yes, add to cart',
//       cancelButtonText: 'Cancel'
//     }).then((result) => {
//       if (result.isConfirmed) {
//         order.items.forEach((item: any) => {
//           this.cartService.addToCart(item);
//         });
        
//         Swal.fire({
//           title: 'Added to Cart!',
//           text: 'All items from this order have been added to your cart.',
//           icon: 'success',
//           confirmButtonColor: '#000'
//         });
//       }
//     });
//   }

//   downloadInvoice(order: any) {
//     this.isGeneratingInvoice[order.id] = true;
    
//     Swal.fire({
//       title: 'Generating Invoice...',
//       text: 'Please wait while we prepare your invoice.',
//       allowOutsideClick: false,
//       didOpen: () => {
//         Swal.showLoading();
//       }
//     });

//     setTimeout(() => {
//       const pdf = new jsPDF('p', 'mm', 'a4');
//       const pageWidth = pdf.internal.pageSize.getWidth();
      
//       // Add company header
//       pdf.setFillColor(44, 62, 80);
//       pdf.rect(0, 0, pageWidth, 30, 'F');
      
//       pdf.setTextColor(255, 255, 255);
//       pdf.setFontSize(24);
//       pdf.text('ASHTANA', pageWidth / 2, 18, { align: 'center' });
//       pdf.setFontSize(12);
//       pdf.text('INVOICE', pageWidth / 2, 25, { align: 'center' });
      
//       // Order details
//       pdf.setTextColor(0, 0, 0);
//       pdf.setFontSize(10);
//       pdf.text(`Order ID: ${order.id}`, 20, 45);
//       pdf.text(`Date: ${this.formatDateForInvoice(order.date)}`, 20, 52);
//       pdf.text(`Payment Method: ${this.getOrderPaymentMethodLabel(order.paymentMethod)}`, 20, 59);
//       pdf.text(`Status: ${order.status || 'confirmed'}`, 20, 66);
      
//       // Customer information
//       pdf.setFontSize(12);
//       pdf.text('BILL TO:', 20, 80);
//       pdf.setFontSize(10);
//       pdf.text(`${order.customer.firstName} ${order.customer.lastName}`, 20, 87);
//       pdf.text(order.customer.email, 20, 94);
//       pdf.text(order.customer.phone, 20, 101);
//       pdf.text(order.customer.address, 20, 108);
//       pdf.text(`${order.customer.city}, ${order.customer.province} ${order.customer.postalCode}`, 20, 115);
      
//       // Items table header
//       pdf.setFillColor(240, 240, 240);
//       pdf.rect(20, 130, pageWidth - 40, 10, 'F');
//       pdf.setTextColor(0, 0, 0);
//       pdf.setFontSize(10);
//       pdf.text('Item', 22, 137);
//       pdf.text('Price', 120, 137);
//       pdf.text('Qty', 150, 137);
//       pdf.text('Total', 170, 137);
      
//       // Items
//       let yPosition = 145;
//       order.items.forEach((item: any, index: number) => {
//         if (yPosition > 250) {
//           pdf.addPage();
//           yPosition = 20;
//         }
        
//         pdf.text(item.name.substring(0, 40), 22, yPosition);
//         pdf.text(`$${item.price.toFixed(2)}`, 120, yPosition);
//         pdf.text(item.quantity.toString(), 150, yPosition);
//         pdf.text(`$${(item.price * item.quantity).toFixed(2)}`, 170, yPosition);
//         yPosition += 8;
        
//         // Variants
//         if (item.selectedColor || item.selectedSize) {
//           pdf.setFontSize(8);
//           pdf.setTextColor(100, 100, 100);
//           const variants = `${item.selectedColor || ''} ${item.selectedSize ? 'Size: ' + item.selectedSize : ''}`.trim();
//           pdf.text(variants, 22, yPosition);
//           yPosition += 5;
//           pdf.setFontSize(10);
//           pdf.setTextColor(0, 0, 0);
//         }
//         yPosition += 4;
//       });
      
//       // Totals
//       yPosition = Math.max(yPosition + 10, 260);
//       pdf.setFontSize(11);
//       pdf.text('Subtotal:', 140, yPosition);
//       pdf.text(`$${order.subtotal.toFixed(2)}`, 170, yPosition);
//       yPosition += 8;
      
//       pdf.text('Shipping:', 140, yPosition);
//       pdf.text(order.shipping === 0 ? 'FREE' : `$${order.shipping.toFixed(2)}`, 170, yPosition);
//       yPosition += 8;
      
//       pdf.text('GST (5%):', 140, yPosition);
//       pdf.text(`$${order.gst.toFixed(2)}`, 170, yPosition);
//       yPosition += 8;
      
//       pdf.text('PST (7%):', 140, yPosition);
//       pdf.text(`$${order.pst.toFixed(2)}`, 170, yPosition);
//       yPosition += 8;
      
//       if (order.discount > 0) {
//         pdf.text('Discount:', 140, yPosition);
//         pdf.text(`-$${order.discount.toFixed(2)}`, 170, yPosition);
//         yPosition += 8;
//       }
      
//       pdf.setFontSize(12);
//       pdf.text('TOTAL:', 140, yPosition);
//       pdf.text(`$${order.total.toFixed(2)}`, 170, yPosition);
      
//       // Footer
//       pdf.setFontSize(8);
//       pdf.setTextColor(100, 100, 100);
//       pdf.text('Thank you for your purchase!', pageWidth / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });
//       pdf.text('For any inquiries, please contact support@ashtana.com', pageWidth / 2, pdf.internal.pageSize.getHeight() - 5, { align: 'center' });
      
//       // Save the PDF
//       pdf.save(`invoice-${order.id}.pdf`);
      
//       this.isGeneratingInvoice[order.id] = false;
//       Swal.close();
      
//       Swal.fire({
//         icon: 'success',
//         title: 'Invoice Downloaded!',
//         text: 'Your invoice has been downloaded successfully.',
//         confirmButtonColor: '#000'
//       });
//     }, 1000);
//   }

//   getOrderPaymentMethodLabel(paymentMethod: string): string {
//     const methods: { [key: string]: string } = {
//       'cod': 'Cash on Delivery (COD)',
//       'card': 'Credit/Debit Card',
//       'paypal': 'PayPal'
//     };
//     return methods[paymentMethod] || 'Unknown';
//   }

//   formatDateForInvoice(dateString: string): string {
//     try {
//       return new Date(dateString).toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//       });
//     } catch (error) {
//       return 'Invalid date';
//     }
//   }

//   getTotalItems(order: any): number {
//     return order.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
//   }

//   formatDate(dateString: string): string {
//     try {
//       return new Date(dateString).toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     } catch (error) {
//       return 'Invalid date';
//     }
//   }

//   getCustomerName(order: any): string {
//     if (order.customer.firstName && order.customer.lastName) {
//       return `${order.customer.firstName} ${order.customer.lastName}`;
//     } else if (order.customer.name) {
//       return order.customer.name;
//     }
//     return 'Unknown Customer';
//   }

//   getCustomerAddress(order: any): string {
//     if (order.customer.address && order.customer.city && order.customer.province) {
//       return `${order.customer.address}, ${order.customer.city}, ${order.customer.province} ${order.customer.postalCode || ''}`;
//     } else if (order.customer.address) {
//       return order.customer.address;
//     }
//     return 'Address not available';
//   }
// }

// orders.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { OrderService } from 'src/app/services/order.service';
import { AuthService } from 'src/app/services/auth.service';
import { Order, OrderItem, Address } from 'src/app/models/order';
import { CartService } from 'src/app/services/cart.service';
import Swal from 'sweetalert2';
// import { saveAs } from 'file-saver';
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

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'CONFIRMED': return 'status-confirmed';
      case 'PROCESSING': return 'status-processing';
      case 'SHIPPED': return 'status-shipped';
      case 'DELIVERED': return 'status-delivered';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-pending';
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
            selectedColor: '', // You might want to add these to your OrderItem interface
            selectedSize: ''   // You might want to add these to your OrderItem interface
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
        next: (blob) => {
          const fileName = `invoice-${order.orderNumber || order.id}.pdf`;
          // saveAs(blob, fileName);
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
          
          Swal.fire({
            icon: 'error',
            title: 'Download Failed',
            text: 'Failed to download invoice. Please try again.',
            confirmButtonColor: '#000'
          });
        }
      });
  }

  // cancelOrder(order: Order) {
  //   if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
  //     Swal.fire({
  //       icon: 'warning',
  //       title: 'Cannot Cancel Order',
  //       text: `This order cannot be cancelled because it's already ${order.status.toLowerCase()}.`,
  //       confirmButtonColor: '#000'
  //     });
  //     return;
  //   }

  //   Swal.fire({
  //     title: 'Cancel Order?',
  //     text: 'Are you sure you want to cancel this order? This action cannot be undone.',
  //     icon: 'warning',
  //     showCancelButton: true,
  //     confirmButtonColor: '#d33',
  //     cancelButtonColor: '#3085d6',
  //     confirmButtonText: 'Yes, cancel it!',
  //     cancelButtonText: 'Keep Order',
  //     reverseButtons: true
  //   }).then((result) => {
  //     if (result.isConfirmed) {
  //       this.orderService.updateOrderStatus(order.id, 'CANCELLED')
  //         .pipe(takeUntil(this.destroy$))
  //         .subscribe({
  //           next: (updatedOrder) => {
  //             // Update local order
  //             const index = this.orders.findIndex(o => o.id === order.id);
  //             if (index !== -1) {
  //               this.orders[index] = updatedOrder;
  //               this.filterOrders();
  //             }
              
  //             Swal.fire({
  //               title: 'Order Cancelled!',
  //               text: 'Your order has been cancelled successfully.',
  //               icon: 'success',
  //               confirmButtonColor: '#000'
  //             });
  //           },
  //           error: (error) => {
  //             console.error('Error cancelling order:', error);
  //             Swal.fire({
  //               icon: 'error',
  //               title: 'Cancellation Failed',
  //               text: 'Failed to cancel order. Please try again.',
  //               confirmButtonColor: '#000'
  //             });
  //           }
  //         });
  //     }
  //   });
  // }

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

  // Add these methods to your orders.component.ts

// Clear filters method
clearFilters(): void {
  this.selectedStatus = 'all';
  this.searchTerm = '';
  this.filterOrders();
}

// Payment status badge class
getPaymentStatusClass(status: string): string {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'paid':
    case 'success':
      return 'completed';
    case 'pending':
    case 'processing':
      return 'pending';
    case 'failed':
    case 'declined':
      return 'failed';
    case 'refunded':
    case 'cancelled':
      return 'refunded';
    default:
      return 'pending';
  }
}

// Enhanced cancel order method
// Replace the cancelOrder method with this corrected version
cancelOrder(order: Order): void {
  // Define statusMap with type safety
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

  // Use your OrderService method
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
}