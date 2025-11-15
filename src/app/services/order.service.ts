import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../env/environment';
import { Order, CheckoutRequest, PaymentRequest, PaymentResponse } from '../models/order';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // checkout(checkoutRequest: CheckoutRequest): Observable<Order> {
  //   let url = `${this.apiUrl}/orders/checkout?userName=${checkoutRequest.userName}&shippingAddressId=${checkoutRequest.shippingAddressId}&paymentMethod=${checkoutRequest.paymentMethod}`;
    
  //   if (checkoutRequest.billingAddressId) {
  //     url += `&billingAddressId=${checkoutRequest.billingAddressId}`;
  //   }
    
  //   if (checkoutRequest.couponCode) {
  //     url += `&couponCode=${checkoutRequest.couponCode}`;
  //   }

  //   return this.http.post<Order>(url, {});
  // }

  // In your order.service.ts
// In your order.service.ts
checkout(checkoutRequest: CheckoutRequest): Observable<Order> {
  const params = new HttpParams()
    .set('userName', checkoutRequest.userName)
    .set('shippingAddressId', checkoutRequest.shippingAddressId.toString())
    .set('billingAddressId', checkoutRequest.billingAddressId ? checkoutRequest.billingAddressId.toString() : '')
    .set('couponCode', checkoutRequest.couponCode || '')
    .set('paymentMethod', checkoutRequest.paymentMethod);

  return this.http.post<Order>(`${this.apiUrl}/orders/checkout`, {}, { params });
}

  applyCoupon(orderId: number, couponCode: string): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/orders/${orderId}/apply-coupon?couponCode=${couponCode}`, {});
  }

  removeCoupon(orderId: number): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/orders/${orderId}/remove-coupon`, {});
  }

  getUserOrders(userName: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders/user/${userName}`);
  }

  // In your order.service.ts
// getOrder(orderId: number): Observable<Order> {
//   return this.http.get<Order>(`${this.apiUrl}/${orderId}`);
// }

getOrder(orderId: number): Observable<Order> {
  return this.http.get<Order>(`${this.apiUrl}/orders/${orderId}`);
}

downloadInvoice(orderId: number): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/orders/${orderId}/invoice`, {
    responseType: 'blob'
  });
}

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${id}`);
  }

  // Add this method to your order.service.ts
updateOrderStatus(orderId: number, status: string): Observable<Order> {
  return this.http.put<Order>(`${this.apiUrl}/orders/${orderId}/status?status=${status}`, {});
}

  // New method to handle payment after order creation
  processPayment(paymentRequest: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/payments/initiate`, paymentRequest);
  }
}