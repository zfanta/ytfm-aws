import 'regenerator-runtime/runtime'

import React from 'react'
import ReactDOM from 'react-dom'
import { RecoilRoot } from 'recoil'
import App from './App'
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyCyaZYnSXYFRLWWGiDRKqpJR4GcbUV7UFg',
  authDomain: 'ytfm-303308.firebaseapp.com',
  projectId: 'ytfm-303308',
  storageBucket: 'ytfm-303308.appspot.com',
  messagingSenderId: '969455847018',
  appId: '1:969455847018:web:493fe62c092ed6c097ec13',
  measurementId: 'G-CNRG0JFSGV'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
getAnalytics(app)

ReactDOM.render((
  <RecoilRoot>
    <App />
  </RecoilRoot>
), document.getElementById('app'))
