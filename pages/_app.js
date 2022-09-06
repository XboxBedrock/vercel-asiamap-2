import '../styles/globals.css'
import React, {useEffect} from "react";
import { SessionProvider } from "next-auth/react"
import {ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import {useRouter} from "next/router";
import { useState } from 'react';
import ErrorBoundary from '../component/ErrorBoundary';
import {Route, Routes} from "react-router-dom";
import {ColorSchemeProvider, MantineProvider} from "@mantine/core";
import {BrowserRouter} from "react-router-dom";

const isBrowser = typeof window !== "undefined";


function SafeHydrate({ children }) {
  return (
    <div suppressHydrationWarning>
      {typeof window === 'undefined' ? null : children}
    </div>
  )
}




function MyApp({ Component, pageProps }) {
  if (!isBrowser ) return null

  const [colorScheme, setColorScheme] = useState(window.localStorage.getItem("color-scheme") || "dark");
  const toggleColorScheme = (value) => {

      window.localStorage.setItem("color-scheme", value || (colorScheme === 'dark' ? 'light' : 'dark'));
      return setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  }

  const router = useRouter()
  console.log(router.query)
  return (
    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
      <MantineProvider theme={{colorScheme}} withGlobalStyles withNormalizeCSS>
        <BrowserRouter>
            <SafeHydrate>
          <SessionProvider session={pageProps.session}>
              <head>
                  <link rel="icon" href="/logo.png"/>
              </head>

              <ToastContainer />
            <Component {...pageProps} />
          </SessionProvider>
          </SafeHydrate>
        </BrowserRouter>
      </MantineProvider>
    </ColorSchemeProvider>

  )
}

export default MyApp
