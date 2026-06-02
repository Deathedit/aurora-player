import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '@/theme/system';
import './index.css';
import App from './App';

const saved = localStorage.getItem('aurora-theme');
if (saved === '"spotify"') {
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.add('spotify');
} else {
  document.documentElement.classList.add('dark');
  document.documentElement.classList.remove('spotify');
}

if (localStorage.getItem('aurora-glass') === 'false') {
  document.documentElement.classList.add('no-glass');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <App />
    </ChakraProvider>
  </StrictMode>,
);
