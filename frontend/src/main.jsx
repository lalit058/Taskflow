import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Dynamically use Render URL in production and localhost during development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Setup connection to the GraphQL server
const httpLink = createHttpLink({
  uri: `${API_URL}/graphql`,
});

const authLink = setContext((_, { headers }) => {
  // Pulls the token that is saved during login
  const token = sessionStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(), // This optimizes performance by caching data
});

ReactDOM.createRoot(getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
)