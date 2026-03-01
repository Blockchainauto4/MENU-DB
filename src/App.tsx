/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Menu from './components/Menu';
import Admin from './components/Admin';
import Login from './components/Login';
import Kitchen from './components/Kitchen';
import Reception from './components/Reception';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/kitchen" element={<Kitchen />} />
        <Route path="/reception" element={<Reception />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
