/**
 * Footer Component
 *
 * Purpose: Website footer with copyright and additional links
 *
 * Features:
 * - Copyright information
 * - Social media links (optional)
 * - Simple and clean design
 *
 * For Future AI Agents:
 * - Keep footer simple and elegant
 * - Add social media icons if needed (Instagram, Facebook, etc.)
 * - Update year dynamically
 */

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-2xl font-display font-bold mb-4">The Plantation Cafe & Resto</h3>
          <p className="text-gray-400 mb-6">
            Garden Concept Restaurant • Mountain View • Swimming Pool
          </p>
          <div className="border-t border-gray-800 pt-6">
            <p className="text-gray-400 text-sm">
              &copy; {currentYear} The Plantation Cafe & Resto. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
