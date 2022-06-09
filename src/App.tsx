import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PenSDKSample from './penSdk';

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element={<PenSDKSample />} />
      </Routes>
    </div>
  );
};

export default App;
