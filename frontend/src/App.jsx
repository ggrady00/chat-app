import Navbar from "./components/Navbar"

import {Routes, Route} from "react-router-dom"
import HomePage from "./pages/HomePage"
import RegisterPage from "./pages/RegisterPage"
import LoginPage from "./pages/LoginPage"
import SettingsPage from "./pages/SettingsPage"
import ProfilePage from "./pages/ProfilePage"



const App = () => {
  return (
    <div>
      
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />}/>
        <Route path="/register"  element={<RegisterPage />}/>
        <Route path="/login"  element={<LoginPage />}/>
        <Route path="/settings"  element={<SettingsPage />}/>
        <Route path="/profile"  element={<ProfilePage />}/>
      </Routes>

    </div>
  )
}
export default App;