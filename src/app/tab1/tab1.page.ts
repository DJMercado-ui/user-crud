import { ChangeDetectorRef, Component } from '@angular/core';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {
  newProduct = {
    name: '',
    category: '',
    price: 0,
    quantity: 1,
  };

  // Loading state
  isLoading = false;

  // Notification
  showMessage = false;
  messageText = '';
  messageType: 'success' | 'error' | 'warning' = 'success';

  constructor(private changeDetector: ChangeDetectorRef) {}

  async addProduct() {
    console.log('ADD PRODUCT CLICKED');

    const name = this.newProduct.name.trim();
    const category = this.newProduct.category.trim();

    const price = Number(this.newProduct.price);
    const quantity = Number(this.newProduct.quantity);

    // =========================================
    // VALIDATION
    // =========================================

    if (!name) {
      this.displayMessage('Please enter a product name.', 'warning');
      return;
    }

    if (!category) {
      this.displayMessage('Please select a category.', 'warning');
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      this.displayMessage('Please enter a valid price.', 'warning');
      return;
    }

    if (
      !Number.isFinite(quantity) ||
      quantity < 0 ||
      !Number.isInteger(quantity)
    ) {
      this.displayMessage('Quantity must be a whole number.', 'warning');
      return;
    }

    // =========================================
    // SHOW LOADING
    // =========================================

    this.isLoading = true;

    this.changeDetector.detectChanges();

    console.log('LOADING SHOWN');

    try {
      // =======================================
      // ADD TO FIRESTORE
      // =======================================

      const productsCollection = collection(db, 'products');

      const productDocument = await addDoc(productsCollection, {
        name: name,
        category: category,
        price: price,
        quantity: quantity,
      });

      console.log('PRODUCT ADDED:', productDocument.id);

      // =======================================
      // HIDE LOADING
      // =======================================

      this.isLoading = false;

      this.changeDetector.detectChanges();

      // =======================================
      // RESET FORM
      // =======================================

      this.resetForm();

      // =======================================
      // SHOW SUCCESS MESSAGE
      // =======================================

      this.displayMessage('Product added successfully!', 'success');
    } catch (error) {
      console.error('FIRESTORE ERROR:', error);

      // Hide loading

      this.isLoading = false;

      this.changeDetector.detectChanges();

      // Show error

      this.displayMessage('Failed to add product. Please try again.', 'error');
    }
  }

  // =========================================
  // RESET FORM
  // =========================================

  resetForm() {
    this.newProduct = {
      name: '',
      category: '',
      price: 0,
      quantity: 1,
    };

    this.changeDetector.detectChanges();

    console.log('FORM RESET');
  }

  // =========================================
  // SHOW MESSAGE
  // =========================================

  displayMessage(message: string, type: 'success' | 'error' | 'warning') {
    this.messageText = message;

    this.messageType = type;

    this.showMessage = true;

    this.changeDetector.detectChanges();

    // Automatically hide after 3 seconds

    setTimeout(() => {
      this.showMessage = false;

      this.changeDetector.detectChanges();
    }, 3000);
  }

  // =========================================
  // CLOSE MESSAGE
  // =========================================

  closeMessage() {
    this.showMessage = false;

    this.changeDetector.detectChanges();
  }
}
