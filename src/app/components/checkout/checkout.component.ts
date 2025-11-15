import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { BagService } from '../../services/bag.service';
import { AuthService } from '../../services/auth.service';
import { AddressService } from '../../services/address.service';
import { PaymentService } from '../../services/payment.service';
import { CouponService } from '../../services/coupon.service';
import { Order, CheckoutRequest, Address, PaymentRequest, Coupon, CouponValidationResponse } from '../../models/order';
import { MyBag, MyBagItem } from '../../models/bag';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule]
})
export class CheckoutComponent implements OnInit {
  checkoutForm: FormGroup;
  bag: MyBag | null = null;
  addresses: Address[] = [];
  loading = false;
  processingOrder = false;
  selectedStep = 1;
  useSameAddress = true;
  couponCode = '';
  showAddAddressForm = false;
  newAddressForm: FormGroup;
  appliedCoupon: Coupon | null = null;
  couponDiscount = 0;
  validatingCoupon = false;

  // Payment methods
  paymentMethods = [
    { value: 'COD', name: 'Cash on Delivery', icon: '💵', description: 'Pay when you receive your order' },
    { value: 'CREDIT_CARD', name: 'Credit Card', icon: '💳', description: 'Pay securely with your credit card' },
    { value: 'DEBIT_CARD', name: 'Debit Card', icon: '💳', description: 'Pay securely with your debit card' },
    { value: 'PAYPAL', name: 'PayPal', icon: '🔵', description: 'Pay with your PayPal account' }
  ];

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private bagService: BagService,
    private authService: AuthService,
    private addressService: AddressService,
    private paymentService: PaymentService,
    private couponService: CouponService,
    private router: Router
  ) {
    this.checkoutForm = this.createCheckoutForm();
    this.newAddressForm = this.createNewAddressForm();
  }

  ngOnInit(): void {
    this.loadBag();
    this.loadAddresses();
  }

  createCheckoutForm(): FormGroup {
    return this.fb.group({
      shippingAddressId: ['', Validators.required],
      billingAddressId: [''],
      paymentMethod: ['COD', Validators.required],
      cardNumber: [''],
      expiryDate: [''],
      cvv: [''],
      cardholderName: [''],
      paypalEmail: [''],
      agreeToTerms: [false, Validators.requiredTrue]
    });
  }

  createNewAddressForm(): FormGroup {
    return this.fb.group({
      recipientName: ['', Validators.required],
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['', Validators.required],
      postalCode: ['', Validators.required],
      phone: ['', Validators.required],
      type: ['SHIPPING', Validators.required]
    });
  }

  // Fix the total calculation - based on your backend
  get subtotal(): number {
    return this.bag?.totalPrice || 0;
  }

  get shippingCost(): number {
    // Free shipping over $100, otherwise $30
    const subtotal = this.subtotal - this.couponDiscount;
    return subtotal >= 100 ? 0 : 30;
  }

  get gstAmount(): number {
    // GST 5% on discounted subtotal
    const discountedSubtotal = this.subtotal - this.couponDiscount;
    return discountedSubtotal * 0.05;
  }

  get pstAmount(): number {
    // PST 7% on discounted subtotal
    const discountedSubtotal = this.subtotal - this.couponDiscount;
    return discountedSubtotal * 0.07;
  }

  get totalTax(): number {
    return this.gstAmount + this.pstAmount;
  }

  get estimatedTotal(): number {
    const discountedSubtotal = Math.max(0, this.subtotal - this.couponDiscount);
    return discountedSubtotal + this.shippingCost + this.gstAmount + this.pstAmount;
  }

  // Payment method helper
  getPaymentMethodName(method: string): string {
    if (!method) return 'Not selected';
    const payment = this.paymentMethods.find(p => p.value === method);
    return payment ? payment.name : method;
  }

  // Getter for selected payment method
  get selectedPaymentMethod(): string {
    const method = this.checkoutForm.get('paymentMethod')?.value;
    return this.getPaymentMethodName(method);
  }

  // Getter for COD check
  get isCODPayment(): boolean {
    return this.checkoutForm.get('paymentMethod')?.value === 'COD';
  }

  // Getter for PayPal check
  get isPayPalPayment(): boolean {
    return this.checkoutForm.get('paymentMethod')?.value === 'PAYPAL';
  }

  // Getter for card payment check
  get isCardPayment(): boolean {
    const method = this.checkoutForm.get('paymentMethod')?.value;
    return method === 'CREDIT_CARD' || method === 'DEBIT_CARD';
  }

  loadBag(): void {
    this.loading = true;
    const userName = this.getCurrentUserName();
    
    if (!userName) {
      this.router.navigate(['/login']);
      return;
    }

    this.bagService.getBagByUserName(userName).subscribe({
      next: (bag) => {
        this.bag = bag;
        this.loading = false;
        
        if (!bag.items || bag.items.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Empty Bag',
            text: 'Your shopping bag is empty. Add items before checkout.',
            confirmButtonColor: '#000'
          }).then(() => {
            this.router.navigate(['/products']);
          });
        }
      },
      error: (error) => {
        console.error('Error loading bag:', error);
        this.loading = false;
        this.showError('Failed to load bag', 'Please try again later.');
      }
    });
  }

  loadAddresses(): void {
    const userName = this.getCurrentUserName();
    if (!userName) return;

    this.addressService.getUserAddresses(userName).subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        
        const defaultAddress = addresses[0];
        if (defaultAddress) {
          this.checkoutForm.patchValue({
            shippingAddressId: defaultAddress.id
          });
          
          if (this.useSameAddress) {
            this.checkoutForm.patchValue({
              billingAddressId: defaultAddress.id
            });
          }
        }
      },
      error: (error) => {
        console.error('Error loading addresses:', error);
        if (error.status !== 404) {
          this.showError('Failed to load addresses', 'Please try again later.');
        }
      }
    });
  }

  getCurrentUserName(): string | null {
    const user = this.authService.getUser();
    return user?.userName || user?.username || null;
  }

  // Step navigation
  nextStep(): void {
    if (this.selectedStep < 3) {
      this.selectedStep++;
    }
  }

  prevStep(): void {
    if (this.selectedStep > 1) {
      this.selectedStep--;
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= 3) {
      this.selectedStep = step;
    }
  }

  // Address handling
  onUseSameAddressChange(): void {
    if (this.useSameAddress) {
      this.checkoutForm.patchValue({
        billingAddressId: this.checkoutForm.get('shippingAddressId')?.value
      });
    }
  }

  onShippingAddressChange(): void {
    if (this.useSameAddress) {
      this.checkoutForm.patchValue({
        billingAddressId: this.checkoutForm.get('shippingAddressId')?.value
      });
    }
  }

  // Add new address
  addNewAddress(): void {
    if (this.newAddressForm.invalid) {
      this.markFormGroupTouched(this.newAddressForm);
      return;
    }

    const addressData = {
      ...this.newAddressForm.value,
      userName: this.getCurrentUserName()
    };

    this.addressService.createAddress(addressData).subscribe({
      next: (newAddress) => {
        this.addresses.push(newAddress);
        this.checkoutForm.patchValue({
          shippingAddressId: newAddress.id
        });
        this.showAddAddressForm = false;
        this.newAddressForm.reset({ type: 'SHIPPING' });
        Swal.fire({
          icon: 'success',
          title: 'Address Added',
          text: 'New address has been added successfully.',
          confirmButtonColor: '#000'
        });
      },
      error: (error) => {
        console.error('Error adding address:', error);
        this.showError('Failed to add address', 'Please try again.');
      }
    });
  }

  // Update item quantity using your API
  updateQuantity(item: MyBagItem, change: number): void {
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) {
      this.removeItem(item.id);
      return;
    }

    this.bagService.updateItemQuantity(item.id, newQuantity).subscribe({
      next: (updatedItem) => {
        this.loadBag();
        Swal.fire({
          icon: 'success',
          title: 'Quantity Updated',
          text: `Quantity updated to ${newQuantity}`,
          confirmButtonColor: '#000',
          timer: 1000
        });
      },
      error: (error) => {
        console.error('Error updating quantity:', error);
        this.showError('Failed to update quantity', 'Please try again.');
      }
    });
  }

  removeItem(itemId: number): void {
    this.bagService.removeItemFromBag(itemId).subscribe({
      next: () => {
        this.loadBag();
        Swal.fire({
          icon: 'success',
          title: 'Item Removed',
          text: 'Item has been removed from your bag',
          confirmButtonColor: '#000',
          timer: 1500
        });
      },
      error: (error) => {
        console.error('Error removing item:', error);
        this.showError('Failed to remove item', 'Please try again.');
      }
    });
  }

  // Coupon handling
  applyCoupon(): void {
    if (!this.couponCode.trim()) {
      this.showError('Invalid Coupon', 'Please enter a coupon code.');
      return;
    }

    if (!this.bag?.totalPrice) {
      this.showError('Cannot Apply Coupon', 'Your bag is empty.');
      return;
    }

    this.validatingCoupon = true;

    this.couponService.validateCoupon(this.couponCode, this.bag.totalPrice).subscribe({
      next: (response) => {
        this.validatingCoupon = false;
        
        if (response.valid && response.coupon) {
          this.appliedCoupon = response.coupon;
          this.couponDiscount = response.discountAmount;
          
          Swal.fire({
            icon: 'success',
            title: 'Coupon Applied!',
            html: `
              <div class="text-start">
                <p><strong>Coupon:</strong> ${response.coupon.code}</p>
                <p><strong>Discount:</strong> $${response.discountAmount.toFixed(2)}</p>
                ${response.coupon.discountPercentage ? 
                  `<p><strong>Discount:</strong> ${response.coupon.discountPercentage}% off</p>` : ''}
                <p class="text-muted">${response.message}</p>
              </div>
            `,
            confirmButtonColor: '#000'
          });
        } else {
          this.appliedCoupon = null;
          this.couponDiscount = 0;
          this.showError('Invalid Coupon', response.message || 'This coupon cannot be applied to your order.');
        }
      },
      error: (error) => {
        this.validatingCoupon = false;
        console.error('Coupon validation error:', error);
        this.showError('Coupon Error', 'Failed to validate coupon. Please try again.');
      }
    });
  }

  removeCoupon(): void {
    this.appliedCoupon = null;
    this.couponDiscount = 0;
    this.couponCode = '';
    Swal.fire({
      icon: 'info',
      title: 'Coupon Removed',
      text: 'Coupon has been removed from your order.',
      confirmButtonColor: '#000'
    });
  }

  // Checkout - FIXED VERSION
  async placeOrder(): Promise<void> {
    if (this.checkoutForm.invalid) {
      this.markFormGroupTouched(this.checkoutForm);
      this.showError('Form Incomplete', 'Please fill all required fields.');
      return;
    }

    if (!this.bag || this.bag.items.length === 0) {
      this.showError('Empty Bag', 'Your shopping bag is empty.');
      return;
    }

    this.processingOrder = true;

    try {
      const formValue = this.checkoutForm.value;
      const checkoutRequest: CheckoutRequest = {
        userName: this.getCurrentUserName()!,
        shippingAddressId: formValue.shippingAddressId,
        billingAddressId: this.useSameAddress ? undefined : formValue.billingAddressId,
        couponCode: this.appliedCoupon?.code || undefined,
        paymentMethod: formValue.paymentMethod
      };

      console.log('Sending checkout request:', checkoutRequest);

      // Create order
      const order = await this.orderService.checkout(checkoutRequest).toPromise();
      
      if (order) {
        console.log('Order created successfully:', order);
        
        // Show success immediately - no need for separate payment confirmation
        this.processingOrder = false;
        this.showOrderSuccess(order);
        
        // Clear the bag after successful order
        this.clearBag();
      }

    } catch (error: any) {
      this.processingOrder = false;
      console.error('Checkout error:', error);
      this.showError('Checkout Failed', error.error?.message || 'Please try again later.');
    }
  }

  // Clear bag after successful order
 private clearBag(): void {
  if (this.bag && this.bag.id) {
    this.bagService.clearBag(this.bag.id).subscribe({
      next: () => {
        console.log('Bag cleared after successful order');
        this.bag = null; // Clear the local bag reference
      },
      error: (error) => {
        console.error('Error clearing bag:', error);
      }
    });
  } else {
    console.warn('No bag found to clear');
  }
}

  // Success handler - FIXED: No payment parameter
  private showOrderSuccess(order: Order): void {
    Swal.fire({
      title: '🎉 Order Placed Successfully!',
      html: `
        <div class="text-start">
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
          <p><strong>Payment Method:</strong> ${this.getPaymentMethodName(order.paymentMethod)}</p>
          <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
          ${this.appliedCoupon ? `<p><strong>Coupon Applied:</strong> ${this.appliedCoupon.code} ($${this.couponDiscount.toFixed(2)} off)</p>` : ''}
          <p class="mt-3">You will receive an email confirmation shortly.</p>
        </div>
      `,
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: 'View Order Details',
      cancelButtonText: 'Continue Shopping',
      confirmButtonColor: '#000',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/orders', order.id]);
      } else {
        this.router.navigate(['/products']);
      }
    });
  }

  // Helper methods
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private showError(title: string, text: string): void {
    Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonColor: '#000'
    });
  }

  getSelectedShippingAddress(): Address | undefined {
    const addressId = this.checkoutForm.get('shippingAddressId')?.value;
    return this.addresses.find(addr => addr.id === addressId);
  }

  getSelectedBillingAddress(): Address | undefined {
    const addressId = this.checkoutForm.get('billingAddressId')?.value;
    return this.addresses.find(addr => addr.id === addressId);
  }

  // Getters for template validation
  get isStep1Valid(): boolean {
    return this.checkoutForm.get('shippingAddressId')?.valid || false;
  }

  get isStep2Valid(): boolean {
    const paymentMethod = this.checkoutForm.get('paymentMethod')?.value;
    const isPaymentMethodValid = this.checkoutForm.get('paymentMethod')?.valid ?? false;
    
    if (paymentMethod === 'COD') {
      return isPaymentMethodValid;
    }
    
    if (paymentMethod === 'PAYPAL') {
      return isPaymentMethodValid && !!this.checkoutForm.get('paypalEmail')?.value;
    }
    
    // For card payments
    return isPaymentMethodValid && 
           !!this.checkoutForm.get('cardNumber')?.value &&
           !!this.checkoutForm.get('expiryDate')?.value &&
           !!this.checkoutForm.get('cvv')?.value &&
           !!this.checkoutForm.get('cardholderName')?.value;
  }

  get isStep3Valid(): boolean {
    return this.checkoutForm.get('agreeToTerms')?.value || false;
  }

  get couponSavingsText(): string {
    if (!this.appliedCoupon) return '';
    
    if (this.appliedCoupon.discountPercentage) {
      return `${this.appliedCoupon.discountPercentage}% off`;
    } else {
      return `$${this.couponDiscount.toFixed(2)} off`;
    }
  }
}