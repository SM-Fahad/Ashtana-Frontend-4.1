import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { Order, OrderItem } from '../../models/order';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
export class OrderDetailsComponent implements OnInit {
  order: Order | null = null;
  loading = false;
  orderId: number | null = null;

  // Status tracking
  statusSteps = [
    { status: 'PENDING', label: 'Order Placed', description: 'Your order has been received' },
    { status: 'CONFIRMED', label: 'Confirmed', description: 'Order has been confirmed' },
    { status: 'PROCESSING', label: 'Processing', description: 'Preparing your order' },
    { status: 'SHIPPED', label: 'Shipped', description: 'Your order is on the way' },
    { status: 'DELIVERED', label: 'Delivered', description: 'Order has been delivered' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.loadOrder();
  }

  loadOrder(): void {
    this.loading = true;
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));

    if (!this.orderId) {
      this.showError('Invalid Order', 'Order ID is missing.');
      return;
    }

    this.orderService.getOrder(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading order:', error);
        this.showError('Order Not Found', 'The requested order could not be found.');
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'PROCESSING': 'bg-indigo-100 text-indigo-800',
      'SHIPPED': 'bg-purple-100 text-purple-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return `px-3 py-1 rounded-full text-sm font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`;
  }

  getPaymentStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDING': 'text-yellow-600',
      'COMPLETED': 'text-green-600',
      'FAILED': 'text-red-600',
      'REFUNDED': 'text-gray-600',
      'PROCESSING': 'text-blue-600'
    };
    return colors[status] || 'text-gray-600';
  }

  getPaymentMethodName(method: string): string {
    const paymentMethods: { [key: string]: string } = {
      'COD': 'Cash on Delivery',
      'CREDIT_CARD': 'Credit Card',
      'DEBIT_CARD': 'Debit Card',
      'PAYPAL': 'PayPal',
      'BANK_TRANSFER': 'Bank Transfer'
    };
    return paymentMethods[method] || method;
  }

  getPaymentMethodIcon(method: string): string {
    const icons: { [key: string]: string } = {
      'COD': '💵',
      'CREDIT_CARD': '💳',
      'DEBIT_CARD': '💳',
      'PAYPAL': '🔵',
      'BANK_TRANSFER': '🏦'
    };
    return icons[method] || '💰';
  }

  getStatusStepIndex(status: string): number {
    return this.statusSteps.findIndex(step => step.status === status);
  }

  isStepCompleted(stepStatus: string): boolean {
    if (!this.order) return false;
    const currentIndex = this.getStatusStepIndex(this.order.status);
    const stepIndex = this.getStatusStepIndex(stepStatus);
    return stepIndex <= currentIndex;
  }

  isCurrentStep(stepStatus: string): boolean {
    return this.order?.status === stepStatus;
  }

  getProgressPercentage(): number {
    if (!this.order) return 0;
    const currentIndex = this.getStatusStepIndex(this.order.status);
    return ((currentIndex + 1) / this.statusSteps.length) * 100;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

 // Add this property to your component
currentDate: string = new Date().toISOString();

printOrder(): void {
  // Update the current date for the receipt
  this.currentDate = new Date().toISOString();
  
  // Small delay to ensure the receipt section is rendered
  setTimeout(() => {
    window.print();
  }, 100);
}



  contactSupport(): void {
    Swal.fire({
      title: 'Contact Support',
      html: `
        <div class="text-left space-y-3">
          <p><strong>Email:</strong> support@yourstore.com</p>
          <p><strong>Phone:</strong> +1 (555) 123-4567</p>
          <p><strong>Hours:</strong> Mon-Fri, 9AM-6PM EST</p>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#3b82f6'
    });
  }

  private showError(title: string, text: string): void {
    Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonColor: '#ef4444'
    }).then(() => {
      this.router.navigate(['/orders']);
    });
  }
}