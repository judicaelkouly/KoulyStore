import './App.css'
import {BrowserRouter, Routes, Route, } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import Details from './components/Details'
import Payment from './components/Payment'
import Register from './components/Register'
import Login from './components/Login'

import AdminPage from './components/admin/AdminPage'
import AddProduct from './components/admin/products/AddProduct'
import AddCategory from './components/admin/categories/AddCategory'
import UpdateProduct from './components/admin/products/UpdateProduct'
import UserProfile from './components/UserProfile'
import UpdateCategory from './components/admin/categories/UpdateCategory'
import AdminRoute from './components/AdminRoute'

function App() {

  return (
          <BrowserRouter>
         <Routes>

          
          {/* Routes publics */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/details" element={<Details />} />
            <Route path="/checkout" element={<Payment />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<UserProfile />} />

             {/* Routes administratives */}

            <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminPage />} />
            <Route path="/admin/add-product" element={<AddProduct />} />
            <Route path="/admin/add-category" element={<AddCategory />} />
            <Route path="/admin/update-product/:id" element={<UpdateProduct />} />
            <Route path="/admin/update-category/:id" element={<UpdateCategory />} />


        </Route>
            
         </Routes>
      </BrowserRouter>
  )
}

export default App
