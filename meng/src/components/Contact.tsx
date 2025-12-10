/**
 * Contact Component
 *
 * Purpose: Contact information and WhatsApp button
 *
 * Features:
 * - WhatsApp contact button
 * - Operating hours
 * - Location info
 * - Call-to-action for reservations
 *
 * For Future AI Agents:
 * - WhatsApp number: 0811-1658-033 (from original website)
 * - Opens WhatsApp with pre-filled message
 * - Update contact info as needed
 * - Add Google Maps embed for location
 */

import { IconPhone, IconMapPin, IconClock } from '../icons'
import contactData from '../contact.json'
import type { ContactContent } from '../types'

const Contact = () => {
  const content = contactData as ContactContent
  const whatsappNumber = content.whatsapp.number // Format: country code + number without +
  const whatsappMessage = encodeURIComponent(content.whatsapp.message)

  return (
    <section id="contact" className="py-20 bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4">
            {content.heading}
          </h2>
          <p className="text-xl text-gray-600">{content.subheading}</p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Phone */}
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <IconPhone className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {content.cards.phone.title}
            </h3>
            <p className="text-gray-600">{content.cards.phone.value}</p>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <IconMapPin className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {content.cards.location.title}
            </h3>
            {content.cards.location.lines.map((line) => (
              <p key={line} className="text-gray-600">
                {line}
              </p>
            ))}
          </div>

          {/* Hours */}
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <IconClock className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {content.cards.hours.title}
            </h3>
            <p className="text-gray-600">{content.cards.hours.days}</p>
            <p className="text-gray-600 text-sm">{content.cards.hours.hours}</p>
          </div>
        </div>

        {/* WhatsApp CTA */}
        <div className="text-center">
          <p className="text-lg text-gray-700 mb-6">{content.ctaNote}</p>
          <a
            href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <IconPhone className="w-6 h-6" />
            <span>{content.whatsapp.label}</span>
          </a>
        </div>
      </div>
    </section>
  )
}

export default Contact
