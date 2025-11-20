/**
 * Hero Component
 *
 * Purpose: Main banner/hero section with full-width image and call-to-action
 *
 * Features:
 * - Full-screen hero image with overlay
 * - Centered text content
 * - Call-to-action button
 * - Responsive design
 *
 * For Future AI Agents:
 * - Hero image sourced from vision_expert_agent
 * - Gradient overlay for text readability
 * - Adjust min-height for different screen sizes
 * - CTA button scrolls to menu section
 */

const Hero = () => {
  const heroImage = 'https://images.unsplash.com/photo-1643856557143-09189e523fd6'

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 animate-fade-in">
          The Plantation Cafe & Resto
        </h1>
        <p className="text-xl sm:text-2xl md:text-3xl text-white/90 mb-8 font-light animate-slide-up">
          Garden Concept Restaurant with Mountain Views
        </p>
        <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
          Experience fresh mountain air while enjoying delicious cuisine in our serene garden
          setting
        </p>
        <a
          href="#menu"
          className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          View Menu
        </a>
      </div>
    </section>
  )
}

export default Hero
