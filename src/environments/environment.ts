// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyAjMw3LF3GwXGs0SONMJDLkiMhsWjhZFCo',
  authDomain: 'ionic-product-crud.firebaseapp.com',
  projectId: 'ionic-product-crud',
  storageBucket: 'ionic-product-crud.firebasestorage.app',
  messagingSenderId: '839663905025',
  appId: '1:839663905025:web:3b92346c75c1972e741300',
};

export const environment = {
  production: false,
  firebaseConfig: firebaseConfig,
};

export const firebaseApp = initializeApp(firebaseConfig);
