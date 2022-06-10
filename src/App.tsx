import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PenSDKSample from './penSdk';
import NDPSample from './NDP';

const App = () => {
  return (
      <div>
        <Routes>
          <Route path='/' element={<PenSDKSample />} />
          <Route path='/ndp' element={<NDPSample />} />
        </Routes>
      </div>
  );
};

export default App;
