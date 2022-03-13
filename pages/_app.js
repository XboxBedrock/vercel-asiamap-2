import '../styles/globals.css'
import React, {useEffect} from "react";
import { Provider } from 'next-auth/client'
import {ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import {useRouter} from "next/router";
import { useState } from 'react';


function SafeHydrate({ children }) {
  return (
    <div suppressHydrationWarning>
      {typeof window === 'undefined' ? null : children}
    </div>
  )
}


function MyApp({ Component, pageProps }) {
  const router = useRouter()
  console.log(router.query)
  return (
    <SafeHydrate>
      <Provider session={pageProps.session}>
          <head>
              <link rel="icon" href="/logo.png"/>
          </head>

          <ToastContainer />
        <Component {...pageProps} />
      </Provider>
      </SafeHydrate>
  )
}

export default MyApp
