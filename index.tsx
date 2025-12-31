
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App-simple.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

ReactDOM.render(<App />, rootElement);