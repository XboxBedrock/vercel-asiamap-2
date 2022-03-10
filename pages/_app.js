import '../styles/globals.css'
import React, {useEffect} from "react";
import { Provider } from 'next-auth/client'
import {ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';



function MyApp({ Component, pageProps }) {
    useEffect(() => {
        if(process.env.NEXT_PUBLIC_MATOMO_ENABLE) {
        }

    })
  return (

      <Provider session={pageProps.session}>
          <head>
              <link rel="icon" href="/logo.png" />
          </head>

          <ToastContainer />
        <Component {...pageProps} />
      </Provider>
  )
}

export default MyApp
