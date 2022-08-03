import '../styles/globals.css'
import React, {useEffect} from "react";
import { SessionProvider } from "next-auth/react"
import {ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import {useRouter} from "next/router";
import { useState } from 'react';
import ErrorBoundary from '../component/ErrorBoundary';


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
    <ErrorBoundary>
    <SafeHydrate>
      <SessionProvider session={pageProps.session}>
          <head>
              <link rel="icon" href="/logo.png"/>
          </head>

          <ToastContainer />
        <Component {...pageProps} />
      </SessionProvider>
      </SafeHydrate>
      </ErrorBoundary>
  )
}

export default MyApp
