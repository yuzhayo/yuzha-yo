/**
 * About Component
 *
 * Purpose: About Us section (Tentang Kami) describing the restaurant
 *
 * Features:
 * - Two-column layout (image + text)
 * - Responsive design
 * - Key features list
 * - Learn more button
 *
 * For Future AI Agents:
 * - Text content matches original website (Indonesian)
 * - Image from vision_expert_agent (mountain view restaurant)
 * - Grid layout: image left, text right on desktop
 * - Stacks vertically on mobile
 */

import { IconMapPin, IconMountain, IconWaves } from '../icons'

const About = () => {
  const aboutImage = 'https://images.unsplash.com/photo-1653192916062-9b29d31896b4'

  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1">
            <img
              src={aboutImage}
              alt="Plantation Cafe mountain view"
              className="rounded-2xl shadow-2xl w-full h-[400px] lg:h-[500px] object-cover"
            />
          </div>

          {/* Text Content */}
          <div className="order-1 lg:order-2">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6">
              Tentang Kami
            </h2>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              The Plantation Cafe & Resto adalah Tempat Makan dan Hang Out yang berkonsep Garden
              yang berada di dataran tinggi dengan pemandangan alam pegunungan dan View Kota
              Bandung.
            </p>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Tempat yang Sejuk dan nyaman untuk para Tamu yang ingin mencari udara segar sambil
              menikmati hidangan yang lezat dari kami.
            </p>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Kini The Plantation Cafe hadir dengan suasana baru yaitu adanya Swimming Pool dengan
              View Kota Bandung dan Cimahi.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <IconMountain className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Mountain View</h3>
                  <p className="text-gray-600">Breathtaking views of Bandung mountains</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <IconWaves className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Swimming Pool</h3>
                  <p className="text-gray-600">Relax by the pool with city views</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <IconMapPin className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Garden Concept</h3>
                  <p className="text-gray-600">Natural garden setting with fresh air</p>
                </div>
              </div>
            </div>

            <a
              href="#contact"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
