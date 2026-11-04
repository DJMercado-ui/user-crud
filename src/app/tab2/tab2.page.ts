import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';

import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  Unsubscribe,
} from 'firebase/firestore';

import { ToastController, AlertController } from '@ionic/angular';

import { db } from '../firebase';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnDestroy {
  // ==============================
  // PRODUCTS
  // ==============================

  products: Product[] = [];
  filteredProducts: Product[] = [];

  // ==============================
  // SEARCH & FILTER
  // ==============================

  searchTerm: string = '';
  selectedCategory: string = 'ALL';
  categories: string[] = [];

  // ==============================
  // LOADING
  // ==============================

  isLoading: boolean = false;

  // Firestore listener
  private unsubscribeProducts: Unsubscribe | null = null;

  // ==============================
  // SWIPE
  // ==============================

  swipedProductId: string | null = null;

  swipeStartX: number = 0;
  swipeCurrentX: number = 0;

  // Prevent accidental button click after swipe
  private didSwipe: boolean = false;

  // ==============================
  // EDIT MODAL
  // ==============================

  isEditModalOpen: boolean = false;

  editingProduct: Product = {
    id: '',
    name: '',
    category: '',
    price: 0,
    quantity: 1,
  };

  // ==============================
  // CONSTRUCTOR
  // ==============================

  constructor(
    private changeDetector: ChangeDetectorRef,
    private toastController: ToastController,
    private alertController: AlertController,
  ) {}

  // ==============================
  // INITIALIZE
  // ==============================

  ngOnInit() {
    console.log('TAB 2 INITIALIZED');

    this.loadProducts();
  }

  // ==============================
  // LOAD PRODUCTS
  // ==============================

  loadProducts() {
    console.log('LOADING PRODUCTS FROM FIRESTORE...');

    this.isLoading = true;
    this.changeDetector.detectChanges();

    /*
     * IMPORTANT:
     *
     * Remove the previous listener before creating
     * a new one.
     *
     * This prevents multiple onSnapshot listeners
     * from being created and helps avoid duplicate
     * product rendering.
     */

    if (this.unsubscribeProducts) {
      console.log('REMOVING PREVIOUS FIRESTORE LISTENER');

      this.unsubscribeProducts();

      this.unsubscribeProducts = null;
    }

    const productsCollection = collection(db, 'products');

    this.unsubscribeProducts = onSnapshot(
      productsCollection,

      (snapshot) => {
        console.log('FIRESTORE PRODUCT DOCUMENTS:', snapshot.size);

        // ==============================
        // CONVERT FIRESTORE DOCUMENTS
        // ==============================

        const loadedProducts: Product[] = snapshot.docs.map((document) => {
          const data = document.data();

          return {
            id: document.id,

            name: String(data['name'] || '').trim(),

            category: String(data['category'] || '').trim(),

            price: Number(data['price'] || 0),

            quantity: Number(data['quantity'] || 0),
          };
        });

        /*
         * Extra protection against duplicate
         * document IDs.
         *
         * Firestore normally cannot return the same
         * document twice, but this guarantees that
         * the displayed array contains each ID once.
         */

        const uniqueProducts = new Map<string, Product>();

        loadedProducts.forEach((product) => {
          uniqueProducts.set(product.id, product);
        });

        this.products = Array.from(uniqueProducts.values());

        console.log('PRODUCTS LOADED:', this.products);

        console.log('TOTAL UNIQUE PRODUCTS:', this.products.length);

        // ==============================
        // CREATE CATEGORY LIST
        // ==============================

        this.categories = [
          ...new Set(
            this.products
              .map((product) => product.category)
              .filter((category) => category.trim() !== ''),
          ),
        ].sort();

        console.log('CATEGORIES:', this.categories);

        // ==============================
        // CHECK SELECTED CATEGORY
        // ==============================

        if (
          this.selectedCategory !== 'ALL' &&
          !this.categories.includes(this.selectedCategory)
        ) {
          this.selectedCategory = 'ALL';
        }

        // ==============================
        // APPLY SEARCH & CATEGORY FILTER
        // ==============================

        this.applyFilters();

        // ==============================
        // FINISH LOADING
        // ==============================

        this.isLoading = false;

        this.changeDetector.detectChanges();
      },

      // ==============================
      // FIRESTORE ERROR
      // ==============================

      async (error) => {
        console.error('FIRESTORE READ ERROR:', error);

        this.isLoading = false;

        this.changeDetector.detectChanges();

        await this.showToast('Failed to load products.', 'danger');
      },
    );
  }

  // ==============================
  // SEARCH PRODUCTS
  // ==============================

  searchProducts(event: any) {
    this.searchTerm = (event?.detail?.value || '')
      .toString()
      .toLowerCase()
      .trim();

    console.log('SEARCH:', this.searchTerm);

    this.applyFilters();
  }

  // ==============================
  // CATEGORY FILTER
  // ==============================

  filterByCategory(event: any) {
    this.selectedCategory = event?.detail?.value || 'ALL';

    console.log('SELECTED CATEGORY:', this.selectedCategory);

    this.applyFilters();
  }

  // ==============================
  // CATEGORY BUTTON FILTER
  // ==============================

  filterByCategoryValue(category: string) {
    this.selectedCategory = category;

    console.log('SELECTED CATEGORY:', category);

    this.applyFilters();
  }

  // ==============================
  // APPLY FILTERS
  // ==============================

  applyFilters() {
    const search = this.searchTerm.toLowerCase().trim();

    this.filteredProducts = this.products.filter((product) => {
      // ==============================
      // SEARCH
      // ==============================

      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search) ||
        product.price.toString().includes(search) ||
        product.quantity.toString().includes(search);

      // ==============================
      // CATEGORY
      // ==============================

      const matchesCategory =
        this.selectedCategory === 'ALL' ||
        product.category === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });

    console.log('FILTERED PRODUCTS:', this.filteredProducts);

    this.changeDetector.detectChanges();
  }

  // ==============================
  // CLEAR FILTERS
  // ==============================

  clearFilters() {
    this.searchTerm = '';

    this.selectedCategory = 'ALL';

    this.swipedProductId = null;

    this.applyFilters();

    console.log('FILTERS CLEARED');
  }

  // ==============================
  // START SWIPE
  // ==============================

  startSwipe(event: PointerEvent, product: Product) {
    this.swipeStartX = event.clientX;

    this.swipeCurrentX = event.clientX;

    this.didSwipe = false;

    console.log('SWIPE START:', product.id);
  }

  // ==============================
  // MOVE SWIPE
  // ==============================

  moveSwipe(event: PointerEvent, product: Product) {
    this.swipeCurrentX = event.clientX;

    const distance = Math.abs(this.swipeStartX - this.swipeCurrentX);

    /*
     * Once the finger/mouse moves enough,
     * consider it a swipe.
     */

    if (distance > 10) {
      this.didSwipe = true;
    }
  }

  // ==============================
  // END SWIPE
  // ==============================

  endSwipe(event: PointerEvent, product: Product) {
    const swipeDistance = this.swipeStartX - this.swipeCurrentX;

    console.log('SWIPE DISTANCE:', swipeDistance);

    // ==============================
    // SWIPE LEFT
    // ==============================

    if (swipeDistance > 80) {
      this.swipedProductId = product.id;

      console.log('DELETE ACTION REVEALED:', product.id);
    }

    // ==============================
    // SWIPE RIGHT
    // ==============================
    else if (swipeDistance < -40) {
      this.swipedProductId = null;

      console.log('SWIPE ACTION CLOSED');
    } else {

    /*
     * Small movement = normal click
     */
      this.swipeCurrentX = this.swipeStartX;
    }
  }

  // ==============================
  // CLOSE SWIPE
  // ==============================

  closeSwipe() {
    this.swipedProductId = null;

    this.didSwipe = false;

    this.changeDetector.detectChanges();
  }

  // ==============================
  // OPEN EDIT MODAL
  // ==============================

  openEditModal(product: Product) {
    /*
     * Close swipe action first.
     */

    this.closeSwipe();

    /*
     * Copy product data.
     *
     * This prevents the original product
     * object from being modified before
     * the user presses Update.
     */

    this.editingProduct = {
      id: product.id,

      name: product.name,

      category: product.category,

      price: product.price,

      quantity: product.quantity,
    };

    console.log('EDITING PRODUCT:', this.editingProduct);

    this.isEditModalOpen = true;

    this.changeDetector.detectChanges();
  }

  // ==============================
  // CLOSE EDIT MODAL
  // ==============================

  closeEditModal() {
    if (this.isLoading) {
      return;
    }

    this.isEditModalOpen = false;

    this.changeDetector.detectChanges();
  }

  // ==============================
  // SAVE PRODUCT
  // ==============================

  async saveProduct() {
    const name = this.editingProduct.name.trim();

    const category = this.editingProduct.category.trim();

    const price = Number(this.editingProduct.price);

    const quantity = Number(this.editingProduct.quantity);

    // ==============================
    // VALIDATION
    // ==============================

    if (!name) {
      await this.showToast('Please enter a product name.', 'warning');

      return;
    }

    if (!category) {
      await this.showToast('Please enter a category.', 'warning');

      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      await this.showToast('Please enter a valid price.', 'warning');

      return;
    }

    if (
      !Number.isFinite(quantity) ||
      quantity < 0 ||
      !Number.isInteger(quantity)
    ) {
      await this.showToast('Quantity must be a whole number.', 'warning');

      return;
    }

    // ==============================
    // UPDATE FIRESTORE
    // ==============================

    try {
      this.isLoading = true;

      this.changeDetector.detectChanges();

      const productDocument = doc(db, 'products', this.editingProduct.id);

      await updateDoc(productDocument, {
        name: name,
        category: category,
        price: price,
        quantity: quantity,
      });

      console.log('PRODUCT UPDATED:', this.editingProduct.id);

      this.isLoading = false;

      this.changeDetector.detectChanges();

      this.closeEditModal();

      await this.showToast('Product updated successfully!', 'success');
    } catch (error) {
      console.error('UPDATE ERROR:', error);

      this.isLoading = false;

      this.changeDetector.detectChanges();

      await this.showToast('Failed to update product.', 'danger');
    }
  }

  // ==============================
  // DELETE PRODUCT
  // ==============================

  async deleteProduct(product: Product) {
    this.closeSwipe();

    const alert = await this.alertController.create({
      header: 'Delete Product',

      message: `Are you sure you want to delete "${product.name}"?`,

      buttons: [
        // ============================
        // CANCEL
        // ============================

        {
          text: 'Cancel',

          role: 'cancel',
        },

        // ============================
        // DELETE
        // ============================

        {
          text: 'Delete',

          role: 'destructive',

          handler: async () => {
            try {
              this.isLoading = true;

              this.changeDetector.detectChanges();

              const productDocument = doc(db, 'products', product.id);

              await deleteDoc(productDocument);

              console.log('PRODUCT DELETED:', product.id);

              this.isLoading = false;

              this.changeDetector.detectChanges();

              await this.showToast('Product deleted successfully!', 'success');
            } catch (error) {
              console.error('DELETE ERROR:', error);

              this.isLoading = false;

              this.changeDetector.detectChanges();

              await this.showToast('Failed to delete product.', 'danger');
            }
          },
        },
      ],
    });

    await alert.present();
  }

  // ==============================
  // TOAST
  // ==============================

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,

      duration: 2500,

      position: 'bottom',

      color: color,

      buttons: [
        {
          text: 'OK',
          role: 'cancel',
        },
      ],
    });

    await toast.present();
  }

  // ==============================
  // PULL TO REFRESH
  // ==============================

  async refreshProducts(event: any) {
    console.log('REFRESHING PRODUCTS...');

    /*
     * Firestore onSnapshot already updates
     * the products automatically.
     *
     * Therefore we do NOT call loadProducts()
     * here. Calling it would create another
     * listener.
     */

    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  // ==============================
  // DESTROY COMPONENT
  // ==============================

  ngOnDestroy() {
    console.log('TAB 2 DESTROYED');

    /*
     * IMPORTANT:
     *
     * Stop the Firestore listener when the
     * component is destroyed.
     */

    if (this.unsubscribeProducts) {
      this.unsubscribeProducts();

      this.unsubscribeProducts = null;

      console.log('FIRESTORE LISTENER REMOVED');
    }
  }
}
