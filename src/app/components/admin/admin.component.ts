// admin.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from 'src/app/services/product.service';
import { OrderService } from 'src/app/services/order.service';
import { AuthService } from 'src/app/services/auth.service';
import { ProductResponseDTO } from 'src/app/models/products';
import { Order } from 'src/app/models/order';
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef;
  @ViewChild('orderStatusChart') orderStatusChartRef!: ElementRef;

  products: ProductResponseDTO[] = [];
  allOrders: Order[] = [];
  recentOrders: Order[] = [];
  
  // Stats
  totalRevenue = 0;
  totalOrders = 0;
  totalProducts = 0;
  totalCustomers = 0;
  averageOrderValue = 0;
  conversionRate = 0;
  pendingOrders = 0;
  lowStockProducts = 0;

  // Loading states
  isLoadingProducts = true;
  isLoadingOrders = true;
  currentTime = new Date().toLocaleTimeString();

  private destroy$ = new Subject<void>();
  private revenueChart: any;
  private orderStatusChart: any;

  constructor(
    private productService: ProductService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadAllOrders();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initCharts();
    }, 1000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }
    if (this.orderStatusChart) {
      this.orderStatusChart.destroy();
    }
  }

  loadProducts() {
    this.isLoadingProducts = true;
    this.productService.getAllProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products;
          this.totalProducts = products.length;
          this.lowStockProducts = products.filter(p => (p.stock || 0) < 10).length;
          this.isLoadingProducts = false;
          this.calculateStats();
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.isLoadingProducts = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load products',
            confirmButtonColor: '#0d6efd'
          });
        }
      });
  }

  loadAllOrders() {
    this.isLoadingOrders = true;
    this.orderService.getAllOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          this.allOrders = orders;
          this.recentOrders = orders
            .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
            .slice(0, 5);
          this.calculateOrderStats();
          this.isLoadingOrders = false;
          
          setTimeout(() => {
            this.updateChartsWithRealData();
          }, 500);
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.isLoadingOrders = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load orders data',
            confirmButtonColor: '#0d6efd'
          });
        }
      });
  }

  calculateOrderStats() {
    this.totalOrders = this.allOrders.length;
    this.totalRevenue = this.allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    this.averageOrderValue = this.totalOrders > 0 ? this.totalRevenue / this.totalOrders : 0;
    this.pendingOrders = this.allOrders.filter(order => 
      ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status)
    ).length;
    
    this.conversionRate = this.totalOrders > 0 ? Math.min(10, (this.totalOrders / 100) * 10) : 0;
  }

  calculateStats() {
    const uniqueCustomers = new Set(this.allOrders.map(order => order.userName));
    this.totalCustomers = uniqueCustomers.size;
  }

  initCharts() {
    this.initRevenueChart();
    this.initOrderStatusChart();
  }

  updateChartsWithRealData() {
    if (this.allOrders.length > 0) {
      this.updateRevenueChart();
      this.updateOrderStatusChart();
    }
  }

  initRevenueChart() {
    if (!this.revenueChartRef?.nativeElement) return;

    try {
      const ctx = this.revenueChartRef.nativeElement.getContext('2d');
      
      this.revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Revenue',
              data: [],
              borderColor: '#4361ee',
              backgroundColor: 'rgba(67, 97, 238, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Orders',
              data: [],
              borderColor: '#4cc9f0',
              backgroundColor: 'rgba(76, 201, 240, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    } catch (error) {
      console.error('Error initializing revenue chart:', error);
    }
  }

  updateRevenueChart() {
    if (!this.revenueChart || this.allOrders.length === 0) return;

    const monthlyData = this.getLast6MonthsData();
    
    this.revenueChart.data.labels = monthlyData.map(data => data.month);
    this.revenueChart.data.datasets[0].data = monthlyData.map(data => data.revenue);
    this.revenueChart.data.datasets[1].data = monthlyData.map(data => data.orders);
    this.revenueChart.update();
  }

  getLast6MonthsData() {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      
      const monthOrders = this.allOrders.filter(order => {
        if (!order.orderDate) return false;
        const orderDate = new Date(order.orderDate);
        return orderDate.getMonth() === date.getMonth() && 
               orderDate.getFullYear() === date.getFullYear();
      });
      
      const revenue = monthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const ordersCount = monthOrders.length;
      
      months.push({
        month: `${monthName} ${year}`,
        revenue: revenue,
        orders: ordersCount
      });
    }
    
    if (months.every(m => m.revenue === 0 && m.orders === 0)) {
      return [
        { month: 'Jan', revenue: 0, orders: 0 },
        { month: 'Feb', revenue: 0, orders: 0 },
        { month: 'Mar', revenue: 0, orders: 0 },
        { month: 'Apr', revenue: 0, orders: 0 },
        { month: 'May', revenue: 0, orders: 0 },
        { month: 'Jun', revenue: 0, orders: 0 }
      ];
    }
    
    return months;
  }

  initOrderStatusChart() {
    if (!this.orderStatusChartRef?.nativeElement) return;

    try {
      const ctx = this.orderStatusChartRef.nativeElement.getContext('2d');
      
      this.orderStatusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: [],
          datasets: [{
            data: [],
            backgroundColor: [
              '#4cc9f0',
              '#4361ee',
              '#f72585',
              '#7209b7',
              '#ff9e00'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    } catch (error) {
      console.error('Error initializing order status chart:', error);
    }
  }

  updateOrderStatusChart() {
    if (!this.orderStatusChart) return;

    const statusData: { [key: string]: number } = {
      'DELIVERED': this.allOrders.filter(o => o.status === 'DELIVERED').length,
      'PENDING': this.allOrders.filter(o => o.status === 'PENDING').length,
      'PROCESSING': this.allOrders.filter(o => o.status === 'PROCESSING').length,
      'SHIPPED': this.allOrders.filter(o => o.status === 'SHIPPED').length,
      'CANCELLED': this.allOrders.filter(o => o.status === 'CANCELLED').length
    };

    const labels = Object.keys(statusData).filter(key => statusData[key] > 0);
    const data = labels.map(label => statusData[label]);

    this.orderStatusChart.data.labels = labels;
    this.orderStatusChart.data.datasets[0].data = data;
    this.orderStatusChart.update();
  }

  editProduct(product: ProductResponseDTO) {
    if (product.id) {
      this.router.navigate(['/edit-product', product.id]);
    }
  }

  deleteProduct(productId: number) {
    Swal.fire({
      title: 'Delete Product?',
      text: 'This action cannot be undone. Are you sure you want to delete this product?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productService.deleteProduct(productId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadProducts();
              Swal.fire({
                title: 'Deleted!',
                text: 'Product has been deleted successfully.',
                icon: 'success',
                confirmButtonColor: '#0d6efd'
              });
            },
            error: (error) => {
              console.error('Error deleting product:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to delete product',
                confirmButtonColor: '#0d6efd'
              });
            }
          });
      }
    });
  }

  // Add this method to your component class
handleImageError(event: Event) {
  const imgElement = event.target as HTMLImageElement;
  
  // Set a placeholder image or hide the broken image
  imgElement.src = 'assets/images/placeholder.jpg';
  
  // Optional: Add error styling
  imgElement.classList.add('image-error');
  
  // Optional: Hide the image completely if you prefer
  // imgElement.style.display = 'none';
}

  exportReports() {
    Swal.fire({
      title: 'Exporting Reports...',
      text: 'Please wait while we generate your reports.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    setTimeout(() => {
      const csvContent = this.generateCSVReport();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `store-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      Swal.fire({
        title: 'Reports Downloaded!',
        text: 'Your reports have been generated successfully.',
        icon: 'success',
        confirmButtonColor: '#0d6efd'
      });
    }, 2000);
  }

  generateCSVReport(): string {
    const headers = ['Order ID', 'Customer', 'Date', 'Status', 'Amount', 'Items Count'];
    const rows = this.allOrders.map(order => [
      order.orderNumber || order.id?.toString() || 'N/A',
      order.userName || 'N/A',
      order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A',
      order.status || 'N/A',
      this.formatCurrency(order.totalAmount),
      (order.items?.length || 0).toString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'DELIVERED': return 'bg-success';
      case 'PENDING': return 'bg-warning';
      case 'PROCESSING': return 'bg-info';
      case 'SHIPPED': return 'bg-primary';
      case 'CANCELLED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  }

  refreshData() {
    this.loadProducts();
    this.loadAllOrders();
    this.currentTime = new Date().toLocaleTimeString();
    Swal.fire({
      title: 'Refreshing Data...',
      icon: 'info',
      timer: 1000,
      showConfirmButton: false
    });
  }

  viewOrderDetails(orderId: number) {
    this.router.navigate(['/orders', orderId]);
  }

  getProductImageUrl(product: ProductResponseDTO): string {
    if (product.imageUrls && product.imageUrls.length > 0) {
      return product.imageUrls[0];
    }
    return 'assets/images/placeholder.jpg';
  }

  getRevenueGrowth(): number {
    if (this.allOrders.length < 2) return 0;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const currentMonthRevenue = this.allOrders
      .filter(order => {
        if (!order.orderDate) return false;
        const orderDate = new Date(order.orderDate);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      })
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    const lastMonthRevenue = this.allOrders
      .filter(order => {
        if (!order.orderDate) return false;
        const orderDate = new Date(order.orderDate);
        return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear;
      })
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    if (lastMonthRevenue === 0) return 0;
    
    return ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
  }
}