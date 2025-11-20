/**
 * App Component - Main Application Root
 *
 * Purpose: Root component that assembles all sections of the website
 *
 * Structure:
 * 1. Navbar (fixed at top)
 * 2. Hero section
 * 3. About section
 * 4. Menu section
 * 5. Gallery section
 * 6. Contact section
 * 7. Footer
 *
 * For Future AI Agents:
 * - This is a single-page application (SPA)
 * - Navigation uses anchor links and smooth scrolling
 * - All components are imported and rendered in order
 * - No routing library needed (single page)
 * - Add new sections by importing component and adding to JSX
 *
 * Maintenance:
 * - To add new sections: import component and place in appropriate order
 * - To modify layout: adjust component order or add wrapper divs
 * - To add routing: install react-router-dom and refactor
 */

import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Menu from './components/Menu'
import Gallery from './components/Gallery'
import Contact from './components/Contact'
import Footer from './components/Footer'

function App() {
  return (
    <div className="min-h-screen">
      {/* Fixed Navigation */}
      <Navbar />

      {/* Page Sections */}
      <main>
        <Hero />
        <About />
        <Menu />
        <Gallery />
        <Contact />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default App
